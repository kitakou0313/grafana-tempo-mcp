import { text } from "stream/consumers";
import { TempoClient } from "./tempoClient.js";

async function get_trace(traceId: string, tempoClient: TempoClient) {
    const trace = await tempoClient.getTraceById(traceId)

    return {
        content : [
            {
                type: "text",
                text: JSON.stringify(trace, null)
            }
        ]
    }
}

async function search_traces(serviceName: string, tags: Record<string, string> | undefined, start: string, end: string, tempoClient: TempoClient) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // 日付が無効な場合はエラーを投げる
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date format. Please use ISO 8601 format (e.g. 2023-01-01T00:00:00Z)");
    }
    
    const startUnixTime = Math.floor(startDate.getTime() / 1000);
    const endUnixTime = Math.floor(endDate.getTime() / 1000);
    
    const traces = await tempoClient.searchTraces({
        service: serviceName, 
        tags: tags,
        start: startUnixTime,
        end: endUnixTime
    })

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(traces, null)
            }
        ]
    }
}

export {
    get_trace,
    search_traces
}
