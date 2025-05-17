async function listTools() {
    return {
        tools: [
        {
          name: "get_trace",
          description: "トレースIDを指定してトレース情報を取得",
          inputSchema: {
            type: "object",
            properties: {
              traceId: {
                type: "string",
                description: "取得するトレースのID",
              },
            },
            required: ["traceId"],
          },
        },
        {
          name: "search_traces",
          description: "TraceQLを使用してトレースを検索",
          inputSchema: {
            type: "object",
            properties: {
              service: {
                type: "string",
                description: "検索対象のサービス名",
              },
              tags: {
                type: "object",
                description: "検索用のタグ（キーと値のペア）",
                additionalProperties: {
                  type: "string",
                },
              },
              traceQL: {
                type: "string",
                description: "TraceQLクエリ（直接指定する場合）。指定した場合はserviceとtagsは無視されます。URLのパスを指定したい場合, { span.http.target =~ \"/api/user/.*/reaction\"}のように指定できます",
              },
              start: {
                type: "string",
                description: "検索開始時刻（ISO 8601形式）",
              },
              end: {
                type: "string",
                description: "検索終了時刻（ISO 8601形式）",
              },
            },
            required: ["start", "end"],
          },
        },
        {
          name: "get_traceql_metrics",
          description: "TraceQL Metrics APIを使用してメトリクスを取得",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "TraceQL metricsのクエリ（例：'{ span.http.target =~ \"/api/user/.*/hoge\"} | histogram_over_time(duration)など",
              },
              start: {
                type: "string",
                description: "検索開始時刻（ISO 8601形式）- endと一緒に使用",
              },
              end: {
                type: "string",
                description: "検索終了時刻（ISO 8601形式）- startと一緒に使用",
              },
              since: {
                type: "string",
                description: "相対的な時間範囲（例：'15m'で過去15分）- start/endの代わりに使用可能",
              },
              step: {
                type: "string",
                description: "時系列データの粒度（例：'15s'で15秒ごとのデータポイント）",
              },
              exemplars: {
                type: "integer",
                description: "クエリの最大エグゼンプラー数",
              },
            },
            required: ["query"],
          },
        },
      ],
    }
}

export {
  listTools
}
