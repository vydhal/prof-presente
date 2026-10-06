# Progresso do Projeto - 30/09/2026

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
| **23. Contorno para e-mails rejeitados (DMARC ausente no domínio .gov.br)** | `EMAIL_REPLY_TO` opcional em `sendEmail()`, permitindo enviar com `EMAIL_FROM`/SMTP num domínio já autenticado (`ti@simplisoft.com.br` na Hostinger, com SPF+DKIM+DMARC válidos) e manter as respostas indo para o e-mail real do órgão (`formacoes.seduc@edu.campinagrande.pb.gov.br`). Causa raiz real: `_dmarc.edu.campinagrande.pb.gov.br` sem registro publicado (DNS hospedado no Route 53 da AWS, fora do nosso acesso) | **Concluído e validado em produção** | 30/09/2026 |
| **24. Limpeza dos docker-compose obsoletos** | Removidos `docker-compose.yml` e `docker-compose.older.yml` (domínio `corre.simplisoft.com.br`, fora de uso) e `docker-compose.valida.yml` (fluxo de validação não usado); sincronizado `docker-compose.swarm.yml` — o único realmente usado em produção — com as versões de imagem que já estavam rodando no servidor (estavam desalinhadas do repositório) | **Concluído** | 30/09/2026 |
| **25. Remoção de credenciais em texto puro do repositório** | Senha de SMTP movida do `docker-compose.dev.yml` para um `.env` na raiz (gitignorado); removido do rastreamento do git o `.env.test`, que continha segredos reais (`JWT_SECRET`, senha do Postgres de produção) commitados por engano | **Concluído (código); rotação das credenciais expostas é decisão do usuário, ainda pendente** | 30/09/2026 |
| **26. Cópia oculta (BCC) de auditoria em todo e-mail enviado** | `EMAIL_BCC` opcional em `sendEmail()`, enviando cópia oculta (via envelope SMTP, sem cabeçalho `Bcc:` visível) de todo e-mail do sistema para uma caixa de auditoria | **Concluído e funcionando em produção desde a 2.5.9 + compose atualizado** (ver Fase 9: o BCC dobra a contagem de destinatários no limite de envio) | 06/10/2026 |
| **27. Fila de e-mails com retry (BullMQ/Redis)** | Envios de inscrição/cancelamento e redefinição de senha passam por uma fila `email` no Redis existente, com até 8 tentativas e espera exponencial. Erros 5xx não são repetidos | **Concluído (testado com Redis e SMTP falsos); pendente build/deploy da 2.6.0** | 06/10/2026 |
| **28. Redefinição de senha sem erro 500** | `POST /auth/forgot-password` não responde mais 500 quando o envio falha; a mensagem é sempre genérica (também elimina o vazamento de quais emails estão cadastrados) | **Concluído; pendente deploy da 2.6.0** | 06/10/2026 |

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

## Alterações Realizadas em 30/09/2026 (Fase 8 - Entrega de E-mail, DMARC e Segurança de Credenciais)

### Contexto e causa raiz
E-mails enviados para destinatários Hotmail/Outlook estavam voltando com erro `550 5.7.515`. Diagnóstico confirmado via consulta DNS real: o domínio `edu.campinagrande.pb.gov.br` tem SPF e DKIM publicados, mas **não tem registro DMARC** em `_dmarc.edu.campinagrande.pb.gov.br`. O DNS do domínio está no Route 53 da AWS (nameservers `awsdns-*`) — nem o usuário nem eu temos acesso para publicar o registro; o pedido foi encaminhado para quem administra essa infraestrutura, e a correção definitiva depende disso.

### Solução aplicada (contorno em nível de aplicação)
- **`EMAIL_REPLY_TO`** (`back/src/utils/email.js`): o envio passou a sair de uma conta com domínio já autenticado (SPF+DKIM+DMARC válidos) — `ti@simplisoft.com.br` na Hostinger —, mantendo `Reply-To: formacoes.seduc@edu.campinagrande.pb.gov.br` para que qualquer resposta manual chegue na caixa real do órgão. Sem essa variável, nenhum Reply-To é enviado (comportamento anterior preservado).
- **`EMAIL_BCC`**: depois de confirmado que Reply-To não gera cópia automática (só direciona respostas manuais), foi adicionada uma cópia oculta (BCC, no envelope SMTP, sem cabeçalho `Bcc:` visível) de **todo** e-mail enviado pelo sistema, para auditoria/backup. Validado localmente com um servidor SMTP de teste: o `RCPT TO` inclui corretamente o destinatário real e o BCC, sem vazar o endereço de auditoria no cabeçalho.
- Ambas as variáveis são opcionais, documentadas em `back/.env-modelo` e `.env.example`, e propagadas em `docker-compose.dev.yml`/`docker-compose.swarm.yml` via `${VAR:-}`.

