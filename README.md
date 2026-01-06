# Ivony - Secure Admin Dashboard

A production-ready, security-focused admin dashboard built with vanilla JavaScript, TailwindCSS, and Supabase.

## 🔒 Security Features

This application implements comprehensive security measures to protect against common web vulnerabilities:

### XSS (Cross-Site Scripting) Protection
- ✅ All user inputs sanitized before rendering
- ✅ `sanitizeHtml()` function used throughout codebase
- ✅ No `dangerouslySetInnerHTML` equivalents
- ✅ CSP headers configured

### CSRF (Cross-Site Request Forgery) Protection
- ✅ JWT-based authentication with Supabase
- ✅ SameSite cookie attributes
- ✅ Token refresh handled securely
- ✅ No exposed credentials in localStorage

### IDOR (Insecure Direct Object References) Protection
- ✅ Row-Level Security (RLS) enforced on all Supabase tables
- ✅ User roles checked server-side via RLS policies
- ✅ UUID validation before database queries
- ✅ Access control on every API call

### Authentication & Authorization
- ✅ **Rate Limiting**: 5 failed login attempts per 15 minutes
- ✅ **Account Lockout**: 5-minute cooldown after max attempts
- ✅ **Password Requirements**: Minimum 8 characters
- ✅ **Role-Based Access Control (RBAC)**: Admin, Manager, Viewer
- ✅ **Session Management**: SessionStorage with optional in-memory fallback
- ✅ **Secure Token Handling**: PKCE flow for auth code exchange

### Data Exposure Prevention
- ✅ Error messages redacted (no database schema leaks)
- ✅ Sensitive info never logged to console in production
- ✅ User-friendly error messages only
- ✅ Server-side RLS policies prevent unauthorized data access

### Content Security Policy (CSP)
```html
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' https://cdn.jsdelivr.net; 
  style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; 
  img-src 'self' data: https:; 
  connect-src 'self' https://*.supabase.co; 
  frame-ancestors 'none';
```

### Additional Security Measures
- ✅ HTTPS-ready (enforce in production)
- ✅ CORS properly configured
- ✅ No service role keys in frontend
- ✅ Input validation on all forms
- ✅ Pagination limits to prevent DoS
- ✅ Prepared for security headers (X-Frame-Options, X-Content-Type-Options, etc.)

---

## 🚀 Features

### Pages
1. **Dashboard** - KPIs, charts, activity overview
2. **Users** - User management with roles and status
3. **Applications** - CRUD operations for apps/projects
4. **Analytics** - Page views and event tracking
5. **Logs** - Read-only audit trail
6. **Settings** - Platform configuration
7. **Login** - Secure authentication flow

### Components
- **Layout**: Sidebar navigation + topbar
- **Toast**: Notification system
- **Modal**: Reusable dialog component
- **Loading States**: Spinners and skeletons
- **Empty States**: Friendly placeholders

### Tech Stack
- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: TailwindCSS (CDN for dev, compile for production)
- **Backend**: Supabase (Auth + REST API)
- **Charts**: Chart.js
- **Date Formatting**: Day.js
- **Icons**: SVG icons (inline)

---

## 📦 Project Structure

```
ivony/
├── index.html              # Main HTML with CSP headers
├── css/
│   └── base.css            # Custom styles and animations
├── js/
│   ├── main.js             # App bootstrap
│   ├── supabase.js         # Supabase client + security utils
│   ├── auth.js             # Authentication with rate limiting
│   ├── api.js              # API wrapper with validation
│   ├── router.js           # Client-side routing with guards
│   ├── state.js            # Global state management
│   ├── components/
│   │   ├── layout.js       # Sidebar and topbar
│   │   ├── toast.js        # Toast notifications
│   │   └── modal.js        # Modal dialogs
│   └── pages/
│       ├── login.js        # Login page
│       ├── dashboard.js    # Dashboard overview
│       ├── users.js        # User management
│       ├── applications.js # Application CRUD
│       ├── analytics.js    # Analytics & insights
│       ├── logs.js         # Audit logs
│       └── settings.js     # Platform settings
└── README.md               # This file
```

---

## 🛠️ Setup Instructions

### 1. Supabase Setup

Create a Supabase project and configure the following:

#### Database Tables

**users_view** (View for user management)
```sql
CREATE VIEW users_view AS
SELECT id, email, 
       raw_user_meta_data->>'role' as role,
       raw_user_meta_data->>'status' as status,
       created_at
FROM auth.users;
```

**applications** (Main app table)
```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**audit_logs** (Audit trail)
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  actor UUID REFERENCES auth.users(id),
  actor_email TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Row-Level Security (RLS) Policies

Enable RLS on all tables:

```sql
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Applications: Admins and managers can CRUD, viewers can read
CREATE POLICY "applications_select" ON applications
  FOR SELECT USING (
    auth.jwt()->>'role' IN ('admin', 'manager', 'viewer')
  );

CREATE POLICY "applications_insert" ON applications
  FOR INSERT WITH CHECK (
    auth.jwt()->>'role' IN ('admin', 'manager')
  );

