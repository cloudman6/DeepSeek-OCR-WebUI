#!/usr/bin/env python3
"""
DeepSeek-OCR Web Service - Unified Multi-Platform
Auto-detect platform and use appropriate backend:
- Apple Silicon (M1/M2/M3) -> MLX
- NVIDIA GPU -> CUDA/transformers
"""
import os
import re
import tempfile
import shutil
import io
import base64
import platform
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps
import uvicorn
import fitz

# Global backend
backend = None
backend_type = None

def detect_platform() -> str:
    """Detect platform and return backend type"""
    import os
    system = platform.system()
    machine = platform.machine()
    
    # Force backend via env var
    force_backend = os.environ.get("FORCE_BACKEND", "").lower()
    if force_backend in ["mps", "cuda", "cpu"]:
        print(f"🔧 Forced backend: {force_backend.upper()}")
        return force_backend
    
    # Check Apple Silicon (MPS support)
    if system == "Darwin" and machine == "arm64":
        try:
            import torch
            if torch.backends.mps.is_available():
                print("✅ Detected Apple Silicon with MPS support")
                return "mps"
        except ImportError:
            pass
        print("⚠️ Apple Silicon detected but MPS not available")
    
    # Check NVIDIA GPU
    try:
        import torch
        if torch.cuda.is_available():
            print(f"✅ Detected NVIDIA GPU: {torch.cuda.get_device_name(0)}")
            return "cuda"
    except ImportError:
        pass
    
    # Fallback to CPU
    print("⚠️ No GPU detected, using CPU mode")
    return "cpu"

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model based on platform"""
    global backend, backend_type
    
    print("="*50)
    print("🚀 DeepSeek-OCR Unified Service Starting...")
    print("="*50)
    
    # Check for local model path
    local_model_path = os.environ.get("LOCAL_MODEL_PATH", "")
    model_path = local_model_path if local_model_path else "deepseek-ai/DeepSeek-OCR"
    
    if local_model_path:
        print(f"📁 Using local model: {local_model_path}")
    
    backend_type = detect_platform()
    
    if backend_type == "mps":
        # Apple Silicon with MPS
        from backends.mps_backend import MPSBackend
        backend = MPSBackend(model_path=model_path)
        backend.load_model()
    elif backend_type == "cuda":
        from backends.cuda_backend import CUDABackend
        backend = CUDABackend(model_path=model_path)
        # Try HuggingFace first, fallback to ModelScope
        try:
            backend.load_model(source="huggingface", timeout=300)
        except:
            print("🔄 Switching to ModelScope...")
            backend.load_model(source="modelscope")
    elif backend_type == "cpu":
        from backends.cpu_backend import CPUBackend
        backend = CPUBackend(model_path=model_path)
        backend.load_model()
    else:
        raise RuntimeError("No supported backend available")
    
    print(f"✅ Backend loaded: {backend_type.upper()}")
    print("="*50)
    
    yield
    
    print("🛑 Service shutting down...")

app = FastAPI(
    title="DeepSeek-OCR Unified API",
    description="Multi-platform OCR service (MLX/CUDA)",
    version="4.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    swagger_ui_parameters={"syntaxHighlight": False}
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define frontend path
BASE_DIR = Path(__file__).parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
# Mount all top-level directories in dist to root (assets, cmaps, etc.)
if FRONTEND_DIST.exists():
    for item in FRONTEND_DIST.iterdir():
        if item.is_dir():
            app.mount(f"/{item.name}", StaticFiles(directory=str(item)), name=item.name)
        elif item.name != "index.html" and not item.name.startswith('.'):
            # Also catch top-level files like scan2doc.svg
            @app.get(f"/{item.name}")
            async def serve_file(name=item.name):
                return FileResponse(FRONTEND_DIST / name)

def build_prompt(mode: str, custom_prompt: str = "", find_term: str = "") -> str:
    """Build prompt based on mode"""
    templates = {
        "document": "<image>\n<|grounding|>Convert the document to markdown.",
        "ocr": "<image>\n<|grounding|>OCR this image.",
        "free": "<image>\nFree OCR. Only output the raw text.",
        "figure": "<image>\nParse the figure.",
        "describe": "<image>\nDescribe this image in detail.",
        "find": "<image>\n<|grounding|>Locate <|ref|>{term}<|/ref|> in the image.",
        "freeform": "<image>\n{prompt}",
    }
    
    if mode == "find":
        return templates["find"].replace("{term}", find_term.strip() or "Total")
    elif mode == "freeform":
        return templates["freeform"].replace("{prompt}", custom_prompt.strip() or "OCR this image.")
    return templates.get(mode, templates["document"])

def clean_grounding_text(text: str) -> str:
    """Remove grounding markers"""
    cleaned = re.sub(r"<\|ref\|>(.*?)<\|/ref\|>\s*<\|det\|>\s*\[.*?\]\s*<\|/det\|>", r"\1", text, flags=re.DOTALL)
    cleaned = re.sub(r"<\|grounding\|>", "", cleaned)
    return cleaned.strip()

def parse_detections(text: str, image_width: int, image_height: int) -> List[Dict[str, Any]]:
    """Parse bounding boxes"""
    boxes = []
    pattern = re.compile(r"<\|ref\|>(?P<label>.*?)<\|/ref\|>\s*<\|det\|>\s*(?P<coords>\[.*?\])\s*<\|/det\|>", re.DOTALL)
    
    for m in pattern.finditer(text or ""):
        label = m.group("label").strip()
        coords_str = m.group("coords").strip()
        
        try:
            import ast
            parsed = ast.literal_eval(coords_str)
            
            if isinstance(parsed, list) and len(parsed) == 4:
                box_coords = [parsed]
            elif isinstance(parsed, list):
                box_coords = parsed
            else:
                continue
            
            for box in box_coords:
                if isinstance(box, (list, tuple)) and len(box) >= 4:
                    x1 = int(float(box[0]) / 999 * image_width)
                    y1 = int(float(box[1]) / 999 * image_height)
                    x2 = int(float(box[2]) / 999 * image_width)
                    y2 = int(float(box[3]) / 999 * image_height)
                    boxes.append({"label": label, "box": [x1, y1, x2, y2]})
        except:
            continue
    
    return boxes

@app.get("/", response_class=FileResponse)
async def root():
    """Return Vue 3 Frontend"""
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    
    # Fallback to legacy UI if frontend/dist is not built
    ui_file = Path(__file__).parent / "ocr_ui_modern.html"
    if ui_file.exists():
        return HTMLResponse(content=ui_file.read_text(encoding='utf-8'))
    return HTMLResponse(content="<h1>DeepSeek-OCR</h1><p>Frontend dist not found and legacy UI missing.</p>")

@app.get("/health")
async def health_check():
    """Health check"""
    return {
        "status": "healthy",
        "backend": backend_type,
        "platform": platform.system(),
        "machine": platform.machine(),
        "model_loaded": backend is not None
    }

@app.post("/ocr")
async def ocr_endpoint(
    file: UploadFile = File(...),
    prompt_type: str = Form("document"),
    find_term: str = Form(""),
    custom_prompt: str = Form(""),
    grounding: bool = Form(False)
):
    """OCR endpoint"""
    if backend is None:
        raise HTTPException(status_code=503, detail="Backend not loaded")
    
    tmp_file = None
    
    try:
        # Save uploaded image
        image_data = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png', mode='wb') as tmp:
            tmp.write(image_data)
            tmp_file = tmp.name
        
        # Get image dimensions
        with Image.open(tmp_file) as img:
            img = ImageOps.exif_transpose(img).convert('RGB')
            orig_w, orig_h = img.size
        
        # Build prompt
        prompt = build_prompt(prompt_type, custom_prompt, find_term)
        
        # Run inference
        text = backend.infer(prompt=prompt, image_path=tmp_file)
        
        # Parse boxes
        boxes = parse_detections(text, orig_w, orig_h) if "<|det|>" in text else []
        
        # Clean text
        display_text = clean_grounding_text(text)
        if not display_text and boxes:
            display_text = ", ".join([b["label"] for b in boxes])
        
        return JSONResponse({
            "success": True,
            "text": display_text,
            "raw_text": text,
            "boxes": boxes,
            "image_dims": {"w": orig_w, "h": orig_h},
            "prompt_type": prompt_type,
            "metadata": {
                "mode": prompt_type,
                "backend": backend_type,
                "has_boxes": len(boxes) > 0
            }
        })
        
    except Exception as e:
        import traceback
        print(f"❌ Error:\n{traceback.format_exc()}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)
        
    finally:
        if tmp_file and os.path.exists(tmp_file):
            os.remove(tmp_file)

@app.post("/pdf-to-images")
async def pdf_to_images_endpoint(file: UploadFile = File(...)):
    """Convert PDF to images"""
    tmp_file = None
    
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Must be PDF")
        
        pdf_data = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf', mode='wb') as tmp:
            tmp.write(pdf_data)
            tmp_file = tmp.name
        
        # Convert PDF
        images = []
        pdf_doc = fitz.open(tmp_file)
        zoom = 144 / 72.0
        matrix = fitz.Matrix(zoom, zoom)
        
        for page_num in range(pdf_doc.page_count):
            page = pdf_doc[page_num]
            pixmap = page.get_pixmap(matrix=matrix, alpha=False)
            img_data = pixmap.tobytes("png")
            img = Image.open(io.BytesIO(img_data)).convert('RGB')
            
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='PNG', optimize=True)
            img_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
            
            images.append({
                "data": f"data:image/png;base64,{img_base64}",
                "name": f"page_{page_num + 1}.png",
                "width": img.size[0],
                "height": img.size[1],
                "page_number": page_num + 1
            })
        
        pdf_doc.close()
        
        return JSONResponse({
            "success": True,
            "images": images,
            "page_count": len(images),
            "original_filename": file.filename
        })
        
    except Exception as e:
        import traceback
        print(f"❌ PDF Error:\n{traceback.format_exc()}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)
        
    finally:
        if tmp_file and os.path.exists(tmp_file):
            os.remove(tmp_file)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    print(f"\n{'='*50}")
    print(f"🚀 DeepSeek-OCR Unified Service")
    print(f"{'='*50}")
    print(f"📍 URL: http://0.0.0.0:{port}")
    print(f"📚 Docs: http://0.0.0.0:{port}/docs")
    print(f"{'='*50}\n")
    
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
