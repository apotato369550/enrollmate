# Vercel Deployment Setup - Action Checklist

Your Enrollmate application is now configured for Vercel deployment! This checklist guides you through the next steps.

## 📋 What Was Created

The following files have been generated to support Vercel deployment:

| File | Purpose |
|------|---------|
| `.env.example` | Template for environment variables |
| `vercel.json` | Vercel-specific configuration |
| `scripts/run-migrations.js` | Automated database migration runner |
| `src/lib/middleware/rateLimiter.js` | API rate limiting middleware |
| `DEPLOYMENT.md` | Comprehensive deployment guide |
| `next.config.mjs` | Updated with security headers |

## ✅ Quick Start (5 Steps)

### 1️⃣ Get Supabase Credentials

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your Enrollmate project
3. Go to **Settings → API**
4. Copy these three keys and save somewhere safe:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_API`
   - **Anon Key** (public) → `NEXT_PUBLIC_PUBLIC_API_KEY`
   - **Service Role Key** (KEEP SECRET) → `SUPABASE_SERVICE_ROLE_KEY`

### 2️⃣ Test Locally

1. Create `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials from step 1

3. Run locally:
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

4. Test:
   - Sign up → Create account
   - Create semester
   - Add courses
   - Check no errors in console

### 3️⃣ Push Code to GitHub

```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

**Verify these files are included**:
- ✅ `.env.example`
- ✅ `vercel.json`
- ✅ `scripts/run-migrations.js`
- ✅ `src/lib/middleware/rateLimiter.js`

### 4️⃣ Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New…"** → **"Project"**
3. Select your GitHub repository
4. Click **"Import"**
5. Add environment variables in **Settings → Environment Variables**:

   | Variable Name | Value |
   |---------------|-------|
   | `NEXT_PUBLIC_SUPABASE_API` | Your Supabase project URL |
   | `NEXT_PUBLIC_PUBLIC_API_KEY` | Your Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your service role key (Production only) |

6. Click **"Deploy"**

**Expected time**: 2-5 minutes

### 5️⃣ Verify Deployment

1. Wait for build to complete
2. Visit your Vercel URL (e.g., `https://enrollmate-xyz.vercel.app`)
3. Test signup/login
4. Check no errors in browser console
5. Create a schedule to verify database works

## 🔑 Important: Supabase Service Role Key

**Why you need it**: Migrations require admin access to create tables/indexes

**Where to get it**: Supabase Dashboard → Project Settings → API → Service Role Key

**Security notes**:
- ⚠️ **NEVER commit to GitHub**
- ⚠️ **ONLY set in production environment** (not preview)
- ⚠️ **Keep confidential** - it's like your database password
- ✅ Safe to use in Vercel (environment variables are encrypted)

## 📚 Documentation

For detailed information, see:

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide with troubleshooting
- **[CLAUDE.md](./CLAUDE.md)** - Architecture and code structure
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - API endpoints (if exists)

## 🚀 What Happens on Deploy

When you push to main:

1. **Build** - Next.js compiles your code (1-2 minutes)
2. **Migrations** - Database schema updates run automatically
3. **Deploy** - App deployed to Vercel CDN globally
4. **Live** - Your site is now available at the Vercel URL

## 🐛 Troubleshooting Quick Links

**Build fails?**
- Check build logs in Vercel dashboard
- Run `npm run build` locally to debug
- See troubleshooting section in DEPLOYMENT.md

**Can't login?**
- Add Vercel URL to Supabase auth redirect URLs:
  - Go to Supabase → Authentication → URL Configuration
  - Add: `https://your-vercel-url/`

**Database errors?**
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
- Check migrations ran successfully in logs
- Verify Supabase project is not paused

**See DEPLOYMENT.md for more**

## 📊 After Deployment

### Monitor Your App

- **Vercel Dashboard**: Check deployments, logs, analytics
- **Supabase Dashboard**: Monitor database usage
- **Browser Console**: Watch for any client errors

### Keep Database in Sync

When you modify the schema:

1. Create new migration file:
   ```bash
   touch migrations/005_your_change.sql
   ```

2. Write SQL with `IF NOT EXISTS` clauses

3. Commit and push:
   ```bash
   git add migrations/005_your_change.sql
   git commit -m "Add new feature to database"
   git push origin main
   ```

4. Vercel auto-deploys and runs migration

## 🔒 Security Best Practices

1. **Never expose keys in code**
   - Use `.env.local` for local dev
   - Use Vercel secrets for production
   - Add `.env*` to `.gitignore` ✅ (already done)

2. **Enable RLS** (Row-Level Security)
   - All tables should have RLS policies ✅ (already done)
   - Prevents unauthorized data access

3. **Validate user input**
   - Check API requests for valid data
   - Don't trust user input

4. **Use HTTPS**
   - Vercel enforces HTTPS ✅
   - All data encrypted in transit

## 📞 Need Help?

**Check these resources first**:
1. DEPLOYMENT.md (this folder)
2. CLAUDE.md (architecture overview)
3. Vercel Docs: https://vercel.com/docs
4. Supabase Docs: https://supabase.com/docs

**Common Issues**:
- Service role key not set → Add to Vercel environment variables
- Build fails → Check environment variables are correct
- Can't login → Update Supabase auth URLs
- Database errors → Check migrations in Vercel logs

## ✨ Next Steps (After Deployment Works)

1. **Add custom domain** (optional)
   - Vercel Settings → Domains
   - Point your domain's DNS to Vercel

2. **Set up monitoring** (optional)
   - Add Sentry for error tracking
   - Add UptimeRobot for uptime monitoring

3. **Optimize performance** (optional)
   - Analyze bundle size
   - Add image optimization
   - Implement caching strategies

4. **Add authentication features** (optional)
   - Two-factor authentication
   - Social login (Google, GitHub, etc.)
   - Password reset email

## 🎉 You're Ready!

Your application is now configured for production deployment. Follow the 5-step quick start above to go live.

**Questions?** See DEPLOYMENT.md for detailed guidance on every step.

---

**Last Updated**: 2025-12-17
**Status**: 🟢 Ready for Vercel
**Est. Deployment Time**: 30 minutes total
