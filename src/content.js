// プロンプトサンプルデータ（JSONファイルから読み込み）
let promptSamples = [];

// JSONファイルからプロンプトデータを読み込む
async function loadPromptsFromJSON() {
  try {
    const response = await fetch(chrome.runtime.getURL('prompts.json'));
    const data = await response.json();
    promptSamples = convertJSONToPrompts(data);
  } catch (error) {
    console.error('プロンプトファイルの読み込みに失敗しました:', error);
    // フォールバック用のデフォルトデータ
    promptSamples = getDefaultPrompts();
  }
}

// JSONデータを内部形式に変換
function convertJSONToPrompts(data) {
  return data.categories.map(category => ({
    category: category.name,
    subcategories: category.subcategories.map(subcategory => ({
      subcategory: subcategory.name,
      prompts: subcategory.prompts
    }))
  }));
}

// デフォルトプロンプトデータ（フォールバック用）
function getDefaultPrompts() {
  return [
    {
      category: "文章作成",
      subcategories: [
        {
          subcategory: "基本的な文章作成",
          prompts: [
            {
              title: "要約作成",
              text: "以下の文章を3つのポイントに要約してください：\n\n"
            },
            {
              title: "ビジネスメール",
              text: "以下の内容でビジネスメールを作成してください。丁寧で簡潔な文章でお願いします：\n\n"
            }
          ]
        }
      ]
    }
  ];
}

// サイト判定
function detectAISite() {
  const hostname = window.location.hostname;
  if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
    return 'chatgpt';
  } else if (hostname.includes('claude.ai')) {
    return 'claude';
  } else if (hostname.includes('gemini.google.com') || hostname.includes('bard.google.com')) {
    return 'gemini';
  }
  return null;
}

// テキストエリア検出
function findTextarea() {
  const selectors = [
    'textarea[placeholder*="message"]',
    'textarea[placeholder*="メッセージ"]',
    'textarea[data-testid="textbox"]',
    'textarea[id*="prompt"]',
    'textarea[class*="prompt"]',
    'div[contenteditable="true"]',
    'div[role="textbox"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }
  return null;
}

// プロンプトヘルパーUI作成（入力欄の横に配置）
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
  toggleBtn.title = 'プロンプトサンプル';
  
  // ドロップダウンメニュー
  const dropdown = document.createElement('div');
  dropdown.className = 'prompt-dropdown';
  dropdown.style.display = 'none';
  
  const header = document.createElement('div');
  header.className = 'prompt-dropdown-header';
  header.textContent = 'プロンプトサンプル';
  
  const categoriesContainer = document.createElement('div');
  categoriesContainer.className = 'categories-container-inline';
  
  promptSamples.forEach(category => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category-inline';
    
    const categoryHeader = document.createElement('div');
    categoryHeader.textContent = category.category;
    categoryHeader.className = 'category-header-inline';
    categoryDiv.appendChild(categoryHeader);
    
    // サブカテゴリがある場合は3階層構造で表示
    if (category.subcategories && category.subcategories.length > 0) {
      category.subcategories.forEach(subcategory => {
        const subCategoryDiv = document.createElement('div');
        subCategoryDiv.className = 'subcategory-inline';
        
        const subCategoryHeader = document.createElement('div');
        subCategoryHeader.textContent = subcategory.subcategory;
        subCategoryHeader.className = 'subcategory-header-inline';
        subCategoryDiv.appendChild(subCategoryHeader);
        
        const promptsList = document.createElement('div');
        promptsList.className = 'prompts-list-inline';
        
        subcategory.prompts.forEach(prompt => {
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
        
        subCategoryDiv.appendChild(promptsList);
        categoryDiv.appendChild(subCategoryDiv);
      });
    }
    // 旧形式（直接プロンプトがある場合）の互換性
    else if (category.prompts && category.prompts.length > 0) {
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
    }
    
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
  function updatePosition() {
    const textarea = findTextarea();
    if (!textarea) return;
    
    const rect = textarea.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    helper.style.position = 'fixed';
    helper.style.top = `${rect.top - 8}px`;
    helper.style.left = `${rect.left - 40}px`;
    
    // ドロップダウンの位置を調整（画面下部の場合は上向きに表示）
    const dropdown = helper.querySelector('.prompt-dropdown');
    if (dropdown) {
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      if (spaceBelow < 400 && spaceAbove > spaceBelow) {
        // 上向きに表示
        dropdown.style.bottom = '36px';
        dropdown.style.top = 'auto';
      } else {
        // 下向きに表示（デフォルト）
        dropdown.style.top = '36px';
        dropdown.style.bottom = 'auto';
      }
    }
  }
  
  // 初期位置設定
  updatePosition();
  
  // より頻繁に位置を更新（ページ変更対応）
  const updateInterval = setInterval(() => {
    if (document.getElementById('prompt-helper')) {
      updatePosition();
    } else {
      clearInterval(updateInterval);
    }
  }, 1000);
  
  // スクロールやリサイズ時に位置を更新
  window.addEventListener('scroll', updatePosition);
  window.addEventListener('resize', updatePosition);
  
  return helper;
}

// プロンプト挿入
function insertPrompt(text) {
  const textarea = findTextarea();
  if (!textarea) return;
  
  if (textarea.tagName === 'TEXTAREA') {
    textarea.value = text;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    textarea.textContent = text;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  textarea.focus();
}

// 旧トグルボタン機能を削除（インライン版に統合）

// 初期化
async function init() {
  const site = detectAISite();
  if (!site) return;
  
  // プロンプトデータを読み込み
  await loadPromptsFromJSON();
  
  // ページが完全に読み込まれるまで待機
  setTimeout(() => {
    if (findTextarea()) {
      createPromptHelper();
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
    // プロンプトデータが読み込まれていない場合は読み込む
    if (promptSamples.length === 0) {
      await loadPromptsFromJSON();
    }
    createPromptHelper();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});