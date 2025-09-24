# Agency Dashboard - Project Overview & Onboarding Guide
*For Non-Developers*

## 🎯 What is this Project?
- **Purpose**: Digital agency dashboard for BBDO - displays news, events, and slideshows
- **What it does**: Shows current events, news feeds, Instagram posts, and image slideshows
- **Where it runs**: On Vercel (a web hosting platform)
- **Who uses it**: Agency staff and clients via web browser or mobile phone

## 🗂️ Where is Everything Stored?

### **📅 Event Calendar Data**
- **What it contains**: All calendar events, dates, and event details
- **Where to see the raw data**: Go to your website + `/api/calendar` (e.g., `https://your-site.vercel.app/api/calendar`)
- **Where it's actually stored**: 
  - **Vercel Dashboard** → Your Project → Storage → Upstash for Redis → Click "Open in Upstash"
  - **Direct access**: Login with GitHub at [https://console.upstash.com/](https://console.upstash.com/)
  - **What you'll see**: A database interface showing all your events

### **📰 News & RSS Feeds**
- **What it contains**: News articles, social media posts, RSS feed sources
- **Where to see the raw data**: Go to your website + `/api/news` 
- **Where it's actually stored**: Same Upstash Redis database as events
- **How to access**: Same as events - Vercel Dashboard → Storage → Upstash

### **🖼️ Slideshow Images**
- **What it contains**: All uploaded slideshow images and presentations
- **Where to see them**: Go to your website + `/api/images`
- **Where they're actually stored**: Vercel Blob Storage (like a cloud photo album)
- **How to access**: Vercel Dashboard → Storage → Blob → View files

### **📱 Instagram Posts**
- **What it contains**: Instagram feed data and posts
- **Where to see the raw data**: Go to your website + `/api/instagram`
- **Where it's actually stored**: Upstash Redis database
- **How to access**: Same Upstash console as events and news

## 🚀 How to Access and Manage the System

### **🌐 For Regular Users (Viewing the Dashboard)**
- **Main Dashboard**: Go to your website URL (e.g., `https://your-site.vercel.app`)
- **Calendar View**: Add `/calendar` to your URL
- **Instagram Feed**: Add `/instagram` to your URL
- **Admin Panel**: Add `/admin` to your URL (requires password)

### **⚙️ For Administrators (Managing Content)**
- **Admin Access**: Go to your website + `/admin`
- **Password Required**: Set up admin password first
- **What you can do**:
  - Add/edit/delete calendar events
  - Upload/reorder slideshow images
  - Manage news sources and RSS feeds
  - View Instagram posts
  - Change settings and appearance

### **🔧 For Technical Setup (Developers Only)**
- **Vercel Dashboard**: [https://vercel.com/dashboard](https://vercel.com/dashboard)
- **Upstash Console**: [https://console.upstash.com/](https://console.upstash.com/) (login with GitHub)
- **GitHub Repository**: Where the code is stored and updated
- **Automatic Updates**: When code is updated on GitHub, website updates automatically

## 📊 How to Manage Your Data

### **📅 Adding/Editing Calendar Events**
- **Easy Way**: Use admin panel at `/admin` → Event Editor
- **Bulk Import**: Upload CSV file with events (like Excel spreadsheet)
- **Where to see all events**: Your website + `/api/calendar`
- **Where data is stored**: Upstash Redis database (accessible via [https://console.upstash.com/](https://console.upstash.com/))

### **📰 Managing News & RSS Feeds**
- **Easy Way**: Use admin panel at `/admin` → RSS Feed Manager
- **What you can do**: Add news websites, social media feeds
- **Where to see all feeds**: Your website + `/api/news`
- **Auto-updates**: News refreshes every 5 minutes automatically

### **🖼️ Managing Slideshow Images**
- **Easy Way**: Use admin panel at `/admin` → Slideshow Manager
- **What you can do**: Upload images, reorder slides, delete old ones
- **Where images are stored**: Vercel Blob Storage (like Google Drive for images)
- **How to access storage**: Vercel Dashboard → Storage → Blob

### **📱 Instagram Integration**
- **Setup**: Connect Instagram account in admin panel
- **What it shows**: Latest Instagram posts automatically
- **Where to see data**: Your website + `/api/instagram`
- **Storage**: Same Upstash database as events and news

## 🎛️ Admin Panel - Your Control Center

### **🔐 How to Access Admin Panel**
- **Step 1**: Go to your website + `/admin` (e.g., `https://your-site.vercel.app/admin`)
- **Step 2**: Enter the admin password (set by developer)
- **Step 3**: You now have full control over the dashboard

### **🛠️ What You Can Do in Admin Panel**
- **📅 Event Manager**: Add, edit, or delete calendar events
- **📰 News Manager**: Add news websites and RSS feeds
- **🖼️ Slideshow Manager**: Upload new images, reorder slides, delete old ones
- **📱 Social Media**: Connect Instagram and manage social feeds
- **⚙️ Settings**: Change appearance, dark mode, refresh data

### **📤 Easy Data Operations**
- **Bulk Upload**: Upload Excel/CSV files with many events at once
- **Image Upload**: Drag and drop images directly into slideshow
- **Data Refresh**: Force the system to update all information
- **Backup**: Export all your data if needed

## 🔄 How the System Works Automatically

### **⚡ Automatic Updates**
- **News & Events**: Updates every 5 minutes automatically
- **Instagram**: Refreshes when new posts are published
- **Images**: Load instantly when uploaded
- **No Manual Work**: Everything updates by itself

### **🚀 Performance Features**
- **Fast Loading**: Images and content load quickly worldwide
- **Mobile Friendly**: Works perfectly on phones and tablets
- **Always Available**: 99.9% uptime guaranteed by Vercel
- **Global Access**: Fast loading from anywhere in the world

### **📊 Monitoring & Troubleshooting**
- **Vercel Dashboard**: Shows if website is working properly
- **Upstash Console**: Shows if data is being saved correctly
- **Automatic Alerts**: System notifies if something goes wrong
- **24/7 Monitoring**: Website is checked constantly for issues

## 📱 How Users See and Use the Dashboard

### **🏠 Main Dashboard (Homepage)**
- **What users see**: Slideshow of images, latest news, upcoming events
- **How to access**: Just go to your website URL (e.g., `https://your-site.vercel.app`)
- **Works on**: Desktop computers, tablets, and mobile phones
- **Features**: Dark/light mode toggle, QR code for easy mobile access

### **📅 Calendar Page**
- **What users see**: Full calendar with all events and dates
- **How to access**: Add `/calendar` to your website URL
- **Features**: Click on events to see details, month/week/day views

### **📱 Instagram Page**
- **What users see**: Latest Instagram posts and social media content
- **How to access**: Add `/instagram` to your website URL
- **Features**: Scroll through posts, like and share functionality

### **📊 Trends Page**
- **What users see**: Analytics and insights about your content
- **How to access**: Add `/trends` to your website URL
- **Features**: Charts showing popular content and engagement

### **📱 QR Code Access**
- **What it is**: A QR code displayed on the main dashboard
- **How it works**: Users scan with their phone to instantly access the dashboard
- **Perfect for**: Presentations, meetings, or sharing with clients

## 🔧 For Developers: Technical Details

### **📁 Important Files and Folders**
- **Main Dashboard**: `/src/app/page.tsx` - The homepage everyone sees
- **Admin Panel**: `/src/app/admin/page.tsx` - The management interface
- **Data Storage**: `/src/lib/vercel-storage.ts` - How data is saved and retrieved
- **API Endpoints**: `/src/app/api/` - Backend functions that handle data

### **🚀 How Updates Work**
- **Code Changes**: Made in GitHub repository
- **Automatic Deployment**: Vercel automatically updates the website when code changes
- **No Manual Work**: Developers push code, website updates automatically
- **Environment**: Separate settings for development and live website

### **🔗 Key URLs for Developers**
- **Vercel Dashboard**: [https://vercel.com/dashboard](https://vercel.com/dashboard) - Manage hosting
- **Upstash Console**: [https://console.upstash.com/](https://console.upstash.com/) - Manage database
- **GitHub Repository**: Where all code is stored and version controlled

## 💰 Costs & Usage Limits

### **💾 Image Storage (Vercel Blob)**
- **Free Tier**: 1GB storage + 1GB bandwidth per month
- **If you need more**: $0.15 per GB storage, $0.40 per GB bandwidth
- **Good for**: Storing slideshow images and presentations

### **🗄️ Database Storage (Upstash Redis)**
- **Free Tier**: 30,000 requests per month
- **If you need more**: $0.50 per 1 million requests
- **Good for**: Storing events, news feeds, and settings

### **🌐 Website Hosting (Vercel)**
- **Free Tier**: Unlimited personal projects
- **Team Features**: $20/month for advanced features
- **Good for**: Hosting the entire dashboard website

## 🔧 Troubleshooting Common Issues

### **❌ Images Not Showing**
- **Check**: Vercel Dashboard → Storage → Blob → Are images uploaded?
- **Solution**: Re-upload images through admin panel

### **❌ Events Not Saving**
- **Check**: Upstash Console → Are you seeing database errors?
- **Solution**: Verify admin panel is working, try adding events again

### **❌ Can't Access Admin Panel**
- **Check**: Is the admin password set correctly?
- **Solution**: Contact developer to reset admin password

### **❌ Website Not Loading**
- **Check**: Vercel Dashboard → Is deployment successful?
- **Solution**: Check Vercel logs for error messages

### **📞 Where to Get Help**
- **Vercel Dashboard**: [https://vercel.com/dashboard](https://vercel.com/dashboard) - Check hosting status
- **Upstash Console**: [https://console.upstash.com/](https://console.upstash.com/) - Check database status
- **Documentation**: All setup guides are in the `/docs/` folder
- **Developer**: Contact the person who set up the system