CREATE POLICY "applications_update" ON applications
  FOR UPDATE USING (
    auth.jwt()->>'role' IN ('admin', 'manager')
  );

CREATE POLICY "applications_delete" ON applications
  FOR DELETE USING (
    auth.jwt()->>'role' = 'admin'
  );

-- Audit logs: Admin-only
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT USING (
    auth.jwt()->>'role' = 'admin'
  );
```

#### Supabase Functions (RPCs)

**get_dashboard_kpis**
```sql
CREATE OR REPLACE FUNCTION get_dashboard_kpis()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'active_users', (SELECT COUNT(*) FROM auth.users WHERE raw_user_meta_data->>'status' = 'active'),
    'total_applications', (SELECT COUNT(*) FROM applications),
    'total_projects', 6, -- Update based on your needs
    'logs_24h', (SELECT COUNT(*) FROM audit_logs WHERE created_at > NOW() - INTERVAL '24 hours')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**update_user_role** (Admin only)
```sql
CREATE OR REPLACE FUNCTION update_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID AS $$
BEGIN
  IF auth.jwt()->>'role' != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || json_build_object('role', new_role)::jsonb
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Frontend Setup

1. **Clone/Download** this repository

2. **Configure Supabase** in Settings page or directly in HTML:
   ```html
   <html data-supabase-url="https://your-project.supabase.co" 
         data-supabase-anon="your-anon-key">
   ```

3. **Serve locally**:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve
   
   # Using PHP
   php -S localhost:8000
   ```

4. **Open** http://localhost:8000

---

## 🔐 User Roles

Set user roles in Supabase Auth user metadata:

```json
{
  "role": "admin",
  "status": "active"
}
```

**Available roles:**
- `admin` - Full access to all features
- `manager` - Access to users, applications, analytics
- `viewer` - Read-only access to dashboard and analytics

---

## 🌐 Production Deployment

### 1. Compile TailwindCSS

```bash
# Install Tailwind CLI
npm install -D tailwindcss

# Create tailwind.config.js
npx tailwindcss init

# Build CSS
npx tailwindcss -i ./css/base.css -o ./css/output.css --minify
```

Update `index.html` to use compiled CSS:
```html
<link rel="stylesheet" href="/css/output.css">
<!-- Remove Tailwind CDN script -->
```

### 2. Environment Variables

**NEVER** hardcode credentials. Use environment variables:

```javascript
// Deploy with env injection (e.g., Vercel, Netlify)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON;
```

### 3. CSP Headers (Server-side)

Configure via web server (Nginx/Apache) or hosting provider:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; upgrade-insecure-requests;";
```

### 4. HTTPS Enforcement

```nginx
# Redirect HTTP to HTTPS
server {
  listen 80;
  return 301 https://$host$request_uri;
}
```

### 5. Security Headers

```nginx
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()";
```

---

## 🧪 Testing Security

### Manual Tests

1. **XSS**: Try `<script>alert('XSS')</script>` in any input → Should be escaped
2. **IDOR**: Try accessing another user's data → Should be blocked by RLS
3. **Rate Limiting**: Attempt 6+ failed logins → Should be locked out
4. **CSRF**: Attempt API call without valid JWT → Should fail
5. **Role Bypass**: Try accessing admin page as viewer → Should see "No access"

### Tools
- **OWASP ZAP**: Automated security testing
- **Burp Suite**: Manual penetration testing
- **Lighthouse**: Security audit in Chrome DevTools

---

## 📝 Best Practices

### Code Security
- ✅ Always use `sanitizeHtml()` for user content
- ✅ Validate UUIDs with `isValidUUID()` before queries
- ✅ Check authentication with `assertAuthenticated()`
- ✅ Use parameterized queries (Supabase does this)
- ✅ Never trust client-side data

### Supabase Security
- ✅ Enable RLS on ALL tables
- ✅ Test policies thoroughly
- ✅ Use SECURITY DEFINER functions carefully
- ✅ Never expose service role key
- ✅ Audit user permissions regularly

### Deployment
- ✅ Use HTTPS everywhere
- ✅ Set CSP headers server-side
- ✅ Compile TailwindCSS
- ✅ Minify JavaScript
- ✅ Enable compression (gzip/brotli)
- ✅ Set up monitoring and logging

---

## 🐛 Troubleshooting

### "Supabase not configured" error
→ Set `data-supabase-url` and `data-supabase-anon` in `<html>` tag or via Settings page

### "Authentication required" error
→ Login again. Session may have expired.

### "Permission denied" on database query
→ Check RLS policies in Supabase. Ensure user role is set correctly.

### Rate limiting blocking legitimate users
→ Adjust `MAX_ATTEMPTS` and `LOCKOUT_MS` in `auth.js`

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [TailwindCSS](https://tailwindcss.com/)

---

## 📄 License

MIT License - feel free to use this as a template for your projects.

---

## 🤝 Contributing

This is a production-ready template. If you find security issues, please report them responsibly.

---

**Built with security in mind** 🔒 | **Zero-trust architecture** ✨ | **Production-ready** 🚀
