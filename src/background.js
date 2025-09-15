/**
 * AI Prompt Helper v7.0.0 - Background Script
 * v6.0.0互換の chrome.runtime.sendMessage 処理 + v7.0.0対応
 */

// ==========================================================================
// プロンプトデータ管理
// ==========================================================================

const GITHUB_PAGES_URL = 'https://ganta9.github.io/chrome_ext-ai_prompt_helper/prompts.json';

// デフォルトプロンプト（v6.0.0互換）
const DEFAULT_PROMPTS = [
  {
    id: 'default_1',
    title: '文章校正',
    content: '以下の文章を校正してください。誤字脱字、文法、表現の改善点があれば指摘し、修正案を提示してください。\n\n【文章】\n',
    tags: '校正,文章,チェック'
  },
  {
    id: 'default_2',
    title: '要約作成',
    content: '以下の内容を簡潔に要約してください。重要なポイントを3-5点に絞って整理してください。\n\n【内容】\n',
    tags: '要約,整理,まとめ'
  },
  {
    id: 'default_3',
    title: 'コードレビュー',
    content: '以下のコードをレビューしてください。改善点、バグの可能性、ベストプラクティスの観点から評価をお願いします。\n\n【コード】\n```\n\n```',
    tags: 'コード,レビュー,プログラミング'
  },
  {
    id: 'default_4',
    title: '翻訳（日→英）',
    content: '以下の日本語を自然な英語に翻訳してください。ビジネス文書として適切な表現を心がけてください。\n\n【日本語】\n',
    tags: '翻訳,英語,ビジネス'
  },
  {
    id: 'default_5',
    title: 'アイデア出し',
    content: '以下のテーマについて、創意工夫に富んだアイデアを5-10個提案してください。実現可能性も考慮してください。\n\n【テーマ】\n',
    tags: 'アイデア,ブレインストーミング,創造'
  }
];

let cachedPrompts = [];

// ==========================================================================
// GitHub Pages からプロンプト取得（v7.0.0機能）
// ==========================================================================

async function fetchPromptsFromGitHubPages() {
  try {
    console.log('Background: GitHub Pagesからプロンプトデータを取得中...');

    const response = await fetch(GITHUB_PAGES_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.prompts || !Array.isArray(data.prompts)) {
      throw new Error('Invalid prompts data structure');
    }

    console.log(`Background: GitHub Pagesから${data.prompts.length}件のプロンプトを取得`);
    return data.prompts;

  } catch (error) {
    console.warn('Background: GitHub Pages取得失敗:', error);
    return null;
  }
}

// ローカルストレージからプロンプト取得（v6.0.0互換）
async function getPromptsFromLocalStorage() {
  try {
    const result = await chrome.storage.local.get(['prompts']);
    const prompts = result.prompts || [];
    console.log(`Background: ローカルストレージから${prompts.length}件のプロンプトを取得`);
    return prompts;
  } catch (error) {
    console.warn('Background: ローカルストレージ取得失敗:', error);
    return [];
  }
}

// プロンプトデータをローカルストレージに保存
async function savePromptsToLocalStorage(prompts) {
  try {
    await chrome.storage.local.set({ prompts: prompts });
    console.log(`Background: ${prompts.length}件のプロンプトをローカルストレージに保存`);
  } catch (error) {
    console.warn('Background: ローカルストレージ保存失敗:', error);
  }
}

// v7.0.0のプロンプト構造をv6.0.0互換形式に変換
function convertV7ToV6Format(v7Prompts) {
  return v7Prompts.map(prompt => ({
    id: prompt.id,
    title: prompt.title,
    content: prompt.prompt, // v7: prompt -> v6: content
    prompt: prompt.prompt,  // 互換性のため両方保持
    memo: prompt.memo || '',
    tags: Array.isArray(prompt.tags) ? prompt.tags.join(',') : (prompt.tags || ''),
    created_at: prompt.created_at,
    updated_at: prompt.updated_at
  }));
}

