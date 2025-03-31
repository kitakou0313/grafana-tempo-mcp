# python-remotedev-template
Visual Studio CodeのRemote developmentを用いてDocker container上で作業するためのテンプレート

## 起動手順
1. `.devcontainer/Dockerfile`最終行の`ENV PYTHONPATH=...`内の`/workspace/`以下をリポジトリ名に変更
    - リポジトリ内で定義したpackageを探索可能にするため

## ToDo
- unrootでのコンテナ起動
    - `.git`以下の所有権がrootになり、コンテナ外でcommitできないことがある
    - コンテナ外で作業しないのでいらないかも