// プロンプトデータ（JSONファイルから読み込み）
let promptSamples = [];

// プロンプトデータを読み込む（Ver3.0.0 - フォルダベース優先）
async function loadPromptsFromJSON() {
  try {
    // フォルダベースでの読み込みを試行
    promptSamples = await loadPromptsFromFolders();
    if (promptSamples.length > 0) {
      console.log('Ver5.0.0: フォルダベースでプロンプトを読み込みました');
      return;
    }
  } catch (error) {
    console.warn('Ver5.0.0: フォルダベースの読み込みに失敗:', error);
  }
  
  // フォルダベースの読み込みに失敗した場合はデフォルトプロンプトを使用
  promptSamples = getDefaultPrompts();
  console.log('Ver5.0.0: デフォルトプロンプトを読み込みました');
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
            const title = removeNumberPrefix(promptFile.replace('.md', ''));
            
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

// 実際に存在するファイルのみを返す（Ver5.0.0自動生成版）
async function scanPromptFolders() {
  console.log('Ver5.0.0自動生成版: 既存ファイルのみ読み込み');
  
  // 自動生成: 2025/8/24 更新（STEP1を4分割、STEP2以降を006から開始）
  return {
    categories: [
      {
        name: '001_本気モード',
        subcategories: [
          {
            name: '001_STEP0',
            prompts: ['001_コア設定.md']
          },
          {
            name: '002_STEP1-1',
            prompts: ['001_事前設定.md']
          },
          {
            name: '003_STEP1-2',
            prompts: ['001_claude出力ルール.md', '002_gemini出力ルール.md', '003_chatgpt出力ルール.md']
          },
          {
            name: '004_STEP1-3',
            prompts: ['001_会話継続支援.md']
          },
          {
            name: '005_STEP1-4',
            prompts: ['001_設定の完了.md']
          },
          {
            name: '006_STEP2',
            prompts: ['001_プロジェクト前提条件.md', '002_要求仕様書添削.md', '003_リスクアセスメント.md']
          },
          {
            name: '008_STEP3',
            prompts: ['001_不足情報の補完.md']
          },
          {
            name: '009_STEP5',
            prompts: ['001_回答生成手法のサンプル.md']
          }
        ]
      },
      {
        name: '002_ワンショット',
        subcategories: [
          {
            name: '001_一般',
            prompts: ['001_文章校閲.md', '002_翻訳.md', '003_図解.md', '004_推論.md', '005_AI同士で議論.md', '006_要求仕様書添削.md']
          },
          {
            name: '002_ペルソナ',
            prompts: ['001_プロマネ.md']
          },
          {
            name: '003_プログラム',
            prompts: ['001_一般.md', '002_一般2.md', '003_コミットメッセージ.md']
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

// テキストエリア検出（サイト別最適化）
function findTextarea() {
  const site = detectAISite();
  
  // サイト別の専用セレクタを優先的に使用
  let siteSpecificSelectors = [];
  
  if (site === 'claude') {
    siteSpecificSelectors = [
      // Claude.aiの最新のセレクタ（より具体的に）
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
  
  // サイト専用セレクタで検索（厳密版）
  const viableCandidates = [];
  
  for (const selector of siteSpecificSelectors) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (isViableTextarea(element)) {
        const rect = element.getBoundingClientRect();
        viableCandidates.push({
          element,
          selector,
          rect,
          score: calculateTextareaScore(element, rect)
        });
      }
    });
  }
  
  // 最も適切な要素を選択
  if (viableCandidates.length > 0) {
    viableCandidates.sort((a, b) => b.score - a.score);
    const best = viableCandidates[0];
    console.log(`最適な入力欄を検出 (${site}): ${best.selector}`, {
      element: best.element,
      rect: `${best.rect.left}, ${best.rect.top}, ${best.rect.width}x${best.rect.height}`,
      score: best.score
    });
    return best.element;
  }
  
  // 汎用セレクタで検索
  const generalSelectors = [
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
  
  for (const selector of generalSelectors) {
    const element = document.querySelector(selector);
    if (element && isVisible(element)) {
      console.log(`汎用セレクタで入力欄検出: ${selector}`, element);
      return element;
    }
  }
  
  // デバッグ: 入力欄候補をすべて確認
  if (site === 'claude') {
    const allContentEditables = document.querySelectorAll('div[contenteditable="true"]');
    console.log(`Claude.ai デバッグ: contenteditable要素数=${allContentEditables.length}`);
    allContentEditables.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      console.log(`contenteditable[${i}]:`, {
        element: el,
        visible: isVisible(el),
        rect: `${rect.left}, ${rect.top}, ${rect.width}x${rect.height}`,
        placeholder: el.getAttribute('data-placeholder') || el.getAttribute('placeholder') || 'なし'
      });
    });
  } else if (site === 'chatgpt') {
    const allTextareas = document.querySelectorAll('textarea');
    console.log(`ChatGPT デバッグ: textarea要素数=${allTextareas.length}`);
    allTextareas.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      console.log(`textarea[${i}]:`, {
        element: el,
        visible: isVisible(el),
        rect: `${rect.left}, ${rect.top}, ${rect.width}x${rect.height}`,
        placeholder: el.getAttribute('placeholder') || 'なし',
        testid: el.getAttribute('data-testid') || 'なし'
      });
    });
  }
  
  return null;
}

// 要素が表示されているかチェック（厳密版）
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

// 実用的な入力欄かどうかを判定（新機能）
function isViableTextarea(element) {
  if (!isVisible(element)) return false;
  
  const rect = element.getBoundingClientRect();
  
  // 最低限のサイズ要件
  if (rect.width < 200 || rect.height < 30) return false;
  
  // 画面外や画面端すぎる位置は除外
  if (rect.left < 0 || rect.top < 0) return false;
  if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) return false;
  
  // 画面中央付近にある要素を優先
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const elementCenterX = rect.left + rect.width / 2;
  const elementCenterY = rect.top + rect.height / 2;
  
  // 画面中央から極端に離れすぎている場合は除外
  if (Math.abs(elementCenterX - centerX) > window.innerWidth * 0.4) return false;
  if (Math.abs(elementCenterY - centerY) > window.innerHeight * 0.4) return false;
  
  return true;
}

// 入力欄の適切さを数値で評価（新機能）
function calculateTextareaScore(element, rect) {
  let score = 100;
  
  // サイズによる評価（大きすぎず小さすぎない）
  const area = rect.width * rect.height;
  if (area > 50000 && area < 200000) {
    score += 50;
  } else if (area < 10000) {
    score -= 30;
  }
  
  // 画面中央に近いほど高得点
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const elementCenterX = rect.left + rect.width / 2;
  const elementCenterY = rect.top + rect.height / 2;
  
  const distanceFromCenter = Math.sqrt(
    Math.pow(elementCenterX - centerX, 2) + 
    Math.pow(elementCenterY - centerY, 2)
  );
  const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
  const centralityScore = (1 - distanceFromCenter / maxDistance) * 50;
  score += centralityScore;
  
  // 属性による追加得点
  if (element.hasAttribute('placeholder')) score += 20;
  if (element.hasAttribute('data-testid')) score += 15;
  if (element.getAttribute('contenteditable') === 'true') score += 10;
  
  // 下半分にある要素を優先（入力欄は通常画面下部）
  if (rect.top > window.innerHeight * 0.4) score += 30;
  
  return Math.round(score);
}

// 位置情報の妥当性を検証（新機能）
function isValidRect(rect) {
  return (
    rect &&
    typeof rect.left === 'number' &&
    typeof rect.top === 'number' &&
    typeof rect.width === 'number' &&
    typeof rect.height === 'number' &&
    rect.left >= 0 &&
    rect.top >= 0 &&
    rect.width > 0 &&
    rect.height > 0 &&
    rect.left < window.innerWidth &&
    rect.top < window.innerHeight &&
    !isNaN(rect.left) &&
    !isNaN(rect.top)
  );
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
  toggleBtn.title = 'プロンプトヘルパー';
  
  // ドロップダウンメニュー
  const dropdown = document.createElement('div');
  dropdown.className = 'prompt-dropdown';
  dropdown.style.display = 'none';
  
  const header = document.createElement('div');
  header.className = 'prompt-dropdown-header';
  header.textContent = 'プロンプトヘルパー (Ver5.0.0)';
  
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
  
  // ボタンの位置を入力欄に合わせて設定（フェイルセーフ版）
  function updatePosition() {
    const textarea = findTextarea();
    if (!textarea) {
      // テキストエリアが見つからない場合は安全な位置に配置
      console.warn('入力欄が見つからないため、デフォルト位置に配置します');
      helper.style.display = 'block';
      helper.style.position = 'fixed';
      helper.style.zIndex = '10000';
      helper.style.left = '20px';
      helper.style.top = '100px';
      return;
    }
    
    const rect = textarea.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const site = detectAISite();
    
    // 位置情報の妥当性を検証
    if (!isValidRect(rect)) {
      console.error('無効な位置情報が検出されました:', rect);
      // フォールバック位置を使用
      helper.style.display = 'block';
      helper.style.position = 'fixed';
      helper.style.zIndex = '10000';
      helper.style.left = '20px';
      helper.style.top = '200px';
      return;
    }
    
    // ヘルパーを表示
    helper.style.display = 'block';
    helper.style.position = 'fixed';
    helper.style.zIndex = '10000';
    
    // 入力欄の左上に配置（改善版）
    let leftPosition = rect.left - 45;
    let topPosition = rect.top + 10;
    
    // 位置の安全性チェック
    leftPosition = Math.max(leftPosition, 10);
    leftPosition = Math.min(leftPosition, viewportWidth - 70);
    topPosition = Math.max(topPosition, 10);
    topPosition = Math.min(topPosition, viewportHeight - 50);
    
    helper.style.left = `${leftPosition}px`;
    helper.style.top = `${topPosition}px`;
    
    console.log(`プロンプトヘルパー位置設定（改善版）:
      site: ${site}
      textarea rect: ${rect.left}, ${rect.top}, ${rect.width}x${rect.height}
      calculated position: ${leftPosition}, ${topPosition}
      viewport: ${viewportWidth}x${viewportHeight}
      valid: ${isValidRect(rect)}
    `, textarea);
    
    // ドロップダウンの位置を調整（画面下部の場合は上向きに表示）
    const dropdown = helper.querySelector('.prompt-dropdown');
    if (dropdown) {
      const spaceBelow = viewportHeight - (topPosition + 40);
      const spaceAbove = topPosition;
      
      if (spaceBelow < 400 && spaceAbove > 300) {
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
    const currentHelper = document.getElementById('prompt-helper');
    if (currentHelper) {
      // ヘルパーが存在する場合は位置を更新
      updatePosition();
      
      // テキストエリアが見つからない場合や、表示状態をチェック
      const currentTextarea = findTextarea();
      if (!currentTextarea) {
        // テキストエリアがなくなった場合は一時的に非表示
        currentHelper.style.display = 'none';
      } else {
        // テキストエリアが存在する場合は表示
        currentHelper.style.display = 'block';
        updatePosition();
      }
    } else {
      clearInterval(updateInterval);
    }
  }, 500);
  
  // スクロールやリサイズ時に位置を更新
  window.addEventListener('scroll', updatePosition);
  window.addEventListener('resize', updatePosition);
  
  return helper;
}

// プロンプト挿入（既存テキストの末尾に追加）
function insertPrompt(text) {
  const textarea = findTextarea();
  if (!textarea) return;
  
  textarea.focus();
  
  if (textarea.tagName === 'TEXTAREA') {
    // TEXTAREA要素: 既存の値に追加
    const currentValue = textarea.value;
    const newValue = currentValue ? currentValue + '\n\n' + text : text;
    textarea.value = newValue;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    // contenteditable要素: サイト別アプローチ
    const site = detectAISite();
    const currentText = textarea.textContent || textarea.innerText || '';
    const newText = currentText ? currentText + '\n\n' + text : text;
    
    if (site === 'claude' || site === 'chatgpt') {
      // Claude.ai & ChatGPT: Clipboard APIを使用してペースト操作をシミュレート
      navigator.clipboard.writeText(newText).then(() => {
        // 既存テキストをクリアしてから新しいテキストをペースト
        textarea.textContent = '';
        
        const pasteEvent = new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: new DataTransfer()
        });
        
        pasteEvent.clipboardData.setData('text/plain', newText);
        textarea.dispatchEvent(pasteEvent);
      }).catch(() => {
        // Clipboard APIが失敗した場合のフォールバック
        textarea.textContent = newText;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      });
    } else {
      // その他のサイト（Gemini等）: Ver3の安定したアプローチ
      textarea.textContent = newText;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}


// 旧トグルボタン機能を削除（インライン版に統合）

// 初期化（サイト別最適化）
async function init() {
  const site = detectAISite();
  if (!site) return;
  
  console.log(`AI Prompt Helper v5.0.0 初期化開始: ${site}`);
  
  // プロンプトデータを読み込み
  await loadPromptsFromJSON();
  
  // サイト別の初期化待機時間
  let initDelay = 2000;
  if (site === 'claude') {
    initDelay = 3000; // Claude.aiは少し長めに待機
  }
  
  // ページが完全に読み込まれるまで待機
  setTimeout(() => {
    const textarea = findTextarea();
    console.log(`初期化チェック: textarea=${!!textarea}`);
    if (textarea) {
      createPromptHelper();
    } else {
      // テキストエリアが見つからない場合は再試行
      setTimeout(() => {
        const retryTextarea = findTextarea();
        console.log(`再試行チェック: textarea=${!!retryTextarea}`);
        if (retryTextarea) {
          createPromptHelper();
        }
      }, 2000);
    }
  }, initDelay);
}

// DOM読み込み完了後に実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 動的にページが変更される場合への対応（より積極的な復元）
const observer = new MutationObserver(async () => {
  const existingHelper = document.getElementById('prompt-helper');
  const textarea = findTextarea();
  
  if (textarea) {
    if (!existingHelper) {
      // ヘルパーが存在しない場合は作成
      if (promptSamples.length === 0) {
        await loadPromptsFromJSON();
      }
      createPromptHelper();
    } else {
      // ヘルパーが存在する場合は表示状態を確認
      existingHelper.style.display = 'block';
    }
  } else {
    // テキストエリアがない場合はヘルパーを非表示（削除はしない）
    if (existingHelper) {
      existingHelper.style.display = 'none';
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});