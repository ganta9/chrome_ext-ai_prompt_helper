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

// Google Sheets連携
let sheetsConnector = null;
let syncManager = null;
let syncSettings = {
    enabled: true,
    scriptUrl: 'https://script.google.com/macros/s/AKfycbwIAoo9vuoqXdx6dNndFKMJqRZTGbDGF3r/exec',
    autoSyncEnabled: false,
    // autoSyncInterval removed - manual sync only
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

        // 同期設定の読み込み
        loadSyncSettings();
        console.log('✅ ステップ1-1完了: 同期設定読み込み');

        // Google Sheets連携初期化
        if (syncSettings.enabled && syncSettings.scriptUrl) {
            initializeSheetsConnection();
            console.log('✅ ステップ1-2完了: Google Sheets連携初期化');
        }

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
}

// ========================================================================== 
// データ管理
// ========================================================================== 

async function loadPrompts() {
    try {
        console.log('📊 プロンプトデータ読み込み開始');
        
        // Google Sheets連携が有効な場合は優先
        if (syncSettings.enabled && syncSettings.scriptUrl && sheetsConnector) {
            console.log('🔄 Google Sheetsからデータ読み込み中...');
            try {
                const sheetsData = await sheetsConnector.getPrompts();
                // Google Sheetsからデータを取得した場合は、サンプルデータは作らない
                prompts = sheetsData || [];
                console.log('✅ Google Sheetsデータ読み込み:', prompts.length, '個のプロンプト');
                
                // デバッグ用：データの詳細を確認
                console.log('Google Sheetsデータの詳細:', prompts.slice(0, 3));
                
                updateAllTags();
                return;
            } catch (sheetsError) {
                console.warn('⚠️ Google Sheets読み込み失敗:', sheetsError);
                prompts = [];
                updateAllTags();
                return;
            }
        }

        // Google Sheets連携が無効な場合のみローカルストレージを使用
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

        // タグリストを更新
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

function handleSubmit(e) {
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

    if (currentEditId) {
        updatePrompt(currentEditId, promptData);
    } else {
        addPrompt(promptData);
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

function addPrompt(data) {
    const newPrompt = {
        id: generateId(),
        ...data,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
    };

    prompts.unshift(newPrompt);
    updateAllTags();
    savePrompts();

    closeModal();
    updateTagList();
    renderPrompts();
    updateCounts();

    showNotification('プロンプトを追加しました', 'success');
}

function updatePrompt(id, data) {
    const index = prompts.findIndex(p => p.id === id);
    if (index === -1) return;
    
    prompts[index] = {
        ...prompts[index],
        ...data,
        updatedAt: getCurrentTimestamp()
    };
    
    updateAllTags();
    savePrompts();
    
    closeModal();
    updateTagList();
    renderPrompts();
    updateCounts();
    
    showNotification('プロンプトを更新しました', 'success');
}

function deletePrompt(id) {
    const index = prompts.findIndex(p => p.id === id);
    if (index === -1) return;
    
    prompts.splice(index, 1);
    updateAllTags();
    savePrompts();
    
    closeDeleteModal();
    updateTagList();
    renderPrompts();
    updateCounts();
    
    showNotification('プロンプトを削除しました', 'success');
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
// Google Sheets連携クラス
// ========================================================================== 

class SheetsConnector {
    constructor(scriptUrl) {
        this.scriptUrl = scriptUrl;
        this.requestQueue = [];
        this.isProcessing = false;
    }

    async getPrompts() {
        console.log('📥 Google Sheets からプロンプト取得開始');
        const response = await this.makeRequest('getPrompts');
        // レスポンスからデータ配列を抽出
        return response.data || [];
    }

    async addPrompt(data) {
        console.log('📤 Google Sheets へプロンプト追加:', data.title);
        return await this.makeRequest('addPrompt', data);
    }

    async updatePrompt(id, data) {
        console.log('📤 Google Sheets でプロンプト更新:', id, data.title);
        return await this.makeRequest('updatePrompt', { id, ...data });
    }

    async deletePrompt(id) {
        console.log('📤 Google Sheets でプロンプト削除:', id);
        return await this.makeRequest('deletePrompt', { id });
    }

    makeRequest(action, params = {}) {
        return new Promise((resolve, reject) => {
            const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const timeout = setTimeout(() => {
                reject(new Error('リクエストタイムアウト'));
                // コールバック関数をクリアアップ
                delete window[callbackName];
            }, 30000); // 30秒タイムアウト

            window[callbackName] = (response) => {
                clearTimeout(timeout);
                delete window[callbackName];

                try {
                    if (response.success) {
                        console.log('✅ Google Sheets API 成功:', action);
                        resolve(response);
                    } else {
                        console.error('❌ Google Sheets API エラー:', response.error);
                        reject(new Error(response.error));
                    }
                } catch (error) {
                    console.error('❌ レスポンス処理エラー:', error);
                    reject(error);
                }
            };

            // URLパラメータを構築
            const urlParams = new URLSearchParams({
                action,
                callback: callbackName,
                ...params
            });

            const requestUrl = `${this.scriptUrl}?${urlParams.toString()}`;
            console.log('🌐 リクエストURL:', requestUrl.substring(0, 150) + '...');

            // JSONP リクエストを作成
            const script = document.createElement('script');
            script.src = requestUrl;
            script.onerror = () => {
                clearTimeout(timeout);
                delete window[callbackName];
                reject(new Error('Google Apps Script への接続に失敗しました'));
            };

            document.head.appendChild(script);

            // スクリプトタグを5秒後に削除
            setTimeout(() => {
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            }, 5000);
        });
    }

    async testConnection() {
        try {
            const result = await this.getPrompts();
            console.log('✅ Google Sheets 接続テスト成功');
            return { success: true, message: '接続テスト成功' };
        } catch (error) {
            console.error('❌ Google Sheets 接続テスト失敗:', error);
            return { success: false, error: error.message };
        }
    }
}

class SyncManager {
    constructor(sheetsConnector) {
        this.sheets = sheetsConnector;
        this.isProcessing = false;
        // autoSyncTimer removed
    }

    async syncToSheets() {
        if (this.isProcessing) {
            console.log('⏳ 同期処理中のため、リクエストをスキップ');
            return { success: false, message: '同期処理中です' };
        }

        this.isProcessing = true;
        console.log('📤 ローカル → Google Sheets 同期開始');

        try {
            const results = { added: 0, updated: 0, errors: 0 };

            for (const prompt of prompts) {
                try {
                    if (!prompt.syncId) {
                        // 新規追加
                        const result = await this.sheets.addPrompt({
                            title: prompt.title,
                            prompt: prompt.prompt,
                            memo: prompt.memo || '',
                            tags: prompt.tags ? prompt.tags.join(',') : ''
                        });

                        if (result.success && result.data) {
                            prompt.syncId = result.data.id;
                            results.added++;
                        }
                    } else {
                        // 更新
                        await this.sheets.updatePrompt(prompt.syncId, {
                            title: prompt.title,
                            prompt: prompt.prompt,
                            memo: prompt.memo || '',
                            tags: prompt.tags ? prompt.tags.join(',') : ''
                        });
                        results.updated++;
                    }
                } catch (error) {
                    console.error('プロンプト同期エラー:', prompt.title, error);
                    results.errors++;
                }
            }

            // ローカルに保存
            await savePrompts();
            syncSettings.lastSyncTime = new Date().toISOString();
            saveSyncSettings();

            console.log('✅ ローカル → Google Sheets 同期完了:', results);
            return { success: true, results };

        } catch (error) {
            console.error('❌ 同期処理エラー:', error);
            return { success: false, error: error.message };
        } finally {
            this.isProcessing = false;
        }
    }

    async syncFromSheets() {
        if (this.isProcessing) {
            console.log('⏳ 同期処理中のため、リクエストをスキップ');
            return { success: false, message: '同期処理中です' };
        }

        this.isProcessing = true;
        console.log('📥 Google Sheets → ローカル 同期開始');

        try {
            const response = await this.sheets.getPrompts();

            if (!response.success) {
                throw new Error(response.error);
            }

            const sheetsPrompts = response.data || [];
            const results = { added: 0, updated: 0, errors: 0 };

            // Google Sheets のプロンプトを処理
            for (const sheetsPrompt of sheetsPrompts) {
                try {
                    const existingPrompt = prompts.find(p => p.syncId === sheetsPrompt.id);

                    if (existingPrompt) {
                        // 更新日時で比較
                        const localUpdate = new Date(existingPrompt.updatedAt);
                        const sheetsUpdate = new Date(sheetsPrompt.updated_at);

                        if (sheetsUpdate > localUpdate) {
                            // Google Sheetsの方が新しい
                            existingPrompt.title = sheetsPrompt.title;
                            existingPrompt.prompt = sheetsPrompt.prompt;
                            existingPrompt.memo = sheetsPrompt.memo || '';
                            existingPrompt.tags = sheetsPrompt.tags ? sheetsPrompt.tags.split(',').map(t => t.trim()).filter(t => t) : [];
                            existingPrompt.updatedAt = sheetsPrompt.updated_at;
                            results.updated++;
                        }
                    } else {
                        // 新規プロンプト
                        const newPrompt = {
                            id: generateId(),
                            syncId: sheetsPrompt.id,
                            title: sheetsPrompt.title,
                            prompt: sheetsPrompt.prompt,
                            memo: sheetsPrompt.memo || '',
                            tags: sheetsPrompt.tags ? sheetsPrompt.tags.split(',').map(t => t.trim()).filter(t => t) : [],
                            createdAt: sheetsPrompt.created_at,
                            updatedAt: sheetsPrompt.updated_at
                        };

                        prompts.unshift(newPrompt);
                        results.added++;
                    }
                } catch (error) {
                    console.error('プロンプト同期エラー:', sheetsPrompt.title, error);
                    results.errors++;
                }
            }

            // UI更新
            updateAllTags();
            updateTagList();
            renderPrompts();
            updateCounts();

            // ローカルに保存
            await savePrompts();
            syncSettings.lastSyncTime = new Date().toISOString();
            saveSyncSettings();

            console.log('✅ Google Sheets → ローカル 同期完了:', results);
            return { success: true, results };

        } catch (error) {
            console.error('❌ 同期処理エラー:', error);
            return { success: false, error: error.message };
        } finally {
            this.isProcessing = false;
        }
    }

    async fullSync() {
        if (this.isProcessing) {
            console.log('⏳ 同期処理中のため、リクエストをスキップ');
            return { success: false, message: '同期処理中です' };
        }

        console.log('🔄 双方向同期開始');

        try {
            // まずGoogle Sheetsから最新データを取得
            const fromSheetsResult = await this.syncFromSheets();

            if (!fromSheetsResult.success) {
                return fromSheetsResult;
            }

            // ローカルの変更をGoogle Sheetsに送信
            const toSheetsResult = await this.syncToSheets();

            const combinedResults = {
                success: toSheetsResult.success,
                fromSheets: fromSheetsResult.results,
                toSheets: toSheetsResult.success ? toSheetsResult.results : null,
                error: toSheetsResult.error
            };

            console.log('✅ 双方向同期完了:', combinedResults);
            return combinedResults;

        } catch (error) {
            console.error('❌ 双方向同期エラー:', error);
            return { success: false, error: error.message };
        } 
    }

    // 自動同期機能は削除されました
    // 必要な時のみ手動で同期を実行してください
}

// ========================================================================== 
// Google Sheets連携管理関数
// ========================================================================== 

function loadSyncSettings() {
    try {
        const saved = localStorage.getItem('syncSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            syncSettings = { ...syncSettings, ...settings };
            console.log('✅ 同期設定読み込み完了:', syncSettings);
        }
    } catch (error) {
        console.error('同期設定読み込みエラー:', error);
    }
}

function saveSyncSettings() {
    try {
        localStorage.setItem('syncSettings', JSON.stringify(syncSettings));
        console.log('✅ 同期設定保存完了');
    } catch (error) {
        console.error('同期設定保存エラー:', error);
    }
}

function initializeSheetsConnection() {
    if (!syncSettings.scriptUrl) {
        console.log('Google Apps Script URLが未設定のため、連携を初期化しません');
        return;
    }

    try {
        sheetsConnector = new SheetsConnector(syncSettings.scriptUrl);
        syncManager = new SyncManager(sheetsConnector);

        console.log('✅ Google Sheets連携初期化完了');

        // 自動同期は無効化されています
        }

    } catch (error) {
        console.error('❌ Google Sheets連携初期化エラー:', error);
    }
}

// 同期関連のユーティリティ関数
function enableGoogleSheetsSync(scriptUrl) {
    syncSettings.enabled = true;
    syncSettings.scriptUrl = scriptUrl;
    saveSyncSettings();

    initializeSheetsConnection();
    showNotification('Google Sheets連携を有効にしました', 'success');
}

function disableGoogleSheetsSync() {
    syncSettings.enabled = false;
    saveSyncSettings();

    if (syncManager) {
        syncManager.stopAutoSync();
    }

    sheetsConnector = null;
    syncManager = null;

    showNotification('Google Sheets連携を無効にしました', 'info');
}

async function testGoogleSheetsConnection() {
    if (!sheetsConnector) {
        showNotification('Google Sheets連携が設定されていません', 'error');
        return { success: false, error: '連携未設定' };
    }

    showNotification('接続テスト中...', 'info');
    const result = await sheetsConnector.testConnection();

    if (result.success) {
        showNotification('Google Sheetsとの接続に成功しました', 'success');
    } else {
        showNotification(`接続テストに失敗: ${result.error}`, 'error');
    }

    return result;
}

async function syncNowManual() {
    if (!syncManager) {
        showNotification('Google Sheets連携が設定されていません', 'error');
        return;
    }

    showNotification('同期中...', 'info');
    const result = await syncManager.fullSync();

    if (result.success) {
        const message = `同期完了: 追加${result.fromSheets?.added || 0}件, 更新${result.fromSheets?.updated || 0}件`;
        showNotification(message, 'success');
    } else {
        showNotification(`同期エラー: ${result.error}`, 'error');
    }
}

// ========================================================================== 
// Window API エクスポート
// ========================================================================== 

if (typeof window !== 'undefined') {
    window.promptHelper = {
        prompts,
        addPrompt,
        updatePrompt,
        deletePrompt,
        loadPrompts,
        savePrompts,
        downloadJSON,
        editFromDetail,
        deleteFromDetail,
        selectPrompt,
        closeDetailModal,
        // Google Sheets連携
        syncSettings,
        enableGoogleSheetsSync,
        disableGoogleSheetsSync,
        testGoogleSheetsConnection,
        syncNowManual,
        sheetsConnector,
        syncManager
    };
}

// ========================================================================== 
// デバッグ・管理用関数
// ========================================================================== 

// デバッグ用関数
function debugInfo() {
    return {
        promptsCount: prompts.length,
        prompts: prompts,
        syncSettings: syncSettings,
        localStorage: localStorage.getItem('promptsData')
    };
}

// ローカルストレージをクリアする関数
function clearLocalStorage() {
    localStorage.removeItem('promptsData');
    console.log('✅ ローカルストレージのプロンプトデータを削除しました');
    return 'ローカルストレージをクリアしました';
}

// Google Sheetsから手動でデータを再読み込みする関数
async function forceReloadFromSheets() {
    if (sheetsConnector) {
        try {
            prompts = await sheetsConnector.getPrompts() || [];
            console.log('✅ Google Sheetsから再読み込み:', prompts.length, '個');
            console.log('データの詳細:', prompts);
            updateTagList();
            renderPrompts();
            updateCounts();
            return `Google Sheetsから${prompts.length}個のプロンプトを読み込みました`;
        } catch (error) {
            console.error('Google Sheets再読み込みエラー:', error);
            return 'Google Sheets再読み込みに失敗しました: ' + error.message;
        }
    } else {
        return 'Google Sheets連携が初期化されていません';
    }
}

// Google Sheetsの手動データを修正する関数
async function fixGoogleSheetsData() {
    if (!syncSettings.scriptUrl) {
        console.error('Google Apps Script URLが設定されていません');
        return 'URLが設定されていません';
    }
    
    try {
        const url = `${syncSettings.scriptUrl}?action=fixManualData&callback=fixDataCallback`;
        
        return new Promise((resolve, reject) => {
            window.fixDataCallback = function(response) {
                console.log('fixManualData結果:', response);
                if (response.success) {
                    resolve(`手動データを修正しました: ${response.message}`);
                } else {
                    reject(new Error(response.error || '不明なエラー'));
                }
                delete window.fixDataCallback;
            };
            
            const script = document.createElement('script');
            script.src = url;
            script.onerror = () => {
                reject(new Error('Google Apps Scriptの実行に失敗しました'));
                delete window.fixDataCallback;
            };
            document.head.appendChild(script);
            document.head.removeChild(script);
        });
    } catch (error) {
        console.error('fixGoogleSheetsData エラー:', error);
        return 'エラー: ' + error.message;
    }
}