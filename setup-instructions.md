# Google Apps Script セットアップ手順

## 1. Google Sheets準備

### 1.1 新しいスプレッドシート作成
1. [Google Sheets](https://sheets.google.com) にアクセス
2. 「空白のスプレッドシート」を作成
3. シート名を「Prompts」に変更（重要）
4. URLからスプレッドシートIDをコピー（例：`1AbC2DeFgHiJkLmNoPqRsTuVwXyZ123456789`）

### 1.2 ヘッダー行設定
A1セルから以下のヘッダーを設定：

| A1 | B1 | C1 | D1 | E1 | F1 | G1 | H1 |
|----|----|----|----|----|----|----|----|
| id | title | prompt | memo | tags | created_at | updated_at | deleted |

## 2. Google Apps Script設定

### 2.1 Apps Script プロジェクト作成
1. [Google Apps Script](https://script.google.com) にアクセス
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を「AI Prompt Helper API」に変更

### 2.2 スクリプトコード設定
1. デフォルトの `Code.gs` ファイルの内容を全削除
2. `/Users/gantaku/Workspaces/chrome_ext-ai_prompt_helper/google-apps-script.js` の内容をコピー＆ペースト
3. **重要**: 2行目の `SPREADSHEET_ID` を実際のスプレッドシートIDに変更：
```javascript
const SPREADSHEET_ID = 'YOUR_ACTUAL_SPREADSHEET_ID_HERE';
```

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
5. **重要**: デプロイ完了後に表示される「ウェブアプリのURL」をコピー
   - 形式：`https://script.google.com/macros/s/SCRIPT_ID/exec`

## 3. 動作テスト

### 3.1 Apps Script内でのテスト
1. 関数選択で `setupInitialData` を選択
2. 「実行」ボタンをクリック
3. 実行ログで成功メッセージを確認
4. Google Sheets でテストデータが追加されているか確認

### 3.2 ブラウザでのAPIテスト

**プロンプト一覧取得テスト**：
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=getPrompts&callback=console.log
```

**プロンプト追加テスト**：
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=addPrompt&title=テスト&prompt=テストプロンプト&callback=console.log
```

### 3.3 成功確認
- ブラウザでJSONPレスポンスが返される
- Google Sheets にデータが正しく保存される
- エラーがないことを確認

## 4. 設定情報の記録

以下の情報を記録してください：

```
スプレッドシートID: ________________________________
ウェブアプリURL: ___________________________________
最終テスト日時: ___________________________________
```

## 5. トラブルシューティング

### 5.1 権限エラー
- Google Apps Script の実行権限を再確認
- スプレッドシートの共有設定を確認

### 5.2 スプレッドシートが見つからない
- SPREADSHEET_ID が正しいか確認
- シート名が「Prompts」になっているか確認

### 5.3 CORS エラー
- ウェブアプリのデプロイ設定で「アクセスできるユーザー: 全員」になっているか確認
- デプロイを再実行してみる

### 5.4 データが保存されない
- `setupInitialData` を実行してテストデータを作成
- `testGetPrompts` を実行してデータ取得をテスト

## 6. セキュリティ注意事項

- スプレッドシートとApps Scriptは同じGoogleアカウントで作成
- URLは第三者に公開しない（プライベートプロジェクトの場合）
- 定期的にアクセスログを確認（Apps Script ダッシュボード）

---

**次のステップ**: Phase 2のフロントエンド統合開発