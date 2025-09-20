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
    console.log('🚀 [INIT] =====================================');
    console.log('🚀 [INIT] initializeApp() 開始');
    console.log('🚀 [INIT] 初期状態:', {
        promptsCount: prompts.length,
        promptsTitles: prompts.slice(0, 3).map(p => p.title),
        githubConnectorExists: !!githubConnector,
        allTagsSize: allTags.size
    });

    try {
        showLoading(true);
        console.log('🚀 [INIT] ローディング表示開始');

        console.log('🚀 [INIT] ステップ1: 設定読み込み開始');
        console.log('🚀 [INIT] プロンプト状態（設定前）:', {
            count: prompts.length,
            firstTitles: prompts.slice(0, 2).map(p => p.title)
        });

        // GitHub設定の読み込み（LocalStorageから）
        console.log('🚀 [INIT] ステップ1-1: GitHub設定確認');

        // GitHub API連携初期化
        console.log('🚀 [INIT] ステップ1-2: GitHub API連携初期化開始');
        await initializeGitHubConnection();
        console.log('🚀 [INIT] ステップ1-2完了: GitHub API連携初期化');
        console.log('🚀 [INIT] プロンプト状態（GitHub初期化後）:', {
            count: prompts.length,
            firstTitles: prompts.slice(0, 2).map(p => p.title)
        });

        console.log('🚀 [INIT] ステップ2: データ読み込み開始');
        console.log('🚀 [INIT] プロンプト状態（読み込み前）:', {
            count: prompts.length,
            firstTitles: prompts.slice(0, 2).map(p => p.title)
        });

        // サンプルデータまたは既存データの読み込み
        await loadPrompts();
        console.log('🚀 [INIT] ステップ2完了: データ読み込み成功');
        console.log('🚀 [INIT] プロンプト状態（読み込み後）:', {
            count: prompts.length,
            firstTitles: prompts.slice(0, 3).map(p => p.title),
            allTitles: prompts.map(p => p.title)
        });

        console.log('🚀 [INIT] ステップ3: UI更新開始');

        console.log('🚀 [INIT] ステップ3-1: タグリスト更新開始');
        updateTagList();
        console.log('🚀 [INIT] ステップ3-1完了: タグリスト更新');
        console.log('🚀 [INIT] タグ状態:', {
            allTagsSize: allTags.size,
            tags: Array.from(allTags).slice(0, 5)
        });

        console.log('🚀 [INIT] ステップ3-2: プロンプト描画開始');
        renderPrompts();
        console.log('🚀 [INIT] ステップ3-2完了: プロンプト描画');

        console.log('🚀 [INIT] ステップ3-3: カウント更新開始');
        updateCounts();
        console.log('🚀 [INIT] ステップ3-3完了: カウント更新');

        showLoading(false);
        console.log('🚀 [INIT] ローディング非表示完了');

        console.log('🟢 [SUCCESS] 初期化完全成功');
        console.log('🚀 [INIT] 最終状態:', {
            promptsCount: prompts.length,
            promptsTitles: prompts.slice(0, 5).map(p => p.title),
            allTagsSize: allTags.size,
            githubConnectorExists: !!githubConnector
        });
        console.log('🚀 [INIT] =====================================');

    } catch (error) {
        console.error('🔴 [ERROR] initializeApp内部エラー:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        console.log('🚀 [INIT] エラー時の状態:', {
            promptsCount: prompts.length,
            githubConnectorExists: !!githubConnector
        });
        showLoading(false);
        console.log('🚀 [INIT] =====================================');
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

    // v7.1.0 モーダル - プレビュー表示
    document.getElementById('preview-close').addEventListener('click', closePreviewModal);
    // 注意: preview-edit-btn, preview-delete-btnは
    // showPreviewModal()内で動的にイベントハンドラーを設定
    
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
    document.getElementById('preview-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closePreviewModal();
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
    console.log('📥 [LOAD] =====================================');
    console.log('📥 [LOAD] loadPrompts() 開始');
    console.log('📥 [LOAD] 現在のpromptsデータ状態:', {
        count: prompts.length,
        first3Titles: prompts.slice(0, 3).map(p => p.title)
    });

    try {
        // 1. 最優先: prompts.jsonファイルから読み込み（v7.0.0対応）
        console.log('📥 [LOAD] データソース1: prompts.jsonファイル読み込み開始');
        console.log('📥 [LOAD] Fetch URL: ./prompts.json');

        try {
            const response = await fetch('./prompts.json');
            console.log('📥 [LOAD] Fetch レスポンス:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                url: response.url,
                headers: {
                    'content-type': response.headers.get('content-type'),
                    'last-modified': response.headers.get('last-modified'),
                    'etag': response.headers.get('etag')
                }
            });

            if (response.ok) {
                console.log('📥 [LOAD] JSON解析開始...');
                const data = await response.json();
                console.log('📥 [LOAD] JSON解析完了:', {
                    hasPrompts: !!data.prompts,
                    isArray: Array.isArray(data.prompts),
                    version: data.version,
                    lastUpdated: data.last_updated,
                    promptCount: data.prompts?.length || 0
                });

                if (data.prompts && Array.isArray(data.prompts)) {
                    const oldCount = prompts.length;
                    prompts = data.prompts;
                    console.log('🟢 [SUCCESS] prompts.json読み込み成功');
                    console.log('📥 [LOAD] データ更新:', {
                        before: oldCount,
                        after: prompts.length,
                        delta: prompts.length - oldCount
                    });
                    console.log('📥 [LOAD] 読み込んだプロンプト一覧:',
                        prompts.slice(0, 5).map((p, i) => `${i+1}. ${p.title} (${p.id})`)
                    );
                    updateAllTags();
                    console.log('📥 [LOAD] updateAllTags() 完了');
                    console.log('📥 [LOAD] loadPrompts() 正常終了 - prompts.jsonから読み込み');
                    return;
                } else {
                    console.log('🔴 [ERROR] prompts.json構造異常:', data);
                }
            } else {
                console.log('🔴 [ERROR] prompts.json取得失敗:', response.status, response.statusText);
            }
        } catch (jsonError) {
            console.error('🔴 [ERROR] prompts.json読み込みエラー:', {
                message: jsonError.message,
                stack: jsonError.stack,
                name: jsonError.name
            });
        }
        
        console.log('📥 [LOAD] データソース1（prompts.json）失敗、フォールバック開始');

        // 2. フォールバック: ローカルストレージ
        console.log('📥 [LOAD] データソース2: ローカルストレージ読み込み開始');
        const savedData = localStorage.getItem('promptsData');
        console.log('📥 [LOAD] ローカルストレージ状態:', {
            hasData: !!savedData,
            dataLength: savedData?.length || 0,
            keys: Object.keys(localStorage)
        });

        if (savedData) {
            try {
                console.log('📥 [LOAD] ローカルストレージJSON解析開始...');
                const data = JSON.parse(savedData);
                console.log('📥 [LOAD] ローカルストレージJSON解析完了:', {
                    hasPrompts: !!data.prompts,
                    isArray: Array.isArray(data.prompts),
                    version: data.version,
                    lastUpdated: data.lastUpdated,
                    promptCount: data.prompts?.length || 0
                });

                const oldCount = prompts.length;
                prompts = data.prompts || [];
                console.log('🟢 [SUCCESS] ローカルストレージ読み込み成功');
                console.log('📥 [LOAD] データ更新:', {
                    before: oldCount,
                    after: prompts.length,
                    delta: prompts.length - oldCount
                });
                console.log('📥 [LOAD] 読み込んだプロンプト一覧:',
                    prompts.slice(0, 5).map((p, i) => `${i+1}. ${p.title || '(タイトルなし)'} (${p.id || '(IDなし)'})`)
                );
            } catch (parseError) {
                console.error('🔴 [ERROR] ローカルストレージJSON解析エラー:', {
                    message: parseError.message,
                    stack: parseError.stack,
                    rawData: savedData.substring(0, 200) + '...'
                });
                prompts = [];
            }
        } else {
            console.log('📥 [LOAD] ローカルストレージにデータなし、空の配列で初期化');
            prompts = [];
        }

        updateAllTags();
        console.log('📥 [LOAD] updateAllTags() 完了');
        console.log('📥 [LOAD] loadPrompts() 正常終了 - ローカルストレージから読み込み');

    } catch (error) {
        console.error('🔴 [ERROR] loadPrompts() 予期しないエラー:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        console.log('📥 [LOAD] エラーリカバリー: 空の配列で初期化');
        prompts = [];
        updateAllTags();
        console.log('📥 [LOAD] エラーリカバリー完了');
    }

    console.log('📥 [LOAD] =====================================');
    console.log('📥 [LOAD] loadPrompts() 最終結果:', {
        finalCount: prompts.length,
        finalTitles: prompts.slice(0, 3).map(p => p.title || '(タイトルなし)')
    });
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
        <div class="prompt-card" data-id="${prompt.id}" onclick="selectAndPreview('${prompt.id}')" style="cursor: pointer;">
            <div class="prompt-card-header">
                <h3 class="prompt-title">${escapeHtml(prompt.title)}</h3>
                <div class="prompt-actions">
                    <button class="action-btn" onclick="event.stopPropagation(); editPrompt('${prompt.id}')" title="編集">
                        ✏️
                    </button>
                    <button class="action-btn" onclick="event.stopPropagation(); showDeleteModal('${prompt.id}')" title="削除">
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
                <!-- 選択ボタンを削除し、カード全体をクリック可能に変更 -->
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
    console.log('🔵 [DEBUG] handleSubmit 開始');
    e.preventDefault();

    const title = document.getElementById('prompt-title').value.trim();
    const content = document.getElementById('prompt-content').value.trim();
    const memo = document.getElementById('prompt-memo').value.trim();
    const tagsInput = document.getElementById('prompt-tags').value.trim();

    console.log('🔵 [DEBUG] 入力値:', { title, contentLength: content.length, memo, tagsInput });

    if (!title || !content) {
        console.log('🔵 [DEBUG] バリデーションエラー: タイトルまたはコンテンツが空');
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

    console.log('🔵 [DEBUG] プロンプトデータ準備完了:', {
        title: promptData.title,
        promptLength: promptData.prompt.length,
        memo: promptData.memo,
        tagsCount: promptData.tags.length
    });

    try {
        if (currentEditId) {
            console.log('🔵 [DEBUG] 更新モード - updatePromptWithAutoSave 実行');
            await updatePromptWithAutoSave(currentEditId, promptData);
        } else {
            console.log('🔵 [DEBUG] 追加モード - addPromptWithAutoSave 実行');
            await addPromptWithAutoSave(promptData);
        }
        console.log('🟢 [SUCCESS] handleSubmit 正常完了');
    } catch (error) {
        console.error('🔴 [ERROR] プロンプト操作エラー:', error);
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
        } else if (document.getElementById('preview-modal').style.display !== 'none') {
            closePreviewModal();
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
    console.log('➕ [ADD] =====================================');
    console.log('➕ [ADD] addPrompt() 開始');
    console.log('➕ [ADD] 入力データ:', {
        title: data.title,
        promptLength: data.prompt?.length || 0,
        memo: data.memo,
        tagsCount: data.tags?.length || 0,
        tags: data.tags
    });
    console.log('➕ [ADD] 追加前のプロンプト数:', prompts.length);

    const newId = generateId();
    const timestamp = getCurrentTimestamp();
    const newPrompt = {
        id: newId,
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp
    };

    console.log('➕ [ADD] 新しいプロンプト作成:', {
        id: newPrompt.id,
        title: newPrompt.title,
        createdAt: newPrompt.createdAt
    });

    const oldCount = prompts.length;
    prompts.unshift(newPrompt);
    console.log('➕ [ADD] prompts配列に追加完了:', {
        before: oldCount,
        after: prompts.length,
        newPromptPosition: 0
    });

    console.log('➕ [ADD] updateAllTags() 実行...');
    updateAllTags();
    console.log('➕ [ADD] updateAllTags() 完了');

    console.log('➕ [ADD] savePrompts() 実行...');
    await savePrompts();
    console.log('➕ [ADD] savePrompts() 完了');

    console.log('➕ [ADD] UI更新開始...');
    closeModal();
    console.log('➕ [ADD] モーダル閉じる完了');

    updateTagList();
    console.log('➕ [ADD] タグリスト更新完了');

    renderPrompts();
    console.log('➕ [ADD] プロンプト描画完了');

    updateCounts();
    console.log('➕ [ADD] カウント更新完了');

    console.log('🟢 [SUCCESS] addPrompt() 完了');
    console.log('➕ [ADD] =====================================');

    showNotification('プロンプトを追加しました', 'success');
    return newPrompt;
}

async function updatePrompt(id, data) {
    console.log('✏️ [UPDATE] =====================================');
    console.log('✏️ [UPDATE] updatePrompt() 開始');
    console.log('✏️ [UPDATE] パラメータ:', {
        id: id,
        title: data.title,
        promptLength: data.prompt?.length || 0,
        memo: data.memo,
        tagsCount: data.tags?.length || 0,
        tags: data.tags
    });

    const index = prompts.findIndex(p => {
        const match = p.id == id || p.id === String(id) || String(p.id) === String(id);
        console.log('✏️ [UPDATE] ID比較:', p.id, '(', typeof p.id, ') vs', id, '(', typeof id, ') → match:', match);
        return match;
    });
    console.log('✏️ [UPDATE] プロンプト検索結果:', {
        targetId: id,
        foundIndex: index,
        exists: index !== -1,
        totalPrompts: prompts.length
    });

    if (index === -1) {
        console.log('🔴 [ERROR] 更新対象のプロンプトが見つかりません');
        console.log('✏️ [UPDATE] =====================================');
        return;
    }

    const oldPrompt = { ...prompts[index] };
    console.log('✏️ [UPDATE] 更新前のプロンプト:', {
        id: oldPrompt.id,
        title: oldPrompt.title,
        updatedAt: oldPrompt.updatedAt
    });

    const timestamp = getCurrentTimestamp();
    prompts[index] = {
        ...prompts[index],
        ...data,
        updatedAt: timestamp
    };

    console.log('✏️ [UPDATE] プロンプト更新完了:', {
        id: prompts[index].id,
        title: prompts[index].title,
        updatedAt: prompts[index].updatedAt,
        changed: {
            title: oldPrompt.title !== prompts[index].title,
            prompt: oldPrompt.prompt !== prompts[index].prompt,
            memo: oldPrompt.memo !== prompts[index].memo
        }
    });

    console.log('✏️ [UPDATE] updateAllTags() 実行...');
    updateAllTags();
    console.log('✏️ [UPDATE] updateAllTags() 完了');

    console.log('✏️ [UPDATE] savePrompts() 実行...');
    await savePrompts();
    console.log('✏️ [UPDATE] savePrompts() 完了');

    console.log('✏️ [UPDATE] UI更新開始...');
    closeModal();
    console.log('✏️ [UPDATE] モーダル閉じる完了');

    updateTagList();
    console.log('✏️ [UPDATE] タグリスト更新完了');

    renderPrompts();
    console.log('✏️ [UPDATE] プロンプト描画完了');

    updateCounts();
    console.log('✏️ [UPDATE] カウント更新完了');

    console.log('🟢 [SUCCESS] updatePrompt() 完了');
    console.log('✏️ [UPDATE] =====================================');

    showNotification('プロンプトを更新しました', 'success');
    return prompts[index];
}

async function deletePrompt(id) {
    console.log('🗑️ [DELETE] deletePrompt() 開始 - ID:', id, 'ID型:', typeof id);
    const index = prompts.findIndex(p => {
        const match = p.id == id || p.id === String(id) || String(p.id) === String(id);
        return match;
    });
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
    console.log('✏️ [EDIT] editPrompt() 開始 - ID:', id, 'ID型:', typeof id);
    const prompt = prompts.find(p => {
        const match = p.id == id || p.id === String(id) || String(p.id) === String(id);
        console.log('✏️ [EDIT] ID比較:', p.id, '(', typeof p.id, ') vs', id, '(', typeof id, ') → match:', match);
        return match;
    });
    console.log('✏️ [EDIT] 検索結果:', prompt ? `見つかった: ${prompt.title}` : '見つからない');
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
    const prompt = prompts.find(p => p.id == id || p.id === String(id) || String(p.id) === String(id));
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
    const prompt = prompts.find(p => p.id == id || p.id === String(id) || String(p.id) === String(id));
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

    const prompt = prompts.find(p => p.id == id || p.id === String(id) || String(p.id) === String(id));
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
// v7.1.0 新機能: ワンクリック選択＋プレビュー
// ==========================================================================

// プロンプト選択と同時にプレビュー表示（新機能）
function selectAndPreview(id) {
    console.log('🎯 [NEW] selectAndPreview() 開始 - ID:', id);

    // 1. 即座にプロンプト選択を実行
    console.log('🎯 [NEW] 1. selectPrompt() 実行開始...');
    selectPrompt(id);
    console.log('🎯 [NEW] 1. selectPrompt() 実行完了');

    // 2. 同時にプレビューモーダルを表示
    console.log('🎯 [NEW] 2. showPreviewModal() 実行開始...');
    showPreviewModal(id);
    console.log('🎯 [NEW] 2. showPreviewModal() 実行完了');

    console.log('🎯 [NEW] selectAndPreview() 完了');
}

// プレビューモーダル表示（マークダウン対応）
function showPreviewModal(id) {
    console.log('👁️ [PREVIEW] showPreviewModal() 開始 - ID:', id);

    const prompt = prompts.find(p => p.id == id || p.id === String(id) || String(p.id) === String(id));
    if (!prompt) {
        console.error('👁️ [PREVIEW] プロンプトが見つかりません:', id);
        return;
    }

    console.log('👁️ [PREVIEW] プロンプト取得成功:', prompt.title);

    // タイトル設定
    document.getElementById('preview-title').textContent = prompt.title;
    console.log('👁️ [PREVIEW] タイトル設定完了');

    // マークダウンレンダリング付きプロンプト表示
    const previewPromptElement = document.getElementById('preview-prompt');
    try {
        // marked.jsを使用してマークダウンをHTMLに変換
        if (typeof marked !== 'undefined') {
            console.log('👁️ [PREVIEW] marked.js利用可能、マークダウンレンダリング実行');
            previewPromptElement.innerHTML = marked.parse(prompt.prompt);
            console.log('👁️ [PREVIEW] マークダウンレンダリング完了');
        } else {
            console.warn('👁️ [PREVIEW] marked.js未読み込み、プレーンテキスト表示');
            previewPromptElement.textContent = prompt.prompt;
        }
    } catch (error) {
        console.error('👁️ [PREVIEW] マークダウンレンダリングエラー:', error);
        // フォールバック: プレーンテキスト表示
        previewPromptElement.textContent = prompt.prompt;
    }

    // 作成日表示（最小限のメタ情報）
    const previewDate = document.getElementById('preview-date');
    if (prompt.createdAt) {
        console.log('👁️ [PREVIEW] 作成日表示');
        previewDate.textContent = `作成: ${formatDate(prompt.createdAt)}`;
    } else {
        previewDate.textContent = '';
    }

    // 編集・削除ボタンのイベント設定
    document.getElementById('preview-edit-btn').onclick = () => {
        console.log('👁️ [PREVIEW] 編集ボタンクリック');
        closePreviewModal();
        editPrompt(id);
    };

    document.getElementById('preview-delete-btn').onclick = () => {
        console.log('👁️ [PREVIEW] 削除ボタンクリック');
        closePreviewModal();
        showDeleteModal(id);
    };

    // モーダル表示
    document.getElementById('preview-modal').style.display = 'flex';
    console.log('👁️ [PREVIEW] プレビューモーダル表示完了');
}

// プレビューモーダルを閉じる
function closePreviewModal() {
    console.log('👁️ [PREVIEW] closePreviewModal() 実行');
    const previewModal = document.getElementById('preview-modal');
    if (previewModal) {
        previewModal.style.display = 'none';
        console.log('👁️ [PREVIEW] プレビューモーダル非表示完了');
    }
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
        console.log('🔑 [SHA] =====================================');
        console.log('🔑 [SHA] getCurrentFileSha() 開始');
        console.log('🔑 [SHA] パラメータ:', {
            owner: this.owner,
            repo: this.repo,
            filePath: this.filePath,
            branch: this.branch,
            hasToken: !!this.token
        });

        try {
            const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${this.filePath}?ref=${this.branch}`;
            console.log('🔑 [SHA] API URL:', url);

            console.log('🔑 [SHA] GitHub API リクエスト開始...');
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            console.log('🔑 [SHA] GitHub API レスポンス受信:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                url: response.url,
                headers: {
                    'content-type': response.headers.get('content-type'),
                    'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
                    'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
                    'etag': response.headers.get('etag'),
                    'last-modified': response.headers.get('last-modified')
                }
            });

            if (response.ok) {
                console.log('🔑 [SHA] JSON解析開始...');
                const data = await response.json();
                console.log('🔑 [SHA] JSON解析完了:', {
                    sha: data.sha,
                    name: data.name,
                    path: data.path,
                    size: data.size,
                    downloadUrl: data.download_url
                });

                console.log('🟢 [SUCCESS] getCurrentFileSha() 成功 - SHA:', data.sha);
                console.log('🔑 [SHA] =====================================');
                return data.sha;
            } else if (response.status === 404) {
                console.log('🟡 [INFO] ファイル未存在（404）- 新規作成予定');
                console.log('🔑 [SHA] =====================================');
                return null;
            } else {
                console.log('🔴 [ERROR] GitHub APIエラーレスポンス - JSON解析中...');
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch (parseError) {
                    console.log('🔴 [ERROR] エラーレスポンスのJSON解析失敗:', parseError);
                }
                console.error('🔴 [ERROR] GitHub API エラー詳細:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData: errorData
                });
                throw new Error(`GitHub API エラー: ${response.status} - ${errorData.message || response.statusText}`);
            }
        } catch (error) {
            console.error('🔴 [ERROR] getCurrentFileSha() エラー:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            console.log('🔑 [SHA] =====================================');
            throw error;
        }
    }

    async updatePromptsFile(promptsData) {
        console.log('🟪 [DEBUG] updatePromptsFile() 開始');
        try {
            console.log('🟪 [DEBUG] トークン確認:', !!this.token);
            if (!this.token) {
                console.log('🟪 [DEBUG] トークン未設定、initialize() 実行...');
                await this.initialize();
                console.log('🟪 [DEBUG] initialize() 完了、トークン:', !!this.token);
            }

            console.log('🟪 [DEBUG] getCurrentFileSha() 実行...');
            const sha = await this.getCurrentFileSha();
            console.log('🟪 [DEBUG] getCurrentFileSha() 完了、SHA:', sha || 'なし');

            console.log('🟪 [DEBUG] JSON変換とUTF-8対応Base64エンコード...');
            const jsonString = JSON.stringify(promptsData, null, 2);
            console.log('🟪 [DEBUG] JSON文字列長:', jsonString.length);

            // UTF-8文字（日本語）対応のBase64エンコード
            // 通常のbtoa()は Latin1 文字のみ対応のため、日本語でエラーが発生
            // encodeURIComponent + unescape + btoa でUTF-8文字を正しく処理
            console.log('🟪 [DEBUG] UTF-8エンコーディング実行中...');
            let content;
            try {
                content = btoa(unescape(encodeURIComponent(jsonString)));
                console.log('🟢 [SUCCESS] UTF-8対応Base64エンコード完了、長さ:', content.length);
            } catch (encodeError) {
                console.error('🔴 [ERROR] Base64エンコードエラー:', encodeError);
                throw new Error(`文字エンコードエラー: ${encodeError.message}`);
            }

            const requestBody = {
                message: '🤖 Auto-save: プロンプトデータ更新',
                content: content,
                branch: this.branch
            };

            if (sha) {
                requestBody.sha = sha;
                console.log('🟪 [DEBUG] SHA をリクエストに追加');
            } else {
                console.log('🟪 [DEBUG] 新規ファイル作成（SHA なし）');
            }

            console.log('🟪 [DEBUG] リクエストボディ準備完了:', {
                message: requestBody.message,
                branch: requestBody.branch,
                hasSha: !!requestBody.sha,
                contentLength: requestBody.content.length
            });

            console.log('🟪 [DEBUG] GitHub API リクエスト実行中...');
            console.log('🟪 [DEBUG] URL:', `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${this.filePath}`);

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

            console.log('🟪 [DEBUG] GitHub API レスポンス受信、ステータス:', response.status);

            if (response.ok) {
                console.log('🟪 [DEBUG] レスポンス成功、JSON解析中...');
                const result = await response.json();
                console.log('🟢 [SUCCESS] GitHub API 保存成功:', result.commit.sha);
                console.log('🟢 [SUCCESS] コミット情報:', {
                    sha: result.commit.sha,
                    message: result.commit.message,
                    author: result.commit.author.name
                });
                return { success: true, sha: result.commit.sha };
            } else {
                console.log('🔴 [ERROR] GitHub API エラーレスポンス、JSON解析中...');
                const error = await response.json();
                console.error('🔴 [ERROR] GitHub API エラー詳細:', error);
                throw new Error(`GitHub API エラー: ${error.message}`);
            }

        } catch (error) {
            console.error('❌ GitHub API 保存エラー:', error);
            throw error;
        }
    }

    // Debounce処理付きの自動保存
    async autoSave(promptsData) {
        console.log('🟨 [DEBUG] GitHubConnector.autoSave() 開始');
        console.log('🟨 [DEBUG] データ:', { promptsCount: promptsData.prompts?.length || 0 });

        // 連続編集時のAPI呼び出し最小化
        clearTimeout(this.debounceTimer);
        console.log('🟨 [DEBUG] デバウンスタイマーリセット完了');

        console.log('🟨 [DEBUG] 1秒後に保存処理を実行予定...');
        this.debounceTimer = setTimeout(async () => {
            console.log('🟨 [DEBUG] デバウンス期間終了、実際の保存処理開始');
            try {
                console.log('🟨 [DEBUG] updatePromptsFile() 実行中...');
                await this.updatePromptsFile(promptsData);
                console.log('🟢 [SUCCESS] updatePromptsFile() 完了');

                showNotification('✅ 自動保存完了', 'success');
                githubSettings.lastSyncTime = new Date().toISOString();
                console.log('🟢 [SUCCESS] lastSyncTime 更新:', githubSettings.lastSyncTime);
            } catch (error) {
                console.error('🔴 [ERROR] 自動保存エラー:', error);
                console.error('🔴 [ERROR] エラー詳細:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
                showNotification(`⚠️ 自動保存失敗: ${error.message}`, 'error');
            }
        }, 1000); // 1秒間編集なしで保存実行

        console.log('🟨 [DEBUG] デバウンスタイマー設定完了');
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
    console.log('🟡 [DEBUG] autoSaveToGitHub 開始');
    console.log('🟡 [DEBUG] githubConnector 存在確認:', !!githubConnector);

    if (githubConnector) {
        console.log('🟡 [DEBUG] GitHubConnector準備完了、プロンプト数:', prompts.length);
        try {
            const data = {
                prompts: prompts
            };
            console.log('🟡 [DEBUG] githubConnector.autoSave() 実行開始...');
            await githubConnector.autoSave(data);
            console.log('🟢 [SUCCESS] GitHub自動保存完了');
        } catch (error) {
            console.error('🔴 [ERROR] GitHub自動保存失敗:', error.message);
            console.error('🔴 [ERROR] 詳細エラー:', error);
            console.warn('自動保存をスキップ:', error.message);
        }
    } else {
        console.warn('🟠 [WARNING] githubConnector が初期化されていません');
    }
}


// ==========================================================================
// 自動保存機能統合（既存関数の修正）
// ==========================================================================

// addPrompt関数を修正してGitHub自動保存を追加
async function addPromptWithAutoSave(data) {
    console.log('🔵 [DEBUG] addPromptWithAutoSave 開始 - データ:', data.title);
    try {
        console.log('🔵 [DEBUG] addPrompt 実行中...');
        const result = await addPrompt(data);
        console.log('🔵 [DEBUG] addPrompt 完了 - ID:', result?.id || 'unknown');

        console.log('🔵 [DEBUG] autoSaveToGitHub 実行開始...');
        await autoSaveToGitHub();
        console.log('🔵 [DEBUG] autoSaveToGitHub 完了');

        return result;
    } catch (error) {
        console.error('🔴 [ERROR] プロンプト追加エラー:', error);
        throw error;
    }
}

// updatePrompt関数を修正してGitHub自動保存を追加
async function updatePromptWithAutoSave(id, data) {
    console.log('🔵 [DEBUG] updatePromptWithAutoSave 開始 - ID:', id, 'データ:', data.title);
    try {
        console.log('🔵 [DEBUG] updatePrompt 実行中...');
        const result = await updatePrompt(id, data);
        console.log('🔵 [DEBUG] updatePrompt 完了');

        console.log('🔵 [DEBUG] autoSaveToGitHub 実行開始...');
        await autoSaveToGitHub();
        console.log('🔵 [DEBUG] autoSaveToGitHub 完了');

        return result;
    } catch (error) {
        console.error('🔴 [ERROR] プロンプト更新エラー:', error);
        throw error;
    }
}

// deletePrompt関数を修正してGitHub自動保存を追加
async function deletePromptWithAutoSave(id) {
    console.log('🔵 [DEBUG] deletePromptWithAutoSave 開始 - ID:', id);
    try {
        console.log('🔵 [DEBUG] deletePrompt 実行中...');
        const result = await deletePrompt(id);
        console.log('🔵 [DEBUG] deletePrompt 完了');

        console.log('🔵 [DEBUG] autoSaveToGitHub 実行開始...');
        await autoSaveToGitHub();
        console.log('🔵 [DEBUG] autoSaveToGitHub 完了');

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
