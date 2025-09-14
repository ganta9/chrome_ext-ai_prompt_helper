/**
 * AI Prompt Helper v6.0.0 - Content Script
 * GitHub Pages編集サイト連携対応
 */

// ==========================================================================
// グローバル変数
// ==========================================================================

let promptHelperButton = null;
let promptHelperPanel = null;
let isInitialized = false;
let isPanelOpen = false;

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
  const site = detectAISite();
  if (!site) {
    console.log('AI Prompt Helper: 対応サイトではありません');
    return;
  }
  
  console.log(`AI Prompt Helper v6.0.0 初期化開始: ${site}`);
  
  try {
    // 少し待ってからボタンを作成
    setTimeout(() => {
      createPromptButton();
      setupMessageListener();
      isInitialized = true;
      console.log('AI Prompt Helper v6.0.0 初期化完了');
    }, 2000);
    
  } catch (error) {
    console.error('AI Prompt Helper 初期化エラー:', error);
  }
}

// ページ変更の監視（SPA対応）
const observer = new MutationObserver(() => {
  if (isInitialized && !document.getElementById('prompt-helper-btn')) {
    console.log('ボタンが削除されたため再作成');
    createPromptButton();
  }
  if (isInitialized && isPanelOpen && !document.getElementById('prompt-helper-panel')) {
    console.log('パネルが削除されたため再作成');
    isPanelOpen = false;
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// ==========================================================================
// サイト判定
// ==========================================================================

function detectAISite() {
  const hostname = window.location.hostname;
  if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
    return 'chatgpt';
  } else if (hostname.includes('claude.ai')) {
    return 'claude';
  } else if (hostname.includes('gemini.google.com') || hostname.includes('bard.google.com')) {
    return 'gemini';
  } else if (hostname.includes('copilot.microsoft.com') || hostname.includes('microsoft.com/copilot')) {
    return 'copilot';
  } else if (hostname.includes('perplexity.ai')) {
    return 'perplexity';
  }
  return null;
}

// ==========================================================================
// 固定ボタンの作成
// ==========================================================================

function createPromptButton() {
  // 既存のボタンを削除
  const existingBtn = document.getElementById('prompt-helper-btn');
  if (existingBtn) {
    existingBtn.remove();
  }
  
  // ボタン要素を作成
  const button = document.createElement('button');
  button.id = 'prompt-helper-btn';
  button.innerHTML = '📝';
  button.title = 'AI Prompt Helper を開く';
  button.className = 'prompt-helper-fixed-btn';
  
  // スタイルを設定
  button.style.cssText = `
    position: fixed !important;
    top: 50% !important;
    right: 20px !important;
    transform: translateY(-50%) !important;
    z-index: 10000 !important;
    width: 50px !important;
    height: 50px !important;
    border-radius: 25px !important;
    background: #4f46e5 !important;
    color: white !important;
    border: none !important;
    cursor: pointer !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    font-size: 20px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.3s ease !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    user-select: none !important;
  `;
  
  // ホバー効果のイベントリスナー
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-50%) scale(1.1) !important';
    button.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25) !important';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(-50%) scale(1) !important';
    button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15) !important';
  });
  
  button.addEventListener('mousedown', () => {
    button.style.transform = 'translateY(-50%) scale(0.95) !important';
  });
  
  button.addEventListener('mouseup', () => {
    button.style.transform = 'translateY(-50%) scale(1.1) !important';
  });
  
  // クリックイベント
  button.addEventListener('click', togglePromptPanel);
  
  // ボタンを画面に追加
  document.body.appendChild(button);
  promptHelperButton = button;
  
  console.log('プロンプトヘルパーボタンを作成しました');
}

// ==========================================================================
// GitHub Pages編集サイト連携
// ==========================================================================

async function togglePromptPanel() {
  console.log('togglePromptPanel が呼び出されました, isPanelOpen:', isPanelOpen);
  try {
    if (isPanelOpen) {
      console.log('パネルを閉じる処理を開始');
      closePromptPanel();
    } else {
      console.log('パネルを開く処理を開始');
      await openPromptPanel();
    }
  } catch (error) {
    console.error('togglePromptPanel エラー:', error);
  }
}

