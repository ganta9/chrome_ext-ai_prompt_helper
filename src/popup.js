/**
 * AI Prompt Helper v6.1.0 - Popup Script
 * ローカルファースト・ゼロ設定 プロンプト管理システム
 */

// ==========================================================================
// グローバル変数とデフォルトデータ
// ==========================================================================

let currentPrompts = [];
let isEditing = false;
let editingIndex = -1;

// デフォルトプロンプトデータ
const DEFAULT_PROMPTS = [
    {
        id: 'default_1',
        title: '文章校正',
        prompt: '次の文章を校正してください：\n\n[ここに文章を貼り付けてください]',
        memo: '基本的な文章校正用プロンプト',
        tags: '校正,文章,基本'
    },
    {
        id: 'default_2',
        title: '要約作成',
        prompt: '以下の内容を300文字程度で要約してください：\n\n[ここに内容を貼り付けてください]',
        memo: '長文の要約用プロンプト',
        tags: '要約,文章,効率'
    },
    {
        id: 'default_3',
        title: 'コードレビュー',
        prompt: '以下のコードをレビューし、改善点があれば教えてください：\n\n```\n[ここにコードを貼り付けてください]\n```',
        memo: 'プログラムのコードレビュー用',
        tags: 'コード,レビュー,プログラミング'
    },
    {
        id: 'default_4',
        title: '翻訳（日→英）',
        prompt: '次の日本語を自然な英語に翻訳してください：\n\n[ここに日本語を貼り付けてください]',
        memo: '日本語から英語への翻訳',
        tags: '翻訳,日英,言語'
    },
    {
        id: 'default_5',
        title: 'アイデア出し',
        prompt: '以下のテーマについて、創造的なアイデアを10個提案してください：\n\n[ここにテーマを記入してください]',
        memo: 'ブレインストーミング用プロンプト',
        tags: 'アイデア,創造,ブレスト'
    }
];

// ==========================================================================
// 初期化
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('AI Prompt Helper v6.1.0 初期化開始');

    try {
        await initializeData();
        setupEventListeners();
        updatePromptList();
        console.log('Popup初期化完了');
    } catch (error) {
        console.error('初期化エラー:', error);
        showStatus('初期化に失敗しました', 'error');
    }
});

async function initializeData() {
    try {
        const result = await chrome.storage.local.get(['prompts']);

        if (!result.prompts || result.prompts.length === 0) {
            // デフォルトプロンプトをロード
            currentPrompts = [...DEFAULT_PROMPTS];
            await chrome.storage.local.set({ prompts: currentPrompts });
            console.log('デフォルトプロンプトを初期化しました');
        } else {
            currentPrompts = result.prompts;
            console.log(`${currentPrompts.length}件のプロンプトを読み込みました`);
        }
    } catch (error) {
        console.error('データ初期化エラー:', error);
        currentPrompts = [...DEFAULT_PROMPTS];
    }
}

// ==========================================================================
// イベントリスナー設定
// ==========================================================================

function setupEventListeners() {
    // 新規追加ボタン
    document.getElementById('add-prompt-btn').addEventListener('click', () => {
        showEditor();
    });

    // 検索フィルター
    document.getElementById('search-input').addEventListener('input', handleSearch);

    // エディター関連
    document.getElementById('save-btn').addEventListener('click', savePrompt);
    document.getElementById('cancel-btn').addEventListener('click', hideEditor);
    document.getElementById('delete-btn').addEventListener('click', deletePrompt);

    // 全削除（デバッグ用）
    document.getElementById('reset-btn').addEventListener('click', resetAllPrompts);

    // Escキーでエディターを閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isEditing) {
            hideEditor();
        }
    });
}

// ==========================================================================
// プロンプト表示・管理
// ==========================================================================

