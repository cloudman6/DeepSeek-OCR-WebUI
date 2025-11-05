# 🔍 DeepSeek-OCR-WebUI
[访问应用 →](https://deepseek-ocr.aws.xin/)

<div align="center">

**🌐 [English](./README.md) | [简体中文](./README_zh-CN.md) | [繁體中文](./README_zh-TW.md) | [日本語](./README_ja.md)**

[![Version](https://img.shields.io/badge/version-v3.3-blue.svg)](./CHANGELOG.md)
[![Docker](https://img.shields.io/badge/docker-supported-brightgreen.svg)](./docker-compose.yml)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Language](https://img.shields.io/badge/languages-4-orange.svg)](#多语言支持)

智能OCR识别系统 · 批量处理 · 多模式支持 · 边界框可视化

[功能特性](#功能特性) • [快速开始](#快速开始) • [版本历史](#版本历史) • [文档](#文档) • [贡献](#贡献)

</div>

---

## 🎉 重大更新：支持 Apple Silicon！

**🍎 现已完全支持 Mac M1/M2/M3/M4，原生 MPS 加速！**

DeepSeek-OCR-WebUI v3.3 带来原生 Apple Silicon 支持，让 Mac 用户可以在本地运行高性能 OCR：
- ✅ **原生 MPS 后端** - Metal Performance Shaders 加速
- ✅ **简单安装** - 一键 conda 环境配置
- ✅ **私有部署** - 完全离线运行
- ✅ **快速推理** - M3 Pro 上约 3 秒/张

👉 [跳转到 Mac 部署指南](#-方式二mac-原生部署apple-silicon)

---

## 📖 简介

DeepSeek-OCR-WebUI 是一个基于 DeepSeek-OCR 模型的智能图像识别 Web 应用，提供直观的用户界面和强大的识别功能。

### 🖼️ UI 预览

<div align="center">

![DeepSeek-OCR-WebUI 界面](./assets/ui_screenshot.3.3.3.png)

**现代化的用户界面，支持多语言切换、批量处理、边界框可视化**

</div>

### 📈 Star 增长曲线

<div align="center">

![Star History Chart](https://api.star-history.com/svg?repos=neosun100/DeepSeek-OCR-WebUI&type=Date)

**Star 增长曲线 - 帮助我们成长！⭐**

</div>

### ✨ 核心亮点

- 🎯 **7 种识别模式** - 文档、OCR、图表、查找、自定义等
- 🖼️ **边界框可视化** - Find 模式自动标注位置
- 📦 **批量处理** - 支持多张图片逐一识别
- 📄 **PDF 支持** - 上传 PDF 文件，自动转换为图片
- 🎨 **现代化 UI** - 炫酷的渐变背景和动画效果
- 🌐 **多语言支持** - 简体中文、繁体中文、英语、日语
- 🍎 **Apple Silicon 支持** - Mac M1/M2/M3/M4 原生 MPS 加速
- 🐳 **Docker 部署** - 一键启动，开箱即用
- ⚡ **GPU 加速** - 基于 NVIDIA GPU 的高性能推理
- 🌏 **ModelScope 自动切换** - HuggingFace 不可用时自动切换

---

## 🚀 功能特性

### 7 种识别模式

| 模式 | 图标 | 说明 | 适用场景 |
|------|------|------|---------|
| **文档转Markdown** | 📄 | 保留格式和布局 | 合同、论文、报告 |
| **通用OCR** | 📝 | 提取所有可见文字 | 图片文字提取 |
| **纯文本提取** | 📋 | 纯文本不保留格式 | 简单文本识别 |
| **图表解析** | 📊 | 识别图表和公式 | 数据图表、数学公式 |
| **图像描述** | 🖼️ | 生成详细描述 | 图片理解、无障碍 |
| **查找定位** ⭐ | 🔍 | 查找并标注位置 | 发票字段定位 |
| **自定义提示** ⭐ | ✨ | 自定义识别需求 | 灵活的识别任务 |

### 📄 PDF 支持（v3.2 新功能）

DeepSeek-OCR-WebUI 现已支持 PDF 文件上传！上传 PDF 文件后，系统会自动将每一页转换为独立的图片，并保持后续的所有处理逻辑（OCR识别、批量处理等）。

<div align="center">

![PDF 处理截图](./images/pdf_processing_screenshot.png)

**PDF 上传并自动转换为图片 - 每页成为独立的图片进行处理**

</div>

**核心功能**：
- **多页 PDF 转换**：自动将每页转换为独立的图片
- **实时进度显示**：逐页显示转换进度
- **拖拽上传**：支持拖拽上传 PDF 文件
- **Find 模式支持**：Find 模式支持 PDF（自动使用第一页）
- **格式验证**：自动文件类型检测和错误提示
- **无缝集成**：转换后的图片与普通图片遵循相同的处理流程

### 🌏 ModelScope 自动切换（v3.2 新功能）

- **自动切换**：HuggingFace 不可用时自动切换到 ModelScope
- **智能检测**：智能识别网络错误和超时
- **中国友好**：为大陆用户提供无缝体验
- **5分钟超时**：可配置的模型加载超时时间

### 🎨 Find 模式特色

**左右分栏布局**：
```
┌──────────────────────┬─────────────────────────────┐
│   左侧：操作面板      │    右侧：结果展示            │
├──────────────────────┼─────────────────────────────┤
│ 📤 图片上传          │ 🖼️ 结果图片（带边界框）      │
│ 🎯 查找词输入        │ 📊 统计信息                  │
│ 🚀 操作按钮          │ 📝 识别文本                  │
│                      │ 📦 匹配项列表                 │
└──────────────────────┴─────────────────────────────┘
```

**边界框可视化**：
- 🟢 彩色霓虹边框自动标注
- 🎨 6 种颜色循环显示
- 📍 精确的坐标定位
- 🔄 响应式自动重绘

**功能演示**：

<div align="center">

![Find模式演示](./assets/find_mode_screenshot.png)

**查找定位模式实际效果：左侧上传操作，右侧自动圈选标注**

</div>

---

## 🌐 多语言支持

### 支持的语言

- 🇨🇳 **简体中文** (zh-CN)
- 🇹🇼 **繁體中文** (zh-TW)
- 🇺🇸 **English** (en-US) - 默认
- 🇯🇵 **日本語** (ja-JP)

### 如何切换语言

**Web UI**：
1. 点击右上角的语言选择器
2. 选择你需要的语言
3. 界面立即切换，设置自动保存

---

## 📦 快速开始

### 前置要求

**Docker 部署（推荐）**：
- Docker & Docker Compose
- NVIDIA GPU + 驱动（用于 GPU 加速）
- 8GB+ RAM
- 20GB+ 磁盘空间

**Mac（Apple Silicon）**：
- macOS 系统，Apple Silicon 芯片（M1/M2/M3/M4）
- Python 3.11+
- 16GB+ RAM（推荐）
- 20GB+ 磁盘空间

**Linux（原生部署）**：
- Python 3.11+
- NVIDIA GPU + CUDA（可选，用于加速）
- 8GB+ RAM
- 20GB+ 磁盘空间

---

### 🐳 方式一：Docker 部署（Linux/Windows）

**适用于**：Linux 服务器（带 NVIDIA GPU）、生产环境

```bash
# 1. 克隆仓库
git clone https://github.com/neosun100/DeepSeek-OCR-WebUI.git
cd DeepSeek-OCR-WebUI

# 2. 启动服务
docker compose up -d

# 3. 等待模型加载（约 1-2 分钟）
docker logs -f deepseek-ocr-webui

# 4. 访问 Web UI
# http://localhost:8001
```

---

### 🍎 方式二：Mac 原生部署（Apple Silicon）

**适用于**：Mac M1/M2/M3/M4 用户、本地开发

**⚠️ 重要**：必须使用 conda 虚拟环境，避免依赖冲突。

#### 步骤 1：安装依赖

```bash
# 克隆仓库
git clone https://github.com/neosun100/DeepSeek-OCR-WebUI.git
cd DeepSeek-OCR-WebUI

# 创建并激活 conda 环境（必需）
conda create -n deepseek-ocr-mlx python=3.11
conda activate deepseek-ocr-mlx

# 安装 PyTorch（支持 MPS）
pip install torch torchvision

# 安装必需的包
pip install transformers==4.46.3 tokenizers==0.20.3
pip install fastapi uvicorn PyMuPDF Pillow
pip install einops addict easydict matplotlib

# 或一次性安装所有依赖
pip install -r requirements-mac.txt

# 验证安装（可选）
./verify_mac_env.sh
```

#### 步骤 2：启动服务

```bash
# 重要：每次启动前必须先激活 conda 环境
conda activate deepseek-ocr-mlx

# 启动服务（自动检测 MPS 后端）
./start.sh

# 或手动启动
python web_service_unified.py
```

#### 步骤 3：访问 Web UI

在浏览器中打开：`http://localhost:8001`

**注意**：首次运行会下载约 7GB 的模型，请耐心等待。

---

### 🐧 方式三：Linux 原生部署

**适用于**：Linux 服务器、自定义配置

#### 有 NVIDIA GPU：

```bash
# 安装 PyTorch（CUDA 版本）
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# 安装依赖
pip install transformers==4.46.3 tokenizers==0.20.3
pip install fastapi uvicorn PyMuPDF Pillow
pip install einops addict easydict matplotlib

# 启动服务（自动检测 CUDA 后端）
./start.sh
```

#### 无 GPU（仅 CPU）：

```bash
# 安装 PyTorch（CPU 版本）
pip install torch torchvision

# 安装依赖
pip install transformers==4.46.3 tokenizers==0.20.3
pip install fastapi uvicorn PyMuPDF Pillow
pip install einops addict easydict matplotlib

# 启动服务（自动检测 CPU 后端）
./start.sh
```

---

### ✅ 验证安装

```bash
# 检查容器状态（Docker）
docker compose ps

# 检查健康状态
curl http://localhost:8001/health

# 预期响应：
# {
#   "status": "healthy",
#   "backend": "mps",  # 或 "cuda" 或 "cpu"
#   "platform": "Darwin",  # 或 "Linux"
#   "model_loaded": true
# }
```

---

### 🔧 平台检测

服务会自动检测您的平台并使用最优后端：

| 平台 | 后端 | 加速 | 自动检测 |
|----------|---------|--------------|---------------|
| Mac M1/M2/M3/M4 | MPS | Metal GPU | ✅ 是 |
| Linux + NVIDIA GPU | CUDA | CUDA GPU | ✅ 是 |
| Linux（仅 CPU） | CPU | 无 | ✅ 是 |
| Docker | CUDA | CUDA GPU | ✅ 是 |

**强制指定后端**（可选）：
```bash
FORCE_BACKEND=mps ./start.sh   # 强制 MPS（仅 Mac）
FORCE_BACKEND=cuda ./start.sh  # 强制 CUDA（Linux+GPU）
FORCE_BACKEND=cpu ./start.sh   # 强制 CPU（任何平台）
```

---

## 📊 版本历史

### v3.3 (2025-11-05) - Apple Silicon 支持与多平台架构

**🍎 Apple Silicon 支持**：
- ✅ Mac M1/M2/M3/M4 原生 MPS（Metal Performance Shaders）后端
- ✅ 自动平台检测和后端选择
- ✅ 针对 MPS 兼容性优化的 float32 精度
- ✅ 约 7GB 模型，支持自动下载和缓存

**🌍 多平台架构**：
- ✅ 统一的后端接口（MPS/CUDA/CPU）
- ✅ 智能平台检测（Mac/Linux/Docker）
- ✅ 独立的后端实现（互不冲突）
- ✅ 通用启动脚本（`./start.sh`）

**🔧 技术改进**：
- ✅ 模型版本：`1e3401a3d4603e9e71ea0ec850bfead602191ec4`（MPS 支持）
- ✅ Transformers 4.46.3 兼容性
- ✅ 修复 LlamaFlashAttention2 导入问题
- ✅ 跨平台统一的模型推理接口

**📚 文档**：
- ✅ 多平台部署指南
- ✅ 平台兼容性文档
- ✅ 验证工具（`verify_platform.sh`）

---

### v3.2 (2025-11-04) - PDF 支持与 ModelScope 自动切换

**📄 新功能**：
- ✅ PDF 上传支持（自动转换为图片）
- ✅ 多页 PDF 转换，实时进度显示
- ✅ 拖拽上传 PDF 支持
- ✅ ModelScope 自动切换（HuggingFace 不可用时）
- ✅ 智能网络错误检测和重试

**🐛 Bug 修复**：
- ✅ 修复 PDF 转换进度日志
- ✅ 修复按钮文本重复的国际化问题
- ✅ 修复系统初始化日志信息

**🔧 技术改进**：
- ✅ 集成 PyMuPDF 进行高质量 PDF 转换（144 DPI）
- ✅ 异步 PDF 处理，实时进度显示
- ✅ 增强错误处理和日志记录

---

### v3.1 (2025-10-22) - 多语言与 Bug 修复

**🌐 新功能**：
- ✅ 添加多语言支持（简体中文、繁体中文、英语、日语）
- ✅ 语言选择器 UI 组件
- ✅ 本地化持久化存储
- ✅ 多语言文档（README）

**🐛 Bug 修复**：
- ✅ 修复模式切换问题
- ✅ 修复边界框超出图片边界
- ✅ 优化图片容器布局
- ✅ 添加渲染延迟确保对齐

**🎨 UI 优化**：
- ✅ 图片居中显示
- ✅ 边界框响应式重绘
- ✅ 语言切换器集成

---

### v3.0 (2025-10-22) - Find 模式与左右分栏

**✨ 重大更新**：
- ✅ 全新 Find 模式（查找定位）
- ✅ 左右分栏专用布局
- ✅ Canvas 边界框可视化
- ✅ 彩色霓虹标注效果

**🔧 技术改进**：
- ✅ transformers 引擎（替代 vLLM）
- ✅ 精确的坐标转换算法
- ✅ 响应式设计优化

---

## 📖 文档

### 用户文档

- 📘 [快速开始指南](./QUICK_START.md)
- 📗 [Find 模式指南](./FIND_MODE_V2_GUIDE.md)
- 📙 [增强功能](./ENHANCED_FEATURES.md)
- 📕 [Bug 修复总结](./BUGFIX_SUMMARY.md)

### 技术文档

- 🔧 [部署总结](./DEPLOYMENT_SUMMARY.md)
- 📝 [更新日志](./CHANGELOG.md)
- 🌐 [国际化实现](./I18N_IMPLEMENTATION.md)

---

## 🎯 使用示例

### Find 模式示例

```bash
场景：在发票中查找 "Total" 金额

步骤：
1. 选择 "🔍 查找定位" 模式
2. 上传发票图片
3. 输入查找词：Total
4. 点击 "🚀 开始查找"

结果：
✓ 图片上 "Total" 被绿色边框标注
✓ 显示找到 1-2 个匹配项
✓ 提供精确的坐标信息
```

### 批量处理示例

```bash
场景：批量识别 20 张合同

步骤：
1. 选择 "📄 文档转Markdown" 模式
2. 拖拽上传 20 张图片
3. 调整顺序（可选）
4. 点击 "🚀 开始识别"

结果：
✓ 逐一处理每张图片
✓ 实时显示进度
✓ 自动合并所有结果
✓ 一键复制或下载
```

---

## 🔧 配置

### 环境变量

```bash
# docker-compose.yml
API_HOST=0.0.0.0              # 监听地址
MODEL_NAME=deepseek-ai/DeepSeek-OCR  # 模型名称
CUDA_VISIBLE_DEVICES=0        # GPU 设备
```

### 性能调优

```yaml
# 内存配置
shm_size: "8g"                # 共享内存

# GPU 配置
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu]
```

---

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](./CONTRIBUTING.md)。

### 如何贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📞 支持

### 遇到问题？

1. 查看 [故障排查](./TROUBLESHOOTING.md)
2. 查看 [已知问题](./KNOWN_ISSUES.md)
3. 提交 [Issue](https://github.com/neosun100/DeepSeek-OCR-WebUI/issues)

### 功能建议？

1. 查看 [路线图](./ROADMAP.md)
2. 提交 [Feature Request](https://github.com/neosun100/DeepSeek-OCR-WebUI/issues/new?template=feature_request.md)

---

## 📱 关注我们

<div align="center">

![扫码关注](./assets/qrcode_promo.png)

**扫码获取更多信息**

</div>

---

## 📄 许可证

本项目采用 [MIT License](./LICENSE) 开源协议。

---

## 🙏 致谢

- [DeepSeek-AI](https://github.com/deepseek-ai) - DeepSeek-OCR 模型
- [deepseek_ocr_app](https://github.com/rdumasia303/deepseek_ocr_app) - 参考项目
- 所有贡献者和用户

---

## 🔗 相关链接

- 🏠 [项目主页](https://github.com/neosun100/DeepSeek-OCR-WebUI)
- 📖 [完整文档](https://github.com/neosun100/DeepSeek-OCR-WebUI/wiki)
- 🐛 [问题追踪](https://github.com/neosun100/DeepSeek-OCR-WebUI/issues)
- 💬 [讨论区](https://github.com/neosun100/DeepSeek-OCR-WebUI/discussions)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！⭐**

Made with ❤️ by [neosun100](https://github.com/neosun100)

DeepSeek-OCR-WebUI v3.3 | © 2025

</div>
