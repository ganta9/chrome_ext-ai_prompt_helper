# AI Prompt Helper v7.0.0

## リリース日
2025-09-16

## 主要機能
- ✅ GitHub Pages連携によるプロンプトデータ管理
- ✅ Chrome拡張機能とGitHub Pagesの完全データ同期
- ✅ 31件のプロンプトデータをprompts.jsonで管理
- ✅ Claude.aiでの安定したプロンプト挿入機能
- ✅ v6.0.0の安定した動作基盤を維持

## アーキテクチャ
### データフロー
1. **prompts.json** (GitHub Pages) ← メインデータソース
2. **background.js** (Service Worker) ← GitHub Pagesからfetch
3. **content.js** (Chrome Extension) ← chrome.runtime.sendMessage
4. **Claude.ai** ← Clipboard API + ペーストイベント

### 技術的改善
- Manifest V3対応
- GitHub Pagesとの完全データ同期
- CSP制限回避のためのService Worker実装
- v6.0.0の安定したUI/UXを継承

## 対応サイト
- ChatGPT (chat.openai.com, chatgpt.com)
- Claude (claude.ai)
- Google Gemini (gemini.google.com)
- Microsoft Copilot (copilot.microsoft.com)
- その他AIサイト多数

## 既知の制限事項
- GitHub Pagesでのプロンプト編集・保存は要検討
- Google Sheets連携は残存するが未使用