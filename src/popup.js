/**
 * AI Prompt Helper v7.0.0 - Popup Script
 * GitHub Pages プロンプト管理システム
 */

// ==========================================================================
// グローバル変数
// ==========================================================================

let currentPrompts = [];
const GITHUB_PAGES_URL = 'https://ganta9.github.io/chrome_ext-ai_prompt_helper/prompts.json';

// ==========================================================================
// 初期化
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('AI Prompt Helper v7.0.0 Popup 初期化開始');
  
  try {
    await loadPromptsFromGitHub();
    updateUI();
    setupEventListeners();
    
    console.log('AI Prompt Helper v7.0.0 Popup 初期化完了');
  } catch (error) {
    console.error('Popup初期化エラー:', error);
    showError('初期化に失敗しました');
  }
});

// ==========================================================================
// プロンプトデータ読み込み
// ==========================================================================

async function loadPromptsFromGitHub() {
  try {
    console.log('GitHub Pagesからプロンプトデータを読み込み中...');
    
    const response = await fetch(GITHUB_PAGES_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.prompts || !Array.isArray(data.prompts)) {
      throw new Error('Invalid prompts data structure');
    }
    
    currentPrompts = data.prompts;
    console.log(`${currentPrompts.length}件のプロンプトを読み込み完了`);
    
  } catch (error) {
    console.error('GitHub Pagesからの読み込みに失敗:', error);
    
    // フォールバック: 基本的なプロンプトを提供
    currentPrompts = getFallbackPrompts();
    console.log('フォールバックプロンプトを使用');
  }
}

function getFallbackPrompts() {
  return [
    {
      id: 'fallback_1',
      title: '基本的なタスク指示',
      prompt: '[タスク内容]を実行してください。\n\n入力：',
      memo: '最も基本的な指示形式',
      tags: ['基本', '指示'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      history: []
    },
    {
      id: 'fallback_2', 
      title: '要約作成',
      prompt: '以下の文章を3つの主要ポイントで要約してください。\n\n文章：',
      memo: '長文を簡潔な要点に整理',
      tags: ['要約', '整理'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      history: []
    }
  ];
}

// ==========================================================================
// UI更新
// ==========================================================================

function updateUI() {
  updatePromptCount();
  displayPrompts();
}

function updatePromptCount() {
  const countElement = document.querySelector('.prompt-count');
  if (countElement) {
    countElement.textContent = `${currentPrompts.length}件のプロンプト`;
  }
}

function displayPrompts() {
  const container = document.querySelector('.prompts-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (currentPrompts.length === 0) {
    container.innerHTML = '<div class="no-prompts">プロンプトがありません</div>';
    return;
  }
  
  currentPrompts.forEach((prompt, index) => {
    const promptElement = createPromptElement(prompt, index);
    container.appendChild(promptElement);
  });
}

function createPromptElement(prompt, index) {
  const div = document.createElement('div');
  div.className = 'prompt-item';
  
  // タグの表示
  const tagsHtml = Array.isArray(prompt.tags) 
    ? prompt.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
    : '';
  
  div.innerHTML = `
    <div class="prompt-header">
      <h3 class="prompt-title">${escapeHtml(prompt.title)}</h3>
      <div class="prompt-actions">
        <button class="copy-btn" title="コピー">📋</button>
        <button class="edit-btn" title="編集">✏️</button>
      </div>
    </div>
    <div class="prompt-content">
      <div class="prompt-text">${escapeHtml(prompt.prompt).replace(/\n/g, '<br>')}</div>
      ${prompt.memo ? `<div class="prompt-memo">${escapeHtml(prompt.memo)}</div>` : ''}
      ${tagsHtml ? `<div class="prompt-tags">${tagsHtml}</div>` : ''}
    </div>
    <div class="prompt-meta">
      <small>作成: ${formatDate(prompt.created_at)} | 更新: ${formatDate(prompt.updated_at)}</small>
    </div>
  `;
  
  // イベントリスナー設定
  const copyBtn = div.querySelector('.copy-btn');
  const editBtn = div.querySelector('.edit-btn');
  
  copyBtn.addEventListener('click', () => copyPrompt(prompt));
  editBtn.addEventListener('click', () => editPrompt(index));
  
  return div;
}

// ==========================================================================
// プロンプト操作
// ==========================================================================

function copyPrompt(prompt) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(prompt.prompt).then(() => {
      showMessage('プロンプトをコピーしました');
    }).catch(() => {
      showError('コピーに失敗しました');
    });
  } else {
    showError('コピー機能に対応していません');
  }
}

function editPrompt(index) {
  // 編集機能は将来のPhaseで実装
  showMessage('編集機能は準備中です');
}

// ==========================================================================
// イベントリスナー設定
// ==========================================================================

function setupEventListeners() {
  // 検索機能
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterPrompts(e.target.value);
    });
  }
  
  // リフレッシュボタン
  const refreshBtn = document.querySelector('.refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      showMessage('データを更新中...');
      await loadPromptsFromGitHub();
      updateUI();
      showMessage('データを更新しました');
    });
  }
  
  // GitHubに同期ボタン（将来実装用）
  const syncBtn = document.querySelector('.sync-btn');
  if (syncBtn) {
    syncBtn.addEventListener('click', () => {
      showMessage('GitHubへの同期機能は準備中です');
    });
  }
}

// ==========================================================================
// フィルタリング・検索
// ==========================================================================

function filterPrompts(searchTerm) {
  const filteredPrompts = currentPrompts.filter(prompt => {
    const searchLower = searchTerm.toLowerCase();
    return (
      prompt.title.toLowerCase().includes(searchLower) ||
      prompt.prompt.toLowerCase().includes(searchLower) ||
      (prompt.memo && prompt.memo.toLowerCase().includes(searchLower)) ||
      (Array.isArray(prompt.tags) && prompt.tags.some(tag => 
        tag.toLowerCase().includes(searchLower)
      ))
    );
  });
  
  displayFilteredPrompts(filteredPrompts);
}

function displayFilteredPrompts(prompts) {
  const container = document.querySelector('.prompts-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (prompts.length === 0) {
    container.innerHTML = '<div class="no-prompts">検索結果がありません</div>';
    return;
  }
  
  prompts.forEach((prompt, index) => {
    const promptElement = createPromptElement(prompt, index);
    container.appendChild(promptElement);
  });
}

// ==========================================================================
// ユーティリティ関数
// ==========================================================================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
}

function showMessage(message) {
  console.log('Message:', message);
  // 将来的にはトースト通知等で表示
}

function showError(message) {
  console.error('Error:', message);
  // 将来的にはエラー通知等で表示
}