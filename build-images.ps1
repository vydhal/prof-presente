# PowerShell Script for Docker build and push (v2.0.0)
# Usage: .\build-images.ps1

$DOCKER_USERNAME = "vydhal"
$BACKEND_IMAGE = "eduagenda-backend"
$FRONTEND_IMAGE = "eduagenda-frontend"
$FACIALREC_IMAGE = "eduagenda-facialrec"

Clear-Host
Write-Host "=== Automação de Build de Imagens Docker ===" -ForegroundColor Cyan

# 1. Escolha da Versão
$currentVersion = "2.4.3"
$VERSION = Read-Host "Informe a versão desejada (Pressione Enter para usar $currentVersion)"
if (-not $VERSION) { $VERSION = $currentVersion }

# 2. Escolha do que buildar
Write-Host "`nO que você deseja buildar?" -ForegroundColor Cyan
Write-Host "1. Apenas o Frontend"
Write-Host "2. Apenas o Backend"
Write-Host "3. Ambos (Front e Back)"
Write-Host "4. Tudo (Front, Back e Reconhecimento Facial)"
$choice = Read-Host "Escolha uma opção (1, 2, 3 ou 4)"

$buildFront = ($choice -eq "1" -or $choice -eq "3" -or $choice -eq "4")
$buildBack = ($choice -eq "2" -or $choice -eq "3" -or $choice -eq "4")
$buildFacial = ($choice -eq "4")

Write-Host "`n--- Iniciando build das imagens Docker (Versão: $VERSION) ---" -ForegroundColor Cyan

# Backend Build
if ($buildBack) {
    Write-Host "[BACKEND] Fazendo build da imagem do Backend..." -ForegroundColor Yellow
    Set-Location cracha-virtual-system
    docker build -t "${DOCKER_USERNAME}/${BACKEND_IMAGE}:${VERSION}" .
    Set-Location ..
}

# Frontend Build
if ($buildFront) {
    Write-Host "[FRONTEND] Fazendo build da imagem do Frontend..." -ForegroundColor Yellow
    Set-Location cracha-virtual-frontend
    docker build -t "${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${VERSION}" --build-arg VITE_API_URL=https://eduagenda.simplisoft.com.br/api .
    Set-Location ..
}

# Facial Recognition Build
if ($buildFacial) {
    Write-Host "[FACIAL] Fazendo build da imagem de Reconhecimento Facial..." -ForegroundColor Yellow
    Set-Location cracha-virtual-facialrec
    docker build -t "${DOCKER_USERNAME}/${FACIALREC_IMAGE}:${VERSION}" .
    Set-Location ..
}

Write-Host "`nBuild das imagens concluído!" -ForegroundColor Green

# 3. Push para o Docker Hub
$pushConfirmation = Read-Host "Deseja fazer push para o Docker Hub agora? (y/n)"
if ($pushConfirmation -eq "y") {
    Write-Host "`nFazendo login no Docker Hub..." -ForegroundColor Cyan
    docker login
    
    Write-Host "Fazendo push das imagens selecionadas..." -ForegroundColor Yellow
    if ($buildBack) { docker push "${DOCKER_USERNAME}/${BACKEND_IMAGE}:${VERSION}" }
    if ($buildFront) { docker push "${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${VERSION}" }
    if ($buildFacial) { docker push "${DOCKER_USERNAME}/${FACIALREC_IMAGE}:${VERSION}" }
    
    Write-Host "Push das imagens concluído!" -ForegroundColor Green
    Write-Host "Imagens disponíveis no Docker Hub:"
    if ($buildBack) { Write-Host " - ${DOCKER_USERNAME}/${BACKEND_IMAGE}:${VERSION}" }
    if ($buildFront) { Write-Host " - ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${VERSION}" }
    if ($buildFacial) { Write-Host " - ${DOCKER_USERNAME}/${FACIALREC_IMAGE}:${VERSION}" }
} else {
    Write-Host "Imagens criadas localmente prontas para uso." -ForegroundColor Blue
}

Write-Host "Processo finalizado!" -ForegroundColor Cyan
