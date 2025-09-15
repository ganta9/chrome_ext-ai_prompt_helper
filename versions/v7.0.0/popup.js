/**
 * AI Prompt Helper v7.0.0 - Popup Script
 * GitHub Token設定のみのシンプルな設定画面
 */

// ==========================================================================
// 初期化
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('AI Prompt Helper v7.0.0 設定画面 初期化開始');

  try {
    await loadSavedToken();
    setupEventListeners();
    console.log('AI Prompt Helper v7.0.0 設定画面 初期化完了');
  } catch (error) {
    console.error('設定画面初期化エラー:', error);
    showStatus('初期化に失敗しました', 'error');
  }
});

// ==========================================================================
// トークン管理
// ==========================================================================

async function loadSavedToken() {
  try {
    const result = await chrome.storage.local.get(['githubToken']);
    if (result.githubToken) {
      document.getElementById('githubToken').value = result.githubToken;
      console.log('保存されたGitHub Tokenを読み込みました');
    }
  } catch (error) {
    console.error('トークン読み込みエラー:', error);
  }
}

async function saveToken() {
  const tokenInput = document.getElementById('githubToken');
  const saveBtn = document.getElementById('saveToken');
  const token = tokenInput.value.trim();

  if (!token) {
    showStatus('トークンを入力してください', 'error');
    return;
  }

  // 基本的なGitHub Token形式チェック
  if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
    showStatus('正しいGitHub Personal Access Token形式ではありません', 'error');
    return;
  }

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';

    // Chrome Storage APIでトークンを保存
    await chrome.storage.local.set({ githubToken: token });

    showStatus('GitHub Tokenが保存されました', 'success');
    console.log('GitHub Token保存完了');

  } catch (error) {
    console.error('トークン保存エラー:', error);
    showStatus('保存に失敗しました', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = '保存';
  }
}

// ==========================================================================
// イベントリスナー設定
// ==========================================================================

function setupEventListeners() {
  const saveBtn = document.getElementById('saveToken');
  const tokenInput = document.getElementById('githubToken');

  // 保存ボタンのクリックイベント
  saveBtn.addEventListener('click', saveToken);

  // Enterキーでの保存
  tokenInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveToken();
    }
  });

  // 入力中のリアルタイム状態クリア
  tokenInput.addEventListener('input', () => {
    hideStatus();
  });
}

// ==========================================================================
// UI状態管理
// ==========================================================================

function showStatus(message, type) {
  const statusElement = document.getElementById('status');
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
  statusElement.style.display = 'block';

  // 成功メッセージは3秒後に自動で非表示
  if (type === 'success') {
    setTimeout(hideStatus, 3000);
  }
}

function hideStatus() {
  const statusElement = document.getElementById('status');
  statusElement.style.display = 'none';
}