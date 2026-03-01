# Bitespeed Identity Reconciliation

A web service that identifies and tracks a customer's identity across multiple purchases, even when different contact information is used.

## Tech Stack

- Node.js + TypeScript
- Express
- Prisma ORM
- PostgreSQL (production) / SQLite (local dev)

## Local Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and set DATABASE_URL (use SQLite for local: "file:./dev.db")

# Run migrations
npx prisma migrate dev --name init

# Start development server
npm run dev
```

## Deployment to Render

### 1. Create PostgreSQL Database (if you don't have one)
- Go to [Render Dashboard](https://dashboard.render.com/)
- Click "New +" → "PostgreSQL"
- Choose a name and region
- Select the free tier
- Click "Create Database"
- Copy the "Internal Database URL" (starts with `postgresql://`)

### 2. Create Web Service
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Configure:
  - **Name**: `bitespeed-identity` (or your choice)
  - **Environment**: `Node`
  - **Build Command**: `npm install && npx prisma generate && npm run build && npx prisma migrate deploy`
  - **Start Command**: `npm start`
  - **Instance Type**: Free

### 3. Add Environment Variable
- In the web service settings, add:
  - **Key**: `DATABASE_URL`
  - **Value**: Your PostgreSQL Internal Database URL from step 1

### 4. Deploy
- Click "Create Web Service"
- Wait for deployment (3-5 minutes)
- Your endpoint will be: `https://your-service-name.onrender.com/identify`

## API

### POST /identify

Request body:
```json
{
  "email": "example@email.com",
  "phoneNumber": "123456"
}
```

Both fields are optional but at least one must be provided.

Response:
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["example@email.com"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2, 3]
  }
}
```

## Hosted Endpoint

**Update this after deployment:**
```
https://your-service-name.onrender.com/identify
```

## Testing the API

```bash
curl -X POST https://your-service-name.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","phoneNumber":"123456"}'
```
