/**
 * AI Prompt Helper Editor v6.0.0 - JavaScript
 * GitHub Pages編集サイト - Chrome拡張機能連携対応
 */

// ========================================================================== 
// グローバル変数
// ========================================================================== 

let prompts = [];
let allTags = new Set();
let currentFilter = 'all';
let currentEditId = null;
let searchQuery = '';

// GitHub API 連携
let githubConnector = null;
let githubSettings = {
    enabled: true,
    owner: 'ganta9',
    repo: 'chrome_ext-ai_prompt_helper',
    branch: 'main',
    filePath: 'prompts.json',
    lastSyncTime: null
};



// ========================================================================== 
// 初期化
// ========================================================================== 

document.addEventListener('DOMContentLoaded', async () => {
    console.log('AI Prompt Helper Editor v6.0.0 初期化開始');
    
    try {
        await initializeApp();
        setupEventListeners();
        console.log('初期化完了');
    } catch (error) {
        console.error('初期化エラー:', error);
        showNotification(`初期化に失敗しました: ${error.message}`, 'error');
        
        // フォールバック処理
        try {
            prompts = [];
            updateTagList();
            renderPrompts();
            updateCounts();
            setupEventListeners();
            console.log('フォールバック初期化完了');
        } catch (fallbackError) {
            console.error('フォールバック初期化も失敗:', fallbackError);
        }
    }
});

async function initializeApp() {
    try {
        showLoading(true);
        console.log('🔄 ステップ1: 設定読み込み開始');

        // GitHub設定の読み込み（LocalStorageから）
        console.log('✅ ステップ1-1完了: GitHub設定確認');

        // GitHub API連携初期化
        await initializeGitHubConnection();
        console.log('✅ ステップ1-2完了: GitHub API連携初期化');

        console.log('🔄 ステップ2: データ読み込み開始');

        // サンプルデータまたは既存データの読み込み
        await loadPrompts();
        console.log('✅ ステップ2完了: データ読み込み成功');

        console.log('🔄 ステップ3: UI更新開始');
        // UI更新
        updateTagList();
        console.log('✅ ステップ3-1完了: タグリスト更新');

        renderPrompts();
        console.log('✅ ステップ3-2完了: プロンプト描画');

        updateCounts();
        console.log('✅ ステップ3-3完了: カウント更新');

        showLoading(false);
        console.log('✅ 初期化完全成功');

    } catch (error) {
        console.error('💥 initializeApp内部エラー:', error);
        showLoading(false);
        throw error; // エラーを上位に再スロー
    }
}

// ========================================================================== 
// イベントリスナー設定
// ========================================================================== 

function setupEventListeners() {
    // ヘッダーアクション
    document.getElementById('add-prompt-btn').addEventListener('click', () => showAddModal());
    document.getElementById('download-btn').addEventListener('click', downloadJSON);
    document.getElementById('github-settings-btn').addEventListener('click', showGitHubSettingsModal);
    document.getElementById('search-input').addEventListener('input', handleSearch);
    
    // サイドバー
    document.getElementById('clear-filter-btn').addEventListener('click', clearFilter);
    document.getElementById('add-tag-btn').addEventListener('click', addNewTag);
    
    // ソート
    document.getElementById('sort-select').addEventListener('change', handleSort);
    
    // モーダル - プロンプト追加/編集
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    document.getElementById('prompt-form').addEventListener('submit', handleSubmit);
    document.getElementById('prompt-tags').addEventListener('input', handleTagInput);
    
    // モーダル - 詳細表示
    document.getElementById('detail-close').addEventListener('click', closeDetailModal);
    // 注意: detail-edit-btn, detail-delete-btn, detail-select-btnは
    // showDetailModal()内で動的にイベントハンドラーを設定
    
    // モーダル - 削除確認
    document.getElementById('delete-close').addEventListener('click', closeDeleteModal);
    document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);
    document.getElementById('delete-confirm').addEventListener('click', confirmDelete);
    
    // モーダル外クリックで閉じる
    document.getElementById('prompt-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });
    document.getElementById('detail-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeDetailModal();
    });
    document.getElementById('delete-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeDeleteModal();
    });
    
    // キーボードショートカット
    document.addEventListener('keydown', handleKeyboard);

    // GitHub設定モーダル
    document.getElementById('github-settings-close').addEventListener('click', hideGitHubSettingsModal);
    document.getElementById('github-cancel-btn').addEventListener('click', hideGitHubSettingsModal);
    document.getElementById('github-save-btn').addEventListener('click', saveGitHubToken);
    document.getElementById('test-github-connection').addEventListener('click', testGitHubConnectionFromModal);

    // GitHub設定モーダルの背景クリックで閉じる
    document.getElementById('github-settings-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            hideGitHubSettingsModal();
        }
    });
}

// ========================================================================== 
// データ管理
// ========================================================================== 

