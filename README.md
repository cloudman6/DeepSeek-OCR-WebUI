# 🔍 DeepSeek-OCR-WebUI

[Visit Application →](https://deepseek-ocr.aws.xin/)

<div align="center">

**🌐 [English](./README.md) | [简体中文](./README_zh-CN.md) | [繁體中文](./README_zh-TW.md) | [日本語](./README_ja.md)**

[![Version](https://img.shields.io/badge/version-v3.6-blue.svg)](./CHANGELOG.md)
[![Docker](https://img.shields.io/badge/docker-neosun/deepseek--ocr-brightgreen.svg)](https://hub.docker.com/r/neosun/deepseek-ocr)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)

**Intelligent OCR System · Vue 3 Modern UI · Batch Processing · Multi-Mode Support**

[Features](#-features) • [Quick Start](#-quick-start) • [Screenshots](#-screenshots) • [Contributors](#-contributors)

</div>

---

## 🎉 v3.6 Update: Backend Concurrency & Rate Limiting!

**🚀 Performance optimization with smart queue management and rate limiting!**

### ✨ What's New in v3.6

- ⚡ **Backend Concurrency Optimization** - Non-blocking inference with ThreadPoolExecutor
- 🔒 **Rate Limiting** - Per-client and per-IP request limits (X-Client-ID header support)
- 📊 **Queue Management** - Real-time queue status with position tracking
- 🏥 **Enhanced Health API** - Queue depth, status (healthy/busy/full), and rate limit info
- 🌐 **New Languages** - Added Traditional Chinese (zh-TW) and Japanese (ja-JP)
- 🎯 **429 Error Handling** - Graceful handling when queue is full or rate limited

**🙏 Contributors:** [@cloudman6](https://github.com/cloudman6) ([PR #41](https://github.com/neosun100/DeepSeek-OCR-WebUI/pull/41))

---

## 🎉 v3.5 Major Update: Brand New Vue 3 Frontend!

**🚀 Complete UI Overhaul with Modern Vue 3 + TypeScript Architecture!**

<div align="center">

| Home Page | Processing Page |
|:---------:|:---------------:|
| ![Vue3 Home](./assets/vue3_home.png) | ![Vue3 Processing](./assets/vue3_processing.png) |

</div>

### ✨ What's New in v3.5

- 🎨 **Brand New Vue 3 UI** - Modern, responsive design with Naive UI components
- ⚡ **TypeScript Support** - Full type safety and better developer experience
- 📦 **Dexie.js Database** - Local IndexedDB for offline page management
- 🔄 **Real-time Processing Queue** - Visual OCR progress with queue management
- 🏥 **Health Check System** - Backend status monitoring with visual indicators
- 📄 **Enhanced PDF Support** - Smooth PDF rendering with page-by-page processing
- 🌐 **i18n Ready** - Built-in internationalization (EN/CN/TW/JP)
- 🧪 **E2E Testing** - Comprehensive Playwright test coverage

---

## 👥 Contributors

<div align="center">

### 🌟 Special Thanks to Our Amazing Contributors! 🌟

</div>

This project is the result of an outstanding collaboration. The Vue 3 frontend was developed through a successful merge of [PR #34](https://github.com/neosun100/DeepSeek-OCR-WebUI/pull/34).

<table>
<tr>
<td align="center">
<a href="https://github.com/cloudman6">
<img src="https://avatars.githubusercontent.com/u/23329721?v=4" width="100px;" alt="CloudMan"/>
<br />
<sub><b>CloudMan</b></sub>
</a>
<br />
<sub>🏆 Vue 3 Frontend Lead Developer</sub>
<br />
<sub>164 commits · Complete UI Rewrite</sub>
</td>
<td align="center">
<a href="https://github.com/neosun100">
<img src="https://avatars.githubusercontent.com/u/13846998?v=4" width="100px;" alt="neosun100"/>
<br />
<sub><b>neosun100</b></sub>
</a>
<br />
<sub>🎯 Project Maintainer</sub>
<br />
<sub>Backend · Docker · Integration</sub>
</td>
</tr>
</table>

> 💡 **About the Vue 3 Frontend**: [@cloudman6](https://github.com/cloudman6) contributed an exceptional Vue 3 + TypeScript frontend with 164 commits, including comprehensive E2E tests, modern UI components, and production-ready architecture. This collaboration transformed DeepSeek-OCR-WebUI into a professional-grade application!

---

## 📖 Introduction

DeepSeek-OCR-WebUI is an intelligent document recognition web application powered by the DeepSeek-OCR model. It provides a modern, intuitive interface for converting images and PDFs to structured text with high accuracy.

### ✨ Core Highlights

| Feature | Description |
|---------|-------------|
| 🎯 **7 Recognition Modes** | Document, OCR, Chart, Find, Freeform, and more |
| 🖼️ **Bounding Box Visualization** | Find mode with automatic position annotation |
| 📦 **Batch Processing** | Process multiple images/pages sequentially |
| 📄 **PDF Support** | Upload PDFs, auto-convert to images |
| 🎨 **Modern Vue 3 UI** | Responsive design with Naive UI |
| 🌐 **Multilingual** | EN, 简体中文, 繁體中文, 日本語 |
| 🍎 **Apple Silicon** | Native MPS acceleration for M1/M2/M3/M4 |
| 🐳 **Docker Ready** | One-command deployment |
| ⚡ **GPU Acceleration** | NVIDIA CUDA support |

---

## 🚀 Features

### 7 Recognition Modes

| Mode | Icon | Description | Use Cases |
|------|:----:|-------------|-----------|
| **Doc to Markdown** | 📄 | Preserve format and layout | Contracts, papers, reports |
| **General OCR** | 📝 | Extract all visible text | Image text extraction |
| **Plain Text** | 📋 | Pure text without format | Simple text recognition |
| **Chart Parser** | 📊 | Recognize charts and formulas | Data charts, math formulas |
| **Image Description** | 🖼️ | Generate detailed descriptions | Image understanding |
| **Find & Locate** | 🔍 | Find and annotate positions | Invoice field locating |
| **Custom Prompt** | ✨ | Customize recognition needs | Flexible tasks |

### 🆕 Vue 3 Frontend Features

```
┌─────────────────────────────────────────────────────────────┐
│  📁 Page Sidebar          │  📄 Document Viewer             │
│  ├─ Thumbnail List        │  ├─ High-res Image Display      │
│  ├─ Drag & Drop Reorder   │  ├─ OCR Overlay Toggle          │
│  ├─ Batch Selection       │  ├─ Zoom Controls               │
│  └─ Quick Actions         │  └─ Status Indicators           │
├─────────────────────────────────────────────────────────────┤
│  🔄 Processing Queue      │  📝 Result Panel                │
│  ├─ Real-time Progress    │  ├─ Markdown Preview            │
│  ├─ Cancel/Retry          │  ├─ Word/PDF Export             │
│  └─ Health Monitoring     │  └─ Copy to Clipboard           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🖼️ Screenshots

### Home Page
<div align="center">

![Vue3 Home Page](./assets/vue3_home.png)

*Clean, modern landing page with quick access to all features*

</div>

### Processing Interface
<div align="center">

![Vue3 Processing Page](./assets/vue3_processing.png)

*Full-featured document processing with sidebar, viewer, and results panel*

</div>

### Quick Start Guide
<div align="center">

![Quick Start Guide](./assets/vue3_quickstart.png)

*Step-by-step guide: Import files → Select pages → Choose OCR mode → Get results*

</div>

---

## 📦 Quick Start

### 🐳 Docker (Recommended)

```bash
# Pull and run
docker pull neosun/deepseek-ocr:v3.6
docker run -d \
  --name deepseek-ocr \
  --gpus all \
  -p 8001:8001 \
  --shm-size=8g \
  neosun/deepseek-ocr:v3.6

# Access: http://localhost:8001
```

### Available Docker Tags

| Tag | Description |
|-----|-------------|
| `latest` | Latest stable (= v3.6) |
| `v3.6` | Backend concurrency & rate limiting |
| `v3.5` | Vue 3 frontend version |
| `v3.3.1-fix-bfloat16` | BFloat16 compatibility fix |

### 🍎 Mac (Apple Silicon)

```bash
# Clone and setup
git clone https://github.com/neosun100/DeepSeek-OCR-WebUI.git
cd DeepSeek-OCR-WebUI

# Create conda environment
conda create -n deepseek-ocr python=3.11
conda activate deepseek-ocr

# Install dependencies
pip install -r requirements-mac.txt

# Start service
./start.sh
# Access: http://localhost:8001
```

### 🐧 Linux (Native)

```bash
# With NVIDIA GPU
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt
./start.sh
```

---

## 🔌 API & Integration

### REST API

```python
import requests

# Single image OCR
with open("image.png", "rb") as f:
    response = requests.post(
        "http://localhost:8001/ocr",
        files={"file": f},
        data={"prompt_type": "ocr"}
    )
    print(response.json()["text"])

# PDF OCR (all pages)
with open("document.pdf", "rb") as f:
    response = requests.post(
        "http://localhost:8001/ocr-pdf",
        files={"file": f},
        data={"prompt_type": "document"}
    )
    print(response.json()["merged_text"])
```

**Endpoints:**
- `GET /health` - Health check
- `POST /ocr` - Single image OCR
- `POST /ocr-pdf` - PDF OCR (all pages)
- `POST /pdf-to-images` - Convert PDF to images

📖 **Full API Documentation**: [API.md](./API.md)

### MCP (Model Context Protocol)

Enable AI assistants like Claude Desktop to use OCR:

```json
{
  "mcpServers": {
    "deepseek-ocr": {
      "command": "python",
      "args": ["/path/to/mcp_server.py"]
    }
  }
}
```

📖 **MCP Setup Guide**: [MCP_SETUP.md](./MCP_SETUP.md)

---

## 🌐 Multilingual Support

| Language | Code | Status |
|----------|------|--------|
| 🇺🇸 English | en-US | ✅ Default |
| 🇨🇳 简体中文 | zh-CN | ✅ |
| 🇹🇼 繁體中文 | zh-TW | ✅ |
| 🇯🇵 日本語 | ja-JP | ✅ |

Switch language via the selector in the top-right corner.

---

## 📊 Version History

### v3.6 (2026-01-20) - Backend Concurrency & Rate Limiting

**⚡ Performance Optimization:**
- ✅ Non-blocking inference with ThreadPoolExecutor
- ✅ Concurrency control with asyncio.Semaphore (OCR: 1, PDF: 2)
- ✅ Queue system with MAX_OCR_QUEUE_SIZE and dynamic status
- ✅ Per-IP and per-Client-ID rate limiting (X-Client-ID header)
- ✅ 429 error handling (queue full, client limit, IP limit)
- ✅ Health indicator with 3 status colors (green/yellow/red)
- ✅ OCR queue popover with real-time position display

**🙏 Contributors:** [@cloudman6](https://github.com/cloudman6) ([PR #41](https://github.com/neosun100/DeepSeek-OCR-WebUI/pull/41))

### v3.5 (2026-01-17) - Vue 3 Frontend

**🎨 Complete UI Overhaul:**
- ✅ Vue 3 + TypeScript + Naive UI
- ✅ Dexie.js local database
- ✅ Real-time processing queue
- ✅ Health check monitoring
- ✅ E2E test coverage (Playwright)
- ✅ GitHub links in header

**🙏 Contributors:** [@cloudman6](https://github.com/cloudman6) (164 commits)

### v3.3.1 (2025-12-16) - BFloat16 Fix

- ✅ Fixed GPU compatibility for RTX 20xx, GTX 10xx
- ✅ Auto-detect compute capability

### v3.3 (2025-11-05) - Apple Silicon

- ✅ Native MPS backend for Mac M1/M2/M3/M4
- ✅ Multi-platform architecture

### v3.2 (2025-11-04) - PDF Support

- ✅ PDF upload and conversion
- ✅ ModelScope auto-fallback

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [API.md](./API.md) | REST API reference |
| [MCP_SETUP.md](./MCP_SETUP.md) | MCP integration guide |
| [DOCKER_HUB.md](./DOCKER_HUB.md) | Docker deployment |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |

---

## 📈 Star History

<div align="center">

[![Star History Chart](https://api.star-history.com/svg?repos=neosun100/DeepSeek-OCR-WebUI&type=Date)](https://star-history.com/#neosun100/DeepSeek-OCR-WebUI&Date)

**⭐ If this project helps you, please give it a Star! ⭐**

</div>

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork this repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

## 🙏 Acknowledgments

- [DeepSeek-AI](https://github.com/deepseek-ai) - DeepSeek-OCR model
- [@cloudman6](https://github.com/cloudman6) - Vue 3 frontend development
- All contributors and users

---

<div align="center">

**Made with ❤️ by [neosun100](https://github.com/neosun100) & [cloudman6](https://github.com/cloudman6)**

DeepSeek-OCR-WebUI v3.5 | © 2026

</div>
