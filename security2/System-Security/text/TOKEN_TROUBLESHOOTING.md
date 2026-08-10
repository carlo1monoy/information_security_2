# Password Reset Token Troubleshooting Guide

## Changes Made

### 1. Extended Token Expiry
- **Before**: 1 hour
- **After**: 24 hours
- This gives users more time to complete the password reset process

### 2. Added Comprehensive Logging
All token operations now log to PHP error log (check `C:\xampp\apache\logs\error.log`):
- Token generation and storage
- Token retrieval and validation
- Specific failure reasons (expired, used, not found)

### 3. Added Browser Console Logging
Open browser DevTools (F12) → Console tab to see:
- Token being received from forgot-password page
- Token being stored in sessionStorage
- Token being retrieved on change-password page
- Token being sent to server

### 4. Better Error Messages
Users now see specific error messages:
- "This reset token has already been used"
- "This reset token has expired"
- "Invalid reset token. Please restart the password reset process"

## How to Test

### Step 1: Clear Old Data
1. Visit: `http://localhost/System-Security/php/debug-token.php`
2. Check if there are any old/expired tokens

### Step 2: Start Fresh Password Reset
1. Open browser DevTools (F12) → Console tab
2. Go to: `http://localhost/System-Security/forgot-password.html`
3. Enter your username/ID number
4. Answer security questions
5. Watch the Console for messages like:
   - "Identity verification successful"
   - "Received reset token from server (length: 64)"
   - "Token stored in sessionStorage"

### Step 3: Check Token on Change Password Page
1. You should be redirected to `change-password.html`
2. Check Console for:
   - "Change Password Page Loaded"
   - "Reset token from sessionStorage: Found (length: 64)"
3. If you see "NOT FOUND", the token wasn't transferred properly

### Step 4: Complete Password Change
1. Enter new password
2. Click "Change Password"
3. Check Console for:
   - "Submitting password change..."
   - "Token in sessionStorage: Present (length: 64)"
4. If successful, you'll be redirected to login page

## Common Issues and Solutions

### Issue: "Invalid or expired reset token"

**Possible Causes:**
1. **Token expired** - Token was generated more than 24 hours ago
2. **Token already used** - You already changed password with this token
3. **Token not in sessionStorage** - SessionStorage was cleared or page was opened in new tab
4. **Database issue** - Token wasn't saved properly

**Solutions:**
1. Check browser Console (F12) for error messages
2. Check PHP error log: `C:\xampp\apache\logs\error.log`
3. Visit `http://localhost/System-Security/php/debug-token.php` to see token status
4. Start the password reset process again from the beginning

### Issue: Token not in sessionStorage

**Causes:**
- Opening change-password.html directly (not through forgot-password flow)
- Opening in a different browser tab/window
- SessionStorage disabled in browser
- Browser security settings blocking sessionStorage

**Solution:**
- Always complete the full flow: forgot-password.html → change-password.html
- Don't open change-password.html in a new tab
- Make sure you complete the flow in the same browser tab

### Issue: Token already used

**Cause:**
- You already successfully changed your password
- You're trying to use the same reset link again

**Solution:**
- Try logging in with your new password
- If login fails, start a new password reset process

## Diagnostic Tools

### 1. Token Debug Page
**URL**: `http://localhost/System-Security/php/debug-token.php`

**Features:**
- Shows all tokens in database
- Shows token status (valid, expired, used)
- Test any token to see why it's failing
- Shows time remaining until expiry

### 2. Browser Console
**How to Open**: Press F12 → Console tab

**What to Look For:**
- Token generation and storage messages
- Error messages in red
- Token length (should be 64 characters)

### 3. PHP Error Log
**Location**: `C:\xampp\apache\logs\error.log`

**What to Look For:**
- "Forgot password: Token successfully inserted"
- "Change password: Token found - User ID: X"
- "Change password: Token expired" or "Token already used"

## Testing Checklist

- [ ] Clear browser cache and sessionStorage
- [ ] Start from forgot-password.html
- [ ] Open browser DevTools (F12) Console
- [ ] Enter username and submit
- [ ] Verify questions are displayed correctly
- [ ] Answer security questions (at least 2 correct)
- [ ] Check Console: "Token stored in sessionStorage"
- [ ] After redirect, check Console: "Reset token from sessionStorage: Found"
- [ ] Enter new password
- [ ] Submit form
- [ ] Check for success message
- [ ] Verify redirect to login.html
- [ ] Log in with new password

## Still Having Issues?

1. **Check debug-token.php** to see if tokens are being created
2. **Check browser Console** for JavaScript errors
3. **Check PHP error log** for server-side errors
4. **Try a different browser** to rule out browser-specific issues
5. **Clear all browser data** (cache, cookies, storage) and try again
