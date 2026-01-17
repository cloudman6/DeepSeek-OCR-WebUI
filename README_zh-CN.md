# 🔍 DeepSeek-OCR-WebUI

[访问应用 →](https://deepseek-ocr.aws.xin/)

<div align="center">

**🌐 [English](./README.md) | [简体中文](./README_zh-CN.md) | [繁體中文](./README_zh-TW.md) | [日本語](./README_ja.md)**

[![Version](https://img.shields.io/badge/版本-v3.5-blue.svg)](./CHANGELOG.md)
[![Docker](https://img.shields.io/badge/docker-neosun/deepseek--ocr-brightgreen.svg)](https://hub.docker.com/r/neosun/deepseek-ocr)
[![License](https://img.shields.io/badge/许可证-MIT-green.svg)](./LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)

**智能 OCR 系统 · Vue 3 现代界面 · 批量处理 · 多模式支持**

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [界面截图](#-界面截图) • [贡献者](#-贡献者)

</div>

---

## 🎉 v3.5 重大更新：全新 Vue 3 前端！

**🚀 采用现代 Vue 3 + TypeScript 架构的全新界面！**

<div align="center">

| 首页 | 处理页面 |
|:----:|:--------:|
| ![Vue3 首页](./assets/vue3_home.png) | ![Vue3 处理页面](./assets/vue3_processing.png) |

</div>

### ✨ v3.5 新特性

- 🎨 **全新 Vue 3 界面** - 基于 Naive UI 的现代响应式设计
- ⚡ **TypeScript 支持** - 完整的类型安全和更好的开发体验
- 📦 **Dexie.js 数据库** - 本地 IndexedDB 离线页面管理
- 🔄 **实时处理队列** - 可视化 OCR 进度和队列管理
- 🏥 **健康检查系统** - 后端状态监控和可视化指示
- 📄 **增强 PDF 支持** - 流畅的 PDF 渲染和逐页处理
- 🌐 **国际化支持** - 内置多语言（中/英/繁/日）
- 🧪 **E2E 测试** - 完整的 Playwright 测试覆盖

---

## 👥 贡献者

<div align="center">

### 🌟 特别感谢我们优秀的贡献者！🌟

</div>

本项目是一次出色协作的成果。Vue 3 前端通过成功合并 [PR #34](https://github.com/neosun100/DeepSeek-OCR-WebUI/pull/34) 完成开发。

<table>
<tr>
<td align="center">
<a href="https://github.com/cloudman6">
<img src="https://avatars.githubusercontent.com/u/23329721?v=4" width="100px;" alt="CloudMan"/>
<br />
<sub><b>CloudMan</b></sub>
</a>
<br />
<sub>🏆 Vue 3 前端主要开发者</sub>
<br />
<sub>164 次提交 · 完整 UI 重构</sub>
</td>
<td align="center">
<a href="https://github.com/neosun100">
<img src="https://avatars.githubusercontent.com/u/13846998?v=4" width="100px;" alt="neosun100"/>
<br />
<sub><b>neosun100</b></sub>
</a>
<br />
<sub>🎯 项目维护者</sub>
<br />
<sub>后端 · Docker · 集成</sub>
</td>
</tr>
</table>

> 💡 **关于 Vue 3 前端**：[@cloudman6](https://github.com/cloudman6) 贡献了出色的 Vue 3 + TypeScript 前端，包含 164 次提交，涵盖完整的 E2E 测试、现代 UI 组件和生产级架构。这次协作将 DeepSeek-OCR-WebUI 打造成了专业级应用！

---

## 📖 项目介绍

DeepSeek-OCR-WebUI 是一款基于 DeepSeek-OCR 模型的智能文档识别 Web 应用。它提供现代化、直观的界面，可将图片和 PDF 高精度转换为结构化文本。

### ✨ 核心亮点

| 特性 | 描述 |
|------|------|
| 🎯 **7 种识别模式** | 文档、OCR、图表、查找、自由模式等 |
| 🖼️ **边界框可视化** | 查找模式自动标注位置 |
| 📦 **批量处理** | 支持多图片/页面顺序识别 |
| 📄 **PDF 支持** | 上传 PDF 自动转换为图片 |
| 🎨 **现代 Vue 3 界面** | 基于 Naive UI 的响应式设计 |
| 🌐 **多语言** | 中文、英文、繁体、日语 |
| 🍎 **Apple Silicon** | 原生 MPS 加速支持 M1/M2/M3/M4 |
| 🐳 **Docker 部署** | 一键启动 |
| ⚡ **GPU 加速** | NVIDIA CUDA 支持 |

---

## 🚀 功能特性

### 7 种识别模式

| 模式 | 图标 | 描述 | 使用场景 |
|------|:----:|------|----------|
| **文档转 Markdown** | 📄 | 保留格式和布局 | 合同、论文、报告 |
| **通用 OCR** | 📝 | 提取所有可见文字 | 图片文字提取 |
| **纯文本** | 📋 | 无格式纯文本 | 简单文字识别 |
| **图表解析** | 📊 | 识别图表和公式 | 数据图表、数学公式 |
| **图片描述** | 🖼️ | 生成详细描述 | 图像理解 |
| **查找定位** | 🔍 | 查找并标注位置 | 发票字段定位 |
| **自定义提示** | ✨ | 自定义识别需求 | 灵活任务 |

### 🆕 Vue 3 前端特性

```
┌─────────────────────────────────────────────────────────────┐
│  📁 页面侧边栏            │  📄 文档查看器                  │
│  ├─ 缩略图列表            │  ├─ 高清图片显示                │
│  ├─ 拖拽排序              │  ├─ OCR 覆盖层切换              │
│  ├─ 批量选择              │  ├─ 缩放控制                    │
│  └─ 快捷操作              │  └─ 状态指示器                  │
├─────────────────────────────────────────────────────────────┤
│  🔄 处理队列              │  📝 结果面板                    │
│  ├─ 实时进度              │  ├─ Markdown 预览               │
│  ├─ 取消/重试             │  ├─ Word/PDF 导出               │
│  └─ 健康监控              │  └─ 复制到剪贴板                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🖼️ 界面截图

### 首页
<div align="center">

![Vue3 首页](./assets/vue3_home.png)

*简洁现代的首页，快速访问所有功能*

</div>

### 处理界面
<div align="center">

![Vue3 处理页面](./assets/vue3_processing.png)

*功能完整的文档处理界面，包含侧边栏、查看器和结果面板*

</div>

### 快速入门指南
<div align="center">

![快速入门指南](./assets/vue3_quickstart.png)

*操作步骤：导入文件 → 选择页面 → 选择 OCR 模式 → 获取结果*

</div>

---

## 📦 快速开始

### 🐳 Docker（推荐）

```bash
# 拉取并运行
docker pull neosun/deepseek-ocr:v3.5
docker run -d \
  --name deepseek-ocr \
  --gpus all \
  -p 8001:8001 \
  --shm-size=8g \
  neosun/deepseek-ocr:v3.5

# 访问：http://localhost:8001
```

### 可用 Docker 标签

| 标签 | 描述 |
|------|------|
| `latest` | 最新稳定版 (= v3.5) |
| `v3.5` | Vue 3 前端版本 |
| `v3.5-vue3-frontend` | Vue 3 前端（明确标签） |
| `v3.3.1-fix-bfloat16` | BFloat16 兼容性修复 |

### 🍎 Mac（Apple Silicon）

```bash
# 克隆并设置
git clone https://github.com/neosun100/DeepSeek-OCR-WebUI.git
cd DeepSeek-OCR-WebUI

# 创建 conda 环境
conda create -n deepseek-ocr python=3.11
conda activate deepseek-ocr

# 安装依赖
pip install -r requirements-mac.txt

# 启动服务
./start.sh
# 访问：http://localhost:8001
```

### 🐧 Linux（原生）

```bash
# 使用 NVIDIA GPU
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt
./start.sh
```

---

## 🔌 API 与集成

### REST API

```python
import requests

# 单图 OCR
with open("image.png", "rb") as f:
    response = requests.post(
        "http://localhost:8001/ocr",
        files={"file": f},
        data={"prompt_type": "ocr"}
    )
    print(response.json()["text"])

# PDF OCR（所有页面）
with open("document.pdf", "rb") as f:
    response = requests.post(
        "http://localhost:8001/ocr-pdf",
        files={"file": f},
        data={"prompt_type": "document"}
    )
    print(response.json()["merged_text"])
```

**接口端点：**
- `GET /health` - 健康检查
- `POST /ocr` - 单图 OCR
- `POST /ocr-pdf` - PDF OCR（所有页面）
- `POST /pdf-to-images` - PDF 转图片

📖 **完整 API 文档**：[API.md](./API.md)

### MCP（模型上下文协议）

让 Claude Desktop 等 AI 助手使用 OCR：

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

📖 **MCP 设置指南**：[MCP_SETUP.md](./MCP_SETUP.md)

---

## 🌐 多语言支持

| 语言 | 代码 | 状态 |
|------|------|------|
| 🇺🇸 English | en-US | ✅ 默认 |
| 🇨🇳 简体中文 | zh-CN | ✅ |
| 🇹🇼 繁體中文 | zh-TW | ✅ |
| 🇯🇵 日本語 | ja-JP | ✅ |

通过右上角的语言选择器切换语言。

---

## 📊 版本历史

### v3.5 (2026-01-17) - Vue 3 前端

**🎨 全面 UI 重构：**
- ✅ Vue 3 + TypeScript + Naive UI
- ✅ Dexie.js 本地数据库
- ✅ 实时处理队列
- ✅ 健康检查监控
- ✅ E2E 测试覆盖（Playwright）
- ✅ GitHub 链接集成

**🙏 贡献者：** [@cloudman6](https://github.com/cloudman6)（164 次提交）

### v3.3.1 (2025-12-16) - BFloat16 修复

- ✅ 修复 RTX 20xx、GTX 10xx GPU 兼容性
- ✅ 自动检测计算能力

### v3.3 (2025-11-05) - Apple Silicon

- ✅ Mac M1/M2/M3/M4 原生 MPS 后端
- ✅ 多平台架构

### v3.2 (2025-11-04) - PDF 支持

- ✅ PDF 上传和转换
- ✅ ModelScope 自动回退

---

## 📖 文档

| 文档 | 描述 |
|------|------|
| [API.md](./API.md) | REST API 参考 |
| [MCP_SETUP.md](./MCP_SETUP.md) | MCP 集成指南 |
| [DOCKER_HUB.md](./DOCKER_HUB.md) | Docker 部署 |
| [CHANGELOG.md](./CHANGELOG.md) | 版本历史 |

---

## 📈 Star 历史

<div align="center">

[![Star History Chart](https://api.star-history.com/svg?repos=neosun100/DeepSeek-OCR-WebUI&type=Date)](https://star-history.com/#neosun100/DeepSeek-OCR-WebUI&Date)

**⭐ 如果这个项目对你有帮助，请给个 Star！⭐**

</div>

---

## 🤝 贡献

欢迎贡献！请：

1. Fork 本仓库
2. 创建功能分支（`git checkout -b feature/AmazingFeature`）
3. 提交更改（`git commit -m 'Add AmazingFeature'`）
4. 推送到分支（`git push origin feature/AmazingFeature`）
5. 提交 Pull Request

---

## 📄 许可证

本项目采用 [MIT 许可证](./LICENSE)。

---

## 🙏 致谢

- [DeepSeek-AI](https://github.com/deepseek-ai) - DeepSeek-OCR 模型
- [@cloudman6](https://github.com/cloudman6) - Vue 3 前端开发
- 所有贡献者和用户

---

<div align="center">

**由 [neosun100](https://github.com/neosun100) 和 [cloudman6](https://github.com/cloudman6) 用 ❤️ 打造**

DeepSeek-OCR-WebUI v3.5 | © 2026

</div>
