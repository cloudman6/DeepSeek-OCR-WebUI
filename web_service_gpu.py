#!/usr/bin/env python3
"""
DeepSeek-OCR Web Service with GPU Management
集成 GPU 智能管理的 Web 服务
"""
import os
import re
import tempfile
import io
import base64
import platform
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps
import uvicorn
import fitz

from gpu_manager import GPUResourceManager

# 全局 GPU 管理器
gpu_manager = None
backend_type = None

def detect_platform() -> str:
    """检测平台"""
    force_backend = os.environ.get("FORCE_BACKEND", "").lower()
    if force_backend in ["cuda", "cpu"]:
        return force_backend
    
    try:
        import torch
        if torch.cuda.is_available():
            return "cuda"
    except ImportError:
        pass
    
    return "cpu"

def load_model_func():
    """模型加载函数 - 供 GPU 管理器调用"""
    from backends.cuda_backend import CUDABackend
    backend = CUDABackend()
    
    try:
        backend.load_model(source="huggingface", timeout=300)
    except:
        print("🔄 Switching to ModelScope...")
        backend.load_model(source="modelscope")
    
    return backend.model, backend.processor

@asynccontextmanager
async def lifespan(app: FastAPI):
    """启动时初始化 GPU 管理器"""
    global gpu_manager, backend_type
    
    print("="*50)
    print("🚀 DeepSeek-OCR with GPU Management")
    print("="*50)
    
    backend_type = detect_platform()
    
    if backend_type == "cuda":
        # 初始化 GPU 管理器
        idle_timeout = int(os.environ.get("GPU_IDLE_TIMEOUT", "60"))
        gpu_manager = GPUResourceManager(idle_timeout=idle_timeout)
        gpu_manager.start_monitor()
        print(f"✅ GPU Manager initialized (timeout={idle_timeout}s)")
    else:
        print("⚠️ CPU mode - GPU manager disabled")
    
    print("="*50)
    
    yield
    
    if gpu_manager:
        gpu_manager.stop_monitor()
    print("🛑 Service shutting down...")

app = FastAPI(
    title="DeepSeek-OCR with GPU Management",
    description="OCR service with lazy loading and instant offload",
    version="4.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def build_prompt(mode: str, custom_prompt: str = "", find_term: str = "") -> str:
    """构建提示词"""
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
    """清理标记"""
    cleaned = re.sub(r"<\|ref\|>(.*?)<\|/ref\|>\s*<\|det\|>\s*\[.*?\]\s*<\|/det\|>", r"\1", text, flags=re.DOTALL)
    cleaned = re.sub(r"<\|grounding\|>", "", cleaned)
    return cleaned.strip()

def parse_detections(text: str, image_width: int, image_height: int) -> List[Dict[str, Any]]:
    """解析边界框"""
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

@app.get("/", response_class=HTMLResponse)
async def root():
    """返回 Web UI"""
    ui_file = Path(__file__).parent / "ocr_ui_modern.html"
    if ui_file.exists():
        return HTMLResponse(content=ui_file.read_text(encoding='utf-8'))
    return HTMLResponse(content="<h1>DeepSeek-OCR</h1><p>UI not found</p>")

@app.get("/health")
async def health_check():
    """健康检查"""
    status = {
        "status": "healthy",
        "backend": backend_type,
        "platform": platform.system(),
        "gpu_manager": gpu_manager is not None
    }
    
    if gpu_manager:
        status.update(gpu_manager.get_status())
    
    return status

@app.get("/gpu/status")
async def gpu_status():
    """GPU 状态"""
    if not gpu_manager:
        raise HTTPException(status_code=400, detail="GPU manager not available")
    
    return gpu_manager.get_status()

@app.post("/gpu/offload")
async def gpu_offload():
    """手动卸载 GPU"""
    if not gpu_manager:
        raise HTTPException(status_code=400, detail="GPU manager not available")
    
    gpu_manager.force_offload()
    return {"status": "offloaded", "message": "Model moved to CPU"}

@app.post("/gpu/release")
async def gpu_release():
    """完全释放资源"""
    if not gpu_manager:
        raise HTTPException(status_code=400, detail="GPU manager not available")
    
    gpu_manager.force_release()
    return {"status": "released", "message": "All resources freed"}

@app.post("/ocr")
async def ocr_endpoint(
    file: UploadFile = File(...),
    prompt_type: str = Form("document"),
    find_term: str = Form(""),
    custom_prompt: str = Form(""),
    grounding: bool = Form(False)
):
    """OCR 端点 - 使用 GPU 管理器"""
    tmp_file = None
    
    try:
        # 保存上传的图片
        image_data = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png', mode='wb') as tmp:
            tmp.write(image_data)
            tmp_file = tmp.name
        
        # 获取图片尺寸
        with Image.open(tmp_file) as img:
            img = ImageOps.exif_transpose(img).convert('RGB')
            orig_w, orig_h = img.size
        
        # 构建提示词
        prompt = build_prompt(prompt_type, custom_prompt, find_term)
        
        # 步骤1: 懒加载模型
        if gpu_manager:
            model, processor = gpu_manager.get_model(load_func=load_model_func)
        else:
            # CPU 模式
            from backends.cpu_backend import CPUBackend
            backend = CPUBackend()
            backend.load_model()
            model, processor = backend.model, backend.processor
        
        # 步骤2: 推理
        from backends.cuda_backend import CUDABackend
        backend = CUDABackend()
        backend.model = model
        backend.processor = processor
        text = backend.infer(prompt=prompt, image_path=tmp_file)
        
        # 步骤3: 立即卸载（关键！）
        if gpu_manager:
            gpu_manager.force_offload()
        
        # 解析结果
        boxes = parse_detections(text, orig_w, orig_h) if "<|det|>" in text else []
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
                "has_boxes": len(boxes) > 0,
                "gpu_managed": gpu_manager is not None
            }
        })
        
    except Exception as e:
        # 异常时也要卸载
        if gpu_manager:
            gpu_manager.force_offload()
        
        import traceback
        print(f"❌ Error:\n{traceback.format_exc()}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)
        
    finally:
        if tmp_file and os.path.exists(tmp_file):
            os.remove(tmp_file)

@app.post("/pdf-to-images")
async def pdf_to_images_endpoint(file: UploadFile = File(...)):
    """PDF 转图片"""
    tmp_file = None
    
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Must be PDF")
        
        pdf_data = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf', mode='wb') as tmp:
            tmp.write(pdf_data)
            tmp_file = tmp.name
        
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
    print(f"🚀 DeepSeek-OCR with GPU Management")
    print(f"{'='*50}")
    print(f"📍 URL: http://0.0.0.0:{port}")
    print(f"📚 Docs: http://0.0.0.0:{port}/docs")
    print(f"{'='*50}\n")
    
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
