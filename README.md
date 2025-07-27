# AI Prompt Helper

ChatGPT、Claude、Google Gemini などの AI チャットサイトでプロンプトサンプルを簡単に選択・入力できる Chrome 拡張機能です。

## 🚀 最新版: Ver3.0.0

**革新的な自動更新機能を搭載**
- **ダブルクリック実行**: プロンプトファイルを追加後、自動更新スクリプトを実行するだけ
- **事前定義不要**: 任意の名前のプロンプトファイルを自由に追加可能
- **エラーなし**: 存在するファイルのみを自動検出する安全設計

## 📦 インストール・使用方法

### 1. Chrome拡張機能のインストール
1. `versions/v3.0.0/` フォルダをダウンロード
2. Chrome の拡張機能管理画面 (chrome://extensions/) を開く
3. 「デベロッパーモード」を有効化
4. 「パッケージ化されていない拡張機能を読み込む」で `versions/v3.0.0/` フォルダを選択

### 2. 使用方法
1. 対応AIサイトにアクセス
2. 画面の📝ボタンをクリック
3. カテゴリ→サブカテゴリ→プロンプトの順で選択
4. 自動で入力欄に反映されます

## 🌐 対応サイト

- **ChatGPT** (chat.openai.com, chatgpt.com)
- **Claude** (claude.ai)
- **Google Gemini/Bard** (gemini.google.com, bard.google.com)
- **Microsoft Copilot** (copilot.microsoft.com)
- **Perplexity AI** (perplexity.ai)
- **Felo AI** (felo.ai)
- **NotebookLM** (notebooklm.google.com)
- **Grok** (grok.com, x.ai)
- **Genspark** (genspark.ai)

## 🗂️ プロジェクト構造

```
chrome_ext-ai_prompt_helper/
├── README.md                    # このファイル
├── CLAUDE.md                   # Claude Code用設定
├── VERSION_INFO.md             # バージョン情報
└── versions/                   # バージョン管理
    ├── v1.0.0/                # JSON形式版
    ├── v2.0.0/                # フォルダベース版
    └── v3.0.0/                # 自動更新版（最新）
        ├── README.md          # 詳細な使用方法
        ├── manifest.json      # Chrome拡張設定
        ├── src/              # メインソースコード
        ├── prompts/          # プロンプトファイル群
        └── scripts/          # 自動更新スクリプト
```

## 📋 各バージョンの特徴

| バージョン | 管理方式 | 特徴 |
|-----------|----------|------|
| **v3.0.0** | 自動更新 | ダブルクリック実行、完全自動化 |
| v2.0.0 | フォルダベース | 3階層構造、手動コード更新 |
| v1.0.0 | JSON形式 | 単一ファイル管理、シンプル |

## 🚀 Ver3.0.0 クイックスタート

**新しいプロンプトを追加したい場合:**

1. **プロンプトファイル追加**
   ```
   versions/v3.0.0/prompts/001_基本プロンプト技法/001_Zero-shot/004_新しいプロンプト.txt
   ```

2. **自動更新実行**
   ```
   versions/v3.0.0/scripts/update-prompts.command をダブルクリック（macOS）
   versions/v3.0.0/scripts/update-prompts.bat をダブルクリック（Windows）
   ```

3. **Chrome拡張再インストール**
   - Chrome拡張機能を削除
   - `versions/v3.0.0/` フォルダで再インストール

## 📖 詳細ドキュメント

- **Ver3.0.0詳細**: [`versions/v3.0.0/README.md`](versions/v3.0.0/README.md)
- **バージョン情報**: [`VERSION_INFO.md`](VERSION_INFO.md)
- **開発者向け**: [`CLAUDE.md`](CLAUDE.md)

## 🎯 推奨使用バージョン

**Ver3.0.0** を強く推奨します：
- ✅ 最も簡単な操作（ダブルクリックのみ）
- ✅ エラーなし動作
- ✅ 完全自動化されたワークフロー
- ✅ クロスプラットフォーム対応