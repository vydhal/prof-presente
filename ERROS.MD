 => => unpacking to docker.io/vydhal/eduagenda-backend:2.4.6                                                  0.0s 
[FRONTEND] Fazendo build da imagem do Frontend...
[+] Building 16.7s (14/16)                                                                    docker:desktop-linux 
 => [internal] load build definition from Dockerfile                                                          0.1s 
 => => transferring dockerfile: 808B                                                                          0.1s 
 => [internal] load metadata for docker.io/library/nginx:alpine                                               0.8s 
 => [internal] load metadata for docker.io/library/node:18-alpine                                             0.6s 
 => [auth] library/nginx:pull token for registry-1.docker.io                                                  0.0s 
 => [internal] load .dockerignore                                                                             0.0s 
 => => transferring context: 592B                                                                             0.0s 
 => CACHED [builder 1/7] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118  0.0s 
 => => resolve docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9b  0.0s 
 => [stage-1 1/3] FROM docker.io/library/nginx:alpine@sha256:5616878291a2eed594aee8db4dade5878cf7edcb475e591  0.0s 
 => => resolve docker.io/library/nginx:alpine@sha256:5616878291a2eed594aee8db4dade5878cf7edcb475e59193904b19  0.0s 
 => [internal] load build context                                                                             0.4s 
 => => transferring context: 1.84MB                                                                           0.3s 
 => [builder 2/7] WORKDIR /app                                                                                0.0s 
 => [builder 3/7] COPY package*.json ./                                                                       0.0s 
 => [builder 4/7] COPY package-lock.json ./                                                                   0.0s 
 => [builder 5/7] RUN npm install --legacy-peer-deps                                                         14.1s 
 => [builder 6/7] COPY . .                                                                                    0.2s
 => ERROR [builder 7/7] RUN npm run build                                                                     1.1s
------
 > [builder 7/7] RUN npm run build:
0.265
0.265 > cracha-virtual-frontend@2.5.0 build
0.265 > vite build
0.265 
0.481 vite v6.3.6 building for production...
0.525 transforming...
1.065 ✓ 59 modules transformed.
1.065 ✗ Build failed in 564ms
1.065 error during build:
1.065 [@tailwindcss/vite:generate:build] Cannot apply unknown utility class `shadow-spotify`
1.065 file: /app/src/App.css
1.065     at onInvalidCandidate (file:///app/node_modules/tailwindcss/dist/chunk-U5SIPDGO.mjs:18:1529)
1.065     at pe (file:///app/node_modules/tailwindcss/dist/chunk-U5SIPDGO.mjs:13:29888)
1.065     at file:///app/node_modules/tailwindcss/dist/chunk-U5SIPDGO.mjs:18:373
1.065     at D (file:///app/node_modules/tailwindcss/dist/chunk-U5SIPDGO.mjs:3:1656)
1.065     at Oe (file:///app/node_modules/tailwindcss/dist/chunk-U5SIPDGO.mjs:18:172)
1.065     at ti (file:///app/node_modules/tailwindcss/dist/chunk-U5SIPDGO.mjs:35:780)
1.065     at async mn (file:///app/node_modules/tailwindcss/dist/chunk-U5SIPDGO.mjs:35:1123)
1.065     at async $a (file:///app/node_modules/tailwindcss/dist/chunk-U5SIPDGO.mjs:35:1898)
1.065     at async $a (file:///app/node_modules/@tailwindcss/node/dist/index.mjs:10:3433)
1.065     at async C.generate (file:///app/node_modules/@tailwindcss/vite/dist/index.mjs:1:3571)
------
Dockerfile:22
--------------------
  20 |
  21 |     # Build da aplicação
  22 | >>> RUN npm run build
  23 |
  24 |     # Estágio de produção com Nginx
--------------------
ERROR: failed to build: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1

Build das imagens concluÃ­do!
Deseja fazer push para o Docker Hub agora? (y/n):