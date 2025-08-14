# AI Prompt Helper

ChatGPT、Claude、Google Gemini などの AI チャットサイトでプロンプトサンプルを簡単に選択・入力できる Chrome 拡張機能です。

## 🚀 最新版: Ver4.0.0

**改行表示機能を搭載した改良版**
- **改行機能**: Claude.aiとChatGPTで改行が正しく表示される
- **サイト別最適化**: 各AIサイトに最適化されたアプローチを採用
- **安定版並存**: Ver3.0.0（安定版）とVer4.0.0（改行機能版）を併用可能
- **互換性維持**: 全対応サイトで動作を確認済み

## 📦 インストール・使用方法

### 1. Chrome拡張機能のインストール

**Ver4.0.0（改行機能版） - 推奨**
1. `versions/v4.0.0/` フォルダをダウンロード
2. Chrome の拡張機能管理画面 (chrome://extensions/) を開く
3. 「デベロッパーモード」を有効化
4. 「パッケージ化されていない拡張機能を読み込む」で `versions/v4.0.0/` フォルダを選択

**Ver3.0.0（安定版）**
- 改行機能は不要で安定性を重視する場合は `versions/v3.0.0/` を使用

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
    ├── v3.0.0/                # 自動更新版（安定版）
    └── v4.0.0/                # 改行機能版（最新）
        ├── README.md          # 詳細な使用方法
        ├── manifest.json      # Chrome拡張設定
        ├── src/              # メインソースコード
        ├── prompts/          # プロンプトファイル群
        └── scripts/          # 自動更新スクリプト
```

## 📋 各バージョンの特徴

| バージョン | 管理方式 | 特徴 |
|-----------|----------|------|
| **v4.0.0** | 改行機能版 | Claude.ai・ChatGPTで改行表示対応 |
| **v3.0.0** | 自動更新（安定版） | ダブルクリック実行、完全自動化 |
| v2.0.0 | フォルダベース | 3階層構造、手動コード更新 |
| v1.0.0 | JSON形式 | 単一ファイル管理、シンプル |

## 🚀 Ver4.0.0 改行機能について

**改行機能の特徴:**
- **Claude.ai**: 改行が表示される（手動コピー&ペーストより少ないが大幅改善）
- **ChatGPT**: 完全な改行表示
- **Gemini等**: Ver3.0.0と同じ動作（安定）

**新しいプロンプトを追加したい場合:**

1. **プロンプトファイル追加**
   ```
   versions/v4.0.0/prompts/001_事前設定/001_基本設定/004_新しいプロンプト.txt
   ```

2. **自動更新実行**
   ```
   versions/v4.0.0/scripts/update-prompts.command をダブルクリック（macOS）
   versions/v4.0.0/scripts/update-prompts.bat をダブルクリック（Windows）
   ```

3. **Chrome拡張再インストール**
   - Chrome拡張機能を削除
   - `versions/v4.0.0/` フォルダで再インストール

## 📖 詳細ドキュメント

- **Ver4.0.0詳細**: [`versions/v4.0.0/README.md`](versions/v4.0.0/README.md)
- **Ver3.0.0詳細**: [`versions/v3.0.0/README.md`](versions/v3.0.0/README.md)
- **バージョン情報**: [`VERSION_INFO.md`](VERSION_INFO.md)
- **開発者向け**: [`CLAUDE.md`](CLAUDE.md)
- **失敗事例・学習記録**: [`versions/v4.0.0/docs/fails.md`](versions/v4.0.0/docs/fails.md)

## 🎯 推奨使用バージョン

**Ver4.0.0** を推奨します：
- ✅ Claude.ai・ChatGPTで改行表示
- ✅ 全対応サイトで動作確認済み
- ✅ 自動更新機能搭載
- ✅ Ver3.0.0の全機能を継承

**Ver3.0.0（安定版）** も引き続き利用可能：
- ✅ 改行機能不要の場合
- ✅ 最大限の安定性を重視する場合