# Progresso do Projeto - 07/04/2026

## Alterações Realizadas (Fase 3 - Permissões e Gestão de Eventos)

### Backend (`cracha-virtual-system`)
- **Expansão da Visibilidade de Eventos**: Refatorada a lógica de `getAllEvents` para permitir que Organizadores e Coordenadores de Check-in visualizem eventos públicos e da sua unidade (escola), mesmo que não sejam os criadores. Isso possibilita que esses perfis se inscrevam em outros eventos da plataforma.
- **Filtro de Gestão (`managedOnly`)**: Implementado suporte ao parâmetro `managedOnly` na listagem de eventos. Quando ativado, filtra apenas eventos onde o usuário é dono ou faz parte da equipe, garantindo que painéis administrativos fiquem limpos.
- **Reatribuição de Eventos**: A função `updateEvent` agora permite que um `ADMIN` altere o `creatorId` de um evento, possibilitando a transferência de responsabilidade entre organizadores.
- **Filtro de Papéis na Listagem de Usuários**: A função `getAllUsers` agora aceita um parâmetro `role` (ex: `?role=ORGANIZER`), facilitando a busca por perfis específicos no frontend.

### Frontend (`cracha-virtual-frontend`)
- **Contextualização de Filtros**: As páginas de Administração (`Admin.jsx`), Check-in (`CheckIn.jsx`) e Gerenciamento de Inscritos (`EventEnrollments.jsx`) foram atualizadas para usar o parâmetro `managedOnly=true`, mantendo o foco do usuário apenas em suas tarefas de gestão.
- **Interface de Reatribuição**: Adicionado o campo "Responsável pelo Evento" no formulário de edição de eventos (visível apenas para Admins). O campo utiliza uma busca dinâmica para selecionar o novo organizador.

### Ferramentas e Infraestrutura
- **Script de Build Inteligente (`build-images.ps1`)**: O script de automação foi atualizado para ser interativo. Agora permite escolher buildar apenas Frontend, Backend ou Ambos, além de sugerir e permitir a alteração da versão da stack (Tag Docker).
- **Preparação para Versão 2.4.4**: Definida a estrutura para o deploy da nova versão contendo essas melhorias de permissão.

## Problemas Resolvidos (Finalizado)
1. **Organizadores e Coordenadores não conseguiam se inscrever**: Resolvido desacoplando a visibilidade pública da visibilidade de gestão.
2. **Eventos "Presos" a criadores que saíram do sistema**: Resolvido com a função de reatribuição para admins.
3. **Lentidão no processo de Build**: Resolvido permitindo o build modular (apenas o que mudou).

## Próximos Passos
- Executar o deploy da versão 2.4.4.
- Validar se a reatribuição de eventos reflete corretamente no Dashboard do novo organizador.
