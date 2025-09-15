# GitHubPages プロンプト管理システム 設計仕様書

## 確定済み設計仕様（2025-09-15）

### データ構造
- **階層**: 平坦な1階層（カテゴリ・サブカテゴリなし）
- **タグ形式**: 配列形式 `["tag1", "tag2", "tag3"]`
- **履歴管理**: 無制限（全履歴保持）、将来必要に応じて制限
- **ID生成**: 短縮UUID形式 `p_a1b2c3d4`

### 自動保存方式
- **Chrome拡張機能**: 既存GitHub PAT「GAS API for Prompt Sync — repo」を設定・管理
- **GitHub API**: 完全自動保存（Chrome Extension経由）
- **セキュリティ**: Chrome Storage APIで安全なトークン管理

### MVP機能範囲
- **基本CRUD**: 作成・読み取り・更新・削除
- **タグ管理**: タグでの絞り込み・フィルタリング、タグ一覧表示
- **検索機能**: タイトル・内容検索
- **Chrome拡張機能連携**: 編集内容の自動反映

### prompts.json構造
```json
{
  "version": "7.0.0",
  "last_updated": "2025-01-15T15:45:00Z",
  "prompts": [
    {
      "id": "p_a1b2c3d4",
      "title": "プロンプトタイトル",
      "prompt": "プロンプト本文",
      "memo": "メモ内容",
      "tags": ["tag1", "tag2", "tag3"],
      "created_at": "2025-01-10T10:00:00Z",
      "updated_at": "2025-01-15T15:30:00Z",
      "history": [
        {
          "version": 1,
          "prompt": "以前のプロンプト内容",
          "updated_at": "2025-01-10T10:00:00Z"
        }
      ]
    }
  ]
}
```

### 実装優先度
1. prompts.json データ構造の最終設計 ← 現在進行中
2. Chrome拡張機能にGitHub PAT設定機能追加
3. GitHub Pages編集UI作成（基本CRUD操作）
4. タグ管理機能実装（絞り込み・フィルタリング）
5. Chrome拡張機能とGitHub Pages間の通信実装
6. GitHub API経由でのprompts.json自動更新機能

### 技術的要件
- GAS/Sheets依存を完全排除
- GitHubPages静的サイトでの完全な編集機能
- Chrome拡張機能との連携による自動保存
- 既存GitHub PAT（repo権限）の活用