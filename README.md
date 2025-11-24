# Pro Dev - Keyboard Typing Trainer

A web-based keyboard typing trainer that helps users improve their typing speed and accuracy through 60-second timed sessions.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT

## Project Status

🚧 **In Development** - MVP Phase

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- pnpm (recommended) or npm

### Backend Setup

```bash
cd backend
pnpm install
cp .env.example .env
# Edit .env with your database credentials
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

### Frontend Setup

```bash
cd frontend
pnpm install
cp .env.example .env
# Edit .env with your API URL
pnpm dev
```

## Documentation

See the `/docs` folder for detailed documentation:

- `00-MVP-SIMPLIFIED-CONCEPT.md` - MVP overview and specifications
- `01-PROJECT-ARCHITECTURE.md` - System architecture
- `02-DATABASE-SCHEMA.md` - Database design
- `03-BACKEND-API.md` - API documentation
- `04-FRONTEND-STRUCTURE.md` - Frontend architecture
- `05-GAME-MECHANICS.md` - Future game concept
- `06-FILE-IMPLEMENTATION-GUIDE.md` - Implementation guide

## License

MIT
