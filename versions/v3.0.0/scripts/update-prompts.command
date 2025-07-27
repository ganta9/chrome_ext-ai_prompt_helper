#!/bin/bash

# スクリプトがあるディレクトリに移動
cd "$(dirname "$0")"

echo "============================================"
echo "  AI Prompt Helper - Auto Update Script"
echo "============================================"
echo

# Node.jsがインストールされているかチェック
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js がインストールされていません"
    echo "Node.js をインストールしてください: https://nodejs.org/"
    echo
    read -p "Enterキーを押して終了してください..."
    exit 1
fi

# スクリプト実行
echo "プロンプトファイルを自動スキャンしています..."
echo

node update-prompts.js

echo
echo "完了しました。Enterキーを押して終了してください。"
read -p ""