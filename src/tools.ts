import { text } from "stream/consumers";
import { TempoClient } from "./tempoClient.js";

async function get_trace(traceId: string, tempoClient: TempoClient) {
    const trace = await tempoClient.getTraceById(traceId)

    return {
        content : [
            {
                type: "text",
                text: JSON.stringify(trace, null, 2)
            }
        ]
    }
}

async function search_traces(serviceName: string, tags: Record<string, string> | undefined, tempoClient: TempoClient) {
    
    const traces = await tempoClient.searchTraces({service: serviceName, tags: tags})

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(traces, null, 2)
            }
        ]
    }
}

export {
    get_trace,
    search_traces
}