### Três bugs reais encontrados só em produção (cada um com fix específico)
1. **`553 5.6.7 Must declare SMTPUTF8`**: o nome de exibição do remetente tinha acentos (`Secretaria de Educação`) — a Hostinger é mais estrita que o Gmail nesse ponto. Corrigido removendo os acentos do `EMAIL_FROM`.
2. **`553 5.7.1 Sender address rejected: not owned by user`**: as aspas literais em `EMAIL_FROM="Nome <email>"` no `.env` estavam sendo repassadas como caracteres do próprio valor da variável dentro do container, quebrando o parsing do endereço. Corrigido removendo as aspas do valor no `.env` (sem aspas, mesmo com espaço no nome).
3. **Cópia oculta (BCC) não chega em produção — em investigação**: o e-mail principal chega normalmente, mas a cópia em `formacoes.seduc@edu.campinagrande.pb.gov.br` (e também em `ti@simplisoft.com.br`, testado depois) não aparece. O log de `sendEmail()` foi melhorado para mostrar explicitamente `ReplyTo` e `BCC` a cada envio (antes só mostrava o destinatário principal, escondendo esse diagnóstico). Com o log novo, confirmou-se em produção: `BCC: (nenhum)` — ou seja, a variável simplesmente não está chegando ao processo do backend, mesmo com a imagem já reconstruída (`2.5.9`) e o `.env` do servidor já contendo `EMAIL_BCC=formacoes.seduc@edu.campinagrande.pb.gov.br`. Hipótese mais provável: o `docker-compose.swarm.yml` efetivamente usado no `docker stack deploy` do servidor ainda não tem a linha `EMAIL_BCC=${EMAIL_BCC:-}` no bloco `environment:` do backend (ela já existe no repositório, mas trocar só a tag da imagem/reiniciar o serviço não reaplica o compose) — **a confirmar e corrigir na próxima sessão**.

### Segurança: credenciais expostas no repositório
Um `git push` foi bloqueado pelo classificador de segurança do Claude Code por vazamento de credencial: a senha de SMTP da Hostinger estava em texto puro no `docker-compose.dev.yml`. Por decisão explícita do usuário (**não trocar a senha da Hostinger**), a correção foi mover todos os valores de SMTP/e-mail para um `.env` na raiz do projeto (gitignorado), com `.env.example` como modelo sem segredos, e o `docker-compose.dev.yml` passou a ler tudo via `${VAR}`.

Durante essa limpeza foi descoberto um segundo problema, mais sério: o arquivo `.env.test`, já commitado no histórico do git (por engano, num commit antigo não relacionado), continha o que aparentam ser segredos **reais de produção** (`JWT_SECRET`, senha do Postgres). Esse arquivo:
- foi removido do rastreamento do git (`git rm --cached`, mantido localmente);
- **não** teve suas credenciais rotacionadas;
- **não** teve o histórico do git reescrito para apagar o rastro antigo.
Ambas as ações ficam como decisão do usuário — não foram executadas por serem irreversíveis/de alto impacto sem autorização explícita.

### Commits desta fase
`5a94a69` (contorno DMARC/Reply-To), `a9ec316` (sincroniza swarm.yml), `1f9b0ff` (remove composes obsoletos), `7b76766` (remove credenciais em texto puro), `60408eb` (EMAIL_BCC).

---

## Alterações Realizadas em 06/10/2026 (Fase 9 - Fila de E-mails, Limite de Envio e Versão 2.6.0)

### Diagnóstico
- Os logs de produção mostraram `451 4.7.1 Ratelimit "hostinger_out_ratelimit" exceeded`: a conta `ti@simplisoft.com.br` atingiu o limite de envio do Hostinger. Isso fazia as confirmações de inscrição falharem e a redefinição de senha responder 500.
- O BCC de auditoria (Fase 8) **dobra a quantidade de destinatários por envio**, e o limite do Hostinger conta destinatários, então a cota se esgota mais rápido.
- Ficou confirmado que o BCC já funciona em produção: o log mostra `BCC: formacoes.seduc@edu.campinagrande.pb.gov.br` nos envios.
- Trocar de conta para contornar o limite (rodízio entre Google e Hostinger) foi descartado: burla o controle do provedor e prejudica a reputação do domínio.

