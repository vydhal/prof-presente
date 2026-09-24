# 🧭 Documento Norteador Arquitetural: Transição para Plataforma de Cursos EAD (Prof Presente EAD)

> **Este documento serve como a Bíblia de Engenharia e Guia Estratégico para qualquer IA ou Desenvolvedor implementar a migração do ecossistema *Prof Presente* (focado em Eventos e Crachá Virtual) para uma **Plataforma Completa de Cursos Online / EAD**.**

---

## 🎯 1. Visão Geral & Objetivos da Nova Plataforma

A plataforma evoluirá de um sistema de gestão de eventos pontuais para uma **Plataforma EAD Moderna, Mobile-First e Orientada a Experiência do Aluno**.

### Principais Pilares do Novo Sistema:
1. **Instrutor / Professor (Antigo Organizador)**: Cadastra cursos, organiza a grade por **Módulos** e **Videoaulas**, gerencia alunos inscritos e acompanha estatísticas de retenção e conclusão.
2. **Aluno / Estudante (Antigo Participante)**: Explora o catálogo público, matricula-se em cursos, assiste às videoaulas em player dedicado, marca aulas como concluídas, tira dúvidas na **Comunidade** e emite seu **Certificado de Conclusão**.
3. **Vitrine Pública de Cursos**: Exibe os cursos recentes, cursos em destaque, categorias, progresso do aluno logado e botões de matrícula rápida.
4. **Módulo de Comunidade / Fórum**: Espaço de interação em tempo real ou assíncrono entre alunos e instrutores, permitindo comentários por videoaula e um mural de discussões geral por curso.
5. **Certificação Automática**: Concessão de certificado com carga horária total ao atingir 100% de progresso nas videoaulas do curso.

---

## 🔄 2. Mapeamento de Conceitos: Eventos vs. Cursos EAD

| Conceito Antigo (Eventos) | Novo Conceito (Plataforma EAD) | Função no Novo Sistema |
| :--- | :--- | :--- |
| **Evento** (`Event`) | **Curso / Disciplina** (`Course`) | Container principal de conteúdo com capa, instrutor, categoria e carga horária. |
| **Sub-evento / Sessão** | **Módulo** (`Module`) & **Videoaula** (`Lesson`) | Módulos temáticos que contêm videoaulas sequenciais (links de vídeo, texto, materiais). |
| **Organizador** (`ORGANIZER`) | **Professor / Instrutor** (`INSTRUCTOR`) | Perfil responsável por criar e publicar cursos, anexar aulas e interagir com os alunos. |
| **Inscrição em Evento** (`Enrollment`) | **Matrícula no Curso** (`CourseEnrollment`) | Vincula o Aluno ao Curso com status (`ACTIVE`, `COMPLETED`, `CANCELLED`) e cálculo de progresso %. |
| **Check-in** (`UserCheckin`) | **Progresso da Aula** (`LessonProgress`) | Registra quando o aluno concluiu uma videoaula (`isCompleted`, `completedAt`, `watchedSeconds`). |
| **Trilha de Aprendizagem** (`LearningTrack`) | **Formação / Trilha Acadêmica** (`LearningPath`) | Conjunto de múltiplos cursos organizados em uma jornada de especialização. |
| **Crachá Virtual** (`UserBadge`) | **Identidade Estudantil / Passaporte** | Mantido para identificação rápida do aluno, QR Code e validação em encontros/aulas ao vivo. |
| **Certificado por Evento** | **Certificado por Curso/Formação** | Emitido automaticamente em PDF quando o aluno atinge 100% das aulas assistidas. |

---

## 🗄️ 3. Modelo de Banco de Dados Proposto (`prisma/schema.prisma`)

Abaixo está o modelo Prisma evoluído para suportar a arquitetura EAD completa:

