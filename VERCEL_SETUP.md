# Vercel Storage Setup

## Overview

This dashboard has been updated to use Vercel's storage services for persistent data:

- **Slideshow Images**: Stored in Vercel Blob Storage
- **Calendar Events**: Stored in Vercel KV Storage
- **RSS Feeds**: Stored in Vercel KV Storage
- **Development Mode**: Falls back to local file system for development
- **Production Mode**: Uses Vercel services automatically

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Vercel Blob Storage (for slideshow images)
BLOB_READ_WRITE_TOKEN=your_blob_token_here

# Vercel KV Storage (for calendar events)
KV_REST_API_URL=your_kv_url_here
KV_REST_API_TOKEN=your_kv_token_here
KV_REST_API_READ_ONLY_TOKEN=your_kv_readonly_token_here
```

## Setup Steps

### 1. Create Vercel Blob Storage
- Go to your Vercel dashboard
- Navigate to Storage → Blob
- Create a new Blob store
- Copy the `BLOB_READ_WRITE_TOKEN`

### 2. Create Vercel KV Storage
- Go to your Vercel dashboard
- Navigate to Storage → KV
- Create a new KV store
- Copy the `KV_REST_API_URL`, `KV_REST_API_TOKEN`, and `KV_REST_API_READ_ONLY_TOKEN`

### 3. Deploy to Vercel
- Connect your GitHub repository to Vercel
- Vercel will automatically inject the environment variables in production
- No need to manually set them in the Vercel dashboard

### 4. Migrate Existing Data (First Deployment Only)
After your first deployment, call the migration endpoint to transfer existing data to KV Storage:

```bash
curl -X POST https://your-app.vercel.app/api/admin/migrate
```

This will migrate:
- Calendar events from CSV to KV Storage
- RSS feeds from JSON to KV Storage

## Features

- **Persistent Data**: Data survives deployments and restarts
- **Scalable**: Handles high traffic and large file uploads
- **Cost-Effective**: Free tiers available for both services
- **Automatic Migration**: All data is automatically migrated to Vercel Storage
- **Development Friendly**: Falls back to local storage in development mode

## Cost Information

### Vercel Blob Storage
- **Free**: 1 GB storage + 1 GB bandwidth per month
- **Paid**: $0.15/GB storage, $0.40/GB bandwidth

### Vercel KV Storage
- **Free**: 30,000 requests per month
- **Paid**: $0.50 per 1M requests

## Troubleshooting

### Images Not Loading
- Check if Blob Storage is properly configured
- Verify the `BLOB_READ_WRITE_TOKEN` environment variable

### Events or RSS Feeds Not Saving
- Check if KV Storage is properly configured
- Verify the KV environment variables
- Run the migration endpoint if this is the first deployment

### Development Issues
- The app automatically falls back to local storage in development
- No Vercel services needed for local development
