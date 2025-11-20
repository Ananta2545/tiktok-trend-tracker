<div align="center">

# 🚀 TikTok Trend Tracker

### Real-time TikTok Analytics & Trend Discovery Platform

**Monitor viral content patterns, trending sounds, and emerging hashtags with AI-powered predictions**

</div>

---

## 📸 Screenshots

### Dashboard Overview
<!-- ![Dashboard Screenshot](docs/images/dashboard.png) -->
<img width="1919" height="969" alt="image" src="https://github.com/user-attachments/assets/a89c350d-9cda-4821-9e45-484f0c3ba8e7" />


### Trend Charts & Analytics
<!-- ![Trend Charts](docs/images/charts.png) -->
<img width="1901" height="801" alt="image" src="https://github.com/user-attachments/assets/45094f3d-25b3-41ed-b4c3-98149d53a293" />

### API Rate Limit Dashboard
<!-- ![API Dashboard](docs/images/api-dashboard.png) -->
<img width="1919" height="972" alt="image" src="https://github.com/user-attachments/assets/e66119d8-2b39-4ac1-8dee-018d46f275c7" />


### Alert Management
<!-- ![Alerts](docs/images/alerts.png) -->
<img width="1186" height="877" alt="image" src="https://github.com/user-attachments/assets/9005d45d-5e98-43fe-9e75-2dbcf9a28976" />

---

## 🎥 Demo Video

<!-- [![Demo Video](docs/images/video-thumbnail.png)](https://youtu.be/your-video-id) -->
> *Click to watch the full demo video*

---

## ✨ Features

### 🔐 Authentication & User Management
- OAuth social login (Google, GitHub)
- Secure session management with NextAuth.js
- User preference customization
- Per-user API rate limiting
- Profile management

### 🔍 Trend Discovery Engine
- **Real-time Trending Hashtags** - Track viral hashtags with view counts and growth rates
- **Viral Sound Detection** - Monitor trending audio clips and music
- **Creator Growth Tracking** - Follow influencer metrics and engagement
- **Trend Velocity Analysis** - Measure how fast trends are spreading
- **Historical Data** - 9+ days of real TikTok trend data

### 📊 Data Visualization & Analytics
- **Interactive D3.js Charts** - Multi-series line charts with hover tooltips
- **Trend Lifecycle Graphs** - Visualize trends from emergence to decline
- **Engagement Predictions** - AI-powered forecasting
- **Performance Metrics** - Response time, success rate, endpoint analysis
- **Real-time Updates** - Live data refresh every 5 seconds

### 🔔 Smart Alert System
- Custom threshold-based alerts
- Multi-channel notifications (Email, Webhook)
- Daily trend digest emails
- Configurable alert triggers
- Alert history and tracking

### 🤖 AI-Powered Features
- **Trend Predictions** - Forecast trend growth trajectory
- **Content Ideas Generator** - Get suggestions based on trending topics
- **Competitor Analysis** - Track and compare creator performance
- **Lifecycle Prediction** - Identify trend stages (Emerging, Peak, Declining)

---

## 🛠 Tech Stack

<table>
<tr>
<td valign="top" width="33%">

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **D3.js** - Interactive data visualizations
- **Chart.js** - Responsive charts
- **TanStack Query** - Data fetching & caching
- **Framer Motion** - Smooth animations
- **Lucide Icons** - Beautiful icons

</td>
<td valign="top" width="33%">

### Backend
- **Node.js** - JavaScript runtime
- **Next.js API Routes** - RESTful API
- **NextAuth.js** - Authentication
- **Prisma ORM** - Database toolkit
- **Socket.io** - WebSocket real-time
- **Bull** - Background job queue
- **Nodemailer** - Email service
- **Axios** - HTTP client

</td>
<td valign="top" width="33%">

### Infrastructure
- **PostgreSQL** - Primary database
- **TimescaleDB** - Time-series data
- **Redis** - Caching & sessions
- **Docker** - Containerization
- **Vercel** - Hosting & deployment
- **GitHub Actions** - CI/CD pipeline
- **RapidAPI** - TikTok data source

</td>
</tr>
</table>

---

## 📁 Project Structure

```
tiktok-trend-tracker/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── trends/               # Trend data APIs
│   │   │   ├── hashtags/
│   │   │   ├── sounds/
│   │   │   └── creators/
│   │   ├── alerts/               # Alert management
│   │   ├── notifications/        # Notification system
│   │   ├── charts/               # Chart data endpoints
│   │   ├── rate-limit/           # Rate limit tracking
│   │   ├── ai/                   # AI predictions & ideas
│   │   └── cron/                 # Scheduled jobs
│   ├── dashboard/                # Main dashboard
│   ├── rate-limit/               # API usage dashboard
│   ├── ai-features/              # AI tools page
│   ├── settings/                 # User settings
│   ├── notifications/            # Notifications page
│   └── auth/                     # Auth pages
│
├── components/                   # React Components
│   ├── charts/                   # D3.js & Chart.js components
│   ├── tables/                   # Data tables
│   ├── cards/                    # Stat cards
│   └── providers.tsx             # Context providers
│
├── lib/                          # Core Libraries
│   ├── auth.ts                   # NextAuth configuration
│   ├── prisma.ts                 # Prisma client
│   ├── redis.ts                  # Redis client
│   ├── tiktok-api.ts             # RapidAPI integration
│   ├── trend-analyzer.ts         # Trend detection algorithms
│   ├── notification.ts           # Email notifications
│   ├── webhook.ts                # Webhook system
│   └── utils.ts                  # Utility functions
│
├── prisma/                       # Database Schema
│   └── schema.prisma             # Prisma schema definition
│
├── scripts/                      # Utility Scripts
│   ├── seed-data.js              # Database seeding
│   ├── fetch-real-data.js        # Fetch TikTok data
│   ├── generate-user-api-usage.js # Generate test data
│   ├── check-submission-readiness.js # Verify project
│   ├── check-trends.js           # Check trend data
│   ├── list-users.js             # List users
│   └── trend-monitor.js          # Background worker
│
├── types/                        # TypeScript Types
│   └── next-auth.d.ts            # NextAuth type extensions
│
├── workers/                      # Background Workers
│   └── trend-processor.js        # Trend processing worker
│
├── docker-compose.yml            # Docker orchestration
├── Dockerfile                    # Container definition
├── .env.example                  # Environment variables template
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
└── tsconfig.json                 # TypeScript configuration
```

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Next.js Frontend + D3.js Visualizations + Socket.io)      │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    API Layer (Next.js)                       │
│  • REST Endpoints  • WebSocket Server  • Authentication     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Service Layer                               │
│  • TikTok API Service  • Trend Analyzer  • Notification     │
└──────┬────────────────┴────────────────┬────────────────────┘
       │                                  │
