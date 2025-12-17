# Enrollmate Credentials Guide

This guide explains each credential/key needed for Enrollmate deployment and where to find them.

## Overview

Enrollmate requires credentials from **Supabase** and **Vercel**. No other services are needed.

```
┌─────────────────────────────────────┐
│   Enrollmate Application            │
├─────────────────────────────────────┤
│  ├─ Supabase Auth (Login/Signup)    │
│  ├─ Supabase Database (Data)        │
│  └─ Supabase Storage (Files)        │
├─────────────────────────────────────┤
│  └─ Vercel Hosting (Web Server)     │
└─────────────────────────────────────┘
```

## 1. Supabase Credentials

### Where to Get Them

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your Enrollmate project (create one if needed)
3. Click **Settings** (gear icon)
4. Click **API** in the left sidebar
5. Copy the three keys shown below

### The Three Keys You Need

#### A) `NEXT_PUBLIC_SUPABASE_API`

**What it is**: Your Supabase project URL

**Where to find it**:
- **Location**: Settings → API → "Project URL"
- **Format**: `https://your-project-id.supabase.co`
- **Example**: `https://hwgzlwocdofoticqvwqg.supabase.co`

**Who can see it**: Anyone (it's public, but RLS protects data)

**Where used**:
- `.env.local` (local development)
- Vercel environment variables (production)
- Browser code (via `NEXT_PUBLIC_` prefix)

**Is it safe?** ✅ Yes - only the public project URL, RLS policies protect your data

---

#### B) `NEXT_PUBLIC_PUBLIC_API_KEY`

**What it is**: The public (anon) API key for Supabase

**Where to find it**:
- **Location**: Settings → API → "Anon Key"
- **Format**: Long JWT token starting with `eyJ...`
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Who can see it**: Anyone (it's public, RLS protects data)

**Where used**:
- `.env.local` (local development)
- Vercel environment variables (production & preview)
- Browser code (Supabase client library)
- Browser extension API calls

**Is it safe?** ✅ Yes - limited permissions, RLS blocks unauthorized access

**Note**: Two "Anon Key" values exist in Supabase dashboard - they're the same, use either one

---

#### C) `SUPABASE_SERVICE_ROLE_KEY`

**What it is**: The admin API key for Supabase (full database access)

**Where to find it**:
- **Location**: Settings → API → "Service Role Key"
- **Format**: Long JWT token similar to Anon Key but much longer
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (even longer)

**Who can see it**: ⚠️ **ONLY server/deployment environments**

**Where used**:
- Database migrations (on Vercel deploy)
- Server-side API endpoints (if you add them)
- Administrative tasks
- **NEVER in browser code**

**Is it safe?** ⚠️ **NOT safe to expose** - it's like your database password

**Security notes**:
- ❌ Never commit to GitHub
- ❌ Never hardcode in JavaScript
- ❌ Never expose in browser network calls
- ✅ Only set in Vercel Production environment (not Preview)
- ✅ Treat like a database password

---

## 2. Environment Variables

### Local Development (.env.local)

Create `.env.local` file in enrollmate/ folder:

```bash
NEXT_PUBLIC_SUPABASE_API=https://your-project.supabase.co
NEXT_PUBLIC_PUBLIC_API_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Note**: `.env.local` is never committed to GitHub (protected by .gitignore)

### Production (Vercel)

Set in Vercel dashboard → Project Settings → Environment Variables:

| Variable Name | Value | Environment | Purpose |
|---------------|-------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_API` | Your project URL | Production, Preview | Connect to database |
| `NEXT_PUBLIC_PUBLIC_API_KEY` | Your anon key | Production, Preview | Authenticate users |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role | **Production only** ⚠️ | Run migrations on deploy |

**Important**: Service Role Key should ONLY be in Production, never in Preview environments

---

## 3. How Each Key is Used

### Public Keys (Safe to Expose)

```javascript
// Browser Code - These are OK to expose
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_API,           // Public URL
  process.env.NEXT_PUBLIC_PUBLIC_API_KEY          // Public anon key
);

// User authentication
const { user } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Database reads (RLS enforces permissions)
const { data } = await supabase
  .from('schedules')
  .select('*')
  .eq('user_id', user.id);  // RLS only shows user's schedules
```

### Private Key (Never Expose)

```javascript
// ❌ WRONG - Never do this in browser
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_API,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // ❌ NEVER in browser!
);

// ✅ CORRECT - Only on server/build
// scripts/run-migrations.js
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_API,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // ✅ OK on server only
);

// Run migrations (requires admin access)
await supabase.rpc('exec_sql', { sql: migration });
```

---

## 4. Where Each Key is Used in Enrollmate

### `NEXT_PUBLIC_SUPABASE_API`

**Used in**:
- `src/lib/supabase.js` - Supabase client initialization
- Browser code for API calls
- Browser extension API configuration

**Permission level**: Public (read-only via RLS)

---

### `NEXT_PUBLIC_PUBLIC_API_KEY`

**Used in**:
- `src/lib/supabase.js` - Supabase client initialization
- User authentication (login/signup)
- Database queries from browser
- Browser extension API calls

**Permission level**: Limited (RLS restricts access)

---

### `SUPABASE_SERVICE_ROLE_KEY`

**Used in**:
- `scripts/run-migrations.js` - Database migrations on deploy
- Vercel build process (not in running app)
- Admin database operations

**Permission level**: Full admin access (dangerous!)

---

## 5. Getting a New Key (If Compromised)

If a key is accidentally exposed:

1. Go to Supabase Settings → API
2. Click the "Rotate" button next to the compromised key
3. Update all places where the old key was used:
   - Local `.env.local`
   - Vercel environment variables
   - Browser extension config (if applicable)

**Anon Key rotated?** Redeploy Vercel to use new key

**Service Role Key rotated?** Update Vercel environment variable

---

## 6. Testing Your Credentials

### Test Locally

```bash
# 1. Create .env.local with your credentials
cp .env.example .env.local
# Edit .env.local and add your keys

# 2. Start development server
npm run dev

# 3. Check browser console for errors
# Should see: "Supabase Configuration: { ... }"

# 4. Test signup/login at http://localhost:3000
```

### Test Migrations

```bash
# Test if service role key works
node scripts/run-migrations.js

# Should output:
# 🚀 Enrollmate Database Migration Runner
# 📋 Found X migration(s)
# ✅ All migrations completed successfully!
```

### Test on Vercel

After deploying to Vercel:

1. Visit your Vercel URL
2. Open browser DevTools → Console
3. Check for any errors
4. Try signing up with a test account
5. Check if data saves to database

---

## 7. Credential Storage Best Practices

### Local Development
- ✅ Store credentials in `.env.local`
- ✅ Never commit `.env.local` to Git
- ✅ Share credentials via secure channel (1Password, LastPass, etc.)

### Production (Vercel)
- ✅ Store in Vercel Environment Variables
- ✅ Encrypt at rest (Vercel handles this)
- ✅ Rotate keys periodically
- ✅ Audit which deployments have access

### Browser Extension
- ✅ Store anon key in extension configuration
- ✅ Tokens stored in Chrome storage (cleared on logout)
- ✅ Don't hardcode in extension code

---

## 8. Security Checklist

Before deploying to production:

- [ ] Service Role Key is **NOT** in `.env.local` committed to Git
- [ ] Service Role Key is **ONLY** in Vercel Production environment
- [ ] Public keys are set in Vercel Production AND Preview
- [ ] `.gitignore` includes `.env*` files
- [ ] No credentials hardcoded in JavaScript files
- [ ] No credentials in browser Network tab (use NEXT_PUBLIC_ for public keys only)
- [ ] Row-Level Security (RLS) enabled on all Supabase tables
- [ ] Supabase Auth configured with correct redirect URLs

---

## 9. Troubleshooting Credentials

### Issue: "Missing Supabase environment variables"

**Cause**: One of the environment variables is not set

**Solution**:
```bash
# Check if .env.local exists
ls -la .env.local

# Check if all three variables are present
grep NEXT_PUBLIC_SUPABASE_API .env.local
grep NEXT_PUBLIC_PUBLIC_API_KEY .env.local
grep SUPABASE_SERVICE_ROLE_KEY .env.local

# On Vercel, go to Settings → Environment Variables and verify they're set
```

### Issue: "Unauthorized" errors on database queries

**Cause**: RLS policies preventing access (expected) or wrong key used

**Solution**:
1. Check if user is authenticated (should see user in browser console)
2. Verify RLS policies allow the query
3. Check Supabase logs for policy violations

### Issue: Migrations fail with "permission denied"

**Cause**: Service Role Key is not set on Vercel

**Solution**:
1. Go to Vercel Project Settings → Environment Variables
2. Add `SUPABASE_SERVICE_ROLE_KEY` with your service role key
3. Set to Production environment only (not Preview)
4. Redeploy Vercel

### Issue: "Can't reach Supabase" errors

**Cause**: Wrong project URL

**Solution**:
1. Go to Supabase Settings → API
2. Copy the exact Project URL (should match in both places)
3. Update `.env.local` or Vercel environment variables
4. Restart dev server or redeploy Vercel

---

## 10. Quick Reference

| Credential | Type | Location | Usage | Exposed? |
|------------|------|----------|-------|----------|
| Project URL | Public | Settings → API → Project URL | Connect to Supabase | ✅ Yes |
| Anon Key | Public | Settings → API → Anon Key | User auth & queries | ✅ Yes |
| Service Role Key | Private | Settings → API → Service Role Key | Migrations & admin | ❌ No |

---

## Need More Help?

- **Supabase Docs**: https://supabase.com/docs/guides/api#keys
- **Vercel Docs**: https://vercel.com/docs/projects/environment-variables
- **Enrollmate Docs**: See DEPLOYMENT.md in this folder

---

**Last Updated**: 2025-12-17
**Status**: Complete
