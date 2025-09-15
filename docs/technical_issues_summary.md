# Chrome拡張機能 AI Prompt Helper - 技術課題総合分析書

## 📋 プロジェクト概要

### 🎯 プロジェクトの目的
ChatGPT、Claude、Google Gemini等のAIチャットサイトで、事前に準備したプロンプトテンプレートを簡単に挿入できるChrome拡張機能の開発。

### 🏗️ 目標アーキテクチャ（外部連携型）
```
[Googleスプレッドシート] ←→ [Google Apps Script API] ←→ [GitHub Pages 編集サイト]
                                        ↓
                              [Chrome拡張機能] → [AIサイト]
```

**データフロー:**
1. **データ管理**: Googleスプレッドシートでプロンプトを一元管理
2. **編集操作**: GitHub Pages上のSPAでプロンプトの追加・編集・削除
3. **同期機能**: Chrome拡張機能で「更新」ボタンを押してローカルキャッシュに同期
4. **利用機能**: AIサイト上で拡張機能ボタンからプロンプトを選択・挿入

## 🚨 現在発生している技術課題

### 1. CORS制約による API アクセス不可能

**問題:**
- Chrome拡張機能からGoogle Apps Script APIへの直接アクセスが `CORS policy` により拒否される
- `fetch()` を使用した通信が HTTP 404 エラーで失敗

**技術詳細:**
```javascript
// 失敗パターン
const response = await fetch(gasUrl, {
    method: 'GET',
    mode: 'cors'  // ← Google Apps ScriptがCORSを許可していない
});
// 結果: HTTP 404 Error
```

**検証済み事実:**
- 接続テスト（`mode: 'no-cors'`）は成功 → ネットワーク接続は正常
- プロンプト更新（`mode: 'cors'`）は失敗 → CORS制限でレスポンス取得不可

### 2. Chrome拡張機能のCSP制約

**問題:**
- JSONP形式でのAPI呼び出しが Content Security Policy により拒否される
- 動的スクリプト生成（`document.createElement('script')`）がブロックされる

**エラーメッセージ:**
```
Refused to load the script 'https://script.google.com/...' because it violates the following
Content Security Policy directive: "script-src 'self'"
```

**現在のCSP設定:**
```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
}
```

### 3. 過去の実装失敗履歴

**Service Worker実装の完全失敗（v6.0.0）:**
- Service Worker環境でDOM操作不可 → JSONP実装不可能
- ストレージキー不統一（`gas-url` vs `gasUrl`）
- 300行以上のコードが実行不可能で完全破綻

**CSP設定変更の失敗:**
- 複数回のCSP設定変更試行 → すべて拒否される
- `'unsafe-inline'` 追加 → Chrome拡張機能自体が読み込み不可

## 🔍 制約条件の整理

### Chrome拡張機能 Manifest V3 制約
1. **Service Worker制限**: DOM、Clipboard API、synchronous API不可用
2. **CSP制約**: `script-src 'self'` が推奨、外部ドメイン追加は困難
3. **CORS制約**: 外部APIへの直接アクセス制限

### Google Apps Script制約
1. **CORS制限**: Chrome拡張機能からの `mode: 'cors'` リクエスト拒否
2. **認証制約**: 匿名アクセス可能な設定でも制限が存在
3. **JSONP依存**: レスポンス取得にはJSONP形式が必要

### GitHub Pages制約
1. **静的サイト制限**: サーバーサイド処理不可
2. **API制限**: プロキシ機能やCORS header追加不可
3. **リアルタイム制限**: 動的データ生成機能なし

## 💡 検討された解決策と評価

### 解決策1: CSP設定緩和 + JSONP実装
**アプローチ:**
```json
"content_security_policy": {
  "extension_pages": "script-src 'self' 'unsafe-eval'; object-src 'self'"
}
```

**評価:**
- ❌ Chrome が「Insecure CSP value」として拒否
- ❌ セキュリティリスクの増大
- ❌ Manifest V3の方針に反する

