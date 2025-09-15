/**
 * AI Prompt Helper v6.1.0 - Content Script
 * ローカルファースト・ゼロ設定 プロンプト挿入システム
 */

// ==========================================================================
// グローバル変数
// ==========================================================================

let isInitialized = false;
let promptButton = null;
let currentSite = null;

// ==========================================================================
// 初期化
// ==========================================================================

// DOM読み込み完了後に実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {
  currentSite = detectAISite();
  if (!currentSite) {
    console.log('AI Prompt Helper: 対応サイトではありません');
    return;
  }

  console.log(`AI Prompt Helper v6.1.0 初期化開始: ${currentSite}`);

  try {
    // 少し待ってからUIを作成（サイトのロード完了待ち）
    setTimeout(() => {
      createPromptButton();
      setupMessageListener();
      setupDOMObserver();
      isInitialized = true;
      console.log('AI Prompt Helper v6.1.0 初期化完了');
    }, 2000);

  } catch (error) {
    console.error('AI Prompt Helper 初期化エラー:', error);
  }
}

// ==========================================================================
// AIサイト判定
// ==========================================================================

function detectAISite() {
  const hostname = window.location.hostname;
  const url = window.location.href;

  if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
    return 'chatgpt';
  } else if (hostname.includes('claude.ai')) {
    return 'claude';
  } else if (hostname.includes('gemini.google.com') || hostname.includes('bard.google.com')) {
    return 'gemini';
  } else if (hostname.includes('copilot.microsoft.com') || url.includes('microsoft.com/copilot')) {
    return 'copilot';
  } else if (hostname.includes('perplexity.ai')) {
    return 'perplexity';
  } else if (hostname.includes('felo.ai')) {
    return 'felo';
  } else if (hostname.includes('notebooklm.google.com')) {
    return 'notebooklm';
  } else if (hostname.includes('grok.com') || hostname.includes('x.ai')) {
    return 'grok';
  } else if (hostname.includes('genspark.ai')) {
    return 'genspark';
  }

  return null;
}

// ==========================================================================
// プロンプトボタンの作成
// ==========================================================================

function createPromptButton() {
  // 既存のボタンがあれば削除
  if (promptButton) {
    promptButton.remove();
  }

  // プロンプトボタンを作成
  promptButton = document.createElement('button');
  promptButton.id = 'ai-prompt-helper-btn';
  promptButton.innerHTML = '📝';
  promptButton.title = 'AI Prompt Helper - プロンプトを選択';

  // ボタンのスタイル設定
  Object.assign(promptButton.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#06b6d4',
    color: 'white',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
    zIndex: '999999',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  });

  // ホバー効果
  promptButton.addEventListener('mouseenter', () => {
    promptButton.style.transform = 'scale(1.1)';
    promptButton.style.boxShadow = '0 6px 16px rgba(6, 182, 212, 0.4)';
  });

  promptButton.addEventListener('mouseleave', () => {
    promptButton.style.transform = 'scale(1)';
    promptButton.style.boxShadow = '0 4px 12px rgba(6, 182, 212, 0.3)';
  });

  // クリックイベント
  promptButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openPromptPopup();
  });

  // ページに追加
  document.body.appendChild(promptButton);
  console.log('プロンプトボタンを作成しました');
}

// ==========================================================================
// プロンプト選択ポップアップ
// ==========================================================================

function openPromptPopup() {
  try {
    // Chrome拡張機能のポップアップを開く
    chrome.runtime.sendMessage({ action: 'openPopup' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('ポップアップ開放エラー:', chrome.runtime.lastError);
        showNotification('プロンプト管理画面を開けませんでした', 'error');
      }
    });
  } catch (error) {
    console.error('ポップアップ開放エラー:', error);
    showNotification('エラーが発生しました', 'error');
  }
}

// ==========================================================================
// プロンプト挿入機能
// ==========================================================================

function findTextarea() {
  // サイトごとの入力欄セレクター
  const selectors = {
    chatgpt: [
      '#prompt-textarea',
      'textarea[placeholder*="ChatGPT"]',
      'textarea[placeholder*="Message"]',
      'div[contenteditable="true"]',
      'textarea'
    ],
    claude: [
      'div[contenteditable="true"]',
      'textarea',
      'div.ProseMirror',
      '[data-testid="chat-input"]'
    ],
    gemini: [
      'div[contenteditable="true"]',
      'textarea',
      'div.ql-editor',
      '[data-testid="input-field"]'
    ],
    copilot: [
      'textarea[placeholder*="Ask me anything"]',
      'div[contenteditable="true"]',
      'textarea'
    ],
    perplexity: [
      'textarea[placeholder*="Ask anything"]',
      'div[contenteditable="true"]',
      'textarea'
    ],
    felo: [
      'textarea',
      'div[contenteditable="true"]',
      'input[type="text"]'
    ],
    notebooklm: [
      'textarea',
      'div[contenteditable="true"]',
      'input[type="text"]'
    ],
    grok: [
      'textarea',
      'div[contenteditable="true"]',
      'input[type="text"]'
    ],
    genspark: [
      'textarea',
      'div[contenteditable="true"]',
      'input[type="text"]'
    ]
  };

  const siteSelectors = selectors[currentSite] || selectors.chatgpt;

  for (const selector of siteSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      // 要素が見えているかチェック
      if (element.offsetParent !== null && !element.disabled && !element.readOnly) {
        return element;
      }
    }
  }

  return null;
}

