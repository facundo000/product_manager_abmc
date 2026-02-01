# Session Logging System

## Overview

The Session Logging System tracks user login and logout activities, capturing timestamps, IP addresses, and user agent information. This provides an audit trail of user authentication events.

## Architecture

### Components

#### SessionLog Entity
Records each user session with the following fields:
- `id`: UUID (primary key)
- `user`: Reference to User entity (ManyToOne with CASCADE DELETE)
- `loginAt`: Timestamp when user logged in
- `logoutAt`: Timestamp when user logged out (nullable)
- `ipAddress`: Client IP address (nullable)
- `userAgent`: Browser/client information (nullable)
- `createdAt`: Record creation timestamp
- `updatedAt`: Record update timestamp

#### SessionService
Handles session data operations:
- `createSessionLog()`: Creates new session record
- `updateSessionLogLogout()`: Updates logout timestamp
- `getActiveSessionByUser()`: Retrieves active session for specific user
- `getUserSessionHistory()`: Gets paginated session history for user
- `getAllActiveSessions()`: Lists all currently active sessions (admin only)

#### SessionListener
Event listener that responds to authentication events:
- Listens to `user.login` event → creates session record
- Listens to `user.logout` event → updates logout timestamp

#### SessionController
REST endpoints for session management:
- `GET /sessions/me/active` - Get active session for current user
- `GET /sessions/me/history` - Get session history for current user
- `GET /sessions/all/active` - List all active sessions (admin only)
- `GET /sessions/user/:userId/history` - Get session history for specific user (admin only)

## Authentication Flow with Session Tracking

### 1. User Login
```
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Request headers captured:
- IP Address: req.ip (client IP)
- User-Agent: req.get('user-agent') (browser/client info)
```

**AuthService:**
- Validates credentials
- Emits `user.login` event with user, IP, and UserAgent

**SessionListener:**
- Catches `user.login` event
- Calls `SessionService.createSessionLog()`
- Records: user, loginAt, ipAddress, userAgent

**Database:**
- SessionLog record created with loginAt = current timestamp
- logoutAt = null (session active)

### 2. User Logout
```
POST /auth/logout
{
  "sessionLogId": "uuid-of-session"
}

Requires: JWT token in Authorization header
```

**AuthService:**
- Emits `user.logout` event with sessionLogId

**SessionListener:**
- Catches `user.logout` event
- Calls `SessionService.updateSessionLogLogout()`
- Updates session record

**Database:**
- SessionLog record updated with logoutAt = current timestamp
- Session now marked as inactive

## API Endpoints

### Get Active Session for Current User

```http
GET /sessions/me/active
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "session-uuid",
  "user": {
    "id": "user-uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "admin"
  },
  "loginAt": "2026-01-31T09:00:00Z",
  "logoutAt": null,
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2026-01-31T09:00:00Z",
  "updatedAt": "2026-01-31T09:00:00Z"
}
```

### Get Session History for Current User

```http
GET /sessions/me/history?limit=10
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "session-uuid-1",
      "user": { "id": "user-uuid", "email": "john@example.com", ... },
      "loginAt": "2026-01-31T09:00:00Z",
      "logoutAt": "2026-01-31T17:30:00Z",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0..."
    },
    {
      "id": "session-uuid-2",
      "user": { ... },
      "loginAt": "2026-01-30T08:45:00Z",
      "logoutAt": "2026-01-30T18:15:00Z",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "total": 15
}
```

### Get All Active Sessions (Admin Only)

```http
GET /sessions/all/active
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
[
  {
    "id": "session-uuid-1",
    "user": {
      "id": "user-uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "admin"
    },
    "loginAt": "2026-01-31T09:00:00Z",
    "logoutAt": null,
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  },
  {
    "id": "session-uuid-2",
    "user": { ... },
    "loginAt": "2026-01-31T08:30:00Z",
    "logoutAt": null,
    "ipAddress": "10.0.0.50",
    "userAgent": "Mobile Safari..."
  }
]
```

### Get Session History for Specific User (Admin Only)

```http
GET /sessions/user/:userId/history?limit=20
Authorization: Bearer <admin-token>
```

## Database Schema

```sql
CREATE TABLE session_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  login_at TIMESTAMP NOT NULL,
  logout_at TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_id ON session_logs(user_id);
CREATE INDEX idx_logout_at ON session_logs(logout_at);
CREATE INDEX idx_login_at ON session_logs(login_at);
```

