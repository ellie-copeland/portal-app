# Deployment Checklist - Team Workspaces Feature

**Feature:** Multi-workspace (team) switching and user invitation flow  
**Date:** 2026-02-13  
**Status:** Ready for Production

## Pre-Deployment Steps

### 1. Database Migration
If this is the first deployment of this feature:

```bash
# Apply schema changes to database
npx prisma migrate deploy

# OR if creating a new migration:
npx prisma migrate dev --name add_invitations
```

### 2. Local Verification
```bash
# Run TypeScript check
npx tsc --noEmit --skipLibCheck

# Expected: No errors

# Run build locally (optional, long running)
npm run build

# Expected: Build successful
```

### 3. Git Status
```bash
git status

# Expected: clean working tree
```

## Deployment Commands

### Option A: Using Vercel CLI
```bash
# Deploy to production with confirmation
npx vercel --prod --yes

# This will:
# - Build the project
# - Run tests
# - Deploy to production
# - Generate deployment URL
```

### Option B: Push to Git (if using Git-based deployment)
```bash
git push origin main

# Vercel will automatically detect and deploy
```

## Post-Deployment Verification

### 1. Check Deployment
- [ ] Visit deployed app URL
- [ ] Verify sidebar renders with team switcher
- [ ] Check team switcher dropdown works

### 2. Test API Endpoints
```bash
# Replace YOUR_URL with deployment URL

# List teams (requires auth)
curl -X GET https://YOUR_URL/api/teams \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return array of teams
```

### 3. Test Invite Flow (manual)
- [ ] Login to app
- [ ] Navigate to Team page
- [ ] Click "Invite Member"
- [ ] Enter test email and click "Send Invite"
- [ ] Check for success message
- [ ] Copy invite link
- [ ] Open incognito window and visit link
- [ ] Click "Accept Invitation"
- [ ] Verify redirect to dashboard
- [ ] Check that user is now team member

### 4. Monitor Errors
- [ ] Check Vercel deployment logs for errors
- [ ] Monitor error tracking service (if configured)
- [ ] Check browser console for JavaScript errors

## Rollback Plan

If issues occur:

```bash
# Revert to previous stable version
git revert HEAD~1  # Adjust number as needed
git push origin main

# Vercel will automatically redeploy
```

Or manually rollback in Vercel dashboard:
1. Go to Vercel project dashboard
2. Click "Deployments"
3. Find previous stable deployment
4. Click "Promote to Production"

## Environment Variables

Ensure these are set in Vercel (Settings > Environment Variables):

- `DATABASE_URL` — PostgreSQL connection string
- `DIRECT_DATABASE_URL` — Direct database connection (Prisma)
- `NEXTAUTH_SECRET` — Authentication secret
- Any other existing env vars

*Note: Team workspace feature does not require new environment variables*

## Known Limitations & Considerations

- **Email Notifications:** Invitations don't trigger email notifications yet (UI ready, backend integration pending)
- **Invite Link Customization:** Invite links follow pattern `/invite/[token]` (customizable via API response)
- **Revoke Invitations:** UI shows revoke button but backend hook needs implementation
- **Team Deletion:** Not included in this version
- **Bulk Invites:** Not included in this version

## Team Testing Checklist

If testing with team members:

- [ ] Admin invites member via Team page
- [ ] Member receives invite link
- [ ] Member accepts invitation
- [ ] Member appears in team member list
- [ ] Member can switch between teams (if in multiple)
- [ ] Member cannot invite others (role-based)
- [ ] Invited email appears in pending invitations
- [ ] Invite expires after 7 days (or manual revoke)

## Support & Troubleshooting

### Issue: Invite link not working
- Check that `/api/invitations/[token]/accept` endpoint is accessible
- Verify token is being passed correctly
- Check invitation hasn't expired (7 day limit)

### Issue: Team switcher not loading
- Check browser localStorage (should see `activeTeamId` key)
- Verify `/api/teams` endpoint returns teams
- Check auth token is valid

### Issue: Database errors
- Verify Prisma migration was applied
- Check `DATABASE_URL` is correct
- Ensure schema matches current Prisma version

## Contacts

For questions or issues:
- Check `WORKSPACE_FEATURE.md` for technical details
- Review commit history for implementation details
- Consult git log for incremental changes

## Deployment Record

**Deployed:** [Deployment Date]  
**Deployed By:** [Your Name]  
**Vercel URL:** [Production URL]  
**Status:** ✅ Live / ⏳ Pending / ❌ Rolled Back

---

*Last Updated: 2026-02-13*
