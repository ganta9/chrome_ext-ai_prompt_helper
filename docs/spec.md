# AI Prompt Helper v7.0.0 仕様書 (最新実装状況)

## 1. 概要

本ドキュメントは、AI Prompt Helper Chrome拡張機能 バージョン7.0.0の**最新実装状況**に基づく技術仕様、アーキテクチャ、UI設計を定義するものです。

### 1.1 プロジェクトの目的
GitHub Pagesで独立したプロンプト管理サイトを構築し、Chrome拡張機能と連携することで、AIサイト上でプロンプトの読み込み・編集・管理を効率的に行う。プロンプトデータはprompts.jsonファイルで管理し、GitHub API経由で自動保存を実現する。

### 1.2 実装状況 (2025-09-20現在)
- ✅ **Chrome拡張機能**: 基本機能実装済み・安定動作
- ✅ **GitHub Pages編集サイト**: 実装済み・デプロイ済み・プロンプト編集機能正常動作
- ✅ **GitHub API自動保存**: prompts.json更新・Chrome拡張との設定同期完了
- ✅ **デフォルトプロンプト編集機能**: ID型不整合問題を解決済み
- ❌ **Google Apps Script連携**: v7.0.0で削除済み
- ❌ **Service Worker**: 実装失敗により未使用

---

## 2. アーキテクチャ

### 2.1. 実装済み構成図 (v7.0.0)

```
+---------------------------+     +----------------------+
| GitHub Pages (編集サイト)   |<--->| prompts.json (GitHub) |
| - プロンプト編集・管理       |     | - プロンプトデータ原本  |
| - GitHub API自動保存        |     | - バージョン管理       |
+---------------------------+     +----------------------+
        ^
        | (iframe通信/設定同期)
        v
+---------------------------+
| Chrome拡張機能              |
| - content.js (プロンプト挿入)|
| - popup.js (設定・GitHub同期)|
+---------------------------+
```

### 2.2. データフロー（v7.0.0実装済み）
1. **データ読み込み**: GitHub Pagesサイトは、まずprompts.jsonファイルをfetchで読み込み、プロンプトデータを表示する。
2. **データ編集**: ユーザーがGitHub Pagesサイトでプロンプトの追加・編集・削除を行う。
3. **自動保存**: 編集操作後、GitHub Repository Contents APIを使用してprompts.jsonファイルを更新する。
4. **設定同期**: Chrome拡張機能とGitHub Pagesサイト間でGitHubトークン設定を同期する。
5. **プロンプト選択**: ユーザーがプロンプトを選択すると、Clipboard APIとペーストイベントシミュレーションでAIサイトに挿入する。

### 2.3. 実装制約・既知の問題 (v7.0.0)
- **GitHub API制限**: リポジトリContents API使用のため、Personal Access Token必要
- **ブラウザキャッシュ**: script.js更新時に強制リロード（Ctrl+Shift+R）が必要な場合あり
- **UTF-8エンコーディング**: 日本語文字でbtoa()エラー → encodeURIComponent対応済み
- **ID型不整合**: デフォルトプロンプト（文字列ID）とユーザー作成（数値ID）→ 修正済み
- **Service Worker**: 技術的制約により実装断念（DOM操作不可）

### 2.4. 各コンポーネントの役割（v7.0.0実装済み）
- **データ原本**: prompts.json（GitHub Pagesリポジトリに格納）
- **フロントエンド**: GitHub Pagesサイト（docs/ディレクトリ）
  - script.js: プロンプト管理・編集機能、GitHub API連携
  - index.html: SPA UI、モーダル、検索・フィルタリング機能
  - style.css: レスポンシブデザイン、ダークテーマ対応
- **Chrome拡張機能**: src/ディレクトリ
  - manifest.json: Manifest V3、必要権限の定義
  - popup.html/popup.js: 設定画面、GitHub同期機能
  - content.js: AIサイトでのプロンプト挿入機能
  - background.js: Service Worker（Chrome拡張用、限定機能）

### 2.5. 対応AIサイト（実装済み）
- **ChatGPT**: chat.openai.com, chatgpt.com
- **Claude**: claude.ai
- **Google Gemini/Bard**: gemini.google.com, bard.google.com
- **Microsoft Copilot**: copilot.microsoft.com
- **その他**: Perplexity、Felo.ai、NotebookLM、Grok等

### 2.6. v7.0.0で削除された機能
- ❌ **Google Apps Script連携**: v6.0.0から削除、GitHub API方式に移行
- ❌ **Googleスプレッドシート**: データソースをprompts.jsonに変更
- ❌ **Service Worker**: 技術的制約により実装断念
- ❌ **JSONP通信**: Fetch API + GitHub APIに移行
- ❌ **複雑な同期機能**: シンプルなGitHubトークン同期のみ実装

---

## 3. データ構造 (prompts.json)

```json
{
  "prompts": [
    {
      "id": "p_z1s2h3ot",           // 文字列ID（デフォルトプロンプト）
      "title": "基本的なタスク指示",
      "prompt": "[タスク内容]を実行してください。

入力：",
      "memo": "最も基本的な指示形式。明確で簡潔な指示に適用",
      "tags": ["基本", "Zero-shot", "直接指示"],
      "createdAt": "2025-09-15T10:00:00Z",
      "updatedAt": "2025-09-15T10:00:00Z"
    },
    {
      "id": 1758329559743.6858,    // 数値ID（ユーザー作成）
      "title": "ユーザー作成プロンプト",
      "prompt": "ユーザーが作成したプロンプト内容",
      "memo": "メモ",
      "tags": ["カスタム"],
      "createdAt": "2025-09-20T00:52:39.743Z",
      "updatedAt": "2025-09-20T01:07:53.474Z"
    }
  ]
}
```

