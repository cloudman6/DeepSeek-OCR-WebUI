# 🔍 DeepSeek-OCR-WebUI

[訪問應用 →](https://deepseek-ocr.aws.xin/)

<div align="center">

**🌐 [English](./README.md) | [简体中文](./README_zh-CN.md) | [繁體中文](./README_zh-TW.md) | [日本語](./README_ja.md)**

[![Version](https://img.shields.io/badge/版本-v3.6-blue.svg)](./CHANGELOG.md)
[![Docker](https://img.shields.io/badge/docker-neosun/deepseek--ocr-brightgreen.svg)](https://hub.docker.com/r/neosun/deepseek-ocr)
[![License](https://img.shields.io/badge/授權-MIT-green.svg)](./LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)

**智慧 OCR 系統 · Vue 3 現代介面 · 批次處理 · 多模式支援**

[功能特性](#-功能特性) • [快速開始](#-快速開始) • [介面截圖](#-介面截圖) • [貢獻者](#-貢獻者)

</div>

---

## 🎉 v3.6 更新：後端並發優化與限流！

**🚀 智慧佇列管理和限流帶來的效能優化！**

### ✨ v3.6 新特性

- ⚡ **後端並發優化** - 使用 ThreadPoolExecutor 實現非阻塞推理
- 🔒 **限流機制** - 支援按客戶端和 IP 限制請求（X-Client-ID 標頭支援）
- 📊 **佇列管理** - 即時佇列狀態和位置追蹤
- 🏥 **增強健康 API** - 佇列深度、狀態（健康/繁忙/滿載）和限流資訊
- 🌐 **新增語言** - 添加繁體中文（zh-TW）和日語（ja-JP）
- 🎯 **429 錯誤處理** - 佇列滿或限流時的優雅處理

**🙏 貢獻者：** [@cloudman6](https://github.com/cloudman6) ([PR #41](https://github.com/neosun100/DeepSeek-OCR-WebUI/pull/41))

---

## 🎉 v3.5 重大更新：全新 Vue 3 前端！

**🚀 採用現代 Vue 3 + TypeScript 架構的全新介面！**

<div align="center">

| 首頁 | 處理頁面 |
|:----:|:--------:|
| ![Vue3 首頁](./assets/vue3_home.png) | ![Vue3 處理頁面](./assets/vue3_processing.png) |

</div>

### ✨ v3.5 新特性

- 🎨 **全新 Vue 3 介面** - 基於 Naive UI 的現代響應式設計
- ⚡ **TypeScript 支援** - 完整的型別安全和更好的開發體驗
- 📦 **Dexie.js 資料庫** - 本地 IndexedDB 離線頁面管理
- 🔄 **即時處理佇列** - 視覺化 OCR 進度和佇列管理
- 🏥 **健康檢查系統** - 後端狀態監控和視覺化指示
- 📄 **增強 PDF 支援** - 流暢的 PDF 渲染和逐頁處理
- 🌐 **國際化支援** - 內建多語言（中/英/繁/日）
- 🧪 **E2E 測試** - 完整的 Playwright 測試覆蓋

---

## 👥 貢獻者

<div align="center">

### 🌟 特別感謝我們優秀的貢獻者！🌟

</div>

本專案是一次出色協作的成果。Vue 3 前端透過成功合併 [PR #34](https://github.com/neosun100/DeepSeek-OCR-WebUI/pull/34) 完成開發。

<table>
<tr>
<td align="center">
<a href="https://github.com/cloudman6">
<img src="https://avatars.githubusercontent.com/u/23329721?v=4" width="100px;" alt="CloudMan"/>
<br />
<sub><b>CloudMan</b></sub>
</a>
<br />
<sub>🏆 Vue 3 前端主要開發者</sub>
<br />
<sub>164 次提交 · 完整 UI 重構</sub>
</td>
<td align="center">
<a href="https://github.com/neosun100">
<img src="https://avatars.githubusercontent.com/u/13846998?v=4" width="100px;" alt="neosun100"/>
<br />
<sub><b>neosun100</b></sub>
</a>
<br />
<sub>🎯 專案維護者</sub>
<br />
<sub>後端 · Docker · 整合</sub>
</td>
</tr>
</table>

> 💡 **關於 Vue 3 前端**：[@cloudman6](https://github.com/cloudman6) 貢獻了出色的 Vue 3 + TypeScript 前端，包含 164 次提交，涵蓋完整的 E2E 測試、現代 UI 元件和生產級架構。這次協作將 DeepSeek-OCR-WebUI 打造成了專業級應用！

---

## 📖 專案介紹

DeepSeek-OCR-WebUI 是一款基於 DeepSeek-OCR 模型的智慧文件識別 Web 應用。它提供現代化、直觀的介面，可將圖片和 PDF 高精度轉換為結構化文字。

### ✨ 核心亮點

| 特性 | 描述 |
|------|------|
| 🎯 **7 種識別模式** | 文件、OCR、圖表、查找、自由模式等 |
| 🖼️ **邊界框視覺化** | 查找模式自動標註位置 |
| 📦 **批次處理** | 支援多圖片/頁面順序識別 |
| 📄 **PDF 支援** | 上傳 PDF 自動轉換為圖片 |
| 🎨 **現代 Vue 3 介面** | 基於 Naive UI 的響應式設計 |
| 🌐 **多語言** | 中文、英文、繁體、日語 |
| 🍎 **Apple Silicon** | 原生 MPS 加速支援 M1/M2/M3/M4 |
| 🐳 **Docker 部署** | 一鍵啟動 |
| ⚡ **GPU 加速** | NVIDIA CUDA 支援 |

---

## 🚀 功能特性

### 7 種識別模式

| 模式 | 圖示 | 描述 | 使用場景 |
|------|:----:|------|----------|
| **文件轉 Markdown** | 📄 | 保留格式和佈局 | 合約、論文、報告 |
| **通用 OCR** | 📝 | 提取所有可見文字 | 圖片文字提取 |
| **純文字** | 📋 | 無格式純文字 | 簡單文字識別 |
| **圖表解析** | 📊 | 識別圖表和公式 | 資料圖表、數學公式 |
| **圖片描述** | 🖼️ | 生成詳細描述 | 圖像理解 |
| **查找定位** | 🔍 | 查找並標註位置 | 發票欄位定位 |
| **自訂提示** | ✨ | 自訂識別需求 | 靈活任務 |

### 🆕 Vue 3 前端特性

```
┌─────────────────────────────────────────────────────────────┐
│  📁 頁面側邊欄            │  📄 文件檢視器                  │
│  ├─ 縮圖列表              │  ├─ 高清圖片顯示                │
│  ├─ 拖曳排序              │  ├─ OCR 覆蓋層切換              │
│  ├─ 批次選擇              │  ├─ 縮放控制                    │
│  └─ 快捷操作              │  └─ 狀態指示器                  │
├─────────────────────────────────────────────────────────────┤
│  🔄 處理佇列              │  📝 結果面板                    │
│  ├─ 即時進度              │  ├─ Markdown 預覽               │
│  ├─ 取消/重試             │  ├─ Word/PDF 匯出               │
│  └─ 健康監控              │  └─ 複製到剪貼簿                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🖼️ 介面截圖

### 首頁
<div align="center">

![Vue3 首頁](./assets/vue3_home.png)

*簡潔現代的首頁，快速存取所有功能*

</div>

### 處理介面
<div align="center">

![Vue3 處理頁面](./assets/vue3_processing.png)

*功能完整的文件處理介面，包含側邊欄、檢視器和結果面板*

</div>

### 快速入門指南
<div align="center">

![快速入門指南](./assets/vue3_quickstart.png)

*操作步驟：匯入檔案 → 選擇頁面 → 選擇 OCR 模式 → 取得結果*

</div>

---

## 📦 快速開始

### 🐳 Docker（推薦）

```bash
# 拉取並執行
docker pull neosun/deepseek-ocr:v3.6
docker run -d \
  --name deepseek-ocr \
  --gpus all \
  -p 8001:8001 \
  --shm-size=8g \
  neosun/deepseek-ocr:v3.6

# 存取：http://localhost:8001
```

### 可用 Docker 標籤

| 標籤 | 描述 |
|------|------|
| `latest` | 最新穩定版 (= v3.6) |
| `v3.6` | 後端並發優化與限流 |
| `v3.5` | Vue 3 前端版本 |
| `v3.3.1-fix-bfloat16` | BFloat16 相容性修復 |

### 🍎 Mac（Apple Silicon）

```bash
# 複製並設定
git clone https://github.com/neosun100/DeepSeek-OCR-WebUI.git
cd DeepSeek-OCR-WebUI

# 建立 conda 環境
conda create -n deepseek-ocr python=3.11
conda activate deepseek-ocr

# 安裝依賴
pip install -r requirements-mac.txt

# 啟動服務
./start.sh
# 存取：http://localhost:8001
```

### 🐧 Linux（原生）

```bash
# 使用 NVIDIA GPU
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt
./start.sh
```

---

## 🔌 API 與整合

### REST API

```python
import requests

# 單圖 OCR
with open("image.png", "rb") as f:
    response = requests.post(
        "http://localhost:8001/ocr",
        files={"file": f},
        data={"prompt_type": "ocr"}
    )
    print(response.json()["text"])

# PDF OCR（所有頁面）
with open("document.pdf", "rb") as f:
    response = requests.post(
        "http://localhost:8001/ocr-pdf",
        files={"file": f},
        data={"prompt_type": "document"}
    )
    print(response.json()["merged_text"])
```

**介面端點：**
- `GET /health` - 健康檢查
- `POST /ocr` - 單圖 OCR
- `POST /ocr-pdf` - PDF OCR（所有頁面）
- `POST /pdf-to-images` - PDF 轉圖片

📖 **完整 API 文件**：[API.md](./API.md)

### MCP（模型上下文協定）

讓 Claude Desktop 等 AI 助手使用 OCR：

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

📖 **MCP 設定指南**：[MCP_SETUP.md](./MCP_SETUP.md)

---

## 🌐 多語言支援

| 語言 | 代碼 | 狀態 |
|------|------|------|
| 🇺🇸 English | en-US | ✅ 預設 |
| 🇨🇳 简体中文 | zh-CN | ✅ |
| 🇹🇼 繁體中文 | zh-TW | ✅ |
| 🇯🇵 日本語 | ja-JP | ✅ |

透過右上角的語言選擇器切換語言。

---

## 📊 版本歷史

### v3.6 (2026-01-20) - 後端並發優化與限流

**⚡ 效能優化：**
- ✅ 使用 ThreadPoolExecutor 實現非阻塞推理
- ✅ asyncio.Semaphore 並發控制（OCR: 1, PDF: 2）
- ✅ 佇列系統，支援 MAX_OCR_QUEUE_SIZE 和動態狀態
- ✅ 按 IP 和客戶端 ID 限流（X-Client-ID 標頭）
- ✅ 429 錯誤處理（佇列滿、客戶端限制、IP 限制）
- ✅ 健康指示器，3 種狀態顏色（綠/黃/紅）
- ✅ OCR 佇列彈窗，即時顯示位置

**🙏 貢獻者：** [@cloudman6](https://github.com/cloudman6) ([PR #41](https://github.com/neosun100/DeepSeek-OCR-WebUI/pull/41))

### v3.5 (2026-01-17) - Vue 3 前端

**🎨 全面 UI 重構：**
- ✅ Vue 3 + TypeScript + Naive UI
- ✅ Dexie.js 本地資料庫
- ✅ 即時處理佇列
- ✅ 健康檢查監控
- ✅ E2E 測試覆蓋（Playwright）
- ✅ GitHub 連結整合

**🙏 貢獻者：** [@cloudman6](https://github.com/cloudman6)（164 次提交）

### v3.3.1 (2025-12-16) - BFloat16 修復

- ✅ 修復 RTX 20xx、GTX 10xx GPU 相容性
- ✅ 自動偵測運算能力

### v3.3 (2025-11-05) - Apple Silicon

- ✅ Mac M1/M2/M3/M4 原生 MPS 後端
- ✅ 多平台架構

### v3.2 (2025-11-04) - PDF 支援

- ✅ PDF 上傳和轉換
- ✅ ModelScope 自動回退

---

## 📖 文件

| 文件 | 描述 |
|------|------|
| [API.md](./API.md) | REST API 參考 |
| [MCP_SETUP.md](./MCP_SETUP.md) | MCP 整合指南 |
| [DOCKER_HUB.md](./DOCKER_HUB.md) | Docker 部署 |
| [CHANGELOG.md](./CHANGELOG.md) | 版本歷史 |

---

## 📈 Star 歷史

<div align="center">

[![Star History Chart](https://api.star-history.com/svg?repos=neosun100/DeepSeek-OCR-WebUI&type=Date)](https://star-history.com/#neosun100/DeepSeek-OCR-WebUI&Date)

**⭐ 如果這個專案對你有幫助，請給個 Star！⭐**

</div>

---

## 🤝 貢獻

歡迎貢獻！請：

1. Fork 本倉庫
2. 建立功能分支（`git checkout -b feature/AmazingFeature`）
3. 提交更改（`git commit -m 'Add AmazingFeature'`）
4. 推送到分支（`git push origin feature/AmazingFeature`）
5. 提交 Pull Request

---

## 📄 授權

本專案採用 [MIT 授權](./LICENSE)。

---

## 🙏 致謝

- [DeepSeek-AI](https://github.com/deepseek-ai) - DeepSeek-OCR 模型
- [@cloudman6](https://github.com/cloudman6) - Vue 3 前端開發
- 所有貢獻者和使用者

---

<div align="center">

**由 [neosun100](https://github.com/neosun100) 和 [cloudman6](https://github.com/cloudman6) 用 ❤️ 打造**

DeepSeek-OCR-WebUI v3.6 | © 2026

</div>
