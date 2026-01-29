# Fraud Management (AI Refund Review)

Enterprise-style dashboard for reviewing AI-flagged refund transactions with role-aware access, auditable actions, and Firestore real-time updates.

## Features (MVP)

- **Login**: Google SSO (Firebase Auth)
- **Role resolution**: `users/{uid}` profile in Firestore
- **Dashboard**: KPI cards, filters, analytics placeholder
- **Transactions**: role-scoped visibility + pagination (“Load more”) + client-side sorting
- **Transaction side panel**: AI explanation vs human decision, fraud/valid/escalate, notes, overrides, audit log writes
- **Notification center**: real-time Firestore listener
- **Demo seeding**: `/admin/seed` (Operations Manager only)

## Local setup

Install dependencies:

```bash
cd "my-app"
npm install
npm run dev
```

Open `http://localhost:3000` (redirects to `/dashboard`).

## Firebase setup

1. Create a Firebase project
2. Enable **Authentication → Google**
3. Create **Firestore** database
4. Add a Web App in Firebase and copy config into `.env.local`

Create `.env.local` from the example:

```bash
cp .env.local.example .env.local
```

Required env vars:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Optional:

- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_DEMO_MODE=true` (enables “Create demo profile” on login)

## Firestore data model (recommended)

- `users/{uid}`:
  - `role`: `warehouse-manager | regional-manager | operations-manager | executive`
  - `assignedWarehouseId` (warehouse manager)
  - `assignedRegionId` (regional manager)
- `transactions/{transactionId}`:
  - `riskScore` (0..1), `priority`, `modelRecommendation`, `modelExplanation`
  - `warehouseId`, `regionId`, `refundAmount`, `currency`, `status`
  - `humanDecision` (decision, by, at, notes)
  - `escalation` (reason, letter)
- `transactions/{transactionId}/audit/{autoId}`:
  - immutable audit entries (DECISION_SET / NOTE_ADDED / ESCALATED / OVERRIDDEN)
- `notifications/{notificationId}`:
  - `type`, `message`, `priority`, `transactionId`, `warehouseId`, `regionId`

## Demo flow

1. Set `NEXT_PUBLIC_DEMO_MODE=true`
2. Login with Google → click **Create demo profile**
3. If you created an Operations Manager profile, open `/admin/seed` and click **Seed 30 demo transactions**
4. Go back to `/dashboard` and review transactions in the side panel

## Deployment (Firebase Hosting)

This app is compatible with Firebase Hosting. Typical flow:

- `npm run build`
- `firebase init hosting` (and optionally `firebase init functions` for SSR)
- `firebase deploy`

