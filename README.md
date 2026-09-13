# Central Email Microservice (NestJS + Nodemailer)

A standalone, self-hosted, enterprise-grade email microservice built with **NestJS**, **TypeScript**, and **OpenAPI/Swagger**, designed with a **Zero-Fallback Policy** for maximum reliability.

It serves as the central email hub for:
* **`rudresh-portfolio`**: Visitor contact forms & daily engineering journals.
* **`leetcode_to_github`**: Automated LeetCode streak protection alerts.
* **Future Projects**: Any future apps via a single REST API call.

---

## Zero-Fallback Architecture Policy
1. **Strict Input Rejection**: Any request with missing mandatory fields or extraneous unwhitelisted fields fails immediately with `400 Bad Request` (powered by `ValidationPipe` with `forbidNonWhitelisted: true`).
2. **No Silent Defaults**: Templates never fall back to placeholder names ("Anonymous", "Coder", "0") if key data is absent.
3. **Fail-Fast SMTP Guard**: If SMTP credentials or network connections are down, the service throws an explicit `500 InternalServerErrorException` with descriptive debugging details instead of pretending to succeed.

---

## Interactive Swagger Documentation
When the server is running, visit:
* **`http://localhost:3001/docs`**

You will get a fully interactive OpenAPI UI where you can test endpoints, review request/response schemas, and authenticate using your Bearer key.

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd email-service
npm install
```

### 2. Configure Environment Variables
Create a `.env` file:
```bash
cp .env.example .env
```
Fill in your SMTP credentials (either Gmail App Password or Brevo Free SMTP) and your `API_SECRET_KEY`.

### 3. Run Development Server
```bash
npm run start:dev
```
The server will start on `http://localhost:3001`.

---

## Health Check Endpoint
Check if your SMTP server connection and credentials are valid:
```bash
curl http://localhost:3001/api/emails/health
```

---

## How to Send Emails from Your Projects

All requests must be sent to `POST /api/emails/send` with the header:
`Authorization: Bearer <YOUR_API_SECRET_KEY>`

### 1. In `leetcode_to_github` (Streak Alert):
```typescript
await fetch('https://your-email-service.onrender.com/api/emails/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_SECRET_KEY',
  },
  body: JSON.stringify({
    type: 'STREAK_ALERT',
    to: user.email,
    data: {
      userName: user.name,
      currentStreak: 15,
      hoursLeft: 4,
      solveUrl: 'https://leetcode.com/problemset',
      targetDate: '2026-09-13',
    },
  }),
});
```

### 2. In `rudresh-portfolio` (Contact Form):
```typescript
await fetch('https://your-email-service.onrender.com/api/emails/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_SECRET_KEY',
  },
  body: JSON.stringify({
    type: 'PORTFOLIO_CONTACT',
    to: 'updates@rudreshp.me',
    replyTo: visitorEmail,
    data: {
      visitorName: visitorName,
      visitorEmail: visitorEmail,
      message: visitorMessage,
    },
  }),
});
```

---

## Free Deployment on Render (100% Free)

1. Push this folder to a GitHub repository.
2. Go to [Render.com](https://render.com) and click **New +** -> **Web Service**.
3. Select your repository.
4. Settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
5. Add the Environment Variables from `.env.example`.
6. Once deployed, test Swagger at `https://your-service.onrender.com/docs`!
