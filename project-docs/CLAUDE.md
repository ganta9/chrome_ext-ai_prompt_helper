# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

このプロジェクトは、ChatGPT、Claude、Google Gemini などの AI チャットサイトでプロンプトサンプルを簡単に選択・入力できる Chrome 拡張機能です。

**バージョン**: v6.1.0
**実装状況**: 2025-09-15現在
**アーキテクチャ**: シンプル・ローカルファースト・ゼロ設定

## アーキテクチャ (v6.1.0)

### 主要コンポーネント（ローカルファースト設計）

- **manifest.json**: Chrome拡張機能設定（Manifest V3、最小権限）
- **src/content.js**: AIサイト連携・プロンプト挿入処理
- **src/popup.html + popup.js**: 内蔵プロンプト管理システム
- **Chrome Storage Local**: プロンプトデータ保存（外部サーバー不要）

### データフロー（v6.1.0）

1. **データ管理**: Chrome Storage Local API（端末内完結）
2. **プロンプト管理**: 拡張機能ポップアップ内蔵エディター
3. **プロンプト挿入**: content.js による直接DOM操作
4. **初期データ**: 5つのデフォルトプロンプトを自動ロード

### 対応サイト（実装済み）

- **ChatGPT**: chat.openai.com, chatgpt.com
- **Claude**: claude.ai（CSP制限あり）
- **Google Gemini/Bard**: gemini.google.com, bard.google.com
- **Microsoft Copilot**: copilot.microsoft.com
- **その他**: Perplexity、Felo.ai、NotebookLM、Grok等

### プロンプトデータ構造（v6.1.0）

Chrome Storage Local保存形式：
```javascript
{
  id: "user_1663234567890",  // ユニークID（タイムスタンプベース）
  title: "プロンプトタイトル",
  prompt: "プロンプト本文",
  memo: "メモ（任意）",
  tags: "タグ1,タグ2,タグ3",
  created_at: "2025-09-15T10:30:00.000Z",
  updated_at: "2025-09-15T10:30:00.000Z"
}
```

### デフォルトプロンプト（内蔵）
1. **文章校正**: 基本的な文章校正用プロンプト
2. **要約作成**: 長文の要約用プロンプト
3. **コードレビュー**: プログラムのコードレビュー用
4. **翻訳（日→英）**: 日本語から英語への翻訳
5. **アイデア出し**: ブレインストーミング用プロンプト

### v6.0.0から削除された機能
- ❌ **Service Worker**: 実装困難により除去
- ❌ **GitHub Pages連携**: 外部依存除去のため削除
- ❌ **Google Apps Script**: 外部API依存除去のため削除
- ❌ **複雑な設定画面**: ゼロ設定コンセプトにより削除

## 開発時の注意点

### セレクター戦略
各 AI サイトの入力欄は異なる実装のため、`findTextarea()` で複数のセレクターを順次試行。新しいサイトに対応する際は、そのサイトの DOM 構造に応じてセレクターを追加。

### 動的コンテンツ対応
AI サイトは SPA (Single Page Application) が多いため、`MutationObserver` を使用してページ変更を監視し、必要に応じて UI を再初期化。

### プロンプト挿入処理（v6.1.0）
- **全サイト共通**: 直接DOM操作による高速挿入
- **Claude.ai特別対応**: Clipboard API + ペーストイベントシミュレーション
- **contentEditable対応**: 現代的なリッチテキストエディターに対応
- **フォールバック機能**: 複数手法による確実な挿入

## インストール手順（ゼロ設定）

1. Chrome拡張機能管理画面 (chrome://extensions/) を開く
2. 「デベロッパーモード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」でプロジェクトフォルダを選択
4. **完了**（設定不要で即使用開始）

## 機能拡張時の考慮事項

### プロンプト管理（v6.1.0）
- **データ保存**: `chrome.storage.local` API使用
- **CRUD操作**: popup.js内で完結
- **データ形式**: id, title, prompt, memo, tags, created_at, updated_at
- **デフォルトデータ**: 5つの実用的プロンプトを内蔵

### 新サイト対応
- **manifest.json**: `content_scripts.matches` に新サイトURL追加
- **content.js**: `detectAISite()` 関数に新サイト判定ロジック追加
- **セレクター**: `findTextarea()` に新サイト用の入力欄セレクター追加

### 開発指針（v6.1.0）
- **シンプル優先**: 複雑な機能は極力排除
- **ローカルファースト**: 外部API依存は禁止
- **ゼロ設定**: ユーザー設定を要求しない
- **高速動作**: 軽量で即座にレスポンス