async function insertPrompt(promptData) {
  const { title, prompt } = promptData;

  try {
    const textarea = findTextarea();

    if (!textarea) {
      showNotification('入力欄が見つかりませんでした', 'error');
      return false;
    }

    // フォーカスを設定
    textarea.focus();

    // 既存のテキストをクリア（サイトによって処理を分ける）
    if (textarea.tagName.toLowerCase() === 'textarea' || textarea.tagName.toLowerCase() === 'input') {
      // 通常のtextarea/input要素
      textarea.value = '';
      textarea.value = prompt;

      // イベントを発火
      ['input', 'change', 'keyup'].forEach(eventType => {
        textarea.dispatchEvent(new Event(eventType, { bubbles: true }));
      });

    } else if (textarea.contentEditable === 'true') {
      // contentEditable要素
      // まずクリア
      textarea.innerHTML = '';
      textarea.textContent = '';

      // プロンプトを挿入
      if (currentSite === 'claude') {
        // Claude.aiでは特別な処理
        await insertToClaudeAI(textarea, prompt);
      } else {
        // その他のサイト
        textarea.textContent = prompt;

        // イベントを発火
        ['input', 'change', 'keyup', 'compositionend'].forEach(eventType => {
          textarea.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
      }
    }

    // 成功通知
    showNotification(`「${title}」を挿入しました`, 'success');
    console.log('プロンプト挿入成功:', title);
    return true;

  } catch (error) {
    console.error('プロンプト挿入エラー:', error);
    showNotification('プロンプトの挿入に失敗しました', 'error');
    return false;
  }
}

// Claude.ai専用の挿入処理
async function insertToClaudeAI(textarea, prompt) {
  try {
    // Clipboard APIを使用
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(prompt);

      // ペーストイベントをシミュレート
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer()
      });

      // クリップボードデータを設定
      pasteEvent.clipboardData.setData('text/plain', prompt);

      // フォーカスしてペーストイベントを発火
      textarea.focus();
      textarea.dispatchEvent(pasteEvent);

      // 念のため直接設定も試行
      setTimeout(() => {
        if (!textarea.textContent || textarea.textContent.trim() === '') {
          textarea.textContent = prompt;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 100);

    } else {
      // Clipboard APIが使えない場合
      textarea.textContent = prompt;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

  } catch (error) {
    console.warn('Claude.ai挿入エラー:', error);
    // フォールバック
    textarea.textContent = prompt;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

// ==========================================================================
// 通知システム
// ==========================================================================

function showNotification(message, type = 'info') {
  // 既存の通知があれば削除
  const existingNotification = document.getElementById('ai-prompt-helper-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // 通知要素を作成
  const notification = document.createElement('div');
  notification.id = 'ai-prompt-helper-notification';
  notification.textContent = message;

  // 色設定
  const colors = {
    success: { bg: '#10b981', text: 'white' },
    error: { bg: '#ef4444', text: 'white' },
    warning: { bg: '#f59e0b', text: 'white' },
    info: { bg: '#06b6d4', text: 'white' }
  };

  const color = colors[type] || colors.info;

  // スタイル設定
  Object.assign(notification.style, {
    position: 'fixed',
    top: '80px',
    right: '20px',
    backgroundColor: color.bg,
    color: color.text,
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: '999998',
    maxWidth: '300px',
    wordWrap: 'break-word',
    animation: 'slideIn 0.3s ease'
  });

  // アニメーションCSS
  if (!document.getElementById('ai-prompt-helper-styles')) {
    const style = document.createElement('style');
    style.id = 'ai-prompt-helper-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ページに追加
  document.body.appendChild(notification);

  // 3秒後に削除
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}

// ==========================================================================
// メッセージリスナー
// ==========================================================================

function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script でメッセージを受信:', message);

    if (message.action === 'insertPrompt') {
      insertPrompt(message.data)
        .then(success => {
          sendResponse({ success });
        })
        .catch(error => {
          console.error('プロンプト挿入処理エラー:', error);
          sendResponse({ success: false, error: error.message });
        });

      // 非同期処理のため
      return true;
    }

    return false;
  });

  console.log('メッセージリスナーを設定しました');
}

// ==========================================================================
// DOM監視（SPA対応）
// ==========================================================================

function setupDOMObserver() {
  const observer = new MutationObserver(() => {
    // ボタンが削除されていたら再作成
    if (isInitialized && !document.getElementById('ai-prompt-helper-btn')) {
      console.log('ボタンが削除されたため再作成');
      createPromptButton();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('DOM監視を開始しました');
}

// ==========================================================================
// エラーハンドリング
// ==========================================================================

window.addEventListener('error', (event) => {
  console.error('Content Script Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});

console.log('AI Prompt Helper v6.1.0 Content Script loaded - ローカルファースト版');