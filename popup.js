/**
 * AI Prompt Helper v6.0.0 - Popup Script
 * シンプル設定画面のJavaScript
 */

// ==========================================================================
// グローバル変数
// ==========================================================================

let isLoading = false;

// ==========================================================================
// 初期化
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('AI Prompt Helper Popup v6.0.0 初期化開始');
    
    try {
        await initializePopup();
        setupEventListeners();
        console.log('Popup初期化完了');
    } catch (error) {
        console.error('Popup初期化エラー:', error);
        showStatus('初期化に失敗しました', 'error');
    }
});

async function initializePopup() {
    // 保存されている設定を読み込み
    await loadSettings();
}

// ==========================================================================
// イベントリスナー設定
// ==========================================================================

function setupEventListeners() {
    // 設定保存ボタン
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    
    // 接続テストボタン
    document.getElementById('test-connection').addEventListener('click', testConnection);
    
    // 編集サイトを開くボタン
    document.getElementById('open-editor').addEventListener('click', openEditor);
    
    // プロンプトデータ更新ボタン
    document.getElementById('manual-update').addEventListener('click', manualUpdate);
    
    // URLバリデーション
    document.getElementById('github-pages-url').addEventListener('input', validateUrl);
    
    // Enterキーで保存
    ['github-pages-url', 'spreadsheet-id', 'gas-url'].forEach(id => {
        document.getElementById(id).addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveSettings();
            }
        });
    });
}

// ==========================================================================
// 設定の読み込みと保存
// ==========================================================================

async function loadSettings() {
    console.log('設定読み込み開始');
    
    try {
        const result = await chrome.storage.sync.get([
            'github-pages-url',
            'spreadsheet-id',
            'gas-url'
        ]);

        // GitHub Pages URL
        const githubPagesUrl = result['github-pages-url'] || 'https://ganta9.github.io/chrome_ext-ai_prompt_helper/';
        document.getElementById('github-pages-url').value = githubPagesUrl;

        // Google Sheets設定
        document.getElementById('spreadsheet-id').value = result['spreadsheet-id'] || '';
        document.getElementById('gas-url').value = result['gas-url'] || 'https://script.google.com/macros/s/AKfycbwIAoo9vuoqXdx6dNndFKMJqRZTGbDGF3r/exec';

        // プロンプトキャッシュ状態を表示
        updatePromptCacheStatus();

        console.log('設定読み込み完了:', result);
    } catch (error) {
        console.error('設定読み込みエラー:', error);
        showStatus('設定の読み込みに失敗しました', 'error');
    }
}

async function saveSettings() {
    if (isLoading) return;
    
    console.log('設定保存開始');
    setLoading(true);
    
    try {
        // 入力値を取得
        const githubPagesUrl = document.getElementById('github-pages-url').value.trim();
        const spreadsheetId = document.getElementById('spreadsheet-id').value.trim();
        const gasUrl = document.getElementById('gas-url').value.trim();

        // バリデーション
        if (!githubPagesUrl) {
            throw new Error('GitHub Pages URLを入力してください');
        }

        if (!isValidUrl(githubPagesUrl)) {
            throw new Error('有効なGitHub Pages URLを入力してください');
        }

        // 設定を保存
        const settings = {
            'github-pages-url': githubPagesUrl,
            'spreadsheet-id': spreadsheetId,
            'gas-url': gasUrl || 'https://script.google.com/macros/s/AKfycbwIAoo9vuoqXdx6dNndFKMJqRZTGbDGF3r/exec',
            lastUpdated: Date.now()
        };

        await chrome.storage.sync.set(settings);
        
        console.log('設定保存完了:', settings);
        showStatus('設定を保存しました', 'success');
        
    } catch (error) {
        console.error('設定保存エラー:', error);
        showStatus(error.message || '設定の保存に失敗しました', 'error');
    } finally {
        setLoading(false);
    }
}

// ==========================================================================
// 接続テスト
// ==========================================================================

async function testConnection() {
    if (isLoading) return;
    
    console.log('接続テスト開始');
    setLoading(true);
    
    try {
        const githubPagesUrl = document.getElementById('github-pages-url').value.trim();
        const gasUrl = document.getElementById('gas-url').value.trim();
        
        if (!githubPagesUrl) {
            throw new Error('GitHub Pages URLを入力してください');
        }

        // GitHub Pagesの接続テスト
        showStatus('GitHub Pagesへの接続をテスト中...', 'warning');
        
        const githubResponse = await fetch(githubPagesUrl, {
            method: 'GET',
            mode: 'no-cors'
        });
        
        console.log('GitHub Pages接続テスト完了');

        // Google Apps Scriptの接続テスト (URLが設定されている場合)
        if (gasUrl) {
            showStatus('Google Apps Scriptへの接続をテスト中...', 'warning');
            
            const gasResponse = await fetch(gasUrl, {
                method: 'GET',
                mode: 'no-cors'
            });
            
            console.log('Google Apps Script接続テスト完了');
        }

        showStatus('接続テストが完了しました', 'success');
        
    } catch (error) {
        console.error('接続テストエラー:', error);
        showStatus('接続テストに失敗しました', 'error');
    } finally {
        setLoading(false);
    }
}

