#!/usr/bin/env node

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
import axios from "axios";
import { SpanStatusCode } from "@opentelemetry/api";

const TEMPO_URL = process.env.TEMPO_URL || "http://localhost:3200";

interface TraceResponse {
  batches: {
    resourceSpans: {
      resource: {
        attributes: { key: string; value: { stringValue: string } }[];
      };
      scopeSpans: {
        spans: {
          traceId: string;
          spanId: string;
          parentSpanId: string;
          name: string;
          kind: number;
          startTimeUnixNano: string;
          endTimeUnixNano: string;
          attributes: { key: string; value: { stringValue: string } }[];
          status: {
            code: SpanStatusCode;
            message?: string;
          };
        }[];
      }[];
    }[];
  }[];
}

export class TempoClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getTraceById(traceId: string): Promise<TraceResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/traces/${traceId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to fetch trace: ${error.message}`
        );
      }
      throw error;
    }
  }

  async searchTraces(query: { 
    service?: string; 
    tags?: Record<string, string>;
    start?: string;
    end?: string;
  }): Promise<TraceResponse[]> {
    try {
      const params = new URLSearchParams();
      if (query.service) {
        params.append("service", query.service);
      }
      if (query.tags) {
        Object.entries(query.tags).forEach(([key, value]) => {
          params.append("tags", `${key}=${value}`);
        });
      }
      if (query.start) {
        params.append("start", query.start);
      }
      if (query.end) {
        params.append("end", query.end);
      }

      const response = await axios.get(`${this.baseUrl}/api/search?${params.toString()}`);
      return response.data.traces || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to search traces: ${error.message}`
        );
      }
      throw error;
    }
  }
}

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
        description: "開始時刻と終了時刻を指定してトレースを取得",
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

  const [, start, end] = match;
  const traces = await tempoClient.searchTraces({
    start: decodeURIComponent(start),
    end: decodeURIComponent(end),
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

server.setRequestHandler(ListToolsRequestSchema, async () => {
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
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "get_trace": {
      const traceId = String(request.params.arguments?.traceId);
      const trace = await tempoClient.getTraceById(traceId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(trace, null, 2),
          },
        ],
      };
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Tempo MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
