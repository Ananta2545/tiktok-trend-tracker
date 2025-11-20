# TikTok Trend Tracker

<div align="center">
  <h1>🚀 Real-time TikTok Trend Analytics Platform</h1>
  <p>Monitor viral content patterns, trending sounds, and emerging hashtags in real-time</p>
  
  ![Next.js](https://img.shields.io/badge/Next.js-14.0-black?style=flat-square&logo=next.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)
  ![Prisma](https://img.shields.io/badge/Prisma-5.7-2D3748?style=flat-square&logo=prisma)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-TimescaleDB-336791?style=flat-square&logo=postgresql)
  ![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?style=flat-square&logo=redis)
</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Contributing](#-contributing)

---

## ✨ Features

### Core Features ✅

#### 🔐 Authentication & User Management
- **OAuth Social Login**: Google and GitHub integration
- **User Preferences**: Customizable notification settings
- **API Rate Limit Dashboard**: Monitor API usage and quotas
- **Secure Sessions**: JWT-based authentication with NextAuth

#### 🔍 Trend Discovery Engine
- **Real-time Trending Hashtags**: RapidAPI TikTok integration
- **Viral Video Detection**: Advanced algorithm with trend scoring
- **Sound/Music Trend Tracking**: Monitor viral audio clips
- **Creator Growth Monitoring**: Track influencer metrics

#### 📊 Data Visualization
- **Live Trend Charts**: D3.js interactive visualizations
- **Geographic Heat Maps**: Regional trend analysis
- **Trend Lifecycle Visualization**: Track trends from emergence to decline
- **Engagement Prediction Graphs**: AI-powered trend forecasting

#### 🔔 Alert System
- **Custom Trend Alerts**: Set thresholds for hashtags, sounds, creators
- **Email/Webhook Notifications**: Real-time alerts via multiple channels
- **Threshold-based Triggers**: Automated monitoring
- **Daily Trend Digests**: Scheduled email summaries

### Bonus Features 🎁

- **AI-powered Trend Predictions**: Machine learning trend forecasting
- **Content Idea Generator**: Suggest content based on trends
- **Competitor Tracking**: Monitor specific creators
- **Trend Participation Tracker**: Track your content performance

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Visualization**: D3.js, Recharts
- **State Management**: Zustand, React Query
- **Animation**: Framer Motion
- **UI Components**: Custom components with Lucide icons

### Backend
- **Runtime**: Node.js 20
- **API**: Next.js API Routes
- **Real-time**: Socket.io (WebSocket)
- **Authentication**: NextAuth.js
- **API Integration**: Axios + RapidAPI

### Database & Cache
- **Database**: PostgreSQL with TimescaleDB (time-series optimization)
- **ORM**: Prisma
- **Cache**: Redis
- **Queue**: Bull (background jobs)

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Email**: Nodemailer
- **Webhooks**: Custom webhook system

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

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- RapidAPI Account (for TikTok API)
- OAuth Credentials (Google/GitHub)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/tiktok-trend-tracker.git
cd tiktok-trend-tracker
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Database
DATABASE_URL="postgresql://tiktok:tiktok_password@localhost:5432/tiktok_trends"

# Redis
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# RapidAPI
RAPIDAPI_KEY="your-rapidapi-key"
RAPIDAPI_HOST="tiktok-scraper7.p.rapidapi.com"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

4. **Start services with Docker**
```bash
docker-compose up -d
```

5. **Run database migrations**
```bash
npx prisma migrate dev
```

6. **Generate Prisma Client**
```bash
npx prisma generate
```

7. **Start development server**
```bash
npm run dev
```

8. **Start background worker** (in another terminal)
```bash
npm run worker
```

Visit [http://localhost:3000](http://localhost:3000) to see the application!

---

## ⚙️ Configuration

### OAuth Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

#### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Register a new application
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

### RapidAPI Setup
1. Sign up at [RapidAPI](https://rapidapi.com/)
2. Subscribe to [TikTok Scraper API](https://rapidapi.com/yi005/api/tiktok-scraper7/)
3. Copy your API key to `.env`

### Email Setup (Gmail Example)
1. Enable 2-factor authentication on Gmail
2. Generate an App Password
3. Use the app password in `.env`

---

## 📚 API Documentation

### REST Endpoints

#### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

#### Trends
- `GET /api/trends/hashtags` - Get trending hashtags
- `GET /api/trends/sounds` - Get trending sounds
- `GET /api/trends/creators` - Get trending creators

#### Stats
- `GET /api/stats` - Get dashboard statistics

#### Charts
- `GET /api/charts/[type]` - Get chart data (hashtags/sounds/creators)

#### Alerts
- `GET /api/alerts` - List user alerts
- `POST /api/alerts` - Create new alert
- `PUT /api/alerts/[id]` - Update alert
- `DELETE /api/alerts/[id]` - Delete alert

### WebSocket Events

#### Client → Server
- `authenticate` - Authenticate user
- `subscribe:hashtag` - Subscribe to hashtag updates
- `subscribe:sound` - Subscribe to sound updates
- `subscribe:creator` - Subscribe to creator updates

#### Server → Client
- `trend:update` - Real-time trend update
- `trend:alert` - Alert notification
- `system:notification` - System message

---

## 🐳 Deployment

### Docker Production Build

```bash
# Build production image
docker build -t tiktok-trend-tracker .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production

Ensure all environment variables are properly set in production:

```env
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
DATABASE_URL=postgresql://user:pass@prod-db:5432/db
REDIS_URL=redis://prod-redis:6379
```

### Database Migrations

```bash
npx prisma migrate deploy
```

---

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

---

## 📊 Trend Algorithm Explanation

### Trend Score Calculation

The trend score (0-100) is calculated using multiple metrics:

```
TrendScore = (ViewScore × 0.2) + 
             (GrowthScore × 0.3) + 
             (VelocityScore × 0.25) + 
             (EngagementScore × 0.15) + 
             (TimeDecayScore × 0.1)
```

**Components:**
- **ViewScore**: Normalized view count (log scale)
- **GrowthScore**: Percentage growth rate
- **VelocityScore**: Rate of change over time
- **EngagementScore**: Likes + Comments + Shares / Views
- **TimeDecayScore**: Recency factor (exponential decay)

### Viral Detection

Videos are classified as viral based on:
- Views per hour > threshold
- Engagement rate > 8%
- Share rate > 2%
- Rapid growth in first 24 hours

---

## 📁 Project Structure

```
tiktok-trend-tracker/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── cards/            # Card components
│   ├── charts/           # D3.js charts
│   ├── tables/           # Data tables
│   ├── providers.tsx     # Context providers
│   └── socket-provider.tsx # WebSocket provider
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth config
│   ├── prisma.ts         # Prisma client
│   ├── redis.ts          # Redis client
│   ├── socket.ts         # Socket.io server
│   ├── tiktok-api.ts     # TikTok API service
│   ├── trend-analyzer.ts # Trend algorithms
│   └── notification.ts   # Notification service
├── prisma/               # Database schema
│   └── schema.prisma     # Prisma schema
├── workers/              # Background workers
│   └── trend-processor.js # Trend processing worker
├── docker-compose.yml    # Docker composition
├── Dockerfile           # Docker image config
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
└── README.md           # This file
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **RapidAPI** for TikTok data access
- **TimescaleDB** for time-series optimization
- **D3.js** for powerful visualizations
- **Next.js** team for an amazing framework

---

## 📧 Contact

For questions or support, please open an issue or contact:
- Email: support@tiktoktrends.app
- Twitter: [@TikTokTrends](https://twitter.com/tiktoktrends)

---

<div align="center">
  <p>Made with ❤️ by TikTok Trend Tracker Team</p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>
