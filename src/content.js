/**
 * AI Prompt Helper v7.0.0 - Content Script
 * GitHub Pages プロンプト管理システム
 */

// ==========================================================================
// グローバル変数
// ==========================================================================

let promptSamples = [];
let isInitialized = false;
let currentSite = null;
const GITHUB_PAGES_URL = 'https://ganta9.github.io/chrome_ext-ai_prompt_helper/prompts.json';

// ==========================================================================
// プロンプトデータ読み込み
// ==========================================================================

async function loadPromptsFromGitHub() {
  try {
    console.log('AI Prompt Helper v7.0.0: GitHub Pagesからプロンプトを読み込み中...');
    const response = await fetch(GITHUB_PAGES_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.prompts || !Array.isArray(data.prompts)) {
      throw new Error('Invalid prompts data structure');
    }
    
    // v7.0.0の平坦な配列構造を旧形式に変換してUI互換性を保つ
    promptSamples = convertV7ToLegacyFormat(data.prompts);
    
    console.log(`AI Prompt Helper v7.0.0: ${data.prompts.length}件のプロンプトを読み込み完了`);
    return true;
    
  } catch (error) {
    console.error('AI Prompt Helper: GitHub Pagesからの読み込みに失敗:', error);
    
    // フォールバック: 基本的なプロンプトを提供
    promptSamples = getFallbackPrompts();
    console.log('AI Prompt Helper: フォールバックプロンプトを使用');
    return false;
  }
}

// v7.0.0の平坦構造を旧UI形式に変換
function convertV7ToLegacyFormat(prompts) {
  const categories = {};
  
  prompts.forEach(prompt => {
    prompt.tags.forEach(tag => {
      if (!categories[tag]) {
        categories[tag] = {
          category: tag,
          prompts: []
        };
      }
      
      categories[tag].prompts.push({
        title: prompt.title,
        text: prompt.prompt
      });
    });
  });
  
  return Object.values(categories);
}

// フォールバック用の基本プロンプト
function getFallbackPrompts() {
  return [
    {
      category: "基本",
      prompts: [
        {
          title: "基本的なタスク指示",
          text: "[タスク内容]を実行してください。\n\n入力："
        },
        {
          title: "要約作成", 
          text: "以下の文章を3つの主要ポイントで要約してください。\n\n文章："
        }
      ]
    }
  ];
}

// ==========================================================================
// AIサイト判定
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
  } else if (hostname.includes('felo.ai')) {
    return 'felo';
  } else if (hostname.includes('perplexity.ai')) {
    return 'perplexity';
  } else if (hostname.includes('notebooklm.google.com') || hostname.includes('notebooklm.google')) {
    return 'notebooklm';
  } else if (hostname.includes('grok.com') || hostname.includes('x.ai')) {
    return 'grok';
  } else if (hostname.includes('genspark.ai')) {
    return 'genspark';
  }
  return null;
}

// ==========================================================================
// テキストエリア検出
// ==========================================================================

