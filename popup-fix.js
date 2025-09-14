// Google Sheets接続テスト関数の修正版（Manifest V3対応）
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

        // fetch APIを使用してテスト（Manifest V3対応）
        const testUrl = `${gasUrl}?action=getPrompts`;

        const response = await fetch(testUrl, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/javascript, text/javascript, */*'
            },
            credentials: 'omit'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: サーバーからエラー応答`);
        }

        const responseText = await response.text();
        console.log('Google Apps Script応答:', responseText);

        // JSONP応答の解析を試行
        let jsonData;

        // パターン1: callback(...)の形式
        const callbackMatch = responseText.match(/callback\((.+)\);?\s*$/);
        if (callbackMatch) {
            try {
                jsonData = JSON.parse(callbackMatch[1]);
            } catch (e) {
                console.warn('JSONP解析失敗:', e);
            }
        }

        // パターン2: 直接JSON
        if (!jsonData) {
            try {
                jsonData = JSON.parse(responseText);
            } catch (e) {
                console.warn('JSON解析失敗:', e);
                throw new Error('Google Apps Scriptからの応答を解析できませんでした');
            }
        }

        if (!jsonData.success) {
            throw new Error(jsonData.error || 'Google Apps Scriptからエラー応答');
        }

        // 成功情報を保存
        await chrome.storage.sync.set({
            lastSheetsSync: new Date().toISOString(),
            lastSheetsTest: new Date().toISOString()
        });

        await loadSheetsSettings(); // UI更新

        const promptCount = jsonData.data ? jsonData.data.length : 0;
        showStatus(`接続成功: ${promptCount}件のプロンプトを確認しました`, 'success');

    } catch (error) {
        console.error('Google Sheets接続テストエラー:', error);
        let errorMessage = 'Google Sheetsへの接続に失敗しました';

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'ネットワークエラー: Google Apps ScriptのURLとデプロイ設定を確認してください';
        } else if (error.message.includes('CORS')) {
            errorMessage = 'CORS制限: Google Apps Scriptの「アクセスできるユーザー: 全員」設定を確認してください';
        } else if (error.message.includes('HTTP')) {
            errorMessage = error.message + ' - Google Apps Scriptが正しくデプロイされているか確認してください';
        } else if (error.message) {
            errorMessage += ': ' + error.message;
        }

        showStatus(errorMessage, 'error');
    } finally {
        setLoading(false);
    }
}