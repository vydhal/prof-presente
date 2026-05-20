# Progresso do Projeto - 20/05/2026

## Alterações Realizadas (Fase 4 - Certificados Individuais, Login Google e UX Mobile)

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

## Próximos Passos
- Executar o deploy da nova versão com o script `build-images.ps1`.
- Configurar as credenciais do Google nos arquivos `.env`.
- Testar e validar a experiência de ponta a ponta.
