# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

このプロジェクトは、ChatGPT、Claude、Google Gemini などの AI チャットサイトでプロンプトサンプルを簡単に選択・入力できる Chrome 拡張機能です。

**バージョン**: v6.0.0 (アーカイブ版)
**実装状況**: 2025-09-15現在
**注意**: このバージョンは参考資料として保存されています。

## アーキテクチャ (v6.0.0実装状況)

### 主要コンポーネント（実装済み）

- **manifest.json**: Chrome 拡張機能の設定ファイル（Manifest V3）
- **src/content.js**: AI サイト上で動作するメインスクリプト
- **src/popup.html + popup.js**: 拡張機能のポップアップ画面（設定機能）
- **docs/**: GitHub Pages編集サイト（プロンプト管理UI）
- **google-apps-script.js**: Google Apps Script API（バックエンド）

### データフロー（実装済み）

1. **データ管理**: Googleスプレッドシートで一元管理
2. **API連携**: Google Apps Script経由でJSONP形式でデータ取得
3. **編集操作**: GitHub Pages上のSPAで編集（docs/script.js）
4. **プロンプト挿入**: Chrome拡張機能（content.js）でAIサイトに挿入

### 対応サイト（実装済み）

- **ChatGPT**: chat.openai.com, chatgpt.com
- **Claude**: claude.ai（CSP制限あり）
- **Google Gemini/Bard**: gemini.google.com, bard.google.com
- **Microsoft Copilot**: copilot.microsoft.com
- **その他**: Perplexity、Felo.ai、NotebookLM、Grok等

### プロンプトデータ構造（v6.0.0）

スプレッドシート構造：
```
| id | title | prompt | memo | tags | created_at | updated_at | deleted |
```

JavaScript処理後の形式：
```javascript
{
  id: "prompt_xxxxx",
  title: "プロンプトタイトル",
  prompt: "プロンプト本文",
  memo: "メモ",
  tags: "タグ1,タグ2"
}
```

### 実装されていない機能
- ❌ **Service Worker**: 技術的制約により実装断念
- ❌ **GitHub Actions**: 自動同期未実装
- ❌ **バックグラウンド同期**: 未実装

## 開発時の注意点

### セレクター戦略
各 AI サイトの入力欄は異なる実装のため、`findTextarea()` で複数のセレクターを順次試行。新しいサイトに対応する際は、そのサイトの DOM 構造に応じてセレクターを追加。

### 動的コンテンツ対応
AI サイトは SPA (Single Page Application) が多いため、`MutationObserver` を使用してページ変更を監視し、必要に応じて UI を再初期化。

### プロンプト挿入処理（v6.0.0）
- **Claude.ai**: Clipboard APIを使用したペーストイベントシミュレーション
- **その他サイト**: 直接的なDOM操作またはClipboard API
- **制約**: Claude.aiではCSP制限によりiframe通信が制限される場合あり

## 拡張機能のインストール

1. Chrome の拡張機能管理画面 (chrome://extensions/) を開く
2. 「デベロッパーモード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」でプロジェクトフォルダを選択

## 機能拡張時の考慮事項

### プロンプト管理
- **データ追加**: Googleスプレッドシートに直接入力 or GitHub Pages編集サイト使用
- **API連携**: Google Apps Script の `addPrompt`, `updatePrompt`, `deletePrompt` 使用
- **データ形式**: id, title, prompt, memo, tags の5フィールド構造

### 新サイト対応
- **manifest.json**: `content_scripts.matches` に新サイトURL追加
- **content.js**: `detectAISite()` 関数に新サイト判定ロジック追加
- **セレクター**: `findTextarea()` に新サイト用の入力欄セレクター追加

### 失敗事例の参照
- **重要**: 開発前に `project-docs/fails.md` を確認
- **Service Worker**: 実装不可能（DOM操作不可）
- **バックグラウンド処理**: 現状では代替手法を検討が必要