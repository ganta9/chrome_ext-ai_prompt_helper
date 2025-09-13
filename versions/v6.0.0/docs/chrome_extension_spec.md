# Chrome拡張機能 v6.0.0 仕様書

## 概要
GitHub Pages編集サイトと連携したプロンプト選択・自動入力システム

## UI設計

### 基本配置
```
AI入力画面（ChatGPT/Claude/Gemini等）
┌─────────────────────────────────────────────────────┐
│                                               [📝] │ ← 画面右端固定ボタン
│ [入力欄...........................]              │
│                                                   │
│                                                   │
└─────────────────────────────────────────────────────┘
```

### ボタン仕様
- **位置**: 画面右端固定（right: 20px, top: 50%）
- **サイズ**: 50px × 50px（円形）
- **アイコン**: 📝（ノートアイコン）
- **色**: 青紫系（#4f46e5）
- **z-index**: 10000（最前面表示）

## 動作フロー

### 1. プロンプト選択フロー
```
[📝] ボタンクリック
        ↓
GitHub Pages編集サイトを新しいタブで開く
(https://username.github.io/prompt-helper-data/)
        ↓
ユーザーがプロンプトを選択・クリック
        ↓
GitHub Pages → 元のタブに postMessage 送信
        ↓
Chrome拡張機能が受信 → 入力欄に自動挿入
        ↓
GitHub Pagesタブは自動で閉じる
```

### 2. データ取得方式
- **頻度**: 毎回GitHub Pagesから最新データ取得
- **キャッシュ**: なし（常に最新データを保証）
- **フォールバック**: 取得失敗時はエラーメッセージ表示

## 技術仕様

### manifest.json
```json
{
  "manifest_version": 3,
  "name": "AI Prompt Helper",
  "version": "6.0.0",
  "description": "GitHub Pages連携プロンプト管理システム",
  "permissions": [
    "activeTab",
    "storage"
  ],
  "content_scripts": [
    {
      "matches": [
        "*://chat.openai.com/*",
        "*://chatgpt.com/*",
        "*://claude.ai/*",
        "*://gemini.google.com/*",
        "*://bard.google.com/*"
      ],
      "js": ["src/content.js"],
      "css": ["src/styles.css"]
    }
  ],
  "action": {
    "default_popup": "src/popup.html"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png", 
    "128": "icons/icon128.png"
  }
}
```

### content.js 主要機能

#### ボタン作成・配置
```javascript
function createPromptButton() {
  const button = document.createElement('button');
  button.id = 'prompt-helper-btn';
  button.innerHTML = '📝';
  button.className = 'prompt-helper-fixed-btn';
  button.title = 'プロンプトヘルパーを開く';
  
  // 固定位置スタイル
  button.style.cssText = `
    position: fixed;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
    z-index: 10000;
    width: 50px;
    height: 50px;
    border-radius: 25px;
    background: #4f46e5;
    color: white;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 20px;
    transition: all 0.3s ease;
  `;
  
  // ホバー効果
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-50%) scale(1.1)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(-50%) scale(1)';
  });
  
  button.addEventListener('click', openPromptSelector);
  document.body.appendChild(button);
}
```

#### GitHub Pages連携
```javascript
// GitHub Pages編集サイトを開く
function openPromptSelector() {
  const githubPagesUrl = getGitHubPagesUrl();
  
  // ポップアップ設定
  const popup = window.open(
    githubPagesUrl, 
    'prompt-helper',
    'width=1200,height=800,scrollbars=yes,resizable=yes'
  );
  
  // ポップアップブロック検出
  if (!popup || popup.closed) {
    alert('ポップアップがブロックされました。ポップアップを許可してください。');
    return;
  }
  
  // ポップアップが閉じられるまで監視
  const checkClosed = setInterval(() => {
    if (popup.closed) {
      clearInterval(checkClosed);
    }
  }, 1000);
}

// 設定からGitHub Pages URLを取得
async function getGitHubPagesUrl() {
  const result = await chrome.storage.sync.get(['githubPagesUrl']);
  return result.githubPagesUrl || 'https://username.github.io/prompt-helper-data/';
}

// GitHub Pagesからのメッセージ受信
window.addEventListener('message', (event) => {
  // セキュリティチェック：GitHub関連のオリジンのみ許可
  if (!isValidOrigin(event.origin)) {
    console.warn('Invalid origin:', event.origin);
    return;
  }
  
  if (event.data.type === 'PROMPT_SELECTED') {
    insertPrompt(event.data.prompt);
    
    // 成功通知
    showNotification('プロンプトを挿入しました', 'success');
  }
});

// 安全なオリジンかチェック
function isValidOrigin(origin) {
  const allowedDomains = [
    'github.io',
    'github.com',
    'localhost' // 開発用
  ];
  return allowedDomains.some(domain => origin.includes(domain));
}
```

