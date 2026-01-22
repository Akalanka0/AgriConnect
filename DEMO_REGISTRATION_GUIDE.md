# Demo Registration Guide

## Overview
This guide explains how to create demo farmer and instructor accounts using the special demo email `akalankasenanayake88@gmail.com`.

## Demo Email Benefits
- **Multiple Registrations**: Register unlimited times with the same email
- **Auto-Verification**: Email verification is automatically bypassed
- **OTP Display**: OTP codes are shown in the response for testing
- **Unique IDs**: System automatically generates unique identifiers

## Available Demo IDs

### Farmer IDs
- `DEMO-FARM-2026-001`
- `DEMO-FARM-2026-002`
- `DEMO-FARM-2026-003`
- `DEMO-FARM-2026-004`
- `DEMO-FARM-2026-005`

### Instructor IDs
- `DEMO-INST-2026-001`
- `DEMO-INST-2026-002`
- `DEMO-INST-2026-003`
- `DEMO-INST-2026-004`
- `DEMO-INST-2026-005`

## Registration Examples

### Farmer Registration
```json
{
  "full_name": "Demo Farmer",
  "email": "akalankasenanayake88@gmail.com",
  "password": "demo12345",
  "role": "farmer",
  "nic": "123456789V",
  "phone": "0712345678",
  "farmer_id": "DEMO-FARM-2026-001"
}
```

### Instructor Registration
```json
{
  "full_name": "Demo Instructor",
  "email": "akalankasenanayake88@gmail.com",
  "password": "demo12345",
  "role": "instructor",
  "nic": "987654321V",
  "phone": "0718765432",
  "instructor_id": "DEMO-INST-2026-001"
}
```

## How It Works

1. **Email Handling**: The system appends a timestamp to make the email unique in the database
2. **NIC Handling**: A short timestamp is appended to NIC for uniqueness
3. **ID Handling**: Demo IDs are **reusable** - multiple demo accounts can use the same demo ID
4. **Verification**: Email verification is automatically bypassed
5. **Login**: Use original email `akalankasenanayake88@gmail.com` for login
6. **Quick Demo**: Use the "Quick Demo" button to auto-fill all fields

## Testing Flow

1. Click **"Quick Demo - Farmer"** or **"Quick Demo - Instructor"** button
2. The form auto-fills with demo data (8+ character password)
3. Click **"Create Account"** to register
4. The account is automatically verified
5. Login with `akalankasenanayake88@gmail.com` and your password
6. Access the appropriate dashboard based on role

## Notes

- Each registration creates a unique database entry
- The original email is preserved for login and OTP purposes
- Demo accounts are marked as active and verified
- **Demo IDs are reusable** - you can register multiple accounts with the same demo ID
- Password meets minimum 8-character requirement
- You can register unlimited demo accounts for testing
