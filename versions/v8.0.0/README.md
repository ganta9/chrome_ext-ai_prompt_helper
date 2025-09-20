# AI Prompt Helper v8.0.0

ChatGPT、Claude、Google Geminiなどの AIチャットサイトでプロンプトテンプレート変数を使った動的プロンプト生成ができるChrome拡張機能です。

## 🆕 v8.0.0の新機能

### プロンプトテンプレート変数システム
```
入力例: [ユーザー名]さんの[業種]について[質問内容]を教えて

→ 変数検出・カスタマイズモーダル表示
→ ユーザー入力: "田中", "IT", "最新トレンド"  
→ 生成結果: "田中さんのITについて最新トレンドを教えて"
```

### Claude.ai専用最適化
- execCommandベースの確実な挿入
- CSP (Content Security Policy) 完全準拠
- React制御システムとの競合回避

### ダークテーマUI
- 目に優しい暗色系デザイン
- リアルタイムプレビュー
- レスポンシブ対応

## インストール

1. Chrome拡張機能管理画面 (chrome://extensions/) を開く
2. 「デベロッパーモード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」でフォルダを選択

## 使い方

### 基本的な使い方
1. AIサイトで右側の📝ボタンをクリック
2. プロンプト一覧からテンプレートを選択
3. 変数が含まれている場合、カスタマイズモーダルが表示
4. 変数に値を入力して「プロンプト生成」

### 変数の書き方
- `[変数名]` 形式で記述
- 日本語、英数字、ハイフン、アンダースコア対応
- 例: `[ユーザー名]`, `[user_name]`, `[質問-内容]`

## 対応サイト

- ✅ ChatGPT (chat.openai.com, chatgpt.com)
- ✅ Claude.ai (claude.ai) **v8.0.0で大幅改善**
- ✅ Google Gemini (gemini.google.com)
- ✅ Microsoft Copilot (copilot.microsoft.com)
- ✅ Perplexity AI (perplexity.ai)
- ✅ Felo AI (felo.ai)
- ✅ NotebookLM (notebooklm.google.com)
- ✅ Grok (grok.com, x.ai)
- ✅ Genspark (genspark.ai)

## 技術仕様

### アーキテクチャ
- **Manifest V3**: 最新のChrome拡張機能規格
- **CSP準拠**: 厳格なContent Security Policy対応
- **Vanilla JavaScript**: React競合回避

### ファイル構成
```
├── src/              # Chrome拡張機能ソース
│   ├── content.js    # メインロジック（変数システム）
│   ├── popup.html    # ポップアップUI
│   ├── popup.js      # ポップアップロジック
│   ├── background.js # サービスワーカー
│   └── styles.css    # スタイルシート
├── icons/            # アイコンファイル
├── manifest.json     # 拡張機能設定
├── index.html        # GitHub Pages用
├── script.js         # GitHub Pages用JS
├── style.css         # GitHub Pages用CSS
├── prompts.json      # プロンプトデータ
└── docs/             # ドキュメント
    ├── spec.md       # 技術仕様書
    └── fails.md      # 失敗事例・学習記録
```

## GitHub Pages連携

設定手順:
1. 拡張機能アイコンをクリック
2. 編集サイトURL: `https://ganta9.github.io/chrome_ext-ai_prompt_helper/`
3. 「接続テスト」→「保存」

## 開発情報

### 変数システム実装
```javascript
// 変数検出正規表現
const regex = /\[([a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s_-]+)\]/g;

// Claude.ai専用挿入
if (site === 'claude') {
  const success = document.execCommand('insertText', false, newText);
  if (success) {
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
```

### セキュリティ
- インラインイベントハンドラー禁止
- innerHTML使用禁止
- createElement + textContent による安全なDOM操作

## バージョン履歴

- **v8.0.0** (2025-09-21): プロンプトテンプレート変数システム、Claude.ai最適化
- v7.0.0: GitHub API連携強化
- v6.0.0: GitHub Pages連携、4フィールド管理
- v5.0.0: フォルダベース管理
- v4.0.0: 改行表示対応

## 既知の制限・対応予定

### 現在の制限
- 変数名の文字種制限あり
- 複雑な変数構造での表示限界
- モバイル画面での操作性制限

### v8.1.0予定機能
- テンプレート共有機能（インポート/エクスポート）
- 変数型拡張（選択肢、日付、数値型）
- バッチ処理（複数プロンプト一括変換）

---

**開発**: Gantaku  
**ライセンス**: MIT  
**リポジトリ**: GitHub (Private)  
**技術サポート**: docs/spec.md, docs/fails.md参照