// ==========================================================================
// 編集サイトを開く
// ==========================================================================

async function openEditor() {
    try {
        const result = await chrome.storage.sync.get(['github-pages-url']);
        const url = result['github-pages-url'] || 'https://ganta9.github.io/chrome_ext-ai_prompt_helper/';
        
        chrome.tabs.create({ url });
        window.close();
    } catch (error) {
        console.error('サイト開放エラー:', error);
        showStatus('サイトを開けませんでした', 'error');
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

function validateUrl() {
    const urlInput = document.getElementById('github-pages-url');
    const url = urlInput.value.trim();
    
    if (url && !isValidUrl(url)) {
        urlInput.style.borderColor = 'var(--danger)';
    } else {
        urlInput.style.borderColor = 'var(--border)';
    }
}

function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('settings-status');
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    statusElement.style.display = 'block';
    
    // 3秒後に非表示
    setTimeout(() => {
        statusElement.style.display = 'none';
    }, 3000);
}

function setLoading(loading) {
    isLoading = loading;
    const buttons = document.querySelectorAll('button');
    const inputs = document.querySelectorAll('input');
    
    buttons.forEach(btn => {
        btn.disabled = loading;
        if (loading) {
            btn.classList.add('loading');
        } else {
            btn.classList.remove('loading');
        }
    });
    
    inputs.forEach(input => {
        input.disabled = loading;
    });
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

// ==========================================================================
// 新規追加機能
// ==========================================================================

async function updatePromptCacheStatus() {
    try {
        const result = await chrome.storage.local.get(['promptsCache', 'lastSyncTime']);
        const statusElement = document.getElementById('prompt-cache-status');

        if (result.promptsCache && result.promptsCache.length > 0) {
            const count = result.promptsCache.length;
            const lastSync = result.lastSyncTime ? new Date(result.lastSyncTime).toLocaleString() : '未同期';
            statusElement.textContent = `${count}件のプロンプト | 最終更新: ${lastSync}`;
            statusElement.className = 'status success';
        } else {
            statusElement.textContent = 'プロンプトデータなし';
            statusElement.className = 'status warning';
        }
    } catch (error) {
        console.error('プロンプトキャッシュ状態更新エラー:', error);
        const statusElement = document.getElementById('prompt-cache-status');
        statusElement.textContent = 'エラー';
        statusElement.className = 'status error';
    }
}

// JSONP形式でGoogle Apps Script APIを呼び出す
function callGoogleAppsScript(scriptUrl, params) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('APIリクエストがタイムアウトしました'));
        }, 30000); // 30秒タイムアウト

        const callbackName = 'jsonpCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

        window[callbackName] = function(data) {
            clearTimeout(timeoutId);
            delete window[callbackName];
            document.head.removeChild(script);

            try {
                const result = typeof data === 'string' ? JSON.parse(data) : data;
                resolve(result);
            } catch (error) {
                reject(new Error('レスポンスの解析に失敗しました: ' + error.message));
            }
        };

        const queryParams = new URLSearchParams({
            ...params,
            callback: callbackName
        });

        const script = document.createElement('script');
        script.src = `${scriptUrl}?${queryParams.toString()}`;
        script.onerror = () => {
            clearTimeout(timeoutId);
            delete window[callbackName];
            document.head.removeChild(script);
            reject(new Error('Google Apps Scriptの呼び出しに失敗しました'));
        };

        document.head.appendChild(script);
    });
}

async function manualUpdate() {
    if (isLoading) return;

    console.log('手動プロンプト更新開始');
    setLoading(true);

    try {
        showStatus('プロンプトデータを更新中...', 'warning');

        // 設定からGAS URLを取得
        const settings = await chrome.storage.sync.get(['gas-url']);
        const gasUrl = settings['gas-url'];

        if (!gasUrl) {
            throw new Error('Google Apps Script URLが設定されていません');
        }

        // Google Apps Script APIを呼び出してプロンプトデータを取得
        const response = await callGoogleAppsScript(gasUrl, { action: 'getPrompts' });

        if (response.success && response.data) {
            // ローカルストレージにキャッシュ
            await chrome.storage.local.set({
                promptsCache: response.data,
                lastSyncTime: Date.now()
            });

            console.log('手動更新完了:', response.data.length + '件');
            showStatus(`${response.data.length}件のプロンプトを更新しました`, 'success');
            updatePromptCacheStatus();
        } else {
            throw new Error(response.error || 'データ取得に失敗しました');
        }

    } catch (error) {
        console.error('手動更新エラー:', error);
        showStatus('プロンプト更新に失敗しました: ' + error.message, 'error');
    } finally {
        setLoading(false);
    }
}

console.log('AI Prompt Helper Popup Script v6.0.0 loaded');