## Event Flow Diagram

```
User Login Request
        ↓
  AuthService.login()
        ↓
  Emit 'user.login' event
        ↓
  SessionListener.handleUserLogin()
        ↓
  SessionService.createSessionLog()
        ↓
  Insert SessionLog with loginAt
        ↓
  Return JWT token to client
```

```
User Logout Request
        ↓
  AuthService.logout()
        ↓
  Emit 'user.logout' event
        ↓
  SessionListener.handleUserLogout()
        ↓
  SessionService.updateSessionLogLogout()
        ↓
  Update SessionLog with logoutAt
        ↓
  Return success response
```

## Key Features

✅ **Automatic Session Tracking**
- Sessions automatically created on login
- Sessions automatically closed on logout

✅ **Client Information Capture**
- IP address: Identifies client network location
- User-Agent: Identifies browser/device type

✅ **Active Session Detection**
- Query active sessions (where logoutAt is NULL)
- Identify users currently logged in

✅ **Session History**
- Full audit trail of login/logout events
- Calculate session duration: logoutAt - loginAt

✅ **Admin Visibility**
- Admins can view all active sessions
- Admins can access any user's session history

✅ **Event-Driven Architecture**
- Decoupled from authentication service
- Async processing via event emitter

## Session Duration Calculation

To calculate session duration in queries:

```sql
SELECT 
  id,
  user_id,
  login_at,
  logout_at,
  EXTRACT(EPOCH FROM (logout_at - login_at)) as duration_seconds,
  (logout_at IS NULL) as is_active
FROM session_logs
ORDER BY login_at DESC;
```

In application code:
```typescript
const duration = new Date(session.logoutAt).getTime() - new Date(session.loginAt).getTime();
const durationMinutes = duration / (1000 * 60);
```

## Security Considerations

### IP Address Tracking
- Captures client IP for security auditing
- Can detect unusual login locations
- Useful for fraud detection

### Session Expiration
- Currently no automatic session expiration
- JWT tokens still used for request authentication
- SessionLog provides audit trail separate from JWT

### Data Retention
- No automatic cleanup of old session logs
- Consider implementing retention policy:
  - Delete sessions older than 90 days
  - Or archive to separate analytics database

### Privacy
- Avoid storing PII in session logs
- IP addresses may be considered PII in some jurisdictions
- Consider data retention/GDPR compliance

## Usage Examples

### Check if User Has Active Session

```typescript
const activeSession = await sessionService.getActiveSessionByUser(userId);
const isLoggedIn = activeSession !== null;
```

### Calculate User Activity Duration

```typescript
const history = await sessionService.getUserSessionHistory(userId);
const totalMinutes = history.data.reduce((sum, session) => {
  const duration = session.logoutAt 
    ? new Date(session.logoutAt).getTime() - new Date(session.loginAt).getTime()
    : new Date().getTime() - new Date(session.loginAt).getTime();
  return sum + (duration / (1000 * 60));
}, 0);
```

### Monitor Concurrent Users

```typescript
const activeSessions = await sessionService.getAllActiveSessions();
const uniqueUsers = new Set(activeSessions.map(s => s.user.id));
const concurrentUsers = uniqueUsers.size;
```

## Troubleshooting

### SessionLog Not Created on Login
- Check if SessionListener is registered in ListenersModule
- Verify SessionModule imported in AppModule
- Check server logs for errors in event handler

### Can't Find Active Session
- User may not have logged out properly (client disconnected)
- Check logoutAt is null in database
- Use `getAllActiveSessions()` to verify session exists

### Incorrect IP Address
- Behind proxy? Check X-Forwarded-For header
- Docker container? May show container IP instead of client IP
- Configure reverse proxy to forward real client IP

## Future Enhancements

1. **Session Timeout**: Auto-expire inactive sessions after X minutes
2. **Device Tracking**: Store device fingerprint to detect new devices
3. **Geolocation**: Map IP addresses to locations
4. **Multi-Device**: Support multiple concurrent sessions per user
5. **Session Revocation**: Admin ability to logout users remotely
6. **Risk Detection**: Flag suspicious login patterns
7. **Data Analytics**: Generate login/logout reports
8. **Archive**: Move old sessions to separate analytics table

