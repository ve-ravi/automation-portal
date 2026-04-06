# Docker Setup Guide

This guide explains how to run the entire project using Docker and Docker Compose.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │
│  │   Nginx      │   │   API        │   │   Worker     │   │
│  │  (optional)  │─→ │  (Fastify)   │   │  (Node.js)   │   │
│  │   Port 80    │   │  Port 3000   │   │  (Internal)  │   │
│  └──────────────┘   └──────────────┘   └──────────────┘   │
│         │                   │                   │           │
│         └───────────────────┼───────────────────┘           │
│                             │                               │
│         ┌───────────────────┼───────────────────┐           │
│         │                   │                   │           │
│    ┌─────────────┐   ┌─────────────┐   ┌──────────────┐   │
│    │ PostgreSQL  │   │   Redis     │   │  (Other)     │   │
│    │  Port 5432  │   │  Port 6379  │   │              │   │
│    └─────────────┘   └─────────────┘   └──────────────┘   │
│         │                   │                               │
│         └───────────────────┼───────────────────────────────┘
│                             │
│                      Persistent Volumes
│                      - postgres_data
│                      - redis_data
```

## Prerequisites

- **Docker**: [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose**: [Install Docker Compose](https://docs.docker.com/compose/install/)

Verify installation:
```bash
docker --version
docker-compose --version
```

## Project Structure

```
.
├── Dockerfile              # API server image
├── Dockerfile.worker       # Worker process image
├── docker-compose.yml      # Orchestration config
├── .env.example            # Local development config
├── .env.docker             # Docker configuration
├── src/
│   ├── index.ts           # API entry point
│   ├── worker.ts          # Worker entry point
│   ├── config/            # Configurations
│   ├── routes/            # API routes
│   └── services/          # Business logic
└── package.json           # Dependencies
```

## Quick Start

### Option 1: Using Docker Compose (Recommended)

**1. Start all services:**
```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- API Server (port 3000)
- Worker Process (background)

**2. Check service status:**
```bash
docker-compose ps
```

Expected output:
```
NAME                 STATUS          PORTS
fastify_postgres     Up 10 seconds    0.0.0.0:5432->5432/tcp
fastify_redis        Up 10 seconds    0.0.0.0:6379->6379/tcp
fastify_api          Up 5 seconds     0.0.0.0:3000->3000/tcp
fastify_worker       Up 5 seconds
```

**3. View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f worker
docker-compose logs -f postgres
```

**4. Stop services:**
```bash
docker-compose down
```

To also remove volumes (clears database):
```bash
docker-compose down -v
```

---

## Running the Database Migration

The database schema is created automatically when you start the containers, but you need to run migrations.

**Option 1: Execute migration in running container:**
```bash
docker-compose exec api npm run db:push
```

**Option 2: Using Docker Compose directly:**
```bash
docker-compose run --rm api npm run db:push
```

---

## Testing the API

### 1. Register a User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "status": "success",
  "data": {
    "user": { "id": "...", "name": "Test User", "email": "test@example.com" },
    "token": "eyJhbGc..."
  }
}
```

### 2. Create a Task
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Process Payment",
    "type": "payment",
    "priority": "high",
    "payload": {
      "amount": 100,
      "currency": "USD"
    }
  }'
```

### 3. Monitor Worker
```bash
docker-compose logs -f worker
```

You should see:
```
📩 Received job: task-id
⏳ Job task-id started processing
💳 Processing payment task: {...}
✅ Job task-id processed successfully
✅ Completed: Job task-id
```

---

## Environment Configuration

### Local Development (`.env`)
```
DATABASE_URL=postgresql://user:password@localhost:5432/fastify_db
REDIS_URL=redis://localhost:6379
```

### Docker Production (`.env.docker`)
```
DATABASE_URL=postgresql://user:password@postgres:5432/fastify_db
REDIS_URL=redis://redis:6379
```

**Key Difference:** Docker uses service hostnames (`postgres`, `redis`) instead of `localhost`.

---

## Container Details

### PostgreSQL
- **Image**: `postgres:16-alpine`
- **Container**: `fastify_postgres`
- **Port**: `5432`
- **Credentials**: 
  - User: `user`
  - Password: `password`
  - Database: `fastify_db`
- **Volume**: `postgres_data:/var/lib/postgresql/data`

### Redis
- **Image**: `redis:7-alpine`
- **Container**: `fastify_redis`
- **Port**: `6379`
- **Volume**: `redis_data:/data`

### API Server
- **Image**: Built from `Dockerfile`
- **Container**: `fastify_api`
- **Port**: `3000`
- **Liveliness**: Health check every 30s

### Worker Process
- **Image**: Built from `Dockerfile.worker`
- **Container**: `fastify_worker`
- **Job Processing**: Concurrency of 5

---

## Common Commands

### View logs
```bash
# All services
docker-compose logs

# Follow logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail 100

# Specific service
docker-compose logs api
```

### Execute commands in containers
```bash
# Interactive shell
docker-compose exec api sh

# Run migrations
docker-compose exec api npm run db:push

# Type check
docker-compose exec api npm run type-check
```

### Restart services
```bash
# Restart all
docker-compose restart

# Restart specific
docker-compose restart api
docker-compose restart worker
```

### View resource usage
```bash
docker stats
```

---

## Debugging

### Check if Redis is accessible
```bash
docker-compose exec api redis-cli -h redis ping
```

### Check if PostgreSQL is accessible
```bash
docker-compose exec api psql -h postgres -U user -d fastify_db -c "SELECT 1;"
```

### View API container logs with timestamps
```bash
docker-compose logs --timestamps api
```

### Inspect a container
```bash
docker-compose exec api environment
```

---

## Performance Tips

1. **Use named volumes** - Already implemented for data persistence
2. **Health checks** - Prevents failed container dependencies
3. **Multi-stage builds** - Reduces image size (used in Dockerfile)
4. **Alpine images** - Smaller, faster images (postgres:16-alpine, redis:7-alpine)

---

## Troubleshooting

### Issue: Port already in use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Issue: Database connection failed
```bash
# Check if postgres is healthy
docker-compose exec postgres pg_isready -U user

# View postgres logs
docker-compose logs postgres
```

### Issue: Redis connection failed
```bash
# Check if redis is healthy
docker-compose exec redis redis-cli ping

# View redis logs
docker-compose logs redis
```

### Issue: Worker not processing jobs
```bash
# Check worker logs
docker-compose logs -f worker

# Verify Redis connectivity
docker-compose exec worker redis-cli -h redis ping

# Verify Database connectivity
docker-compose exec worker psql -h postgres -U user -d fastify_db -c "SELECT 1;"
```

### Issue: Need to rebuild images
```bash
# Rebuild without cache
docker-compose build --no-cache

# Then restart
docker-compose up -d
```

---

## Production Considerations

For production deployment:

1. **Security**
   - Change default credentials in `docker-compose.yml`
   - Use environment secrets instead of hardcoded values
   - Enable PostgreSQL password authentication

2. **Scaling**
   - Use Docker Swarm or Kubernetes
   - Separate worker instances with load balancing
   - Use managed PostgreSQL/Redis services

3. **Monitoring**
   - Add Prometheus for metrics
   - Add ELK stack for logs
   - Set up alerts for failed jobs

4. **Backups**
   - Set up automated PostgreSQL backups
   - Configure Redis persistence
   - Store backups externally

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Guide](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)
- [Node.js Best Practices with Docker](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
