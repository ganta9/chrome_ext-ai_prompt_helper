# AI Prompt Helper - Google Sheets連携仕様書

## プロジェクト概要

AI Prompt Helper Chrome拡張機能にGoogle Sheets連携機能を追加し、デバイス間でのプロンプト共有を実現する。

## 現状の課題

- プロンプトがlocalStorageに保存されるため、デバイス間での共有ができない
- 異なるコンピューターやブラウザでのプロンプトアクセスが不可能
- プロンプトのバックアップ・復旧機能が不十分

## 目標

1. **デバイス間同期**: 複数デバイスで同じプロンプトセットを共有
2. **データ永続性**: クラウドベースのデータ保存でデータ消失を防止
3. **シームレス連携**: 既存のChrome拡張機能の使用感を維持
4. **設定簡単**: 最小限の設定でGoogle Sheets連携を開始

## システム構成

### アーキテクチャ図

```
Chrome拡張機能 ←→ GitHub Pages ←→ Google Apps Script ←→ Google Sheets
     ↑                   ↑                    ↑              ↑
  ユーザー操作        フロントエンド       バックエンドAPI      データ保存
```

### 主要コンポーネント

1. **Google Sheets**: プロンプトデータの中央保存場所
2. **Google Apps Script**: プロンプトCRUD操作のAPIエンドポイント
3. **GitHub Pages**: フロントエンド統合とSync Manager
4. **Chrome拡張機能**: 既存機能にGoogle Sheets設定とクイックアクションを追加

## データ設計

### Google Sheetsスキーマ

| 列名 | データ型 | 説明 | 例 |
|------|----------|------|-----|
| id | 文字列 | 一意識別子（UUID v4） | `prompt_1234567890` |
| title | 文字列 | プロンプトタイトル | `コード解説プロンプト` |
| prompt | 文字列 | プロンプト本文 | `以下のコードを詳しく...` |
| memo | 文字列 | メモ・説明（オプション） | `Python専用` |
| tags | 文字列 | タグ（カンマ区切り） | `コード,Python,解説` |
| created_at | 日時 | 作成日時 | `2024-01-15T10:30:00Z` |
| updated_at | 日時 | 更新日時 | `2024-01-20T15:45:00Z` |
| deleted | 論理値 | 削除フラグ | `FALSE` |

### データフロー

1. **読み取り**: Chrome拡張 → GitHub Pages → Google Apps Script → Google Sheets
2. **書き込み**: Chrome拡張 → GitHub Pages → Google Apps Script → Google Sheets
3. **同期**: 定期的な双方向データ同期（5分間隔）

## API設計

### Google Apps Script エンドポイント

#### 基本設定
- **スクリプトURL**: デプロイされたGoogle Apps ScriptのWeb App URL
- **認証**: なし（公開アクセス、入力値検証で安全性担保）
- **レスポンス形式**: JSONP（CORS制約回避）

#### エンドポイント詳細

**1. プロンプト一覧取得**
```
GET {SCRIPT_URL}?action=getPrompts&callback=callbackFunction
```

**レスポンス例:**
```javascript
callbackFunction({
  success: true,
  data: [
    {
      id: "prompt_1234567890",
      title: "コード解説プロンプト",
      prompt: "以下のコードを詳しく...",
      memo: "Python専用",
      tags: "コード,Python,解説",
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-20T15:45:00Z"
    }
  ]
});
```

**2. プロンプト追加**
```
GET {SCRIPT_URL}?action=addPrompt&title=タイトル&prompt=プロンプト本文&memo=メモ&tags=タグ&callback=callbackFunction
```

**3. プロンプト更新**
```
GET {SCRIPT_URL}?action=updatePrompt&id=prompt_id&title=新タイトル&prompt=新プロンプト&memo=新メモ&tags=新タグ&callback=callbackFunction
```

**4. プロンプト削除**
```
GET {SCRIPT_URL}?action=deletePrompt&id=prompt_id&callback=callbackFunction
```

