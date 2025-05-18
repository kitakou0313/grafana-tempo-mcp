import { text } from "stream/consumers";
import { TempoClient } from "./tempoClient.js";
import { convertDateToUnixTime } from "./utils/utils.js";

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

async function search_traces(serviceName: string, tags: Record<string, string> | undefined, start: string, end: string, traceQL: string | undefined, tempoClient: TempoClient) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // 日付が無効な場合はエラーを投げる
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date format. Please use ISO 8601 format (e.g. 2023-01-01T00:00:00Z)");
    }
    
    const startUnixTime = Math.floor(startDate.getTime() / 1000);
    const endUnixTime = Math.floor(endDate.getTime() / 1000);
    
    // TraceQLクエリが指定されている場合は、それを使用
    // そうでない場合は、サービス名とタグから検索条件を生成
    let query: any = {
        start: startUnixTime,
        end: endUnixTime
    };
    
    if (traceQL) {
        // TraceQLクエリが直接指定されている場合
        query.traceQL = traceQL;
    } else if (serviceName) {
        // 従来の方法でサービス名とタグを指定
        query.service = serviceName;
        if (tags && Object.keys(tags).length > 0) {
            query.tags = tags;
        }
    }
    
    const traces = await tempoClient.searchTraces(query);

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(traces, null)
            }
        ]
    }
}

/**
 * TraceQL Metrics APIを使用してメトリクスを取得する
 * @param query TraceQLメトリクスクエリ
 * @param start 開始時間（ISO 8601形式）
 * @param end 終了時間（ISO 8601形式）
 * @param since 相対的な時間範囲（例：15m）
 * @param step 時系列データの粒度（例：15s）
 * @param exemplars 最大エグゼンプラー数
 * @param tempoClient TempoClientインスタンス
 * @returns メトリクスデータ
 */
async function get_traceql_metrics(
    query: string,
    start: string | undefined,
    end: string | undefined,
    since: string | undefined,
    step: string | undefined,
    exemplars: number | undefined,
    tempoClient: TempoClient
) {
    // クエリパラメータの準備
    const params: {
        q: string;
        start?: number | string;
        end?: number | string;
        since?: string;
        step?: string;
        exemplars?: number;
    } = {
        q: query
    };

    // 絶対時間範囲（start/end）が指定されている場合
    if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        // 日付が無効な場合はエラーを投げる
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error("Invalid date format. Please use ISO 8601 format (e.g. 2023-01-01T00:00:00Z)");
        }
        
        params.start = convertDateToUnixTime(startDate);
        params.end = convertDateToUnixTime(endDate);
    } 
    // 相対時間範囲（since）が指定されている場合
    else if (since) {
        params.since = since;
    }
    
    // オプションパラメータの設定
    if (step) {
        params.step = step;
    }
    
    if (exemplars) {
        params.exemplars = exemplars;
    }
    
    // APIを呼び出してメトリクスを取得
    const metrics = await tempoClient.getTraceQLMetrics(params);
    
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(metrics, null)
            }
        ]
    };
}

export {
    get_trace,
    search_traces,
    get_traceql_metrics
}
