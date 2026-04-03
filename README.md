# Fastify PostgreSQL Backend

A backend API built with Fastify, PostgreSQL, and Drizzle ORM using TypeScript.

## Prerequisites

- Node.js 18+
- Docker and Docker Compose (for PostgreSQL)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the values if needed:

```bash
cp .env.example .env
```

### 3. Start PostgreSQL

```bash
docker-compose up -d
```

### 4. Generate Drizzle Migrations

```bash
npm run db:generate
```

### 5. Run Migrations

```bash
npm run db:migrate
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production build
- `npm run db:generate` - Generate new migrations
- `npm run db:migrate` - Run pending migrations
- `npm run db:studio` - Open Drizzle Studio
- `npm run type-check` - Check TypeScript without emitting

## Project Structure

```
src/
├── index.ts              # Application entry point
├── config/
│   ├── env.ts           # Environment variables
│   └── database.ts      # Database connection
├── db/
│   ├── schema.ts        # Drizzle ORM schema
│   ├── migrate.ts       # Migration runner
│   └── migrations/      # Generated migrations
└── routes/
    └── health.ts        # Health check routes
```

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check with uptime

## Database

This project uses PostgreSQL as the primary database with Drizzle ORM for type-safe queries.

### Example Schema

The `users` table is included as an example with the following columns:
- `id` (serial, primary key)
- `name` (varchar)
- `email` (varchar, unique)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

## Development

1. Create new route files in `src/routes/`
2. Define database schema in `src/db/schema.ts`
3. Generate migrations: `npm run db:generate`
4. Run migrations: `npm run db:migrate`
5. Query database using Drizzle ORM in your route handlers

## TypeScript

All code is written in TypeScript with strict mode enabled. Use ES modules for imports/exports.

## License

MIT
