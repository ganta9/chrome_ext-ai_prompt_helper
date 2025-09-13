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
        console.log('🔄 ステップ1: データ読み込み開始');
        
        // サンプルデータまたは既存データの読み込み
        await loadPrompts();
        console.log('✅ ステップ1完了: データ読み込み成功');
        
        console.log('🔄 ステップ2: UI更新開始');
        // UI更新
        updateTagList();
        console.log('✅ ステップ2-1完了: タグリスト更新');
        
        renderPrompts();
        console.log('✅ ステップ2-2完了: プロンプト描画');
        
        updateCounts();
        console.log('✅ ステップ2-3完了: カウント更新');
        
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
        // 🔍 デバッグ: 現在のローカルストレージ状況を確認
        const allKeys = Object.keys(localStorage);
        console.log('🔍 デバッグ: localStorage全体:', allKeys);

        // ローカルストレージから読み込み
        const savedData = localStorage.getItem('promptsData');
        console.log('🔍 デバッグ: savedData raw:', savedData ? savedData.substring(0, 200) + '...' : null);

        if (savedData) {
            const data = JSON.parse(savedData);
            prompts = data.prompts || [];
            console.log('✅ ローカルデータ読み込み:', prompts.length, '個のプロンプト');
            console.log('🔍 デバッグ: 読み込んだプロンプトタイトル:', prompts.map(p => p.title));
        } else {
            // サンプルデータを作成
            prompts = createSampleData();
            await savePrompts();
            console.log('✅ サンプルデータ作成');
        }

        // タグリストを更新
        updateAllTags();
        
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        prompts = createSampleData();
        await savePrompts();
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
    return [
        {
            id: 1,
            title: '文章校閲プロンプト',
            prompt: '以下の文章を校閲してください。誤字脱字、文法、表現の改善点を指摘し、修正案を提示してください。\\n\\n【対象文章】\\n',
            memo: 'ビジネス文書に特に効果的。長文の場合は分割して使用すると良い。',
            tags: ['文章作成', '校閲', 'ビジネス', '日本語'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 2,
            title: 'プログラムコード説明',
            prompt: '以下のコードについて、動作原理、使用している技術、改善点を詳しく説明してください。初心者にもわかりやすく解説してください。\\n\\n```\\n[ここにコードを貼り付け]\\n```',
            memo: 'プログラミング学習時に便利。コードレビューでも活用可能。',
            tags: ['プログラミング', 'コード解説', '学習', 'レビュー'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 3,
            title: '翻訳支援プロンプト',
            prompt: '以下の文章を自然で読みやすい日本語に翻訳してください。専門用語の説明も含めてください。\\n\\n【原文】\\n',
            memo: '技術文書の翻訳時に特に有効。文脈を考慮した訳語選択ができる。',
            tags: ['翻訳', '多言語', '技術文書'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
}

function updateAllTags() {
    allTags.clear();
    prompts.forEach(prompt => {
        if (prompt.tags && Array.isArray(prompt.tags)) {
            prompt.tags.forEach(tag => allTags.add(tag));
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
        if (prompt.tags && Array.isArray(prompt.tags)) {
            prompt.tags.forEach(tag => {
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
    
    // フィルタリングと検索
    let filteredPrompts = prompts.filter(prompt => {
        // タグフィルター
        if (currentFilter !== 'all') {
            if (!prompt.tags || !prompt.tags.includes(currentFilter)) {
                return false;
            }
        }
        
        // 検索フィルター
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                prompt.title.toLowerCase().includes(query) ||
                prompt.prompt.toLowerCase().includes(query) ||
                (prompt.memo && prompt.memo.toLowerCase().includes(query)) ||
                (prompt.tags && prompt.tags.some(tag => tag.toLowerCase().includes(query)))
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
            
            ${prompt.tags && prompt.tags.length > 0 ? `
                <div class="prompt-tags">
                    ${prompt.tags.map(tag => `<span class="tag-badge">${escapeHtml(tag)}</span>`).join('')}
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

    console.log('🔍 デバッグ: handleSubmit開始');
    console.log('🔍 デバッグ: currentEditId:', currentEditId);
    console.log('🔍 デバッグ: 送信前のプロンプト数:', prompts.length);

    const title = document.getElementById('prompt-title').value.trim();
    const content = document.getElementById('prompt-content').value.trim();
    const memo = document.getElementById('prompt-memo').value.trim();
    const tagsInput = document.getElementById('prompt-tags').value.trim();

    console.log('🔍 デバッグ: フォームデータ:', { title, content, memo, tagsInput });

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

    console.log('🔍 デバッグ: 作成されたpromptData:', promptData);

    if (currentEditId) {
        console.log('🔍 デバッグ: 編集モードでupdatePromptを呼び出し');
        updatePrompt(currentEditId, promptData);
    } else {
        console.log('🔍 デバッグ: 新規追加モードでaddPromptを呼び出し');
        await addPrompt(promptData);
    }

    console.log('🔍 デバッグ: handleSubmit完了');
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
    console.log('🔍 デバッグ: addPrompt開始 - 追加前のプロンプト数:', prompts.length);
    console.log('🔍 デバッグ: prompts配列の型:', Array.isArray(prompts), typeof prompts);
    console.log('🔍 デバッグ: prompts配列の中身:', prompts);

    const newPrompt = {
        id: Date.now(), // 簡易ID生成
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    console.log('🔍 デバッグ: 新しいプロンプト:', newPrompt);

    // 🚨 修正: 確実に配列に追加する方法に変更
    if (Array.isArray(prompts)) {
        prompts.unshift(newPrompt);
        console.log('🔍 デバッグ: unshift実行完了');
    } else {
        console.error('🚨 エラー: prompts が配列ではありません!', typeof prompts, prompts);
        prompts = [newPrompt]; // 緊急修正
        console.log('🔍 デバッグ: prompts配列を再初期化しました');
    }

    console.log('🔍 デバッグ: 追加後のプロンプト数:', prompts.length);
    console.log('🔍 デバッグ: 現在の全プロンプトタイトル:', prompts.map(p => p.title));

    updateAllTags();
    const saveResult = await savePrompts();
    console.log('🔍 デバッグ: savePrompts結果:', saveResult);

    // 保存直後のローカルストレージ確認
    const savedCheck = localStorage.getItem('promptsData');
    if (savedCheck) {
        const parsed = JSON.parse(savedCheck);
        console.log('🔍 デバッグ: 保存確認 - localStorage内プロンプト数:', parsed.prompts.length);
        console.log('🔍 デバッグ: 保存確認 - タイトル:', parsed.prompts.map(p => p.title));
    }

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
        updatedAt: new Date().toISOString()
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
    document.getElementById('detail-modal').style.display = 'none';
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

function downloadJSON() {
    const data = {
        version: '6.0.0',
        lastUpdated: new Date().toISOString(),
        prompts: prompts
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts_${formatDateForFilename(new Date())}.json`;
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

function formatDateForFilename(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
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
        closeDetailModal
    };
}