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
                description: "TraceQLクエリ（直接指定する場合）。指定した場合はserviceとtagsは無視されます。",
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
      ],
    }
}

export {
  listTools
}
