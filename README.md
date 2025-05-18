# tempo-server MCP Server

A Model Context Protocol server for Grafana Tempo trace management

## 概要

TypeScriptベースのMCPサーバーで、Grafana Tempoトレーシングシステムとの統合を提供します。主な機能：

- トレースデータのリソース管理
- トレース検索と取得のためのツール
- トレースデータの高度な分析

## 技術スタック

- **言語**: TypeScript
- **ランタイム**: Node.js
- **通信プロトコル**: Stdio
- **HTTPクライアント**: Axios

## 主要依存関係

- `@modelcontextprotocol/sdk`: MCPサーバー実装SDK
- `axios`: HTTPリクエスト用クライアント
- `@opentelemetry/api`: トレーシングデータ型定義

## 環境変数

- `TEMPO_URL`: TempoサーバーのベースURL
  - デフォルト: `http://tempo:3200`

## 機能

### リソース
- `trace://` URIを介したトレースデータへのアクセス
- トレースID、サービス名、タグによる詳細な検索
- 豊富なメタデータと属性情報

### ツール
- `get_trace`: トレースIDを指定してトレース情報を取得
  - 必須パラメータ: `traceId`
  - 特定のトレースの詳細な情報を取得

- `search_traces`: TraceQLを使用してトレースを検索
  - 必須パラメータ: `start`, `end`
  - オプションパラメータ:
    - `service`: サービス名による絞り込み
    - `tags`: タグによる検索
    - `traceQL`: 高度なクエリ言語による検索
    - 時間範囲の指定可能

- `get_traceql_metrics`: TraceQL Metrics APIを使用
  - 必須パラメータ: `query`
  - オプションパラメータ:
    - `start`, `end`: 時間範囲の指定
    - `since`: 相対的な時間範囲
    - `step`: 時系列データの粒度
    - `exemplars`: エグゼンプラーの最大数

### APIインテグレーション
- Grafana Tempoバックエンドとの緊密な連携
- TraceQLによる高度なトレース検索と分析
- メトリクス取得と時系列データの詳細な分析

## インストール

### Clineへのインストールの場合

```json
{
  "mcpServers": {
    "tempo-trace-server": {
      "command": "node",
      "args": ["/path/to/index.js"], // Buildされたindex.jsへのパス
      "env": {
        "TEMPO_URL": "http://localhost:3200" // Grafana tempoのAPIリクエストに用いるポート
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}

```

## デバッグ

MCPサーバーはstdioで通信するため、デバッグが難しい場合があります。[MCP Inspector](https://github.com/modelcontextprotocol/inspector)の使用を推奨:

```bash
npm run inspector
```