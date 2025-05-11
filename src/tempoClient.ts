import axios from "axios";
import { SpanStatusCode } from "@opentelemetry/api";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

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
    start?: number;
    end?: number;
    traceQL?: string;
  }): Promise<TraceResponse[]> {
    try {
      let traceQLQuery = "";
      
      // ユーザーが直接TraceQLクエリを指定した場合はそれを使用
      if (query.traceQL) {
        traceQLQuery = query.traceQL;
      } else {
        // サービス名の条件を追加
        if (query.service) {
          traceQLQuery += `{ resource.service.name = "${query.service}" }`;
        }
        
        // タグの条件を追加
        if (query.tags && Object.keys(query.tags).length > 0) {
          Object.entries(query.tags).forEach(([key, value]) => {
            // 既存のクエリがある場合は AND 条件で追加
            if (traceQLQuery) {
              traceQLQuery += ` && `;
            }
            traceQLQuery += `{ ${key} = "${value}" }`;
          });
        }
      }
      
      const params = new URLSearchParams();
      if (traceQLQuery) {
        params.append("q", traceQLQuery);
      }
      
      if (query.start) {
        params.append("start", String(query.start));
      }
      if (query.end) {
        params.append("end", String(query.end));
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
