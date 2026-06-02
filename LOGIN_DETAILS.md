# 🔐 X-CAPITAL LOGIN DETAILS
**Platform**: xcapital.investments  
**Status**: ✅ Production Ready  
**Date**: May 5, 2026

---

## 🎯 MAIN PLATFORM LOGIN

### User Dashboard Login
```
URL:      https://xcapital.investments/auth/login
Email:    user@example.com (or any registered email)
Password: User2026! (example)
```

**What you get:**
- Dashboard with portfolio overview
- Starlink Growth Accelerator features
- Trading terminal access
- Fund investment management
- Real-time market data
- 24/7 customer support (Tawk.io)

---

## 🛡️ ADMIN PANEL LOGIN

### Admin Console (God Admin)
```
URL:      https://xcapital.investments/admin/login
Email:    admin@xcapital.io
Password: Admin2026!
```

**Admin capabilities:**
- ✅ Approve/reject transactions
- ✅ Manage users (create, edit, delete)
- ✅ Review KYC submissions
- ✅ Send notifications
- ✅ Edit Terms of Service
- ✅ View audit logs
- ✅ Add/debit user funds
- ✅ Freeze/unfreeze accounts

---

## 📝 DEMO ACCOUNT

### Pre-Loaded Demo User
```
Email:    demo@xcapital.investments
Password: Demo2026!
```

**Demo account features:**
- ✅ Fully functional dashboard
- ✅ Pre-loaded portfolio ($500K+)
- ✅ Starlink holdings ($33K XLINK)
- ✅ Trading access
- ✅ Portfolio visibility
- ✅ Oracle AI forecasts
- ✅ All platform features

---

## 👥 TEST ACCOUNTS YOU CAN CREATE

### Self-Register New Account
```
URL:      https://xcapital.investments/auth/register
```

**Registration requires:**
- First name
- Last name
- Email address
- Password (min 8 chars)
- Agree to terms

After registration:
1. Login with your credentials
2. Complete KYC verification
3. Get admin approval
4. Full platform access unlocked

---

## 🔑 ALL LOGIN ENDPOINTS

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `/auth/login` | User dashboard login | Email + password |
| `/auth/register` | Create new account | Self-register |
| `/admin/login` | Admin panel access | admin@xcapital.io |
| `/auth/logout` | End session | Any logged-in user |
| `/api/v1/auth/login` | API login | REST endpoint |
| `/api/v1/auth/refresh` | Refresh token | JWT token |

---

## 📱 USER ROLES & ACCESS LEVELS

### GOD_ADMIN (Full Control)
```
Email:    admin@xcapital.io
Role:     GOD_ADMIN
Password: Admin2026!
Access:   Everything + admin panel
```

### ADMIN (Admin Functions)
```
Email:    (created by GOD_ADMIN)
Role:     ADMIN
Access:   Transaction approval, user management
```

### USER (Regular User)
```
Email:    (any registered account)
Role:     USER
Access:   Trading, portfolio, market data
```

### PREMIUM_USER (Paid Tier)
```
Email:    (subscribed users)
Role:     PREMIUM_USER
Access:   Advanced features + priority support
```

---

## 🔐 PASSWORD REQUIREMENTS

All passwords follow these rules:
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter
- ✅ At least one lowercase letter
- ✅ At least one number
- ✅ At least one special character

**Examples:**
- ✅ Admin2026!
- ✅ Demo2026!
- ✅ User@2026
- ✅ SecurePass123!

---

## 🔄 SESSION MANAGEMENT

### Token Expiry
```
Access Token:  7 days
Refresh Token: 30 days
Session:       Active until logout
```

### Automatic Features
- ✅ Auto-refresh on page reload
- ✅ Session persistence
- ✅ Logout on session expiry
- ✅ Secure token storage

---

## 📋 AUTHENTICATION FLOW

```
1. User enters email + password
   ↓
2. Credentials validated against stored users
   ↓
3. JWT tokens generated (access + refresh)
   ↓
4. Tokens stored in localStorage
   ↓
5. User redirected to dashboard/admin
   ↓
6. Session maintained until logout or expiry
```

---

## 🌍 PRODUCTION LOGIN ENVIRONMENT

When deployed to **xcapital.investments**:

### Frontend URLs
```
User Login:      https://xcapital.investments/auth/login
Admin Login:     https://xcapital.investments/admin/login
Registration:    https://xcapital.investments/auth/register
Dashboard:       https://xcapital.investments/dashboard
```

### API Endpoints (Backend)
```
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me (current user)
```

---

## 💾 USER DATA STORAGE

### Frontend Storage
```
localStorage:
  - xc_access_token     (JWT token)
  - xc_session_active   (session flag)
  - xcapital-store      (Zustand store with all user data)
```

### Backend Storage
```
PostgreSQL:
  - users table
  - wallet table
  - portfolio table
  - transactions table
```

---