// ==========================================================================
// メッセージハンドラー（v6.0.0互換）
// ==========================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background: メッセージ受信:', request);

  if (request.action === 'updatePrompts') {
    handleUpdatePrompts(sendResponse);
    return true; // 非同期レスポンス
  }

  if (request.action === 'getPrompts') {
    handleGetPrompts(sendResponse);
    return true; // 非同期レスポンス
  }

  console.warn('Background: 未知のアクション:', request.action);
  sendResponse({ success: false, error: '未知のアクション' });
});

// プロンプト更新処理
async function handleUpdatePrompts(sendResponse) {
  try {
    // 1. GitHub Pagesから最新データ取得を試行（v7.0.0機能）
    const githubPrompts = await fetchPromptsFromGitHubPages();

    let finalPrompts;
    let source;

    if (githubPrompts && githubPrompts.length > 0) {
      // GitHub Pagesデータを v6.0.0互換形式に変換
      finalPrompts = convertV7ToV6Format(githubPrompts);
      source = 'GitHub Pages';

      // ローカルストレージにキャッシュ
      await savePromptsToLocalStorage(finalPrompts);

    } else {
      // 2. フォールバック：ローカルストレージから取得
      const localPrompts = await getPromptsFromLocalStorage();

      if (localPrompts.length > 0) {
        finalPrompts = localPrompts;
        source = 'ローカルストレージ';
      } else {
        // 3. 最終フォールバック：デフォルトプロンプト
        finalPrompts = DEFAULT_PROMPTS;
        source = 'デフォルト';

        // デフォルトプロンプトをローカルストレージに保存
        await savePromptsToLocalStorage(finalPrompts);
      }
    }

    // キャッシュを更新
    cachedPrompts = finalPrompts;

    console.log(`Background: プロンプト更新完了 (${source}): ${finalPrompts.length}件`);
    sendResponse({
      success: true,
      count: finalPrompts.length,
      data: finalPrompts,
      source: source
    });

  } catch (error) {
    console.error('Background: プロンプト更新エラー:', error);
    sendResponse({
      success: false,
      error: error.message,
      data: DEFAULT_PROMPTS
    });
  }
}

// プロンプト取得処理
async function handleGetPrompts(sendResponse) {
  try {
    // キャッシュがあればそれを返す
    if (cachedPrompts.length > 0) {
      console.log(`Background: キャッシュからプロンプト取得: ${cachedPrompts.length}件`);
      sendResponse({
        success: true,
        count: cachedPrompts.length,
        data: cachedPrompts
      });
      return;
    }

    // キャッシュがない場合は更新処理を実行
    await handleUpdatePrompts((updateResponse) => {
      if (updateResponse.success) {
        sendResponse({
          success: true,
          count: updateResponse.count,
          data: updateResponse.data
        });
      } else {
        sendResponse(updateResponse);
      }
    });

  } catch (error) {
    console.error('Background: プロンプト取得エラー:', error);
    sendResponse({
      success: false,
      error: error.message,
      data: DEFAULT_PROMPTS
    });
  }
}

// ==========================================================================
// 拡張機能インストール時の初期化（v7.0.0対応）
// ==========================================================================

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Background: 拡張機能インストール/更新:', details.reason);

  if (details.reason === 'install') {
    console.log('Background: 初回インストール - デフォルトプロンプトを設定');
    await savePromptsToLocalStorage(DEFAULT_PROMPTS);
    cachedPrompts = DEFAULT_PROMPTS;
  } else if (details.reason === 'update') {
    console.log('Background: 更新 - プロンプトデータを更新');
    // GitHub Pagesから最新データを取得して更新
    const githubPrompts = await fetchPromptsFromGitHubPages();
    if (githubPrompts && githubPrompts.length > 0) {
      const convertedPrompts = convertV7ToV6Format(githubPrompts);
      await savePromptsToLocalStorage(convertedPrompts);
      cachedPrompts = convertedPrompts;
    }
  }
});

// ==========================================================================
// 拡張機能開始時の初期化
// ==========================================================================

chrome.runtime.onStartup.addListener(async () => {
  console.log('Background: 拡張機能開始');
  // 起動時にローカルキャッシュを読み込み
  cachedPrompts = await getPromptsFromLocalStorage();
});

console.log('AI Prompt Helper v7.0.0 Background Script 初期化完了');