### 3.1 フィールド定義
| フィールド | 型 | 説明 |
|----------|---|-----|
| id | string/number | デフォルト: 文字列、ユーザー作成: 数値（generateId()で生成） |
| title | string | プロンプトのタイトル |
| prompt | string | プロンプト本文 |
| memo | string | メモ（任意） |
| tags | Array<string> | タグ配列 |
| createdAt | string | 作成日時（ISO 8601形式） |
| updatedAt | string | 更新日時（ISO 8601形式） |

### 3.2 重要な注意点
- **ID型不整合**: デフォルトプロンプトは文字列ID、ユーザー作成は数値ID → 型変換対応済み
- **フィールド名統一**: v7.0.0で全て camelCase に統一（created_at → createdAt）
- **UTF-8対応**: 日本語文字をBase64エンコードする際はencodeURIComponent使用

---

## 4. GitHub API設計 (v7.0.0)

### 4.1 GitHub Repository Contents API

```javascript
// prompts.json読み込み
GET https://api.github.com/repos/{owner}/{repo}/contents/prompts.json
Headers: {
  'Authorization': 'token {personal_access_token}',
  'Accept': 'application/vnd.github.v3+json'
}

// prompts.json更新
PUT https://api.github.com/repos/{owner}/{repo}/contents/prompts.json
Headers: {
  'Authorization': 'token {personal_access_token}',
  'Accept': 'application/vnd.github.v3+json',
  'Content-Type': 'application/json'
}
Body: {
  "message": "プロンプト更新: {title}",
  "content": "{base64_encoded_content}",
  "sha": "{current_file_sha}"
}
```

### 4.2 実装済み関数
- **autoSaveToGitHub()**: prompts配列をGitHub APIで自動保存
- **getCurrentFileSha()**: prompts.jsonの現在SHAを取得
- **GitHubConnector**: GitHub API操作を抽象化するクラス
- **addPromptWithAutoSave()**: プロンプト追加+自動保存
- **updatePromptWithAutoSave()**: プロンプト更新+自動保存

---

## 5. 実装とセットアップ

具体的なセットアップ手順は `project-docs/setup-instructions.md` を参照。

---

## 6. 解決済み問題・失敗事例 (v7.0.0)

### 6.1 デフォルトプロンプト編集機能修正 (2025-09-20)
- **問題**: 3層の複合的問題（フィールド名不整合、ID型不整合、HTMLテンプレート構文エラー）
- **解決**: 段階的修正により全て解決済み
- **教訓**: エラーメッセージの軽視、推測に基づく修正の危険性

### 6.2 GitHub API UTF-8エンコーディング (2025-09-20)
- **問題**: 日本語文字でbtoa()エラー → InvalidCharacterError
- **解決**: `btoa(unescape(encodeURIComponent(jsonString)))`で対応
- **影響**: 日本語プロンプトの保存が正常動作

### 6.3 Service Worker実装失敗 (2025-09-15)
- **問題**: DOM操作不可、JSONP実装不可
- **対策**: GitHub API + Fetch方式への移行で解決
- **教訓**: 技術選択前の環境制約調査の重要性

### 6.4 記録・学習システム
- **成功事例**: GitHub Pages連携、GitHub API自動保存、プロンプト編集機能
- **失敗事例**: Service Worker、権限逸脱修正、推測に基づく修正
- **詳細**: `docs/fails.md`、`docs/fails_session_2025_09_20.md` に全記録

---

## 7. v7.0.0で追加された機能

### 7.1 GitHub API自動保存システム
- **自動保存**: プロンプト追加・編集・削除時にprompts.jsonを自動更新
- **SHA管理**: 楽観ロック式の競合回避（getCurrentFileSha()）
- **エラーハンドリング**: 409 Conflict、API制限エラーへの対応
- **デバッグログ**: 詳細なログシステムで問題の早期発見

### 7.2 Chrome拡張機能との統合
- **設定同期**: GitHubトークンをChrome拡張↔GitHub Pages間で同期
- **シームレス連携**: iframe通信でのプロンプト選択・挿入
- **セキュリティ**: Personal Access Tokenによる認証

### 7.3 プロンプト管理機能の充実
- **デフォルトプロンプト**: 32個の即座に使用可能なプロンプトテンプレート
- **検索・フィルタ**: タイトル、内容、タグでの絞り込み
- **タグ管理**: 自動集計、重複除去、インタラクティブフィルタ
- **レスポンシブデザイン**: モバイルフレンドリーなUI

## 8. 今後の改善案

### 8.1 安定性向上
- **キャッシュ対策**: script.js更新時の自動キャッシュクリア
- **プリフライトチェック**: GitHub API接続確認の自動化
- **バックアップシステム**: prompts.jsonの自動バックアップ

### 8.2 機能拡張
- **履歴管理**: プロンプト編集履歴の追跡
- **エクスポート機能**: 複数形式でのデータ出力
- **テンプレート共有**: プロンプトテンプレートの公開・共有

### 8.3 開発・保守性
- **自動テスト**: E2Eテストの導入
- **CI/CD**: GitHub Actionsによる自動デプロイ
- **エラー監視**: リアルタイムエラー追跡システム