FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

USER node
WORKDIR /home/node
RUN wget https://raw.githubusercontent.com/kitakou0313/dotfiles/main/installer.sh && chmod 777 installer.sh
RUN bash installer.sh