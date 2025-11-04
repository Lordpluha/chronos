# Chronos - Docker Commands Reference

## 🚀 Quick Start

### Development (local MongoDB)
```bash
npm run docker:dev
# or
docker compose --profile development up --build
```

### Development (MongoDB Atlas)
```bash
npm run docker:dev-atlas
# or
docker compose --env-file .env.atlas up api web --build
```

### Production
```bash
npm run docker:prod
# or
docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d
```

## 🔧 Useful Commands

### Build images
```bash
npm run docker:build
# or
docker compose build
```

### View logs
```bash
npm run docker:logs
# or
docker compose logs -f [service-name]
```

### Clean up
```bash
npm run docker:clean
# or
docker compose down -v && docker system prune -f
```

### Database only (development)
```bash
npm run docker:db
# or
docker compose --profile development up mongodb -d
```

### Access shell
```bash
# API container
docker compose exec api sh

# MongoDB shell
docker compose exec mongodb mongosh
```

## 📝 Environment Files

- `.env` - Local development with Docker MongoDB
- `.env.atlas` - Development with MongoDB Atlas
- `.env.production` - Production with MongoDB Atlas

## 🗄️ MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com/
2. Create a new cluster (choose Serverless)
3. Create a database user
4. Add your IP to the whitelist
5. Get connection string and update your .env file

Connection string format:
```
mongodb+srv://username:password@cluster.mongodb.net/chronos?retryWrites=true&w=majority
```