async function openPromptPanel() {
  try {
    console.log('openPromptPanel: 実行開始');
    const githubPagesUrl = await getGitHubPagesUrl();
    console.log('GitHub Pages URL:', githubPagesUrl);
    
    // パネルを作成
    console.log('createPromptPanel を呼び出し中...');
    createPromptPanel(githubPagesUrl);
    
    // ボタンの表示を変更
    console.log('ボタンの表示を変更中...');
    promptHelperButton.innerHTML = '✕';
    promptHelperButton.style.background = '#ef4444 !important';
    promptHelperButton.title = 'プロンプトパネルを閉じる';
    
    isPanelOpen = true;
    console.log('openPromptPanel: 正常完了, isPanelOpen =', isPanelOpen);
    showNotification('プロンプト編集パネルを開きました', 'info');
    
  } catch (error) {
    console.error('プロンプトパネル起動エラー:', error);
    showNotification('プロンプト編集パネルを開けませんでした', 'error');
  }
}

function closePromptPanel() {
  if (promptHelperPanel) {
    promptHelperPanel.remove();
    promptHelperPanel = null;
  }
  
  // ボタンを元に戻す
  promptHelperButton.innerHTML = '📝';
  promptHelperButton.style.background = '#4f46e5 !important';
  promptHelperButton.title = 'AI Prompt Helper を開く';
  
  isPanelOpen = false;
  console.log('プロンプトパネルを閉じました');
}

