# AI Prompt Helper v6.0.0

ChatGPT、Claude、Google Gemini などの AI チャットサイトでプロンプトサンプルを簡単に選択・入力できる Chrome 拡張機能です。

## 🚀 最新版: Ver6.0.0

**GitHub Pages連携プロンプト管理機能を搭載**
- **📝 高機能エディター**: 4フィールド管理（タイトル、プロンプト、メモ、タグ）
- **🌐 GitHub Pages連携**: ブラウザ内でプロンプトを編集・管理
- **🎨 モダンUI**: ダークテーマの直感的インターフェース
- **📱 レスポンシブ**: デスクトップ・タブレット・モバイル対応
- **🔒 セキュア通信**: postMessage APIによる安全な拡張機能連携
- **🔍 高度検索**: タグフィルタリング・テキスト検索

## 📦 インストール・使用方法

### 1. Chrome拡張機能のインストール

1. このリポジトリをクローンまたはダウンロード
2. Chrome の拡張機能管理画面 (chrome://extensions/) を開く
3. 「デベロッパーモード」を有効化
4. 「パッケージ化されていない拡張機能を読み込む」でプロジェクトルートフォルダを選択

### 2. GitHub Pages編集サイトの設定

1. 拡張機能のアイコンをクリック
2. 編集サイトURL欄に `https://ganta9.github.io/chrome_ext-ai_prompt_helper/` を入力
3. 「接続テスト」をクリックして接続を確認
4. 「保存」をクリック

### 3. 使用方法

1. **AI サイトにアクセス**（ChatGPT、Claude、Gemini等）
2. **右側の📝ボタンをクリック**
3. **右側パネルで編集**：
   - プロンプトの追加・編集・削除
   - タグによる分類・検索
   - メモの追加
4. **プロンプト選択**で入力欄に自動挿入

## 🌍 対応サイト

- **ChatGPT** (chat.openai.com, chatgpt.com)
- **Claude** (claude.ai)
- **Google Gemini/Bard** (gemini.google.com, bard.google.com)
- **Microsoft Copilot** (copilot.microsoft.com)
- **Perplexity AI** (perplexity.ai)
- **Felo AI** (felo.ai)
- **NotebookLM** (notebooklm.google.com)
- **Grok** (grok.com, x.ai)
- **Genspark** (genspark.ai)

## 🛠 技術仕様

### アーキテクチャ
- **Chrome Extension**: Manifest V3
- **GitHub Pages**: 静的サイトホスティング
- **通信**: postMessage API
- **データ保存**: localStorage（ブラウザローカル）
- **スタイル**: CSS カスタムプロパティ、ダークテーマ

### ファイル構成
```
chrome_ext-ai_prompt_helper/
├── src/                    # Chrome拡張機能メインファイル
│   ├── content.js         # コンテンツスクリプト
│   ├── popup.html         # 設定ポップアップ
│   ├── popup.js           # 設定ロジック
│   └── styles.css         # 拡張機能スタイル
├── docs/                   # GitHub Pages編集サイト
│   ├── index.html         # エディターUI
│   ├── script.js          # エディターロジック
│   └── style.css          # エディタースタイル
├── icons/                  # 拡張機能アイコン
├── manifest.json           # Chrome拡張機能設定
└── versions/               # 過去バージョン履歴
```

## 📋 データ構造

プロンプトデータは以下の4フィールドで管理：

```javascript
{
  title: "プロンプトタイトル",
  prompt: "実際のプロンプト本文",
  memo: "説明・メモ",
  tags: ["タグ1", "タグ2"]
}
```

## 🔧 開発・カスタマイズ

### ローカル開発
1. ファイルを編集
2. Chrome拡張機能を再読み込み
3. 変更を確認

### GitHub Pagesデプロイ
1. `docs/` フォルダの変更をコミット
2. GitHub リポジトリにプッシュ
3. GitHub Pages設定で `/docs` フォルダを指定

### 新しいAIサイト対応
1. `manifest.json` の `matches` に URL パターンを追加
2. `src/content.js` の `detectAISite()` に判定ロジックを追加
3. `findTextarea()` に対象サイトのセレクターを追加

## 📈 バージョン履歴

- **v6.0.0** (2024-09-13): GitHub Pages連携、4フィールド管理、モダンUI
- **v5.0.0**: フォルダベース管理システム、自動更新機能
- **v4.0.0**: 改行表示機能対応
- **v3.0.0**: 3階層プロンプト管理、対応サイト拡張

## 🤝 コントリビューション

1. Fork this repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 ライセンス

MIT License

## 🔗 関連リンク

- **GitHub Pages編集サイト**: https://ganta9.github.io/chrome_ext-ai_prompt_helper/
- **リポジトリ**: https://github.com/ganta9/chrome_ext-ai_prompt_helper
- **Issues**: https://github.com/ganta9/chrome_ext-ai_prompt_helper/issues

---

**🧑‍💻 Generated with Claude Code (claude.ai/code)**