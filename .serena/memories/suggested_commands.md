# 推奨コマンド集

## 基本的なファイル操作
```bash
# プロジェクト構造確認
ls -la versions/
ls -la versions/v5.0.0/

# ファイル内容確認
cat versions/v5.0.0/manifest.json
cat versions/v5.0.0/src/content.js

# 新バージョン作成
cp -r versions/v5.0.0 versions/v6.0.0
```

## 開発・テスト用コマンド
```bash
# Chrome拡張機能のリロード（開発中）
# chrome://extensions/ でデベロッパーモードを有効化後
# 「パッケージ化されていない拡張機能を読み込む」

# ログ確認（開発者ツール）
# F12 → Console タブでcontent.jsのログを確認
```

## Git関連コマンド
```bash
# 現在の状態確認
git status
git branch

# 変更内容確認  
git diff
git diff versions/v5.0.0/src/content.js

# コミット作成
git add .
git commit -m "適切なコミットメッセージ"
```

## プロジェクト管理
```bash
# バージョン情報確認
find versions/ -name "VERSION_INFO.md" -exec cat {} \;

# プロンプトファイル確認
find versions/v5.0.0/prompts/ -name "*.md" | head -10

# アイコンファイル確認
ls -la versions/v5.0.0/icons/
```

## macOS固有
```bash
# ファインダーで開く
open versions/v5.0.0/

# 隠しファイル表示切り替え
Command + Shift + .
```

## Chrome Extension開発
```bash
# マニフェストの妥当性確認
# chrome://extensions/ → パッケージ化 → エラーメッセージ確認

# 拡張機能の動作テスト
# 対象サイト (claude.ai, chatgpt.com等) でF12 → Consoleでログ確認
```