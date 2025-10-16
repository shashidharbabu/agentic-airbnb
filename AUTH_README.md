# Authentication System Documentation

## Overview

This repository implements a complete multi-provider authentication system for an Airbnb-style host application with three authentication methods:

1. **Email/Password** - Traditional authentication with bcrypt hashing
2. **Google OAuth 2.0** - Social login via Google
3. **Firebase Phone Auth** - SMS verification via Firebase

## Features

### ✅ Backend (Node.js/Express)
- Email/password authentication with bcrypt hashing
- Google OAuth 2.0 integration using Passport.js
- Firebase Phone Authentication with Admin SDK verification
- MySQL session storage with `express-mysql-session`
- Session-based authentication with cookie management
- RESTful API endpoints for all auth methods
- Database schema with OAuth provider support

### ✅ Frontend (React/Vite)
- Airbnb-style login modal with multiple views
- Individual 6-digit OTP input boxes for phone verification
- Google OAuth integration with redirect flow
- Firebase client SDK for phone authentication
- Auto-focus and paste support for OTP inputs
- Responsive design matching Airbnb aesthetics
- Header and footer components

## Prerequisites

- **Node.js** (v16+)
- **MySQL** (v8.0+)
- **Google Cloud Console** account (for OAuth)
- **Firebase** account (for Phone Auth)
- **Firebase Blaze Plan** (required for production phone auth)

## Setup Instructions

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd agentic-airbnb

# Install backend dependencies
cd backend/host
npm install

# Install frontend dependencies
cd ../../frontend/host
npm install
```

### 2. Database Setup

```bash
# Connect to MySQL
mysql -u root -p

# Run the schema
mysql -u root -p < backend/host/sql/schema.sql

# Add OAuth fields
mysql -u root -p < backend/host/sql/add_oauth_fields.sql

# Create sessions table
mysql -u root -p < backend/host/sql/create_sessions_table.sql
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized JavaScript origins: `http://localhost:5174`, `http://localhost:4000`
7. Authorized redirect URIs: `http://localhost:4000/auth/google/callback`
8. Download the credentials JSON
9. Copy to project root as `OAuthConfig.json` (see `OAuthConfig.example.json`)

**Important**: Set OAuth consent screen to "External" for public access

### 4. Firebase Phone Auth Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Upgrade to **Blaze Plan** (required for production SMS)
4. Go to **Authentication** → **Sign-in method** → Enable **Phone**
5. Add authorized domains: `localhost`, `127.0.0.1`

#### Get Admin SDK Credentials:
1. Go to **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Save as `FirebaseAdminAccess.json` in project root (see example file)

#### Get Client Configuration:
1. Go to **Project Settings** → **General**
2. Scroll to **Your apps** → **Web app**
3. Copy the configuration
4. Create `firebaseConfig.js` in project root (see example file)
5. Copy to `frontend/host/src/firebase.js`

#### Configure Test Numbers (Development):
1. Go to **Authentication** → **Sign-in method** → **Phone**
2. Scroll to **Phone numbers for testing**
3. Add test numbers with verification codes
   - Example: `+14083965437` → Code: `123456`

### 5. Environment Variables

Create backend `.env` file:

```bash
cd backend/host
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=airbnb_core
SESSION_SECRET=your_super_secret_key_change_this
WEB_ORIGIN=http://localhost:5174
```

### 6. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend/host
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend/host
VITE_HOST_API=http://localhost:4000 npm run dev -- --port 5174
```

Visit: `http://localhost:5174/login`

## API Endpoints

### Authentication Routes (`/auth`)

#### Email/Password
- `POST /auth/signup` - Create new account
- `POST /auth/login` - Login with email/password
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user

#### Google OAuth
- `GET /auth/google` - Initiate Google OAuth flow
- `GET /auth/google/callback` - Handle Google callback

#### Firebase Phone
- `POST /auth/phone/verify` - Verify Firebase ID token

## Database Schema

