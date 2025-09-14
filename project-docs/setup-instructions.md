# Google Apps Script セットアップ手順

## 1. Google Sheets準備

### 1.1 新しいスプレッドシート作成
1. [Google Sheets](https://sheets.google.com) にアクセス
2. 「空白のスプレッドシート」を作成
3. シート名を「Prompts」に変更（重要）
   - **注意**: シート名は正確に「Prompts」としてください。大文字・小文字も区別されます。
4. URLからスプレッドシートIDをコピー（例：`1AbC2DeFgHiJkLmNoPqRsTuVwXyZ123456789`）
   - **重要**: このIDは、Google Apps Scriptの `google-apps-script.js` ファイル内の `SPREADSHEET_ID` と完全に一致している必要があります。

### 1.2 ヘッダー行設定
A1セルから以下のヘッダーを設定：

| A1 | B1 | C1 | D1 | E1 | F1 | G1 | H1 |
|----|----|----|----|----|----|----|----|
| id | title | prompt | memo | tags | created_at | updated_at | deleted |

- **重要**: 各ヘッダーは、上記テーブルの通り、**個別のセル**に正確なスペルで入力してください。
- **注意**: `id`, `created_at`, `updated_at`, `deleted` 列は、Google Apps Scriptが自動で管理します。
  - `id` 列は、プロンプト追加時に自動生成されます。手動で入力したデータにIDを割り振る場合は、GASの `fixManualData()` 関数を実行してください。
  - `deleted` 列は、論理削除フラグです。通常は空欄または `FALSE` (ブール値) にしてください。文字列の "FALSE" は避けてください。

### 2.1 Apps Script プロジェクト作成
1. [Google Apps Script](https://script.google.com) にアクセス
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を「AI Prompt Helper API」に変更

### 2.2 スクリプトコード設定
1. デフォルトの `Code.gs` ファイルの内容を全削除
2. プロジェクトルートにある `google-apps-script.js` の内容をコピー＆ペースト
3. **重要**: 2行目の `SPREADSHEET_ID` を、Step 1.1でコピーした実際のスプレッドシートIDに置き換える。

### 2.3 権限設定
1. 「実行」ボタンをクリックして初回実行
2. 権限確認ダイアログで「権限を確認」
3. Google アカウントを選択
4. 「詳細」→「AI Prompt Helper API（安全でない）に移動」をクリック
5. 「許可」をクリック

### 2.4 ウェブアプリとしてデプロイ
1. 右上の「デプロイ」→「新しいデプロイ」をクリック
2. 「種類を選択」で「ウェブアプリ」を選択
3. 設定：
   - **説明**: AI Prompt Helper API v1.0
   - **実行ユーザー**: 自分（your-email@gmail.com）
   - **アクセスできるユーザー**: 全員
4. 「デプロイ」をクリック
5. **重要**: デプロイ完了後に表示される「ウェブアプリのURL」をコピーする。これがAPIのエンドポイントになります。

## 3. Chrome拡張機能とGitHub Pagesの設定

1. Chrome拡張機能のポップアップを開き、設定画面に移動します。
2. 「GitHub Pages設定」の「編集サイトURL」に、あなたのGitHub PagesサイトのURLを入力します。
3. 「Google Sheets連携」を有効にし、「Google Apps Script URL」に、Step 2.4でコピーしたウェブアプリのURLを貼り付けます。
4. 「スプレッドシートID」に、Step 1.1でコピーしたIDを貼り付けます。
5. 「保存」ボタンをクリックし、「接続テスト」を実行して成功することを確認します。

以上で、すべてのセットアップは完了です。