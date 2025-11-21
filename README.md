# WICE Platform
Web app for WICE clients to find consultants and for consultants to manage their profiles, chats, projects, and marketplace presence. The repo includes the React/Vite frontend (`WiceApp`) and Firebase Cloud Functions (`functions`).

## Prerequisites
- Node.js 18+ and npm
- Firebase project (Firestore, Auth, Functions, Storage)
- Git (if cloning)

## Environment Variables
Create `WiceApp/.env` (or `.env.local`) with your Firebase config:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_PROTECTED_ADMIN_EMAIL=optional_admin_email
```

## Install
```bash
# from repo root
cd WiceApp
npm install
```

If you’ll use Cloud Functions locally:
```bash
cd functions
npm install
```

## Run (frontend)
```bash
cd WiceApp
npm run dev
```
The dev server prints a local URL (default http://localhost:5173). Ensure your Firebase auth domains include `localhost`.

## Run (Cloud Functions emulator)
```bash
cd functions
firebase emulators:start
```
Or deploy functions:
```bash
cd functions
firebase deploy --only functions
```

## Project Structure (high level)
- `WiceApp/` — React/Vite app
  - `src/Pages/` — feature pages (auth, profile builders, marketplace, chat, admin)
  - `src/context/` — auth/chat providers
  - `src/services/` — Firebase data access
  - `src/data/` — static taxonomy/config
- `functions/` — Firebase Cloud Functions (admin helpers, etc.)
- `firestore.rules` / `firestore.indexes.json` — Firestore security rules and indexes

## Common Commands
- Lint: `npm run lint` (inside `WiceApp`)
- Build: `npm run build` (inside `WiceApp`)
- Preview production build: `npm run preview` (inside `WiceApp`)

## Deployment (frontend)
Build and deploy however you host static assets (Firebase Hosting, Netlify, Vercel, etc.):
```bash
cd WiceApp
npm run build
# deploy the dist/ folder via your hosting provider
```
