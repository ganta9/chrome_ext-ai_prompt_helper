/**
 * AI Prompt Helper v6.0.0 - Popup Script
 * 設定画面のJavaScript
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
    
    // 統計情報を更新
    await updateStats();

    // Google Sheets設定を読み込み
    await loadSheetsSettings();
}

// ==========================================================================
// イベントリスナー設定
// ==========================================================================

function setupEventListeners() {
    // GitHub Pages設定関連
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    document.getElementById('test-connection').addEventListener('click', testConnection);
    document.getElementById('github-pages-url').addEventListener('input', validateUrl);
    document.getElementById('github-pages-url').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveSettings();
        }
    });

    // Google Sheets設定関連
    document.getElementById('save-sheets-settings').addEventListener('click', saveSheetsSettings);
    document.getElementById('test-sheets-connection').addEventListener('click', testSheetsConnection);
    document.getElementById('sheets-enabled').addEventListener('change', handleSheetsToggle);

    // 同期関連
    document.getElementById('sync-now').addEventListener('click', syncNow);
    
    // クイックアクション
    document.getElementById('open-editor').addEventListener('click', openEditor);
    document.getElementById('show-help').addEventListener('click', showHelp);
    
    // フッターリンク
    document.getElementById('github-link').addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://github.com/username/prompt-helper' });
    });
    
    document.getElementById('docs-link').addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://github.com/username/prompt-helper/wiki' });
    });
    
    document.getElementById('feedback-link').addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://github.com/username/prompt-helper/issues' });
    });
}

// ==========================================================================
// 設定管理
// ==========================================================================

async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get([
            'githubPagesUrl',
            'lastSync',
            'totalPrompts'
        ]);

        // GitHub Pages URLを設定
        const urlInput = document.getElementById('github-pages-url');
        urlInput.value = result.githubPagesUrl || '';

        // 統計情報を設定
        if (result.lastSync) {
            document.getElementById('last-sync').textContent = formatDateTime(result.lastSync);
        }

        if (result.totalPrompts !== undefined) {
            document.getElementById('total-prompts').textContent = result.totalPrompts;
        }

    } catch (error) {
        console.error('設定読み込みエラー:', error);
        showStatus('設定の読み込みに失敗しました', 'error');
    }
}

async function loadSheetsSettings() {
    try {
        const result = await chrome.storage.sync.get([
            'sheetsEnabled',
            'spreadsheetId',
            'googleAppsScriptUrl',
            'autoSyncEnabled',
            'autoSyncInterval',
            'lastSheetsSync'
        ]);

        // Google Sheets設定をフォームに設定
        document.getElementById('sheets-enabled').checked = result.sheetsEnabled || false;
        document.getElementById('spreadsheet-id').value = result.spreadsheetId || '';
        document.getElementById('gas-url').value = result.googleAppsScriptUrl || '';
        document.getElementById('auto-sync-enabled').checked = result.autoSyncEnabled !== false; // default: true
        document.getElementById('auto-sync-interval').value = result.autoSyncInterval || 5; // default: 5分

        // UI状態を更新
        handleSheetsToggle();

        // 最終同期時間を表示
        if (result.lastSheetsSync) {
            document.getElementById('last-sheets-sync').textContent = formatDateTime(result.lastSheetsSync);
        } else {
            document.getElementById('last-sheets-sync').textContent = '未同期';
        }

    } catch (error) {
        console.error('Google Sheets設定読み込みエラー:', error);
        showStatus('Google Sheets設定の読み込みに失敗しました', 'error');
    }
}

async function saveSettings() {
    if (isLoading) return;
    
    const url = document.getElementById('github-pages-url').value.trim();
    
    if (!url) {
        showStatus('URLを入力してください', 'error');
        document.getElementById('github-pages-url').focus();
        return;
    }
    
    if (!isValidUrl(url)) {
        showStatus('有効なURLを入力してください', 'error');
        document.getElementById('github-pages-url').focus();
        return;
    }
    
    try {
        setLoading(true);
        
        await chrome.storage.sync.set({ 
            githubPagesUrl: url,
            lastUpdated: new Date().toISOString()
        });
        
        showStatus('設定を保存しました', 'success');
        
        // 保存後に接続テストを実行
        setTimeout(testConnection, 1000);
        
    } catch (error) {
        console.error('設定保存エラー:', error);
        showStatus('設定の保存に失敗しました', 'error');
    } finally {
        setLoading(false);
    }
}

// ==========================================================================
// 接続テスト
// ==========================================================================

async function testConnection() {
    if (isLoading) return;
    
    const url = document.getElementById('github-pages-url').value.trim();
    
    if (!url) {
        showStatus('URLを入力してください', 'error');
        return;
    }
    
    if (!isValidUrl(url)) {
        showStatus('有効なURLを入力してください', 'error');
        return;
    }
    
    try {
        setLoading(true);
        showStatus('接続をテスト中...', 'warning');
        
        // GitHub PagesサイトのHTMLページに接続テスト
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/html',
            },
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const html = await response.text();
        
        // HTMLページが正常に取得できるかチェック
        if (!html.includes('AI Prompt Helper') && !html.includes('prompt')) {
            throw new Error('正しいプロンプト編集サイトではないようです');
        }
        
        // 設定を保存
        await chrome.storage.sync.set({
            githubPagesUrl: url,
            lastSync: new Date().toISOString()
        });
        
        await updateStats();
        
        showStatus('接続成功: GitHub Pages編集サイトに接続できました', 'success');
        
    } catch (error) {
        console.error('接続テストエラー:', error);
        let errorMessage = '接続に失敗しました';
        
        if (error.message.includes('404')) {
            errorMessage = 'データファイルが見つかりません (404)';
        } else if (error.message.includes('CORS')) {
            errorMessage = 'CORS エラー: GitHub Pages設定を確認してください';
        } else if (error.message.includes('network')) {
            errorMessage = 'ネットワークエラー: インターネット接続を確認してください';
        } else if (error.message) {
            errorMessage += ': ' + error.message;
        }
        
        showStatus(errorMessage, 'error');
    } finally {
        setLoading(false);
    }
}

// ==========================================================================
// Google Sheets設定管理
// ==========================================================================

async function saveSheetsSettings() {
    if (isLoading) return;

    const enabled = document.getElementById('sheets-enabled').checked;
    const spreadsheetId = document.getElementById('spreadsheet-id').value.trim();
    const gasUrl = document.getElementById('gas-url').value.trim();
    const autoSyncEnabled = document.getElementById('auto-sync-enabled').checked;
    const autoSyncInterval = parseInt(document.getElementById('auto-sync-interval').value) || 5;

    if (enabled) {
        if (!spreadsheetId) {
            showStatus('スプレッドシートIDを入力してください', 'error');
            document.getElementById('spreadsheet-id').focus();
            return;
        }

        if (!gasUrl || !isValidUrl(gasUrl)) {
            showStatus('有効なGoogle Apps Script URLを入力してください', 'error');
            document.getElementById('gas-url').focus();
            return;
        }
    }

    try {
        setLoading(true);

        await chrome.storage.sync.set({
            sheetsEnabled: enabled,
            spreadsheetId: spreadsheetId,
            googleAppsScriptUrl: gasUrl,
            autoSyncEnabled: autoSyncEnabled,
            autoSyncInterval: autoSyncInterval,
            lastSheetsSettingsUpdate: new Date().toISOString()
        });

        showStatus('Google Sheets設定を保存しました', 'success');

        // 保存後に接続テストを実行
        if (enabled) {
            setTimeout(testSheetsConnection, 1000);
        }

    } catch (error) {
        console.error('Google Sheets設定保存エラー:', error);
        showStatus('設定の保存に失敗しました', 'error');
    } finally {
        setLoading(false);
    }
}

async function testSheetsConnection() {
    if (isLoading) return;

    const gasUrl = document.getElementById('gas-url').value.trim();

    if (!gasUrl) {
        showStatus('Google Apps Script URLを入力してください', 'error');
        return;
    }

    if (!isValidUrl(gasUrl)) {
        showStatus('有効なURLを入力してください', 'error');
        return;
    }

    try {
        setLoading(true);
        showStatus('Google Sheetsへの接続をテスト中...', 'warning');

        // JSONPリクエストでテスト
        const testPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('タイムアウト: 30秒以内に応答がありませんでした'));
            }, 30000);

            const callbackName = 'testCallback_' + Date.now();

            window[callbackName] = (response) => {
                cleanup();
                if (response.success) {
                    resolve(response);
                } else {
                    reject(new Error(response.error || '不明なエラー'));
                }
            };

            function cleanup() {
                clearTimeout(timeout);
                if (window[callbackName]) {
                    delete window[callbackName];
                }
                const script = document.querySelector(`script[src*="${callbackName}"]`);
                if (script && script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            }

            const script = document.createElement('script');
            const testUrl = `${gasUrl}?action=getPrompts&callback=${callbackName}`;
            script.src = testUrl;
            script.onerror = () => {
                cleanup();
                reject(new Error('Google Apps Scriptへのリクエストに失敗しました'));
            };

            document.head.appendChild(script);

            setTimeout(() => {
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            }, 5000);
        });

        const response = await testPromise;

        // 成功情報を保存
        await chrome.storage.sync.set({
            lastSheetsSync: new Date().toISOString(),
            lastSheetsTest: new Date().toISOString()
        });

        await loadSheetsSettings(); // UI更新

        const promptCount = response.data ? response.data.length : 0;
        showStatus(`接続成功: ${promptCount}件のプロンプトを確認しました`, 'success');

    } catch (error) {
        console.error('Google Sheets接続テストエラー:', error);
        let errorMessage = 'Google Sheetsへの接続に失敗しました';

        if (error.message.includes('タイムアウト')) {
            errorMessage = 'タイムアウト: Google Apps Scriptのデプロイと権限設定を確認してください';
        } else if (error.message) {
            errorMessage += ': ' + error.message;
        }

        showStatus(errorMessage, 'error');
    } finally {
        setLoading(false);
    }
}

function handleSheetsToggle() {
    const enabled = document.getElementById('sheets-enabled').checked;
    const settingsInputs = document.querySelectorAll('.sheets-settings input:not(#sheets-enabled)');
    const settingsButtons = document.querySelectorAll('.sheets-settings button');

    settingsInputs.forEach(input => {
        input.disabled = !enabled;
    });

    settingsButtons.forEach(button => {
        button.disabled = !enabled;
    });

    // 設定セクションの表示/非表示
    const settingsSection = document.querySelector('.sheets-config');
    if (settingsSection) {
        settingsSection.style.opacity = enabled ? '1' : '0.5';
    }
}

// ==========================================================================
// 統計情報更新
// ==========================================================================

async function updateStats() {
    try {
        const result = await chrome.storage.sync.get(['totalPrompts', 'lastSync']);
        
        document.getElementById('total-prompts').textContent = result.totalPrompts || '0';
        document.getElementById('last-sync').textContent = result.lastSync ? 
            formatDateTime(result.lastSync) : '未同期';
            
    } catch (error) {
        console.error('統計更新エラー:', error);
    }
}

async function syncNow() {
    if (isLoading) return;

    const githubUrl = document.getElementById('github-pages-url').value.trim();
    const sheetsEnabled = document.getElementById('sheets-enabled').checked;
    const gasUrl = document.getElementById('gas-url').value.trim();

    if (!githubUrl) {
        showStatus('GitHub Pages URLを設定してください', 'error');
        return;
    }

    try {
        setLoading(true);
        showStatus('同期中...', 'warning');

        const results = { github: false, sheets: false };

        // GitHub Pagesへの接続確認
        try {
            const githubResponse = await fetch(githubUrl, {
                method: 'GET',
                headers: { 'Accept': 'text/html' },
                cache: 'no-cache'
            });

            if (githubResponse.ok) {
                results.github = true;
            }
        } catch (error) {
            console.warn('GitHub Pages接続エラー:', error);
        }

        // Google Sheetsへの同期（有効な場合）
        if (sheetsEnabled && gasUrl) {
            try {
                const sheetsTestPromise = new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        cleanup();
                        reject(new Error('タイムアウト'));
                    }, 15000); // 15秒タイムアウト

                    const callbackName = 'syncCallback_' + Date.now();

                    window[callbackName] = (response) => {
                        cleanup();
                        if (response.success) {
                            resolve(response);
                        } else {
                            reject(new Error(response.error || '不明なエラー'));
                        }
                    };

                    function cleanup() {
                        clearTimeout(timeout);
                        if (window[callbackName]) {
                            delete window[callbackName];
                        }
                        const script = document.querySelector(`script[src*="${callbackName}"]`);
                        if (script && script.parentNode) {
                            script.parentNode.removeChild(script);
                        }
                    }

                    const script = document.createElement('script');
                    const testUrl = `${gasUrl}?action=getPrompts&callback=${callbackName}`;
                    script.src = testUrl;
                    script.onerror = () => {
                        cleanup();
                        reject(new Error('リクエスト失敗'));
                    };

                    document.head.appendChild(script);
                });

                const sheetsResponse = await sheetsTestPromise;
                results.sheets = true;

                // プロンプト数を更新
                if (sheetsResponse.data) {
                    await chrome.storage.sync.set({
                        totalPrompts: sheetsResponse.data.length,
                        lastSheetsSync: new Date().toISOString()
                    });
                }

            } catch (error) {
                console.warn('Google Sheets同期エラー:', error);
            }
        }

        // 結果を保存
        await chrome.storage.sync.set({
            githubPagesUrl: githubUrl,
            lastSync: new Date().toISOString()
        });

        await updateStats();
        await loadSheetsSettings();

        // 結果メッセージ
        let message = '同期完了: ';
        const statuses = [];

        if (results.github) {
            statuses.push('GitHub Pages接続成功');
        } else {
            statuses.push('GitHub Pages接続失敗');
        }

        if (sheetsEnabled) {
            if (results.sheets) {
                statuses.push('Google Sheets同期成功');
            } else {
                statuses.push('Google Sheets同期失敗');
            }
        }

        message += statuses.join(', ');

        const hasFailure = !results.github || (sheetsEnabled && !results.sheets);
        showStatus(message, hasFailure ? 'warning' : 'success');

    } catch (error) {
        console.error('同期エラー:', error);
        showStatus('同期に失敗しました: ' + error.message, 'error');
    } finally {
        setLoading(false);
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
        
        await chrome.tabs.create({ url: url });
        window.close();
        
    } catch (error) {
        console.error('編集サイト起動エラー:', error);
        showStatus('編集サイトを開けませんでした', 'error');
    }
}

function showHelp() {
    const helpContent = `
AI Prompt Helper v6.0.0 使い方ガイド

【セットアップ】
1. GitHub Pages URLを設定
2. 「接続テスト」で動作確認

【基本的な使い方】
1. ChatGPT、Claude、Geminiなどのサイトを開く
2. 画面右端の📝ボタンをクリック
3. 編集サイトでプロンプトを選択
4. 自動で入力欄に挿入されます

【プロンプト管理】
- 編集サイトで追加・編集・削除
- タグでカテゴリ分類
- 検索・フィルタリング機能

【トラブルシューティング】
- ポップアップがブロックされる場合は許可してください
- 📝ボタンが表示されない場合はページを再読み込み
- データが同期されない場合は接続テストを実行

サポート: GitHub Issues
`;
    
    alert(helpContent);
}

// ==========================================================================
// UI制御
// ==========================================================================

function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('settings-status');
    
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    statusElement.style.display = 'block';
    
    // 成功メッセージは3秒後に非表示
    if (type === 'success') {
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 3000);
    }
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

function validateUrl() {
    const url = document.getElementById('github-pages-url').value.trim();
    const saveBtn = document.getElementById('save-settings');
    const testBtn = document.getElementById('test-connection');
    
    const isValid = url && isValidUrl(url);
    
    saveBtn.disabled = !isValid;
    testBtn.disabled = !isValid;
    
    if (url && !isValid) {
        showStatus('URL形式が正しくありません', 'error');
    } else if (url && isValid) {
        document.getElementById('settings-status').style.display = 'none';
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

function formatDateTime(isoString) {
    try {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMinutes < 1) {
            return '今';
        } else if (diffMinutes < 60) {
            return `${diffMinutes}分前`;
        } else if (diffHours < 24) {
            return `${diffHours}時間前`;
        } else if (diffDays < 7) {
            return `${diffDays}日前`;
        } else {
            return date.toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    } catch (error) {
        return '不明';
    }
}

// ==========================================================================
// デバッグ用
// ==========================================================================

if (typeof window !== 'undefined') {
    window.promptHelperPopup = {
        loadSettings,
        saveSettings,
        testConnection,
        updateStats,
        // Google Sheets関連
        loadSheetsSettings,
        saveSheetsSettings,
        testSheetsConnection,
        handleSheetsToggle,
        version: '6.0.0'
    };
}