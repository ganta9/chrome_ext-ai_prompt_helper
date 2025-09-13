# プロジェクト概要

## プロジェクト名
AI Prompt Helper - Chrome拡張機能

## 目的
ChatGPT、Claude、Google Gemini などの AI チャットサイトでプロンプトサンプルを簡単に選択・入力できる Chrome 拡張機能を開発する。

## 技術スタック
- **フレームワーク**: Chrome Extension (Manifest V3)
- **言語**: JavaScript, CSS, HTML
- **主要技術**: 
  - Content Scripts
  - DOM Manipulation
  - Chrome Extension APIs
  - MutationObserver (動的コンテンツ対応)

## アーキテクチャ概要
- **manifest.json**: Chrome拡張機能設定 (Manifest V3)
- **src/content.js**: メインスクリプト (AI サイト上で動作)
- **src/styles.css**: UI スタイル定義
- **src/popup.html**: ポップアップ画面
- **prompts/**: プロンプトデータ (フォルダ構造ベース)
- **icons/**: アイコンファイル

## 対応サイト
- ChatGPT (chat.openai.com, chatgpt.com)
- Claude (claude.ai)
- Google Gemini/Bard (gemini.google.com, bard.google.com)
- Microsoft Copilot
- Perplexity AI
- Felo AI
- NotebookLM
- Grok
- Genspark AI

## 現在のバージョン
- 最新: v5.0.0
- バージョン管理: versions/ フォルダでバージョン別管理