# Progresso do Projeto - 24/09/2026

## 📊 Tabela de Progresso Atual

| Item | Descrição | Status | Data Conclusão |
| :--- | :--- | :--- | :--- |
| **1. Servir Assets Estáticos** | Mapeamento no `src/app.js` das rotas `/assets` e `/api/assets` para expor o logo e recursos padrão | **Concluído** | 25/05/2026 |
| **2. Fallback de Logo** | Implementado o getAbsoluteUrl para `/assets/logo.png` em `badgeService.js` quando `logoUrl` for nulo | **Concluído** | 25/05/2026 |
| **3. Transição para URLs Absolutas** | Alteração no `email.js` para usar URLs absolutas das imagens do crachá, desativando anexos CID inline | **Concluído** | 25/05/2026 |
| **4. Robustez de Código (Badge)** | Adicionado optional chaining no `badgeService.js` para prevenir quebra por dados incompletos | **Concluído** | 25/05/2026 |
| **5. Fix: Logout indevido do Organizador** | Corrigido permissões de atualização de usuários e logout global em erros 403. | **Concluído** | 22/07/2026 |
| **6. Novos Cargos Educacionais** | Inseridos novos cargos nas telas de perfis, registros e gestão de usuários (Assistente Social, Orientador(a), etc) | **Concluído** | 30/07/2026 |
| **7. UX Data de Nascimento** | Substituído DatePicker por Input livre com máscara DD/MM/AAAA para facilitar o cadastro | **Concluído** | 30/07/2026 |
| **8. Melhoria UX Trilha** | Adicionado campo de busca e ajustado o Shadcn UI Dialog (com `sm:max-w-[90vw] lg:max-w-5xl`) para garantir responsividade e layout amplo no modal de Nova Trilha (`AdminTracks.jsx`) | **Concluído** | 30/07/2026 |
| **9. UX Landing Page** | Substituído a grade de Trilhas e Eventos por Carrosséis do Shadcn UI na página inicial. Adicionado menu inferior de navegação rápida para dispositivos móveis (`md:hidden`). | **Concluído** | 31/07/2026 |
| **10. Modalidade de Evento (Presencial/Online)** | Novo campo `modality` no evento, escolhido logo na criação (wizard), com a aba de Transmissão liberada no mesmo fluxo | **Concluído** | 08/09/2026 |
| **11. Check-in ao Vivo** | Organizador libera/encerra o check-in durante a transmissão; participante confirma presença em tempo real (socket.io), gerando `UserCheckin` real | **Concluído** | 08/09/2026 |
| **12. Transmissão via StreamYard** | Substituído o fluxo de OAuth com o YouTube (Conectar Conta / Gerar Automática) por um botão que abre o StreamYard + campo para colar o link/ID gerado | **Concluído** | 08/09/2026 |
| **13. Correções de robustez do Backend** | Corrigido crash do servidor por falha de e-mail não tratada, vazamento de `streamId` em rota pública, bug de permissão de organizador e bug no relatório de ranking de frequência | **Concluído** | 08/09/2026 |
| **14. UX Lista de Eventos (Admin)** | Adicionada coluna "Tipo" com ordenação, atalho de check-in ao vivo na lista (sem precisar abrir edição), e correção do bug de quebra de linha/scroll nas abas do Admin | **Concluído** | 08/09/2026 |
| **15. Responsividade da Live (Mobile)** | Corrigido layout da sala de transmissão para não empurrar o chat para trás do menu inferior fixo no celular | **Concluído** | 08/09/2026 |
| **16. Contraste no Modo Escuro** | Corrigidas várias telas do Admin (lista de eventos mobile, dashboard, painéis de transmissão/check-in) que usavam cores fixas e ficavam ilegíveis no tema escuro | **Concluído** | 08/09/2026 |
| **17. Alternar Tema na Área Logada** | Adicionado o mesmo botão de claro/escuro da landing page também no header da área autenticada (antes só dava pra trocar deslogado) | **Concluído** | 08/09/2026 |
| **18. Histórico de Inscrições, PDF e Fix Check-in** | Ajuste de largura do Modal de Histórico de Inscrições (`sm:max-w-5xl`), exportação em PDF via `jsPDF`/`autoTable` e correção do backend para retornar o check-in real da tabela `UserCheckin` e eventos de Trilhas | **Concluído** | 18/09/2026 |
| **19. Correção da lista de eventos nas Trilhas** | A seleção de eventos ao criar/editar uma trilha era cortada em 100 eventos (`limit=100` com ordem crescente por data), escondendo os mais novos. Agora carrega até 1000, dos mais recentes para os mais antigos | **Concluído** | 24/09/2026 |
| **20. Organizador e Filtros na Lista de Eventos (Admin)** | Nova coluna "Organizador" (com unidade/setor), filtro por organizador com busca por nome (inclui "Sem responsável definido") e ordenação por data (mais recentes / mais antigos), feitos no servidor | **Concluído** | 24/09/2026 |
| **21. Busca e Paginação em Trilhas (Admin)** | Campo de busca (título/descrição, sem acento, por palavras) e paginação de 10 em 10 na tela Gerenciar Trilhas | **Concluído** | 24/09/2026 |
| **22. Padronização dos nomes das pastas** | `cracha-virtual-frontend` → `front`, `cracha-virtual-system` → `back`, `cracha-virtual-facialrec` → `facialrec` (via `git mv`, histórico preservado), com atualização do docker-compose de dev, scripts de build/dev, `.gitignore` e docs | **Concluído** | 24/09/2026 |