async function loadPrompts() {
    try {
        console.log('📊 プロンプトデータ読み込み開始');
        
        // 1. 最優先: prompts.jsonファイルから読み込み（v7.0.0対応）
        console.log('🔄 prompts.jsonから読み込み中...');
        try {
            const response = await fetch('./prompts.json');
            if (response.ok) {
                const data = await response.json();
                if (data.prompts && Array.isArray(data.prompts)) {
                    prompts = data.prompts;
                    console.log('✅ prompts.json読み込み成功:', prompts.length, '個のプロンプト');
                    console.log('✅ 最初のプロンプト:', prompts[0]?.title);
                    updateAllTags();
                    return;
                }
            }
        } catch (jsonError) {
            console.warn('⚠️ prompts.json読み込み失敗:', jsonError);
        }
        
        // 2. フォールバック: 既にprompts.jsonから読み込み済みのためスキップ

        // 3. フォールバック: ローカルストレージ
        console.log('📁 ローカルストレージから読み込み');
        const savedData = localStorage.getItem('promptsData');
        if (savedData) {
            const data = JSON.parse(savedData);
            prompts = data.prompts || [];
            console.log('📁 ローカルデータ読み込み:', prompts.length, '個のプロンプト');
        } else {
            prompts = [];
            console.log('📁 データなし、空の配列で初期化');
        }

        updateAllTags();
        
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        prompts = [];
        updateAllTags();
    }
}

async function savePrompts() {
    try {
        const data = {
            version: '6.0.0',
            lastUpdated: new Date().toISOString(),
            prompts: prompts
        };
        
        localStorage.setItem('promptsData', JSON.stringify(data));
        console.log('データ保存完了');
        
        return true;
    } catch (error) {
        console.error('データ保存エラー:', error);
        showNotification('データの保存に失敗しました', 'error');
        return false;
    }
}

function createSampleData() {
    // サンプルデータを空にして、Google Sheetsのみからデータを取得
    return [];
}

function updateAllTags() {
    allTags.clear();
    
    // promptsが配列でない場合の安全処理
    if (!Array.isArray(prompts)) {
        console.error('promptsが配列ではありません:', typeof prompts, prompts);
        prompts = [];
        return;
    }
    
    prompts.forEach(prompt => {
        if (prompt && prompt.tags) {
            // tagsが文字列の場合はカンマ区切りで分割
            if (typeof prompt.tags === 'string') {
                const tagArray = prompt.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
                tagArray.forEach(tag => allTags.add(tag));
            } else if (Array.isArray(prompt.tags)) {
                prompt.tags.forEach(tag => allTags.add(tag));
            }
        }
    });
}

// ========================================================================== 
// UI更新
// ========================================================================== 

function updateTagList() {
    const tagList = document.getElementById('tag-list');
    const existingAll = tagList.querySelector('[data-tag="all"]');
    
    // すべて以外をクリア
    tagList.innerHTML = '';
    tagList.appendChild(existingAll);
    
    // タグごとのカウントを計算
    const tagCounts = {};
    prompts.forEach(prompt => {
        if (prompt.tags) { // prompt.tags が存在するか確認
            let tagsToProcess = [];
            if (typeof prompt.tags === 'string') {
                tagsToProcess = prompt.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            } else if (Array.isArray(prompt.tags)) {
                tagsToProcess = prompt.tags;
            }

            tagsToProcess.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });
    
    // タグを追加
    Array.from(allTags).sort().forEach(tag => {
        const tagItem = document.createElement('div');
        tagItem.className = 'tag-item';
        tagItem.dataset.tag = tag;
        tagItem.innerHTML = `
            <span class="tag-name">${escapeHtml(tag)}</span>
            <span class="tag-count">${tagCounts[tag] || 0}</span>
        `;
        tagItem.addEventListener('click', () => filterByTag(tag));
        tagList.appendChild(tagItem);
    });
    
    // アクティブ状態を更新
    updateActiveTag();
}

function updateActiveTag() {
    document.querySelectorAll('.tag-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tag === currentFilter);
    });
}

