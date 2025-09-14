/**
 * AI Prompt Helper - Viewer v6.0.0
 * GitHub Pages 閲覧専用サイト スクリプト
 */

// ==========================================================================
// グローバル変数
// ==========================================================================

let allPrompts = [];
let allTags = new Set();
let currentFilter = 'all';
let searchQuery = '';

// ==========================================================================
// 初期化
// ==========================================================================

document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    console.log('AI Prompt Helper Viewer v6.0.0 初期化開始');
    showLoading(true);
    try {
        const response = await fetch('prompts.json');
        if (!response.ok) {
            throw new Error(`prompts.jsonの読み込みに失敗しました: ${response.statusText}`);
        }
        const data = await response.json();
        allPrompts = data.prompts || [];
        
        updateAllTags();
        setupEventListeners();
        renderUI();
        console.log('初期化完了:', allPrompts.length, '個のプロンプトを読み込み');
    } catch (error) {
        console.error('初期化エラー:', error);
        showNotification(error.message, 'error');
        document.getElementById('empty-state').style.display = 'block';
    } finally {
        showLoading(false);
    }
}

// ==========================================================================
// イベントリスナー設定
// ==========================================================================

function setupEventListeners() {
    document.getElementById('search-input').addEventListener('input', handleSearch);
    document.getElementById('clear-filter-btn').addEventListener('click', clearFilter);
    document.getElementById('sort-select').addEventListener('change', renderUI);
    document.getElementById('detail-close').addEventListener('click', closeDetailModal);
    document.getElementById('detail-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeDetailModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDetailModal();
    });
}

// ==========================================================================
// UI描画
// ==========================================================================

function renderUI() {
    renderTagList();
    renderPrompts();
    updateCounts();
}

function renderTagList() {
    const tagList = document.getElementById('tag-list');
    const tagCounts = {};
    allPrompts.forEach(p => {
        p.tags?.forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
    });

    tagList.innerHTML = `
        <div class="tag-item ${currentFilter === 'all' ? 'active' : ''}" data-tag="all">
            <span class="tag-name">すべて</span>
            <span class="tag-count">${allPrompts.length}</span>
        </div>
        ${Array.from(allTags).sort().map(tag => `
            <div class="tag-item ${currentFilter === tag ? 'active' : ''}" data-tag="${escapeHtml(tag)}">
                <span class="tag-name">${escapeHtml(tag)}</span>
                <span class="tag-count">${tagCounts[tag] || 0}</span>
            </div>
        `).join('')}
    `;

    document.querySelectorAll('.tag-item').forEach(item => {
        item.addEventListener('click', () => filterByTag(item.dataset.tag));
    });
}

