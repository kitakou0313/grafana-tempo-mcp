# Grafana Tempo と Grafana のデプロイ

このリポジトリには、Docker Composeを使用してGrafana TempoとGrafanaをデプロイするための設定ファイルが含まれています。

## 構成

- `docker-compose.yml` - GrafanaとGrafana Tempoのコンテナ設定
- `tempo-config.yaml` - Tempoの設定ファイル
- `grafana-provisioning/` - Grafanaの自動設定ファイル

## 必要条件

- Docker
- Docker Compose

## 使用方法

### 起動方法

以下のコマンドを実行して、GrafanaとGrafana Tempoを起動します：

```bash
cd tempo
docker-compose up -d
```

### アクセス方法

- Grafana: http://localhost:3000
- Tempo API: http://localhost:3200

### トレースデータの送信

アプリケーションからOTLPプロトコルを使用して、以下のエンドポイントにトレースデータを送信できます：

- OTLP gRPC: localhost:4317

### Grafanaでのトレース表示

1. Grafanaにアクセス（http://localhost:3000）
2. Exploreセクションに移動
3. データソースとして「Tempo」を選択
4. トレースIDを入力して検索、または他の検索条件を使用

## 停止方法

```bash
cd tempo
docker-compose down
```

データを完全に削除する場合：

```bash
cd tempo
docker-compose down
rm -rf tempo-data grafana-data
```

## 注意事項

- このセットアップはデモンストレーション用です。本番環境では、セキュリティ設定やリソース設定を適切に行ってください。
- Tempoのデータは`tempo-data`ディレクトリに保存されます。
- Grafanaの設定は`grafana-data`ディレクトリに保存されます。
