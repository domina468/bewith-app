# 🚀 BeWith - Quick Start Guide

## ✅ Authentication Fixed!

The JWT validation error has been fixed. The backend now properly validates user tokens using the correct Supabase client.

## 📝 How To Get Started

### Step 1: Clear Old Data (Important!)
If you had a previous invalid token stored, clear it:

```javascript
// Open browser console and run:
localStorage.clear()
// Then refresh the page
```

### Step 2: Create Your Account

1. **Open the app** - You'll see the authentication screen
2. **Make sure you're on "Create Account"** (toggle if needed)
3. **Fill in the form:**
   - Username: `TestUser` (or any name)
   - Email: `test@example.com` (any format works)
   - Password: `test123` (minimum 6 characters)
4. **Click "Create Account"**
5. ✅ You should see: **"Welcome to BeWith, TestUser! 🎉"**
6. ✅ Home screen loads with available rooms

### Step 3: Verify Authentication

**Check your browser console** for these success messages:
```
✅ Backend connected: { success: true, message: "BeWith server is running!" }
✅ Token valid, user authenticated: TestUser
```

### Step 4: Use The App

- **Browse Rooms** - See all available rooms
- **Create a Room** - Click the "+" button
- **Join a Room** - Click on any room card
- **Send Messages** - Open chat in a room
- **View Profile** - See your stats and streak
- **Sign Out** - Settings → Sign Out

### Step 5: Test Sign In

1. Sign out from Settings
2. You'll be back at the auth screen
3. **Switch to "Welcome Back" (Sign In mode)**
4. Use the **same credentials** you created:
   - Email: `test@example.com`
   - Password: `test123`
5. Click "Sign In"
6. ✅ You're back in!

## 🔍 Troubleshooting

### "Invalid JWT" Error
- **Solution**: Clear localStorage and create a new account
- Run in console: `localStorage.clear()` then refresh

### "Invalid login credentials"
- **Cause**: Trying to sign in before creating an account
- **Solution**: Switch to "Create Account" mode first

### "HTTP 401" on API calls
- **Cause**: Not authenticated
- **Solution**: Make sure you're signed in (check console for auth status)

### Backend Connection Failed
- **Check**: Console should show `✅ Backend connected`
- **If not**: Your Supabase backend may not be running
- **Contact**: Support for backend setup

## 🎯 What Works Now

✅ **Authentication**
- Sign up with email/password
- Sign in with credentials
- Persistent sessions (stays logged in)
- Automatic token validation
- Secure JWT handling

✅ **Rooms**
- View all rooms
- Create custom rooms
- Join/leave rooms
- Real-time participant counts

✅ **Sessions**
- Track time in rooms
- Update participant status
- Silent leave feature

✅ **Chat**
- Send text messages
- Send emoji reactions
- View message history
- Real-time updates (polling)

✅ **User Stats**
- Daily streaks
- Total time tracked
- Room visit counts
- Achievement tracking

## 🔐 Security Notes

- Passwords must be 6+ characters
- Emails are auto-confirmed (no email server needed for dev)
- Tokens expire based on Supabase settings
- All API calls require authentication (except signup/signin)

## 📊 Monitoring

Watch your browser console for:
- 🔑 Auth status messages
- 📡 API request/response logs
- ✅ Success indicators
- ❌ Error messages with details

## 🎉 You're All Set!

The authentication system is now working properly. Create an account and start exploring BeWith!

If you see any other errors, check the console logs - they now provide detailed debugging information.