function renderPrompts() {
    const grid = document.getElementById('prompt-grid');
    const emptyState = document.getElementById('empty-state');

    const filtered = getFilteredAndSortedPrompts();

    if (filtered.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    grid.innerHTML = filtered.map(prompt => `
        <div class="prompt-card" data-id="${prompt.id}">
            <div class="prompt-card-header">
                <h3 class="prompt-title">${escapeHtml(prompt.title)}</h3>
            </div>
            <div class="prompt-preview">${escapeHtml(truncateText(prompt.prompt, 150))}</div>
            ${prompt.memo ? `<div class="prompt-memo">💭 ${escapeHtml(truncateText(prompt.memo, 100))}</div>` : ''}
            ${prompt.tags && prompt.tags.length > 0 ? `
                <div class="prompt-tags">
                    ${prompt.tags.map(tag => `<span class="tag-badge">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            <div class="prompt-footer">
                <span>更新: ${formatDate(prompt.updated_at)}</span>
                <button class="btn btn-primary" onclick="showDetailModal('${prompt.id}')">選択</button>
            </div>
        </div>
    `).join('');
}

function updateCounts() {
    const filteredCount = getFilteredAndSortedPrompts().length;
    document.getElementById('prompt-count').textContent = `${filteredCount}個のプロンプト`;
    document.getElementById('content-title').textContent = currentFilter === 'all' ? 'すべてのプロンプト' : `タグ: ${currentFilter}`;
}

function updateAllTags() {
    allTags.clear();
    allPrompts.forEach(p => p.tags?.forEach(tag => allTags.add(tag)));
}

// ==========================================================================
// イベントハンドラー
// ==========================================================================

function handleSearch(e) {
    searchQuery = e.target.value.trim().toLowerCase();
    renderPrompts();
    updateCounts();
}

function filterByTag(tag) {
    currentFilter = tag;
    renderUI();
}

function clearFilter() {
    currentFilter = 'all';
    searchQuery = '';
    document.getElementById('search-input').value = '';
    renderUI();
}

// ==========================================================================
// モーダル操作
// ==========================================================================

function showDetailModal(id) {
    const prompt = allPrompts.find(p => p.id === id);
    if (!prompt) return;

    document.getElementById('detail-title').textContent = prompt.title;
    document.getElementById('detail-prompt').textContent = prompt.prompt;
    document.getElementById('detail-memo').textContent = prompt.memo || 'なし';
    document.getElementById('detail-tags').innerHTML = prompt.tags?.map(tag => `<span class="tag-badge">${escapeHtml(tag)}</span>`).join('') || 'なし';

    const selectBtn = document.getElementById('detail-select-btn');
    const newSelectBtn = selectBtn.cloneNode(true);
    selectBtn.parentNode.replaceChild(newSelectBtn, selectBtn);
    newSelectBtn.addEventListener('click', () => selectPrompt(id));

    document.getElementById('detail-modal').style.display = 'flex';
}

function closeDetailModal() {
    document.getElementById('detail-modal').style.display = 'none';
}

// ==========================================================================
// Chrome拡張機能連携
// ==========================================================================

function selectPrompt(id) {
    const prompt = allPrompts.find(p => p.id === id);
    if (!prompt) {
        showNotification('プロンプトが見つかりません', 'error');
        return;
    }

    const message = {
        type: 'PROMPT_SELECTED',
        prompt: prompt.prompt
    };

    // 親ウィンドウ（拡張機能のcontent script）にメッセージを送信
    if (window.opener) {
        window.opener.postMessage(message, '*');
    } else {
        // openerがいない場合（直接開いた場合など）はクリップボードにコピー
        navigator.clipboard.writeText(prompt.prompt).then(() => {
            showNotification('プロンプトをクリップボードにコピーしました', 'success');
        }).catch(() => {
            showNotification('クリップボードへのコピーに失敗しました', 'error');
        });
        return; // ウィンドウを閉じない
    }

    // 0.5秒後にウィンドウを閉じる
    setTimeout(() => window.close(), 500);
}

// ==========================================================================
// ユーティリティ関数
// ==========================================================================

function getFilteredAndSortedPrompts() {
    let filtered = allPrompts;

    if (currentFilter !== 'all') {
        filtered = filtered.filter(p => p.tags?.includes(currentFilter));
    }

    if (searchQuery) {
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(searchQuery) ||
            p.prompt.toLowerCase().includes(searchQuery) ||
            p.memo?.toLowerCase().includes(searchQuery)
        );
    }

    const sortBy = document.getElementById('sort-select').value;
    return filtered.sort((a, b) => {
        switch (sortBy) {
            case 'title': return a.title.localeCompare(b.title);
            case 'updated': return new Date(b.updated_at) - new Date(a.updated_at);
            default: return 0; // JSONの順序を維持
        }
    });
}

function showNotification(message, type = 'success') {
    const el = document.getElementById('notification');
    el.textContent = message;
    el.className = `notification ${type}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return text.toString().replace(/[&<>'"/]/g, s => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;'})[s]);
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatDate(dateString) {
    if (!dateString) return '不明';
    try {
        return new Date(dateString).toLocaleDateString('ja-JP');
    } catch (e) {
        return '無効な日付';
    }
}