### セキュリティ対策

1. **入力値検証**:
   - 文字数制限（title: 100文字、prompt: 5000文字、memo: 500文字、tags: 200文字）
   - 危険なHTML/JSの検出と拒否
   - 必須パラメータの存在確認

2. **レート制限**:
   - 同一IPからの連続リクエスト制限（1分間に10回）
   - スクリプト実行時間制限（30秒）

3. **データ保護**:
   - 論理削除による誤削除防止
   - バックアップ用データ履歴保持
   - スプレッドシートアクセス権限制御

## フロントエンド統合

### SheetsConnector クラス

```javascript
class SheetsConnector {
  constructor(scriptUrl) {
    this.scriptUrl = scriptUrl;
    this.requestQueue = [];
    this.isProcessing = false;
  }

  async getPrompts() {
    return await this.makeRequest('getPrompts');
  }

  async addPrompt(data) {
    return await this.makeRequest('addPrompt', data);
  }

  async updatePrompt(id, data) {
    return await this.makeRequest('updatePrompt', { id, ...data });
  }

  async deletePrompt(id) {
    return await this.makeRequest('deletePrompt', { id });
  }

  // JSONP実装
  makeRequest(action, params = {}) {
    return new Promise((resolve, reject) => {
      // リクエスト処理実装
    });
  }
}
```

### SyncManager クラス

```javascript
class SyncManager {
  constructor(sheetsConnector, localStorageManager) {
    this.sheets = sheetsConnector;
    this.local = localStorageManager;
    this.syncInterval = 5 * 60 * 1000; // 5分
    this.lastSyncTime = null;
  }

  async syncToSheets() {
    // ローカル → Google Sheets同期
  }

  async syncFromSheets() {
    // Google Sheets → ローカル同期
  }

  async fullSync() {
    // 双方向同期（競合解決含む）
  }

  startAutoSync() {
    setInterval(() => {
      this.fullSync();
    }, this.syncInterval);
  }
}
```

### 競合解決戦略

1. **タイムスタンプベース**: `updated_at`が新しい方を採用
2. **マージ戦略**:
   - 同じIDの場合: より新しいタイムスタンプを採用
   - 異なるIDの場合: 両方保持
3. **ユーザー確認**: 重大な競合時はユーザーに選択を委ねる

## 実装フェーズ

### Phase 1: Google Apps Script開発

**目標**: Google SheetsのCRUD API完成

**成果物**:
- Google Apps Scriptファイル（`prompt-helper-api.gs`）
- テスト用スプレッドシート
- API動作確認スクリプト

**主要機能**:
- プロンプトの取得・追加・更新・削除
- 入力値検証とセキュリティ対策
- JSONP対応とCORS設定
- エラーハンドリング

**開発期間**: 1日

### Phase 2: フロントエンド統合

**目標**: GitHub Pagesでの Google Sheets連携実装

**成果物**:
- SheetsConnector クラス実装
- SyncManager クラス実装
- 設定画面の追加
- テスト機能の実装

**主要機能**:
- Google Sheets接続テスト
- プロンプト同期機能
- 競合解決処理
- エラー表示とユーザーフィードバック

**開発期間**: 2日

### Phase 3: Chrome拡張機能更新

**目標**: 拡張機能の設定画面とクイックアクション実装

**成果物**:
- 拡張機能設定ページ更新
- クイックアクション機能
- 同期ステータス表示

**主要機能**:
- ✅ **GitHub Pages URL設定**: プロンプト管理サイトのURL設定
- ✅ **Google Spreadsheet設定**: スプレッドシートIDとGoogle Apps Script URL設定
- ✅ **クイックアクション保持**: 既存の「今すぐ同期」「接続テスト」機能を維持
- ❌ **プロンプト統計除外**: 統計表示機能は実装しない

**設定項目**:
1. **GitHub Pages設定**
   - サイトURL入力フィールド
   - 接続テストボタン
   - ステータス表示

