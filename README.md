# AI Prompt Helper

AIチャットサイト用のプロンプト管理Chrome拡張機能です。個人的な利用を目的として開発しています。

## 機能

- AIサイト（ChatGPT、Claude、Gemini等）でプロンプトを簡単に挿入
- プロンプトの追加・編集・削除（タイトル、本文、メモ、タグで管理）
- 右側パネルでのプロンプト管理
- GitHub Pagesを使った編集インターフェース

## インストール

1. このリポジトリをダウンロード
2. Chrome拡張機能管理画面 (chrome://extensions/) を開く
3. 「デベロッパーモード」を有効化
4. 「パッケージ化されていない拡張機能を読み込む」でフォルダを選択

## 設定

1. 拡張機能アイコンをクリック
2. 編集サイトURL: `https://ganta9.github.io/chrome_ext-ai_prompt_helper/`
3. 「接続テスト」→「保存」

## 使い方

1. AIサイトで右側の📝ボタンをクリック
2. 右側パネルでプロンプトを管理
3. プロンプトを選択して入力欄に挿入

## 対応サイト

- ChatGPT (chat.openai.com, chatgpt.com)
- Claude (claude.ai)
- Google Gemini/Bard (gemini.google.com, bard.google.com)
- Microsoft Copilot (copilot.microsoft.com)
- Perplexity AI (perplexity.ai)
- Felo AI (felo.ai)
- NotebookLM (notebooklm.google.com)
- Grok (grok.com, x.ai)
- Genspark (genspark.ai)

## ファイル構成

```
├── src/          # Chrome拡張機能
├── docs/         # GitHub Pages編集サイト
├── icons/        # アイコン
├── manifest.json # 拡張機能設定
└── versions/     # 過去バージョン
```

## 開発メモ

- Manifest V3対応
- postMessage APIで通信
- localStorageでデータ保存
- プロジェクトドキュメント: `project-docs/`
- 失敗事例: `docs/fails.md`

## バージョン履歴

- v6.0.0: GitHub Pages連携、4フィールド管理
- v5.0.0: フォルダベース管理
- v4.0.0: 改行表示対応
- v3.0.0: 3階層管理