function createPromptPanel(githubPagesUrl) {
  console.log('createPromptPanel: パネル作成開始, URL:', githubPagesUrl);
  
  // 既存のパネルを削除
  if (promptHelperPanel) {
    console.log('createPromptPanel: 既存パネルを削除');
    promptHelperPanel.remove();
  }
  
  // パネル要素を作成
  console.log('createPromptPanel: div要素を作成中');
  const panel = document.createElement('div');
  panel.id = 'prompt-helper-panel';
  panel.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    right: 0 !important;
    width: 90vw !important;
    height: 100vh !important;
    z-index: 999999 !important;
    background: white !important;
    border-left: 2px solid #4f46e5 !important;
    box-shadow: -4px 0 20px rgba(0,0,0,0.3) !important;
    transform: translateX(0) !important;
    transition: transform 0.3s ease !important;
  `;
  
  // iframe要素を作成
  const iframe = document.createElement('iframe');
  iframe.src = githubPagesUrl;
  iframe.style.cssText = `
    width: 100% !important;
    height: 100% !important;
    border: none !important;
    background: white !important;
  `;
  
  // 閉じるボタンを作成
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '✕';
  closeButton.style.cssText = `
    position: absolute !important;
    top: 10px !important;
    right: 10px !important;
    width: 30px !important;
    height: 30px !important;
    border: none !important;
    background: #ef4444 !important;
    color: white !important;
    border-radius: 15px !important;
    cursor: pointer !important;
    z-index: 10000 !important;
    font-size: 14px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  `;
  
  closeButton.addEventListener('click', closePromptPanel);
  
  // パネルに要素を追加
  panel.appendChild(iframe);
  panel.appendChild(closeButton);
  
  // 画面に追加
  console.log('createPromptPanel: document.bodyに追加中');
  document.body.appendChild(panel);
  promptHelperPanel = panel;
  
  // パネル表示確認用の追加スタイル
  console.log('createPromptPanel: パネル表示確認用スタイル適用');
  panel.style.display = 'block';
  panel.style.visibility = 'visible';
  
  console.log('createPromptPanel: プロンプトパネル作成完了');
}

// 設定からGitHub Pages URLを取得
async function getGitHubPagesUrl() {
  try {
    const result = await chrome.storage.sync.get(['githubPagesUrl']);
    return result.githubPagesUrl || 'https://ganta9.github.io/chrome_ext-ai_prompt_helper/';
  } catch (error) {
    console.error('設定取得エラー:', error);
    // フォールバック用のデフォルトURL
    return 'https://ganta9.github.io/chrome_ext-ai_prompt_helper/';
  }
}

// ==========================================================================
// メッセージ受信（GitHub Pagesからのプロンプト選択）
// ==========================================================================

function setupMessageListener() {
  window.addEventListener('message', handleMessage);
  console.log('メッセージリスナーを設定しました');
}

function handleMessage(event) {
  // 全メッセージをデバッグ用に一時的にログ出力
  console.log('★ デバッグ: 全メッセージ受信:', {
    origin: event.origin,
    data: event.data,
    type: event.data?.type
  });

  // PROMPT_SELECTEDメッセージの詳細ログ
  if (event.data && event.data.type === 'PROMPT_SELECTED') {
    console.log('✅ プロンプト選択メッセージを受信:', event);
    console.log('✅ 受信オリジン:', event.origin);
    console.log('✅ メッセージデータ:', event.data);
  }

  // セキュリティチェック：信頼できるオリジンからのメッセージのみ処理
  if (!isValidOrigin(event.origin)) {
    // PROMPT_SELECTEDメッセージの場合のみ警告を表示
    if (event.data && event.data.type === 'PROMPT_SELECTED') {
      console.error('❌ 信頼できないオリジンからのプロンプト選択メッセージ:', event.origin);
      console.error('❌ 許可されているドメイン一覧:', ['ganta9.github.io', 'localhost', '127.0.0.1']);
    }
    return;
  }
  
  if (event.data && event.data.type === 'PROMPT_SELECTED') {
    console.log('プロンプト選択メッセージを受信:', event.data);

    try {
      // プロンプトを挿入
      insertPrompt(event.data.prompt);

      // パネルを自動で閉じる
      console.log('プロンプト挿入完了、パネルを自動クローズ');
      closePromptPanel();

      showNotification(`プロンプト「${event.data.title}」を挿入しました`, 'success');
    } catch (error) {
      console.error('プロンプト挿入エラー:', error);
      showNotification('プロンプトの挿入に失敗しました', 'error');
    }
  }

  // INSERT_PROMPTメッセージ処理（v5.0.0互換の自動貼り付け機能）
  if (event.data && event.data.type === 'INSERT_PROMPT') {
    console.log('🚀 INSERT_PROMPT メッセージを受信:', event.data);

    try {
      // プロンプトをClaude.aiに直接挿入（v5.0.0のClipboard API方式）
      insertPromptDirectly(event.data.prompt);

      // パネルを自動で閉じる
      console.log('✅ プロンプト自動挿入完了、パネルを自動クローズ');
      closePromptPanel();

      showNotification(`✅ 「${event.data.title}」を自動挿入しました`, 'success');
    } catch (error) {
      console.error('❌ プロンプト自動挿入エラー:', error);
      showNotification('プロンプトの自動挿入に失敗しました', 'error');
    }
  }
}

// 安全なオリジンかチェック
function isValidOrigin(origin) {
  // 特定の許可されたオリジンリスト
  const allowedOrigins = [
    'https://ganta9.github.io',  // ユーザーのGitHub Pages
    'https://localhost',
    'https://127.0.0.1',
    'http://localhost',
    'http://127.0.0.1'
  ];

  // ドメインベースのチェック（フォールバック）
  const allowedDomains = [
    'github.io',
    'localhost',
    '127.0.0.1'
  ];

  // 完全一致チェック
  const exactMatch = allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed + '/') || origin.startsWith(allowed + ':'));

  // ドメイン部分一致チェック
  const domainMatch = allowedDomains.some(domain => origin.includes(domain));

  const isValid = exactMatch || domainMatch;

  // 既知の無関係なオリジンはログを出力しない
  const ignoredOrigins = [
    'https://claude.ai',
    'https://js.stripe.com',
    'https://www.gstatic.com',
    'https://fonts.googleapis.com'
  ];

  if (!isValid && !ignoredOrigins.some(ignored => origin.startsWith(ignored))) {
    console.log('オリジンチェック:', origin, 'result:', isValid);
  }

  return isValid;
}

// ==========================================================================
// テキストエリア検出
// ==========================================================================

function findTextarea() {
  const site = detectAISite();
  
  // サイト別の専用セレクタ
  let siteSpecificSelectors = [];
  
  if (site === 'claude') {
    siteSpecificSelectors = [
      'div[contenteditable="true"][data-placeholder]',
      'div[contenteditable="true"][placeholder]',
      'div[contenteditable="true"]',
      'div[role="textbox"]',
      'textarea[placeholder*="message"]',
      'textarea'
    ];
  } else if (site === 'chatgpt') {
    siteSpecificSelectors = [
      'textarea[data-testid="textbox"]',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="メッセージ"]',
      'div[contenteditable="true"]',
      'textarea'
    ];
  } else if (site === 'gemini') {
    siteSpecificSelectors = [
      'textarea[placeholder*="Enter a prompt"]',
      'div[contenteditable="true"]',
      'textarea'
    ];
  }
  
  // サイト専用セレクタで検索
  for (const selector of siteSpecificSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      if (isViableTextarea(element)) {
        console.log(`入力欄を検出: ${selector}`, element);
        return element;
      }
    }
  }
  
  // 汎用セレクタで検索
  const generalSelectors = [
    'textarea[placeholder*="message"]',
    'textarea[placeholder*="メッセージ"]',
    'textarea[data-testid="textbox"]',
    'textarea[id*="prompt"]',
    'textarea[class*="prompt"]',
    'div[contenteditable="true"]',
    'div[role="textbox"]'
  ];
  
  for (const selector of generalSelectors) {
    const element = document.querySelector(selector);
    if (element && isVisible(element)) {
      console.log(`汎用セレクタで入力欄検出: ${selector}`, element);
      return element;
    }
  }
  
  console.warn('入力欄が見つかりませんでした');
  return null;
}

// 要素が表示されているかチェック
function isVisible(element) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  const styles = getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && 
         rect.left >= 0 && rect.top >= 0 &&
         styles.display !== 'none' &&
         styles.visibility !== 'hidden' &&
         styles.opacity !== '0';
}

// 実用的な入力欄かどうかを判定
function isViableTextarea(element) {
  if (!isVisible(element)) return false;
  
  const rect = element.getBoundingClientRect();
  
  // 最低限のサイズ要件
  if (rect.width < 200 || rect.height < 30) return false;
  
  // 画面外は除外
  if (rect.left < 0 || rect.top < 0) return false;
  if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) return false;
  
  return true;
}

// ==========================================================================
// プロンプト挿入
// ==========================================================================

// v5.0.0互換の直接挿入機能（Clipboard API使用）
function insertPromptDirectly(prompt) {
  console.log('🚀 insertPromptDirectly 開始:', prompt);

  const textarea = findTextarea();
  if (!textarea) {
    console.error('❌ テキストエリアが見つかりません');
    throw new Error('入力エリアが見つかりません');
  }

  console.log('✅ テキストエリア発見:', textarea);

  try {
    textarea.focus();
    console.log('📝 フォーカス設定完了');

    // Clipboard APIを使用する前に、まずテキストエリアをクリアし、inputイベントを発火
    // これによりReactが変更を検知しやすくなる
    textarea.textContent = '';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    navigator.clipboard.writeText(prompt).then(() => {
      console.log('📋 クリップボードに書き込み完了');

      // ペーストイベントをシミュレート
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer()
      });

      pasteEvent.clipboardData.setData('text/plain', prompt);
      textarea.dispatchEvent(pasteEvent);

      console.log('✅ ペーストイベント送信完了');
    }).catch(error => {
      console.error('❌ クリップボード操作エラー:', error);
      // フォールバック: 通常のinsertPrompt
      insertPrompt(prompt); // insertPrompt関数が呼ばれるので、そちらの修正で対応
    });

  } catch (error) {
    console.error('❌ insertPromptDirectly エラー:', error);
    // フォールバック: 通常のinsertPrompt
    insertPrompt(prompt);
  }
}

function insertPrompt(text) {
  const textarea = findTextarea();
  if (!textarea) {
    throw new Error('入力欄が見つかりません');
  }
  
  console.log('プロンプトを挿入:', text.substring(0, 50) + '...');
  
  textarea.focus();
  
  if (textarea.tagName === 'TEXTAREA') {
    // TEXTAREA要素の場合
    const currentValue = textarea.value;
    const newValue = currentValue ? currentValue + '\n\n' + text : text;
    
    // 値を設定
    textarea.value = newValue;
    
    // イベントを発火
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    
    // カーソル位置を末尾に移動
    textarea.setSelectionRange(newValue.length, newValue.length);
    
  } else {
    // contenteditable要素の場合
    const site = detectAISite();
    const currentText = textarea.textContent || textarea.innerText || '';
    const newText = currentText ? currentText + '\n\n' + text : text;
    
    if (site === 'claude' || site === 'chatgpt') {
  console.log('Claude/ChatGPT検出、Clipboard APIを再試行:', site);
  console.log('挿入予定テキスト:', newText.substring(0, 100) + '...');

  textarea.focus();

  navigator.clipboard.writeText(newText).then(() => {
    console.log('📋 クリップボードへの書き込み完了');

    // v5.0.0のアプローチ: クリップボード書き込み成功後にテキストエリアをクリア
    textarea.textContent = '';
    textarea.dispatchEvent(new Event('input', { bubbles: true })); // Reactにクリアを通知

    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: new DataTransfer()
    });

    pasteEvent.clipboardData.setData('text/plain', newText);
    textarea.dispatchEvent(pasteEvent);

    console.log('✅ ペーストイベント送信完了');

    // ペースト後、Reactが変更を検知するのを助けるために再度inputイベントを発火
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

  }).catch((error) => {
    console.error('❌ クリップボード操作エラー、execCommandをフォールバック:', error);
    // Clipboard APIが失敗した場合、execCommandを試す
    try {
      textarea.textContent = ''; // クリア
      textarea.dispatchEvent(new Event('input', { bubbles: true })); // Reactにクリアを通知
      const success = document.execCommand('insertText', false, newText);
      if (success) {
        console.log('✅ execCommand("insertText") フォールバック成功');
        textarea.dispatchEvent(new Event('input', { bubbles: true })); // Reactに通知
      } else {
        console.warn('⚠️ execCommand("insertText") も失敗。最終フォールバック。');
        throw new Error('execCommand failed');
      }
    } catch (execError) {
      console.error('❌ execCommand フォールバックエラー:', execError);
      // 最終フォールバック: クリップボードコピーと手動ペーストを促す
      navigator.clipboard.writeText(newText).then(() => {
        showNotification('プロンプトをクリップボードにコピーしました。手動でペーストしてください。', 'warning');
      }).catch(copyError => {
        console.error('クリップボードコピー失敗:', copyError);
        showNotification('プロンプトのコピーに失敗しました。', 'error');
      });
    }
  });
} else {
      // その他のサイト
      textarea.textContent = newText;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // フォーカスを末尾に移動
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(textarea);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  console.log('プロンプト挿入完了');
}

// ==========================================================================
// 通知システム
// ==========================================================================

function showNotification(message, type = 'info') {
  // 既存の通知を削除
  const existingNotification = document.getElementById('prompt-helper-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.id = 'prompt-helper-notification';
  notification.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      color: white;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      border-radius: 8px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    ">
      <span style="font-size: 16px;">${getNotificationIcon(type)}</span>
      <span>${escapeHtml(message)}</span>
    </div>
  `;
  
  notification.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    z-index: 10001 !important;
    background: ${getNotificationColor(type)} !important;
    border-radius: 8px !important;
    animation: slideInFromRight 0.3s ease !important;
  `;
  
  // CSS アニメーションを定義
  if (!document.getElementById('prompt-helper-styles')) {
    const styles = document.createElement('style');
    styles.id = 'prompt-helper-styles';
    styles.textContent = `
      @keyframes slideInFromRight {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes slideOutToRight {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100%);
        }
      }
    `;
    document.head.appendChild(styles);
  }
  
  document.body.appendChild(notification);
  
  // 3秒後に非表示
  setTimeout(() => {
    notification.style.animation = 'slideOutToRight 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 3000);
}

function getNotificationIcon(type) {
  switch (type) {
    case 'success': return '✓';
    case 'error': return '✗';
    case 'warning': return '⚠';
    default: return 'ℹ';
  }
}

function getNotificationColor(type) {
  switch (type) {
    case 'success': return '#10b981';
    case 'error': return '#ef4444';
    case 'warning': return '#f59e0b';
    default: return '#4f46e5';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==========================================================================
// デバッグ用
// ==========================================================================

// デバッグ用のグローバル変数
if (typeof window !== 'undefined') {
  window.promptHelper = {
    detectAISite,
    findTextarea,
    insertPrompt,
    togglePromptPanel,
    openPromptPanel,
    closePromptPanel,
    showNotification,
    version: '6.0.0'
  };
}