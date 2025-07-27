# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

このプロジェクトは、ChatGPT、Claude、Google Gemini などの AI チャットサイトでプロンプトサンプルを簡単に選択・入力できる Chrome 拡張機能です。

## アーキテクチャ

### 主要コンポーネント

- **manifest.json**: Chrome 拡張機能の設定ファイル（Manifest V3）
- **src/content.js**: AI サイト上で動作するメインスクリプト
- **src/styles.css**: プロンプトヘルパー UI のスタイル
- **src/popup.html**: 拡張機能のポップアップ画面

### 動作フロー

1. **サイト検出**: `detectAISite()` が現在のサイトを判定
2. **要素検出**: `findTextarea()` が各サイトの入力欄を特定
3. **UI表示**: `createPromptHelper()` がサイドパネルを動的生成
4. **プロンプト挿入**: 選択されたプロンプトを入力欄に自動挿入

### 対応サイト

- ChatGPT (chat.openai.com, chatgpt.com)
- Claude (claude.ai)
- Google Gemini/Bard (gemini.google.com, bard.google.com)

### プロンプトデータ構造

プロンプトは `promptSamples` 配列に以下の形式で格納：
```javascript
{
  category: "カテゴリ名",
  prompts: [
    {
      title: "プロンプトタイトル",
      text: "プロンプト本文"
    }
  ]
}
```

現在のカテゴリ: 文章作成、コード作成、分析・調査、翻訳・語学

## 開発時の注意点

### セレクター戦略
各 AI サイトの入力欄は異なる実装のため、`findTextarea()` で複数のセレクターを順次試行。新しいサイトに対応する際は、そのサイトの DOM 構造に応じてセレクターを追加。

### 動的コンテンツ対応
AI サイトは SPA (Single Page Application) が多いため、`MutationObserver` を使用してページ変更を監視し、必要に応じて UI を再初期化。

### イベント処理
プロンプト挿入時は `input` イベントを発火させ、サイト側の JavaScript が正しく動作するよう配慮。

## 拡張機能のインストール

1. Chrome の拡張機能管理画面 (chrome://extensions/) を開く
2. 「デベロッパーモード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」でプロジェクトフォルダを選択

## 機能拡張時の考慮事項

- 新しいプロンプトカテゴリを追加する場合は `promptSamples` を編集
- 新しい AI サイトに対応する場合は `manifest.json` の `matches` と `detectAISite()` を更新
- UI の変更は `styles.css` で行い、レスポンシブデザインとダークモード対応を維持