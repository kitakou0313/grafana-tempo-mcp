#!/usr/bin/env python3
import os
import sys
import json
import requests
from datetime import datetime
from modelcontextprotocol import Server, StdioServerTransport

class TempoMCPServer:
    def __init__(self):
        self.server = Server(
            {
                "name": "tempo-trace-server",
                "version": "0.1.0"
            },
            {
                "capabilities": {
                    "resources": {},
                    "tools": {}
                }
            }
        )
        self.setup_tool_handlers()

    def setup_tool_handlers(self):
        # トレースデータ取得ツールのハンドラーを設定
        self.server.set_request_handler(
            "list_tools",
            self.list_tools
        )
        
        self.server.set_request_handler(
            "call_tool",
            self.call_tool
        )

    def list_tools(self, request):
        return {
            "tools": [
                {
                    "name": "get_traces",
                    "description": "Grafana Tempoからトレースデータを取得",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "service_name": {
                                "type": "string",
                                "description": "トレースを取得するサービス名"
                            },
                            "start_time": {
                                "type": "string",
                                "description": "開始時刻（ISO 8601形式）"
                            },
                            "end_time": {
                                "type": "string",
                                "description": "終了時刻（ISO 8601形式）"
                            }
                        },
                        "required": ["service_name", "start_time", "end_time"]
                    }
                }
            ]
        }

    def call_tool(self, request):
        if request.get("name") != "get_traces":
            return {
                "content": [{"type": "text", "text": "Unknown tool"}],
                "isError": True
            }

        try:
            args = request.get("arguments", {})
            service_name = args.get("service_name")
            start_time = args.get("start_time")
            end_time = args.get("end_time")

            # Tempoからトレースデータを取得
            traces = self.fetch_traces(service_name, start_time, end_time)

            return {
                "content": [
                    {
                        "type": "text",
                        "text": json.dumps(traces, indent=2)
                    }
                ]
            }
        except Exception as e:
            return {
                "content": [{"type": "text", "text": str(e)}],
                "isError": True
            }

    def fetch_traces(self, service_name, start_time, end_time):
        # Tempoのエンドポイントにリクエスト
        url = f"http://localhost:8080/api/traces"
        params = {
            "service": service_name,
            "start": start_time,
            "end": end_time
        }

        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()

    async def run(self):
        transport = StdioServerTransport()
        await self.server.connect(transport)
        print("Tempo MCP Server running", file=sys.stderr)

def main():
    import asyncio
    server = TempoMCPServer()
    asyncio.run(server.run())

if __name__ == "__main__":
    main()
