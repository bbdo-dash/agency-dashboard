# Vercel Deployment Checklist

## Pre-Deployment

- [ ] Code committed to GitHub repository
- [ ] All environment variables documented in `VERCEL_SETUP.md`
- [ ] Local development tested with `npm run dev`

## Vercel Setup

- [ ] Vercel account created
- [ ] GitHub repository connected to Vercel
- [ ] Blob Storage created in Vercel dashboard
- [ ] KV Storage created in Vercel dashboard
- [ ] Environment variables automatically injected by Vercel

## Post-Deployment

- [ ] Website loads successfully
- [ ] Admin panel accessible
- [ ] Slideshow images upload and display correctly
- [ ] Calendar events can be created, edited, and deleted
- [ ] Migration endpoint called: `POST /api/admin/migrate`
- [ ] All existing data migrated successfully

## Testing Checklist

### Slideshow Functionality
- [ ] Upload new images
- [ ] Delete images
- [ ] Reorder images
- [ ] Replace all images
- [ ] Images display in slideshow

### Calendar Functionality
- [ ] View existing events
- [ ] Create new events
- [ ] Edit existing events
- [ ] Delete events
- [ ] Events display in calendar

### RSS Feed Functionality
- [ ] View existing RSS feeds
- [ ] Add new RSS feeds
- [ ] Edit existing RSS feeds
- [ ] Delete RSS feeds
- [ ] Toggle RSS feed active/inactive status
- [ ] RSS feeds display in news section

### Admin Panel
- [ ] Admin settings modal opens
- [ ] Slideshow manager works
- [ ] Event editor works
- [ ] RSS feed manager works
- [ ] All CRUD operations function

## Troubleshooting

If something doesn't work:

1. **Check Vercel logs** in the dashboard
2. **Verify environment variables** are set correctly
3. **Run migration endpoint** if data is missing
4. **Check browser console** for client-side errors
5. **Test API endpoints directly** with curl or Postman

## Rollback Plan

If issues persist:
1. Revert to previous deployment in Vercel
2. Fix issues locally
3. Redeploy when ready

## Success Criteria

- [ ] All data persists across deployments
- [ ] No data loss during updates
- [ ] Performance is acceptable
- [ ] All features work as expected