┌──────▼─────────┐            ┌──────────▼────────────┐
│  Background    │            │    Database Layer      │
│    Workers     │◄───────────┤  PostgreSQL+TimescaleDB│
│  (Bull Queue)  │            │       (Prisma)         │
└──────┬─────────┘            └────────────────────────┘
       │
┌──────▼─────────┐
│  Redis Cache   │
│  & Pub/Sub     │
└────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** 20.x or higher
- **npm** or **yarn**
- **Docker** & **Docker Compose** (optional, for containerized setup)
- **PostgreSQL** (or use Docker)
- **Redis** (or use Docker)

### Quick Setup

#### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/Ananta2545/tiktok-trend-tracker.git
cd tiktok-trend-tracker

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials (see Configuration section)

# Start all services with Docker Compose
docker-compose up -d

# Access the application
open http://localhost:3000
```

#### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/Ananta2545/tiktok-trend-tracker.git
cd tiktok-trend-tracker

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Set up the database
npx prisma migrate dev
npx prisma generate

# Seed initial data (optional)
npm run seed

# Start development server
npm run dev

# Access the application
open http://localhost:3000
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/tiktok_trends?schema=public"

# Redis Cache
REDIS_URL="redis://localhost:6379"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-using-openssl-rand-base64-32"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-secret"
GITHUB_CLIENT_ID="your-github-oauth-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-secret"

# RapidAPI (TikTok Data)
RAPIDAPI_KEY="your-rapidapi-key"
RAPIDAPI_HOST="tiktok-scraper7.p.rapidapi.com"

# Email Notifications (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-specific-password"
SMTP_FROM="TikTok Trends <noreply@tiktoktrends.com>"

# Webhook (Optional)
WEBHOOK_SECRET="your-webhook-secret"

# Cron Job Secret
CRON_SECRET="your-cron-secret-key"
```

### Setting Up OAuth Providers

<details>
<summary><b>📱 Google OAuth Setup</b></summary>

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Configure consent screen if prompted
6. Add authorized redirect URI:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Copy **Client ID** and **Client Secret** to `.env`

</details>

<details>
<summary><b>🐙 GitHub OAuth Setup</b></summary>

