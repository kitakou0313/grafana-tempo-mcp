#!/bin/bash

# Grafana Tempoにトレースを送信するスクリプト

# スクリプトの使用方法を表示する関数
show_usage() {
  echo "使用方法: $0 [オプション]"
  echo ""
  echo "オプション:"
  echo "  -h, --help                ヘルプメッセージを表示"
  echo "  -p, --protocol <proto>    使用するプロトコル (grpc または http) (デフォルト: grpc)"
  echo "  -t, --traces <num>        生成するトレースの数 (デフォルト: 10)"
  echo "  -c, --child-spans <num>   各トレースの子スパンの数 (デフォルト: 5)"
  echo "  -w, --workers <num>       ワーカー数 (デフォルト: 2)"
  echo "  -s, --service <name>      サービス名 (デフォルト: test-service)"
  echo "  -d, --duration <duration> 実行時間 (例: 10s, 1m) (指定すると -t は無視されます)"
  echo ""
  echo "例:"
  echo "  $0 --protocol http --traces 20 --child-spans 10 --service my-app"
  echo "  $0 --duration 30s --workers 5"
}

# デフォルト値
PROTOCOL="grpc"
TRACES=10
CHILD_SPANS=5
WORKERS=2
SERVICE="test-service"
DURATION=""

# コマンドライン引数の解析
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_usage
      exit 0
      ;;
    -p|--protocol)
      PROTOCOL="$2"
      shift 2
      ;;
    -t|--traces)
      TRACES="$2"
      shift 2
      ;;
    -c|--child-spans)
      CHILD_SPANS="$2"
      shift 2
      ;;
    -w|--workers)
      WORKERS="$2"
      shift 2
      ;;
    -s|--service)
      SERVICE="$2"
      shift 2
      ;;
    -d|--duration)
      DURATION="$2"
      shift 2
      ;;
    *)
      echo "エラー: 不明なオプション $1"
      show_usage
      exit 1
      ;;
  esac
done

# プロトコルの検証
if [[ "$PROTOCOL" != "grpc" && "$PROTOCOL" != "http" ]]; then
  echo "エラー: プロトコルは 'grpc' または 'http' である必要があります"
  exit 1
fi

# エンドポイントの設定
if [[ "$PROTOCOL" == "grpc" ]]; then
  ENDPOINT="tempo:4317"
  HTTP_FLAG=""
else
  ENDPOINT="tempo:4318"
  HTTP_FLAG="--otlp-http"
fi

# コマンドの構築
CMD="telemetrygen traces --otlp-insecure --otlp-endpoint $ENDPOINT $HTTP_FLAG --service ${SERVICE}-$`head /dev/urandom | tr -dc A-Za-z0-9 | head -c 16 ; echo` --child-spans $CHILD_SPANS --workers $WORKERS"

# 期間またはトレース数の設定
if [[ -n "$DURATION" ]]; then
  CMD="$CMD --duration $DURATION"
else
  CMD="$CMD --traces $TRACES"
fi

# 実行前の情報表示
echo "Grafana Tempoにトレースを送信します..."
echo "プロトコル: $PROTOCOL"
echo "エンドポイント: $ENDPOINT"
echo "サービス名: $SERVICE"
echo "子スパン数: $CHILD_SPANS"
echo "ワーカー数: $WORKERS"
if [[ -n "$DURATION" ]]; then
  echo "実行時間: $DURATION"
else
  echo "トレース数: $TRACES"
fi
echo ""
echo "コマンド: $CMD"
echo ""

# コマンドの実行
echo "トレース生成を開始します..."
eval $CMD

# 実行結果の確認
if [ $? -eq 0 ]; then
  echo "トレースの生成と送信が完了しました"
  echo "Grafana UI (http://localhost:3000) でトレースを確認できます"
else
  echo "エラー: トレースの生成中にエラーが発生しました"
  exit 1
fi