---

## Alterações Realizadas recentemente (Fase 4 - Certificados Individuais, Login Google e UX Mobile)

### Correções (Fixes)
- **Logout Indevido (Frontend)**: Atualizado o interceptor do Axios (`api.js`) para não deslogar o usuário em caso de erro 403 (Acesso Negado), apenas no 401 (Token Inválido).
- **Permissões de Organizador (Backend)**: Adicionada permissão `requireOwnershipOrAdminOrOrganizer` na rota `PUT /users/:id` para permitir que Organizadores editem o perfil de usuários sem erro de autorização.
- **Retorno de Token Inválido (Backend)**: Corrigido o status de erro de `403` para `401` no middleware `authenticateToken` em `auth.js` quando o token é inválido/expirado, seguindo as semânticas corretas do HTTP.

### Backend (`back`)
- **Envio Individual de Certificados**: Implementada a rota `POST /events/:id/send-certificate-individual/:userId`, o serviço `sendSingleCertificate` e a lógica do controlador para validar check-ins, calcular carga horária total (incluindo sub-eventos), gerar PDF e logar o envio na tabela `CertificateLog`.
- **Autenticação com o Google**: Criada a rota `POST /auth/google` que valida ID Tokens no endpoint oficial do Google. Realiza o login imediato para contas existentes ou o cadastro automático de usuários `TEACHER` com geração de crachá e QR Code universal.
- **Associação de Unidades Escolares**: Atualizadas as rotas de usuários e autenticação para permitir a vinculação múltipla de `workplaceIds` no perfil do usuário.

### Frontend (`front`)
- **Ação de Envio Individual**: Integrado o botão `Award` com modal de confirmação na tela de inscritos (`EventEnrollments.jsx`) para participantes elegíveis.
- **Login e Registro Social**: Integrado o script do Google Identity Services nas telas de Login e Registro com botão personalizado. Redireciona usuários com onboarding pendente para a tela de perfil.
- **Banner de Onboarding e Gestão Profissional**: Adicionado banner explicativo de onboarding incompleto no topo do perfil (`Profile.jsx`) e implementada a seleção múltipla de Unidades Escolares (Popover + Command) para persistir as informações profissionais.
- **UX Bottom Navbar Mobile**: Reestruturado o menu inferior para exibir 4 atalhos fixos rápidos (Home, Eventos, Salas, Inscrições) e um botão "Menu" que abre um dialog em tela cheia com uma grade de todas as opções de navegação do sistema, otimizando o espaço da tela.
- **UX Landing Page Carrosséis e Mobile Menu**: Implementados Carrosséis (Shadcn UI) para as listagens de Trilhas e Eventos, poupando espaço vertical no desktop. Adicionado um Menu Bottom fixo para telas mobile, facilitando a navegação rápida.
- **Ajustes de Carrossel**: Ajuste nas proporções dos cards para ficarem mais horizontais (`basis-[85%]`) e adição de indicador de swipe (Deslize para ver mais) para melhor UX.

### Ferramentas e Infraestrutura
- **Build Arg para Google Client ID**: Atualizado o `Dockerfile` do frontend e o script `build-images.ps1` para lerem automaticamente o `VITE_GOOGLE_CLIENT_ID` do arquivo `.env` do frontend e injetarem na compilação do React.

---

## Alterações Realizadas em 08/09/2026 (Fase 5 - Eventos Online + Check-in ao Vivo)

