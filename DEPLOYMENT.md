# Deployment Guide - Ivony Admin Dashboard

Complete guide to deploy Ivony to production with maximum security.

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)
### Option 2: Netlify
### Option 3: Cloudflare Pages
### Option 4: Traditional Server (Nginx)

---

## 📋 Pre-Deployment Checklist

- [ ] Supabase project configured (see SUPABASE_SETUP.md)
- [ ] RLS policies tested
- [ ] User roles assigned
- [ ] TailwindCSS compiled
- [ ] Environment variables prepared
- [ ] CSP headers configured
- [ ] HTTPS enabled
- [ ] Error logging setup

---

## Option 1: Vercel Deployment

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Create `vercel.json`
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 3. Set Environment Variables

In Vercel Dashboard:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON=your-anon-key
```

### 4. Update `index.html` to use env vars

Create a build script that injects env vars:

**build.js**:
```javascript
const fs = require('fs');
const html = fs.readFileSync('./index.html', 'utf8');
const replaced = html
  .replace('data-supabase-url=""', `data-supabase-url="${process.env.VITE_SUPABASE_URL}"`)
  .replace('data-supabase-anon=""', `data-supabase-anon="${process.env.VITE_SUPABASE_ANON}"`);
fs.writeFileSync('./dist/index.html', replaced);
```

### 5. Deploy
```bash
vercel --prod
```

---

## Option 2: Netlify Deployment

### 1. Create `netlify.toml`
```toml
[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; upgrade-insecure-requests;"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

### 2. Set Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON=your-anon-key
```

### 3. Deploy
```bash
netlify deploy --prod
```

---

## Option 3: Cloudflare Pages

### 1. Create `_headers` file
```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; upgrade-insecure-requests;
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 2. Create `_redirects` file
```
/*  /index.html  200
```

### 3. Deploy via Wrangler
```bash
npx wrangler pages publish .
```

---

## Option 4: Traditional Server (Nginx)

### 1. Nginx Configuration

**/etc/nginx/sites-available/ivony**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; upgrade-insecure-requests;" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Root directory
    root /var/www/ivony;
    index index.html;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

### 2. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/ivony /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL with Let's Encrypt
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## 🔧 Compile TailwindCSS for Production

### 1. Install Dependencies
```bash
npm init -y
npm install -D tailwindcss
```

### 2. Create `tailwind.config.js`
```javascript
module.exports = {
  content: [
    "./index.html",
    "./js/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e'
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
```

### 3. Create `src/input.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Import your custom styles */
@import '../css/base.css';
```

### 4. Build CSS
```bash
# Development
npx tailwindcss -i ./src/input.css -o ./css/output.css --watch

# Production (minified)
npx tailwindcss -i ./src/input.css -o ./css/output.css --minify
```

### 5. Update `index.html`
```html
<!-- Remove Tailwind CDN -->
<!-- <script src="https://cdn.tailwindcss.com"></script> -->

<!-- Add compiled CSS -->
<link rel="stylesheet" href="/css/output.css">
```

---

## 🔒 Security Hardening

### 1. Environment Variables

**Never commit credentials!**

Create `.env.production`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON=your-anon-key
```

Add to `.gitignore`:
```
.env*
node_modules/
dist/
```

### 2. Inject Environment Variables

**inject-env.js**:
```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const replaced = html
  .replace(
    'data-supabase-url=""',
    `data-supabase-url="${process.env.VITE_SUPABASE_URL || ''}"`
  )
  .replace(
    'data-supabase-anon=""',
    `data-supabase-anon="${process.env.VITE_SUPABASE_ANON || ''}"`
  );

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

fs.writeFileSync(path.join(distDir, 'index.html'), replaced);
console.log('✅ Environment variables injected');
```

**package.json**:
```json
{
  "scripts": {
    "build:css": "tailwindcss -i ./src/input.css -o ./css/output.css --minify",
    "build:html": "node inject-env.js",
    "build": "npm run build:css && npm run build:html",
    "deploy": "npm run build && vercel --prod"
  }
}
```

---

## 📊 Monitoring & Logging

### 1. Error Tracking (Sentry)

Add to `index.html`:
```html
<script src="https://browser.sentry-cdn.com/7.x.x/bundle.min.js"></script>
<script>
  if (window.location.hostname !== 'localhost') {
    Sentry.init({
      dsn: 'your-sentry-dsn',
      environment: 'production',
      tracesSampleRate: 0.1,
    });
  }
</script>
```

### 2. Analytics (Privacy-focused)

Use Plausible or Simple Analytics (GDPR-compliant):

```html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

### 3. Supabase Logging

Monitor auth events in Supabase Dashboard:
- Authentication → Logs
- Database → Query performance
- Functions → Execution logs

---

## 🧪 Pre-Launch Testing

### 1. Security Audit
```bash
# Install security testing tools
npm install -g snyk

# Scan dependencies
snyk test

# Test CSP
curl -I https://yourdomain.com
```

### 2. Lighthouse Audit

Run in Chrome DevTools:
- Performance: >90
- Accessibility: 100
- Best Practices: 100
- SEO: >90

### 3. Load Testing
```bash
# Install k6
brew install k6  # macOS
# or download from k6.io

# Create load-test.js
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 0 },
  ],
};

export default function () {
  let res = http.get('https://yourdomain.com');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
EOF

# Run test
k6 run load-test.js
```

---

## 🎯 Post-Deployment

### 1. DNS Configuration

Set up CDN and DNS:
```
A     @       123.123.123.123
AAAA  @       2001:db8::1
CNAME www     yourdomain.com
```

### 2. CDN (Cloudflare)

Enable Cloudflare for:
- DDoS protection
- Web Application Firewall (WAF)
- Rate limiting
- Cache optimization

### 3. Monitoring Alerts

Set up alerts for:
- ❌ Server downtime
- ⚠️ High error rates
- 🔥 Unusual traffic spikes
- 🔒 Failed login attempts

### 4. Backup Strategy

- Database: Daily automated backups via Supabase
- Code: Git repository
- Configuration: Version controlled
- Secrets: Encrypted vault (1Password, Vault)

---

## 📈 Performance Optimization

### 1. Enable HTTP/2
Already enabled in Nginx config above.

### 2. Preload Critical Resources
```html
<link rel="preload" href="/css/output.css" as="style">
<link rel="preload" href="/js/main.js" as="script">
```

### 3. Lazy Load Images
```javascript
// In your code
img.loading = "lazy";
```

### 4. Service Worker (Optional)

For offline support:
```javascript
// sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/css/output.css',
        '/js/main.js',
      ]);
    })
  );
});
```

---

## ✅ Final Checklist

- [ ] HTTPS enabled and forced
- [ ] Security headers configured
- [ ] CSP properly set
- [ ] Environment variables injected
- [ ] TailwindCSS compiled
- [ ] Source maps disabled in production
- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] Monitoring alerts set up
- [ ] Backups configured
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation updated

---

## 🚨 Emergency Procedures

### Rollback Deployment
```bash
# Vercel
vercel rollback

# Netlify
netlify rollback

# Nginx
sudo cp /var/www/ivony-backup/* /var/www/ivony/
sudo systemctl reload nginx
```

### Database Recovery
```bash
# Restore from Supabase backup
# Go to Dashboard → Database → Backups → Restore
```

---

## 📞 Support & Resources

- Supabase Status: https://status.supabase.com
- Vercel Status: https://www.vercel-status.com
- SSL Labs Test: https://www.ssllabs.com/ssltest/
- Security Headers: https://securityheaders.com

---

**Your application is now production-ready!** 🎉🔒🚀
