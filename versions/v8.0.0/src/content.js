/**
 * AI Prompt Helper v7.0.0 - Content Script
 * v6.0.0ベース + GitHub Pages連携対応
 */

// ==========================================================================
// グローバル変数
// ==========================================================================

let promptHelperButton = null;
let promptHelperPanel = null;
let isInitialized = false;
let isPanelOpen = false;
let promptSamples = []; // ローカルプロンプトキャッシュ

// プロンプトテンプレート変数システム関連
let variableModal = null;
let currentTemplate = null;
let sessionVariables = {}; // セッション中の変数値保存

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

  console.log(`AI Prompt Helper v7.0.0 初期化開始: ${site}`);

  // バックグラウンドでプロンプトデータ更新（v7.0.0対応）
  try {
    chrome.runtime.sendMessage({action: 'updatePrompts'}, (response) => {
      if (response && response.success) {
        console.log('プロンプトデータ更新完了:', response.count + '件');
        promptSamples = response.data || [];
      } else {
        console.warn('プロンプトデータ更新失敗:', response?.error || '不明なエラー');
        // フォールバック：デフォルトプロンプトを使用
        loadDefaultPrompts();
      }
    });
  } catch (error) {
    console.warn('バックグラウンド更新エラー:', error);
    loadDefaultPrompts();
  }

  try {
    // 少し待ってからボタンを作成（v6.0.0と同様）
    setTimeout(() => {
      createPromptButton();
      setupMessageListener();
      isInitialized = true;
      console.log('AI Prompt Helper v7.0.0 初期化完了');
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
// 固定ボタンの作成（v6.0.0スタイル維持）
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

  // v6.0.0のスタイルを完全に復活
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
    font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif !important;
    user-select: none !important;
  `;

  // ホバー効果のイベントリスナー（v6.0.0と同様）
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

  console.log('プロンプトヘルパーボタンを作成しました（右側固定位置）');
}

// ==========================================================================
// プロンプトパネル制御（v6.0.0ベース + v7.0.0連携）
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
    console.log('openPromptPanel: chrome.runtime経由でプロンプト取得開始');
    
    // デバッグ: 強制的にプロンプト更新をトリガー
    console.log('🔧 DEBUG: 強制プロンプト更新を実行');
    chrome.runtime.sendMessage({action: 'updatePrompts'}, (updateResponse) => {
      console.log('🔧 DEBUG: 更新レスポンス:', updateResponse);
    });

    // chrome.runtime.sendMessage経由でプロンプトデータを取得（v6.0.0方式）
    chrome.runtime.sendMessage({action: 'getPrompts'}, (response) => {
      if (response && response.success) {
        const prompts = response.data || [];
        console.log('🔍 DEBUG: プロンプトデータ取得:', prompts.length + '件');
        console.log('🔍 DEBUG: 取得元:', response.source || 'unknown');
        console.log('🔍 DEBUG: 最初のプロンプト:', prompts[0] ? prompts[0].title : 'なし');

        // プロンプト選択パネルを作成（v6.0.0スタイル）
        createPromptSelectionPanel(prompts);

        // ボタンの表示を変更
        promptHelperButton.innerHTML = '✕';
        promptHelperButton.style.background = '#ef4444 !important';
        promptHelperButton.title = 'プロンプトパネルを閉じる';

        isPanelOpen = true;
        showNotification(`${prompts.length}件のプロンプトを読み込みました`, 'success');

      } else {
        console.warn('プロンプトデータが見つかりません');
        showNotification('プロンプトデータがありません。設定画面で更新してください。', 'warning');
      }
    });

  } catch (error) {
    console.error('プロンプトパネル起動エラー:', error);
    showNotification('プロンプトパネルを開けませんでした', 'error');
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

// v6.0.0スタイルのプロンプト選択パネル（完全復活）
function createPromptSelectionPanel(prompts) {
  console.log('createPromptSelectionPanel: v6.0.0スタイルパネル作成開始');

  // 既存のパネルを削除
  if (promptHelperPanel) {
    promptHelperPanel.remove();
    console.log('既存パネルを削除');
  }

  // パネルを作成（v6.0.0と同じスタイル）
  promptHelperPanel = document.createElement('div');
  promptHelperPanel.id = 'ai-prompt-helper-panel';
  promptHelperPanel.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90vw;
      max-height: 90vh;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 20px;
      z-index: 10000;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui;
      overflow: hidden;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; color: #8b5cf6; font-size: 18px;">🚀 AI Prompt Helper v7.0.0</h3>
        <button id="close-panel-btn" style="
          background: #ef4444;
          border: none;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
        ">✕</button>
      </div>

      <div style="margin-bottom: 15px;">
        <input type="text" id="prompt-search" placeholder="プロンプトを検索..." style="
          width: 100%;
          background: #2d2d2d;
          border: 1px solid #444;
          border-radius: 6px;
          padding: 10px;
          color: white;
          font-size: 14px;
        ">
      </div>

      <div id="prompt-list" style="
        max-height: 400px;
        overflow-y: auto;
        margin-bottom: 15px;
      ">
        ${prompts.length === 0
          ? '<div style="text-align: center; padding: 40px; color: #666;">プロンプトがありません</div>'
          : prompts.map((prompt, index) => `
            <div class="prompt-item" data-index="${index}" style="
              background: #2d2d2d;
              margin-bottom: 8px;
              padding: 12px;
              border-radius: 8px;
              cursor: pointer;
              border: 1px solid #444;
              transition: all 0.2s ease;
            ">
              <div style="font-weight: 600; margin-bottom: 6px; color: #8b5cf6;">
                ${prompt.title || 'タイトルなし'}
              </div>
              <div style="font-size: 13px; color: #ccc; line-height: 1.4; max-height: 60px; overflow: hidden;">
                ${(prompt.prompt || prompt.content || '').substring(0, 100)}${(prompt.prompt || prompt.content || '').length > 100 ? '...' : ''}
              </div>
              ${prompt.tags ? `
                <div style="margin-top: 8px;">
                  ${prompt.tags.split(',').map(tag => `
                    <span style="
                      background: #8b5cf6;
                      color: white;
                      padding: 2px 8px;
                      border-radius: 12px;
                      font-size: 11px;
                      margin-right: 6px;
                    ">${tag.trim()}</span>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
      </div>

      <div style="text-align: center; font-size: 12px; color: #666;">
        ${prompts.length}件のプロンプト | GitHub Pages連携対応 | 最終更新: ${new Date().toLocaleString()}
      </div>
    </div>
  `;

  document.body.appendChild(promptHelperPanel);

  // イベントリスナーを設定
  document.getElementById('close-panel-btn').addEventListener('click', closePromptPanel);

  // プロンプト選択イベント（変数システム対応）
  document.querySelectorAll('.prompt-item').forEach(item => {
    // ホバー効果を追加（CSP準拠）
    item.addEventListener('mouseenter', () => {
      item.style.background = '#3d3d3d';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = '#2d2d2d';
    });
    
    // クリックイベント
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.index);
      const selectedPrompt = prompts[index];
      if (selectedPrompt && (selectedPrompt.prompt || selectedPrompt.content)) {
        const promptText = selectedPrompt.prompt || selectedPrompt.content;
        
        // 変数検出と処理
        const variables = extractVariables(promptText);
        
        if (variables.length > 0) {
          // 変数がある場合: カスタマイズモーダルを表示
          console.log('変数を検出、カスタマイズモーダルを表示:', variables.length + '個');
          showVariableModal(promptText, variables);
          closePromptPanel(); // 選択パネルを閉じる
        } else {
          // 変数がない場合: 従来通り即座に挿入
          insertPrompt(promptText);
          closePromptPanel();
          showNotification(`プロンプト「${selectedPrompt.title}」を挿入しました`, 'success');
        }
      }
    });
  });

  // 検索機能
  document.getElementById('prompt-search').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    document.querySelectorAll('.prompt-item').forEach(item => {
      const title = item.querySelector('div').textContent.toLowerCase();
      const content = item.querySelector('div:nth-child(2)').textContent.toLowerCase();
      if (title.includes(searchTerm) || content.includes(searchTerm)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  });

  console.log('createPromptSelectionPanel: v6.0.0スタイルパネル作成完了');
}

// ==========================================================================
// デフォルトプロンプト（v7.0.0フォールバック用）
// ==========================================================================

function loadDefaultPrompts() {
  promptSamples = [
    {
      id: 'default_1',
      title: '文章校正',
      content: '以下の文章を校正してください。誤字脱字、文法、表現の改善点があれば指摘し、修正案を提示してください。\n\n【文章】\n',
      tags: '校正,文章,チェック'
    },
    {
      id: 'default_2',
      title: '要約作成',
      content: '以下の内容を簡潔に要約してください。重要なポイントを3-5点に絞って整理してください。\n\n【内容】\n',
      tags: '要約,整理,まとめ'
    },
    {
      id: 'default_3',
      title: 'コードレビュー',
      content: '以下のコードをレビューしてください。改善点、バグの可能性、ベストプラクティスの観点から評価をお願いします。\n\n【コード】\n```\n\n```',
      tags: 'コード,レビュー,プログラミング'
    },
    {
      id: 'default_4',
      title: '翻訳（日→英）',
      content: '以下の日本語を自然な英語に翻訳してください。ビジネス文書として適切な表現を心がけてください。\n\n【日本語】\n',
      tags: '翻訳,英語,ビジネス'
    },
    {
      id: 'default_5',
      title: 'アイデア出し',
      content: '以下のテーマについて、創意工夫に富んだアイデアを5-10個提案してください。実現可能性も考慮してください。\n\n【テーマ】\n',
      tags: 'アイデア,ブレインストーミング,創造'
    }
  ];
  console.log('デフォルトプロンプトを読み込みました:', promptSamples.length + '件');
}

// ==========================================================================
// プロンプトテンプレート変数システム
// ==========================================================================

/**
 * プロンプトから変数を検出
 * @param {string} promptText - プロンプトテキスト
 * @returns {Array} 検出された変数の配列
 */
function extractVariables(promptText) {
  if (typeof promptText !== 'string') {
    console.warn('extractVariables: promptText is not a string', promptText);
    return [];
  }
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

  console.log('変数検出結果:', variables);
  return variables;
}

/**
 * 変数のカラーを取得（8色循環）
 * @param {number} index - 変数のインデックス
 * @returns {string} カラーコード
 */
function getVariableColor(index) {
  const colors = [
    '#FFE066', // 黄色
    '#FFB3BA', // ピンク
    '#B3FFB3', // 緑
    '#B3E0FF', // 水色
    '#E0B3FF', // 紫
    '#FFD4B3', // オレンジ
    '#D4FFB3', // ライムグリーン
    '#FFB3E0'  // ローズ
  ];
  return colors[index % 8];
}

/**
 * プロンプトテキスト内の変数を色付きで表示用にフォーマット
 * @param {string} promptText - 元のプロンプトテキスト
 * @param {Array} variables - 変数配列
 * @returns {string} HTML形式の色付きプロンプト
 */
/**
 * CSP準拠のプレビューコンテンツ更新
 * @param {HTMLElement} container - プレビューコンテナ
 * @param {string} promptText - 元のプロンプトテキスト
 * @param {Array} variables - 変数配列
 */
function updatePreviewContent(container, promptText, variables) {
  // コンテナをクリア
  container.innerHTML = '';
  
  // HTMLエスケープ関数
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // プロンプトテキストを処理
  let processedText = escapeHtml(promptText);
  
  // 各変数を色付きspanに置換
  variables.forEach(variable => {
    const placeholder = `[${variable.name}]`;
    const escapedPlaceholder = escapeHtml(placeholder);
    const coloredSpan = `<span style="background-color: ${variable.color}; color: #000000; padding: 2px 4px; border-radius: 3px; font-weight: bold;">${escapedPlaceholder}</span>`;
    processedText = processedText.replaceAll(escapedPlaceholder, coloredSpan);
  });
  
  // 改行をHTMLに変換
  processedText = processedText.replace(/\n/g, '<br>');
  
  // 結果をコンテナに設定
  container.innerHTML = processedText;
}

/**
 * 変数値を用いてプロンプトの置換を実行
 * @param {string} template - テンプレートプロンプト
 * @param {Array} variables - 変数配列（値入り）
 * @returns {string} 置換後のプロンプト
 */
function replaceVariables(template, variables) {
  let result = template;

  // シンプルな変数置換のみ
  variables.forEach(variable => {
    const placeholder = `[${variable.name}]`;
    const value = variable.value || '';
    result = result.replaceAll(placeholder, value);
  });

  return result;
}

/**
 * 変数入力モーダルを作成
 * @param {string} promptText - 元のプロンプトテキスト
 * @param {Array} variables - 変数配列
 * @returns {HTMLElement} モーダル要素
 */
function createVariableModal(promptText, variables) {
  // モーダルオーバーレイ
  const overlay = document.createElement('div');
  overlay.className = 'prompt-variable-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(2px);
  `;

  // モーダルコンテナ
  const modal = document.createElement('div');
  modal.className = 'prompt-variable-modal';
  modal.style.cssText = `
    background: #1a1a1a;
    color: white;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    width: 90vw;
    height: 85vh;
    max-width: none;
    max-height: none;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid #333;
  `;

  // レスポンシブ対応
  if (window.innerWidth <= 1023) {
    modal.style.width = '95vw';
    modal.style.height = '90vh';
  }

  // ヘッダー
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 20px 24px;
    border-bottom: 1px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #2a2a2a;
  `;

  const title = document.createElement('h2');
  title.textContent = 'プロンプトカスタマイズ';
  title.style.cssText = `
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #ffffff;
  `;

  const closeButton = document.createElement('button');
  closeButton.innerHTML = '×';
  closeButton.style.cssText = `
    background: #dc3545;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 8px;
    border-radius: 4px;
    color: white;
    line-height: 1;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  closeButton.addEventListener('click', () => closeVariableModal());

  header.appendChild(title);
  header.appendChild(closeButton);

  // メインコンテンツ
  const content = document.createElement('div');
  content.style.cssText = `
    display: flex;
    flex: 1;
    overflow: hidden;
  `;

  // 左側: プロンプトプレビュー
  const previewSection = document.createElement('div');
  previewSection.style.cssText = `
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    border-right: 1px solid #333;
    background: #1a1a1a;
  `;

  const previewTitle = document.createElement('h3');
  previewTitle.textContent = 'プロンプト本文';
  previewTitle.style.cssText = `
    margin: 0 0 16px 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #ffffff;
  `;

  const previewContent = document.createElement('div');
  previewContent.className = 'prompt-preview-content';
  previewContent.style.cssText = `
    background: #2d2d2d;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #444;
    line-height: 1.6;
    font-family: \'Courier New\', monospace;
    white-space: pre-wrap;
    color: #ffffff;
  `;
  // CSP準拠: 安全にテキストを設定
  updatePreviewContent(previewContent, promptText, variables);

  previewSection.appendChild(previewTitle);
  previewSection.appendChild(previewContent);

  // 右側: 変数入力フォーム
  const formSection = document.createElement('div');
  formSection.style.cssText = `
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    background: #1a1a1a;
  `;

  if (variables.length === 0) {
    // 変数がない場合
    const noVariablesMessage = document.createElement('div');
    noVariablesMessage.style.cssText = `
      text-align: center;
      padding: 40px 20px;
      color: #999;
    `;
    // CSP準拠: 安全にテキストを設定
    const p1 = document.createElement('p');
    p1.textContent = '入力項目はありません';
    p1.style.cssText = `margin: 0 0 16px 0; font-size: 1.1rem;`;
    
    const p2 = document.createElement('p');
    p2.textContent = '「プロンプトを生成」ボタンを押してください';
    p2.style.cssText = `margin: 0; color: #999;`;
    
    noVariablesMessage.appendChild(p1);
    noVariablesMessage.appendChild(p2);
    formSection.appendChild(noVariablesMessage);
  } else {
    // 変数がある場合
    const formTitle = document.createElement('h3');
    formTitle.textContent = '入力項目';
    formTitle.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #ffffff;
    `;
    formSection.appendChild(formTitle);

    variables.forEach((variable, index) => {
      const fieldGroup = document.createElement('div');
      fieldGroup.style.cssText = `
        margin-bottom: 24px;
      `;

      // 変数名ラベル（色付き）
      const label = document.createElement('label');
      label.textContent = variable.name;
      label.style.cssText = `
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: ${variable.color};
        font-size: 1rem;
      `;

      // 入力フィールド
      const textarea = document.createElement('textarea');
      textarea.placeholder = variable.placeholder;
      textarea.className = `variable-input-${index}`;
      textarea.style.cssText = `
        width: 100%;
        min-height: 80px;
        padding: 12px;
        border: 2px solid #444;
        border-radius: 8px;
        font-family: inherit;
        font-size: 0.9rem;
        resize: vertical;
        background: #2d2d2d;
        color: #ffffff;
        outline: none;
        transition: border-color 0.2s;
      `;

      // フォーカス時のスタイル
      textarea.addEventListener('focus', () => {
        textarea.style.borderColor = variable.color;
      });
      textarea.addEventListener('blur', () => {
        textarea.style.borderColor = '#444';
      });

      // 合体変数機能は削除済み

      fieldGroup.appendChild(label);
      fieldGroup.appendChild(textarea);
      formSection.appendChild(fieldGroup);
    });
  }

  content.appendChild(previewSection);
  content.appendChild(formSection);

  // フッター
  const footer = document.createElement('div');
  footer.style.cssText = `
    padding: 20px 24px;
    border-top: 1px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #2a2a2a;
  `;

  const previewButton = document.createElement('button');
  previewButton.textContent = 'プレビュー更新';
  previewButton.style.cssText = `
    background: #495057;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: background-color 0.2s;
  `;
  previewButton.addEventListener('click', () => updatePreview());

  const generateButton = document.createElement('button');
  generateButton.textContent = 'プロンプトを生成';
  generateButton.style.cssText = `
    background: linear-gradient(135deg, #007bff, #00c6ff);
    color: white;
    border: none;
    padding: 12px 32px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: transform 0.2s;
  `;
  generateButton.addEventListener('click', () => generateAndInsertPrompt());

  footer.appendChild(previewButton);
  footer.appendChild(generateButton);

  // モーダル組み立て
  modal.appendChild(header);
  modal.appendChild(content);
  modal.appendChild(footer);
  overlay.appendChild(modal);

  // ESCキーとオーバーレイクリックでモーダルを閉じる
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeVariableModal();
    }
  });

  document.addEventListener('keydown', handleEscapeKey);

  return overlay;
}

/**
 * ESCキーでモーダルを閉じる
 */
function handleEscapeKey(e) {
  if (e.key === 'Escape' && variableModal) {
    closeVariableModal();
  }
}

/**
 * 変数モーダルを表示
 */
function showVariableModal(promptText, variables) {
  currentTemplate = { text: promptText, variables: variables };
  variableModal = createVariableModal(promptText, variables);
  document.body.appendChild(variableModal);
}

/**
 * 変数モーダルを閉じる
 */
function closeVariableModal() {
  if (variableModal) {
    document.body.removeChild(variableModal);
    variableModal = null;
    currentTemplate = null;
    document.removeEventListener('keydown', handleEscapeKey);
  }
}

/**
 * プレビュー更新
 */
function updatePreview() {
  if (!currentTemplate || !variableModal) return;

  const variables = currentTemplate.variables;
  const previewContent = variableModal.querySelector('.prompt-preview-content');

  // 入力値を収集
  variables.forEach((variable, index) => {
    const textarea = variableModal.querySelector(`.variable-input-${index}`);
    const checkbox = variableModal.querySelector(`#combine-${index}`);
    if (textarea) variable.value = textarea.value;
    if (checkbox) variable.isCombined = checkbox.checked;
  });

  // プレビュー更新（CSP準拠）
  const updatedPrompt = replaceVariables(currentTemplate.text, variables);
  previewContent.textContent = updatedPrompt;
}

/**
 * プロンプト生成と挿入
 */
function generateAndInsertPrompt() {
  console.log('LOG: generateAndInsertPrompt 開始');
  if (!currentTemplate) {
    console.error('LOG: currentTemplate が null です');
    return;
  }
  try {
    const variables = currentTemplate.variables;
    variables.forEach((variable, index) => {
      const textarea = variableModal.querySelector(`.variable-input-${index}`);
      if (textarea) {
        variable.value = textarea.value;
      }
    });

    const finalPrompt = replaceVariables(currentTemplate.text, variables);
    console.log('LOG: プロンプト生成完了。モーダルを閉じてから挿入します。');

    // ★仮説検証：先にモーダルを閉じる
    closeVariableModal();

    // 0.1秒待ってから挿入（DOMの更新を待つ）
    setTimeout(() => {
      console.log('LOG: 0.1秒後、insertPromptを呼び出します。');
      insertPrompt(finalPrompt);
    }, 100);

    console.log('LOG: カスタマイズプロンプト挿入処理を開始しました。');
  } catch (error) {
    console.error('プロンプト生成エラー:', error);
    alert('プロンプトの挿入に失敗しました。');
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
  // セキュリティチェック：信頼できるオリジンからのメッセージのみ処理
  if (!isValidOrigin(event.origin)) {
    return;
  }

  if (event.data && event.data.type === 'PROMPT_SELECTED') {
    console.log('プロンプト選択メッセージを受信:', event.data);

    try {
      // 変数システム対応: 変数検出を行う
      const promptText = event.data.prompt;
      const variables = extractVariables(promptText);

      if (variables.length > 0) {
        // 変数がある場合: カスタマイズモーダルを表示
        console.log('変数を検出、カスタマイズモーダルを表示:', variables.length + '個');
        showVariableModal(promptText, variables);
      } else {
        // 変数がない場合: 従来通り即座に挿入
        console.log('変数なし、従来通り挿入');
        insertPrompt(promptText);

        // パネルを自動で閉じる
        closePromptPanel();
        showNotification(`プロンプト「${event.data.title}」を挿入しました`, 'success');
      }
    } catch (error) {
      console.error('プロンプト処理エラー:', error);
      // フォールバック: 従来の動作
      try {
        insertPrompt(event.data.prompt);
        closePromptPanel();
        showNotification('プロンプトを挿入しました（変数システムエラーのため通常挿入）', 'warning');
      } catch (fallbackError) {
        showNotification('プロンプトの挿入に失敗しました', 'error');
      }
    }
  }
}

// 安全なオリジンかチェック
function isValidOrigin(origin) {
  const allowedOrigins = [
    'https://ganta9.github.io',
    'https://localhost',
    'https://127.0.0.1',
    'http://localhost',
    'http://127.0.0.1'
  ];

  const allowedDomains = [
    'github.io',
    'localhost',
    '127.0.0.1'
  ];

  const exactMatch = allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed + '/') || origin.startsWith(allowed + ':'));
  const domainMatch = allowedDomains.some(domain => origin.includes(domain));

  return exactMatch || domainMatch;
}

// ==========================================================================
// テキストエリア検出（v6.0.0完全継承）
// ==========================================================================

function findTextarea() {
  console.log('findTextarea 開始');
  const site = detectAISite();
  console.log('検出されたサイト:', site);

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
  console.log('サイト専用セレクタ数:', siteSpecificSelectors.length);
  for (const selector of siteSpecificSelectors) {
    console.log('検索中:', selector);
    const elements = document.querySelectorAll(selector);
    console.log(`${selector} で ${elements.length} 個の要素を発見`);
    for (const element of elements) {
      console.log('要素チェック中:', element);
      if (isViableTextarea(element)) {
        console.log(`✅ 入力欄を検出: ${selector}`, element);
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
// プロンプト挿入（v6.0.0完全継承）
// ==========================================================================

function insertPrompt(text) {
  console.log('LOG: insertPrompt 開始');
  const textarea = findTextarea();

  if (!textarea) {
    console.error('LOG: 入力欄が見つかりません (findTextarea failed)');
    alert('入力欄が見つかりません。ページを更新してから再試行してください。');
    return;
  }
  console.log('LOG: findTextarea 結果:', textarea);

  console.log('LOG: プロンプトを挿入:', text.substring(0, 50) + '...');

  textarea.focus();

  if (textarea.tagName === 'TEXTAREA') {
    console.log('LOG: TEXTAREA 方式で挿入します。');
    const currentValue = textarea.value;
    const newValue = currentValue ? currentValue + '\n\n' + text : text;

    textarea.value = newValue;

    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));

    textarea.setSelectionRange(newValue.length, newValue.length);

  } else {
    // contenteditable要素の場合
    const site = detectAISite();
    console.log('LOG: contenteditable 方式で挿入します。サイト:', site);
    const currentText = textarea.textContent || textarea.innerText || '';
    const newText = currentText ? currentText + '\n\n' + text : text;

    if (site === 'claude') {
      console.log('LOG: Claude.aiを検出、execCommand方式で挿入');
      try {
        textarea.textContent = '';
        console.log('LOG: execCommand を呼び出します。');
        const success = document.execCommand('insertText', false, newText);
        console.log('LOG: execCommand 結果:', success);
        if (!success) {
          throw new Error('execCommandがfalseを返しました');
        }
        textarea.dispatchEvent(new Event('input', { bubbles: true }));

      } catch (e) {
        console.warn('LOG: execCommand失敗、v5.0.0方式にフォールバック:', e.message);
        navigator.clipboard.writeText(newText).then(() => {
          textarea.textContent = '';
          setTimeout(() => {
            const pasteEvent = new ClipboardEvent('paste', {
              bubbles: true,
              cancelable: true,
              clipboardData: new DataTransfer()
            });
            pasteEvent.clipboardData.setData('text/plain', newText);
            textarea.dispatchEvent(pasteEvent);
          }, 100);
        }).catch(err => {
          console.error('LOG: クリップボードフォールバックも失敗:', err);
          textarea.textContent = newText;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        });
      }
    } else if (site === 'chatgpt') {
      console.log('LOG: ChatGPT検出、v5.0.0方式で挿入');
      navigator.clipboard.writeText(newText).then(() => {
        textarea.textContent = '';
        setTimeout(() => {
          const pasteEvent = new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: new DataTransfer()
          });
          pasteEvent.clipboardData.setData('text/plain', newText);
          textarea.dispatchEvent(pasteEvent);
        }, 100);
      }).catch(() => {
        textarea.textContent = newText;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      });
    } else {
      console.log('LOG: その他のサイト検出、標準挿入:', site);
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

  console.log('LOG: プロンプト挿入完了');
}

// ==========================================================================
// 通知システム（v6.0.0完全継承）
// ==========================================================================

function showNotification(message, type = 'info') {
  // 既存の通知を削除
  const existingNotification = document.getElementById('prompt-helper-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.id = 'prompt-helper-notification';
  // CSP準拠: 安全にDOM要素を作成
  const notificationContent = document.createElement('div');
  notificationContent.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    color: white;
    font-weight: 500;
    font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;
    font-size: 14px;
    border-radius: 8px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
  `;
  
  const iconSpan = document.createElement('span');
  iconSpan.style.fontSize = '16px';
  iconSpan.textContent = getNotificationIcon(type);
  
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  
  notificationContent.appendChild(iconSpan);
  notificationContent.appendChild(messageSpan);
  notification.appendChild(notificationContent);

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