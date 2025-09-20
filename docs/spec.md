# AI Prompt Helper v8.0.0 - 技術仕様書

**最終更新**: 2025-09-21
**バージョン**: v8.0.0
**ステータス**: 実装完了

## プロジェクト概要

ChatGPT、Claude、Google Geminiなどの AIチャットサイトでプロンプトサンプルを簡単に選択・入力できるChrome拡張機能です。v8.0.0では **プロンプトテンプレート変数システム** を新機能として実装しました。

### コアコンセプト
- **シンプル・ローカルファースト・ゼロ設定**
- **プロンプトテンプレート変数による動的生成**
- **AIサイト特化の最適化**

## 主要機能

### 1. プロンプトテンプレート変数システム (v8.0.0新機能)

#### 基本動作
```
入力: [ユーザー名]さんの[業種]について[質問内容]を教えて

→ 変数検出: [ユーザー名], [業種], [質問内容]
→ カスタマイズモーダル表示
→ ユーザー入力: "田中", "IT", "最新トレンド"
→ 生成結果: "田中さんのITについて最新トレンドを教えて"
```

#### 変数構文
```javascript
// 変数検出正規表現
const regex = /\[([a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s_-]+)\]/g;

// 対応文字種
- 英数字: a-zA-Z0-9
- ひらがな: \u3040-\u309F
- カタカナ: \u30A0-\u30FF
- 漢字: \u4E00-\u9FAF
- 区切り文字: スペース、アンダースコア、ハイフン
```

#### UI仕様
- **カスタマイズモーダル**: ダークテーマ、CSP準拠
- **リアルタイムプレビュー**: 入力変更時に即座にプレビュー更新
- **色分け表示**: 各変数に固有色を自動割り当て
- **レスポンシブ対応**: モバイル・デスクトップ両対応

### 2. AIサイト対応

#### 対応サイト一覧
| サイト | URL | 要素タイプ | 特殊対応 |
|--------|-----|----------|----------|
| ChatGPT | openai.com, chatgpt.com | textarea | 標準 |
| Claude.ai | claude.ai | contenteditable | execCommand |
| Google Gemini | gemini.google.com | contenteditable | 標準 |
| Microsoft Copilot | copilot.microsoft.com | contenteditable | 標準 |
| Perplexity | perplexity.ai | contenteditable | 標準 |

#### Claude.ai特殊対応 (v8.0.0改善)
```javascript
// Claude.ai専用の挿入ロジック
if (site === 'claude') {
  // execCommandによる確実な挿入
  const success = document.execCommand('insertText', false, newText);
  if (success) {
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
```

### 3. アーキテクチャ

#### 技術スタック
- **Manifest**: V3 (最新規格)
- **CSP**: 厳格なContent Security Policy準拠
- **DOM操作**: Vanilla JavaScript (React競合回避)
- **ストレージ**: Chrome Storage Local API

#### ファイル構成
```
chrome_ext-ai_prompt_helper/
├── manifest.json           # 拡張機能設定
├── src/
│   ├── content.js          # メインロジック
│   ├── popup.html          # ポップアップUI
│   ├── popup.js            # ポップアップロジック
│   └── styles.css          # スタイルシート
├── icons/                  # アイコンファイル
└── docs/                   # ドキュメント
```

#### データフロー
```
1. ユーザーがプロンプト選択
2. 変数検出 (extractVariables)
3. 変数あり → カスタマイズモーダル表示
4. 変数なし → 直接挿入
5. AIサイト判定 (detectAISite)
6. サイト別最適化挿入 (insertPrompt)
```

## 技術実装詳細

### 変数検出システム

#### extractVariables関数
```javascript
function extractVariables(promptText) {
  const regex = /\[([a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s_-]+)\]/g;
  const variables = [];
  let match;

  while ((match = regex.exec(promptText)) !== null) {
    const varName = match[1].trim();
    if (varName && !variables.some(v => v.name === varName)) {
      variables.push({
        name: varName,
        placeholder: `${varName}を入力`,
        defaultValue: "",
        value: "",
        color: getVariableColor(variables.length)
      });
    }
  }
  return variables;
}
```

#### replaceVariables関数
```javascript
function replaceVariables(template, variables) {
  let result = template;
  variables.forEach(variable => {
    const placeholder = `[${variable.name}]`;
    const regex = new RegExp(escapeRegExp(placeholder), 'g');
    result = result.replace(regex, variable.value || placeholder);
  });
  return result;
}
```

### カスタマイズモーダル

#### CSS設計
```css
/* CSP準拠のインラインスタイル */
.variable-modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000000;
}

.variable-modal {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  color: white;
}
```

#### プレビュー機能
```javascript
function updatePreviewContent(container, promptText, variables) {
  // HTMLエスケープ処理
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 変数を色付きスパンに置換
  let processedText = escapeHtml(promptText);
  variables.forEach(variable => {
    const placeholder = `[${variable.name}]`;
    const coloredSpan = `<span style="background-color: ${variable.color}; color: #000000;">${placeholder}</span>`;
    processedText = processedText.replaceAll(placeholder, coloredSpan);
  });

  container.innerHTML = processedText;
}
```

