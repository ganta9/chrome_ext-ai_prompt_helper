/**
 * AI Prompt Helper v6.0.0 - Popup Script
 * 設定画面のJavaScript
 */

// ==========================================================================
// 初期化
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('AI Prompt Helper Popup v6.0.0 初期化開始');
    await loadSettings();
    setupEventListeners();
    console.log('Popup初期化完了');
});

// ==========================================================================
// イベントリスナー設定
// ==========================================================================

function setupEventListeners() {
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    document.getElementById('test-connection').addEventListener('click', testConnection);
    document.getElementById('open-editor').addEventListener('click', openEditor);
}

// ==========================================================================
// 設定管理
// ==========================================================================

async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get(['githubPagesUrl']);
        const urlInput = document.getElementById('github-pages-url');
        urlInput.value = result.githubPagesUrl || 'https://ganta9.github.io/chrome_ext-ai_prompt_helper/';
    } catch (error) {
        console.error('設定読み込みエラー:', error);
        showStatus('設定の読み込みに失敗しました', 'error');
    }
}

async function saveSettings() {
    const url = document.getElementById('github-pages-url').value.trim();
    if (!isValidUrl(url)) {
        showStatus('有効なURLを入力してください', 'error');
        return;
    }

    try {
        await chrome.storage.sync.set({ githubPagesUrl: url });
        showStatus('設定を保存しました', 'success');
    } catch (error) {
        console.error('設定保存エラー:', error);
        showStatus('設定の保存に失敗しました', 'error');
    }
}

// ==========================================================================
// 接続テスト
// ==========================================================================

async function testConnection() {
    const url = document.getElementById('github-pages-url').value.trim();
    if (!isValidUrl(url)) {
        showStatus('有効なURLを入力してください', 'error');
        return;
    }

    // URLの末尾が'/'で終わっていることを確認
    const baseUrl = url.endsWith('/') ? url : url + '/';
    const promptsUrl = baseUrl + 'prompts.json';

    showStatus('接続をテスト中...', 'warning');

    try {
        const response = await fetch(promptsUrl, { cache: 'no-cache' });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const promptCount = data.prompts?.length || 0;

        showStatus(`接続成功: ${promptCount}個のプロンプトが見つかりました`, 'success');

    } catch (error) {
        console.error('接続テストエラー:', error);
        let errorMessage = 'prompts.jsonへの接続に失敗しました。';
        if (error.message.includes('404')) {
            errorMessage += ' URLが正しいか、ファイルが存在するか確認してください。';
        }
        showStatus(errorMessage, 'error');
    }
}

// ==========================================================================
// クイックアクション
// ==========================================================================

async function openEditor() {
    try {
        const result = await chrome.storage.sync.get(['githubPagesUrl']);
        const url = result.githubPagesUrl || document.getElementById('github-pages-url').value.trim();
        if (!url) {
            showStatus('GitHub Pages URLを設定してください', 'error');
            return;
        }
        await chrome.tabs.create({ url });
        window.close();
    } catch (error) {
        console.error('閲覧サイト起動エラー:', error);
        showStatus('閲覧サイトを開けませんでした', 'error');
    }
}

// ==========================================================================
// UI制御
// ==========================================================================

function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('settings-status');
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    statusElement.style.display = 'block';

    if (type !== 'error' && type !== 'warning') {
        setTimeout(() => {
            if (statusElement.textContent === message) {
                statusElement.style.display = 'none';
            }
        }, 3000);
    }
}

// ==========================================================================
// ユーティリティ関数
// ==========================================================================

function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}