### 解決策2: fetch() API使用
**アプローチ:**
```javascript
const response = await fetch(gasUrl, { mode: 'cors' });
```

**評価:**
- ❌ Google Apps ScriptのCORS制限で HTTP 404
- ❌ レスポンス内容取得不可能
- ❌ 根本的に技術的実現不可

### 解決策3: GitHub Pages経由のデータ取得（推奨案）
**アプローチ:**
```javascript
// Chrome拡張機能がGitHub Pagesの静的JSONを読み込み
const response = await fetch(githubPagesUrl + '/data/prompts.json');
const data = await response.json();
```

**実装方法:**
1. GitHub Pages の script.js でGoogle Apps Scriptから定期的にデータ取得
2. 取得データを静的JSONファイルとして出力
3. Chrome拡張機能はGitHub PagesのJSONファイルを読み込み

**評価:**
- ✅ CORS制限を完全回避
- ✅ CSP制約に抵触しない
- ✅ 既存のGitHub Pages実装を活用可能
- ⚠️ リアルタイム同期ではない（定期更新）

## 🎯 現在の実装状況

### 実装済み機能
1. **Google Apps Script API**: 完全実装（getPrompts, addPrompt, updatePrompt, deletePrompt）
2. **GitHub Pages編集サイト**: プロンプト管理UI完全実装
3. **Chrome拡張機能**: 基本機能実装済み（プロンプト挿入、UI等）
4. **AIサイト対応**: 9サイト対応（ChatGPT, Claude.ai, Gemini等）

### 未解決の技術課題
1. **Chrome拡張機能 ↔ Google Apps Script**: API通信不可能
2. **プロンプトデータ同期**: 手動更新機能が動作しない
3. **外部連携アーキテクチャ**: 根本的に実現困難

## 🔧 提案する解決アプローチ

### Phase 1: GitHub Pages静的JSON生成機能
1. GitHub Pages側でGoogle Apps Script APIを定期呼び出し
2. プロンプトデータをJSONファイルとして静的生成
3. Chrome拡張機能の読み込み先を静的JSONに変更

### Phase 2: データ同期最適化
1. GitHub Pages編集時の自動JSON更新
2. Chrome拡張機能での効率的なキャッシュ管理
3. 編集 → 同期の流れの自動化

### Phase 3: 運用安定化
1. エラーハンドリングの強化
2. オフライン動作の対応
3. パフォーマンス最適化

## 📊 想定される課題と対策

### 技術的課題
1. **GitHub Actions依存**: 静的JSON生成にCI/CD必要 → 代替: クライアント側生成
2. **更新遅延**: リアルタイム同期不可 → 代替: 適切な更新間隔設定
3. **データ整合性**: 複数同時編集時の競合 → 代替: 編集権限管理

### 運用課題
1. **設定複雑化**: 複数システム連携 → 代替: セットアップガイド整備
2. **障害分離困難**: 複数ポイント障害 → 代替: 段階的障害診断機能

## 🎯 最終的な技術選択の推奨

**推奨アーキテクチャ:**
```
[Googleスプレッドシート] ←→ [Google Apps Script] ←→ [GitHub Pages]
                                                      ↓ (静的JSON出力)
                                          [Chrome拡張機能] → [AIサイト]
```

**理由:**
1. 既存制約を全て回避可能
2. 実装済み機能の最大活用
3. 段階的実装が可能
4. 将来的な拡張性を維持

この方向での実装検討をお願いいたします。

---

**作成日**: 2025-09-15
**対象**: Gemini AI 技術コンサルテーション
**目的**: Chrome拡張機能開発における技術課題解決のための外部意見取得

---

## 📝 2025-09-15 追記: プロジェクトファイル構造の整理とGitHub同期機能の実装

### 1. プロジェクトファイル構造の整理

プロジェクト内のファイルが散在し、重複している状態を解消するため、以下の整理を行いました。