### AIサイト連携

#### サイト検出
```javascript
function detectAISite() {
  const hostname = window.location.hostname;
  if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
    return 'chatgpt';
  } else if (hostname.includes('claude.ai')) {
    return 'claude';
  } else if (hostname.includes('gemini.google.com')) {
    return 'gemini';
  }
  // ... 他のサイト
  return null;
}
```

#### 入力欄検出
```javascript
function findTextarea() {
  const site = detectAISite();
  let selectors = [];

  if (site === 'claude') {
    selectors = [
      'div[contenteditable="true"][data-placeholder]',
      'div[contenteditable="true"]',
      'div[role="textbox"]'
    ];
  } else if (site === 'chatgpt') {
    selectors = [
      'textarea[data-testid="textbox"]',
      'textarea[placeholder*="Message"]'
    ];
  }

  for (const selector of selectors) {
    const elem = document.querySelector(selector);
    if (elem) return elem;
  }
  return null;
}
```

#### 挿入処理
```javascript
function insertPrompt(text) {
  const textarea = findTextarea();
  if (!textarea) return;

  textarea.focus();

  if (textarea.tagName === 'TEXTAREA') {
    // TEXTAREA要素の場合
    const currentValue = textarea.value;
    const newValue = currentValue ? currentValue + '\n\n' + text : text;
    textarea.value = newValue;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    // contenteditable要素の場合
    const site = detectAISite();

    if (site === 'claude') {
      // Claude.ai専用処理
      const success = document.execCommand('insertText', false, text);
      if (success) {
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else {
      // その他のサイト
      textarea.textContent = text;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}
```

## セキュリティ仕様

### CSP (Content Security Policy) 準拠
```javascript
// 禁止事項
- インラインイベントハンドラー (onclick等)
- innerHTML による HTML インジェクション
- eval() や Function() の使用

// 許可事項
- addEventListener による安全なイベント処理
- createElement + textContent による安全な DOM 操作
- CSP準拠のスタイル設定
```

### Chrome拡張機能権限
```json
{
  "permissions": [
    "activeTab",
    "storage"
  ],
  "host_permissions": [
    "https://claude.ai/*",
    "https://chat.openai.com/*",
    "https://chatgpt.com/*",
    "https://gemini.google.com/*"
  ]
}
```

## パフォーマンス仕様

### 応答時間
- **変数検出**: < 10ms (1000文字プロンプト)
- **モーダル表示**: < 100ms
- **プロンプト挿入**: < 50ms
- **プレビュー更新**: < 20ms

### メモリ使用量
- **ベースライン**: ~2MB
- **モーダル表示時**: ~3MB
- **変数処理時**: ~0.5MB追加

### 互換性
- **Chrome**: 120+ (推奨)
- **Edge**: 120+
- **OS**: Windows 10/11, macOS 10.15+, Linux

## 既知の制約・制限

### Claude.ai特有の制約
1. **React制御**: 厳格なReact Controlled Component
2. **CSP制限**: 厳しいContent Security Policy
3. **イベント制御**: カスタムイベントハンドラーによる標準イベント上書き

### 技術的制限
1. **SPA対応**: Single Page Applicationの動的変更への追従
2. **contenteditable**: ブラウザ間での実装差異
3. **サイト変更**: AIサイトの仕様変更への継続対応必要

### ユーザビリティ制限
1. **変数名制限**: 括弧内の文字種制限あり
2. **プレビュー精度**: 複雑な変数構造での表示限界
3. **モバイル対応**: 小画面での操作性制限

## テスト仕様

### 単体テスト対象
- `extractVariables()`: 変数検出精度
- `replaceVariables()`: 変数置換精度
- `detectAISite()`: サイト判定精度
- `findTextarea()`: 要素検出精度

### 統合テスト対象
- エンドツーエンドの変数処理フロー
- 各AIサイトでの挿入動作
- モーダルUI操作フロー
- エラーハンドリング

### ブラウザテスト
- Chrome 120+
- Edge 120+
- macOS/Windows/Linux環境

## 今後のロードマップ

### v8.1.0 (予定)
- **テンプレート共有機能**: インポート/エクスポート
- **変数型拡張**: 選択肢、日付、数値型
- **バッチ処理**: 複数プロンプトの一括変換

### v8.2.0 (予定)
- **AI応答分析**: プロンプト効果測定
- **使用統計**: 利用頻度・成功率分析
- **パフォーマンス最適化**: メモリ使用量削減

### v9.0.0 (構想)
- **プロンプトエンジニアリング支援**: AI提案機能
- **多言語対応**: 国際化
- **クラウド同期**: デバイス間同期

---

**開発チーム**: Gantaku
**ライセンス**: MIT
**リポジトリ**: GitHub (Private)
**更新履歴**: v1.0.0 → v8.0.0 (2025年8-9月)