# ThesisFlow - PhD Thesis Management SaaS

## Overview
ThesisFlow is a full-stack SaaS web application designed for PhD and Master's students to manage and write their thesis from start to finish. It combines AI-powered writing assistance with project management and supervisor collaboration features.

## Tech Stack
- **Frontend**: React 18 with TypeScript, Tailwind CSS, Shadcn/UI components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **AI**: OpenAI GPT-5 for writing assistance
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state

## Project Structure
```
├── client/src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Shadcn UI primitives
│   │   ├── AppSidebar.tsx # Main navigation sidebar
│   │   ├── ThemeProvider.tsx # Dark/light mode
│   │   └── ThemeToggle.tsx
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.ts     # Authentication hook
│   │   └── use-toast.ts   # Toast notifications
│   ├── lib/               # Utilities
│   │   ├── queryClient.ts # TanStack Query setup
│   │   ├── authUtils.ts   # Auth helpers
│   │   └── utils.ts       # General utilities
│   ├── pages/             # Route components
│   │   ├── Landing.tsx    # Public landing page
│   │   ├── Onboarding.tsx # New user setup wizard
│   │   ├── Dashboard.tsx  # Main dashboard
│   │   ├── Planner.tsx    # Milestone timeline
│   │   ├── Tasks.tsx      # Kanban task board
│   │   ├── Editor.tsx     # Writing workspace
│   │   ├── References.tsx # Citation manager
│   │   └── Settings.tsx   # User settings
│   └── App.tsx            # Root component with routes
├── server/
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Database operations
│   ├── db.ts              # Database connection
│   └── replitAuth.ts      # Authentication setup
├── shared/
│   └── schema.ts          # Database schema & types
└── design_guidelines.md   # UI/UX design system
```

## Database Schema
- **users**: User accounts with profile info, study level, field
- **sessions**: Auth session storage for Replit Auth
- **theses**: Thesis projects with title, topic, research questions
- **chapters**: Thesis chapters with content, word count, status
- **tasks**: Kanban tasks linked to chapters
- **milestones**: Timeline milestones for thesis progress
- **comments**: Supervisor comments on chapters
- **references**: Bibliography entries with citation formatting
- **sharedAccess**: Supervisor collaboration links

## API Endpoints
- `GET /api/auth/user` - Get current user
- `POST /api/onboarding/complete` - Complete onboarding wizard
- `GET /api/dashboard` - Dashboard data with stats
- `GET /api/planner` - Planner with milestones
- `POST /api/milestones` - Create milestone
- `PATCH /api/milestones/:id` - Update milestone
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `GET /api/editor` - Editor with chapters
- `POST /api/chapters` - Create chapter
- `PATCH /api/chapters/:id` - Update chapter
- `POST /api/ai/assist` - AI writing assistance
- `GET /api/references` - Get references
- `POST /api/references` - Create reference
- `GET /api/settings` - User settings
- `PATCH /api/settings/profile` - Update profile
- `PATCH /api/settings/thesis` - Update thesis
- `POST /api/settings/share` - Create share link

## Key Features
1. **Onboarding Wizard**: Captures study level, field, thesis topic, research questions
2. **Dashboard**: Overview with stats, chapters, tasks, milestones
3. **Thesis Planner**: Visual timeline with milestones
4. **Kanban Tasks**: Drag-and-drop task board (To Do, In Progress, Review, Done)
5. **Writing Workspace**: Rich text editor with AI assistance
6. **AI Assistant**: Generate outlines, rewrite in academic tone, summarize, suggest structure
7. **Reference Manager**: APA/MLA/Chicago citation styles with export
8. **Supervisor Sharing**: Share links with read/comment permissions
9. **Dark Mode**: Full theme support

## Running the App
- Development: `npm run dev` (starts both frontend and backend)
- Database push: `npm run db:push`

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-provided)
- `SESSION_SECRET` - Session encryption secret (auto-provided)
- `OPENAI_API_KEY` - OpenAI API key for AI features (optional)
