#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 設定
const CONFIG = {
  promptsDir: '../prompts',
  contentJsPath: '../src/content.js',
  backupSuffix: '.backup'
};

/**
 * プロンプトフォルダを再帰的にスキャンして構造を取得
 */
function scanPromptsDirectory(dir) {
  const categories = [];
  
  try {
    const categoryDirs = fs.readdirSync(dir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .sort();

    for (const categoryName of categoryDirs) {
      const categoryPath = path.join(dir, categoryName);
      const subcategories = [];

      // サブカテゴリをスキャン
      const subcategoryDirs = fs.readdirSync(categoryPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .sort();

      for (const subcategoryName of subcategoryDirs) {
        const subcategoryPath = path.join(categoryPath, subcategoryName);
        
        // プロンプトファイルをスキャン
        const promptFiles = fs.readdirSync(subcategoryPath, { withFileTypes: true })
          .filter(dirent => dirent.isFile() && dirent.name.endsWith('.txt'))
          .map(dirent => dirent.name)
          .sort();

        if (promptFiles.length > 0) {
          subcategories.push({
            name: subcategoryName,
            prompts: promptFiles
          });
        }
      }

      if (subcategories.length > 0) {
        categories.push({
          name: categoryName,
          subcategories: subcategories
        });
      }
    }

  } catch (error) {
    console.error('プロンプトディレクトリのスキャンに失敗:', error.message);
    process.exit(1);
  }

  return categories;
}

/**
 * scanPromptFolders関数のJavaScriptコードを生成
 */
function generateScanPromptFoldersCode(categories) {
  const timestamp = new Date().toLocaleString('ja-JP');
  
  let code = `// 実際に存在するファイルのみを返す（Ver3.0.0自動生成版）
async function scanPromptFolders() {
  console.log('Ver3.0.0自動生成版: 既存ファイルのみ読み込み');
  
  // 自動生成: ${timestamp}
  return {
    categories: [`;

  categories.forEach((category, categoryIndex) => {
    code += `
      {
        name: '${category.name}',
        subcategories: [`;
    
    category.subcategories.forEach((subcategory, subcategoryIndex) => {
      code += `
          {
            name: '${subcategory.name}',
            prompts: [${subcategory.prompts.map(p => `'${p}'`).join(', ')}]
          }`;
      
      if (subcategoryIndex < category.subcategories.length - 1) {
        code += ',';
      }
    });
    
    code += `
        ]
      }`;
    
    if (categoryIndex < categories.length - 1) {
      code += ',';
    }
  });

  code += `
    ]
  };
}`;

  return code;
}

/**
 * content.jsファイル内のscanPromptFolders関数を更新
 */
function updateContentJs(newFunctionCode) {
  const contentJsPath = CONFIG.contentJsPath;
  
  // バックアップ作成
  const backupPath = contentJsPath + CONFIG.backupSuffix;
  try {
    fs.copyFileSync(contentJsPath, backupPath);
    console.log(`✓ バックアップを作成しました: ${backupPath}`);
  } catch (error) {
    console.error('バックアップの作成に失敗:', error.message);
    process.exit(1);
  }

  // 元ファイルを読み込み
  let content;
  try {
    content = fs.readFileSync(contentJsPath, 'utf8');
  } catch (error) {
    console.error('content.jsの読み込みに失敗:', error.message);
    process.exit(1);
  }

  // scanPromptFolders関数を検索・置換
  const functionPattern = /\/\/[^\n]*実際に存在するファイル[^\n]*[\s\S]*?async function scanPromptFolders\(\)[\s\S]*?^\}/m;
  
  if (!functionPattern.test(content)) {
    console.error('scanPromptFolders関数が見つかりません');
    process.exit(1);
  }

  const updatedContent = content.replace(functionPattern, newFunctionCode);

  // ファイルに書き戻し
  try {
    fs.writeFileSync(contentJsPath, updatedContent, 'utf8');
    console.log(`✓ ${contentJsPath} を更新しました`);
  } catch (error) {
    console.error('content.jsの更新に失敗:', error.message);
    // バックアップから復元
    try {
      fs.copyFileSync(backupPath, contentJsPath);
      console.log('バックアップから復元しました');
    } catch (restoreError) {
      console.error('復元にも失敗しました:', restoreError.message);
    }
    process.exit(1);
  }
}

/**
 * メイン処理
 */
function main() {
  console.log('🚀 プロンプトスキャン自動更新スクリプト開始');
  console.log('');

  // プロンプトディレクトリの存在確認
  if (!fs.existsSync(CONFIG.promptsDir)) {
    console.error(`❌ プロンプトディレクトリが見つかりません: ${CONFIG.promptsDir}`);
    process.exit(1);
  }

  // content.jsの存在確認
  if (!fs.existsSync(CONFIG.contentJsPath)) {
    console.error(`❌ content.jsが見つかりません: ${CONFIG.contentJsPath}`);
    process.exit(1);
  }

  console.log(`📁 スキャン対象: ${CONFIG.promptsDir}`);
  
  // プロンプトフォルダをスキャン
  const categories = scanPromptsDirectory(CONFIG.promptsDir);
  
  // 結果表示
  console.log(`✓ ${categories.length}個のカテゴリを検出`);
  categories.forEach(category => {
    console.log(`  📂 ${category.name} (${category.subcategories.length}個のサブカテゴリ)`);
    category.subcategories.forEach(subcategory => {
      console.log(`    📁 ${subcategory.name} (${subcategory.prompts.length}個のプロンプト)`);
    });
  });
  console.log('');

  // JavaScript関数を生成
  const newFunctionCode = generateScanPromptFoldersCode(categories);
  
  // content.jsを更新
  updateContentJs(newFunctionCode);
  
  console.log('');
  console.log('🎉 プロンプトスキャン自動更新完了！');
  console.log('Chrome拡張機能を再インストールして変更を反映してください。');
}

// スクリプト実行
if (require.main === module) {
  main();
}

module.exports = { scanPromptsDirectory, generateScanPromptFoldersCode };