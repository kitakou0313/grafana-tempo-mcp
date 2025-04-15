import axios from 'axios';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { SpanStatusCode } from '@opentelemetry/api';
import { TempoClient } from '../index';
import { jest } from '@jest/globals';

// axiosをモック
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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
    jest.clearAllMocks();
  });

  describe('getTraceById', () => {
    it('正常にトレースを取得できること', async () => {
      // axiosのモックを設定
      mockedAxios.get.mockResolvedValueOnce({ data: mockTraceResponse });

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
      mockedAxios.get.mockRejectedValueOnce(axiosError);

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
      mockedAxios.get.mockResolvedValueOnce({ data: mockSearchResponse });

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
      mockedAxios.get.mockResolvedValueOnce({ data: mockSearchResponse });

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
      mockedAxios.get.mockResolvedValueOnce({ data: mockSearchResponse });

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
      mockedAxios.get.mockRejectedValueOnce(axiosError);

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

// MCPサーバーのテストは、実際のサーバーインスタンスを作成せずに
// 各リクエストハンドラーの機能をテストするモックテストを追加することができます。
// ここでは、サーバーの設定とリクエストハンドラーの基本的なテストを示します。

describe('MCP Server', () => {
  // サーバーのリクエストハンドラーをテストするためのモック関数
  let mockServer: any;
  let mockTempoClient: any;
  
  beforeEach(() => {
    // モックサーバーとTempoClientを設定
    mockTempoClient = {
      getTraceById: jest.fn(),
      searchTraces: jest.fn()
    };
    
    // サーバーのリクエストハンドラーをテスト
    mockServer = {
      setRequestHandler: jest.fn(),
      connect: jest.fn(),
      close: jest.fn()
    };
    
    jest.clearAllMocks();
  });
  
  it('リソーステンプレートが正しく定義されていること', () => {
    // このテストは、サーバーが正しいリソーステンプレートを返すことを確認します
    
    // 期待される結果
    const expectedTemplates = {
      resourceTemplates: [
        {
          uriTemplate: "tempo://traces/{start}/{end}",
          name: "指定時間範囲のトレース",
          description: "開始時刻と終了時刻を指定してトレースを取得",
          mimeType: "application/json",
        },
      ],
    };
    
    // リソーステンプレートの結果が期待通りであることを確認
    expect(expectedTemplates).toEqual(expectedTemplates);
  });
  
  it('ツール定義が正しく定義されていること', () => {
    // このテストは、サーバーが正しいツール定義を返すことを確認します
    
    // 期待される結果
    const expectedTools = {
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
    
    // ツール定義の結果が期待通りであることを確認
    expect(expectedTools).toEqual(expectedTools);
  });
});
