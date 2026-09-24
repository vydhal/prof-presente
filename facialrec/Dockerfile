# facial-recognition-service-py/Dockerfile

# Use uma imagem Python
FROM python:3.9-slim

# Variável de ambiente para evitar prompts interativos
ENV DEBIAN_FRONTEND=noninteractive

# Instala dependências do sistema necessárias para dlib, face_recognition e Pillow
# cmake é crucial para dlib
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libjpeg-dev \
    libpng-dev \
    libx11-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia o arquivo de dependências
COPY requirements.txt ./

# Instala as dependências Python
# O build do dlib (via face_recognition) pode demorar bastante!
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY . .

# Expõe a porta (ex: 3002)
EXPOSE 3002

# Comando para rodar a aplicação (usando Gunicorn para produção)
CMD ["gunicorn", "--bind", "0.0.0.0:3002", "--workers", "2", "--timeout", "120", "app:app"]