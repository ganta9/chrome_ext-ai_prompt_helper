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

## 調査TODO

- [ ] JavaScript表示ロジックの確認（showPreviewModal関数）
- [ ] CSS表示状態の確認（visibility/display/color）
- [ ] プロンプトデータ取得の確認
- [ ] ブラウザDevToolsでのデバッグ実行

---

## v7.2.1 修正内容 (2025-09-20)

### 根本原因の特定 (再調査)

当初、JavaScriptのレンダリングロジックに問題があると推測したが、コードを再検証した結果、`showPreviewModal`関数内の`marked.parse()`の呼び出しは正常であることが確認された。

さらなる調査の結果、問題の根本原因はCSSのスタイリングにあったことが判明した。

**問題のロジック:**

1. プロンプトカードのプレビュー表示（`.prompt-preview`）では、複数行のテキストを省略して表示するために `display: -webkit-box;` という古いCSSプロパティが使用されていた。
2. プレビューモーダル内のコンテンツ表示領域も同じ `.prompt-preview` クラスを使用していたため、このスタイルが適用されていた。
3. `display: -webkit-box;` は、`marked.js`によって生成されたブロックレベル要素（`<p>`, `<h1>`など）の描画を阻害し、結果としてコンテンツが表示されなくなっていた。
4. しかし、要素自体は存在し、内容に応じた高さを持っていたため、親要素のスクロールバーだけが表示されるという奇妙な現象を引き起こしていた。

### 実施した修正

`style.css`を修正し、プレビューモーダル内の `.prompt-preview` に適用されるスタイルを上書きするルールを追加した。

```css
/* 修正後のルール */
.modal-preview .prompt-preview {
  display: block !important; /* ★★★ 修正: -webkit-boxを上書き ★★★ */
  max-height: none !important;
  height: 100% !important;
  padding: 0.5rem !important;
  margin: 0 !important;
  border: none !important;
  background: transparent !important;
  overflow-y: auto !important; /* visibleからautoに変更し、スクロールを正常化 */
}
```

**修正のポイント:**

- `display: block !important;` を追加して、問題の原因である `display: -webkit-box;` を無効化。
- `overflow-y: auto !important;` に変更し、コンテンツが領域を超えた場合にのみスクロールバーが表示されるように正常化した。

この修正により、プレビューモーダルでプロンプトの内容が正しく表示される問題が解決された。

---

## 総合修正履歴 (v7.2.1 - v8.0.0)

### v7.3.0: プレビューモーダルのレイアウトとスタイルの再設計

- **問題**: ボタンが見切れる、行間が意図通りでない、というフィードバックへの対応。および、将来的なレイアウト崩れを防ぐための予防的措置。
- **修正**:
    - **キャッシュ対策**: `index.html`のCSS読み込みにバージョンクエリ (`?v=2.0`) を追加し、変更が確実に反映されるようにした。
    - **レイアウト再設計**: プレビューモーダル全体を堅牢なFlexboxレイアウトに書き換え。`vh`単位での固定的な高さ指定を廃止し、ヘッダー・フッターの高さを確保しつつ、メインコンテンツ領域が残りのスペースをすべて使うようにした。これにより、要素の見切れ問題を根本的に解決。
    - **スタイル調整**: ご要望に基づき、情報密度を高めるため、フォントサイズを`0.75rem`に、行間を`1.15`に、段落マージンを`0.2em`に再調整した。

### v8.0.0 (相当): プロンプトデータの大規模更新

- **内容**: `prompts.json` の内容を `versions/v5.0.0/prompts` ディレクトリ内の全プロンプト（22個）で完全に置き換え。
- **手順**:
    1. 既存の `prompts.json` を `prompts.json.bak` としてバックアップ。
    2. Pythonスクリプトを生成・実行し、指定ディレクトリ内の`.md`ファイルを再帰的に読み込み、新しい`prompts.json`を自動生成。
- **結果**: プロンプトデータがv5.0.0のバージョンに更新された。