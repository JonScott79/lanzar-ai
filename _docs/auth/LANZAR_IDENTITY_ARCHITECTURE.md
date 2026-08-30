# LANZAR IDENTITY ARCHITECTURE

**Status:** APPROVED FOR ARCHITECTURE DESIGN
**Target:** `auth.lanzar.me`

This document defines the central LANZAR Identity service. It outlines the architecture necessary to support "One Identity, Every LANZAR Property" using an OAuth 2.0 / OIDC-style flow without compromising individual application security boundaries.

---

## 1. Core Architecture Pattern

LANZAR Identity acts as a Central Identity Provider (IdP). 
Individual applications (Portal, Tickets, Threadline) act as Service Providers (Clients).

```text
                         LANZAR ID
                      auth.lanzar.me
                    (Firebase Auth Hub)
                           │
              ┌────────────┼────────────┐
              │            │            │
           PORTAL       TICKETS      THREADLINE
     (Client Session) (Client Session) (Client Session)
```

**Key Directives:**
*   No shared `.lanzar.me` master cookies.
*   No shared cross-subdomain LocalStorage hacks.
*   Each application establishes its own local security session after proving identity via `auth.lanzar.me`.
*   Firebase Authentication remains the underlying identity datastore, but is hidden behind the `auth.lanzar.me` interface.

---

## 2. Authentication Flow (Authorization Code + PKCE)

Because the current LANZAR ecosystem consists of Single Page Applications (SPAs) that heavily rely on the Firebase Client SDK, the authentication flow requires exchanging a LANZAR Auth Code for a **Firebase Custom Token**. This prevents rewriting the entire backend API.

### The "Sign-In Once" Flow:
1.  **Unauthenticated Access:** User navigates to `portal.lanzar.me`. The Portal sees no local Firebase session.
2.  **Redirect to Hub:** Portal redirects the browser to:
    `https://auth.lanzar.me/authorize?client_id=lanzar_portal&redirect_uri=https://portal.lanzar.me/callback&response_type=code`
3.  **Hub Authentication:**
    *   `auth.lanzar.me` checks its own local session.
    *   *If no session:* User is prompted to log in (Email/Password or Google).
    *   *If session exists:* User bypasses the login screen entirely.
4.  **Code Generation:** `auth.lanzar.me` generates a short-lived, single-use Authorization Code and saves it to a secure backend cache (e.g., Redis or Firestore).
5.  **Return Redirect:** Hub redirects back to the Portal:
    `https://portal.lanzar.me/callback?code=abc123xyz`
6.  **Code Exchange (Behind the scenes):** 
    *   Portal SPA takes the code and calls the LANZAR Identity API: `POST api.auth.lanzar.me/token`
    *   The Identity API verifies the code, confirms the `client_id`, and uses the Firebase Admin SDK to generate a Firebase Custom Token (`admin.auth().createCustomToken(uid)`).
7.  **Local Session Establishment:**
    *   Portal SPA receives the Custom Token.
    *   Portal calls `signInWithCustomToken(customToken)`.
    *   Firebase establishes a secure, local IndexedDB session for `portal.lanzar.me`. The user is now fully authenticated.

---

## 3. Application Registration

To ensure security, applications cannot blindly request tokens. Each LANZAR property must be registered in the LANZAR Identity database (e.g., a `clients` Firestore collection).

**Client Record Model:**
*   `client_id`: Unique identifier (e.g., `lanzar_portal_prod`)
*   `client_name`: Display name ("LANZAR Portal")
*   `allowed_redirect_uris`: Array of strict callback URLs (`['https://portal.lanzar.me/callback', 'http://localhost:3000/callback']`)
*   `allowed_origins`: CORS whitelists.

---

## 4. Identity & User Model

Firebase Auth will continue to manage the core identity layer (Email, Password Hash, Google OAuth linkage, UID). 

A synchronized `users` collection in Firestore will manage extended identity data:
*   `uid`: Firebase UID (Primary Key)
*   `email`: string
*   `email_verified`: boolean
*   `display_name`: string
*   `status`: 'active' | 'suspended'
*   `roles`: Application-specific permissions (e.g., `{ portal: 'customer', tickets: 'admin' }`)
*   `mfa_enabled`: boolean

---

## 5. Firebase Integration Strategy

**Why we keep Firebase:**
*   The current Node API backends heavily rely on `admin.auth().verifyIdToken()`.
*   The current frontends heavily rely on Firestore live-listeners which require native Firebase Auth context.

**How we adapt Firebase:**
Instead of applications initializing Google Sign-In directly, `auth.lanzar.me` becomes the *only* application that implements standard Firebase login UI. The output of the OAuth flow provides downstream applications with Firebase Custom Tokens, allowing them to instantly spin up native Firebase sessions locally.

---

## 6. Session Lifecycle & Logout Behavior

**Local Logout:**
*   **Action:** User clicks "Sign Out" in the Portal.
*   **Behavior:** The Portal calls `signOut(auth)`. The user is logged out of `portal.lanzar.me`.
*   *Note:* If they click "Log In" again, they will be redirected to `auth.lanzar.me`, which will auto-redirect them back in since their Hub session is still active.

**LANZAR Global Logout:**
*   **Action:** User clicks "Sign Out of LANZAR Everywhere" (or logs out of the Hub).
*   **Behavior:** The application directs the user to `https://auth.lanzar.me/logout`. 
*   The Hub terminates the central Firebase session. Next time the user tries to log into any application, they will be forced to provide credentials.
*   *Optional:* The Hub can push a revocation signal to the Identity API (`admin.auth().revokeRefreshTokens(uid)`), which immediately invalidates all active sessions across all subdomains.

---

## 7. Migration & Rollout Strategy

1.  **Stand Up Identity Hub:** Build `auth.lanzar.me` (React) and its supporting API (Node). Configure it to use the *existing* production Firebase project so user data is instantly shared.
2.  **Test Environment:** Register a local development client (`http://localhost:3000`) and verify the Authorization Code -> Custom Token exchange flow works flawlessly.
3.  **App Adaptation:** Replace the heavy `Login.jsx` files in Portal and Tickets with a simple routing interceptor: *If not logged in, redirect to auth.lanzar.me.* Add the `/callback` route to handle the token exchange.
4.  **Production Cutover:** Deploy updated Portal and Tickets applications. Users will be naturally routed to the new Hub on their next session expiration. Existing accounts, passwords, and data remain 100% unaffected.
