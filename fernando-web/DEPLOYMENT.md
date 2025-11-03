# Fernando Web Deployment Guide

## Architecture Overview

The Fernando web application is designed with a multi-tenant SaaS architecture:

- **Root Domain** (`iwantmyown.com/fernando`): Marketing landing page for customer acquisition
- **Personal Instance** (`fernando.iwantmyown.com`): Peter's authenticated admin dashboard
- **Customer Subdomains** (`{name}.iwantmyown.com`): Future customer instances

---

## Vercel Deployment

### 1. Deploy to Vercel

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Deploy from project directory
cd fernando-web
vercel --prod
```

Or connect the GitHub repository directly:
1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import from GitHub: `peter-directskip/fernando-web`
4. Click "Deploy"

---

### 2. Configure Environment Variables in Vercel

Go to **Project Settings → Environment Variables** and add:

```
NEXTAUTH_URL=https://fernando.iwantmyown.com
NEXTAUTH_SECRET=<generate-a-strong-secret>
NEXT_PUBLIC_FERNANDO_API_URL=https://p1k9c6b251.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_TENANT_ID=peter
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

### 3. Configure Custom Domains in Vercel

Go to **Project Settings → Domains** and add:

1. **Primary Domain**: `fernando.iwantmyown.com`
   - This will be Peter's personal admin portal
   - Mark as "Production"

2. **Marketing Domain**: `iwantmyown.com` (or subdomain)
   - For the marketing landing page
   - Optionally: `fernando.iwantmyown.com` can serve both marketing and admin

Vercel will provide DNS configuration instructions.

---

## DNS Configuration

### Option A: Root Domain for Marketing

If using `iwantmyown.com` for marketing:

**DNS Records:**
```
Type    Name    Value                           TTL
A       @       76.76.21.21                     Auto
CNAME   www     cname.vercel-dns.com            Auto
CNAME   fernando cname.vercel-dns.com          Auto
```

**Result:**
- `iwantmyown.com` → Marketing landing page
- `fernando.iwantmyown.com` → Admin portal (protected)

---

### Option B: Subdomain for Marketing

If using `fernando.iwantmyown.com` for everything:

**DNS Records:**
```
Type    Name    Value                           TTL
CNAME   fernando cname.vercel-dns.com          Auto
```

**Result:**
- `fernando.iwantmyown.com` → Marketing page at `/`, admin at `/admin`

---

## Testing Locally

### 1. Test Marketing Page

```bash
npm run dev
# Open http://localhost:3003
```

You should see:
- Hero section: "Your Personal AI Assistant. Everywhere You Work."
- Features section
- Waitlist form
- "Sign In" button (top right) → Goes to `/admin/login`

---

### 2. Test Admin Login

1. Go to http://localhost:3003/admin/login
2. Use demo credentials:
   - Email: `peter@directskip.com`
   - Password: `fernando123`
3. After login, should redirect to `/admin/dashboard`

---

### 3. Test Protected Routes

Try accessing without logging in:
- http://localhost:3003/admin/dashboard → Should redirect to `/admin/login`
- http://localhost:3003/admin/search → Should redirect to `/admin/login`

After login, all routes should be accessible.

---

## Authentication System

### Current Implementation

- **NextAuth v5** with CredentialsProvider
- **Hardcoded credentials** (temporary):
  - Email: `peter@directskip.com`
  - Password: `fernando123`

### Protected Routes

All routes under `/admin/*` (except `/admin/login`) are protected by the `ProtectedRoute` component.

**Middleware Flow:**
1. Request comes in
2. Middleware extracts subdomain
3. If `fernando.iwantmyown.com`, sets `x-tenant-id: peter` header
4. NextAuth checks session
5. If no session, redirects to `/admin/login`
6. After successful login, creates JWT session

---

## Production Hardening (TODO)

### 1. Replace Hardcoded Credentials

Currently, authentication uses hardcoded credentials in:
- `app/api/auth/[...nextauth]/route.ts`

**Next Steps:**
1. Create DynamoDB table: `fernando-users`
2. Store hashed passwords with bcrypt
3. Update NextAuth authorize function to query DynamoDB
4. Add user registration flow

---

### 2. Set Strong NEXTAUTH_SECRET

In Vercel environment variables:
```bash
# Generate a cryptographically secure secret
openssl rand -base64 32

# Add to Vercel:
NEXTAUTH_SECRET=<your-generated-secret>
```

---

### 3. Configure Production URL

Update `vercel.json` or Vercel environment variables:
```
NEXTAUTH_URL=https://fernando.iwantmyown.com
```

---

## Multi-Tenant Expansion

### Adding Customer Subdomains

When a customer signs up:

1. **DNS**: Add CNAME record
   ```
   Type    Name         Value
   CNAME   {customer}   cname.vercel-dns.com
   ```

2. **Vercel**: Add domain to project
   - Go to Vercel project settings
   - Add domain: `{customer}.iwantmyown.com`

3. **Database**: Create tenant record
   ```javascript
   {
     tenantId: "{customer}",
     subdomain: "{customer}.iwantmyown.com",
     createdAt: "2025-10-31T..."
   }
   ```

4. **Middleware**: Already configured to handle any subdomain
   - Extracts subdomain from hostname
   - Sets `x-tenant-id` header
   - Routes to correct tenant data

---

## Monitoring & Debugging

### Check Vercel Deployment Logs

```bash
vercel logs --prod
```

### Test Middleware Locally

Add logging to `middleware.ts`:
```typescript
console.log('Hostname:', hostname)
console.log('Subdomain:', subdomain)
console.log('Tenant ID:', requestHeaders.get('x-tenant-id'))
```

### Verify NextAuth Session

Check cookies in browser DevTools:
- `next-auth.session-token` should be present after login
- Should be `HttpOnly` and `Secure` in production

---

## Rollback Plan

If deployment issues occur:

1. **Revert in Vercel:**
   - Go to Deployments tab
   - Find previous working deployment
   - Click "..." → "Promote to Production"

2. **Revert Git:**
   ```bash
   git revert HEAD
   git push origin main
   ```

---

## Next Steps After Deployment

1. ✅ Deploy to Vercel
2. ✅ Configure custom domains (fernando.iwantmyown.com)
3. ✅ Set environment variables
4. ⏳ Test OAuth flow end-to-end
5. ⏳ Replace hardcoded credentials with DynamoDB
6. ⏳ Add user registration flow
7. ⏳ Configure email notifications (waitlist)
8. ⏳ Set up monitoring/alerts

---

## Support

For issues or questions:
- Check Vercel deployment logs
- Review Next.js build output
- Test middleware routing locally
- Verify DNS propagation with `dig fernando.iwantmyown.com`

---

**Version**: 1.1 (Phase 5 - Multi-Tenant SaaS)
**Last Updated**: 2025-10-31
**Architecture**: Marketing site + Authenticated admin portal with subdomain routing
