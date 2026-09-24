@echo off
chcp 65001 >nul
title Sistema de Crachás Virtuais - Reset Banco de Dados

echo.
echo ========================================
echo  ⚠️  RESET DO BANCO DE DADOS  ⚠️
echo ========================================
echo.
echo 🚨 ATENÇÃO: Esta operação irá apagar TODOS os dados!
echo.
echo    - Todos os usuários cadastrados
echo    - Todos os eventos criados  
echo    - Todos os crachás gerados
echo    - Todas as inscrições e check-ins
echo    - Todas as avaliações e premiações
echo.
set /p confirm="❓ Tem certeza que deseja continuar? (S/N): "
if /i not "%confirm%"=="S" (
    echo.
    echo ✅ Operação cancelada pelo usuário.
    echo.
    pause
    exit /b 0
)

echo.
echo [1/6] Parando containers...
docker-compose -f docker-compose.dev.yml down

echo.
echo [2/6] Removendo volume do banco de dados...
docker volume rm cracha-virtual-system_postgres_dev_data 2>nul
if errorlevel 1 (
    echo ⚠️  Volume não encontrado ou já removido.
) else (
    echo ✅ Volume removido com sucesso.
)

echo.
echo [3/6] Reiniciando banco de dados...
docker-compose -f docker-compose.dev.yml up -d postgres-dev

echo.
echo [4/6] Aguardando banco ficar pronto...
timeout /t 20 /nobreak >nul

echo.
echo [5/6] Verificando conexão...
docker exec cracha_postgres_dev pg_isready -U cracha_user -d cracha_virtual_dev >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: Banco não está respondendo.
    echo    Aguarde mais alguns segundos e execute as migrações manualmente:
    echo    cd back
    echo    npx prisma migrate dev
    echo.
    pause
    exit /b 1
)

echo ✅ Banco de dados pronto!

echo.
echo [6/6] Executando migrações e populando dados...
if exist "back" (
    cd back
    
    echo    - Gerando cliente Prisma...
    npx prisma generate >nul 2>&1
    
    echo    - Executando migrações...
    npx prisma migrate dev --name reset >nul 2>&1
    
    echo    - Populando com dados de exemplo...
    if exist "scripts\seed.js" (
        node scripts\seed.js >nul 2>&1
        if errorlevel 1 (
            echo ⚠️  Erro ao popular dados. Execute manualmente: node scripts\seed.js
        ) else (
            echo ✅ Dados de exemplo criados!
        )
    ) else (
        echo ⚠️  Script de seed não encontrado.
    )
    
    cd ..
) else (
    echo ⚠️  Diretório back não encontrado.
    echo    Execute as migrações manualmente:
    echo    cd back
    echo    npx prisma migrate dev
    echo    node scripts\seed.js
)

echo.
echo ========================================
echo  🎉 Banco de dados resetado com sucesso!
echo ========================================
echo.
echo 🔑 Credenciais de teste disponíveis:
echo    Admin:     admin@cracha.com / 123456
echo    Usuário:   user1@cracha.com / 123456
echo.
echo 🌐 Para acessar o sistema:
echo    1. Execute: start-dev.bat
echo    2. Inicie o backend: cd back && npm run dev
echo    3. Inicie o frontend: cd front && npm run dev
echo    4. Acesse: http://localhost:5173
echo.
pause