## 🔐 SECURITY MEASURES

✅ **Password Security**
- Hashed with SHA-256 (client) → bcrypt (server)
- Never transmitted in plain text
- HTTPS/TLS encryption

✅ **Token Security**
- JWT signed with secret key
- Token validation on every request
- Automatic refresh before expiry

✅ **Session Security**
- Unique session ID per login
- HTTP-only cookies (recommended on server)
- CORS configured for xcapital.investments

✅ **Data Protection**
- All sensitive data encrypted
- Password hashing enforced
- SQL injection protection (Prisma ORM)

---

## 🔄 FORGOT PASSWORD FLOW

**Current Status**: Manual reset (development)

**On Production**: Should implement:
1. User enters email on forgot password page
2. Password reset email sent
3. Time-limited reset link provided
4. User sets new password
5. Account unlocked

---

## 📊 USER DATABASE

### Pre-Loaded Users
```
1. admin@xcapital.io          (GOD_ADMIN)
2. demo@xcapital.investments  (DEMO USER)
3. (Others created via registration)
```

### User Fields Tracked
```
- Email (unique)
- Password (hashed)
- First name
- Last name
- Role (GOD_ADMIN, ADMIN, USER, etc.)
- Tier (BLACK, GOLD, SILVER, BRONZE)
- KYC Status (PENDING, APPROVED, REJECTED)
- Account Status (Active, Frozen, Suspended, Blocked)
- Balance (USD)
- Trading enabled/disabled
- Created date
- Last login date
```

---

## 🎯 LOGIN TROUBLESHOOTING

### "Invalid credentials"
**Solution:**
- Double-check email spelling
- Verify password is correct
- Ensure caps lock is OFF
- Use exact email from registration

### "Access restricted to administrators only"
**Solution:**
- Using admin login with non-admin account
- Try user login at `/auth/login`
- Contact admin for role upgrade

### "Session expired"
**Solution:**
- Login again
- Session auto-refreshes on activity
- Clear localStorage if stuck
- Try incognito/private browser

### "Account frozen"
**Solution:**
- Contact admin
- Complete KYC verification
- Resolve any compliance issues

---

## 🛠️ DEVELOPER LOGIN TESTING

### Test Endpoints (Development)
```bash
# Test user login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@xcapital.io",
    "password": "Admin2026!"
  }'

# Test token refresh
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get current user
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📱 MULTI-DEVICE LOGIN

**Simultaneous Sessions:**
- ✅ Can login on multiple devices
- ✅ Same account, different browsers
- ✅ Independent tokens per device
- ✅ Logout on one device doesn't affect others

---

## 🔄 ACCOUNT RECOVERY

### If You Forgot Password
1. Go to `/auth/login`
2. Click "Forgot Password?" (when available)
3. Enter registered email
4. Check email for reset link
5. Follow link to reset password
6. Login with new password

### If Account is Locked
1. Contact admin@xcapital.io
2. Provide account email
3. Admin verifies identity
4. Admin unlocks account
5. Receive password reset link

---

## 🎓 FIRST-TIME LOGIN CHECKLIST

After logging in for the first time:

- [ ] Update profile (name, contact info)
- [ ] Complete KYC verification
- [ ] Add funding method (bank, card, crypto)
- [ ] Review Terms of Service
- [ ] Enable two-factor authentication (when available)
- [ ] Set trading preferences
- [ ] Explore dashboard
- [ ] View Starlink features
- [ ] Read help documentation
- [ ] Contact support if questions

---

## 📞 SUPPORT & HELP

### Built-in Support
- **Tawk.io Widget**: Bottom-right corner, available 24/7
- **Chat Support**: Real-time responses
- **Help Articles**: Available in dashboard

### Contact
```
Email:    support@xcapital.investments
Phone:    (when available)
Website:  https://xcapital.investments
```

---

## ✅ LOGIN CHECKLIST FOR DEPLOYMENT

When deploying to `xcapital.investments`:

- [ ] Update admin password from Admin2026!
- [ ] Create additional admin accounts as needed
- [ ] Configure email verification
- [ ] Setup password recovery system
- [ ] Enable two-factor authentication
- [ ] Configure OAuth (optional)
- [ ] Setup session expiry alerts
- [ ] Create backup admin account
- [ ] Test login on all devices
- [ ] Monitor auth logs

---

## 🚀 QUICK START

### Get Started in 3 Steps:

**Step 1: Go to login page**
```
https://xcapital.investments/auth/login
```

**Step 2: Enter credentials**
```
Email:    demo@xcapital.investments
Password: Demo2026!
```

**Step 3: Click "Sign In"**
```
→ Redirected to dashboard
→ See Starlink features
→ Explore platform
```

---

**Authentication System**: ✅ ACTIVE  
**Login Endpoints**: ✅ READY  
**Security**: ✅ ENABLED  
**Status**: 🟢 LIVE
