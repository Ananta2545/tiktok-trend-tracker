# TikTok Trend Tracker - Setup Guide

## Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Get your RapidAPI key:
   - Go to https://rapidapi.com/yi005/api/tiktok-scraper7/
   - Subscribe to the API (Free tier available)
   - Copy your API key

3. Set up OAuth (Optional for testing):
   - **Google**: https://console.cloud.google.com/
   - **GitHub**: https://github.com/settings/developers

4. Update `.env` with your credentials

### Step 3: Start Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### Step 4: Start Application

```bash
# Terminal 1: Start Next.js app
npm run dev

# Terminal 2: Start background worker
npm run worker
```

Visit http://localhost:3000 🎉

---

## Detailed Configuration

### Database Setup

The project uses PostgreSQL with TimescaleDB for optimal time-series data handling.

**Option 1: Docker (Recommended)**
```bash
docker-compose up -d postgres
```

**Option 2: Local Installation**
```bash
# Install PostgreSQL
# Install TimescaleDB extension
# Create database
createdb tiktok_trends
```

Update `DATABASE_URL` in `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/tiktok_trends"
```

### Redis Setup

**Option 1: Docker (Recommended)**
```bash
docker-compose up -d redis
```

**Option 2: Local Installation**
```bash
# macOS
brew install redis
redis-server

# Windows
# Use WSL or download from Redis website
```

Update `REDIS_URL` in `.env`:
```
REDIS_URL="redis://localhost:6379"
```

### Authentication Setup

#### NextAuth Secret
Generate a secure secret:
```bash
openssl rand -base64 32
```

Add to `.env`:
```
NEXTAUTH_SECRET="your-generated-secret"
```

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy Client ID and Client Secret to `.env`

#### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - Application name: `TikTok Trend Tracker`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Register application
5. Generate a new client secret
6. Copy Client ID and Client Secret to `.env`

### RapidAPI Configuration

1. Sign up at [RapidAPI](https://rapidapi.com/)
2. Subscribe to [TikTok Scraper API](https://rapidapi.com/yi005/api/tiktok-scraper7/)
   - Free tier: 500 requests/month
   - Basic tier: $9.99/month - 10,000 requests
   - Pro tier: $49.99/month - 100,000 requests
3. Copy your API key from the dashboard
4. Add to `.env`:
```
RAPIDAPI_KEY="your-api-key"
RAPIDAPI_HOST="tiktok-scraper7.p.rapidapi.com"
```

### Email Configuration (Optional)

For Gmail:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification
   - Scroll to "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Copy the generated password
3. Update `.env`:
```
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="TikTok Trends <noreply@tiktoktrends.app>"
```

For other providers (SendGrid, Mailgun, etc.), update the SMTP settings accordingly.

---

## Database Migrations

### Create a Migration
```bash
npx prisma migrate dev --name migration_name
```

### Apply Migrations
```bash
npx prisma migrate deploy
```

### Reset Database
```bash
npx prisma migrate reset
```

### View Database
```bash
npx prisma studio
```

---

## Running the Application

### Development Mode

```bash
# Start all services
npm run dev

# Start worker
npm run worker
```

### Production Mode

```bash
# Build application
npm run build

# Start production server
npm start

# Start worker
npm run worker
```

### Docker Compose (All-in-One)

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

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
- Check PostgreSQL is running: `docker ps`
- Verify DATABASE_URL in `.env`
- Test connection: `npx prisma db pull`

### Issue: Redis connection failed
- Check Redis is running: `docker ps`
- Test connection: `redis-cli ping`

### Issue: API rate limit exceeded
- Check your RapidAPI subscription
- Implement caching (already included)
- Reduce polling frequency in workers

### Issue: OAuth not working
- Verify callback URLs match exactly
- Check OAuth credentials in `.env`
- Clear browser cookies and try again

---

## Testing

### Run Tests
```bash
npm test
```

### Run Specific Test
```bash
npm test -- path/to/test.ts
```

### Test Coverage
```bash
npm run test:coverage
```

---

## Performance Optimization

### Enable Caching
Redis caching is enabled by default with 5-minute TTL.

### Database Optimization
- TimescaleDB automatically optimizes time-series queries
- Indexes are created for frequently queried fields
- Partitioning by timestamp for better performance

### Background Jobs
- Trend updates: Every 5 minutes
- Alert checks: Every minute
- Daily digests: 9 AM daily

Adjust in `workers/trend-processor.js`

---

## Security Best Practices

1. **Never commit `.env` file**
2. **Use strong passwords** for database
3. **Enable HTTPS** in production
4. **Keep dependencies updated**: `npm audit`
5. **Rate limit API endpoints** (included)
6. **Validate all user inputs** (included)
7. **Use environment-specific configs**

---

## Next Steps

1. ✅ Complete setup
2. 📝 Customize UI/UX
3. 🎨 Add your branding
4. 🚀 Deploy to production
5. 📊 Monitor analytics
6. 🔧 Optimize based on usage

---

## Support

Need help? Check:
- 📖 [Main README](README.md)
- 🐛 [GitHub Issues](https://github.com/yourusername/tiktok-trend-tracker/issues)
- 💬 [Discussions](https://github.com/yourusername/tiktok-trend-tracker/discussions)

---

Happy tracking! 🎉
