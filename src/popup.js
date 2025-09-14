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
            'githubPagesUrl',
            'spreadsheetId',
            'gasUrl'
        ]);

        // GitHub Pages URL
        const githubPagesUrl = result.githubPagesUrl || 'https://ganta9.github.io/chrome_ext-ai_prompt_helper/';
        document.getElementById('github-pages-url').value = githubPagesUrl;

        // Google Sheets設定
        document.getElementById('spreadsheet-id').value = result.spreadsheetId || '';
        document.getElementById('gas-url').value = result.gasUrl || 'https://script.google.com/macros/s/AKfycbwIAoo9vuoqXdx6dNndFKMJqRZTGbDGF3r/exec';

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
            githubPagesUrl,
            spreadsheetId,
            gasUrl: gasUrl || 'https://script.google.com/macros/s/AKfycbwIAoo9vuoqXdx6dNndFKMJqRZTGbDGF3r/exec',
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
        const result = await chrome.storage.sync.get(['githubPagesUrl']);
        const url = result.githubPagesUrl || 'https://ganta9.github.io/chrome_ext-ai_prompt_helper/';
        
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

console.log('AI Prompt Helper Popup Script v6.0.0 loaded');