function renderPrompts() {
    const grid = document.getElementById('prompt-grid');
    const emptyState = document.getElementById('empty-state');

    // promptsが配列でない場合の安全処理
    if (!Array.isArray(prompts)) {
        console.error('renderPrompts: promptsが配列ではありません:', typeof prompts, prompts);
        prompts = [];
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    // フィルタリングと検索
    let filteredPrompts = prompts.filter(prompt => {
        // タグフィルター
        if (currentFilter !== 'all') {
            if (!prompt.tags) {
                return false;
            }
            
            let tagArray = [];
            if (typeof prompt.tags === 'string') {
                tagArray = prompt.tags.split(',').map(tag => tag.trim());
            } else if (Array.isArray(prompt.tags)) {
                tagArray = prompt.tags;
            }
            
            if (!tagArray.includes(currentFilter)) {
                return false;
            }
        }
        
        // 検索フィルター
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            
            let tagArray = [];
            if (prompt.tags) {
                if (typeof prompt.tags === 'string') {
                    tagArray = prompt.tags.split(',').map(tag => tag.trim());
                } else if (Array.isArray(prompt.tags)) {
                    tagArray = prompt.tags;
                }
            }
            
            return (
                (prompt.title && prompt.title.toLowerCase().includes(query)) ||
                (prompt.prompt && prompt.prompt.toLowerCase().includes(query)) ||
                (prompt.memo && prompt.memo.toLowerCase().includes(query)) ||
                tagArray.some(tag => tag.toLowerCase().includes(query))
            );
        }
        
        return true;
    });

    // ソート
    const sortBy = document.getElementById('sort-select').value;
    filteredPrompts.sort((a, b) => {
        switch (sortBy) {
            case 'title':
                return a.title.localeCompare(b.title);
            case 'updated':
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            case 'created':
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });
    
    if (filteredPrompts.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    grid.innerHTML = filteredPrompts.map(prompt => `
        <div class="prompt-card" data-id="${prompt.id}">
            <div class="prompt-card-header">
                <h3 class="prompt-title">${escapeHtml(prompt.title)}</h3>
                <div class="prompt-actions">
                    <button class="action-btn" onclick="editPrompt(${prompt.id})" title="編集">
                        ✏️
                    </button>
                    <button class="action-btn" onclick="showDeleteModal(${prompt.id})" title="削除">
                        🗑️
                    </button>
                </div>
            </div>
            
            <div class="prompt-preview">${escapeHtml(truncateText(prompt.prompt, 150))}</div>
            
            ${prompt.memo ? `<div class="prompt-memo">💭 ${escapeHtml(truncateText(prompt.memo, 100))}</div>` : ''}
            
            ${prompt.tags ? `
                <div class="prompt-tags">
                    ${(typeof prompt.tags === 'string' ? prompt.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : prompt.tags).map(tag => `<span class="tag-badge">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            
            <div class="prompt-footer">
                <span>作成: ${formatDate(prompt.createdAt)}</span>
                <button class="btn btn-primary" onclick="showDetailModal(${prompt.id})">
                    選択
                </button>
            </div>
        </div>
    `).join('');
}

function updateCounts() {
    const totalCount = prompts.length;
    const filteredCount = document.querySelectorAll('.prompt-card').length;
    
    document.getElementById('all-count').textContent = totalCount;
    document.getElementById('prompt-count').textContent = `${filteredCount}個のプロンプト`;
    
    // タイトル更新
    const titleElement = document.getElementById('content-title');
    if (currentFilter === 'all') {
        titleElement.textContent = 'すべてのプロンプト';
    } else {
        titleElement.textContent = `タグ: ${currentFilter}`;
    }
}

// ========================================================================== 
// イベントハンドラー
// ========================================================================== 

function handleSearch(e) {
    searchQuery = e.target.value.trim();
    renderPrompts();
    updateCounts();
}

function handleSort(e) {
    renderPrompts();
    updateCounts();
}

function filterByTag(tag) {
    currentFilter = tag;
    updateActiveTag();
    renderPrompts();
    updateCounts();
}

function clearFilter() {
    currentFilter = 'all';
    document.getElementById('search-input').value = '';
    searchQuery = '';
    updateActiveTag();
    renderPrompts();
    updateCounts();
}

function handleTagInput(e) {
    const input = e.target.value;
    const suggestions = document.getElementById('tag-suggestions');
    
    if (input.length > 0) {
        const lastTag = input.split(',').pop().trim().toLowerCase();
        if (lastTag.length > 0) {
            const matchingTags = Array.from(allTags).filter(tag => 
                tag.toLowerCase().includes(lastTag) && 
                !input.toLowerCase().includes(tag.toLowerCase())
            );
            
            suggestions.innerHTML = matchingTags.slice(0, 5).map(tag => 
                `<span class="tag-suggestion" onclick="addSuggestedTag('${tag}')">${escapeHtml(tag)}</span>`
            ).join('');
        } else {
            suggestions.innerHTML = '';
        }
    } else {
        suggestions.innerHTML = '';
    }
}

function addSuggestedTag(tag) {
    const input = document.getElementById('prompt-tags');
    const currentTags = input.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
    currentTags.pop(); // 最後の部分的なタグを削除
    currentTags.push(tag);
    input.value = currentTags.join(', ') + ', ';
    input.focus();
    document.getElementById('tag-suggestions').innerHTML = '';
}

async function handleSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('prompt-title').value.trim();
    const content = document.getElementById('prompt-content').value.trim();
    const memo = document.getElementById('prompt-memo').value.trim();
    const tagsInput = document.getElementById('prompt-tags').value.trim();

    if (!title || !content) {
        showNotification('タイトルとプロンプトは必須です', 'error');
        return;
    }

    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

    const promptData = {
        title,
        prompt: content,
        memo: memo || '',
        tags
    };

    try {
        if (currentEditId) {
            await updatePromptWithAutoSave(currentEditId, promptData);
        } else {
            await addPromptWithAutoSave(promptData);
        }
    } catch (error) {
        console.error('プロンプト操作エラー:', error);
        showNotification(`操作に失敗しました: ${error.message}`, 'error');
    }
}

function handleKeyboard(e) {
    // Escキーでモーダルを閉じる
    if (e.key === 'Escape') {
        if (document.getElementById('prompt-modal').style.display !== 'none') {
            closeModal();
        } else if (document.getElementById('detail-modal').style.display !== 'none') {
            closeDetailModal();
        } else if (document.getElementById('delete-modal').style.display !== 'none') {
            closeDeleteModal();
        }
    }
    
    // Ctrl/Cmd + N で新規プロンプト
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        showAddModal();
    }
    
    // Ctrl/Cmd + F で検索フォーカス
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input').focus();
    }
}

// ========================================================================== 
// CRUD操作
// ========================================================================== 

async function addPrompt(data) {
    const newPrompt = {
        id: generateId(),
        ...data,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
    };

    prompts.unshift(newPrompt);
    updateAllTags();
    await savePrompts();

    closeModal();
    updateTagList();
    renderPrompts();
    updateCounts();

    showNotification('プロンプトを追加しました', 'success');
    return newPrompt;
}

async function updatePrompt(id, data) {
    const index = prompts.findIndex(p => p.id === id);
    if (index === -1) return;

    prompts[index] = {
        ...prompts[index],
        ...data,
        updatedAt: getCurrentTimestamp()
    };

    updateAllTags();
    await savePrompts();

    closeModal();
    updateTagList();
    renderPrompts();
    updateCounts();

    showNotification('プロンプトを更新しました', 'success');
    return prompts[index];
}

async function deletePrompt(id) {
    const index = prompts.findIndex(p => p.id === id);
    if (index === -1) return;

    const deletedPrompt = prompts[index];
    prompts.splice(index, 1);
    updateAllTags();
    await savePrompts();

    closeDeleteModal();
    updateTagList();
    renderPrompts();
    updateCounts();

    showNotification('プロンプトを削除しました', 'success');
    return deletedPrompt;
}

// ========================================================================== 
// モーダル操作
// ========================================================================== 

function showAddModal() {
    currentEditId = null;
    document.getElementById('modal-title').textContent = 'プロンプト追加';
    document.getElementById('prompt-form').reset();
    document.getElementById('tag-suggestions').innerHTML = '';
    document.getElementById('prompt-modal').style.display = 'flex';
    setTimeout(() => document.getElementById('prompt-title').focus(), 100);
}

function editPrompt(id) {
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return;
    
    currentEditId = id;
    document.getElementById('modal-title').textContent = 'プロンプト編集';
    document.getElementById('prompt-title').value = prompt.title;
    document.getElementById('prompt-content').value = prompt.prompt;
    document.getElementById('prompt-memo').value = prompt.memo || '';
    document.getElementById('prompt-tags').value = prompt.tags ? prompt.tags.join(', ') : '';
    document.getElementById('tag-suggestions').innerHTML = '';
    document.getElementById('prompt-modal').style.display = 'flex';
    setTimeout(() => document.getElementById('prompt-title').focus(), 100);
}

function closeModal() {
    document.getElementById('prompt-modal').style.display = 'none';
    currentEditId = null;
}

function showDetailModal(id) {
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return;
    
    document.getElementById('detail-title').textContent = prompt.title;
    document.getElementById('detail-prompt').textContent = prompt.prompt;
    
    const memoSection = document.getElementById('detail-memo-section');
    if (prompt.memo) {
        document.getElementById('detail-memo').textContent = prompt.memo;
        memoSection.style.display = 'block';
    } else {
        memoSection.style.display = 'none';
    }
    
    const tagsContainer = document.getElementById('detail-tags');
    if (prompt.tags && prompt.tags.length > 0) {
        tagsContainer.innerHTML = prompt.tags.map(tag => 
            `<span class="tag-badge">${escapeHtml(tag)}</span>`
        ).join('');
    } else {
        tagsContainer.innerHTML = '<span style="color: var(--text-muted);">タグなし</span>';
    }
    
    // ボタンにIDを設定（デバッグログ付き）
    console.log('🔧🔧🔧 モーダルボタン設定中 ID:', id);

    // 既存のイベントリスナーをクリア
    const editBtn = document.getElementById('detail-edit-btn');
    const deleteBtn = document.getElementById('detail-delete-btn');
    const selectBtn = document.getElementById('detail-select-btn');

    console.log('🔧🔧🔧 ボタン要素確認:', {
        editBtn: !!editBtn,
        deleteBtn: !!deleteBtn,
        selectBtn: !!selectBtn,
        selectBtnText: selectBtn?.textContent
    });

    // 新しいイベントリスナーを設定（クローンして古いリスナーを削除）
    const newEditBtn = editBtn.cloneNode(true);
    editBtn.parentNode.replaceChild(newEditBtn, editBtn);
    newEditBtn.addEventListener('click', () => {
        closeDetailModal();
        editPrompt(id);
    });

    const newDeleteBtn = deleteBtn.cloneNode(true);
    deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
    newDeleteBtn.addEventListener('click', () => showDeleteModal(id));

    const newSelectBtn = selectBtn.cloneNode(true);
    selectBtn.parentNode.replaceChild(newSelectBtn, selectBtn);
    newSelectBtn.addEventListener('click', () => {
        console.log('🔥🔥🔥 選択ボタンがクリックされました! ID:', id);
        console.log('🔥🔥🔥 これからselectPrompt関数を呼び出します');

        // 確実に関数が呼ばれるようにtry-catchで囲む
        try {
            selectPrompt(id);
            console.log('🔥🔥🔥 selectPrompt関数呼び出し完了');
        } catch (error) {
            console.error('🔥🔥🔥 selectPrompt関数呼び出しエラー:', error);
        }
    });

    console.log('🔧 選択ボタン設定完了:', newSelectBtn);
    
    document.getElementById('detail-modal').style.display = 'flex';
}

function closeDetailModal() {
    const detailModal = document.getElementById('detail-modal');
    if (detailModal) {
        detailModal.style.display = 'none';
    }
}

function showDeleteModal(id) {
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return;
    
    document.getElementById('delete-prompt-title').textContent = prompt.title;
    document.getElementById('delete-confirm').onclick = () => deletePrompt(id);
    document.getElementById('delete-modal').style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
}

// ========================================================================== 
// Chrome拡張機能連携
// ========================================================================== 

// 緊急修正: JavaScript実行エラー対策
(function() {
    'use strict';

    console.log('🛡️ JavaScript エラー対策を初期化');

    // Clipboard API の安全な呼び出し用ヘルパー
    window.safeClipboardWrite = function(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                return navigator.clipboard.writeText(text).catch(error => {
                    console.warn('Clipboard API failed:', error);
                    return fallbackCopy(text);
                });
            } else {
                return fallbackCopy(text);
            }
        } catch (error) {
            console.warn('Clipboard API not available:', error);
            return fallbackCopy(text);
        }
    };

    function fallbackCopy(text) {
        // フォールバック: テキストエリア作成方式
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return Promise.resolve();
        } catch (error) {
            console.error('フォールバックコピーも失敗:', error);
            return Promise.reject(error);
        }
    }

    console.log('🛡️ JavaScript エラー対策完了');
})();

