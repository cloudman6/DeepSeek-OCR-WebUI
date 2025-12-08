# 🔍 DeepSeek-OCR-WebUI
[訪問應用 →](https://deepseek-ocr.aws.xin/)

<div align="center">

**🌐 [English](./README.md) | [简体中文](./README_zh-CN.md) | [繁體中文](./README_zh-TW.md) | [日本語](./README_ja.md)**

[![Version](https://img.shields.io/badge/version-v3.3.3-blue.svg)](./CHANGELOG.md)
[![Docker](https://img.shields.io/badge/docker-supported-brightgreen.svg)](./docker-compose.yml)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Language](https://img.shields.io/badge/languages-4-orange.svg)](#多語言支援)

智慧OCR識別系統 · 批次處理 · 多模式支援 · 邊界框視覺化

[功能特性](#功能特性) • [快速開始](#快速開始) • [版本歷史](#版本歷史) • [文件](#文件) • [貢獻](#貢獻)

</div>

---

## 🎉 重大更新：支援 Apple Silicon！

**🍎 現已完全支援 Mac M1/M2/M3/M4，原生 MPS 加速！**

DeepSeek-OCR-WebUI v3.3 帶來原生 Apple Silicon 支援，讓 Mac 使用者可以在本地執行高效能 OCR：
- ✅ **原生 MPS 後端** - Metal Performance Shaders 加速
- ✅ **簡單安裝** - 一鍵 conda 環境配置
- ✅ **私有部署** - 完全離線執行
- ✅ **快速推理** - M3 Pro 上約 3 秒/張

👉 [跳轉到 Mac 部署指南](#-方式二mac-原生部署apple-silicon)

---

## 📖 簡介

DeepSeek-OCR-WebUI 是一個基於 DeepSeek-OCR 模型的智慧圖像識別 Web 應用，提供直觀的使用者介面和強大的識別功能。

### 🖼️ UI 預覽

<div align="center">

![DeepSeek-OCR-WebUI 介面](./assets/ui_screenshot.3.3.3.png)

**現代化的使用者介面，支援多語言切換、批次處理、邊界框視覺化**

</div>

### 📈 Star 增長曲線

<div align="center">

![Star History Chart](https://api.star-history.com/svg?repos=neosun100/DeepSeek-OCR-WebUI&type=Date)

**Star 增長曲線 - 幫助我們成長！⭐**

</div>

### ✨ 核心亮點

- 🎯 **7 種識別模式** - 文件、OCR、圖表、查找、自訂等
- 🖼️ **邊界框視覺化** - Find 模式自動標註位置
- 📦 **批次處理** - 支援多張圖片逐一識別
- 📄 **PDF 支援** - 上傳 PDF 檔案，自動轉換為圖片
- 🎨 **現代化 UI** - 炫酷的漸變背景和動畫效果
- 🌐 **多語言支援** - 簡體中文、繁體中文、英語、日語
- 🍎 **Apple Silicon 支援** - Mac M1/M2/M3/M4 原生 MPS 加速
- 🐳 **Docker 部署** - 一鍵啟動，開箱即用
- ⚡ **GPU 加速** - 基於 NVIDIA GPU 的高效能推理
- 🌏 **ModelScope 自動切換** - HuggingFace 不可用時自動切換

---

## 🚀 功能特性

### 7 種識別模式

| 模式 | 圖示 | 說明 | 適用場景 |
|------|------|------|---------|
| **文件轉Markdown** | 📄 | 保留格式和版面 | 合約、論文、報告 |
| **通用OCR** | 📝 | 提取所有可見文字 | 圖片文字提取 |
| **純文字提取** | 📋 | 純文字不保留格式 | 簡單文字識別 |
| **圖表解析** | 📊 | 識別圖表和公式 | 資料圖表、數學公式 |
| **圖像描述** | 🖼️ | 生成詳細描述 | 圖片理解、無障礙 |
| **查找定位** ⭐ | 🔍 | 查找並標註位置 | 發票欄位定位 |
| **自訂提示** ⭐ | ✨ | 自訂識別需求 | 靈活的識別任務 |

### 📄 PDF 支援（v3.2 新功能）

DeepSeek-OCR-WebUI 現已支援 PDF 檔案上傳！上傳 PDF 檔案後，系統會自動將每一頁轉換為獨立的圖片，並保持後續的所有處理邏輯（OCR識別、批次處理等）。

<div align="center">

![PDF 處理截圖](./images/pdf_processing_screenshot.png)

**PDF 上傳並自動轉換為圖片 - 每頁成為獨立的圖片進行處理**

</div>

**核心功能**：
- **多頁 PDF 轉換**：自動將每頁轉換為獨立的圖片
- **即時進度顯示**：逐頁顯示轉換進度
- **拖曳上傳**：支援拖曳上傳 PDF 檔案
- **Find 模式支援**：Find 模式支援 PDF（自動使用第一頁）
- **格式驗證**：自動檔案類型檢測和錯誤提示
- **無縫整合**：轉換後的圖片與普通圖片遵循相同的處理流程

### 🌏 ModelScope 自動切換（v3.2 新功能）

- **自動切換**：HuggingFace 不可用時自動切換到 ModelScope
- **智慧檢測**：智慧識別網路錯誤和逾時
- **中國友好**：為大陸使用者提供無縫體驗
- **5分鐘逾時**：可設定的模型載入逾時時間

### 🎨 Find 模式特色

**左右分欄版面**：
```
┌──────────────────────┬─────────────────────────────┐
│   左側：操作面板      │    右側：結果展示            │
├──────────────────────┼─────────────────────────────┤
│ 📤 圖片上傳          │ 🖼️ 結果圖片（帶邊界框）      │
│ 🎯 查找詞輸入        │ 📊 統計資訊                  │
│ 🚀 操作按鈕          │ 📝 識別文字                  │
│                      │ 📦 匹配項列表                 │
└──────────────────────┴─────────────────────────────┘
```

**邊界框視覺化**：
- 🟢 彩色霓虹邊框自動標註
- 🎨 6 種顏色循環顯示
- 📍 精確的座標定位
- 🔄 響應式自動重繪

**功能演示**：

<div align="center">

![Find模式演示](./assets/find_mode_screenshot.png)

**查找定位模式實際效果：左側上傳操作，右側自動圈選標註**

</div>

---

## 🌐 多語言支援

### 支援的語言

- 🇨🇳 **簡體中文** (zh-CN)
- 🇹🇼 **繁體中文** (zh-TW)
- 🇺🇸 **English** (en-US) - 預設
- 🇯🇵 **日本語** (ja-JP)

### 如何切換語言

**Web UI**：
1. 點擊右上角的語言選擇器
2. 選擇你需要的語言
3. 介面立即切換，設定自動儲存

---

## 📦 快速開始

### 前置要求

**Docker 部署（推薦）**：
- Docker & Docker Compose
- NVIDIA GPU + 驅動程式（用於 GPU 加速）
- 8GB+ RAM
- 20GB+ 磁碟空間

**Mac（Apple Silicon）**：
- macOS 系統，Apple Silicon 晶片（M1/M2/M3/M4）
- Python 3.11+
- 16GB+ RAM（推薦）
- 20GB+ 磁碟空間

**Linux（原生部署）**：
- Python 3.11+
- NVIDIA GPU + CUDA（可選，用於加速）
- 8GB+ RAM
- 20GB+ 磁碟空間

---

### 🐳 方式一：Docker 部署（Linux/Windows）

**適用於**：Linux 伺服器（帶 NVIDIA GPU）、生產環境

```bash
# 1. 複製儲存庫
git clone https://github.com/neosun100/DeepSeek-OCR-WebUI.git
cd DeepSeek-OCR-WebUI

# 2. 啟動服務
docker compose up -d

# 3. 等待模型載入（約 1-2 分鐘）
docker logs -f deepseek-ocr-webui

# 4. 訪問 Web UI
# http://localhost:8001
```

---

### 🍎 方式二：Mac 原生部署（Apple Silicon）

**適用於**：Mac M1/M2/M3/M4 使用者、本地開發

**⚠️ 重要**：必須使用 conda 虛擬環境，避免相依性衝突。

#### 步驟 1：安裝相依套件

```bash
# 複製儲存庫
git clone https://github.com/neosun100/DeepSeek-OCR-WebUI.git
cd DeepSeek-OCR-WebUI

# 建立並啟用 conda 環境（必需）
conda create -n deepseek-ocr-mlx python=3.11
conda activate deepseek-ocr-mlx

# 安裝 PyTorch（支援 MPS）
pip install torch torchvision

# 安裝必需的套件
pip install transformers==4.46.3 tokenizers==0.20.3
pip install fastapi uvicorn PyMuPDF Pillow
pip install einops addict easydict matplotlib

# 或一次性安裝所有相依套件
pip install -r requirements-mac.txt

# 驗證安裝（可選）
./verify_mac_env.sh
```

#### 步驟 2：啟動服務

```bash
# 重要：每次啟動前必須先啟用 conda 環境
conda activate deepseek-ocr-mlx

# 啟動服務（自動檢測 MPS 後端）
./start.sh

# 或手動啟動
python web_service_unified.py
```

#### 步驟 3：訪問 Web UI

在瀏覽器中開啟：`http://localhost:8001`

**注意**：首次執行會下載約 7GB 的模型，請耐心等待。

---

### 🐧 方式三：Linux 原生部署

**適用於**：Linux 伺服器、自訂設定

#### 有 NVIDIA GPU：

```bash
# 安裝 PyTorch（CUDA 版本）
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# 安裝相依套件
pip install transformers==4.46.3 tokenizers==0.20.3
pip install fastapi uvicorn PyMuPDF Pillow
pip install einops addict easydict matplotlib

# 啟動服務（自動檢測 CUDA 後端）
./start.sh
```

#### 無 GPU（僅 CPU）：

```bash
# 安裝 PyTorch（CPU 版本）
pip install torch torchvision

# 安裝相依套件
pip install transformers==4.46.3 tokenizers==0.20.3
pip install fastapi uvicorn PyMuPDF Pillow
pip install einops addict easydict matplotlib

# 啟動服務（自動檢測 CPU 後端）
./start.sh
```

---

### ✅ 驗證安裝

```bash
# 檢查容器狀態（Docker）
docker compose ps

# 檢查健康狀態
curl http://localhost:8001/health

# 預期回應：
# {
#   "status": "healthy",
#   "backend": "mps",  # 或 "cuda" 或 "cpu"
#   "platform": "Darwin",  # 或 "Linux"
#   "model_loaded": true
# }
```

---

### 🔧 平台檢測

服務會自動檢測您的平台並使用最佳後端：

| 平台 | 後端 | 加速 | 自動檢測 |
|----------|---------|--------------|---------------|
| Mac M1/M2/M3/M4 | MPS | Metal GPU | ✅ 是 |
| Linux + NVIDIA GPU | CUDA | CUDA GPU | ✅ 是 |
| Linux（僅 CPU） | CPU | 無 | ✅ 是 |
| Docker | CUDA | CUDA GPU | ✅ 是 |

**強制指定後端**（可選）：
```bash
FORCE_BACKEND=mps ./start.sh   # 強制 MPS（僅 Mac）
FORCE_BACKEND=cuda ./start.sh  # 強制 CUDA（Linux+GPU）
FORCE_BACKEND=cpu ./start.sh   # 強制 CPU（任何平台）
```

---

## 📊 版本歷史

### v3.3 (2025-11-05) - Apple Silicon 支援與多平台架構

**🍎 Apple Silicon 支援**：
- ✅ Mac M1/M2/M3/M4 原生 MPS（Metal Performance Shaders）後端
- ✅ 自動平台檢測和後端選擇
- ✅ 針對 MPS 相容性最佳化的 float32 精度
- ✅ 約 7GB 模型，支援自動下載和快取

**🌍 多平台架構**：
- ✅ 統一的後端介面（MPS/CUDA/CPU）
- ✅ 智慧平台檢測（Mac/Linux/Docker）
- ✅ 獨立的後端實作（互不衝突）
- ✅ 通用啟動指令碼（`./start.sh`）

**🔧 技術改進**：
- ✅ 模型版本：`1e3401a3d4603e9e71ea0ec850bfead602191ec4`（MPS 支援）
- ✅ Transformers 4.46.3 相容性
- ✅ 修復 LlamaFlashAttention2 匯入問題
- ✅ 跨平台統一的模型推理介面

**📚 文件**：
- ✅ 多平台部署指南
- ✅ 平台相容性文件
- ✅ 驗證工具（`verify_platform.sh`）

---

### v3.2 (2025-11-04) - PDF 支援與 ModelScope 自動切換

**📄 新功能**：
- ✅ PDF 上傳支援（自動轉換為圖片）
- ✅ 多頁 PDF 轉換，即時進度顯示
- ✅ 拖曳上傳 PDF 支援
- ✅ ModelScope 自動切換（HuggingFace 不可用時）
- ✅ 智慧網路錯誤檢測和重試

**🐛 Bug 修復**：
- ✅ 修復 PDF 轉換進度日誌
- ✅ 修復按鈕文字重複的國際化問題
- ✅ 修復系統初始化日誌資訊

**🔧 技術改進**：
- ✅ 整合 PyMuPDF 進行高品質 PDF 轉換（144 DPI）
- ✅ 非同步 PDF 處理，即時進度顯示
- ✅ 增強錯誤處理和日誌記錄

---

### v3.1 (2025-10-22) - 多語言與 Bug 修復

**🌐 新功能**：
- ✅ 新增多語言支援（簡體中文、繁體中文、英語、日語）
- ✅ 語言選擇器 UI 元件
- ✅ 本地化持久化儲存
- ✅ 多語言文件（README）

**🐛 Bug 修復**：
- ✅ 修復模式切換問題
- ✅ 修復邊界框超出圖片邊界
- ✅ 最佳化圖片容器版面
- ✅ 新增渲染延遲確保對齊

**🎨 UI 最佳化**：
- ✅ 圖片置中顯示
- ✅ 邊界框響應式重繪
- ✅ 語言切換器整合

---

### v3.0 (2025-10-22) - Find 模式與左右分欄

**✨ 重大更新**：
- ✅ 全新 Find 模式（查找定位）
- ✅ 左右分欄專用版面
- ✅ Canvas 邊界框視覺化
- ✅ 彩色霓虹標註效果

**🔧 技術改進**：
- ✅ transformers 引擎（取代 vLLM）
- ✅ 精確的座標轉換演算法
- ✅ 響應式設計最佳化

---

## 📖 文件

### 使用者文件

- 📘 [快速開始指南](./QUICK_START.md)
- 📗 [Find 模式指南](./FIND_MODE_V2_GUIDE.md)
- 📙 [增強功能](./ENHANCED_FEATURES.md)
- 📕 [Bug 修復總結](./BUGFIX_SUMMARY.md)

### 技術文件

- 🔌 [完整 API 文件](./API.md) - **REST API 使用指南、多語言客戶端範例、最佳實踐**
- 🔧 [部署總結](./DEPLOYMENT_SUMMARY.md)
- 📝 [更新日誌](./CHANGELOG.md)
- 🌐 [國際化實作](./I18N_IMPLEMENTATION.md)

---

## 🎯 使用範例

### Find 模式範例

```bash
場景：在發票中查找 "Total" 金額

步驟：
1. 選擇 "🔍 查找定位" 模式
2. 上傳發票圖片
3. 輸入查找詞：Total
4. 點擊 "🚀 開始查找"

結果：
✓ 圖片上 "Total" 被綠色邊框標註
✓ 顯示找到 1-2 個匹配項
✓ 提供精確的座標資訊
```

### 批次處理範例

```bash
場景：批次識別 20 張合約

步驟：
1. 選擇 "📄 文件轉Markdown" 模式
2. 拖曳上傳 20 張圖片
3. 調整順序（可選）
4. 點擊 "🚀 開始識別"

結果：
✓ 逐一處理每張圖片
✓ 即時顯示進度
✓ 自動合併所有結果
✓ 一鍵複製或下載
```

---

## 🔧 設定

### 環境變數

```bash
# docker-compose.yml
API_HOST=0.0.0.0              # 監聽位址
MODEL_NAME=deepseek-ai/DeepSeek-OCR  # 模型名稱
CUDA_VISIBLE_DEVICES=0        # GPU 裝置
```

### 效能調校

```yaml
# 記憶體設定
shm_size: "8g"                # 共享記憶體

# GPU 設定
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu]
```

---

## 🤝 貢獻

歡迎貢獻！請查看 [貢獻指南](./CONTRIBUTING.md)。

### 如何貢獻

1. Fork 本儲存庫
2. 建立特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改動 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

---

## 📞 支援

### 遇到問題？

1. 查看 [故障排查](./TROUBLESHOOTING.md)
2. 查看 [已知問題](./KNOWN_ISSUES.md)
3. 提交 [Issue](https://github.com/neosun100/DeepSeek-OCR-WebUI/issues)

### 功能建議？

1. 查看 [路線圖](./ROADMAP.md)
2. 提交 [Feature Request](https://github.com/neosun100/DeepSeek-OCR-WebUI/issues/new?template=feature_request.md)

---

## 📱 關注我們

<div align="center">

![掃碼關注](./assets/qrcode_promo.png)

**掃碼獲取更多資訊**

</div>

---

## 📄 授權條款

本專案採用 [MIT License](./LICENSE) 開源協議。

---

## 🙏 致謝

- [DeepSeek-AI](https://github.com/deepseek-ai) - DeepSeek-OCR 模型
- [deepseek_ocr_app](https://github.com/rdumasia303/deepseek_ocr_app) - 參考專案
- 所有貢獻者和使用者

---

## 🔗 相關連結

- 🏠 [專案首頁](https://github.com/neosun100/DeepSeek-OCR-WebUI)
- 📖 [完整文件](https://github.com/neosun100/DeepSeek-OCR-WebUI/wiki)
- 🐛 [問題追蹤](https://github.com/neosun100/DeepSeek-OCR-WebUI/issues)
- 💬 [討論區](https://github.com/neosun100/DeepSeek-OCR-WebUI/discussions)

---

<div align="center">

**⭐ 如果這個專案對你有幫助，請給一個 Star！⭐**

Made with ❤️ by [neosun100](https://github.com/neosun100)

DeepSeek-OCR-WebUI v3.3 | © 2025

</div>