```prisma
// --- NOVO ROLE DE USUÁRIO ---
enum UserRole {
  ADMIN
  INSTRUCTOR      // Antigo ORGANIZER (Professor/Instrutor)
  TEACHER         // Professor-Aluno / Profissional da Educação
  USER            // Aluno / Estudante
}

// --- CURSO (Antigo Event) ---
model Course {
  id          String   @id @default(uuid())
  title       String
  description String
  coverUrl    String?
  workload    Int      @default(0) // Carga Horária Total em horas
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  instructorId String
  instructor   User   @relation("InstructorCourses", fields: [instructorId], references: [id])

  categoryId   String?
  category     Category? @relation(fields: [categoryId], references: [id])

  modules       Module[]
  enrollments   CourseEnrollment[]
  posts         CommunityPost[]
  certificateLogs CertificateLog[]

  @@map("courses")
}

// --- MÓDULO DO CURSO ---
model Module {
  id          String   @id @default(uuid())
  courseId    String
  title       String
  description String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())

  course  Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons Lesson[]

  @@map("modules")
}

// --- VIDEOAULA / AULA ---
model Lesson {
  id           String   @id @default(uuid())
  moduleId     String
  title        String
  description  String?
  videoUrl     String   // Link do YouTube, Vimeo, MP4 ou HLS
  durationSec  Int      @default(0) // Duração em segundos
  order        Int      @default(0)
  attachmentUrl String? // Material complementar (PDF, Slides)
  createdAt    DateTime @default(now())

  module     Module           @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  progresses LessonProgress[]
  comments   LessonComment[]

  @@map("lessons")
}

// --- PROGRESSO DA VIDEOAULA POR ALUNO (Substitui Check-in) ---
model LessonProgress {
  id           String    @id @default(uuid())
  userId       String
  lessonId     String
  isCompleted  Boolean   @default(false)
  completedAt  DateTime?
  watchedSec   Int       @default(0) // Tempo assistido
  createdAt    DateTime  @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@map("lesson_progresses")
}

// --- MATRÍCULA NO CURSO ---
model CourseEnrollment {
  id          String    @id @default(uuid())
  userId      String
  courseId    String
  progress    Float     @default(0) // Percentual 0 a 100%
  isCompleted Boolean   @default(false)
  completedAt DateTime?
  createdAt   DateTime  @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
  @@map("course_enrollments")
}

// --- MÓDULO DE COMUNIDADE (FÓRUM E DÚVIDAS) ---
model CommunityPost {
  id        String   @id @default(uuid())
  courseId  String
  userId    String
  title     String
  content   String
  createdAt DateTime @default(now())

  course  Course         @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user    User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  replies PostReply[]

  @@map("community_posts")
}

model PostReply {
  id        String   @id @default(uuid())
  postId    String
  userId    String
  content   String
  createdAt DateTime @default(now())

  post CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("post_replies")
}

model LessonComment {
  id        String   @id @default(uuid())
  lessonId  String
  userId    String
  content   String
  createdAt DateTime @default(now())

  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("lesson_comments")
}
```

---

## 💻 4. Estrutura de Rotas Backend (`back`)

### Rotas de Cursos (`/api/courses`):
- `GET /api/courses`: Lista pública de cursos publicados com filtro por categoria e busca.
- `GET /api/courses/:id`: Detalhes do curso com grade de módulos e aulas.
- `POST /api/courses`: Criar novo curso (Instrutor / Admin).
- `PUT /api/courses/:id`: Editar curso, módulos e ordem.
- `DELETE /api/courses/:id`: Remover curso.

### Rotas de Módulos e Videoaulas (`/api/courses/:courseId/modules`):
- `POST /api/courses/:courseId/modules`: Adicionar módulo ao curso.
- `POST /api/modules/:moduleId/lessons`: Cadastrar videoaula no módulo (URL do vídeo, título, material).
- `PUT /api/lessons/:id`: Editar dados ou link da videoaula.

### Rotas de Progresso e Matrícula (`/api/enrollments` & `/api/progress`):
- `POST /api/courses/:id/enroll`: Matricular aluno no curso.
- `POST /api/lessons/:id/complete`: Marcar videoaula como concluída. Atualiza automaticamente o `progress` do curso de 0 a 100%. Se chegar a 100%, marca `isCompleted = true` e libera o certificado.
- `GET /api/courses/:id/progress`: Consultar o progresso do aluno no curso.

