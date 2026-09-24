#!/bin/sh
set -e

# Aguarda o banco de dados estar pronto (opcional, o Prisma handle internamente,
# mas é boa prática ter)
echo "Sincronizando banco de dados (db push)..."
npx prisma db push --skip-generate --accept-data-loss

echo "Iniciando a aplicação..."
exec npm start