function selectPrompt(id) {
    // 関数の開始を最初にログ出力（console.clearより前）
    console.clear(); // デバッグ用：コンソールをクリア
    console.log('████████████████████████████████████████████████████████');
    console.log('🚀🚀🚀 selectPrompt関数が呼び出されました! ID:', id);
    console.log('🔥🔥🔥 これが表示されていない場合、関数が呼ばれていません！');
    console.log('████████████████████████████████████████████████████████');
    console.log('🔍 引数チェック:', {
        id: id,
        idType: typeof id,
        timestamp: new Date().toISOString()
    });

    const prompt = prompts.find(p => p.id === id);
    if (!prompt) {
        console.error('❌ プロンプトが見つかりません:', id, 'prompts:', prompts);
        return;
    }
    console.log('🚀 ==> プロンプト選択開始:', prompt.title);
    console.log('🚀 ==> プロンプトID:', id);
    console.log('🚀 ==> 現在のプロンプト一覧:', prompts.length, '個');

    // iframe環境の詳細チェック
    const isInIframe = window.parent && window.parent !== window;
    const isInExtension = window.location !== window.parent.location;

    console.log('🔍 環境チェック 開始 ====================');
    console.log('🔍 window.parent:', window.parent);
    console.log('🔍 window.parent !== window:', window.parent !== window);
    console.log('🔍 isInIframe:', isInIframe);
    console.log('🔍 isInExtension:', isInExtension);
    console.log('🔍 currentLocation:', window.location.href);

    if (window.parent && window.parent !== window) {
        console.log('✅ iframe環境が検出されました！');
        console.log('🎯 Chrome拡張機能通信を実行します');
    } else {
        console.log('❌ iframe環境ではありません');
        console.log('🎯 スタンドアロン処理を実行します');
    }
    console.log('🔍 環境チェック 終了 ====================');

    // iframeから親ウィンドウ（Chrome拡張機能）へのメッセージ送信
    if (isInIframe) {
        console.log('🚀 iframe環境検出: window.parentにプロンプトを送信');
        console.log('🚀 parent:', window.parent);

        const messageData = {
            type: 'INSERT_PROMPT',
            prompt: prompt.prompt,
            title: prompt.title,
            id: prompt.id,
            source: 'github_pages_iframe'
        };

        console.log('🚀 送信データ:', {
            ...messageData,
            prompt: messageData.prompt.substring(0, 100) + '...'
        });

        try {
            window.parent.postMessage(messageData, '*');
            console.log('🚀 postMessage送信完了');

            // iframe内では通知表示のみ（親ウィンドウで処理される）
            showNotification('プロンプトを自動挿入中...', 'info');
            return;
        } catch (error) {
            console.error('🚀 postMessage送信エラー:', error);
        }
    }

    // 別タブで開いた場合（window.opener）
    if (window.opener && !window.opener.closed) {
        console.log('別タブ: window.openerにプロンプトを送信');
        window.opener.postMessage({
            type: 'PROMPT_SELECTED',
            prompt: prompt.prompt,
            title: prompt.title,
            id: prompt.id
        }, '*');

        showNotification('プロンプトを送信しました', 'success');

        // 2秒後にウィンドウを閉じる
        setTimeout(() => {
            window.close();
        }, 2000);
        return;
    }

    // フォールバック処理（iframe通信が失敗した場合のみ）
    console.log('🔄 フォールバック: iframe通信が失敗しました');

    // iframe環境: Chrome拡張機能に直接通信を送信
    if (isInIframe) {
        console.log('🔄 iframe環境: Chrome拡張機能への通信を試行');

        // 拡張機能への詳細メッセージを送信
        const message = {
            type: 'INSERT_PROMPT',
            prompt: prompt.prompt,
            title: prompt.title,
            source: 'github_pages_iframe'
        };

        console.log('📨 拡張機能へメッセージ送信:', message);

        try {
            // 複数の通信方法を試行
            if (window.parent && window.parent.postMessage) {
                window.parent.postMessage(message, '*');
                console.log('✅ window.parent.postMessage 送信完了');
            }

            if (window.top && window.top.postMessage) {
                window.top.postMessage(message, '*');
                console.log('✅ window.top.postMessage 送信完了');
            }

            showNotification('プロンプトを送信しました', 'success');

            // 成功時はモーダルを閉じる
            setTimeout(() => {
                document.getElementById('detail-modal').style.display = 'none';
            }, 1000);

        } catch (error) {
            console.error('❌ iframe通信エラー:', error);
            showNotification('プロンプト送信に失敗しました', 'error');
        }

        return; // iframe環境ではここで終了
    }

    // スタンドアロン環境の場合のみクリップボードコピー
    console.log('🔄 スタンドアロン環境: クリップボードコピーを実行');
    showNotification('プロンプトをクリップボードにコピーしました', 'success');
}