*   **新しいディレクトリの作成:**
    *   `docs/`: すべてのドキュメントファイルをここに集約。
    *   `gas/`: Google Apps Scriptのコードをここに集約。
*   **ファイルの移動と削除:**
    *   ルートディレクトリ直下の重複ファイル（`content.js`, `popup.html`, `popup.js`, `icon*.png`, `style.css`, `styles.css`, `index.html`, `script.js`）を削除。
    *   ルートディレクトリ直下のドキュメントファイル（`CLAUDE.md`, `fails.md`, `project_analysis_report.md`, `README.md`, `setup-instructions.md`, `spec.md`, `VERSION_INFO.md`）を`docs/`に移動。
    *   既存の`claudedocs/`と`project-docs/`ディレクトリの内容を`docs/`に統合し、元のディレクトリは削除。
    *   `google-apps-script.js`を`gas/google-apps-script.js`に移動。
*   **`manifest.json`のパス修正:**
    *   ファイルの移動に伴い、`manifest.json`内で参照されているパスを以下のように修正しました。
        *   `content_scripts.js`: `"src/content.js"`
        *   `content_scripts.css`: `"src/styles.css"`
        *   `action.default_popup`: `"src/popup.html"`
        *   `icons`: `"icons/icon16.png"`, `"icons/icon48.png"`, `"icons/icon128.png"`

### 2. Chrome拡張機能からのGitHub同期機能の実装

Chrome拡張機能からGoogle Apps Script (GAS) を介してGitHubリポジトリの`data/prompts.json`を更新する機能を追加しました。

*   **`src/popup.html`の修正:**
    *   ヘッダーの下に、GitHub同期ボタン（`id="syncPromptsToGitHubButton"`）を追加。
*   **`src/popup.js`の修正:**
    *   GASウェブアプリのURLを設定するための`GAS_API_URL`定数を追加。
    *   `syncPromptsToGitHubButton`のクリックイベントリスナーを追加。
    *   `syncPromptsToGitHub()`非同期関数を実装。この関数はGAS APIに`POST`リクエストを送信し、`action: 'syncToGitHub'`をトリガーします。
*   **`gas/google-apps-script.js`の修正:**
    *   GitHubリポジトリ情報（オーナー名、リポジトリ名、ファイルパス）の定数を追加。
    *   `updateGitHubPromptsJson()`関数を追加。この関数はスプレッドシートからプロンプトデータを取得し、GitHub APIを介して`data/prompts.json`を更新します。
    *   `doPost()`関数に`action: 'syncToGitHub'`を追加し、`updateGitHubPromptsJson()`を呼び出すように修正。

### 3. 今後の作業について

この機能を利用するためには、以下のユーザー側の作業が必要です。

1.  **GASウェブアプリのURLを`src/popup.js`に設定する:**
    *   `src/popup.js`を開き、`const GAS_API_URL = 'YOUR_GAS_WEB_APP_URL_HERE';` の部分を、あなたがデプロイしたGASウェブアプリのURLに置き換えてください。
2.  **Chrome拡張機能をリロードする:**
    *   Chromeブラウザで拡張機能管理ページ（`chrome://extensions`）を開き、「AI Prompt Helper」拡張機能のカードにある「更新」ボタンをクリックして、変更を適用します。
3.  **GASプロジェクトのデプロイとPATの設定:**
    *   `gas/google-apps-script.js`のコードをGASプロジェクトにコピーし、GitHub Personal Access Token (PAT) をスクリプトプロパティに設定後、Webアプリとしてデプロイしてください。

これらの設定が完了すると、Chrome拡張機能のポップアップに「GitHubに同期」ボタンが表示され、クリックするとGASを介してGitHubリポジトリの`data/prompts.json`が更新されるはずです。

---

**作成日**: 2025-09-15
**対象**: Gemini AI 技術コンサルテーション
**目的**: Chrome拡張機能開発における技術課題解決のための外部意見取得