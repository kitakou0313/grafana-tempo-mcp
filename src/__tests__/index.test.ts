import axios from 'axios';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { SpanStatusCode } from '@opentelemetry/api';
import { TempoClient } from '../tempoClient.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// axiosをモック
vi.mock('axios', () => {
  return {
    default: {
      get: vi.fn(),
      isAxiosError: vi.fn((error: any) => !!error.isAxiosError)
    }
  };
});

// モック用の変数
const mockedAxios = axios;


// テスト用のデータ
const mockTraceResponse = {
  batches: [
    {
      resourceSpans: [
        {
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: 'test-service' } }
            ]
          },
          scopeSpans: [
            {
              spans: [
                {
                  traceId: 'test-trace-id',
                  spanId: 'test-span-id',
                  parentSpanId: '',
                  name: 'test-span',
                  kind: 1,
                  startTimeUnixNano: '1617000000000000000',
                  endTimeUnixNano: '1617000001000000000',
                  attributes: [
                    { key: 'http.method', value: { stringValue: 'GET' } }
                  ],
                  status: {
                    code: SpanStatusCode.OK
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

const mockSearchResponse = {
  traces: [mockTraceResponse]
};

describe('TempoClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTraceById', () => {
    it('正常にトレースを取得できること', async () => {
      // axiosのモックを設定
      (mockedAxios.get as any).mockResolvedValueOnce({ data: mockTraceResponse });

      const tempoClient = new TempoClient('http://localhost:3200');
      const result = await tempoClient.getTraceById('test-trace-id');

      // axiosが正しいURLで呼び出されたことを確認
      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3200/api/traces/test-trace-id');
      
      // 結果が期待通りであることを確認
      expect(result).toEqual(mockTraceResponse);
    });

    it('エラー時にMcpErrorをスローすること', async () => {
      // axiosのモックを設定してエラーをスロー
      const axiosError = new Error('Network Error');
      (axiosError as any).isAxiosError = true;
      (mockedAxios.get as any).mockRejectedValueOnce(axiosError);
      (mockedAxios.isAxiosError as any).mockReturnValue(true);

      const tempoClient = new TempoClient('http://localhost:3200');
      
      // McpErrorがスローされることを確認
      await expect(tempoClient.getTraceById('test-trace-id')).rejects.toThrow(McpError);
      await expect(tempoClient.getTraceById('test-trace-id')).rejects.toMatchObject({
        code: ErrorCode.InternalError,
        message: expect.stringContaining('Failed to fetch trace')
      });
    });
  });

  describe('searchTraces', () => {
    it('サービス名でトレースを検索できること', async () => {
      // axiosのモックを設定
      (mockedAxios.get as any).mockResolvedValueOnce({ data: mockSearchResponse });

      const tempoClient = new TempoClient('http://localhost:3200');
      const result = await tempoClient.searchTraces({ service: 'test-service' });

      // axiosが正しいURLで呼び出されたことを確認
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3200/api/search?service=test-service')
      );
      
      // 結果が期待通りであることを確認
      expect(result).toEqual(mockSearchResponse.traces);
    });

    it('タグでトレースを検索できること', async () => {
      // axiosのモックを設定
      (mockedAxios.get as any).mockResolvedValueOnce({ data: mockSearchResponse });

      const tempoClient = new TempoClient('http://localhost:3200');
      const result = await tempoClient.searchTraces({ 
        service: 'test-service',
        tags: { 'http.method': 'GET' }
      });

      // axiosが正しいURLで呼び出されたことを確認
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/http:\/\/localhost:3200\/api\/search\?.*service=test-service.*tags=http.method%3DGET/)
      );
      
      // 結果が期待通りであることを確認
      expect(result).toEqual(mockSearchResponse.traces);
    });

    it('時間範囲でトレースを検索できること', async () => {
      // axiosのモックを設定
      (mockedAxios.get as any).mockResolvedValueOnce({ data: mockSearchResponse });

      const tempoClient = new TempoClient('http://localhost:3200');
      const result = await tempoClient.searchTraces({ 
        service: 'test-service',
        start: '2023-01-01T00:00:00Z',
        end: '2023-01-02T00:00:00Z'
      });

      // axiosが正しいURLで呼び出されたことを確認
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/http:\/\/localhost:3200\/api\/search\?.*service=test-service.*start=2023-01-01T00%3A00%3A00Z.*end=2023-01-02T00%3A00%3A00Z/)
      );
      
      // 結果が期待通りであることを確認
      expect(result).toEqual(mockSearchResponse.traces);
    });

    it('エラー時にMcpErrorをスローすること', async () => {
      // axiosのモックを設定してエラーをスロー
      const axiosError = new Error('Network Error');
      (axiosError as any).isAxiosError = true;
      (mockedAxios.get as any).mockRejectedValueOnce(axiosError);
      (mockedAxios.isAxiosError as any).mockReturnValue(true);

      const tempoClient = new TempoClient('http://localhost:3200');
      
      // McpErrorがスローされることを確認
      await expect(tempoClient.searchTraces({ service: 'test-service' })).rejects.toThrow(McpError);
      await expect(tempoClient.searchTraces({ service: 'test-service' })).rejects.toMatchObject({
        code: ErrorCode.InternalError,
        message: expect.stringContaining('Failed to search traces')
      });
    });
  });
});
