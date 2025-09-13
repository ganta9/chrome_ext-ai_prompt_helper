# AI Prompt Helper v6.0.0

ChatGPT、Claude、Google Gemini などの AI チャットサイトでプロンプトサンプルを簡単に選択・入力できる Chrome 拡張機能です。

## 🆕 v6.0.0 新機能

### GitHub Pages連携プロンプト管理システム
- **プロンプト編集サイト**: GitHub Pagesで動作する美しい管理画面
- **リアルタイム同期**: 編集サイトで変更 → Chrome拡張機能で即座に利用可能
- **4項目管理**: タイトル・プロンプト・メモ・タグの柔軟な管理
- **タグベース分類**: カテゴリに縛られない自由な分類システム

### 新しいUI/UX
- **固定ボタン**: 画面右端の美しいフローティングボタン
- **ダークテーマ**: 目に優しいモダンなデザイン
- **レスポンシブ対応**: PC・タブレット・モバイル完全対応
- **直感的操作**: クリック → 選択 → 自動挿入の簡単フロー

## 📋 システム構成

```
AI Prompt Helper v6.0.0
├── Chrome拡張機能 (メイン)
│   ├── 固定ボタン (画面右端)
│   ├── GitHub Pages連携
│   └── 設定画面 (popup.html)
└── GitHub Pages編集サイト
    ├── プロンプト管理画面
    ├── 追加・編集・削除機能
    ├── タグ管理・検索機能
    └── Chrome拡張機能との連携
```

## 🚀 使い方

### 1. セットアップ
1. Chrome拡張機能をインストール
2. 拡張機能のアイコンをクリックして設定画面を開く
3. GitHub Pages編集サイトのURLを設定
4. 「接続テスト」で動作確認

### 2. プロンプト管理
1. 「編集サイトを開く」ボタンでGitHub Pages管理画面を開く
2. 「+ プロンプト追加」でプロンプトを作成
3. タイトル・プロンプト本文・メモ・タグを入力
4. 保存してデータをローカルストレージに保存

### 3. プロンプト使用
1. ChatGPT、Claude、Gemini等のサイトを開く
2. 画面右端の📝ボタンをクリック
3. GitHub Pages編集サイトが開く
4. 使いたいプロンプトの「選択」ボタンをクリック
5. 自動でAIサイトの入力欄にプロンプトが挿入される

## 🎯 対応サイト

- **ChatGPT** (chat.openai.com, chatgpt.com)
- **Claude** (claude.ai)
- **Google Gemini/Bard** (gemini.google.com)
- **Microsoft Copilot** (copilot.microsoft.com)
- **Perplexity AI** (perplexity.ai)

## 📊 データ構造

```json
{
  "version": "6.0.0",
  "lastUpdated": "2025-01-XX",
  "prompts": [
    {
      "id": 1,
      "title": "プロンプトタイトル",
      "prompt": "実際のプロンプト本文...",
      "memo": "使用方法・コツ・改善履歴",
      "tags": ["AI", "翻訳", "コード"]
    }
  ]
}
```

## 🛠️ 技術仕様

### Chrome拡張機能
- **Manifest Version**: 3
- **権限**: activeTab, storage
- **技術**: Vanilla JavaScript, CSS3
- **対応**: クロスサイト、レスポンシブデザイン

### GitHub Pages編集サイト
- **技術**: HTML5 + CSS3 + Vanilla JavaScript
- **デザイン**: ダークテーマ、カードベースUI
- **機能**: CRUD操作、検索、フィルタリング、JSONダウンロード
- **データ保存**: localStorage (将来的にGitHub API連携予定)

## 📁 プロジェクト構造

```
versions/v6.0.0/
├── manifest.json              # Chrome拡張機能設定
├── src/                       # Chrome拡張機能
│   ├── content.js            # メインスクリプト
│   ├── popup.html            # 設定画面
│   ├── popup.js              # 設定画面機能
│   └── styles.css            # スタイル定義
├── github-pages-site/         # GitHub Pages編集サイト
│   ├── index.html            # メイン画面
│   ├── style.css             # スタイル定義
│   └── script.js             # 機能実装
├── icons/                     # アイコンファイル
└── docs/                      # 仕様書・ドキュメント
```

## 🔧 開発者向け情報

### Chrome拡張機能の開発・テスト
1. chrome://extensions/ を開く
2. 「デベロッパーモード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」で `versions/v6.0.0/` を選択
4. 対象サイトで動作確認

### GitHub Pages編集サイトの開発・テスト
1. `versions/v6.0.0/github-pages-site/index.html` をブラウザで開く
2. ローカルストレージベースでデータ管理
3. Chrome拡張機能との連携テストはローカルサーバー推奨

### デバッグ機能
- **Chrome拡張機能**: `window.promptHelper` でデバッグ
- **編集サイト**: `window.promptHelper` でデバッグ
- **詳細ログ**: コンソールで動作状況を確認

## 🚦 今後の拡張予定

### Phase 1 (v6.1.0)
- GitHub API連携によるクラウド同期
- プロンプトの使用統計・履歴機能
- プロンプト共有機能

### Phase 2 (v6.2.0)
- AI別プロンプト最適化機能
- プロンプトテンプレート機能
- キーボードショートカット対応

### Phase 3 (v6.3.0)
- チーム共有機能
- プロンプト評価・レーティング
- 高度な検索・フィルタリング

## 📞 サポート

- **GitHub Issues**: バグレポート・機能リクエスト
- **Wiki**: 詳細な使い方ガイド
- **Discussions**: コミュニティサポート

## 📄 ライセンス

MIT License

## 🤝 貢献

プルリクエスト歓迎！詳細は CONTRIBUTING.md を参照してください。

---

**AI Prompt Helper v6.0.0** - より効率的で柔軟なプロンプト管理を実現