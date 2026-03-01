# Bitespeed Identity Reconciliation

A web service that identifies and tracks a customer's identity across multiple purchases, even when different contact information is used.

## Tech Stack

- Node.js + TypeScript
- Express
- Prisma ORM
- SQLite

## Setup

```bash
npm install
npx prisma migrate dev --name init
```

## Running

```bash
# development
npm run dev

# production
npm run build
npm start
```

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

<!-- Replace with actual hosted URL -->
`https://<your-app>.onrender.com/identify`