// ========================================================================== 
// ユーティリティ関数
// ========================================================================== 

function generateId() {
    return Date.now() + Math.random();
}

function getCurrentTimestamp() {
    return new Date().toISOString();
}

function downloadJSON() {
    const data = {
        version: '6.0.0',
        lastUpdated: getCurrentTimestamp(),
        prompts: prompts
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts_${formatDateForFilename()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('JSONファイルをダウンロードしました', 'success');
}

function addNewTag() {
    const tagName = prompt('新しいタグ名を入力してください:');
    if (tagName && tagName.trim()) {
        const trimmedTag = tagName.trim();
        if (!allTags.has(trimmedTag)) {
            allTags.add(trimmedTag);
            updateTagList();
            filterByTag(trimmedTag);
        } else {
            showNotification('そのタグは既に存在します', 'warning');
        }
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const icon = document.getElementById('notification-icon');
    const messageEl = document.getElementById('notification-message');
    
    // アイコンとスタイルを設定
    notification.className = `notification ${type}`;
    switch (type) {
        case 'success':
            icon.textContent = '✓';
            break;
        case 'error':
            icon.textContent = '✗';
            break;
        case 'warning':
            icon.textContent = '⚠';
            break;
        default:
            icon.textContent = 'ℹ';
    }
    
    messageEl.textContent = message;
    notification.style.display = 'block';
    
    // 3秒後に非表示
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateForFilename() {
    return getCurrentTimestamp().split('T')[0].replace(/-/g, '');
}

// ========================================================================== 
// デバッグ用
// ========================================================================== 

// ========================================================================== 
// 詳細モーダル関連関数
// ========================================================================== 

function editFromDetail() {
    if (currentEditId) {
        closeDetailModal();
        showEditModal(currentEditId);
    }
}

function deleteFromDetail() {
    if (currentEditId) {
        closeDetailModal();
        if (confirm('このプロンプトを削除してもよろしいですか？')) {
            deletePrompt(currentEditId);
        }
    }
}

function closeDetailModal() {
    const detailModal = document.getElementById('detail-modal');
    if (detailModal) {
        detailModal.style.display = 'none';
    }
}

// showEditModal関数（editFromDetailで使用）
function showEditModal(id) {
    editPrompt(id);
}

// confirmDelete関数（削除確認モーダルで使用）
function confirmDelete() {
    // onclick で設定された deletePrompt 関数が呼ばれるため、ここでは何もしない
    // 実際の削除処理は showDeleteModal で設定される
}

// ==========================================================================
// GitHub API連携クラス
// ==========================================================================

class GitHubConnector {
    constructor(owner, repo, branch = 'main') {
        this.owner = owner;
        this.repo = repo;
        this.branch = branch;
        this.filePath = 'prompts.json';
        this.apiBase = 'https://api.github.com';
        this.token = null;
        this.debounceTimer = null;
    }

    async initialize() {
        // トークンを取得（Chrome拡張機能またはLocalStorage）
        try {
            // Chrome拡張機能環境
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get(['githubToken']);
                this.token = result.githubToken;
            } else {
                // GitHub Pages環境（ブラウザ）
                this.token = localStorage.getItem('githubToken');
            }

            if (!this.token) {
                console.warn('GitHub Personal Access Token が設定されていません');
                return { success: false, error: 'トークン未設定' };
            }
            console.log('✅ GitHub API 初期化完了');
            return { success: true };
        } catch (error) {
            console.error('❌ GitHub API 初期化エラー:', error);
            return { success: false, error: error.message };
        }
    }

    async getCurrentFileSha() {
        try {
            const response = await fetch(
                `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${this.filePath}?ref=${this.branch}`,
                {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                return data.sha;
            } else if (response.status === 404) {
                // ファイルが存在しない場合は新規作成
                return null;
            } else {
                throw new Error(`GitHub API エラー: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ GitHub SHA取得エラー:', error);
            throw error;
        }
    }

    async updatePromptsFile(promptsData) {
        try {
            if (!this.token) {
                await this.initialize();
            }

            const sha = await this.getCurrentFileSha();
            const content = btoa(JSON.stringify(promptsData, null, 2)); // Base64エンコード

            const requestBody = {
                message: '🤖 Auto-save: プロンプトデータ更新',
                content: content,
                branch: this.branch
            };

            if (sha) {
                requestBody.sha = sha;
            }

            const response = await fetch(
                `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${this.filePath}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                }
            );

            if (response.ok) {
                const result = await response.json();
                console.log('✅ GitHub API 保存成功:', result.commit.sha);
                return { success: true, sha: result.commit.sha };
            } else {
                const error = await response.json();
                throw new Error(`GitHub API エラー: ${error.message}`);
            }

        } catch (error) {
            console.error('❌ GitHub API 保存エラー:', error);
            throw error;
        }
    }

    // Debounce処理付きの自動保存
    async autoSave(promptsData) {
        // 連続編集時のAPI呼び出し最小化
        clearTimeout(this.debounceTimer);

        this.debounceTimer = setTimeout(async () => {
            try {
                await this.updatePromptsFile(promptsData);
                showNotification('✅ 自動保存完了', 'success');
                githubSettings.lastSyncTime = new Date().toISOString();
            } catch (error) {
                console.error('自動保存エラー:', error);
                showNotification(`⚠️ 自動保存失敗: ${error.message}`, 'error');
            }
        }, 1000); // 1秒間編集なしで保存実行
    }

    async testConnection() {
        try {
            const response = await fetch(
                `${this.apiBase}/repos/${this.owner}/${this.repo}`,
                {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (response.ok) {
                console.log('✅ GitHub API 接続テスト成功');
                return { success: true, message: 'GitHub接続成功' };
            } else {
                throw new Error(`GitHub API エラー: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ GitHub API 接続テスト失敗:', error);
            return { success: false, error: error.message };
        }
    }
}

// ==========================================================================
// GitHub API管理関数
// ==========================================================================

async function initializeGitHubConnection() {
    try {
        githubConnector = new GitHubConnector(
            githubSettings.owner,
            githubSettings.repo,
            githubSettings.branch
        );

        const result = await githubConnector.initialize();
        if (result.success) {
            console.log('✅ GitHub API連携初期化完了');
        } else {
            console.warn('⚠️ GitHub API初期化警告:', result.error);
        }
        return result;
    } catch (error) {
        console.error('❌ GitHub API連携初期化エラー:', error);
        return { success: false, error: error.message };
    }
}

// 自動保存機能を既存のプロンプト操作関数に統合
async function autoSaveToGitHub() {
    if (githubConnector) {
        try {
            const data = {
                prompts: prompts
            };
            await githubConnector.autoSave(data);
        } catch (error) {
            console.warn('自動保存をスキップ:', error.message);
        }
    }
}


// ==========================================================================
// 自動保存機能統合（既存関数の修正）
// ==========================================================================

// addPrompt関数を修正してGitHub自動保存を追加
async function addPromptWithAutoSave(data) {
    try {
        const result = await addPrompt(data);
        await autoSaveToGitHub();
        return result;
    } catch (error) {
        console.error('プロンプト追加エラー:', error);
        throw error;
    }
}

// updatePrompt関数を修正してGitHub自動保存を追加
async function updatePromptWithAutoSave(id, data) {
    try {
        const result = await updatePrompt(id, data);
        await autoSaveToGitHub();
        return result;
    } catch (error) {
        console.error('プロンプト更新エラー:', error);
        throw error;
    }
}

// deletePrompt関数を修正してGitHub自動保存を追加
async function deletePromptWithAutoSave(id) {
    try {
        const result = await deletePrompt(id);
        await autoSaveToGitHub();
        return result;
    } catch (error) {
        console.error('プロンプト削除エラー:', error);
        throw error;
    }
}

// ==========================================================================
// Window API エクスポート（GitHub版）
// ==========================================================================

if (typeof window !== 'undefined') {
    window.promptHelper = {
        prompts,
        addPrompt: addPromptWithAutoSave,
        updatePrompt: updatePromptWithAutoSave,
        deletePrompt: deletePromptWithAutoSave,
        loadPrompts,
        savePrompts,
        downloadJSON,
        editFromDetail,
        deleteFromDetail,
        selectPrompt,
        closeDetailModal,
        // GitHub API連携
        githubSettings,
        githubConnector,
        autoSaveToGitHub,
        initializeGitHubConnection
    };
}

// ==========================================================================
// デバッグ・管理用関数
// ==========================================================================

function debugInfo() {
    return {
        promptsCount: prompts.length,
        prompts: prompts,
        githubSettings: githubSettings,
        localStorage: localStorage.getItem('promptsData')
    };
}

function clearLocalStorage() {
    localStorage.removeItem('promptsData');
    console.log('✅ ローカルストレージのプロンプトデータを削除しました');
    return 'ローカルストレージをクリアしました';
}

// GitHub API接続テスト関数
async function testGitHubConnection() {
    if (!githubConnector) {
        showNotification('GitHub API連携が設定されていません', 'error');
        return { success: false, error: '連携未設定' };
    }

    showNotification('GitHub接続テスト中...', 'info');
    const result = await githubConnector.testConnection();

    if (result.success) {
        showNotification('GitHubとの接続に成功しました', 'success');
    } else {
        showNotification(`接続テストに失敗: ${result.error}`, 'error');
    }

    return result;
}

// 手動GitHub同期実行
async function manualSaveToGitHub() {
    if (!githubConnector) {
        showNotification('GitHub API連携が設定されていません', 'error');
        return;
    }

    showNotification('GitHub保存中...', 'info');
    try {
        const data = { prompts: prompts };
        await githubConnector.updatePromptsFile(data);
        showNotification('GitHubへの保存が完了しました', 'success');
    } catch (error) {
        showNotification(`GitHub保存エラー: ${error.message}`, 'error');
    }
}

// ==========================================================================
// GitHub設定モーダル関連
// ==========================================================================

function showGitHubSettingsModal() {
    const modal = document.getElementById('github-settings-modal');
    const tokenInput = document.getElementById('github-token');

    // 既存のトークンを読み込み
    const existingToken = localStorage.getItem('githubToken');
    if (existingToken) {
        tokenInput.value = existingToken;
    }

    modal.style.display = 'flex';
}

function hideGitHubSettingsModal() {
    document.getElementById('github-settings-modal').style.display = 'none';
    clearGitHubStatus();
}

function clearGitHubStatus() {
    const statusElement = document.getElementById('github-status');
    statusElement.textContent = '';
    statusElement.className = 'status-message';
}

function showGitHubStatus(message, type) {
    const statusElement = document.getElementById('github-status');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
}

async function saveGitHubToken() {
    const token = document.getElementById('github-token').value.trim();

    if (!token) {
        showGitHubStatus('トークンを入力してください', 'error');
        return;
    }

    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        showGitHubStatus('正しいGitHub Personal Access Token形式ではありません', 'error');
        return;
    }

    try {
        // LocalStorageに保存
        localStorage.setItem('githubToken', token);

        // GitHub API連携を再初期化
        await initializeGitHubConnection();

        showGitHubStatus('GitHub Tokenが保存されました', 'success');
        showNotification('GitHub設定が保存されました', 'success');

        setTimeout(() => {
            hideGitHubSettingsModal();
        }, 1500);

    } catch (error) {
        console.error('GitHub Token保存エラー:', error);
        showGitHubStatus('保存に失敗しました', 'error');
    }
}

async function testGitHubConnectionFromModal() {
    const token = document.getElementById('github-token').value.trim();

    if (!token) {
        showGitHubStatus('まずトークンを入力してください', 'error');
        return;
    }

    showGitHubStatus('接続テスト中...', 'info');

    try {
        // 一時的にトークンを設定してテスト
        const tempConnector = new GitHubConnector(
            githubSettings.owner,
            githubSettings.repo,
            githubSettings.branch
        );
        tempConnector.token = token;

        const result = await tempConnector.testConnection();

        if (result.success) {
            showGitHubStatus('✅ GitHub接続成功！', 'success');
        } else {
            showGitHubStatus(`❌ 接続失敗: ${result.error}`, 'error');
        }

    } catch (error) {
        showGitHubStatus(`❌ 接続エラー: ${error.message}`, 'error');
    }
}

// GitHub関連のイベントリスナーはsetupEventListeners関数内で設定

// ==========================================================================
// Chrome拡張機能からのToken受信
// ==========================================================================

// URLパラメータからTokenを取得
function getTokenFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
        localStorage.setItem('githubToken', token);
        console.log('URLパラメータからGitHub Tokenを設定しました');
        // URLをクリーンアップ
        window.history.replaceState({}, document.title, window.location.pathname);
        showNotification('Chrome拡張機能からGitHub Tokenを受信しました', 'success');
        return true;
    }
    return false;
}

// Chrome拡張機能からのメッセージ受信
if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'setGitHubToken') {
            localStorage.setItem('githubToken', request.token);
            console.log('Chrome拡張機能からGitHub Tokenを受信しました');
            showNotification('GitHub Tokenが同期されました', 'success');

            // GitHub API連携を再初期化
            initializeGitHubConnection();

            sendResponse({ success: true });
        }
    });
}

// ページ読み込み時にURLパラメータをチェック
document.addEventListener('DOMContentLoaded', () => {
    getTokenFromURL();
});

console.log('✅ AI Prompt Helper Editor v7.0.0 with GitHub API - 初期化完了');