2. **Google Sheets設定**
   - スプレッドシートID入力
   - Google Apps Script URL入力
   - 設定テストボタン

3. **同期設定**
   - 自動同期ON/OFF
   - 同期間隔設定（1分、5分、10分、30分）
   - 最終同期時刻表示

**開発期間**: 1日

## 設定・運用手順

### 初期設定

1. **Google Sheetsセットアップ**
   - 新しいスプレッドシート作成
   - ヘッダー行の設定（id, title, prompt, memo, tags, created_at, updated_at, deleted）
   - スプレッドシートIDをメモ

2. **Google Apps Scriptデプロイ**
   - スクリプトエディタでコード作成
   - ウェブアプリとしてデプロイ
   - デプロイURLをメモ

3. **Chrome拡張機能設定**
   - GitHub Pages URL入力
   - スプレッドシートID入力
   - Google Apps Script URL入力
   - 接続テスト実行

### 日常運用

1. **プロンプト管理**: 通常通りChrome拡張またはGitHub Pagesで操作
2. **自動同期**: バックグラウンドで5分ごとに自動実行
3. **手動同期**: 必要に応じて「今すぐ同期」ボタンで実行
4. **エラー対応**: 設定画面でステータス確認とトラブルシューティング

## 技術的制約・考慮事項

### 制約事項

1. **Google Apps Script制限**:
   - 1日のスクリプト実行時間: 6時間
   - トリガー実行回数: 20回/分
   - スクリプト実行時間: 6分/実行

2. **Google Sheets制限**:
   - セル数上限: 1000万セル
   - 同時編集者数: 100人

3. **JSONPによる制約**:
   - GETリクエストのみ対応
   - URLエンコーディング必須
   - レスポンスサイズ制限

### パフォーマンス最適化

1. **キャッシュ戦略**:
   - ローカルStorageによる一次キャッシュ
   - 差分同期による通信量削減
   - タイムスタンプベースの更新判定

2. **リクエスト最適化**:
   - バッチ処理による API呼び出し削減
   - 非同期処理によるUI応答性向上
   - エラー時のリトライ機能

## テスト計画

### 単体テスト

- Google Apps Script関数のテスト
- SheetsConnector、SyncManagerクラスのテスト
- 入力値検証のテスト

### 統合テスト

- Chrome拡張 ⟷ GitHub Pages 連携テスト
- GitHub Pages ⟷ Google Apps Script連携テスト
- 端到端同期テスト

### 運用テスト

- 複数デバイスでの同期テスト
- ネットワーク障害時の動作テスト
- 大量データでのパフォーマンステスト

## リスク対策

### 技術リスク

1. **Google APIの変更**: 定期的なAPIドキュメント確認とアップデート
2. **CORS問題**: JSONPによる回避策とフォールバック機能
3. **データ競合**: タイムスタンプベース競合解決とユーザー確認

### 運用リスク

1. **データ消失**: 定期バックアップと論理削除による防止
2. **スプレッドシート誤操作**: 権限設定と復旧手順の整備
3. **アクセス過多**: レート制限とエラーハンドリングによる保護

## 成功指標

1. **機能的指標**:
   - 同期成功率: 99%以上
   - レスポンス時間: 3秒以内
   - エラー率: 1%未満

2. **ユーザビリティ指標**:
   - 設定完了率: 90%以上
   - 継続使用率: 80%以上
   - ユーザー満足度: 4.0/5.0以上

## 今後の拡張計画

### 短期（1-3ヶ月）

- プロンプト共有機能（URL共有）
- カテゴリ管理の改善
- 検索・フィルタリング機能強化

### 中期（3-6ヶ月）

- チーム共有機能
- プロンプトバージョン管理
- 使用統計とインサイト

### 長期（6ヶ月以上）

- AI駆動プロンプト提案
- 多言語対応
- エンタープライズ機能

---

**作成日**: 2024年12月
**バージョン**: 1.0
**ステータス**: 実装準備完了