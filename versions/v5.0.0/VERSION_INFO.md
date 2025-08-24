# AI Prompt Helper Ver5.0.0 - Markdownファイル対応版

## バージョン概要

Ver5.0.0では、プロンプトファイルの形式を従来の.txtファイルから**.mdファイル（Markdown）に変更**しました。これにより、プロンプトの管理と可読性が向上し、将来的なマークダウン記法のサポートが可能になります。

## Ver5.0.0の主要変更点

### 1. ファイル形式の変更

**プロンプトファイル拡張子の変更：**
- **変更前（Ver4.0.0まで）**: `.txt`ファイル
- **変更後（Ver5.0.0）**: `.md`ファイル

### 2. プロンプト挿入動作の改善

**既存テキスト保持機能の追加：**
- **変更前**: プロンプト挿入時に既存テキストを完全に置き換え
- **変更後**: 既存テキストを保持し、末尾に新しいプロンプトを追加

**動作例：**
```
既存テキスト: "こんにちは"
新プロンプト: "よろしくお願いします"
結果: "こんにちは\n\nよろしくお願いします"
```

### 3. アイコン表示の安定化

**常時表示機能の実装：**
- **変更前**: 入力欄にテキストがある場合、アイコンが非表示になることがある
- **変更後**: 入力欄の内容に関係なく、常にアイコンが表示される

**位置調整の改善：**
- **統一位置**: 全サイト共通で入力欄の左上に配置
- **サイト別微調整**: Claude.ai, ChatGPT, Gemini別の細かい位置調整
- **画面端対応**: 左端/右端でのアイコン位置を自動調整
- **表示安定性**: MutationObserverによる積極的な復元
- **z-index最適化**: 他のUI要素に埋もれないよう優先度を設定
- **要素検出強化**: isVisible()関数による表示中要素の確実な検出

### 4. システム変更箇所

#### content.js の更新

**ファイル拡張子対応:**
```javascript
// 変更前
const title = removeNumberPrefix(promptFile.replace('.txt', ''));

// 変更後  
const title = removeNumberPrefix(promptFile.replace('.md', ''));
```

**プロンプト挿入処理:**
```javascript
// 変更前（置き換え）
textarea.value = text;

// 変更後（追加）
const currentValue = textarea.value;
const newValue = currentValue ? currentValue + '\n\n' + text : text;
textarea.value = newValue;
```

**アイコン表示制御:**
```javascript
// 変更前（条件付き作成）
if (!document.getElementById('prompt-helper') && findTextarea()) {
  createPromptHelper();
}

// 変更後（積極的な復元）  
if (textarea) {
  if (!existingHelper) {
    createPromptHelper();
  } else {
    existingHelper.style.display = 'block';
  }
}
```

**位置計算の最適化:**
```javascript
// 全サイト統一: 入力欄の左上に配置
let leftPosition = Math.max(rect.left - 45, 10);
let topPosition = Math.max(rect.top - 5, 10);

// サイト別の微調整
if (site === 'claude') {
  leftPosition = Math.max(rect.left - 35, 10);
  topPosition = Math.max(rect.top + 5, 10);
} else if (site === 'chatgpt') {
  leftPosition = Math.max(rect.left - 45, 10);
  topPosition = Math.max(rect.top - 5, 10);
}
```

**デバッグ機能の強化:**
```javascript
// 入力欄検出のデバッグ情報
console.log(`入力欄検出成功 (${site}): ${selector}`, element);

// 全contenteditable要素の詳細情報表示
allContentEditables.forEach((el, i) => {
  console.log(`contenteditable[${i}]: visible=${isVisible(el)}`);
});
```

#### manifest.json の更新
```json
// 変更前
"resources": ["prompts/**/*.txt"]

// 変更後
"resources": ["prompts/**/*.md"] 
```

#### scanPromptFolders() 関数の更新
すべてのプロンプト配列で拡張子を.txtから.mdに変更:
```javascript
// 例: STEP1のプロンプト一覧
prompts: ['001_コア設定.md', '002_事前設定.md', '003_設定の完了.md']
```

### 3. 既存ファイルの一括変換

Ver4.0.0からVer5.0.0への移行時、すべての既存.txtファイルを.mdファイルに自動変換:

```bash
find . -name "*.txt" -exec sh -c 'mv "$1" "${1%.txt}.md"' _ {} \;
```

**変換対象ファイル一覧（18ファイル）:**
- 001_本気モード/001_STEP1/: 3ファイル
- 001_本気モード/002_STEP1.5/: 1ファイル  
- 001_本気モード/003_STEP2/: 3ファイル
- 001_本気モード/004_STEP3/: 1ファイル
- 002_ワンショット/001_一般/: 6ファイル
- 002_ワンショット/002_ペルソナ/: 1ファイル
- 002_ワンショット/003_プログラム/: 3ファイル

## 互換性について

### 下位互換性
- **フォルダ構造**: 変更なし（3階層構造を維持）
- **命名規則**: 変更なし（数字接頭語_名前.拡張子）
- **UI表示**: 変更なし（ファイル拡張子は表示されない）

### 機能継承・追加
Ver4.0.0の以下の機能をすべて継承:
- 改行の視覚的反映機能
- 完全動的フォルダスキャン機能
- 多サイト対応（10サイト）
- インラインUI表示

Ver5.0.0の新機能:
- **既存テキスト保持**: プロンプト挿入時に既存テキストを保持
- **末尾追加**: 新しいプロンプトを既存テキストの末尾に追加
- **常時表示**: 入力欄の内容に関係なくアイコンが常に表示
- **位置調整**: 画面端での自動位置調整と表示安定性の向上
- **厳密入力欄検出**: サイズ、位置、可視性による総合判定
- **スコア評価**: 複数候補から最適な入力欄を自動選択
- **フェイルセーフ**: 検出失敗時の安全な代替位置表示

## 今後の拡張可能性

### Markdownサポートの準備
Ver5.0.0でのファイル形式変更により、将来的に以下が可能:
- **マークダウン記法の視覚的サポート**
- **コードブロックの構文ハイライト**
- **リンクや画像の埋め込み**
- **テーブル表示**

### 管理面の改善
- **可読性向上**: エディタでのシンタックスハイライト
- **バージョン管理**: Gitでの差分表示の改善
- **ドキュメント統合**: 他のMarkdownファイルとの統一

## Ver4.0.0からの移行手順

1. **ファイルのバックアップ**: Ver4.0.0のファイルを保持
2. **Ver5.0.0の展開**: 新しいバージョンファイルを配置
3. **Chrome拡張の更新**: 拡張機能を再インストール
4. **動作確認**: すべてのプロンプトが正常に表示されることを確認

## 技術仕様

### 対応サイト（Ver4.0.0から継承）
- ChatGPT (chat.openai.com, chatgpt.com)
- Claude (claude.ai)
- Google Gemini/Bard (gemini.google.com, bard.google.com) 
- Microsoft Copilot (copilot.microsoft.com)
- Perplexity AI (perplexity.ai)
- Felo AI (felo.ai)
- NotebookLM (notebooklm.google.com)
- Grok (grok.com, x.ai)
- Genspark (genspark.ai)

### システム要件
- Chrome Manifest V3
- ファイル読み込み: fetch() API
- Web Accessible Resources: prompts/**/*.md

Ver5.0.0は、プロンプト管理の将来的な発展を見据えた重要な基盤変更となります。