### `owners` Table
```sql
CREATE TABLE owners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NULL,
  password_hash VARCHAR(255) NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  google_id VARCHAR(255) UNIQUE,
  firebase_uid VARCHAR(255) UNIQUE,
  auth_provider ENUM('email', 'google', 'phone') DEFAULT 'email',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### `sessions` Table
```sql
CREATE TABLE sessions (
  session_id VARCHAR(128) PRIMARY KEY,
  expires INT UNSIGNED NOT NULL,
  data MEDIUMTEXT
);
```

## Security Features

- ✅ Bcrypt password hashing (10 rounds)
- ✅ Session-based authentication
- ✅ MySQL session storage (persistent sessions)
- ✅ HTTP-only cookies
- ✅ CORS configuration
- ✅ Firebase Admin SDK token verification
- ✅ Google OAuth state parameter
- ✅ reCAPTCHA for phone authentication

## Testing

### Email/Password
1. Visit `http://localhost:5174/login`
2. Click "Continue with email"
3. Enter email and password
4. Click "Continue"

### Google OAuth
1. Click "Continue with Google"
2. Select Google account
3. Authorize application
4. Redirected to dashboard

### Phone Authentication
1. Click "Continue with phone"
2. Enter phone number (use test number for development)
3. Enter 6-digit verification code
4. Click "Continue"

**Test Number**: `+14083965437` → Code: `123456` (if configured)

## Tech Stack

### Backend
- **Express.js** - Web framework
- **MySQL2** - Database driver
- **Passport.js** - Authentication middleware
- **passport-google-oauth20** - Google OAuth strategy
- **Firebase Admin SDK** - Phone auth verification
- **express-mysql-session** - Session storage
- **bcryptjs** - Password hashing
- **express-session** - Session middleware

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **React Router DOM** - Routing
- **Firebase Client SDK** - Phone authentication
- **Axios** - HTTP client

## Production Deployment

### Before Deploying:

1. **Change all secrets**:
   - Generate new `SESSION_SECRET`
   - Use strong MySQL passwords
   - Rotate OAuth credentials if compromised

2. **Update OAuth redirect URIs**:
   - Add production domain to Google Cloud Console
   - Update `OAuthConfig.json` redirect URIs

3. **Update Firebase domains**:
   - Add production domain to Firebase authorized domains
   - Update CORS origins

4. **Environment Variables**:
   - Set `NODE_ENV=production`
   - Use environment variables instead of config files
   - Never commit secrets to repository

5. **Enable HTTPS**:
   - Use SSL/TLS certificates
   - Update all URLs to HTTPS
   - Set secure cookie flags

## Troubleshooting

### "Access blocked: This app's request is invalid"
- **Solution**: Change OAuth consent screen from "Internal" to "External" in Google Cloud Console

### Phone auth not sending SMS
- **Solution**: Upgrade Firebase project to Blaze plan

### "auth/billing-not-enabled"
- **Solution**: Enable billing in Firebase Console or use test phone numbers

### reCAPTCHA not working
- **Solution**: Add `localhost` and your domain to Firebase authorized domains

### Session not persisting
- **Solution**: Check MySQL sessions table and `SESSION_SECRET` configuration

## File Structure

```
agentic-airbnb/
├── backend/host/
│   ├── src/
│   │   ├── routes/
│   │   │   └── auth.js              # Authentication routes
│   │   ├── middleware/
│   │   │   ├── passport.js          # Google OAuth config
│   │   │   ├── firebase.js          # Firebase Admin setup
│   │   │   └── auth.js              # Auth middleware
│   │   ├── server.js                # Express server
│   │   └── db.js                    # Database connection
│   ├── sql/
│   │   ├── schema.sql               # Base schema
│   │   ├── add_oauth_fields.sql     # OAuth modifications
│   │   └── create_sessions_table.sql # Session table
│   └── package.json
├── frontend/host/
│   ├── src/
│   │   ├── pages/
│   │   │   └── HostLogin.jsx        # Login component
│   │   ├── api/
│   │   │   └── client.js            # API client
│   │   └── firebase.js              # Firebase client config
│   └── package.json
├── OAuthConfig.example.json         # OAuth template
├── FirebaseAdminAccess.example.json # Firebase Admin template
└── firebaseConfig.example.js        # Firebase client template
```

## License

[Your License Here]

## Support

For issues or questions, please open a GitHub issue.

