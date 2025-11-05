# 🔍 DeepSeek-OCR-WebUI
[アプリケーションにアクセス →](https://deepseek-ocr.aws.xin/)

<div align="center">

**🌐 [English](./README.md) | [简体中文](./README_zh-CN.md) | [繁體中文](./README_zh-TW.md) | [日本語](./README_ja.md)**

[![Version](https://img.shields.io/badge/version-v3.3-blue.svg)](./CHANGELOG.md)
[![Docker](https://img.shields.io/badge/docker-supported-brightgreen.svg)](./docker-compose.yml)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Language](https://img.shields.io/badge/languages-4-orange.svg)](#多言語サポート)

インテリジェントOCRシステム · バッチ処理 · マルチモードサポート · バウンディングボックス可視化

[機能](#機能) • [クイックスタート](#クイックスタート) • [バージョン履歴](#バージョン履歴) • [ドキュメント](#ドキュメント) • [貢献](#貢献)

</div>

---

## 🎉 重要なアップデート：Apple Silicon対応！

**🍎 Mac M1/M2/M3/M4をネイティブMPSアクセラレーションで完全サポート！**

DeepSeek-OCR-WebUI v3.3はネイティブApple Siliconサポートを提供し、Macユーザーがローカルで高性能OCRを実行できるようになりました：
- ✅ **ネイティブMPSバックエンド** - Metal Performance Shadersアクセラレーション
- ✅ **簡単セットアップ** - ワンコマンドconda環境インストール
- ✅ **プライベートデプロイ** - 完全オフライン実行
- ✅ **高速推論** - M3 Proで約3秒/画像

👉 [Macデプロイガイドへジャンプ](#-オプション2macネイティブデプロイapple-silicon)

---

## 📖 はじめに

DeepSeek-OCR-WebUIは、DeepSeek-OCRモデルに基づくインテリジェントな画像認識Webアプリケーションで、直感的なユーザーインターフェースと強力な認識機能を提供します。

### 🖼️ UIプレビュー

<div align="center">

![DeepSeek-OCR-WebUI インターフェース](./assets/ui_screenshot.png)

**多言語サポート、バッチ処理、バウンディングボックス可視化を備えたモダンなユーザーインターフェース**

</div>

### 📈 Star履歴

<div align="center">

![Star History Chart](https://api.star-history.com/svg?repos=neosun100/DeepSeek-OCR-WebUI&type=Date)

**Star成長曲線 - 成長を支援してください！⭐**

</div>

### ✨ コアハイライト

- 🎯 **7つの認識モード** - ドキュメント、OCR、チャート、検索、カスタムなど
- 🖼️ **バウンディングボックス可視化** - Findモードで位置を自動アノテーション
- 📦 **バッチ処理** - 複数画像の順次認識をサポート
- 📄 **PDFサポート** - PDFファイルをアップロードし、自動的に画像に変換
- 🎨 **モダンUI** - クールなグラデーション背景とアニメーション効果
- 🌐 **多言語サポート** - 簡体字中国語、繁体字中国語、英語、日本語
- 🍎 **Apple Siliconサポート** - Mac M1/M2/M3/M4ネイティブMPSアクセラレーション
- 🐳 **Dockerデプロイ** - ワンクリック起動、すぐに使用可能
- ⚡ **GPUアクセラレーション** - NVIDIA GPUベースの高性能推論
- 🌏 **ModelScope自動切り替え** - HuggingFaceが利用できない場合に自動切り替え

---

## 🚀 機能

### 7つの認識モード

| モード | アイコン | 説明 | 使用例 |
|------|------|------|---------|
| **ドキュメントからMarkdown** | 📄 | フォーマットとレイアウトを保持 | 契約書、論文、レポート |
| **一般OCR** | 📝 | すべての可視テキストを抽出 | 画像テキスト抽出 |
| **プレーンテキスト** | 📋 | フォーマットなしの純粋なテキスト | シンプルなテキスト認識 |
| **チャートパーサー** | 📊 | チャートと数式を認識 | データチャート、数式 |
| **画像説明** | 🖼️ | 詳細な説明を生成 | 画像理解、アクセシビリティ |
| **検索と位置特定** ⭐ | 🔍 | 検索して位置をアノテーション | 請求書フィールドの位置特定 |
| **カスタムプロンプト** ⭐ | ✨ | 認識ニーズをカスタマイズ | 柔軟な認識タスク |

### 📄 PDFサポート（v3.2の新機能）

DeepSeek-OCR-WebUIはPDFファイルのアップロードをサポートするようになりました！PDFファイルをアップロードすると、システムは各ページを個別の画像に自動変換し、後続のすべての処理ロジック（OCR認識、バッチ処理など）を維持します。

<div align="center">

![PDF処理スクリーンショット](./images/pdf_processing_screenshot.png)

**PDFアップロードと自動画像変換 - 各ページが個別の画像として処理されます**

</div>

**主な機能**：
- **複数ページPDF変換**：各ページを自動的に個別の画像に変換
- **リアルタイム進行状況**：ページごとに変換進行状況を表示
- **ドラッグ＆ドロップ**：PDFファイルのドラッグ＆ドロップアップロードをサポート
- **Findモードサポート**：FindモードでPDFをサポート（最初のページを自動使用）
- **フォーマット検証**：自動ファイルタイプ検出とエラープロンプト
- **シームレスな統合**：変換された画像は通常の画像と同じ処理パイプラインに従います

### 🌏 ModelScope自動切り替え（v3.2の新機能）

- **自動切り替え**：HuggingFaceが利用できない場合、ModelScopeに自動切り替え
- **スマート検出**：ネットワークエラーとタイムアウトをインテリジェントに検出
- **中国フレンドリー**：中国本土のユーザーにシームレスな体験を提供
- **5分タイムアウト**：設定可能なモデル読み込みタイムアウト

### 🎨 Findモードの特徴

**左右分割レイアウト**：
```
┌──────────────────────┬─────────────────────────────┐
│   左：コントロールパネル │    右：結果表示              │
├──────────────────────┼─────────────────────────────┤
│ 📤 画像アップロード    │ 🖼️ 結果画像（ボックス付き）  │
│ 🎯 検索入力          │ 📊 統計情報                  │
│ 🚀 アクションボタン   │ 📝 認識テキスト              │
│                      │ 📦 マッチリスト               │
└──────────────────────┴─────────────────────────────┘
```

**バウンディングボックス可視化**：
- 🟢 カラフルなネオンボーダー自動アノテーション
- 🎨 6色のローテーション
- 📍 正確な座標位置
- 🔄 レスポンシブ自動再描画

**機能デモ**：

<div align="center">

![Findモードデモ](./assets/find_mode_screenshot.png)

**検索と位置特定モードの実際の効果：左側でアップロード操作、右側で自動アノテーション結果**

</div>

---

## 🌐 多言語サポート

### サポートされている言語

- 🇨🇳 **簡体字中国語** (zh-CN)
- 🇹🇼 **繁体字中国語** (zh-TW)
- 🇺🇸 **English** (en-US) - デフォルト
- 🇯🇵 **日本語** (ja-JP)

### 言語の切り替え方法

**Web UI**：
1. 右上隅の言語セレクターをクリック
2. 希望の言語を選択
3. インターフェースが即座に切り替わり、設定が自動保存されます

---

## 📦 クイックスタート

### 前提条件

**Dockerデプロイ（推奨）**：
- Docker & Docker Compose
- NVIDIA GPU + ドライバー（GPUアクセラレーション用）
- 8GB以上のRAM
- 20GB以上のディスク容量

**Mac（Apple Silicon）**：
- macOS、Apple Siliconチップ（M1/M2/M3/M4）
- Python 3.11以上
- 16GB以上のRAM（推奨）
- 20GB以上のディスク容量

**Linux（ネイティブデプロイ）**：
- Python 3.11以上
- NVIDIA GPU + CUDA（オプション、アクセラレーション用）
- 8GB以上のRAM
- 20GB以上のディスク容量

---

### 🐳 オプション1：Dockerデプロイ（Linux/Windows）

**最適な用途**：NVIDIA GPUを搭載したLinuxサーバー、本番環境

```bash
# 1. リポジトリをクローン
git clone https://github.com/neosun100/DeepSeek-OCR-WebUI.git
cd DeepSeek-OCR-WebUI

# 2. サービスを起動
docker compose up -d

# 3. モデルの読み込みを待つ（約1〜2分）
docker logs -f deepseek-ocr-webui

# 4. Web UIにアクセス
# http://localhost:8001
```

---

### 🍎 オプション2：Macネイティブデプロイ（Apple Silicon）

**最適な用途**：Mac M1/M2/M3/M4ユーザー、ローカル開発

**⚠️ 重要**：依存関係の競合を避けるため、必ずconda仮想環境を使用してください。

#### ステップ1：依存関係のインストール

```bash
# リポジトリをクローン
git clone https://github.com/neosun100/DeepSeek-OCR-WebUI.git
cd DeepSeek-OCR-WebUI

# conda環境を作成してアクティブ化（必須）
conda create -n deepseek-ocr-mlx python=3.11
conda activate deepseek-ocr-mlx

# PyTorch（MPSサポート）をインストール
pip install torch torchvision

# 必要なパッケージをインストール
pip install transformers==4.46.3 tokenizers==0.20.3
pip install fastapi uvicorn PyMuPDF Pillow
pip install einops addict easydict matplotlib

# または一括で依存関係をインストール
pip install -r requirements-mac.txt

# インストールを確認（オプション）
./verify_mac_env.sh
```

#### ステップ2：サービスの起動

```bash
# 重要：起動前に必ずconda環境をアクティブ化してください
conda activate deepseek-ocr-mlx

# サービスを起動（MPSバックエンドを自動検出）
./start.sh

# または手動で起動
python web_service_unified.py
```

#### ステップ3：Web UIにアクセス

ブラウザで開く：`http://localhost:8001`

**注意**：初回実行時は約7GBのモデルをダウンロードしますので、しばらくお待ちください。

---

### 🐧 オプション3：Linuxネイティブデプロイ

**最適な用途**：Linuxサーバー、カスタム構成

#### NVIDIA GPUあり：

```bash
# PyTorch（CUDA版）をインストール
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# 依存関係をインストール
pip install transformers==4.46.3 tokenizers==0.20.3
pip install fastapi uvicorn PyMuPDF Pillow
pip install einops addict easydict matplotlib

# サービスを起動（CUDAバックエンドを自動検出）
./start.sh
```

#### GPUなし（CPUのみ）：

```bash
# PyTorch（CPU版）をインストール
pip install torch torchvision

# 依存関係をインストール
pip install transformers==4.46.3 tokenizers==0.20.3
pip install fastapi uvicorn PyMuPDF Pillow
pip install einops addict easydict matplotlib

# サービスを起動（CPUバックエンドを自動検出）
./start.sh
```

---

### ✅ インストールの確認

```bash
# コンテナステータスを確認（Docker）
docker compose ps

# ヘルスステータスを確認
curl http://localhost:8001/health

# 期待される応答：
# {
#   "status": "healthy",
#   "backend": "mps",  # または "cuda" または "cpu"
#   "platform": "Darwin",  # または "Linux"
#   "model_loaded": true
# }
```

---

### 🔧 プラットフォーム検出

サービスはプラットフォームを自動検出し、最適なバックエンドを使用します：

| プラットフォーム | バックエンド | アクセラレーション | 自動検出 |
|----------|---------|--------------|---------------|
| Mac M1/M2/M3/M4 | MPS | Metal GPU | ✅ はい |
| Linux + NVIDIA GPU | CUDA | CUDA GPU | ✅ はい |
| Linux（CPUのみ） | CPU | なし | ✅ はい |
| Docker | CUDA | CUDA GPU | ✅ はい |

**特定のバックエンドを強制**（オプション）：
```bash
FORCE_BACKEND=mps ./start.sh   # MPSを強制（Macのみ）
FORCE_BACKEND=cuda ./start.sh  # CUDAを強制（Linux+GPU）
FORCE_BACKEND=cpu ./start.sh   # CPUを強制（任意のプラットフォーム）
```

---

## 📊 バージョン履歴

### v3.3 (2025-11-05) - Apple Siliconサポートとマルチプラットフォーム

**🍎 Apple Siliconサポート**：
- ✅ Mac M1/M2/M3/M4ネイティブMPS（Metal Performance Shaders）バックエンド
- ✅ 自動プラットフォーム検出とバックエンド選択
- ✅ MPS互換性のために最適化されたfloat32精度
- ✅ 約7GBのモデル、自動ダウンロードとキャッシュをサポート

**🌍 マルチプラットフォームアーキテクチャ**：
- ✅ 統一されたバックエンドインターフェース（MPS/CUDA/CPU）
- ✅ スマートプラットフォーム検出（Mac/Linux/Docker）
- ✅ 独立したバックエンド実装（競合なし）
- ✅ ユニバーサル起動スクリプト（`./start.sh`）

**🔧 技術的改善**：
- ✅ モデルリビジョン：`1e3401a3d4603e9e71ea0ec850bfead602191ec4`（MPSサポート）
- ✅ Transformers 4.46.3互換性
- ✅ LlamaFlashAttention2インポート問題の修正
- ✅ プラットフォーム間で統一されたモデル推論インターフェース

**📚 ドキュメント**：
- ✅ マルチプラットフォームデプロイメントガイド
- ✅ プラットフォーム互換性ドキュメント
- ✅ 検証ツール（`verify_platform.sh`）

---

### v3.2 (2025-11-04) - PDFサポートとModelScope自動切り替え

**📄 新機能**：
- ✅ PDFアップロードサポート（自動的に画像に変換）
- ✅ 複数ページPDF変換、リアルタイム進行状況表示
- ✅ ドラッグ＆ドロップPDFアップロード
- ✅ ModelScope自動切り替え（HuggingFace利用不可時）
- ✅ スマートネットワークエラー検出と再試行

**🐛 バグ修正**：
- ✅ PDF変換進行状況ログの修正
- ✅ ボタンテキスト重複の国際化問題の修正
- ✅ システム初期化ログ情報の修正

**🔧 技術的改善**：
- ✅ 高品質PDF変換のためのPyMuPDF統合（144 DPI）
- ✅ リアルタイム進行状況のための非同期PDF処理
- ✅ エラー処理とログ記録の強化

---

### v3.1 (2025-10-22) - 多言語とバグ修正

**🌐 新機能**：
- ✅ 多言語サポートの追加（簡体字中国語、繁体字中国語、英語、日本語）
- ✅ 言語セレクターUIコンポーネント
- ✅ ローカリゼーション永続化ストレージ
- ✅ 多言語ドキュメント（README）

**🐛 バグ修正**：
- ✅ モード切り替え問題の修正
- ✅ バウンディングボックスが画像境界を超える問題の修正
- ✅ 画像コンテナレイアウトの最適化
- ✅ アライメント確保のためのレンダリング遅延の追加

**🎨 UI最適化**：
- ✅ 画像の中央表示
- ✅ バウンディングボックスのレスポンシブ再描画
- ✅ 言語スイッチャーの統合

---

### v3.0 (2025-10-22) - Findモードと左右分割レイアウト

**✨ 主要な更新**：
- ✅ 新しいFindモード（検索と位置特定）
- ✅ 専用の左右分割レイアウト
- ✅ Canvasバウンディングボックス可視化
- ✅ カラフルなネオンアノテーション効果

**🔧 技術的改善**：
- ✅ transformersエンジン（vLLMを置き換え）
- ✅ 正確な座標変換アルゴリズム
- ✅ レスポンシブデザインの最適化

---

## 📖 ドキュメント

### ユーザードキュメント

- 📘 [クイックスタートガイド](./QUICK_START.md)
- 📗 [Findモードガイド](./FIND_MODE_V2_GUIDE.md)
- 📙 [拡張機能](./ENHANCED_FEATURES.md)
- 📕 [バグ修正まとめ](./BUGFIX_SUMMARY.md)

### 技術ドキュメント

- 🔧 [デプロイメントまとめ](./DEPLOYMENT_SUMMARY.md)
- 📝 [変更ログ](./CHANGELOG.md)
- 🌐 [国際化実装](./I18N_IMPLEMENTATION.md)

---

## 🎯 使用例

### Findモードの例

```bash
シナリオ：請求書で「Total」金額を検索

手順：
1. "🔍 検索と位置特定" モードを選択
2. 請求書画像をアップロード
3. 検索語を入力：Total
4. "🚀 検索開始" をクリック

結果：
✓ 画像上の "Total" が緑色の枠で強調表示
✓ 1〜2件のマッチが見つかったことを表示
✓ 正確な座標情報を提供
```

### バッチ処理の例

```bash
シナリオ：20件の契約書をバッチ認識

手順：
1. "📄 ドキュメントからMarkdown" モードを選択
2. 20枚の画像をドラッグ＆ドロップでアップロード
3. 順序を調整（オプション）
4. "🚀 認識開始" をクリック

結果：
✓ 各画像を順次処理
✓ リアルタイムで進行状況を表示
✓ すべての結果を自動マージ
✓ ワンクリックでコピーまたはダウンロード
```

---

## 🔧 設定

### 環境変数

```bash
# docker-compose.yml
API_HOST=0.0.0.0              # リスンアドレス
MODEL_NAME=deepseek-ai/DeepSeek-OCR  # モデル名
CUDA_VISIBLE_DEVICES=0        # GPUデバイス
```

### パフォーマンスチューニング

```yaml
# メモリ設定
shm_size: "8g"                # 共有メモリ

# GPU設定
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu]
```

---

## 🤝 貢献

貢献を歓迎します！[貢献ガイド](./CONTRIBUTING.md)をご確認ください。

### 貢献方法

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを開く

---

## 📞 サポート

### 問題が発生しましたか？

1. [トラブルシューティング](./TROUBLESHOOTING.md)を確認
2. [既知の問題](./KNOWN_ISSUES.md)を確認
3. [Issue](https://github.com/neosun100/DeepSeek-OCR-WebUI/issues)を提出

### 機能の提案？

1. [ロードマップ](./ROADMAP.md)を確認
2. [Feature Request](https://github.com/neosun100/DeepSeek-OCR-WebUI/issues/new?template=feature_request.md)を提出

---

## 📱 フォローする

<div align="center">

![スキャンしてフォロー](./assets/qrcode_promo.png)

**スキャンして詳細情報を取得**

</div>

---

## 📄 ライセンス

このプロジェクトは[MIT License](./LICENSE)の下でライセンスされています。

---

## 🙏 謝辞

- [DeepSeek-AI](https://github.com/deepseek-ai) - DeepSeek-OCRモデル
- [deepseek_ocr_app](https://github.com/rdumasia303/deepseek_ocr_app) - 参考プロジェクト
- すべての貢献者とユーザー

---

## 🔗 関連リンク

- 🏠 [プロジェクトホーム](https://github.com/neosun100/DeepSeek-OCR-WebUI)
- 📖 [完全なドキュメント](https://github.com/neosun100/DeepSeek-OCR-WebUI/wiki)
- 🐛 [問題トラッカー](https://github.com/neosun100/DeepSeek-OCR-WebUI/issues)
- 💬 [ディスカッション](https://github.com/neosun100/DeepSeek-OCR-WebUI/discussions)

---

<div align="center">

**⭐ このプロジェクトが役に立った場合は、Starをください！⭐**

Made with ❤️ by [neosun100](https://github.com/neosun100)

DeepSeek-OCR-WebUI v3.3 | © 2025

</div>
