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

## WICE App – Local Setup & Handoff Guide (using existing Firebase project)
1) Install tools  
   - VS Code: https://code.visualstudio.com/  
   - Node.js (LTS): https://nodejs.org/ (close/reopen terminal after install)  
   - Git: macOS `xcode-select --install` (or https://git-scm.com/download/mac); Windows https://git-scm.com/download/win

2) Download the code  
   ```bash
   git clone https://github.com/<your-repo>/Wice.git
   cd Wice/WiceApp
   ```

3) Install project dependencies  
   ```bash
   npm install
   ```
   (Only run `npm install` in `functions/` if you plan to work on Cloud Functions.)

4) Configure Firebase CLI (same Firebase project)  
   ```bash
   npm install -g firebase-tools
   firebase --version
   firebase login
   firebase use wice-granthunt
   # one-time, from repo root:
   cd /Users/<yourname>/Wice
   firebase deploy --only storage
   ```
   If you see a bucket error, ensure `wice-granthunt.firebasestorage.app` exists in Firebase Console → Storage.

5) Add environment variables (`WiceApp/.env.local`)  
   ```
   VITE_FIREBASE_API_KEY=AIzaSyCxGLVbQFj3VoWJXQc5UCdpU16wA23lKuc
   VITE_FIREBASE_AUTH_DOMAIN=wice-granthunt.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=wice-granthunt
   VITE_FIREBASE_STORAGE_BUCKET=wice-granthunt.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=820103276782
   VITE_FIREBASE_APP_ID=1:820103276782:web:81ca17f5f00b0a92a92bff
   VITE_FIREBASE_MEASUREMENT_ID=G-CFQX982R49
   VITE_PROTECTED_ADMIN_EMAIL=admin@wice.org

   FIREBASE_API_KEY=AIzaSyCxGLVbQFj3VoWJXQc5UCdpU16wA23lKuc
   FIREBASE_PROJECT_ID=wice-granthunt
   FIREBASE_IMPORT_EMAIL=admin@wice.org
   FIREBASE_IMPORT_PASSWORD=WICEllc@025!!
   ```
   Save the file. The primary admin (`admin@wice.org`) already exists; no need to recreate it.

6) Run the app locally  
   ```bash
   cd WiceApp
   npm run dev
   ```
   Open the printed URL (e.g., http://localhost:5173) in your browser.

## Deployment (frontend)
Build and deploy however you host static assets (Firebase Hosting, Netlify, Vercel, etc.):
```bash
cd WiceApp
npm run build
# deploy the dist/ folder via your hosting provider
```
