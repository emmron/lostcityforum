# Deploying Lost City Forum to Vercel with PostgreSQL

This guide will help you deploy your Lost City Forum to Vercel with a PostgreSQL database.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. A PostgreSQL database (options below)
3. Git repository for your project

## Step 1: Set Up a PostgreSQL Database

You have several options for PostgreSQL hosting:

### Option 1: Vercel Postgres (Recommended)

1. In your Vercel dashboard, go to "Storage" → "Create New" → "Postgres"
2. Follow the setup wizard to create your database
3. Connect it to your project during deployment

### Option 2: Other PostgreSQL Providers

- [Supabase](https://supabase.com) - Offers a generous free tier
- [Railway](https://railway.app) - Simple setup with GitHub integration
- [Neon](https://neon.tech) - Serverless PostgreSQL with a free tier
- [ElephantSQL](https://www.elephantsql.com) - PostgreSQL as a Service

## Step 2: Configure Your Project

1. Make sure your `schema.prisma` file uses PostgreSQL:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Update your `.env` file with your PostgreSQL connection string:
   ```
   DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
   ```

## Step 3: Deploy to Vercel

### From Git Repository:

1. Connect your repository to Vercel
2. During setup, add the environment variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Your PostgreSQL connection string

### Using Vercel CLI:

1. Install Vercel CLI: `npm i -g vercel`
2. Run deployment: `vercel --prod`
3. Add your environment variables when prompted

## Step 4: Run Migrations on First Deploy

After your first deployment, you need to run migrations:

```bash
# Pull environment variables from Vercel
npx vercel env pull .env.production

# Run migrations using the production database
DATABASE_URL="your-postgres-connection-url" npx prisma migrate deploy
```

## Troubleshooting

### Database Connection Issues

- Check if your database accepts connections from Vercel's IP range
- Ensure your connection string is correctly formatted
- For local connections, make sure you have PostgreSQL running

### Migration Errors

If you encounter migration errors:

1. Check your PostgreSQL version (Vercel Postgres uses v14)
2. Try resetting migrations:
   ```
   npm run prisma:reset
   ```

## Additional Resources

- [Prisma with PostgreSQL](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project/relational-databases/connect-your-database-node-postgresql)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Deploying Astro to Vercel](https://docs.astro.build/en/guides/deploy/vercel/)
