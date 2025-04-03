# 技術コンテキスト

## 開発環境
- 言語: TypeScript
- ランタイム: Node.js
- 通信プロトコル: Stdio
- HTTPクライアント: Axios

## 主要依存関係
- @modelcontextprotocol/sdk: MCPサーバー実装のためのSDK
- axios: HTTPリクエスト用クライアント
- @opentelemetry/api: トレーシングデータ型定義

## 環境変数
- `TEMPO_URL`: TempoサーバーのベースURL
  - デフォルト: `http://localhost:3200`

## APIインテグレーション
- Grafana Tempoトレーシングバックエンド
  - `/api/traces/{traceId}`: 特定のトレースIDによるトレース取得
  - `/api/search`: サービス名やタグによるトレース検索

## データ構造
- TraceResponse: トレースデータの構造
  - batches, resourceSpans, scopeSpans, spans
  - 属性、タイムスタンプ、ステータス情報

## ビルドと開発ワークフロー
- `npm install`: 依存関係のインストール
- `npm run build`: TypeScriptのコンパイル
- `npm run watch`: 開発用の自動再ビルド
- `npm run inspector`: MCPインスペクターによるデバッグ

## デプロイメント
- Claude Desktopとの統合
- 設定ファイルによるサーバー登録
  - MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Windows: `%APPDATA%/Claude/claude_desktop_config.json`

## エラーハンドリング
- カスタムMCPエラー型
- HTTPエラー変換
- 詳細なエラーログ

## パフォーマンス考慮事項
- 軽量なHTTPクライアント
- 最小限のオーバーヘッド
- 効率的なトレース検索
