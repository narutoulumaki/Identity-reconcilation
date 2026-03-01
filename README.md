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

# Copy example env and configure
cp .env.example .env
# Set for SQLite
# DATABASE_PROVIDER="sqlite"
# DATABASE_URL="file:./dev.db"

# Run migrations (will create dev.db)
npx prisma migrate dev --name init

# Start development server
npm run dev
```

**Server will run at: http://localhost:3000**

## Switching Providers

The Prisma datasource now reads `DATABASE_PROVIDER` from the environment,
so you can switch between SQLite (local) and PostgreSQL (production) simply
by changing the variable and running migrations.

### To use PostgreSQL locally

1. Install or run a Postgres server on your machine.
2. Update `.env`:
   ```dotenv
   DATABASE_PROVIDER="postgresql"
   DATABASE_URL="postgresql://postgres:secret@localhost:5432/bitespeed"
   ```
3. Run a migration (it will create the schema in your local Postgres):
   ```bash
   npx prisma migrate dev --name init
   ```

You can switch back to SQLite anytime by setting `DATABASE_PROVIDER` to
`sqlite` and pointing `DATABASE_URL` at a file again.

## Deployment to Render

1. Ensure your repo is pushed to GitHub.
2. In Render service settings, add environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your PostgreSQL Internal Database URL (the provider is auto-detected)
3. Build Command:
   ```bash
   npm install && npm run prepare-schema && npx prisma generate && npm run build && npm run migrate:deploy
   ```
4. Start Command: `npm start`

The build script automatically detects PostgreSQL from your `DATABASE_URL` and generates
the correct schema. No need to manually set `DATABASE_PROVIDER` unless you want to override.

Once deployed, update the **Hosted Endpoint** section with the service URL.

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