### Rotas da Comunidade (`/api/community` & `/api/comments`):
- `GET /api/courses/:courseId/posts`: Buscar discussões do fórum do curso.
- `POST /api/courses/:courseId/posts`: Criar novo tópico no fórum do curso.
- `POST /api/posts/:postId/replies`: Responder a um tópico da comunidade.
- `GET /api/lessons/:lessonId/comments`: Listar dúvidas de uma videoaula específica.
- `POST /api/lessons/:lessonId/comments`: Enviar dúvida na videoaula.

---

## 🎨 5. Adaptação do Frontend (`front`)

### 1. Landing Page / Vitrine Pública (`LandingPage.jsx`):
- **Hero Section**: Apresentação da Plataforma EAD de Cursos Educacionais.
- **Carrossel de Cursos Recentes & Populares**: Substituir a grade de eventos por carrosséis de **Cursos em Destaque** com capa, carga horária, professor e barra de progresso (se logado).
- **Filtros por Categoria / Área de Conhecimento**: Botões/pills para filtrar os cursos por segmento (Ex: Ed. Infantil, Tecnologia, Gestão Escolar, etc.).

### 2. Player de Videoaulas / Sala de Estudos (`CoursePlayer.jsx`):
- **Layout Split Responsivo (Mobile-First)**:
  - Lado Esquerdo / Superior: Player de Vídeo HTML5/YouTube com botão "Marcar como Concluída" e atalho para a próxima aula.
  - Lado Direito / Inferior: Aba com **Grade de Módulos/Aulas** (com checkmarks de conclusão), Aba de **Materiais em PDF** e Aba de **Dúvidas da Aula**.

### 3. Painel do Professor / Instrutor (`InstructorDashboard.jsx` / `Admin.jsx`):
- Wizard para **Criar Novo Curso**:
  1. Dados Gerais (Título, Descrição, Capa, Carga Horária).
  2. Gerenciador de Módulos (Adicionar Módulos com Drag and Drop ou ordem numérica).
  3. Adicionar Videoaulas em cada Módulo (Título, Link do Vídeo YouTube/StreamYard/Vimeo, PDF).
  4. Publicar Curso.

### 4. Módulo de Comunidade / Fórum (`CommunityFeed.jsx`):
- Aba de **Comunidade** dentro de cada curso.
- Permite criar perguntas, votar nas melhores respostas e receber respostas com destaque do Instrutor/Professor.

### 5. Histórico & Meus Cursos (`MyCourses.jsx` & `UserManagement.jsx`):
- Diálogo amplo (`sm:max-w-5xl`) mantendo a estética responsiva conquistada, exibindo:
  - Cursos Matriculados
  - Barra de Progresso (%)
  - Botão de "Continuar Assistindo"
  - Botão de "Baixar Certificado PDF" (quando 100% concluído).

---

## 📋 6. Guia Passo a Passo para Execução pela IA / Agente

Ao clonar este repositório para a nova plataforma de cursos, o agente de IA deve seguir a sequência abaixo:

1. **Passo 1 - Atualizar Prisma Schema**:
   Substituir a modelagem de `Event` e `UserCheckin` para `Course`, `Module`, `Lesson` e `LessonProgress` em `prisma/schema.prisma` e rodar a migration (`npx prisma db push`).
2. **Passo 2 - Criar Controllers & Rotas Backend**:
   Criar `courseController.js`, `lessonController.js` e `communityController.js` em `src/controllers/`, registrando as rotas em `src/routes/`.
3. **Passo 3 - Atualizar Servidor WebSocket**:
   Manter a estrutura Socket.io em `server.js` para notificações em tempo real quando um professor responder a uma dúvida ou publicar uma nova aula.
4. **Passo 4 - Adaptar Telas Frontend**:
   Transformar a `LandingPage.jsx` na Vitrine de Cursos, criar a tela de Player de Aulas (`CoursePlayer.jsx`) e adaptar o `UserManagement.jsx` para mostrar Cursos Matriculados e Progresso.
5. **Passo 5 - Manter a Qualidade Visual & Regras de Ouro**:
   Manter o padrão de tema Claro/Escuro (CSS Variables `--primary`, `bg-background`, `text-foreground`), layout responsivo mobile-first, suporte a PDF via `jspdf-autotable` e atualizar a tabela em `progresso.md` a cada iteração.

---
*Documento gerado em 18/09/2026 como guia de transição arquitetural para Plataformas de Cursos EAD.*