### Backend (`back`)
- **Fila de e-mails** (`src/queues/emailQueue.js`): fila BullMQ `email` sobre o Redis que já existe no Swarm (`REDIS_URL`). Até 8 tentativas com espera exponencial a partir de 1 minuto (cerca de 2 horas no total). Anexos são serializados em base64.
- **Worker** (`src/workers/emailJobWorker.js`, iniciado em `server.js`): chama o `sendEmail` existente. Erros 5xx (permanentes, ex.: destinatário inexistente) não são repetidos; 4xx (temporários, ex.: 451) são.
- Passam pela fila: confirmação e cancelamento de inscrição (`utils/email.js`) e redefinição de senha (`authController.js`).
- Continuam com envio direto: certificados (o status deles depende do resultado síncrono) e propostas. Ainda sofrem com o limite e são candidatos à fila numa próxima etapa.
- **Redefinição de senha**: o envio agora fica num `try/catch` próprio. Em caso de falha, o erro vai para o log e a resposta continua genérica, o que também evita revelar quais emails estão cadastrados.
- **Dependência nova**: `bullmq` ^5.81.5. A instalação atualizou dependências transitivas dentro das faixas já definidas, incluindo `ioredis` 5.9.2 → 5.11.1 (cliente do cache).

### Teste
Redis temporário + servidor SMTP falso: o envio que respondeu `451` foi repetido e entregue na segunda tentativa, cerca de 60 segundos depois. O envio que respondeu `550` falhou com uma tentativa só, sem retry.

### Infraestrutura
- `docker-compose.swarm.yml`: backend e frontend em `2.6.0`. O facialrec continua em `2.5.5`.
- Para aplicar em produção: build e push de front e back com `2.6.0`, atualizar as tags no compose do servidor e rodar `docker stack deploy -c docker-compose.swarm.yml <stack>` novamente.

### Limitações conhecidas
- Se a cota do Hostinger for diária e estiver estourada, as 8 tentativas podem não bastar. Jobs que esgotam as tentativas ficam guardados no Redis (até 1000) para inspeção, mas não são reenviados automaticamente.
- O BCC continua dobrando os destinatários.
- Próxima etapa recomendada: provedor transacional com domínio autenticado (`simplisoft.com.br`). A troca é só nas variáveis `SMTP_*`.

### Commits desta fase
`b52b40c` (documentação da fase de e-mail) e o commit da fila de e-mails, redefinição de senha e tags 2.6.0 (ver `git log`).

---

## Próximos Passos (Para o Usuário Executar)

1. **Deploy da 2.6.0**: build e push de front e back, atualizar as tags no `docker-compose.swarm.yml` do servidor e rodar `docker stack deploy` novamente (não basta trocar a imagem ou reiniciar o serviço).
2. **Conferir nos logs após o deploy**: `BCC: formacoes.seduc@...` nos envios; `[AUTH] Email de redefinição enfileirado` na redefinição de senha; e `[EMAIL-QUEUE] Job ... falhou` quando houver falha (me enviar a linha se aparecer).
3. **Provedor transacional gratuito com domínio autenticado** (SPF, DKIM e DMARC em `simplisoft.com.br`): verificar os limites atuais de planos gratuitos antes de escolher. Depois, trocar só as variáveis `SMTP_*` no `.env` do servidor.
4. **Após puxar (`git pull`) em outras máquinas**: as pastas foram renomeadas. Arquivos versionados são movidos pelo git, mas o que é ignorado (`.env`, `node_modules`, `uploads`) fica nas pastas antigas — mover `cracha-virtual-system/.env` para `back/.env` (e `uploads/`), `cracha-virtual-frontend/.env` para `front/.env`, e rodar `npm install` nas pastas novas; depois apagar as pastas antigas vazias.
5. **Segurança (decisão pendente do usuário)**: rotacionar `JWT_SECRET` e a senha do Postgres de produção, expostas no `.env.test` que esteve commitado no histórico do GitHub (ver item 25 da tabela). Avaliar também se vale reescrever o histórico do git para remover o rastro desses segredos.
6. **DMARC definitivo**: quando houver acesso a quem administra o Route 53 do domínio `campinagrande.pb.gov.br`, publicar o registro `_dmarc.edu.campinagrande.pb.gov.br` — isso elimina a necessidade do contorno `EMAIL_REPLY_TO`/`EMAIL_FROM` alternativo.
7. **Testar o Modal de Histórico**: Acessar o Painel Admin > Gerenciamento de Usuários > Clicar em "Histórico" em qualquer usuário -> Verificar a abertura ampla do diálogo, a presença do check-in real e o download do PDF.
8. **Testar Admin > Eventos e Trilhas**: conferir a coluna Organizador, o filtro por organizador, a ordenação por data e a busca/paginação em Gerenciar Trilhas com os dados reais de produção.
9. **Pendente de fases anteriores**: uma tela dedicada de "frequência em eventos online" (o endpoint `GET /reports/ranking?modality=ONLINE` já existe, mas nenhuma tela o consome).
