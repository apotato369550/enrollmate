# Enrollmate Vercel Deployment Guide

This guide walks you through deploying Enrollmate to Vercel with automated database migrations.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Deployment Steps](#deployment-steps)
4. [Vercel Configuration](#vercel-configuration)
5. [Database Migrations](#database-migrations)
6. [Post-Deployment Checklist](#post-deployment-checklist)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying to Vercel, ensure you have:

- ✅ A Supabase project (free tier is fine)
- ✅ Supabase project URL and API keys
- ✅ GitHub account (for Vercel Git integration)
- ✅ GitHub repository with Enrollmate code
- ✅ Vercel account (free tier works)

**Estimated Setup Time**: 15-20 minutes

---

## Environment Variables

### Step 1: Get Supabase Credentials

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your Enrollmate project
3. Go to **Settings → API**
4. Copy these three keys:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_API`
   - **Anon Key** (public) → `NEXT_PUBLIC_PUBLIC_API_KEY`
   - **Service Role Key** (private) → `SUPABASE_SERVICE_ROLE_KEY`

**⚠️ Important**: Keep the Service Role Key private! Never commit it to GitHub.

### Step 2: Local Development Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_API=https://your-project.supabase.co
   NEXT_PUBLIC_PUBLIC_API_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. Test locally:
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

---

## Deployment Steps

### Step 1: Push Code to GitHub

1. Ensure your repository is on GitHub:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. Your repository should include:
   - ✅ `.env.example` (template)
   - ✅ `vercel.json` (Vercel configuration)
   - ✅ `scripts/run-migrations.js` (migration runner)
   - ✅ `migrations/*.sql` (database migrations)

### Step 2: Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New…"** → **"Project"**
3. Select **"Import Git Repository"**
4. Search for your Enrollmate repository
5. Click **"Import"**

### Step 3: Configure Environment Variables

1. In Vercel project settings, go to **Settings → Environment Variables**
2. Add three environment variables:

   | Variable Name | Value | Scope |
   |---------------|-------|-------|
   | `NEXT_PUBLIC_SUPABASE_API` | Your project URL | Production, Preview |
   | `NEXT_PUBLIC_PUBLIC_API_KEY` | Your anon key | Production, Preview |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Production Only (⚠️) |

   **Note**: Service role key should ONLY be in Production (not Preview). This prevents exposure in pull request previews.

3. Click **"Save"**

### Step 4: Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (2-5 minutes)
3. Once deployed, your site is live at `https://your-project.vercel.app`

---

## Vercel Configuration

### vercel.json Explained

The `vercel.json` file configures Vercel behavior:

```json
{
  "buildCommand": "next build",        // Build script
  "outputDirectory": ".next",          // Output folder
  "installCommand": "npm ci",          // Install dependencies
  "framework": "nextjs",               // Framework detection
  "env": { ... },                      // Environment variables
  "functions": { ... },                // API route config
  "headers": [ ... ]                   // Security headers
}
```

**Security Headers Added**:
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Referrer control

### Custom Domain Setup (Optional)

1. In Vercel project settings, go to **Domains**
2. Add your custom domain (e.g., `enrollmate.com`)
3. Follow DNS setup instructions
4. SSL certificate auto-provisioned by Vercel

---

## Database Migrations

### Automatic Migration on Deploy

Migrations run automatically after build using a Vercel build hook:

1. During build, `scripts/run-migrations.js` is called
2. It checks which migrations have been applied
3. Runs only new migrations
4. Creates migration log table (`_migration_log`)
5. Logs all applied migrations for tracking

### Manual Migration (if needed)

If automatic migrations fail, run manually:

```bash
# From your local machine (with SUPABASE_SERVICE_ROLE_KEY set)
node scripts/run-migrations.js

# Or target a specific migration
node scripts/run-migrations.js 001
```

### Creating New Migrations

When you need to modify the database schema:

1. Create new migration file:
   ```bash
   touch migrations/005_your_migration_name.sql
   ```

2. Write your SQL (use `IF NOT EXISTS` clauses):
   ```sql
   -- migrations/005_add_course_prerequisites.sql
   CREATE TABLE IF NOT EXISTS course_prerequisites (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     course_id UUID REFERENCES semester_courses(id) ON DELETE CASCADE,
     prerequisite_id UUID REFERENCES semester_courses(id) ON DELETE CASCADE,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(course_id, prerequisite_id)
   );

   CREATE INDEX idx_prerequisites_course ON course_prerequisites(course_id);
   ```

3. Commit and push:
   ```bash
   git add migrations/005_add_course_prerequisites.sql
   git commit -m "Add course prerequisites table"
   git push origin main
   ```

4. Vercel redeploys automatically and runs the new migration

---

## Post-Deployment Checklist

After deployment, verify everything is working:

### 1. Test Homepage
- [ ] Visit your Vercel URL (e.g., `https://enrollmate.vercel.app`)
- [ ] Homepage loads without errors
- [ ] No console errors in DevTools

### 2. Test Authentication
- [ ] Sign up with a new account
- [ ] Receive verification email
- [ ] Login with created account
- [ ] Dashboard loads

### 3. Test Database
- [ ] Create a new semester
- [ ] Add courses to library
- [ ] Create a schedule
- [ ] Add courses to schedule
- [ ] No database errors

### 4. Test Conflict Detection
- [ ] Add overlapping courses to schedule
- [ ] Verify conflict is detected
- [ ] Error message displayed

### 5. Monitor Vercel
- [ ] Check Vercel Deployments tab for any build errors
- [ ] Check Function Logs for runtime errors
- [ ] Monitor first 24 hours for issues

### 6. Test Browser Extension
- [ ] Set `ENROLLMATE_API_URL` in extension config
- [ ] Load extension in Chrome
- [ ] Test course extraction
- [ ] Verify courses import to web app

### 7. SSL Certificate
- [ ] Check URL shows 🔒 lock icon
- [ ] Certificate should auto-provision (wait 5 mins if not)

---

## Troubleshooting

### Build Failures

**Problem**: Build fails during Vercel deployment

**Solutions**:
1. Check build logs in Vercel dashboard:
   - Go to project → **Deployments** → Recent deployment → **Build Logs**
2. Common issues:
   - Missing environment variables → Add in Vercel Settings
   - TypeScript errors → Check `npm run build` locally
   - Missing dependencies → Run `npm install` locally, commit `package-lock.json`

**Test locally**:
```bash
npm run build
npm start  # Run production build locally
```

### Migration Failures

**Problem**: Database migration fails on deploy

**Solutions**:
1. Check if service role key is correct:
   ```bash
   # Test locally
   NEXT_PUBLIC_SUPABASE_API=https://your-project.supabase.co \
   SUPABASE_SERVICE_ROLE_KEY=your-key \
   node scripts/run-migrations.js
   ```

2. Check migration SQL syntax:
   - Copy migration SQL to Supabase SQL Editor
   - Run directly to find syntax errors
   - Fix and redeploy

3. Check Supabase project status:
   - Open Supabase dashboard
   - Ensure project is not paused
   - Check quota usage

### Authentication Issues

**Problem**: Can't login after deployment

**Solutions**:
1. Verify Supabase credentials are correct in Vercel
2. Check if auth URLs are correct:
   - `NEXT_PUBLIC_SUPABASE_API` should be full project URL
3. Check Supabase auth settings:
   - Go to Authentication → URL Configuration
   - Add Vercel URL to allowed redirect URLs:
     - Add: `https://your-project.vercel.app/`
     - Add: `https://your-project.vercel.app/auth/callback`

### Database Permission Errors

**Problem**: "permission denied" errors in logs

**Solutions**:
1. Ensure service role key is set (not anon key)
2. Verify RLS policies are not blocking operations
3. Check user is authenticated before database operations

### Environment Variable Not Found

**Problem**: "Missing Supabase environment variables" error

**Solutions**:
1. Verify variables are set in Vercel Settings
2. Check variable names match exactly:
   - `NEXT_PUBLIC_SUPABASE_API` (not `SUPABASE_API_URL`)
   - `NEXT_PUBLIC_PUBLIC_API_KEY` (not `SUPABASE_KEY`)
3. Redeploy after changing environment variables
4. Changes don't apply to current deployment

### Slow Deployments

**Problem**: Build takes 5+ minutes

**Solutions**:
1. Reduce dependencies (Vercel has timeout limits)
2. Check Function size in Vercel analytics
3. Consider splitting API routes into multiple functions

---

## Production Monitoring

### Vercel Monitoring Dashboard

- **Performance**: Check Core Web Vitals
- **Function Logs**: Monitor API errors
- **Deployments**: Track deployment history
- **Analytics**: View page performance

### Supabase Monitoring

- **Query Performance**: Check slow queries
- **Auth Logs**: Monitor login attempts
- **Storage**: Check if approaching quota

### Set Up Alerts (Optional)

1. **Vercel**: Project Settings → Alerts
2. **Supabase**: Project Settings → Alerts
3. **Uptime Monitoring**: Use UptimeRobot or similar

---

## Rollback Strategy

If a deployment has critical issues:

1. Go to Vercel project → **Deployments**
2. Find previous working deployment
3. Click **"Redeploy"**
4. Production updated to previous version instantly

**Note**: Database migrations don't automatically rollback. If migration caused issues:
1. Fix migration SQL
2. Create new migration (e.g., `005_fix_previous_migration.sql`)
3. Redeploy

---

## Performance Optimization

### Optimize Build Output

```bash
# Analyze bundle size
npm run build
# Check .next/static/ folder size
```

### Database Query Optimization

- Add indexes to frequently queried columns
- Use Supabase query profiler to find slow queries
- Consider caching with React SWR

### CDN Caching

Set appropriate cache headers for static assets:
```javascript
// vercel.json can set cache headers
"headers": [
  {
    "source": "/assets/(.*)",
    "headers": [
      {
        "key": "Cache-Control",
        "value": "public, max-age=31536000, immutable"
      }
    ]
  }
]
```

---

## Security Best Practices

1. **Environment Variables**:
   - Never commit `.env` files
   - Keep service role key only in production environment
   - Rotate keys periodically

2. **Database**:
   - Enable Row-Level Security (RLS) on all tables ✅
   - Implement proper permission checks in APIs
   - Use parameterized queries (Supabase does this)

3. **API Security**:
   - Add rate limiting to prevent abuse
   - Validate all user input
   - Use HTTPS only (Vercel enforces this)

4. **Authentication**:
   - Enable email verification
   - Implement password reset flow
   - Consider two-factor authentication

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Enrollmate Issues**: File issues in GitHub repository

---

## Quick Reference

**Deploy Steps Summary**:
1. Set up Supabase project
2. Get three API keys (project URL, anon key, service role key)
3. Create `.env.local` with credentials
4. Push code to GitHub
5. Import repository to Vercel
6. Add environment variables in Vercel Settings
7. Click Deploy
8. Migrations run automatically
9. Test at deployed URL

**Redeploy After Changes**:
```bash
git add .
git commit -m "Your change"
git push origin main  # Vercel auto-deploys
```

---

**Last Updated**: 2025-12-17
**Enrollmate Version**: 0.1.0
**Deployment Platform**: Vercel