function updatePromptList(searchTerm = '') {
    const listContainer = document.getElementById('prompt-list');
    const filteredPrompts = searchTerm ?
        currentPrompts.filter(p =>
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.tags.toLowerCase().includes(searchTerm.toLowerCase())
        ) : currentPrompts;

    if (filteredPrompts.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <p>プロンプトがありません</p>
                <button onclick="showEditor()" class="btn btn-primary">最初のプロンプトを作成</button>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = filteredPrompts.map((prompt, index) => `
        <div class="prompt-item" data-index="${currentPrompts.indexOf(prompt)}">
            <div class="prompt-header">
                <h3 class="prompt-title">${escapeHtml(prompt.title)}</h3>
                <div class="prompt-actions">
                    <button class="btn btn-sm" onclick="usePrompt(${currentPrompts.indexOf(prompt)})" title="使用">
                        📋
                    </button>
                    <button class="btn btn-sm" onclick="editPrompt(${currentPrompts.indexOf(prompt)})" title="編集">
                        ✏️
                    </button>
                </div>
            </div>
            <div class="prompt-preview">${escapeHtml(prompt.prompt.substring(0, 100))}${prompt.prompt.length > 100 ? '...' : ''}</div>
            <div class="prompt-tags">${prompt.tags.split(',').map(tag => `<span class="tag">${escapeHtml(tag.trim())}</span>`).join('')}</div>
        </div>
    `).join('');

    // 統計情報更新
    document.getElementById('prompt-count').textContent = `${currentPrompts.length}件のプロンプト`;
}

function handleSearch(e) {
    updatePromptList(e.target.value);
}

// ==========================================================================
// プロンプト使用（AIサイトに送信）
// ==========================================================================

async function usePrompt(index) {
    const prompt = currentPrompts[index];
    if (!prompt) return;

    try {
        // アクティブタブにプロンプトを送信
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        chrome.tabs.sendMessage(tab.id, {
            action: 'insertPrompt',
            data: {
                title: prompt.title,
                prompt: prompt.prompt
            }
        }, (response) => {
            if (chrome.runtime.lastError) {
                showStatus('プロンプトの挿入に失敗しました', 'error');
                console.error('送信エラー:', chrome.runtime.lastError);
            } else if (response && response.success) {
                showStatus('プロンプトを挿入しました', 'success');
                window.close();
            } else {
                showStatus('対応サイトではありません', 'warning');
            }
        });
    } catch (error) {
        console.error('プロンプト使用エラー:', error);
        showStatus('エラーが発生しました', 'error');
    }
}

// ==========================================================================
// プロンプト編集機能
// ==========================================================================

function showEditor(index = -1) {
    isEditing = true;
    editingIndex = index;

    const isNew = index === -1;
    const prompt = isNew ? { title: '', prompt: '', memo: '', tags: '' } : currentPrompts[index];

    // フォームにデータを入力
    document.getElementById('title-input').value = prompt.title;
    document.getElementById('prompt-input').value = prompt.prompt;
    document.getElementById('memo-input').value = prompt.memo;
    document.getElementById('tags-input').value = prompt.tags;

    // UI表示切り替え
    document.getElementById('main-view').style.display = 'none';
    document.getElementById('editor-view').style.display = 'block';
    document.getElementById('delete-btn').style.display = isNew ? 'none' : 'inline-block';

    // タイトル入力にフォーカス
    document.getElementById('title-input').focus();
}

function hideEditor() {
    isEditing = false;
    editingIndex = -1;

    // フォームクリア
    document.getElementById('title-input').value = '';
    document.getElementById('prompt-input').value = '';
    document.getElementById('memo-input').value = '';
    document.getElementById('tags-input').value = '';

    // UI表示切り替え
    document.getElementById('editor-view').style.display = 'none';
    document.getElementById('main-view').style.display = 'block';
}

function editPrompt(index) {
    showEditor(index);
}

async function savePrompt() {
    const title = document.getElementById('title-input').value.trim();
    const prompt = document.getElementById('prompt-input').value.trim();
    const memo = document.getElementById('memo-input').value.trim();
    const tags = document.getElementById('tags-input').value.trim();

    if (!title || !prompt) {
        showStatus('タイトルとプロンプトは必須です', 'error');
        return;
    }

    try {
        const promptData = {
            id: editingIndex === -1 ? 'user_' + Date.now() : currentPrompts[editingIndex].id,
            title,
            prompt,
            memo,
            tags,
            created_at: editingIndex === -1 ? new Date().toISOString() : currentPrompts[editingIndex].created_at,
            updated_at: new Date().toISOString()
        };

        if (editingIndex === -1) {
            // 新規追加
            currentPrompts.push(promptData);
        } else {
            // 更新
            currentPrompts[editingIndex] = promptData;
        }

        await chrome.storage.local.set({ prompts: currentPrompts });

        hideEditor();
        updatePromptList();
        showStatus('プロンプトを保存しました', 'success');

    } catch (error) {
        console.error('保存エラー:', error);
        showStatus('保存に失敗しました', 'error');
    }
}

async function deletePrompt() {
    if (editingIndex === -1 || !confirm('このプロンプトを削除しますか？')) {
        return;
    }

    try {
        currentPrompts.splice(editingIndex, 1);
        await chrome.storage.local.set({ prompts: currentPrompts });

        hideEditor();
        updatePromptList();
        showStatus('プロンプトを削除しました', 'success');

    } catch (error) {
        console.error('削除エラー:', error);
        showStatus('削除に失敗しました', 'error');
    }
}

// ==========================================================================
// デバッグ・リセット機能
// ==========================================================================

async function resetAllPrompts() {
    if (!confirm('全てのプロンプトを削除し、デフォルトに戻しますか？')) {
        return;
    }

    try {
        currentPrompts = [...DEFAULT_PROMPTS];
        await chrome.storage.local.set({ prompts: currentPrompts });

        updatePromptList();
        showStatus('デフォルトプロンプトに戻しました', 'success');

    } catch (error) {
        console.error('リセットエラー:', error);
        showStatus('リセットに失敗しました', 'error');
    }
}

// ==========================================================================
// ユーティリティ関数
// ==========================================================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showStatus(message, type = 'info') {
    // 既存のステータス要素があれば削除
    const existingStatus = document.querySelector('.status-message');
    if (existingStatus) {
        existingStatus.remove();
    }

    // 新しいステータスメッセージを作成
    const statusElement = document.createElement('div');
    statusElement.className = `status-message ${type}`;
    statusElement.textContent = message;

    // ボディの先頭に挿入
    document.body.insertBefore(statusElement, document.body.firstChild);

    // 3秒後に削除
    setTimeout(() => {
        if (statusElement.parentNode) {
            statusElement.remove();
        }
    }, 3000);
}

// ==========================================================================
// エラーハンドリング
// ==========================================================================

window.addEventListener('error', (event) => {
    console.error('Popup Error:', event.error);
    showStatus('予期しないエラーが発生しました', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    showStatus('予期しないエラーが発生しました', 'error');
});

console.log('AI Prompt Helper v6.1.0 Popup Script loaded - ローカルファースト版');