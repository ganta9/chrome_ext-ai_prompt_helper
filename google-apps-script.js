/**
 * AI Prompt Helper - Google Apps Script API (修正版)
 * プロンプト管理用CRUD API
 */

// スプレッドシートID（実際の値に置き換えてください）
const SPREADSHEET_ID = '10KOk1aWODGfkH186Gxr17cA6zNxZGhZVecQAdxhOBGM';
const SHEET_NAME = 'Prompts';

/**
 * doGet - プロンプトデータの操作（JSONP対応）
 * 修正版：エラーハンドリングを強化
 */
function doGet(e) {
  try {
    // パラメータの安全な取得
    const params = (e && e.parameter) ? e.parameter : {};
    const callback = params.callback || 'callback';

    console.log('doGet called with params:', params);

    let result;

    switch (params.action) {
      case 'getPrompts':
        result = getPrompts();
        break;
      case 'addPrompt':
        result = addPrompt({
          title: params.title,
          prompt: params.prompt,
          memo: params.memo || '',
          tags: params.tags || ''
        });
        break;
      case 'updatePrompt':
        result = updatePrompt(params.id, {
          title: params.title,
          prompt: params.prompt,
          memo: params.memo || '',
          tags: params.tags || ''
        });
        break;
      case 'deletePrompt':
        result = deletePrompt(params.id);
        break;
      default:
        result = JSON.stringify({
          success: false,
          error: 'Invalid action. Available actions: getPrompts, addPrompt, updatePrompt, deletePrompt'
        });
    }

    const jsonpResponse = `${callback}(${result});`;
    return ContentService.createTextOutput(jsonpResponse).setMimeType(ContentService.MimeType.JAVASCRIPT);

  } catch (error) {
    console.error('doGet error:', error);
    const callback = ((e && e.parameter) ? e.parameter.callback : null) || 'callback';
    const errorResult = JSON.stringify({ success: false, error: error.toString() });
    const jsonpResponse = `${callback}(${errorResult});`;
    return ContentService.createTextOutput(jsonpResponse).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
}

/**
 * doPost - POST リクエスト対応（将来の拡張用）
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createCORSResponse(JSON.stringify({ success: false, error: 'No POST data' }));
    }

    const postData = JSON.parse(e.postData.contents);
    let result;

    switch (postData.action) {
      case 'addPrompt':
        result = addPrompt(postData.data);
        break;
      case 'updatePrompt':
        result = updatePrompt(postData.id, postData.data);
        break;
      case 'deletePrompt':
        result = deletePrompt(postData.id);
        break;
      default:
        result = JSON.stringify({ success: false, error: 'Invalid action' });
    }

    return createCORSResponse(result);

  } catch (error) {
    console.error('doPost error:', error);
    return createCORSResponse(JSON.stringify({ success: false, error: error.toString() }));
  }
}

/**
 * doOptions - CORS preflight対応
 */
function doOptions(e) {
  return createCORSResponse(JSON.stringify({ success: true, message: 'CORS preflight OK' }));
}

/**
 * 入力データの検証
 */
function validatePromptData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data object');
  }

  // タイトルの検証
  if (!data.title || typeof data.title !== 'string') {
    throw new Error('Title is required');
  }
  if (data.title.length > 100) {
    throw new Error('Title too long (max 100 characters)');
  }

  // プロンプト本文の検証
  if (!data.prompt || typeof data.prompt !== 'string') {
    throw new Error('Prompt text is required');
  }
  if (data.prompt.length > 5000) {
    throw new Error('Prompt text too long (max 5000 characters)');
  }

  // メモの検証（オプション）
  if (data.memo && typeof data.memo !== 'string') {
    throw new Error('Memo must be string');
  }
  if (data.memo && data.memo.length > 500) {
    throw new Error('Memo too long (max 500 characters)');
  }

  // タグの検証（オプション）
  if (data.tags && typeof data.tags !== 'string') {
    throw new Error('Tags must be string');
  }
  if (data.tags && data.tags.length > 200) {
    throw new Error('Tags too long (max 200 characters)');
  }

  // 危険な文字列の検出
  const dangerousPatterns = [/<script/i, /javascript:/i, /on\w+=/i, /<iframe/i, /<object/i];
  const fields = [data.title, data.prompt, data.memo || '', data.tags || ''];

  for (const field of fields) {
    for (const pattern of dangerousPatterns) {
      if (pattern.test(field)) {
        throw new Error('Potentially dangerous content detected');
      }
    }
  }

  return true;
}

