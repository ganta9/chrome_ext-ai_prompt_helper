# プレビューモーダル表示問題 v7.2.1

## 問題の状況
**日付**: 2025-09-20  
**バージョン**: v7.2.1  
**問題**: プレビューモーダルでプロンプト内容が表示されない（空白状態）

## スクリーンショット分析
- モーダルタイトル: "ああああいい"
- サブタイトル: "title" 
- プロンプト内容エリア: 完全に空白（本来なら "ああああ" などの内容が表示されるべき）
- 右上に×ボタンとスクロールバー表示
- 下部に赤いボタン（編集・削除ボタン）は見える

## 実施済み修正内容（v7.2.0）
1. **主犯解決**: `.prompt-preview { max-height: 300px; }` → `max-height: none; height: 100%;`
2. **px制約完全解除**: 70+箇所のpx値をrem/vw/vh単位に変換
3. **モーダルサイズ最適化**: 98vh → 95vh, プレビューメイン 94vh → 89vh
4. **プレビューモーダル専用制約**追加:
```css
.modal-preview .prompt-preview {
  max-height: none !important;
  height: 100% !important;
  padding: 0.5rem !important;
  margin: 0 !important;
  border: none !important;
  background: transparent !important;
  overflow-y: visible !important;
}
```

## 問題の推定原因
**レイアウト制約は解決済み** → **コンテンツ表示ロジックの問題**

### 可能性1: JavaScript表示ロジック問題
- `showPreviewModal()` 関数でのコンテンツ設定
- `document.getElementById('preview-prompt').innerHTML = content` の失敗
- マークダウンレンダリング処理の問題

### 可能性2: CSS表示制約の残存
- `display: none` や `visibility: hidden` 状態
- テキストカラーが背景色と同色（見えない状態）
- z-indexやoverflow設定による非表示

### 可能性3: データ取得問題
- プロンプトデータ自体が空
- ID参照の不整合
- ローカルストレージからの読み込み失敗

## 次の調査方針
1. **JavaScript関数確認**: `showPreviewModal()` のコンテンツ設定処理
2. **CSS表示状態確認**: `.prompt-preview` の実際の描画状態
3. **データ確認**: 実際に渡されているプロンプトデータ
4. **ブラウザDevTools**: Console エラーとElement inspect

## 重要な教訓
- **レイアウト修正 ≠ 表示修正**: サイズ制約解除だけでは表示されない場合がある
- **段階的デバッグ**: CSS修正後はJavaScript処理も確認必要
- **統合テスト**: 個別要素修正後の全体動作確認が必須