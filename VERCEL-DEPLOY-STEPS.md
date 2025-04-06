# Step-by-Step Guide to Fix Vercel Deployment

This guide will help you fix the database connection issues and successfully deploy your Lost City Forum to Vercel.

## Problem

The error message: `Failed to connect to database: PrismaClientInitializationError: error: Error validating datasource db: the URL must start with the protocol file:.`

This error indicates a mismatch between your database provider configuration and the connection string. You're using PostgreSQL as the provider but trying to connect with a SQLite connection string.

## Solution Steps

### 1. Use SQLite for Local Development

For local development, we've configured your project to use SQLite, which doesn't require a separate database server.

### 2. Prepare for Vercel Deployment

When ready to deploy to Vercel, follow these steps:

#### 2.1. Update schema.prisma for PostgreSQL

```bash
# Edit prisma/schema.prisma and change:
datasource db {
  provider = "postgresql"  # Change from "sqlite" to "postgresql"
  url      = env("DATABASE_URL")
}
```

#### 2.2. Set up a PostgreSQL Database

Choose one of these options:
- **Vercel Postgres** (recommended): In your Vercel dashboard → Storage → Create New → Postgres
- **Neon**: https://neon.tech (Serverless PostgreSQL with free tier)
- **Supabase**: https://supabase.com (PostgreSQL with generous free tier)
- **Railway**: https://railway.app (Simple setup with GitHub integration)

#### 2.3. Deploy to Vercel

```bash
# Make sure you've committed your changes
git add .
git commit -m "Update for PostgreSQL deployment"
git push

# Deploy to Vercel
npx vercel --prod
```

#### 2.4. Set Environment Variables in Vercel

In your Vercel project dashboard:
1. Go to Settings → Environment Variables
2. Add `DATABASE_URL` with your PostgreSQL connection string
   Format: `postgresql://username:password@host:port/database?schema=public`

#### 2.5. Run Migrations on First Deploy

After the first deployment:

```bash
# Pull environment variables from Vercel
npx vercel env pull .env.production

# Apply migrations to the production database
npx prisma migrate deploy
```

## Switching Between Local and Production

### For Local Development (SQLite)
```bash
# In .env
DATABASE_URL="file:./dev.db"

# In schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### For Production (PostgreSQL)
```bash
# In schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# In Vercel environment variables
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
```

## Troubleshooting

If you continue to experience issues:

1. Check if your DATABASE_URL environment variable is correctly set in Vercel
2. Verify that your PostgreSQL database is accessible from Vercel's servers
3. Check the Vercel deployment logs for specific error messages
4. Try running `npx prisma db push` instead of migrations if migrations fail