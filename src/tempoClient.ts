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