### Backend (`back`)
- **Modalidade do evento**: novo enum `EventModality` (`PRESENCIAL`, `ONLINE`, `HIBRIDO`) e campo `modality` em `Event` (migration `20260904145800_add_event_modality_and_live_checkin`).
- **Check-in ao vivo**: novos models `LiveCheckinWindow` e `LiveCheckinConfirmation`. Novos endpoints em `liveStreamController.js`/`routes/liveStreams.js`:
  - `POST /live-streams/:id/checkin/open` e `/close` (organizador/admin liberam e encerram)
  - `GET /live-streams/:id/checkin/status` (participante consulta, cobre reload no meio da janela)
  - `POST /live-streams/:id/checkin/confirm` (participante confirma presença, reaproveitando `processUserCheckin` do `checkinController.js`)
  - Eventos em tempo real via socket.io (`checkin_window_opened`, `checkin_window_closed`, `checkin_confirmed_count`) — exigiu anexar a instância `io` ao `app` (`app.set('io', io)`) em `server.js` para os controllers REST conseguirem emitir.
- **Correção de permissão**: rotas de YouTube/streaming exigiam `ADMIN` puro; organizadores tomavam 403 ao configurar a própria transmissão. Corrigido para `requireAdminOrOrganizer` + checagem de dono do evento.
- **Correção de segurança**: `getEventById` (rota pública) ia expor o `streamId` do YouTube de qualquer evento sem exigir inscrição. Agora só expõe o `status` publicamente; o `streamId` continua exigindo inscrição aprovada via `GET /live-streams/events/:id`.
- **Correção de crash do servidor**: `sendEnrollmentConfirmationEmail`/`sendEnrollmentCancellationEmail` (`email.js`) propagavam qualquer erro (SMTP fora do ar, `PUBLIC_API_URL` ausente) como uma `unhandledRejection`, e o handler global em `server.js` derrubava **o processo inteiro** a cada falha de e-mail. Agora essas funções tratam o próprio erro internamente (best-effort). Também corrigido `getAbsoluteUrl` (`badgeService.js`) para não quebrar quando `PUBLIC_API_URL` não está definida.
- **Correção do ranking de frequência**: `getFrequencyRanking` (`reportController.js`) referenciava `period`/`page`/`limit`/`skip` sem nunca declará-los — sempre retornava 500. Corrigido e adicionado filtro `?modality=ONLINE|PRESENCIAL|HIBRIDO`, permitindo medir frequência separada em eventos online (nenhuma tela ainda consome esse filtro — ver Próximos Passos).
- **Documentação de ambiente**: `.env-modelo` passou a documentar `PUBLIC_API_URL`, `YOUTUBE_CLIENT_ID/SECRET` e `FACIAL_SERVICE_URL`.

### Frontend (`front`)
- **Wizard de criação de evento** (`Admin.jsx`): escolha de modalidade (Presencial/Online) logo no início; para eventos online, a aba "Transmissão" fica liberada no mesmo fluxo (o modal permanece aberto e avança automaticamente após salvar os detalhes, sem precisar reabrir em edição).
- **`LiveStreamConfig.jsx` redesenhado**: removido o fluxo de OAuth com o YouTube (Conectar Conta / Gerar Automática); agora tem um botão "Abrir StreamYard" (link externo) + campo único para colar o link ou ID do vídeo gerado (extrai o ID automaticamente de várias formas de URL do YouTube).
- **`LiveCheckinControl.jsx` (novo componente)**: painel com botão "Liberar Check-in Agora" / "Encerrar Check-in", usado dentro da aba Transmissão e também num atalho rápido na lista de eventos.
- **Atalho na lista de eventos** (`Admin.jsx`): ícone de check-in ao vivo (rádio) nas Ações, visível só para eventos não-presenciais, abre um dialog compacto sem precisar entrar na edição completa.
- **Coluna "Tipo" com ordenação** (`Admin.jsx`): mostra a modalidade de cada evento (Presencial/Online/Híbrido) e permite ordenar clicando no cabeçalho.
- **Correção de layout das abas do Admin**: a barra de abas (Dashboard, Eventos, Banners, ...) virava um grid de colunas fixas e quebrava linha com scroll vertical indevido quando havia mais abas que colunas (variação por perfil admin/organizador). Trocado para layout flexível que cabe numa linha ou rola horizontalmente.
- **`EventDetails.jsx`**: botão "Acessar Sala de Transmissão" / "Assistir Ao Vivo Agora" para participantes inscritos em eventos online (gap de navegação que não existia antes).
- **`LiveStreamRoom.jsx`**: botão "Confirmar Presença" que aparece em tempo real via socket quando o organizador libera o check-in; estado vazio no chat ("Nenhuma mensagem ainda..."); responsividade mobile corrigida (vídeo e chat brigavam pela mesma altura, empurrando o campo de mensagem para trás do menu inferior fixo).
- **Tema claro/escuro na área logada** (`Layout.jsx`): adicionado o mesmo botão de alternar tema que já existia na landing page — antes só dava para trocar deslogado.
- **Correções de contraste no modo escuro**: `LiveCheckinControl`, `LiveStreamConfig` e vários pontos do `Admin.jsx` (card de evento mobile, cards de estatística do dashboard, bloco "Responsável pelo Evento", log de certificados, alerta de crachás pendentes) usavam cores fixas do Tailwind (`bg-gray-50`, `text-gray-500`, `text-accent` etc.) em vez dos tokens de tema do app — em alguns casos o texto ficava literalmente invisível (branco sobre branco). Trocado pelos tokens semânticos (`bg-muted`, `text-muted-foreground`, `text-primary`) que já se adaptam entre claro/escuro e entre marcas (o `--primary` reflete a cor do tenant, ex: azul no branding "SEDUC").

