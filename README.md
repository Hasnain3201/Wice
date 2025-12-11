# WICE Platform
Web app for WICE clients to find consultants and for consultants to manage profiles, chats, projects, and marketplace presence. This repo includes the React/Vite frontend (`WiceApp`) and Firebase Cloud Functions (`functions`).

## Prerequisites
- VS Code: https://code.visualstudio.com/
- Node.js 18+ (LTS): https://nodejs.org/ (restart terminal after install)
- Git: https://git-scm.com/downloads
- Firebase CLI: `npm install -g firebase-tools`

## Quick Start
1) Clone the repo  
```bash
git clone https://github.com/<your-repo>/Wice.git
cd Wice/WiceApp
```

2) Install dependencies (frontend)  
```bash
npm install
```
Only run `npm install` in `functions/` if you plan to work on Cloud Functions.

3) Firebase CLI (uses existing project `wice-granthunt`)  
```bash
firebase login
firebase use wice-granthunt
# one-time, from repo root, to deploy Storage rules if needed:
cd /Users/<yourname>/Wice
firebase deploy --only storage
```
Ensure the bucket `wice-granthunt.firebasestorage.app` exists in Firebase Console → Storage.

4) Run the app (frontend)  
```bash
cd WiceApp
npm run dev
```
Open the printed URL (e.g., http://localhost:5173) in your browser. Ensure Firebase Auth allowed domains include `localhost`.

## Test Credentials
- Client: `client@gmail.com / Client123`
- Consultant: `consultant@gmail.com / Consultant123`
- Admin: `admin@wice.org / WICEllc@025!!`
- Client (dummy): `dummy@gmail.com / Test123`

## Cloud Functions (optional)
```bash
cd functions
firebase emulators:start
# or deploy:
firebase deploy --only functions
```

## Project Structure
- `WiceApp/` — React/Vite app  
  - `src/Pages/` — auth, profile builders, marketplace, chat, admin, etc.  
  - `src/context/` — auth/chat providers  
  - `src/services/` — Firebase data access  
  - `src/data/` — static taxonomy/config  
- `functions/` — Firebase Cloud Functions (admin helpers, etc.)
- `firestore.rules` / `firestore.indexes.json` — Firestore security rules and indexes

## Common Commands
- Lint: `npm run lint` (inside `WiceApp`)
- Build: `npm run build` (inside `WiceApp`)
- Preview: `npm run preview` (inside `WiceApp`)

## Deployment (frontend)
Build and deploy via your hosting provider (Firebase Hosting, Netlify, Vercel, etc.):
```bash
cd WiceApp
npm run build
# deploy the dist/ folder
```