1. Go to GitHub Settings > Developer settings > [OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in application details:
   - Application name: TikTok Trend Tracker
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Click **Register application**
5. Generate a new client secret
6. Copy **Client ID** and **Client Secret** to `.env`

</details>

<details>
<summary><b>⚡ RapidAPI Setup</b></summary>

1. Create account at [RapidAPI](https://rapidapi.com/)
2. Subscribe to [TikTok Scraper API](https://rapidapi.com/yi005/api/tiktok-scraper7/)
3. Choose a pricing plan (Free tier available)
4. Copy **X-RapidAPI-Key** from dashboard
5. Add to `.env` as `RAPIDAPI_KEY`

</details>

<details>
<summary><b>📧 Email Configuration (Gmail)</b></summary>

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use the 16-character app password in `.env`:
   ```env
   SMTP_USER="your-email@gmail.com"
   SMTP_PASSWORD="your-16-char-app-password"
   ```

</details>

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run worker` | Start background worker |
| `npm run seed` | Seed database with sample data |
| `npm run fetch:real` | Fetch real TikTok data |
| `npm run monitor` | Run trend monitoring |
| `npx prisma studio` | Open Prisma database GUI |
| `npx prisma migrate dev` | Create new migration |
| `npx prisma db push` | Push schema to database |

---

## 📊 Usage Examples

### Fetching Real-Time Trends

```bash
# Fetch latest trending hashtags, sounds, and creators
npm run fetch:real

# Start continuous monitoring
npm run monitor
1. Enable 2-factor authentication on Gmail
2. Generate an App Password
3. Use the app password in `.env`

### Generate Sample Data

```bash
# Generate test API usage data for a user
node scripts/generate-user-api-usage.js your@email.com

# Check trend data coverage
node scripts/check-trends.js

# Verify submission readiness
node scripts/check-submission-readiness.js
```

---

## 📚 API Documentation

<details>
<summary><b>🔐 Authentication Endpoints</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/session` | Get current user session |
| `POST` | `/api/auth/signin` | Sign in with OAuth |
| `POST` | `/api/auth/signout` | Sign out current user |

</details>

<details>
<summary><b>📈 Trend Data Endpoints</b></summary>

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/api/trends/hashtags` | Trending hashtags | Array of hashtag trends |
| `GET` | `/api/trends/sounds` | Trending sounds | Array of sound trends |
| `GET` | `/api/trends/creators` | Trending creators | Array of creator trends |
| `GET` | `/api/stats` | Dashboard statistics | Stats summary |
| `GET` | `/api/charts/[type]` | Chart data | Time-series data |

</details>

<details>
<summary><b>🔔 Alert Management</b></summary>

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `GET` | `/api/alerts` | List all user alerts | - |
| `POST` | `/api/alerts` | Create new alert | Alert config |
| `PUT` | `/api/alerts/[id]` | Update alert | Updated config |
| `DELETE` | `/api/alerts/[id]` | Delete alert | - |
| `POST` | `/api/alerts/[id]/toggle` | Toggle alert | - |

</details>

<details>
<summary><b>📊 Analytics & Monitoring</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/rate-limit` | API usage statistics |
| `GET` | `/api/notifications` | User notifications |
| `GET` | `/api/notifications/count` | Unread count |
| `POST` | `/api/notifications/mark-all-read` | Mark all as read |

</details>

<details>
<summary><b>🤖 AI Features</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/predict` | Trend predictions |
| `POST` | `/api/ai/content-ideas` | Content suggestions |
| `GET` | `/api/competitor` | Competitor analysis |

</details>

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Ananta2545/tiktok-trend-tracker)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add REDIS_URL
# ... add all required env vars
```

### Deploy with Docker

```bash
# Build production image
docker build -t tiktok-trend-tracker:latest .

# Run container
docker run -d \
  --name tiktok-trends \
  -p 3000:3000 \
  --env-file .env.production \
  tiktok-trend-tracker:latest

# Or use docker-compose
docker-compose up -d
```

### Database Migration (Production)

```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

---

## 🧪 Trend Detection Algorithm

### Trend Score Calculation

Our proprietary algorithm calculates trend scores (0-100) using multiple weighted factors:

```typescript
TrendScore = 
  (ViewCount × 0.4) + 
  (GrowthRate × 0.3) + 
  (Velocity × 0.2) + 
  (EngagementRate × 0.1)

Velocity = ViewGrowth / TimePeriod
GrowthRate = ((Current - Previous) / Previous) × 100
```

### Trend Lifecycle Stages

| Stage | Criteria | Description |
|-------|----------|-------------|
| **Emerging** | Growth > 50%, Age < 2 days | Just starting to gain traction |
| **Rising** | Growth 20-50%, Age 2-5 days | Rapidly gaining popularity |
| **Peak** | Growth 10-20%, High views | At maximum popularity |
| **Declining** | Growth < 10% | Losing momentum |
| **Mature** | Stable views, Age > 7 days | Established trend |

### Viral Detection Criteria

Content is classified as "viral" when:
- ✅ Growth rate > 100% in 24 hours
- ✅ Velocity > 50 (high acceleration)
- ✅ Engagement rate > 8%
- ✅ View count > threshold (configurable)


---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## 🐛 Known Issues & Limitations

- **Rate Limiting**: RapidAPI has request limits on free tier
- **WebSocket**: Currently using HTTP polling mode in production
- **Real-time Updates**: 5-minute delay for trend updates via cron
- **Data Coverage**: Historical data limited to API subscription plan
---

## 👨‍💻 Author

**Anata Chatterjee**

- GitHub: [@Ananta2545](https://github.com/Ananta2545)
- Email: chatterjeeanata091@gmail.com

---

<div align="center">

**Made with ❤️ by Anata Chatterjee**
</div
├── tsconfig.json        # TypeScript config
└── README.md           # This file
```


