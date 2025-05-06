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
import { get_trace } from "./tools.js";

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

    const traces = await tempoClient.searchTraces({
      start: startTimeUnixTime,
      end: endTimeUnixTime,
    });

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(traces, null, 2),
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
        const service = String(request.params.arguments?.service);
        const tags = request.params.arguments?.tags as Record<string, string> | undefined;
        const traces = await tempoClient.searchTraces({ service, tags });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(traces, null, 2),
            },
          ],
        };
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
