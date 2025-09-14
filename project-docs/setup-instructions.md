# v6.0.0 セットアップ手順

## 概要

バージョン6.0.0は、Googleスプレッドシートをデータ原本とし、GitHub Actionsを利用して自動的にプロンプトデータ（`prompts.json`）を生成・配信するアーキテクチャを採用しています。このドキュメントは、そのための環境構築手順を説明します。

---

## Step 1: Googleスプレッドシートの準備

プロンプトデータを管理するためのスプレッドシートを用意します。

1.  **スプレッドシートの作成**
    *   [Google Sheets](https://sheets.google.com)にアクセスし、「空白のスプレッドシート」を作成します。
    *   URLから**スプレッドシートID**をコピーして控えておきます。
        *   例: `https://docs.google.com/spreadsheets/d/`**`1AbC2DeFgHiJkLmNoPqRsTuVwXyZ123456789`**`/edit`

2.  **ヘッダー行の設定**
    *   1行目に、以下のヘッダーを**英語で**設定してください。スクリプトがこのヘッダー名で列を認識します。

| A1 | B1 | C1 | D1 | E1 | F1 | G1 |
|---|---|---|---|---|---|---|
| id | title | prompt | memo | tags | created_at | updated_at |

---

## Step 2: Google Cloud Platform (GCP) での認証設定

GitHub Actionsがスプレッドシートに安全にアクセスするために、**サービスアカウント**を作成し、認証キーを発行します。

1.  **GCPプロジェクトの選択・作成**
    *   [Google Cloud Console](https://console.cloud.google.com/)にアクセスします。
    *   既存のプロジェクトを選択するか、新しいプロジェクトを作成します。

2.  **APIの有効化**
    *   左側のメニューから「APIとサービス」>「ライブラリ」を選択します。
    *   「**Google Sheets API**」を検索し、「有効にする」をクリックします。
    *   「**Google Drive API**」を検索し、「有効にする」をクリックします。

3.  **サービスアカウントの作成**
    *   左側のメニューから「IAMと管理」>「サービスアカウント」を選択します。
    *   「+ サービスアカウントを作成」をクリックします。
    *   サービスアカウント名（例: `github-actions-sheets-reader`）を入力し、「作成して続行」をクリックします。
    *   ロールは不要です。「続行」をクリックし、「完了」します。

4.  **認証キー（JSON）の作成**
    *   作成したサービスアカウントのメールアドレスをクリックします。
    *   「キー」タブを選択し、「鍵を追加」>「新しい鍵を作成」をクリックします。
    *   キーのタイプで「**JSON**」を選択し、「作成」をクリックします。
    *   認証情報が含まれたJSONファイルが自動的にダウンロードされます。**このファイルは絶対に公開しないでください。**

5.  **スプレッドシートの共有設定**
    *   先ほど作成したサービスアカウントのメールアドレス（`...@...iam.gserviceaccount.com`）をコピーします。
    *   Step 1で作成したGoogleスプレッドシートを開き、右上の「共有」ボタンをクリックします。
    *   コピーしたサービスアカウントのメールアドレスを追加し、権限を「**編集者**」に設定して保存します。

---

## Step 3: GitHubリポジトリの設定

GitHub Actionsが認証情報を安全に利用できるように、リポジトリのSecretsに設定します。

1.  **リポジトリのSecretsを開く**
    *   対象のGitHubリポジトリで、「Settings」>「Secrets and variables」>「Actions」に移動します。

2.  **Secretsの登録**
    *   「New repository secret」をクリックし、以下の2つのSecretを登録します。

    *   **Secret 1:**
        *   **Name**: `GCP_SERVICE_ACCOUNT_KEY`
        *   **Value**: Step 2-4でダウンロードした**JSONキーファイルの中身全体**をコピーして貼り付けます。

    *   **Secret 2:**
        *   **Name**: `SPREADSHEET_ID`
        *   **Value**: Step 1-1で控えておいた**スプレッドシートID**を貼り付けます。

---

## Step 4: ワークフローと変換スクリプトの配置

リポジトリに、データ変換を行うスクリプトと、それを実行するGitHub Actionsのワークフローファイルを配置します。

1.  **データ変換スクリプト**
    *   スプレッドシートからデータを読み取り、`prompts.json`の形式に変換するスクリプト（Node.jsやGASなど）が必要です。このスクリプトは、`GCP_SERVICE_ACCOUNT_KEY`と`SPREADSHEET_ID`を使って認証とデータ取得を行います。
    *   （このプロジェクトでは、`scripts/sync-spreadsheet.js`などに配置することを想定しています。）

2.  **GitHub Actions ワークフローファイル**
    *   リポジトリのルートに `.github/workflows/` というディレクトリを作成します。
    *   その中に `sync.yml` のような名前で、以下の内容のファイルを作成します。

    ```yaml
    name: Sync Google Sheet to JSON

    on:
      schedule:
        - cron: '0 * * * *'  # 1時間ごとに自動実行
      workflow_dispatch:      # 手動実行も可能にする

    jobs:
      sync:
        runs-on: ubuntu-latest
        steps:
          - name: Checkout repository
            uses: actions/checkout@v3

          - name: Setup Node.js
            uses: actions/setup-node@v3
            with:
              node-version: '18'

          # - name: Install dependencies
          #   run: npm install # 必要に応じて

          - name: Run sync script
            env:
              GCP_SERVICE_ACCOUNT_KEY: ${{ secrets.GCP_SERVICE_ACCOUNT_KEY }}
              SPREADSHEET_ID: ${{ secrets.SPREADSHEET_ID }}
            run: node ./scripts/sync-spreadsheet.js # 変換スクリプトのパスを指定

          - name: Commit and push if there are changes
            run: |
              git config --global user.name 'github-actions[bot]'
              git config --global user.email 'github-actions[bot]@users.noreply.github.com'
              git add docs/prompts.json
              # 変更があった場合のみコミット・プッシュする
              if ! git diff --staged --quiet; then
                git commit -m "Update prompts.json from Google Sheet"
                git push
              else
                echo "No changes to commit."
              fi
    ```

---

## Step 5: 動作確認

1.  **手動実行**
    *   リポジトリの「Actions」タブに移動し、「Sync Google Sheet to JSON」ワークフローを選択します。
    *   「Run workflow」ボタンをクリックして、手動でワークフローを実行します。

2.  **結果の確認**
    *   ワークフローがエラーなく完了することを確認します。
    *   `docs/prompts.json` ファイルがリポジトリにコミットされていることを確認します。
    *   GitHub PagesのURL (`https://<username>.github.io/<repository>/prompts.json`) にアクセスし、JSONデータが表示されることを確認します。

以上で、v6.0.0のアーキテクチャのセットアップは完了です。
