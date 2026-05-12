# Prof Presente - Sistema de Gestão de Eventos e Certificação

O **Prof Presente** é uma plataforma completa para gerenciamento de eventos educacionais e corporativos, com foco na simplicidade de uso, credenciamento digital e automação de certificados.

## 🚀 Funcionalidades Principais

### 📅 Gestão Avançada de Eventos
- **Criação e Edição:** Configure título, descrição, datas, local e limite de vagas.
- **Gestão de Equipe (Staff):** Vincule Coordenadores de Check-in e Palestrantes a eventos específicos.
- **Visibilidade Híbrida:** Coordenadores e Palestrantes possuem visão focada nos eventos que gerenciam, mas mantêm acesso total à listagem pública para novas inscrições.
- **Reatribuição Administrativa:** Admins podem transferir a propriedade de eventos entre organizadores, garantindo a continuidade da gestão.
- **Página Pública do Evento:**
  - Visualização rica com **Imagem de Capa** personalizada.
  - **Mapa Interativo (Google Maps)** integrado para fácil localização.
  - **Programação Detalhada:** Exibição elegante em formato de timeline/cards e destaque automático de horários.
  - **Galeria de Palestrantes:** Perfis com fotos de alta qualidade, nome e cargo.
- **Visibilidade:** Controle de eventos Públicos ou Privados (apenas para escolas/gestores específicos).

### 🏛️ Gestão de Espaços e Inventário
- **Controle de Ambientes:** Cadastro e gestão de auditórios, salas e espaços multiuso com capacidade e localização.
- **Agenda Inteligente:** Visualização em formato de lista cronológica com cards detalhados e timeline visual.
- **Fluxo de Aprovação:** Sistema de solicitações integrado com aprovação por gestores ou cerimonial.
- **Protocolo 1Doc:** Campo obrigatório para número de processo/chamado externo, garantindo rastreabilidade.
- **Inventário de Equipamentos:** 
  - Controle de estoque para itens como projetores, microfones, laptops e som.
  - **Cálculo de Disponibilidade:** Sistema inteligente que impede o empréstimo de itens que já estarão em uso em outras reservas na mesma data.
- **Notas de Gestão:** Feedback direto no card da agenda (ex: motivo de rejeição ou observações técnicas).

### 🎫 Credenciamento e Check-in
- **Crachás Digitais:** Geração automática de crachás com QR Code.
- **Templates Personalizáveis:** Editor visual para posicionar nome, QR code e logo no crachá.
- **App de Check-in:** (Módulo Facial/QR) Leitura ágil na entrada do evento.
- **Filtros Adaptativos:** Lista de eventos para check-in inclui eventos "Próximos", permitindo preparação da equipe.

### 📜 Certificados Automatizados
- **Editor de Certificados:** Upload de modelo de fundo e configuração dinâmica (Nome, Carga Horária, Data).
- **Envio Automático:** Disparo de certificados por e-mail para participantes com presença confirmada.
- **Histórico:** Logs de envio para garantir que todos receberam.

### ⚡ Performance e Confiabilidade
- **Invalidação de Cache:** Sistema inteligente que limpa o cache do Redis automaticamente ao alterar a equipe de um evento.
- **Busca Otimizada:** Componente de busca de usuários com auto-complete para facilitar a gestão de equipes.

### 📊 Painel Administrativo
- **Dashboard:** Estatísticas de eventos, inscritos e presença em tempo real.
- **Gestão de Usuários:** Perfis de acesso (Admin, Gestor, Organizador, Professor).
  
## 🛠️ Tecnologias Utilizadas

- **Frontend:** React.js, Vite, TailwindCSS (Design Moderno & Responsivo).
- **Backend:** Node.js, Express.
- **Banco de Dados:** SQLite (via Prisma ORM) - Leve e eficiente.
- **PDF & Imagens:** `pdf-lib` e `sharp` para geração dinâmica de documentos.

## 📦 Como Rodar o Projeto

### Pré-requisitos
- Node.js (v18+)

### 1. Iniciar o Backend (Sistema)
```bash
cd cracha-virtual-system
npm install
npx prisma generate
npx prisma db push  # Cria o banco de dados local
npm run dev
```
O servidor rodará em `http://localhost:3000`.

### 2. Iniciar o Frontend
```bash
cd cracha-virtual-frontend
npm install
npm run dev
```
Acesse a aplicação em `http://localhost:5173`.

---
Desenvolvido para modernizar a gestão educacional.