function findTextarea() {
  const selectors = [
    'textarea[placeholder*="message"]',
    'textarea[placeholder*="メッセージ"]',
    'textarea[data-testid="textbox"]',
    'textarea[id*="prompt"]',
    'textarea[class*="prompt"]',
    'div[contenteditable="true"]',
    'div[role="textbox"]',
    // Microsoft Copilot
    'textarea[placeholder*="Ask me anything"]',
    'textarea[class*="cib-serp-main"]',
    // Perplexity AI
    'textarea[placeholder*="Ask anything"]',
    'textarea[class*="border-borderMain"]',
    // Felo AI
    'textarea[placeholder*="搜索"]',
    'textarea[placeholder*="Search"]',
    // NotebookLM
    'textarea[placeholder*="Ask your sources"]',
    'div[data-placeholder*="Ask"]',
    // Grok
    'textarea[placeholder*="Ask Grok"]',
    'textarea[class*="grok-input"]',
    // Genspark
    'textarea[placeholder*="What would you like to know"]',
    'input[type="text"][placeholder*="search"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }
  return null;
}

// ==========================================================================
// プロンプトヘルパーUI作成
// ==========================================================================

function createPromptHelper() {
  // 既存のヘルパーを削除
  const existing = document.getElementById('prompt-helper');
  if (existing) existing.remove();

  const textarea = findTextarea();
  if (!textarea) return;

  const helper = document.createElement('div');
  helper.id = 'prompt-helper';
  helper.className = 'prompt-helper-inline';
  
  // トグルボタン
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'prompt-toggle-btn';
  toggleBtn.innerHTML = '📝';
  toggleBtn.title = 'プロンプトサンプル (v7.0.0)';
  
  // ドロップダウンメニュー
  const dropdown = document.createElement('div');
  dropdown.className = 'prompt-dropdown';
  dropdown.style.display = 'none';
  
  const header = document.createElement('div');
  header.className = 'prompt-dropdown-header';
  header.textContent = `プロンプトサンプル v7.0.0 (${getTotalPromptCount()}件)`;
  
  const categoriesContainer = document.createElement('div');
  categoriesContainer.className = 'categories-container-inline';
  
  promptSamples.forEach(category => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category-inline';
    
    const categoryHeader = document.createElement('div');
    categoryHeader.textContent = `${category.category} (${category.prompts.length}件)`;
    categoryHeader.className = 'category-header-inline';
    categoryDiv.appendChild(categoryHeader);
    
    const promptsList = document.createElement('div');
    promptsList.className = 'prompts-list-inline';
    
    category.prompts.forEach(prompt => {
      const promptItem = document.createElement('div');
      promptItem.className = 'prompt-item-inline';
      promptItem.textContent = prompt.title;
      promptItem.dataset.promptText = prompt.text;
      promptItem.addEventListener('click', () => {
        insertPrompt(prompt.text);
        dropdown.style.display = 'none';
      });
      promptsList.appendChild(promptItem);
    });
    
    categoryDiv.appendChild(promptsList);
    categoriesContainer.appendChild(categoryDiv);
  });
  
  dropdown.appendChild(header);
  dropdown.appendChild(categoriesContainer);
  helper.appendChild(toggleBtn);
  helper.appendChild(dropdown);
  
  // トグルボタンイベント
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  });
  
  // 外側クリックで閉じる
  document.addEventListener('click', (e) => {
    if (!helper.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
  
  // body要素に直接配置してfixed positioningを使用
  document.body.appendChild(helper);
  
  // ボタンの位置を入力欄に合わせて設定
  updateHelperPosition(helper, textarea);
  
  return helper;
}

function updateHelperPosition(helper, textarea) {
  const rect = textarea.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  
  helper.style.position = 'fixed';
  helper.style.top = `${rect.top - 8}px`;
  helper.style.left = `${rect.left - 40}px`;
  helper.style.zIndex = '10000';
  
  // ドロップダウンの位置を調整
  const dropdown = helper.querySelector('.prompt-dropdown');
  if (dropdown) {
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    if (spaceBelow < 400 && spaceAbove > spaceBelow) {
      dropdown.style.bottom = '36px';
      dropdown.style.top = 'auto';
    } else {
      dropdown.style.top = '36px';
      dropdown.style.bottom = 'auto';
    }
  }
}

function getTotalPromptCount() {
  return promptSamples.reduce((total, category) => total + category.prompts.length, 0);
}

// ==========================================================================
// プロンプト挿入
// ==========================================================================

function insertPrompt(text) {
  const textarea = findTextarea();
  if (!textarea) return;
  
  if (textarea.tagName === 'TEXTAREA') {
    textarea.value = text;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    // contenteditable要素: Clipboard APIを使用
    textarea.focus();
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        const pasteEvent = new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: new DataTransfer()
        });
        
        pasteEvent.clipboardData.setData('text/plain', text);
        textarea.dispatchEvent(pasteEvent);
      }).catch(() => {
        // フォールバック: 直接設定
        textarea.textContent = text;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      });
    } else {
      // Clipboard API非対応の場合
      textarea.textContent = text;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  
  textarea.focus();
}

// ==========================================================================
// 初期化とUI監視
// ==========================================================================

async function init() {
  currentSite = detectAISite();
  if (!currentSite) {
    console.log('AI Prompt Helper: 対応サイトではありません');
    return;
  }

  console.log(`AI Prompt Helper v7.0.0 初期化開始: ${currentSite}`);

  // プロンプトデータを読み込み
  await loadPromptsFromGitHub();
  
  // ページが完全に読み込まれるまで待機
  setTimeout(() => {
    if (findTextarea()) {
      createPromptHelper();
      isInitialized = true;
      console.log('AI Prompt Helper v7.0.0 初期化完了');
    }
  }, 2000);
}

// DOM読み込み完了後に実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 動的にページが変更される場合への対応
const observer = new MutationObserver(async () => {
  if (!document.getElementById('prompt-helper') && findTextarea()) {
    if (promptSamples.length === 0) {
      await loadPromptsFromGitHub();
    }
    createPromptHelper();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});