# --- 1. Estágio de Construção (Builder) ---
# Usamos uma imagem Node completa para instalar todas as dependências, incluindo as de desenvolvimento
FROM node:18-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Diz ao Puppeteer (usado pelo node-html-to-image) para não baixar o Chrome.
# Nós vamos instalá-lo manualmente no estágio de produção.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copia os arquivos de definição de pacotes
COPY package*.json ./

# Instala TODAS as dependências (incluindo devDependencies como o 'prisma')
# Usamos 'npm install' aqui porque precisamos do Prisma CLI para o 'prisma generate'
RUN npm install

# Copia todo o resto do código-fonte do projeto
COPY . .

# Gera o cliente do Prisma, que é necessário para a aplicação se comunicar com o banco
RUN npx prisma generate

# Remove as dependências de desenvolvimento para limpar a pasta node_modules
# Deixando apenas o necessário para produção
RUN npm prune --production


# --- 2. Estágio de Produção (Final Image) ---
# Começamos de uma imagem Node limpa e leve
FROM node:18-alpine

# Instala as fontes DejaVu no estágio final para que estejam disponíveis para a aplicação
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-dejavu

# Diz ao Puppeteer onde encontrar o executável do Chromium
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium-browser"

# Define o diretório de trabalho
WORKDIR /app

# Copia apenas o necessário do estágio de 'builder'
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/start.sh ./start.sh

# Dá permissão de execução ao script
RUN chmod +x ./start.sh

# Expõe a porta que a aplicação usa
EXPOSE 3000

# Comando para iniciar a aplicação, referenciando o script 'start' do seu package.json
CMD [ "/bin/sh", "./start.sh" ]