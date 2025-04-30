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
          description: "サービス名やタグでトレースを検索",
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
            },
            required: ["service"],
          },
        },
      ],
    }
}

export {
  listTools
}