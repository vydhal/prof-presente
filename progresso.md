# Progresso do Projeto - 30/07/2026

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

---

## Alterações Realizadas recentemente (Fase 4 - Certificados Individuais, Login Google e UX Mobile)

### Correções (Fixes)
- **Logout Indevido (Frontend)**: Atualizado o interceptor do Axios (`api.js`) para não deslogar o usuário em caso de erro 403 (Acesso Negado), apenas no 401 (Token Inválido).
- **Permissões de Organizador (Backend)**: Adicionada permissão `requireOwnershipOrAdminOrOrganizer` na rota `PUT /users/:id` para permitir que Organizadores editem o perfil de usuários sem erro de autorização.
- **Retorno de Token Inválido (Backend)**: Corrigido o status de erro de `403` para `401` no middleware `authenticateToken` em `auth.js` quando o token é inválido/expirado, seguindo as semânticas corretas do HTTP.

### Backend (`cracha-virtual-system`)
- **Envio Individual de Certificados**: Implementada a rota `POST /events/:id/send-certificate-individual/:userId`, o serviço `sendSingleCertificate` e a lógica do controlador para validar check-ins, calcular carga horária total (incluindo sub-eventos), gerar PDF e logar o envio na tabela `CertificateLog`.
- **Autenticação com o Google**: Criada a rota `POST /auth/google` que valida ID Tokens no endpoint oficial do Google. Realiza o login imediato para contas existentes ou o cadastro automático de usuários `TEACHER` com geração de crachá e QR Code universal.
- **Associação de Unidades Escolares**: Atualizadas as rotas de usuários e autenticação para permitir a vinculação múltipla de `workplaceIds` no perfil do usuário.

### Frontend (`cracha-virtual-frontend`)
- **Ação de Envio Individual**: Integrado o botão `Award` com modal de confirmação na tela de inscritos (`EventEnrollments.jsx`) para participantes elegíveis.
- **Login e Registro Social**: Integrado o script do Google Identity Services nas telas de Login e Registro com botão personalizado. Redireciona usuários com onboarding pendente para a tela de perfil.
- **Banner de Onboarding e Gestão Profissional**: Adicionado banner explicativo de onboarding incompleto no topo do perfil (`Profile.jsx`) e implementada a seleção múltipla de Unidades Escolares (Popover + Command) para persistir as informações profissionais.
- **UX Bottom Navbar Mobile**: Reestruturado o menu inferior para exibir 4 atalhos fixos rápidos (Home, Eventos, Salas, Inscrições) e um botão "Menu" que abre um dialog em tela cheia com uma grade de todas as opções de navegação do sistema, otimizando o espaço da tela.

### Ferramentas e Infraestrutura
- **Build Arg para Google Client ID**: Atualizado o `Dockerfile` do frontend e o script `build-images.ps1` para lerem automaticamente o `VITE_GOOGLE_CLIENT_ID` do arquivo `.env` do frontend e injetarem na compilação do React.

---

## Próximos Passos (Para o Usuário Executar)

1. **Rodar a atualização dos containers do Docker**:
   Como você mesmo indicou que cuida dessa parte (conforme nossa Regra de Ouro), execute o comando a seguir na máquina de deploy/desenvolvimento para aplicar as correções:
   ```bash
   docker-compose down
   docker-compose build backend
   docker-compose up -d
   ```
2. **Testar o fluxo**:
   Acesse a aba de Gestão de Trilhas, clique em "Nova Trilha" e verifique se o campo de busca funciona direitinho e se o layout está luxuoso como pedimos!