/**
 * プロンプト一覧取得
 */
function getPrompts() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    // シートが存在しない場合は作成
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      // ヘッダー行を設定
      const headers = ['id', 'title', 'prompt', 'memo', 'tags', 'created_at', 'updated_at', 'deleted'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    const lastRow = sheet.getLastRow();

    // データが存在しない場合
    if (lastRow <= 1) {
      return JSON.stringify({ success: true, data: [] });
    }

    // データ取得（ヘッダー行を除く）
    const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();

    // 削除されていないプロンプトのみをフィルタリング
    const prompts = data
      .filter(row => row[0] && !row[7]) // IDがあり、deletedがfalse
      .map(row => ({
        id: row[0],
        title: row[1],
        prompt: row[2],
        memo: row[3] || '',
        tags: row[4] || '',
        created_at: formatDate(row[5]),
        updated_at: formatDate(row[6])
      }));

    return JSON.stringify({ success: true, data: prompts });

  } catch (error) {
    console.error('getPrompts error:', error);
    return JSON.stringify({ success: false, error: error.toString() });
  }
}

/**
 * プロンプト追加
 */
function addPrompt(promptData) {
  try {
    // 入力データの検証
    validatePromptData(promptData);

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    // シートが存在しない場合は作成
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      const headers = ['id', 'title', 'prompt', 'memo', 'tags', 'created_at', 'updated_at', 'deleted'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    // 一意なIDを生成
    const id = 'prompt_' + Utilities.getUuid().replace(/-/g, '');
    const now = new Date();

    // 新しい行を追加
    const newRow = sheet.getLastRow() + 1;
    const rowData = [
      id,
      promptData.title,
      promptData.prompt,
      promptData.memo || '',
      promptData.tags || '',
      now,
      now,
      false // deleted = false
    ];

    sheet.getRange(newRow, 1, 1, rowData.length).setValues([rowData]);

    return JSON.stringify({
      success: true,
      message: 'Prompt added successfully',
      data: {
        id: id,
        title: promptData.title,
        prompt: promptData.prompt,
        memo: promptData.memo || '',
        tags: promptData.tags || '',
        created_at: formatDate(now),
        updated_at: formatDate(now)
      }
    });

  } catch (error) {
    console.error('addPrompt error:', error);
    return JSON.stringify({ success: false, error: error.toString() });
  }
}

/**
 * プロンプト更新
 */
function updatePrompt(id, promptData) {
  try {
    if (!id) {
      throw new Error('Prompt ID is required');
    }

    // 入力データの検証
    validatePromptData(promptData);

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error('Prompts sheet not found');
    }

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      throw new Error('Prompt not found');
    }

    // IDで行を検索
    const idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    let targetRow = -1;

    for (let i = 0; i < idColumn.length; i++) {
      if (idColumn[i][0] === id) {
        targetRow = i + 2; // ヘッダー行を考慮
        break;
      }
    }

    if (targetRow === -1) {
      throw new Error('Prompt not found');
    }

    // データ更新
    const now = new Date();
    const updatedData = [
      id, // ID は変更しない
      promptData.title,
      promptData.prompt,
      promptData.memo || '',
      promptData.tags || '',
      sheet.getRange(targetRow, 6).getValue(), // created_at は変更しない
      now, // updated_at を更新
      false // deleted は変更しない
    ];

    sheet.getRange(targetRow, 1, 1, updatedData.length).setValues([updatedData]);

    return JSON.stringify({
      success: true,
      message: 'Prompt updated successfully',
      data: {
        id: id,
        title: promptData.title,
        prompt: promptData.prompt,
        memo: promptData.memo || '',
        tags: promptData.tags || '',
        updated_at: formatDate(now)
      }
    });

  } catch (error) {
    console.error('updatePrompt error:', error);
    return JSON.stringify({ success: false, error: error.toString() });
  }
}

