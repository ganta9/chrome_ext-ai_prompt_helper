# AI Prompt Helper v6.0.0 - アーカイブ版

**バックアップ日時**: 2025-09-15
**オリジナル状態**: 完全実装版
**実装状況**: Google Apps Script + GitHub Pages連携方式

## v6.0.0 実装概要

### 実装済み機能
- ✅ **Chrome拡張機能**: manifest.json, popup, content script
- ✅ **GitHub Pages編集サイト**: docs/フォルダで公開済み
- ✅ **Google Apps Script API**: 完全実装、デプロイ済み
- ✅ **Googleスプレッドシート連携**: プロンプトデータ管理
- ✅ **10+AIサイト対応**: ChatGPT、Claude、Gemini等

### 実装失敗・断念
- ❌ **Service Worker**: DOM操作不可により技術的に実装不可能
- ❌ **GitHub Actions**: 自動同期未実装
- ❌ **バックグラウンド同期**: Service Worker失敗により未実装

### 技術的制約
- ⚠️ **Claude.ai CSP制限**: iframe通信が制限される場合あり
- ⚠️ **CORS制約**: 一部AIサイトでの制限
- ⚠️ **複雑なセットアップ**: Google Apps Script設定が必要

### アーキテクチャ特徴
- **外部依存**: Googleスプレッドシート + Google Apps Script
- **編集方法**: GitHub Pages上のSPA
- **データ同期**: JSONP形式のAPI通信
- **セットアップ時間**: 約30分（複雑な手順）

### ファイル構成
```
v6.0.0/
├── src/                    # Chrome拡張機能本体
├── docs/                   # GitHub Pages編集サイト
├── project-docs/          # 仕様書・失敗事例記録
├── claudedocs/            # Claude分析レポート
├── icons/                 # アイコン素材
├── manifest.json          # Chrome拡張機能設定
└── README.md              # プロジェクト説明
```

## 失敗事例記録
詳細な失敗分析は `project-docs/fails.md` に記録済み。
- Service Worker実装失敗の詳細
- 技術的制約の具体例
- ユーザーフィードバック記録

## 次バージョンへの課題
- セットアップの複雑さ
- 外部依存の多さ
- Service Worker代替手法の検討

---
**注意**: このバージョンは参考資料として保存されています。実装の継続はv6.1.0以降で行われます。