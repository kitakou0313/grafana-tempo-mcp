# System Patterns

## Architecture
- Grafana Tempo トレース管理 MCP サーバー
- TypeScript実装
- Stdio通信プロトコル
- Axios経由のHTTPクライアント

## コアコンポーネント
- Tempoクライアントクラスによるトレース管理
  - トレースIDによる個別トレース取得
  - サービスとタグによるトレース検索
- MCPサーバー設定
  - リソーステンプレート
  - ツール定義
  - リクエストハンドラー

## 通信パターン
- Stdio経由のMCP通信
- HTTPベースのTempoバックエンド連携
- エラーハンドリングとMCPエラー型の使用

## リソース管理
- `tempo://traces/{start}/{end}` URIテンプレート
- 時間範囲指定によるトレース取得
- JSONレスポンス形式

## ツール
- `get_trace`: 特定のトレースIDによるトレース取得
- `search_traces`: サービスやタグによるトレース検索

## エラーハンドリング
- カスタムMCPエラー
- Axiosエラー変換
- 詳細なエラーメッセージ提供