#### プロンプト挿入
```javascript
// プロンプトを入力欄に挿入
function insertPrompt(text) {
  const textarea = findTextarea();
  if (!textarea) {
    showNotification('入力欄が見つかりません', 'error');
    return;
  }
  
  textarea.focus();
  
  if (textarea.tagName === 'TEXTAREA') {
    // TEXTAREA要素
    const currentValue = textarea.value;
    const newValue = currentValue ? currentValue + '\n\n' + text : text;
    textarea.value = newValue;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    // contenteditable要素
    const currentText = textarea.textContent || textarea.innerText || '';
    const newText = currentText ? currentText + '\n\n' + text : text;
    
    // サイト別の最適化された挿入方法を使用
    insertTextBySite(textarea, newText);
  }
  
  // カーソル位置を末尾に移動
  if (textarea.setSelectionRange) {
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }
}

// サイト別プロンプト挿入
function insertTextBySite(element, text) {
  const site = detectAISite();
  
  if (site === 'claude' || site === 'chatgpt') {
    // Clipboard APIを使用
    navigator.clipboard.writeText(text).then(() => {
      element.textContent = '';
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer()
      });
      pasteEvent.clipboardData.setData('text/plain', text);
      element.dispatchEvent(pasteEvent);
    }).catch(() => {
      // フォールバック
      element.textContent = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
  } else {
    // 汎用的な方法
    element.textContent = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
```

### popup.html 設定画面

#### HTML構造
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { width: 300px; padding: 16px; }
    .setting-group { margin-bottom: 16px; }
    input[type="text"] { width: 100%; padding: 8px; }
    button { padding: 8px 16px; margin: 4px; }
    .success { color: #10b981; }
    .error { color: #ef4444; }
  </style>
</head>
<body>
  <h3>AI Prompt Helper v6.0</h3>
  
  <div class="setting-group">
    <label>GitHub Pages URL:</label>
    <input type="text" id="github-pages-url" 
           placeholder="https://username.github.io/prompt-helper-data/">
    <button id="save-settings">保存</button>
  </div>
  
  <div class="setting-group">
    <button id="test-connection">接続テスト</button>
    <button id="open-editor">編集サイトを開く</button>
  </div>
  
  <div id="status"></div>
  
  <script src="popup.js"></script>
</body>
</html>
```

#### popup.js
```javascript
// 設定の読み込み・保存
document.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.sync.get(['githubPagesUrl']);
  document.getElementById('github-pages-url').value = 
    result.githubPagesUrl || '';
});

document.getElementById('save-settings').addEventListener('click', async () => {
  const url = document.getElementById('github-pages-url').value;
  
  if (!url) {
    showStatus('URLを入力してください', 'error');
    return;
  }
  
  if (!isValidUrl(url)) {
    showStatus('有効なURLを入力してください', 'error');
    return;
  }
  
  await chrome.storage.sync.set({ githubPagesUrl: url });
  showStatus('設定を保存しました', 'success');
});

document.getElementById('test-connection').addEventListener('click', async () => {
  const url = document.getElementById('github-pages-url').value;
  
  if (!url) {
    showStatus('URLを入力してください', 'error');
    return;
  }
  
  try {
    const response = await fetch(url + 'data/prompts.json');
    if (response.ok) {
      const data = await response.json();
      showStatus(`接続成功: ${data.prompts?.length || 0}個のプロンプト`, 'success');
    } else {
      showStatus('接続失敗: データファイルが見つかりません', 'error');
    }
  } catch (error) {
    showStatus('接続失敗: ' + error.message, 'error');
  }
});

document.getElementById('open-editor').addEventListener('click', () => {
  const url = document.getElementById('github-pages-url').value || 
              'https://username.github.io/prompt-helper-data/';
  chrome.tabs.create({ url: url });
});

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = type;
  setTimeout(() => {
    status.textContent = '';
    status.className = '';
  }, 3000);
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
```

## エラーハンドリング

### 一般的なエラー対応
1. **GitHub Pages接続失敗**: フォールバック用のデフォルトプロンプト表示
2. **ポップアップブロック**: ユーザーに許可を求めるメッセージ
3. **入力欄検出失敗**: エラーメッセージとリトライ機能
4. **データ形式エラー**: 設定画面でエラー詳細を表示

### 通知システム
```javascript
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `prompt-notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    background: ${type === 'success' ? '#10b981' : 
                  type === 'error' ? '#ef4444' : '#4f46e5'};
    color: white;
    border-radius: 6px;
    z-index: 10001;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
```

## セキュリティ考慮事項

1. **オリジン検証**: GitHub関連のドメインからのメッセージのみ受信
2. **URL検証**: 設定画面でのURL妥当性チェック
3. **XSS対策**: ユーザー入力のサニタイズ
4. **CSP対応**: Manifest V3の制約に準拠

## パフォーマンス最適化

1. **遅延ロード**: ボタンは必要時のみ作成
2. **イベント最適化**: リスナーの適切な削除
3. **メモリ管理**: 不要なオブジェクトの解放
4. **バンドルサイズ**: 最小限の依存関係

## 今後の拡張予定

- キーボードショートカット対応
- プロンプト履歴機能
- オフライン対応
- 複数GitHub Pagesサイト対応