/**
 * プロンプト削除（論理削除）
 */
function deletePrompt(id) {
  try {
    if (!id) {
      throw new Error('Prompt ID is required');
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error('Prompts sheet not found');
    }

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      throw new Error('Prompt not found');
    }

    // IDで行を検索
    const idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    let targetRow = -1;

    for (let i = 0; i < idColumn.length; i++) {
      if (idColumn[i][0] === id) {
        targetRow = i + 2; // ヘッダー行を考慮
        break;
      }
    }

    if (targetRow === -1) {
      throw new Error('Prompt not found');
    }

    // 論理削除フラグを設定
    const now = new Date();
    sheet.getRange(targetRow, 7).setValue(now); // updated_at を更新
    sheet.getRange(targetRow, 8).setValue(true); // deleted = true

    return JSON.stringify({
      success: true,
      message: 'Prompt deleted successfully',
      data: { id: id }
    });

  } catch (error) {
    console.error('deletePrompt error:', error);
    return JSON.stringify({ success: false, error: error.toString() });
  }
}

/**
 * 日付フォーマット関数
 */
function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date;

  try {
    return date.toISOString();
  } catch (e) {
    return new Date(date).toISOString();
  }
}

/**
 * CORS対応レスポンスを作成
 */
function createCORSResponse(content) {
  return ContentService
    .createTextOutput(content)
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '3600',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block'
    });
}

/**
 * テスト用関数 - プロンプト追加
 */
function testAddPrompt() {
  const testData = {
    title: 'テストプロンプト',
    prompt: 'これはテスト用のプロンプトです。',
    memo: 'テスト用メモ',
    tags: 'テスト,サンプル'
  };

  const result = addPrompt(testData);
  console.log('Add Test Result:', result);
  return result;
}

/**
 * テスト用関数 - プロンプト一覧取得
 */
function testGetPrompts() {
  const result = getPrompts();
  console.log('Get Test Result:', result);
  return result;
}

/**
 * テスト用関数 - 初期データセットアップ
 */
function setupInitialData() {
  const initialPrompts = [
    {
      title: 'コード解説プロンプト',
      prompt: '以下のコードを詳しく解説してください：\n\n[コードをここに貼り付け]',
      memo: 'プログラミング学習用',
      tags: 'コード,解説,学習'
    },
    {
      title: '要約プロンプト',
      prompt: '以下の文章を3つのポイントで要約してください：\n\n[文章をここに貼り付け]',
      memo: '文書処理用',
      tags: '要約,文書,整理'
    },
    {
      title: '翻訳プロンプト',
      prompt: '以下の文章を自然な日本語に翻訳してください：\n\n[英文をここに貼り付け]',
      memo: '言語変換用',
      tags: '翻訳,英語,日本語'
    }
  ];

  const results = [];
  for (const prompt of initialPrompts) {
    const result = addPrompt(prompt);
    results.push(result);
    console.log('Setup result:', result);
  }

  return results;
}

/**
 * シンプルテスト関数（パラメータなしでテスト）
 */
function simpleTest() {
  console.log('Simple test started');

  try {
    // 空のeventでdoGetをテスト
    const result1 = doGet();
    console.log('Test 1 (no params):', result1.getContent());

    // getPromptsを直接テスト
    const result2 = getPrompts();
    console.log('Test 2 (getPrompts):', result2);

    return 'Tests completed successfully';
  } catch (error) {
    console.error('Test error:', error);
    return 'Test failed: ' + error.toString();
  }
}