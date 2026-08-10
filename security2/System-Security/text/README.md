# Vinta Market - Vintage Clothing Store

A comprehensive web application for a vintage clothing store with user registration, authentication, and password management features.

## Features

### 1. Forms
- ✅ Prospect name displayed above header on all pages
- ✅ Dynamic header navigation (Home, Register, Log-in, Log-out based on page state)
- ✅ Proper copyright statement in footer
- ✅ Form labels positioned above input fields with required asterisks
- ✅ ID Number input with xxxx-xxxx placeholder format

### 2. Registration
- ✅ ID number as primary key with duplicate validation
- ✅ Required field indicators with red asterisks
- ✅ Password hashing in database
- ✅ Username and password uniqueness validation
- ✅ Comprehensive input validation:
  - No special characters in names
  - No double spaces
  - No all capital letters
  - No three consecutive identical letters
  - Proper capitalization (first letter capital, rest lowercase)
- ✅ Age calculation from birthdate with legal age validation (18+)
- ✅ Password strength indicator (weak, medium, strong)
- ✅ Password confirmation validation
- ✅ Real-time username availability checking
- ✅ Optional middle name and name extension with validation
- ✅ Structured address format (Purok/Street, Barangay, Municipality/City, Province, Country, Zip Code)
- ✅ Three authentication questions with unique selection validation

### 3. Authentication Questions
- ✅ Three predefined security questions:
  - Who is your best friend in Elementary?
  - What is the name of your favorite pet?
  - Who is your favorite teacher in high school?

### 4. Login
- ✅ Input validation for username and password
- ✅ Consecutive error tracking (2 errors show forgot password link)
- ✅ Progressive access denial:
  - 3 errors = 15 seconds blocked
  - 6 errors = 30 seconds blocked
  - 9 errors = 60 seconds blocked
- ✅ Browser back button disabled
- ✅ Show/hide password functionality
- ✅ Disabled login button and register link during block period

### 5. Forgot Password
- ✅ Username verification
- ✅ Authentication question selection
- ✅ Answer verification with re-entry validation

### 6. Change Password
- ✅ Current password verification
- ✅ New password strength checking
- ✅ Password confirmation validation
- ✅ Success/error messaging

### 7. Technical Implementation
- ✅ Organized folder structure (CSS, PHP, JavaScript, images)
- ✅ External CSS and JavaScript linking
- ✅ Responsive design
- ✅ Database integration with MySQL
- ✅ Session management
- ✅ Security features (password hashing, input sanitization)

## Setup Instructions

### Prerequisites
- Web server (Apache/Nginx)
- PHP 7.4 or higher
- MySQL 5.7 or higher

### Installation

1. **Database Setup**
   - Create a MySQL database named `vinta_market`
   - Run the setup script: `http://your-domain/php/setup.php`
   - This will create all necessary tables

2. **File Upload**
   - Upload all files to your web server directory
   - Ensure proper file permissions (755 for directories, 644 for files)

3. **Configuration**
   - Update database credentials in `php/config.php` if needed:
     ```php
     $host = 'localhost';
     $dbname = 'vinta_market';
     $username = 'your_username';
     $password = 'your_password';
     ```

4. **Access**
   - Navigate to `http://your-domain/` or `http://your-domain/home.html`

## File Structure

```
Project-Almanac/
├── css/
│   ├── common.css          # Common styles and form validation
│   ├── home.css           # Home page styles
│   ├── login.css          # Login page styles
│   └── register.css       # Registration page styles
├── js/
│   ├── login.js           # Login functionality and validation
│   ├── register.js        # Registration form validation
│   ├── forgot-password.js # Forgot password validation
│   └── change-password.js # Change password functionality
├── php/
│   ├── config.php         # Database configuration and helper functions
│   ├── setup.php          # Database setup script
│   ├── register.php       # Registration backend
│   ├── login.php          # Login backend
│   ├── forgot-password.php # Forgot password backend
│   └── change-password.php # Change password backend
├── images/                # Image assets
├── home.html              # Home page
├── login.html             # Login page
├── register.html          # Registration page
├── forgot-password.html   # Forgot password page
├── change-password.html   # Change password page
├── index.html             # Redirect to home page
└── README.md              # This file
```

## Demo Credentials

For testing purposes, you can use these demo credentials:
- Username: `admin`, Password: `password123`
- Username: `user`, Password: `user123`
- Username: `test`, Password: `test123`

## Security Features

- Password hashing using PHP's `password_hash()`
- Input sanitization and validation
- SQL injection prevention with prepared statements
- Session management
- Login attempt tracking and rate limiting
- CSRF protection considerations

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Notes

- The application includes comprehensive client-side and server-side validation
- All form submissions are handled via AJAX for better user experience
- Error messages are displayed in real-time as users type
- The design is fully responsive and mobile-friendly
- All requirements from the specification have been implemented

## Support

For any issues or questions, please refer to the code comments or contact the development team.
