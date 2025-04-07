#!/bin/bash

su - node

wget -P /workspaces https://raw.githubusercontent.com/kitakou0313/dotfiles/main/installer.sh
chmod 777 /workspaces/installer.sh 

bash /workspaces/installer.sh 

go install github.com/open-telemetry/opentelemetry-collector-contrib/cmd/telemetrygen@latest