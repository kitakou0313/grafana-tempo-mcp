import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TempoClient } from "./tempoClient.js";
import { listTools } from "./handlers.js";
import { convertDateToUnixTime } from "./utils/utils.js";
import { get_trace, search_traces, get_traceql_metrics } from "./tools.js";

const TEMPO_URL = process.env.TEMPO_URL || "http://tempo:3200";


async function main() {
  const tempoClient = new TempoClient(TEMPO_URL);

  const server = new Server(
    {
      name: "tempo-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return {
      resourceTemplates: [
        {
          uriTemplate: "tempo://traces/{start}/{end}",
          name: "指定時間範囲のトレース",
          description: "開始時刻と終了時刻を指定してトレースを取得する 時間はISO 8601 formatで指定する必要がある",
          mimeType: "application/json",
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const match = request.params.uri.match(/^tempo:\/\/traces\/([^/]+)\/([^/]+)$/);
    if (!match) {
      throw new McpError(ErrorCode.InvalidRequest, `Invalid URI format: ${request.params.uri}`);
    }

    // Date型に変換できない場合はエラーとする

    const [, start, end] = match;
    const startDate = new Date(decodeURIComponent(start))
    const endData = new Date(decodeURIComponent(end))

    const startTimeUnixTime = convertDateToUnixTime(startDate)
    const endTimeUnixTime = convertDateToUnixTime(endData)

    // TraceQLを使用して検索
    const traces = await tempoClient.searchTraces({
      start: startTimeUnixTime,
      end: endTimeUnixTime,
      // 時間範囲のみの検索なので、空のTraceQLクエリを指定
      traceQL: ""
    });

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(traces, null),
        },
      ],
    };
  });

  server.setRequestHandler(ListToolsRequestSchema, listTools);

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
      case "get_trace": {
        const traceId = String(request.params.arguments?.traceId);
        const trace = await get_trace(traceId, tempoClient)
        return trace;
      }

      case "search_traces": {
        const service = request.params.arguments?.service ? String(request.params.arguments.service) : undefined;
        const tags = request.params.arguments?.tags as Record<string, string> | undefined;
        const traceQL = request.params.arguments?.traceQL ? String(request.params.arguments.traceQL) : undefined;
        const start = String(request.params.arguments?.start);
        const end = String(request.params.arguments?.end);
        
        const result = await search_traces(service || "", tags, start, end, traceQL, tempoClient);
        
        return result;
      }
      
      case "get_traceql_metrics": {
        const query = String(request.params.arguments?.query);
        const start = request.params.arguments?.start ? String(request.params.arguments.start) : undefined;
        const end = request.params.arguments?.end ? String(request.params.arguments.end) : undefined;
        const since = request.params.arguments?.since ? String(request.params.arguments.since) : undefined;
        const step = request.params.arguments?.step ? String(request.params.arguments.step) : undefined;
        const exemplars = request.params.arguments?.exemplars ? Number(request.params.arguments.exemplars) : undefined;
        
        const result = await get_traceql_metrics(query, start, end, since, step, exemplars, tempoClient);
        
        return result;
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, "Unknown tool");
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Tempo MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
