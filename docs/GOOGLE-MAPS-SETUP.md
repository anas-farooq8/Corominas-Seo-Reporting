# Google Maps API Setup & Security

## Overview

The Grid My Business heatmaps use **Google Maps JavaScript API** which requires a client-side API key. This guide explains how to secure your API key properly.

---

## 🔐 API Key Security - Important Facts

### ✅ **Client-Side API Keys Are Normal**

For Google Maps JavaScript API:
- ✅ **API key MUST be visible in browser** - This is by design
- ✅ **This is NOT a security risk** when properly restricted
- ✅ **Google's official approach** for browser-based maps

### ❌ **Common Misconceptions**

- ❌ "API key in browser = insecure" → **FALSE** when restricted properly
- ❌ "Need to hide the key" → **Impossible** for JavaScript API
- ❌ "Someone will steal it" → **Restrictions prevent misuse**

---

## 📋 Step-by-Step Setup

### **Step 1: Get API Key**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Go to **APIs & Services** → **Library**
4. Search for **"Maps JavaScript API"**
5. Click **Enable**
6. Go to **Credentials** → **+ CREATE CREDENTIALS** → **API Key**
7. Copy the generated key

---

### **Step 2: Restrict Your API Key** ⚠️ **CRITICAL**

**Without restrictions, anyone can use your key and rack up charges!**

#### **A. Application Restrictions**

Choose **"HTTP referrers (web sites)"**

Add these referrers:
```
http://localhost:3000/*
http://127.0.0.1:3000/*
https://your-domain.com/*
https://your-domain.vercel.app/*
```

**Format Rules:**
- ✅ `http://localhost:3000/*` - Correct (with wildcard)
- ❌ `http://localhost:3000/` - Wrong (missing wildcard)
- ✅ `https://*.vercel.app/*` - Correct (all Vercel preview URLs)

#### **B. API Restrictions**

Choose **"Restrict key"**

Select ONLY:
- ✅ **Maps JavaScript API**

**Why?** This prevents the key from being used for other Google services.

---

### **Step 3: Add to Environment Variables**

#### **Local Development (.env.local)**

Create or update `.env.local`:

```bash
# Google Maps API Key for Interactive Heatmaps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Note:** `NEXT_PUBLIC_` prefix makes it available in the browser.

#### **Production (Vercel/Hosting)**

Add the environment variable in your hosting platform:

**Vercel:**
1. Project Settings → Environment Variables
2. Add: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
3. Value: Your API key
4. Environment: Production, Preview, Development

---

### **Step 4: Restart Dev Server**

```bash
# Stop the server (Ctrl+C)
npm run dev
```

Environment variables are only loaded on startup!

---

## 🛡️ Security Best Practices

### ✅ **What Protects Your Key**

1. **HTTP Referer Restriction**
   - Only your domains can use the key
   - Attempts from other sites are blocked
   - Google validates the referer header

2. **API Restriction**
   - Key only works for Maps JavaScript API
   - Can't be used for other Google services
   - Limits potential damage

3. **Usage Monitoring**
   - Set up billing alerts
   - Monitor API usage in Google Cloud Console
   - Get notified of unusual activity

### ⚠️ **What DOESN'T Work**

❌ **Server-side proxy** - Doesn't work for JavaScript API  
❌ **Hiding the key** - Impossible for browser-based API  
❌ **Encrypting the key** - Browser still decrypts it  
❌ **Rate limiting on your server** - Google handles this

---

## 🔍 Fixing "ApiTargetBlockedMapError"

**Error Message:**
```
Google Maps JavaScript API error: ApiTargetBlockedMapError
```

**Cause:** Your current domain is not in the allowed referrers list.

**Solution:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click your API key
4. Under **Application restrictions** → **HTTP referrers**
5. Add your current domain:
   - Local: `http://localhost:3000/*`
   - Production: `https://your-domain.com/*`
6. Click **Save**
7. Wait 1-2 minutes for changes to propagate
8. Refresh your application

**Check Your Current Domain:**
```javascript
// In browser console:
console.log(window.location.origin)
// Use this value in the referrers list
```

---

## 💰 Cost Management

### **Free Tier**

Google provides:
- **$200/month free credit**
- Maps JavaScript API: **$7 per 1,000 loads**
- = **~28,000 free map loads per month**

### **Your Usage**

- 3 maps per keyword (Previous, Current, Change)
- Example: 5 keywords = 15 map loads per page view
- 28,000 ÷ 15 = **~1,866 free page views per month**

### **Set Up Billing Alerts**

1. Go to **Billing** in Google Cloud Console
2. Click **Budgets & alerts**
3. Create budget: $10/month
4. Set alerts at 50%, 90%, 100%

This ensures you're notified before charges occur.

---

## 🐛 Troubleshooting

### **Problem: "API key not configured"**

**Check:**
1. `.env.local` file exists in project root
2. Variable name: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
3. No extra spaces or quotes
4. Server restarted after adding variable

### **Problem: "Multiple API loads" warning**

**Fixed in latest version!** If you still see this:
1. Make sure you're using the latest code
2. Only one Google Maps script should load
3. Check browser DevTools → Network tab for duplicate requests

### **Problem: Maps show error dialog**

**Common causes:**
1. **Invalid API key** - Check the key is correct
2. **Billing not enabled** - Enable billing in Google Cloud
3. **API not enabled** - Enable "Maps JavaScript API"
4. **Quota exceeded** - Check usage in Google Cloud Console

### **Problem: "This page can't load Google Maps correctly"**

**Solutions:**
1. Check API key restrictions match your domain
2. Enable billing (even for free tier)
3. Verify Maps JavaScript API is enabled
4. Wait 2-3 minutes after changing restrictions

---

## ✅ Verification Checklist

Before going to production, verify:

- [ ] API key is in `.env.local`
- [ ] Variable uses `NEXT_PUBLIC_` prefix
- [ ] Maps JavaScript API is enabled
- [ ] API key has HTTP referrer restrictions
- [ ] API key restricted to Maps JavaScript API only
- [ ] Billing is enabled in Google Cloud
- [ ] Billing alerts are configured
- [ ] Local domain (`localhost:3000/*`) is allowed
- [ ] Production domain is allowed
- [ ] Maps load without errors
- [ ] No "ApiTargetBlockedMapError" in console

---

## 📚 Additional Resources

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [Error Messages Reference](https://developers.google.com/maps/documentation/javascript/error-messages)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)

---

## 🆘 Still Having Issues?

**Check browser console for specific error:**
1. Open DevTools (F12)
2. Go to Console tab
3. Look for Google Maps errors
4. Search the error code in [Google's Error Reference](https://developers.google.com/maps/documentation/javascript/error-messages)

**Most common fix:** Add your current domain to HTTP referrers and wait 2 minutes.
