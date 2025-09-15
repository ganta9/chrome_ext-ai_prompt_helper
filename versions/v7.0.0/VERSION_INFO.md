# AI Prompt Helper v7.0.0 (Final)

## リリース日
2025-09-16

## 📋 最終状態での主要機能
- ✅ **GitHub API自動保存機能**: プロンプト編集時にprompts.jsonへリアルタイム自動保存
- ✅ **Google Sheets機能完全削除**: シンプルなGitHub API単一連携に統一
- ✅ **Chrome拡張機能とGitHub Pages連携**: Token同期によるシームレスな連携
- ✅ **GitHub Pages プロンプト編集機能**: Web UIでのプロンプト作成・編集・削除
- ✅ **31件のプロンプトデータ**: prompts.json形式での一元管理
- ✅ **Claude.ai対応**: Clipboard API + CSP制限回避

## 🏗️ 最終アーキテクチャ

### データフロー
```
GitHub Repository (prompts.json)
    ↕ GitHub API (自動保存)
GitHub Pages (プロンプト編集)
    ↕ Token同期
Chrome拡張機能 (Token設定)
    ↕ chrome.runtime.sendMessage
AIサイト (プロンプト挿入)
```

### 技術スタック
- **GitHub API**: Repository Contents API (prompts.json更新)
- **Chrome Extension**: Manifest V3 + Service Worker
- **GitHub Pages**: 静的ホスティング + Web UI
- **認証**: GitHub Personal Access Token
- **データ同期**: Debounce処理付きリアルタイム保存

## 🔧 使用方法

### 1. Chrome拡張機能でのToken設定
1. Chrome拡張機能のPopupを開く
2. GitHub Personal Access Token を入力・保存
3. 「📤 GitHub Pagesと同期」ボタンでToken送信

### 2. GitHub Pagesでのプロンプト編集
1. https://ganta9.github.io/chrome_ext-ai_prompt_helper/ にアクセス
2. Chrome拡張機能からTokenが自動同期される
3. プロンプト編集時に自動でprompts.jsonに保存

### 3. AIサイトでのプロンプト使用
1. Claude.ai等のAIサイトでChrome拡張機能アイコンをクリック
2. プロンプトを選択して挿入
3. 最新のプロンプトデータが自動取得される

## 🛠️ 技術的改善（v7.0.0開発中）

### 完了した機能
- ✅ **Google Sheets削除**: 不要な複雑性を除去
- ✅ **GitHub API実装**: Repository Contents APIによる直接更新
- ✅ **自動保存**: 1秒Debounce処理付きリアルタイム保存
- ✅ **Token連携**: Chrome拡張機能→GitHub Pages Token同期
- ✅ **CSP対応**: Content Security Policy制限回避
- ✅ **エラーハンドリング**: GitHub API障害時のフォールバック

### GitHub API権限要件
- **Token Type**: GitHub Personal Access Token
- **必要権限**: `Contents: Write` (リポジトリ内容編集)
- **対象リポジトリ**: `ganta9/chrome_ext-ai_prompt_helper`

## 🎯 対応サイト
- ChatGPT (chat.openai.com, chatgpt.com)
- Claude (claude.ai) ← 主要対応サイト
- Google Gemini (gemini.google.com)
- Microsoft Copilot (copilot.microsoft.com)
- その他AIサイト多数

## 🔐 セキュリティ考慮事項
- GitHub Personal Access Tokenは最小権限で設定
- LocalStorage/Chrome Storageでの安全な保存
- HTTPS通信による暗号化
- **将来改善予定**: Token暗号化、より安全な認証方式

## ⚠️ 既知の制限事項
- GitHub API レート制限: 5000回/時間
- 大量の連続編集時のAPI呼び出し集約（Debounce処理で軽減）
- セキュリティ強化は優先順位低（後回し）

## 📊 v7.0.0開発履歴
1. **初期実装**: GitHub Pages連携、prompts.json移行
2. **Google Sheets削除**: 不要機能の除去とコードクリーンアップ
3. **GitHub API実装**: 自動保存機能とエラーハンドリング
4. **Token連携統一**: Chrome拡張機能とGitHub Pagesの完全統合