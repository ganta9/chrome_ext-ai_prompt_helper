# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

このプロジェクトは、ChatGPT、Claude、Google Gemini などの AI チャットサイトでプロンプトサンプルを簡単に選択・入力できる Chrome 拡張機能です。

**Ver3.0.0の特徴**: 自動更新機能とフォルダベースの管理システムにより、技術的知識不要でプロンプトを簡単に追加・管理できます。

## アーキテクチャ

### 主要コンポーネント

- **manifest.json**: Chrome 拡張機能の設定ファイル（Manifest V3）
- **src/content.js**: AI サイト上で動作するメインスクリプト
- **src/styles.css**: プロンプトヘルパー UI のスタイル
- **prompts/**: フォルダベースのプロンプト管理システム（Ver3.0.0）
- **scripts/**: 自動更新スクリプト群（Ver3.0.0）

### Ver3.0.0 動作フロー

1. **サイト検出**: `detectAISite()` が現在のサイトを判定
2. **プロンプト読み込み**: `loadPromptsFromFolders()` がフォルダ構造をスキャン
3. **要素検出**: `findTextarea()` が各サイトの入力欄を特定
4. **UI表示**: `createPromptHelper()` が3階層構造のプロンプトメニューを動的生成
5. **プロンプト挿入**: 選択されたプロンプトを入力欄に自動挿入

### 対応サイト（Ver3.0.0拡張）

- **ChatGPT** (chat.openai.com, chatgpt.com)
- **Claude** (claude.ai)
- **Google Gemini/Bard** (gemini.google.com, bard.google.com)
- **Microsoft Copilot** (copilot.microsoft.com)
- **Perplexity AI** (perplexity.ai)
- **Felo AI** (felo.ai)
- **NotebookLM** (notebooklm.google.com)
- **Grok** (grok.com, x.ai)
- **Genspark** (genspark.ai)

### プロンプトデータ構造（Ver3.0.0）

**フォルダベース管理（3階層）:**
```
prompts/
├── 001_カテゴリ名/
│   ├── 001_サブカテゴリ名/
│   │   ├── 001_プロンプト名.txt
│   │   └── 002_プロンプト名.txt
│   └── 002_サブカテゴリ名/
│       └── 001_プロンプト名.txt
└── 002_カテゴリ名/
    └── 001_サブカテゴリ名/
        └── 001_プロンプト名.txt
```

**内部データ構造:**
```javascript
{
  category: "基本プロンプト技法",
  subcategories: [
    {
      subcategory: "Zero-shot",
      prompts: [
        {
          title: "基本的なタスク指示",
          text: "ファイルから読み込まれたプロンプト内容"
        }
      ]
    }
  ]
}
```

## 開発時の注意点

### Ver3.0.0 特有の考慮事項

#### 自動更新システム
- **重要**: `scanPromptFolders()` 関数は自動生成されるため手動編集禁止
- プロンプト追加後は必ず `scripts/update-prompts.command` を実行
- content.js の更新時は自動バックアップが作成される

#### フォルダ管理ルール
- **命名規則**: 数字接頭語（001_, 002_）を必ず使用
- **階層固定**: カテゴリ/サブカテゴリ/プロンプトファイルの3階層
- **ファイル形式**: .txt ファイルのみ対応

#### プロンプト読み込みフロー
```javascript
loadPromptsFromJSON() →
  loadPromptsFromFolders() →
    scanPromptFolders() →  // 自動生成関数
      removeNumberPrefix() →
        実際のプロンプトファイル読み込み
```

### セレクター戦略（Ver3.0.0拡張）
各 AI サイトの入力欄は異なる実装のため、`findTextarea()` で複数のセレクターを順次試行。Ver3.0.0では対応サイトを大幅拡張し、より多様なセレクターパターンに対応。

### 動的コンテンツ対応
AI サイトは SPA (Single Page Application) が多いため、`MutationObserver` を使用してページ変更を監視し、必要に応じて UI を再初期化。

### イベント処理
プロンプト挿入時は `input` イベントを発火させ、サイト側の JavaScript が正しく動作するよう配慮。

## 拡張機能のインストール

1. Chrome の拡張機能管理画面 (chrome://extensions/) を開く
2. 「デベロッパーモード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」でプロジェクトフォルダを選択

## Ver3.0.0 開発・管理ワークフロー

### 新しいプロンプト追加
1. **プロンプトファイル作成**: `prompts/` 内に適切な階層で作成
2. **自動更新実行**: `scripts/update-prompts.command` をダブルクリック
3. **Chrome拡張再インストール**: 変更を反映

### 新しいAIサイト対応
1. **サイト検出追加**: `detectAISite()` に新しいサイトの判定ロジック追加
2. **セレクター追加**: `findTextarea()` に新しいサイトのセレクター追加
3. **manifest.json更新**: `matches` に新しいサイトのURLパターン追加

### 機能拡張時の考慮事項

#### Ver3.0.0では不要になった作業
- ~~新しいプロンプトカテゴリを追加する場合の `promptSamples` 編集~~ → 自動スキャンで不要
- ~~ハードコードされたファイル名リストの更新~~ → 自動生成で不要

#### Ver3.0.0で必要な作業
- 新しい AI サイトに対応する場合は `manifest.json` の `matches` と `detectAISite()` を更新
- UI の変更は `styles.css` で行い、レスポンシブデザインとダークモード対応を維持
- プロンプト構造変更時は自動更新スクリプトの調整が必要

### デバッグとトラブルシューティング

#### よくある問題と解決方法
1. **プロンプトが表示されない**
   - フォルダ構造と命名規則を確認
   - 自動更新スクリプトの実行を確認
   - Chrome拡張の再インストールを実行

2. **自動更新スクリプトが動かない**
   - Node.js のインストール確認
   - scripts フォルダでの実行確認
   - ファイル権限の確認（macOS/Linux）

3. **新しいファイルが認識されない**
   - 数字接頭語（001_）の確認
   - .txt拡張子の確認
   - 自動更新スクリプト実行の確認

## Ver3.0.0 主要技術要素

### 自動更新システム
- **Node.js スクリプト**: フォルダ構造の自動スキャン
- **コード生成**: JavaScript 関数の自動生成
- **安全な更新**: バックアップ・復元機能
- **クロスプラットフォーム**: Windows/macOS 対応

### フォルダベース管理
- **階層構造**: 固定3階層でシンプルな管理
- **数字接頭語**: 表示順序制御と識別
- **動的読み込み**: fetch() による実行時ファイル読み込み

### セキュリティ考慮
- **web_accessible_resources**: プロンプトファイルへの安全なアクセス
- **エラーハンドリング**: 存在しないファイルへの安全な対応
- **バックアップ機能**: 更新失敗時の自動復元