# 開発パターンとコーディング規約

## コーディングスタイル
### JavaScript規約
- **関数命名**: camelCase (`findTextarea`, `detectAISite`)
- **定数**: 大文字スネークケース (少ない使用)
- **ファイル命名**: kebab-case (`content.js`, `styles.css`)
- **非同期処理**: async/await パターン優先

### アーキテクチャパターン
- **機能分離**: 各機能を独立した関数として実装
- **サイト別最適化**: `detectAISite()` による分岐処理
- **フォールバック戦略**: 複数のセレクター試行
- **エラーハンドリング**: try-catch による例外処理

## 重要な設計パターン
### セレクター戦略
```javascript
// サイト固有 → 汎用の順序で試行
const siteSpecificSelectors = [...];
const generalSelectors = [...];
```

### 位置計算システム
```javascript
// 位置妥当性検証 + スコアリング
isViableTextarea() + calculateTextareaScore()
```

### プロンプト階層構造
```javascript
{
  category: "カテゴリ名",
  subcategories: [{
    subcategory: "サブカテゴリ名", 
    prompts: [{ title: "タイトル", text: "本文" }]
  }]
}
```

## 互換性戦略
- **新旧形式対応**: v4以前のフォーマットも対応
- **サイト変更対応**: MutationObserver による動的検出
- **ブラウザ互換**: Chrome Extension V3準拠

## デバッグパターン
- console.log による詳細ログ出力
- 要素検出失敗時の詳細情報出力
- 位置計算結果の可視化