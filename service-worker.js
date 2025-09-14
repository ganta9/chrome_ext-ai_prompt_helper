/**
 * AI Prompt Helper v6.0.0 - Service Worker
 * バックグラウンドでスプレッドシート同期処理
 */

// ==========================================================================
// グローバル変数
// ==========================================================================

let isUpdating = false;

// ==========================================================================
// メッセージ処理
// ==========================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Service Worker: メッセージ受信:', message);
    
    if (message.action === 'updatePrompts') {
        updatePromptsFromSpreadsheet()
            .then(result => {
                console.log('Service Worker: プロンプト更新完了:', result);
                sendResponse(result);
            })
            .catch(error => {
                console.error('Service Worker: プロンプト更新エラー:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // 非同期レスポンス
    }
    
    if (message.action === 'getPrompts') {
        chrome.storage.local.get(['promptsCache', 'lastSyncTime'], (result) => {
            sendResponse({
                success: true,
                data: result.promptsCache || [],
                lastSync: result.lastSyncTime || null
            });
        });
        return true;
    }
});

// ==========================================================================
// スプレッドシート同期処理
// ==========================================================================

async function updatePromptsFromSpreadsheet() {
    if (isUpdating) {
        console.log('Service Worker: 既に更新中です');
        return { success: false, error: '更新処理が実行中です' };
    }
    
    isUpdating = true;
    
    try {
        // 設定を取得
        const settings = await new Promise((resolve) => {
            chrome.storage.sync.get(['gasUrl'], resolve);
        });
        
        if (!settings.gasUrl) {
            throw new Error('Google Apps Script URLが設定されていません');
        }
        
        console.log('Service Worker: Google Apps Script接続開始:', settings.gasUrl);
        
        // スプレッドシートからデータ取得
        const response = await fetchWithJSONP(settings.gasUrl + '?action=getPrompts');
        
        if (!response.success) {
            throw new Error(response.error || 'データ取得に失敗しました');
        }
        
        const prompts = response.data || [];
        console.log('Service Worker: プロンプトデータ取得成功:', prompts.length + '件');
        
        // ローカルストレージに保存
        await new Promise((resolve) => {
            chrome.storage.local.set({
                promptsCache: prompts,
                lastSyncTime: new Date().toISOString()
            }, resolve);
        });
        
        console.log('Service Worker: ローカルキャッシュ更新完了');
        
        return {
            success: true,
            count: prompts.length,
            lastSync: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Service Worker: 同期処理エラー:', error);
        return {
            success: false,
            error: error.message
        };
    } finally {
        isUpdating = false;
    }
}

// ==========================================================================
// JSONP通信処理
// ==========================================================================

async function fetchWithJSONP(url) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('タイムアウト'));
        }, 15000);
        
        const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // グローバル関数として登録
        self[callbackName] = function(data) {
            cleanup();
            resolve(data);
        };
        
        const cleanup = () => {
            clearTimeout(timeout);
            delete self[callbackName];
            if (script && script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
        
        // スクリプトタグを動的作成
        const script = document.createElement('script');
        script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + callbackName;
        script.onerror = () => {
            cleanup();
            reject(new Error('Google Apps Script接続エラー'));
        };
        
        // service workerではdocumentが利用できないため、importScripts使用
        try {
            importScripts(script.src);
        } catch (error) {
            // importScriptsが使えない場合はfetch使用
            fetch(script.src, { mode: 'no-cors' })
                .then(() => {
                    // JSONP の場合、レスポンス内容は直接取得できない
                    // コールバック関数の実行を待つ
                    setTimeout(() => {
                        if (self[callbackName]) {
                            cleanup();
                            reject(new Error('JSONP コールバックが実行されませんでした'));
                        }
                    }, 10000);
                })
                .catch(err => {
                    cleanup();
                    reject(err);
                });
        }
    });
}

// ==========================================================================
// 初期化
// ==========================================================================

chrome.runtime.onStartup.addListener(() => {
    console.log('Service Worker: Chrome起動時の初期化');
});

chrome.runtime.onInstalled.addListener(() => {
    console.log('Service Worker: 拡張機能インストール時の初期化');
});

console.log('AI Prompt Helper Service Worker v6.0.0 loaded');