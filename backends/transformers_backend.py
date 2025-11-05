"""Transformers Backend for CPU/MPS"""
from typing import Optional
from PIL import Image
from transformers import AutoProcessor, AutoModelForVision2Seq
import torch

class TransformersBackend:
    def __init__(self, model_path: str = "deepseek-ai/DeepSeek-OCR"):
        self.model_path = model_path
        self.model = None
        self.processor = None
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"
        
    def load_model(self):
        """Load model with transformers"""
        try:
            print(f"📦 Loading model: {self.model_path} on {self.device}")
            self.processor = AutoProcessor.from_pretrained(
                self.model_path,
                trust_remote_code=True
            )
            self.model = AutoModelForVision2Seq.from_pretrained(
                self.model_path,
                trust_remote_code=True,
                torch_dtype=torch.float16 if self.device == "mps" else torch.float32
            ).to(self.device)
            print(f"✅ Model loaded successfully on {self.device}")
            return True
        except Exception as e:
            print(f"❌ Model loading failed: {e}")
            raise
    
    def infer(self, prompt: str, image_path: str, **kwargs) -> str:
        """Run inference"""
        try:
            image = Image.open(image_path).convert('RGB')
            
            inputs = self.processor(
                text=prompt,
                images=image,
                return_tensors="pt"
            ).to(self.device)
            
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=kwargs.get('max_tokens', 2048),
                temperature=kwargs.get('temperature', 0.0),
                do_sample=False
            )
            
            result = self.processor.decode(outputs[0], skip_special_tokens=False)
            return result
            
        except Exception as e:
            print(f"❌ Inference failed: {e}")
            raise
    
    @staticmethod
    def is_available() -> bool:
        """Always available if torch is installed"""
        try:
            import torch
            return True
        except ImportError:
            return False
