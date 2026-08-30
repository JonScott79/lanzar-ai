# LANZAR ECOSYSTEM — CURRENT AUTHENTICATION INVENTORY

**Date:** 2026-08-16
**Status:** Pre-Migration State

This document outlines the existing authentication mechanisms currently running across LANZAR applications. Do not modify these production flows until the LANZAR Identity (SSO) architecture is fully tested and approved.

---

## 1. LANZAR Portal (`portal.lanzar.me`)
**Path:** `C:\Projects\LANZAR\portal`

*   **Authentication Provider:** Firebase Authentication
*   **Client-side Implementation:** 
    *   React Single Page Application (SPA).
    *   Uses Firebase Client SDK (`getAuth`, `onAuthStateChanged`).
    *   Maintains local session state in browser storage (IndexedDB) tied to `portal.lanzar.me`.
    *   `Login.jsx` directly renders Email/Password and Google OAuth UI.
*   **Backend Implementation:** 
    *   No dedicated local backend in the portal repo. 
    *   Makes requests to the unified LANZAR Tickets API (`http://localhost:3001/api/...` locally, or production backend) passing the Firebase ID token in headers.
*   **Session Mechanism:** Firebase auto-refreshing ID tokens (1-hour lifespan, auto-renewed by the Firebase SDK).
*   **User Database:** 
    *   Identities sit in Firebase Auth.
    *   Roles and access control sit in Firestore (`/users` and `/admins` collections).
*   **Current Login Flow:** User visits Portal -> Sees Login Form -> Enters Credentials -> Firebase authenticates directly -> App state unlocks.
*   **Current Logout Flow:** User clicks "Sign Out" -> `signOut(auth)` is called -> Clears `portal.lanzar.me` IndexedDB storage -> Returns to login screen.
*   **Migration Concerns:** The `App.jsx` routing relies heavily on the immediate availability of the Firebase `user` object. Moving to an external redirect will require adding an OAuth callback route and loading state while the code exchange happens.

---

## 2. LANZAR Tickets (`tickets.lanzar.me`)
**Path:** `C:\Projects\LANZAR\tickets`

*   **Authentication Provider:** Firebase Authentication
*   **Client-side Implementation:**
    *   React SPA, functionally identical authentication paradigm to the Portal.
    *   Relies on `onAuthStateChanged` to manage routes.
*   **Backend Implementation:**
    *   Express/Node.js API (`tickets/website/backend/server.js`).
    *   Uses `firebase-admin/auth` and `firebase-admin/firestore`.
    *   Middleware (`authenticateUser`, `authenticateAdmin`) intercepts `req.headers.authorization` Bearer tokens and verifies them using `admin.auth().verifyIdToken()`.
    *   Handles secure customer account creation via Firebase Admin SDK.
*   **Session Mechanism:** Firebase client tokens (Frontend) validated by Firebase Admin (Backend).
*   **Current Login/Logout Flow:** Same as Portal, but tied strictly to `tickets.lanzar.me`.
*   **Migration Concerns:** The backend API explicitly expects standard Firebase ID tokens in the Authorization header. Any SSO solution must result in the client eventually obtaining a valid Firebase ID token to prevent rewriting the entire backend authentication middleware.

---

## 3. LANZAR Threadline (`threadline.lanzar.me`)
**Path:** (External / Pending Local Integration)

*   **Status:** Not actively tracked in the local development mono-repo structure.
*   **Assumed Architecture:** React/Vue SPA or external service. 
*   **Migration Concerns:** Needs to be integrated into the central application registry. If it does not natively use Firebase, the SSO Hub will need to generate standard JWT Access Tokens in addition to Firebase Custom Tokens.

---

## 4. LANZAR AI (`ai.lanzar.me`)
**Path:** Future Property

*   **Status:** "Coming Soon"
*   **Migration Concerns:** Will be the first "SSO-Native" application, built from day one to redirect to `auth.lanzar.me` for identity provisioning.
