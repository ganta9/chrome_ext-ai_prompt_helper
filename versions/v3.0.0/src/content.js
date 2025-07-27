// プロンプトサンプルデータ（JSONファイルから読み込み）
let promptSamples = [];

// プロンプトデータを読み込む（Ver3.0.0 - フォルダベース優先）
async function loadPromptsFromJSON() {
  try {
    // フォルダベースでの読み込みを試行
    promptSamples = await loadPromptsFromFolders();
    if (promptSamples.length > 0) {
      console.log('Ver3.0.0: フォルダベースでプロンプトを読み込みました');
      return;
    }
  } catch (error) {
    console.warn('Ver3.0.0: フォルダベースの読み込みに失敗:', error);
  }
  
  // フォルダベースの読み込みに失敗した場合はデフォルトプロンプトを使用
  promptSamples = getDefaultPrompts();
  console.log('Ver3.0.0: デフォルトプロンプトを読み込みました');
}

// フォルダ構造からプロンプトデータを読み込む（動的スキャン）
async function loadPromptsFromFolders() {
  try {
    const folderStructure = await scanPromptFolders();
    const promptData = [];
    
    for (const category of folderStructure.categories) {
      const categoryData = {
        category: removeNumberPrefix(category.name),
        subcategories: []
      };
      
      for (const subcategory of category.subcategories) {
        const subcategoryData = {
          subcategory: removeNumberPrefix(subcategory.name),
          prompts: []
        };
        
        for (const promptFile of subcategory.prompts) {
          try {
            const response = await fetch(chrome.runtime.getURL(`prompts/${category.name}/${subcategory.name}/${promptFile}`));
            const text = await response.text();
            const title = removeNumberPrefix(promptFile.replace('.txt', ''));
            
            subcategoryData.prompts.push({
              title: title,
              text: text.trim()
            });
          } catch (error) {
            console.warn(`プロンプトファイルの読み込みに失敗: ${promptFile}`, error);
          }
        }
        
        if (subcategoryData.prompts.length > 0) {
          categoryData.subcategories.push(subcategoryData);
        }
      }
      
      if (categoryData.subcategories.length > 0) {
        promptData.push(categoryData);
      }
    }
    
    return promptData;
  } catch (error) {
    console.error('フォルダ構造の読み込みに失敗:', error);
    return [];
  }
}

// 実際に存在するファイルのみを返す（Ver3.0.0自動生成版）
async function scanPromptFolders() {
  console.log('Ver3.0.0自動生成版: 既存ファイルのみ読み込み');
  
  // 自動生成: 2025/7/27 19:45:37
  return {
    categories: [
      {
        name: '001_基本プロンプト技法',
        subcategories: [
          {
            name: '001_Zero-shot',
            prompts: ['001_基本的なタスク指示.txt', '002_分類タスク.txt', '003_テストー.txt']
          },
          {
            name: '002_Few-shot',
            prompts: ['001_例を用いた分類.txt']
          }
        ]
      },
      {
        name: '002_思考プロセス技法',
        subcategories: [
          {
            name: '001_CoT',
            prompts: ['001_段階的思考.txt']
          },
          {
            name: '002_ToT',
            prompts: ['001_複数の解決方法を検討.txt']
          }
        ]
      },
      {
        name: '003_ロールプレイ技法',
        subcategories: [
          {
            name: '001_専門家ペルソナ',
            prompts: ['001_専門家として回答.txt', '002_テスト.txt']
          }
        ]
      }
    ]
  };
}


// 数字接頭語を除去する関数
function removeNumberPrefix(name) {
  // 001_、002_ などの接頭語を削除
  return name.replace(/^\d+_/, '');
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

// テキストエリア検出
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
  header.textContent = 'プロンプトサンプル (Ver3.0.0)';
  
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