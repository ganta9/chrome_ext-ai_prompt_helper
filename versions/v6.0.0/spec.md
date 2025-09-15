# AI Prompt Helper v6.0.0 仕様書 (現在の実装状況)

## 1. 概要

本ドキュメントは、AI Prompt Helper Chrome拡張機能 バージョン6.0.0の**現在の実装状況**に基づく技術仕様、アーキテクチャ、UI設計を定義するものです。

### 1.1 プロジェクトの目的
Googleスプレッドシートでプロンプトデータを一元管理し、Google Apps Script (GAS) をAPIとして利用することで、GitHub Pages上のWebサイトからプロンプトのリアルタイムな読み書きを実現する。

### 1.2 実装状況 (2025-09-15現在)
- ✅ **Chrome拡張機能**: 基本機能実装済み
- ✅ **GitHub Pages編集サイト**: 実装済み・デプロイ済み
- ✅ **Google Apps Script API**: 実装済み・デプロイ済み
- ❌ **Service Worker**: 実装失敗により未使用
- ⚠️ **Claude.ai対応**: CSP制限により制約あり

---

## 2. アーキテクチャ

### 2.1. 実装済み構成図

```
+--------------------------+     +--------------------------+     +----------------------+
| GitHub Pages (編集サイト)  |<--->| Google Apps Script (API) |<--->| Googleスプレッドシート |
+--------------------------+     +--------------------------+     +----------------------+
        ^                                                            ^
        | (iframe通信)                                               | (データ原本)
        v                                                            |
+--------------------------+                                           |
| Chrome拡張機能           |--------------------------------------------+
| (content.js + popup)     |
+--------------------------+
```

### 2.2. データフロー（実装済み）
1. **データ読み込み**: GitHub Pagesサイトは、GAS APIの`getPrompts`アクションをJSONP形式で呼び出し、スプレッドシートから全プロンプトデータを取得して表示する。
2. **データ書き込み (追加/更新/削除)**: ユーザーがGitHub Pagesサイトで編集操作を行うと、サイトはGAS APIの対応するアクション (`addPrompt`, `updatePrompt`, `deletePrompt`) をJSONPで呼び出す。
3. **API処理**: GASはリクエストを受け取り、入力値を検証した後、スプレッドシートの対応する行を操作する。
4. **拡張機能連携**: ユーザーがGitHub Pagesサイトでプロンプトを選択すると、サイトは`postMessage` APIを使い、選択されたプロンプト本文を元のAIサイトのタブで待機している`content.js`に送信する。

### 2.3. 実装制約・既知の問題
- **Claude.ai制約**: Content Security Policy (CSP) によりiframe読み込みが制限される場合がある
- **Service Worker**: 技術的制約により実装断念（DOM操作不可、JSONP実装不可）
- **CORS制約**: 一部のAIサイトでのクロスオリジン通信制限

### 2.4. 各コンポーネントの役割（実装済み）
- **データ原本**: Googleスプレッドシート
- **バックエンドAPI**: `google-apps-script.js` - スプレッドシートを操作するCRUD APIを提供し、ウェブアプリとしてデプロイ済み
- **フロントエンド**: `docs/`ディレクトリ - プロンプトを管理するためのUIを提供し、GAS APIと通信するSPA（GitHub Pagesで公開済み）
- **Chrome拡張機能**: `src/`ディレクトリ - AIサイト上にUIを注入し、設定画面やGitHub Pagesサイトとの連携機能を提供（manifest.json、popup.html、popup.js、content.js）

### 2.5. 対応AIサイト（実装済み）
- **ChatGPT**: chat.openai.com, chatgpt.com
- **Claude**: claude.ai
- **Google Gemini/Bard**: gemini.google.com, bard.google.com
- **Microsoft Copilot**: copilot.microsoft.com
- **その他**: Perplexity、Felo.ai、NotebookLM、Grok等

### 2.6. 実装されていない機能
- ❌ **Service Worker**: 技術的制約により実装断念
- ❌ **バックグラウンド同期**: Service Worker実装失敗により未実装
- ❌ **リアルタイム通知**: プッシュ通知機能未実装

---

## 3. データ構造 (スプレッドシート)

| ヘッダー | 説明 |
|---|---|
| id | ユニークID (GAS側で自動生成) |
| title | プロンプトのタイトル |
| prompt | プロンプト本文 |
| memo | メモ |
| tags | タグ（カンマ区切り） |
| created_at | 作成日時 (GAS側で自動設定) |
| updated_at | 更新日時 (GAS側で自動設定) |
| deleted | 論理削除フラグ (GAS側で自動設定) |

- **補足**:
  - `id`, `created_at`, `updated_at`, `deleted` 列は、Google Apps Scriptによって自動的に管理されます。手動でデータを入力する際は、これらの列を空欄にしておくことを推奨します。
  - `tags` 列は、スプレッドシート上ではカンマ区切りの文字列として保存されます（例: `タグ1,タグ2`）。フロントエンド（GitHub Pages）では、この文字列が配列として処理されます。

---

## 4. API設計

詳細は`google-apps-script.js`内のコメントを参照。`doGet`関数が`action`パラメータに応じて処理を振り分ける。

- **action=getPrompts**: 全プロンプトを取得
- **action=addPrompt**: プロンプトを新規追加
- **action=updatePrompt**: 既存プロンプトを更新
- **action=deletePrompt**: プロンプトを論理削除

---

## 5. 実装とセットアップ

具体的なセットアップ手順は `project-docs/setup-instructions.md` を参照。

---

## 6. 既知の制約・失敗事例

### 6.1 Service Worker実装失敗 (2025-09-15)
- **問題**: Service Worker環境でのDOM操作不可によりJSONP実装が失敗
- **影響**: バックグラウンド同期機能、プッシュ通知機能が未実装
- **対策**: 現状のiframe通信方式を継続使用

### 6.2 Claude.ai CSP制約
- **問題**: Content Security Policyによりiframe読み込みが制限される場合
- **対策**: 他のAIサイト（ChatGPT、Gemini等）では正常動作

### 6.3 実装状況の記録
- **成功事例**: GitHub Pages連携、Google Apps Script API、基本的なChrome拡張機能
- **失敗事例**: Service Worker、バックグラウンド処理系機能
- **詳細**: `project-docs/fails.md` に全失敗事例を記録済み

---

## 7. 今後の改善案

### 7.1 技術的改善
- Claude.ai CSP制約の回避策検討
- 代替的なバックグラウンド処理方式の検討
- Chrome拡張機能権限の最適化

### 7.2 機能追加候補
- プロンプト検索機能
- タグベースのカテゴリ分類
- エクスポート/インポート機能
- 使用頻度統計機能

### 7.3 保守性向上
- 自動テストの導入
- エラー監視システムの構築
- デプロイメント自動化