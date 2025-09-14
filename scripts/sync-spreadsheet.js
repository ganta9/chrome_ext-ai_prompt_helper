const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// 定数
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const GCP_SERVICE_ACCOUNT_KEY = process.env.GCP_SERVICE_ACCOUNT_KEY;
const OUTPUT_PATH = path.join(__dirname, '../docs/prompts.json');

/**
 * Google Sheets APIの認証を行う
 */
async function getAuth() {
    if (!GCP_SERVICE_ACCOUNT_KEY) {
        throw new Error('環境変数 GCP_SERVICE_ACCOUNT_KEY が設定されていません。');
    }

    try {
        const credentials = JSON.parse(GCP_SERVICE_ACCOUNT_KEY);
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: SCOPES
        });
        return await auth.getClient();
    } catch (error) {
        console.error('サービスアカウントキーの解析に失敗しました:', error);
        throw new Error('GCP_SERVICE_ACCOUNT_KEY の形式が正しくありません。');
    }
}

/**
 * スプレッドシートからデータを取得する
 */
async function getSheetData(auth) {
    if (!SPREADSHEET_ID) {
        throw new Error('環境変数 SPREADSHEET_ID が設定されていません。');
    }

    const sheets = google.sheets({ version: 'v4', auth });
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Prompts!A:G', // A列からG列まで取得
        });
        return res.data.values;
    } catch (error) {
        console.error('スプレッドシートからのデータ取得に失敗しました:', error.message);
        throw new Error(`スプレッドシート(ID: ${SPREADSHEET_ID})へのアクセスに失敗しました。共有設定を確認してください。`);
    }
}

/**
 * シートのデータをJSON形式に変換する
 */
function formatData(rows) {
    if (!rows || rows.length < 2) {
        return []; // ヘッダーのみ、またはデータなし
    }

    const header = rows[0];
    const dataRows = rows.slice(1);

    return dataRows.map(row => {
        const prompt = {};
        header.forEach((key, index) => {
            const value = row[index] || '';
            if (key === 'tags') {
                prompt[key] = value ? value.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
            } else {
                prompt[key] = value;
            }
        });
        return prompt;
    }).filter(p => p.id && p.title && p.prompt); // 必須フィールドの存在チェック
}

/**
 * JSONファイルに書き出す
 */
function writeJsonFile(prompts) {
    const outputData = {
        version: '6.0.0',
        lastUpdated: new Date().toISOString(),
        prompts: prompts
    };

    try {
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputData, null, 2));
        console.log(`✅ ${prompts.length}個のプロンプトを ${OUTPUT_PATH} に正常に書き込みました。`);
    } catch (error) {
        console.error('JSONファイルへの書き込みに失敗しました:', error);
        throw new Error('ファイル書き込みエラーが発生しました。');
    }
}

/**
 * メイン処理
 */
async function main() {
    console.log('🚀 Googleスプレッドシートとの同期を開始します...');
    try {
        const auth = await getAuth();
        const rows = await getSheetData(auth);
        const prompts = formatData(rows);
        writeJsonFile(prompts);
        console.log('🎉 同期が正常に完了しました。');
    } catch (error) {
        console.error('❌ 同期処理中にエラーが発生しました:', error.message);
        process.exit(1); // エラーで終了
    }
}

main();