### Decisões tomadas
- A conta do YouTube continua sendo **única/global da plataforma** (não implementamos OAuth por organizador) — mas isso ficou ainda menos relevante depois de trocar pelo fluxo StreamYard.
- Check-in ao vivo é **uma única liberação por evento** (não múltiplas janelas/checkpoints), mas o modelo de dados (`LiveCheckinWindow`) já comporta isso no futuro sem retrabalho.

### Commits desta fase
`a7c5251` → `7a6465e` (nesta ordem): modalidade+check-in ao vivo, correções de robustez (email/ranking/permissão), atalho de check-in + responsividade mobile, contraste dark mode (2x), botão de tema na área logada, fix das abas do Admin.

---

## Alterações Realizadas em 18/09/2026 (Fase 6 - Histórico de Inscrições, PDF e Check-in Real)

### Backend (`back`)
- **Busca de Check-in Real**: Atualizada a rota `GET /users/:id/enrollments` no `userController.js` para consultar a tabela `UserCheckin` via o `userBadge` do usuário. Agora resgata o horário real e exato em que o check-in foi efetuado.
- **Suporte a Trilhas de Aprendizagem (Cursos)**: Unificou as inscrições de eventos diretos (`Enrollment`) com inscrições de cursos/trilhas (`TrackEnrollment`), trazendo todos os eventos nos quais o usuário possui participação.

### Frontend (`front`)
- **Ajuste de Tamanho e Layout do Dialog (`UserManagement.jsx`)**: Atualizado de `max-w-4xl` estreito para `sm:max-w-5xl w-[95vw]` responsivo, eliminando barras de rolagem horizontais e quebras desagradáveis no desktop e mobile.
- **Exportação para PDF (`handleDownloadPDF`)**: Adicionado o botão "Baixar PDF" utilizando `jsPDF` e `jspdf-autotable`. Gera um relatório oficial completo com os dados do usuário, lista de cursos/eventos, origem (Direto ou Trilha), datas, locais, status e horários de check-in confirmados.
- **Indicadores Visuais de Frequência**: Exibição de Badges modernas com status de confirmação e pílulas em verde destacando a data e o horário do check-in realizado.

---

## Alterações Realizadas em 24/09/2026 (Fase 7 - Lista de Eventos, Trilhas e Padronização de Pastas)

> **Atenção aos nomes:** a partir desta fase as pastas do projeto se chamam `back`, `front` e `facialrec`. Nas seções anteriores deste documento, `back` era `cracha-virtual-system` e `front` era `cracha-virtual-frontend`.

### Backend (`back`)
- **`GET /events` com ordenação e filtro por organizador**: novos parâmetros `sort=asc|desc` (padrão `asc`, o que mantém as listagens públicas como estavam) e `creatorId` (id do organizador, ou `none` para eventos sem responsável). Ordenação e filtro ocorrem no servidor, para o limite de resultados sempre trazer os eventos certos.
- **Dados do organizador na listagem**: perfis de gestão (`ADMIN`, `ORGANIZER`, `GESTOR_ESCOLA`) recebem `creator` (nome + unidades vinculadas) em cada evento. Na listagem pública esses dados **não** são expostos.
- **Novo `GET /events/organizers`** (somente admin): organizadores que possuem ao menos um evento — alimenta o filtro do Admin sem o teto de 100 usuários que existia na consulta de usuários.
- **Observação sobre "Organizador"**: o responsável só é gravado quando o evento é criado por um `ORGANIZER`/`GESTOR_ESCOLA` ou quando o admin o define na edição ("Responsável pelo Evento"). Eventos criados por admin sem responsável aparecem com "—".

