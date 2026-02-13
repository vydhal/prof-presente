# Guia de Implantação (Docker Hub & Portainer)

Este guia contém os comandos necessários para compilar, enviar as imagens para o Docker Hub e atualizar o ambiente de produção via Portainer.

## 🛠️ 1. Build e Push para o Docker Hub

Siga a ordem abaixo para garantir que todas as imagens estejam atualizadas:

### A. Backend (Sistema)
No diretório `cracha-virtual-system`:
```bash
# 1. Gerar Prisma Client (importante para novas tabelas)
npx prisma generate

# 2. Build da imagem
docker build -t vydhal/eduagenda-backend:latest ./cracha-virtual-system

# 3. Push para o Docker Hub
docker push vydhal/eduagenda-backend:latest
```

### B. Frontend
No diretório `cracha-virtual-frontend`:
```bash
# 1. Build da imagem (Certifique-se que o .env de produção está correto)
docker build -t vydhal/eduagenda-frontend:latest ./cracha-virtual-frontend

# 2. Push para o Docker Hub
docker push vydhal/eduagenda-frontend:latest
```

---

## 🚀 2. Atualização no Portainer

Após enviar as imagens para o Docker Hub, siga estes passos no seu servidor:

1. **Acesse o Portainer** da SimpliSoft.
2. Vá em **Stacks** e selecione a stack `eduagenda`.
3. No painel de edição da Stack:
   - Certifique-se de que a opção **"Pull latest image"** (ou "Force Redeploy") está ativada.
   - Clique em **Update the stack**.
4. **Verificação de Migração**: Se houver mudanças no banco de dados (novas tabelas de Espaços/Reservas), acesse o container do **backend** pelo console do Portainer e execute:
   ```bash
   npx prisma migrate deploy
   ```
   *Nota: Use `migrate deploy` em produção para não apagar dados existentes.*

---

## 📋 3. Notas Importantes
- **Fuso Horário**: O sistema está configurado para `America/Sao_Paulo`.
- **URLs**: As APIs agora apontam para `https://eduagenda.simplisoft.com.br/api`.
- **Logs**: Verifique os logs dos containers no Portainer para garantir que o Socket.io e a conexão com o banco de dados estão operacionais.

Desenvolvido por **Antigravity AI**.
