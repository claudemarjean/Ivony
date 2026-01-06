# Quick Start Guide - Ivony Admin Dashboard

Get up and running in 5 minutes!

## 🚀 Quick Setup

### 1. Create Supabase Project

Visit [supabase.com](https://supabase.com) and create a new project.

### 2. Run Database Setup

Copy the SQL from `SUPABASE_SETUP.md` and run in Supabase SQL Editor:

```sql
-- Run all SQL from SUPABASE_SETUP.md
-- This creates tables, RLS policies, and functions
```

### 3. Create Admin User

Sign up via Supabase Auth, then set role:

```sql
UPDATE auth.users
SET raw_user_meta_data = '{"role": "admin", "status": "active"}'::jsonb
WHERE email = 'your-email@example.com';
```

### 4. Configure Frontend

Open `index.html` and add your Supabase credentials:

```html
<html 
  data-supabase-url="https://your-project.supabase.co" 
  data-supabase-anon="your-anon-key"
>
```

Or use the Settings page after logging in.

### 5. Serve Locally

```bash
# Python
python -m http.server 8000

# Node.js
npx serve

# PHP
php -S localhost:8000
```

### 6. Login

Navigate to `http://localhost:8000` and login with your admin credentials.

---

## 🎯 What You Get

✅ **Dashboard** - Real-time KPIs and system health  
✅ **User Management** - Roles, status, CRUD operations  
✅ **Applications** - Manage apps and projects  
✅ **Analytics** - Page views and event tracking  
✅ **Audit Logs** - Complete security trail  
✅ **Settings** - Platform configuration  

---

## 🔒 Security Features

✅ XSS Protection  
✅ CSRF Protection  
✅ IDOR Protection  
✅ Rate Limiting (5 attempts / 15 min)  
✅ Role-Based Access Control  
✅ Row-Level Security (RLS)  
✅ Input Validation & Sanitization  
✅ Secure Error Handling  
✅ Content Security Policy  

---

## 👥 User Roles

**Admin** (Full Access)
- All features
- User management
- System settings
- Audit logs

**Manager** (Limited Admin)
- Dashboard
- Users (read/edit)
- Applications (CRUD)
- Analytics

**Viewer** (Read-only)
- Dashboard
- Analytics
- Applications (read-only)

---

## 📁 File Structure

```
ivony/
├── index.html              # Main entry point
├── css/
│   └── base.css           # Custom styles
├── js/
│   ├── main.js            # App bootstrap
│   ├── supabase.js        # DB client + security
│   ├── auth.js            # Authentication
│   ├── api.js             # API wrapper
│   ├── router.js          # Routing
│   ├── state.js           # State management
│   ├── components/        # Reusable components
│   └── pages/             # Page modules
├── README.md              # Full documentation
├── SUPABASE_SETUP.md      # Database setup guide
├── DEPLOYMENT.md          # Production deployment
└── SECURITY_CHECKLIST.md  # Security audit
```

---

## 🛠️ Development Tips

### Hot Reload
Use Live Server in VS Code for auto-reload:
```bash
# Install Live Server extension
# Right-click index.html → Open with Live Server
```

### Debug Mode
Open browser console (F12) to see:
- Authentication events
- API calls
- Error messages
- State changes

### Test Different Roles
Create test users with different roles:
```sql
-- Manager
UPDATE auth.users SET raw_user_meta_data = '{"role": "manager", "status": "active"}'::jsonb WHERE email = 'manager@test.com';

-- Viewer
UPDATE auth.users SET raw_user_meta_data = '{"role": "viewer", "status": "active"}'::jsonb WHERE email = 'viewer@test.com';
```

---

## 🐛 Common Issues

### "Supabase not configured"
→ Add credentials to `<html>` tag or Settings page

### Login fails
→ Check user exists in Supabase Auth  
→ Verify role is set in user metadata  
→ Check browser console for errors

### "Permission denied" on database
→ Verify RLS policies are created  
→ Check user role is correct  
→ Review Supabase logs

### Page blank after login
→ Check browser console for errors  
→ Verify all JS files loaded  
→ Check network tab for failed requests

---

## 📚 Next Steps

### For Development
1. Review `README.md` for full documentation
2. Customize pages in `js/pages/`
3. Add your own components
4. Extend API wrapper in `js/api.js`
5. Create custom Supabase RPCs

### For Production
1. Follow `DEPLOYMENT.md`
2. Compile TailwindCSS
3. Set up environment variables
4. Configure security headers
5. Run security audit checklist

---

## 🔗 Quick Links

- [Supabase Dashboard](https://app.supabase.com)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Chart.js Docs](https://www.chartjs.org/docs/)
- [Day.js Docs](https://day.js.org/docs/)

---

## 💡 Tips

**Security First**
- Always sanitize user input
- Never expose service role keys
- Use RLS policies for all tables
- Review security checklist regularly

**Performance**
- Enable compression (gzip/brotli)
- Use CDN for static assets
- Optimize images
- Lazy load heavy components

**Maintainability**
- Keep components small and focused
- Document complex logic
- Use TypeScript for large projects
- Write tests for critical paths

---

## 🆘 Getting Help

### Documentation
- Full README: `README.md`
- Database Setup: `SUPABASE_SETUP.md`
- Deployment: `DEPLOYMENT.md`
- Security: `SECURITY_CHECKLIST.md`

### Community
- Supabase Discord: [discord.supabase.com](https://discord.supabase.com)
- GitHub Issues: Report bugs and feature requests

---

## ✅ Quick Checklist

Setup Complete? Check these off:
- [ ] Supabase project created
- [ ] Database tables created
- [ ] RLS policies enabled
- [ ] Admin user created
- [ ] Frontend configured
- [ ] Login successful
- [ ] All pages accessible
- [ ] API calls working

---

**You're all set!** 🎉

Start building your admin dashboard and remember: **security first, always!** 🔒

---

Made with ❤️ | Powered by Supabase | Styled with TailwindCSS