### Frontend (`front`)
- **Lista de eventos do Admin (`Admin.jsx`)**: coluna "Organizador" (unidade/setor como subtítulo; linha equivalente nos cards mobile), seletor de ordenação por data (padrão: mais recentes primeiro, assim o limite de 500 não esconde eventos novos), filtro por organizador com busca por nome (só admin) e botão "Limpar filtro". O espaço do botão de check-in ao vivo passou a ser reservado nas linhas presenciais, alinhando as colunas de ação.
- **Trilhas — seleção de eventos (`AdminTracks.jsx`)**: corrigido o corte em 100 eventos (ver item 19 da tabela); agora `limit=1000` com `sort=desc`.
- **Trilhas — busca e paginação (`AdminTracks.jsx`)**: busca por título/descrição sem diferenciar acentos/maiúsculas e por palavras (todas precisam aparecer, em qualquer ordem); paginação de 10 em 10 ("Mostrando X–Y de Z", Anterior/Próxima, "Página N de M"); a busca volta para a página 1 e a página se ajusta se a última esvaziar. Feito no cliente porque a API já devolve a lista completa e o endpoint é compartilhado com as telas públicas (nenhuma mudança de backend). Corrigido também o `colSpan` das linhas de carregando/vazio (4 → 5).

### Estrutura e Infraestrutura
- **Renomeação das pastas** (`git mv`, histórico dos arquivos preservado): `cracha-virtual-frontend` → `front`, `cracha-virtual-system` → `back`, `cracha-virtual-facialrec` → `facialrec`. A pasta `livekit` não foi alterada.
- **Referências atualizadas**: `docker-compose.dev.yml` (`build: ./back`, volume `./back:/app`), `build-images.ps1` e `build-images.sh`, `.gitignore`, `scripts/start-dev.bat` e `scripts/reset-db.bat` (caminhos), `README.md`, `DEPLOY.md`, `DOCUMENTO_NORTEADOR_PLATAFORMA_CURSOS.md` e o comentário do `back/.env-modelo`.
- **Não alterado de propósito**: o campo `name` dos `package.json` (`cracha-virtual-frontend` / `cracha-virtual-system`) — é o nome do pacote npm, independente da pasta; o nome do volume Docker legado `cracha-virtual-system_postgres_dev_data` em `scripts/reset-db.bat` (já estava desatualizado em relação ao compose atual); e o trecho de log colado em `ERROS.MD`.
- **Validação da renomeação**: `docker compose config` ok, build da imagem do backend a partir de `./back`, API respondendo (HTTP 200), Vite servindo a partir de `front/`, `node_modules`, `.env` e `uploads` preservados.

### Commits desta fase
`c964fbe` (fix trilhas), `6ba7dbe` (organizador/filtros/ordenação), `f840800` (busca e paginação de trilhas) e o commit de padronização dos nomes das pastas.

---

## Próximos Passos (Para o Usuário Executar)

1. **Build e deploy das imagens**: rodar `build-images.ps1` (opção 3 - Ambos) com uma versão nova (ex: `2.5.0`), dar push, e **atualizar o número da versão no `docker-compose.yml`/`docker-compose.older.yml`** antes de rodar o deploy. As mudanças desta fase exigem front **e** back (a coluna/filtro de organizador depende dos dois). O `facialrec` não mudou.
2. **Após puxar (`git pull`) em outras máquinas**: as pastas foram renomeadas. Arquivos versionados são movidos pelo git, mas o que é ignorado (`.env`, `node_modules`, `uploads`) fica nas pastas antigas — mover `cracha-virtual-system/.env` para `back/.env` (e `uploads/`), `cracha-virtual-frontend/.env` para `front/.env`, e rodar `npm install` nas pastas novas; depois apagar as pastas antigas vazias.
3. **Segurança (recomendado)**: o `docker-compose.dev.yml` contém uma senha de SMTP em texto puro (`SMTP_PASS`) que já está no histórico do GitHub. Trocar essa senha no provedor de e-mail e passar a lê-la de variável de ambiente/arquivo `.env` não versionado.
4. **Testar o Modal de Histórico**: Acessar o Painel Admin > Gerenciamento de Usuários > Clicar em "Histórico" em qualquer usuário -> Verificar a abertura ampla do diálogo, a presença do check-in real e o download do PDF.
5. **Testar Admin > Eventos e Trilhas**: conferir a coluna Organizador, o filtro por organizador, a ordenação por data e a busca/paginação em Gerenciar Trilhas com os dados reais de produção.
6. **Pendente de fases anteriores**: uma tela dedicada de "frequência em eventos online" (o endpoint `GET /reports/ranking?modality=ONLINE` já existe, mas nenhuma tela o consome).
