# 技術スタック詳細

## コア技術
- **Chrome Extension Manifest V3**
- **Vanilla JavaScript** (フレームワーク不使用)
- **CSS3** (レスポンシブ・ダークモード対応)
- **HTML5**

## 主要機能実装
### サイト検出システム
- `detectAISite()` - URL解析による AI サイト判定
- サイト別の最適化されたセレクター戦略

### DOM要素検出
- `findTextarea()` - サイト別入力欄検出
- `isViableTextarea()` - 実用的な入力欄判定
- `calculateTextareaScore()` - 入力欄適切度評価

### プロンプト管理
- フォルダベースの階層構造 (Ver5.0.0)
- 動的ファイルスキャン機能
- フォールバック用デフォルトプロンプト

### UI システム
- インライン式ドロップダウンメニュー
- 動的位置調整 (`updatePosition()`)
- レスポンシブデザイン対応

## ファイル構造
```
versions/v5.0.0/
├── manifest.json          # 拡張機能設定
├── src/
│   ├── content.js         # メインロジック
│   ├── styles.css         # スタイル定義
│   └── popup.html         # ポップアップUI
├── prompts/              # プロンプトデータ
│   ├── 001_本気モード/
│   └── 002_ワンショット/
├── icons/                # アイコンセット
└── docs/                 # ドキュメント
```

## 開発環境
- **OS**: macOS (Darwin)
- **Git**: バージョン管理
- **Chrome Extensions**: 開発・テスト環境