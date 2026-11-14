/*
    auth-service.js

    Client-Side Authentication & User Identity Service for LANZAR AI.

    Responsibilities:
    - Manage authenticated session state (Firebase UID, display name, email, avatar, token)
    - Provide OAuth PKCE / Google / Email and Dev Identity login flows
    - Automatically inject authoritative Authorization: Bearer <token> headers into API requests
    - Persist session securely across page reloads and browser restarts
    - Notify UI components reactively on login, logout, and identity switches
*/

import { globalBus } from "../core/event-bus.js";
import { Analytics } from "../analytics.js";

const AUTH_STORAGE_KEY = "lanzar_ai_auth_session";
const AUTH_HUB_URL = typeof window !== "undefined" && window.location?.hostname?.endsWith("-dev.lanzar.me")
  ? "https://auth-dev.lanzar.me"
  : "https://auth.lanzar.me";
const AUTH_API_URL = typeof window !== "undefined" && window.location?.hostname?.endsWith("-dev.lanzar.me")
  ? "https://auth-api-dev.lanzar.me"
  : "https://auth-api.lanzar.me";
const FIREBASE_WEB_API_KEY = "AIzaSyCm11MJPwYKk2ckDIrTOGLNHdyFkdCOM2k";
const CLIENT_ID = "ai";
const PKCE_STATE_KEY = "ai_pkce_state";
const PKCE_VERIFIER_KEY = "ai_pkce_verifier";
const LANZAR_SESSION_ID_KEY = "lanzar_session_id";
const SILENT_SSO_KEY = "ai_silent_sso_attempted";

function isLocalDevHost() {
  if (typeof window === "undefined" || !window.location) return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

function base64UrlEncode(bytes) {
  let binary = "";
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateCodeVerifier() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function generateCodeChallenge(verifier) {
  const encoded = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return base64UrlEncode(new Uint8Array(digest));
}

function decodeJwtPayload(jwt) {
  try {
    const parts = String(jwt || "").split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  } catch (_) {
    return null;
  }
}

class AuthService {
  #currentUser = null;
  #isInitialized = false;

  constructor() {
    this.#loadPersistedSession();
  }

  #loadPersistedSession() {
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (raw) {
          this.#currentUser = JSON.parse(raw);
        }
      }
    } catch (e) {
      console.warn("[AuthService] Could not load persisted session:", e);
      this.#currentUser = null;
    }
  }

  #saveSession(user) {
    this.#currentUser = user;
    try {
      if (typeof localStorage !== "undefined") {
        if (user) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.warn("[AuthService] Could not save session:", e);
    }
  }

  async #completeFirebaseCustomToken(customToken, sessionId = null) {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_WEB_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: customToken, returnSecureToken: true })
      }
    );
    const firebaseData = await res.json().catch(() => ({}));
    if (!res.ok || !firebaseData.idToken) {
      throw new Error(firebaseData?.error?.message || "Firebase custom token sign-in failed.");
    }

    const idToken = firebaseData.idToken;
    const claims = decodeJwtPayload(idToken) || {};
    let profile = {
      uid: claims.user_id || claims.sub || firebaseData.localId || "",
      email: claims.email || "",
      displayName: claims.name || (claims.email ? claims.email.split("@")[0] : "LANZAR Pilot"),
      photoURL: claims.picture || "",
      authenticated: true,
      isGuest: false,
      token: idToken,
      refreshToken: firebaseData.refreshToken || "",
      sessionId: sessionId || claims.session_id || claims.lanzarSessionId || null,
      lastLogin: new Date().toISOString()
    };

    try {
      const profileRes = await fetch(`${AUTH_API_URL}/api/id/profile`, {
        headers: { "Authorization": `Bearer ${idToken}` }
      });
      if (profileRes.ok) {
        const remote = await profileRes.json();
        profile = {
          ...profile,
          displayName: remote.displayName || profile.displayName,
          email: remote.email || profile.email,
          photoURL: remote.avatarUrl || profile.photoURL
        };
      }
    } catch (_) {}

    if (profile.sessionId && typeof sessionStorage !== "undefined") {
      try { sessionStorage.setItem(LANZAR_SESSION_ID_KEY, profile.sessionId); } catch (_) {}
    }
    this.#saveSession(profile);
    return profile;
  }

  // =====================================
  // Initialization & Identity Verification
  // =====================================

  async init() {
    if (this.#isInitialized) return this.#currentUser;

    // Strip any stale non-localhost mock/dev tokens persisted from older releases
    if (!isLocalDevHost() && this.#currentUser?.token && /^(test_|user_|mock_)/.test(this.#currentUser.token)) {
      this.#saveSession(null);
    }

    try {
      const hasWindow = typeof window !== "undefined" && typeof window.location !== "undefined";
      const urlParams = hasWindow ? new URLSearchParams(window.location.search) : null;
      const code = urlParams ? urlParams.get("code") : null;
      const state = urlParams ? urlParams.get("state") : null;

      if (code) {
        let expectedState = null;
        let codeVerifier = null;
        try {
          expectedState = sessionStorage.getItem(PKCE_STATE_KEY);
          codeVerifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
          sessionStorage.removeItem(PKCE_STATE_KEY);
          sessionStorage.removeItem(PKCE_VERIFIER_KEY);
        } catch (_) {}

        urlParams.delete("code");
        urlParams.delete("state");
        const remaining = urlParams.toString();
        const cleanUrl = window.location.pathname + (remaining ? `?${remaining}` : "") + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);

        if ((!expectedState || !state || expectedState === state) && codeVerifier) {
          const exRes = await fetch(`${AUTH_API_URL}/exchange`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code,
              client_id: CLIENT_ID,
              redirect_uri: window.location.origin,
              code_verifier: codeVerifier
            })
          });
          const exData = await exRes.json().catch(() => ({}));
          if (exRes.ok && exData.custom_token) {
            try { sessionStorage.removeItem(SILENT_SSO_KEY); } catch (_) {}
            await this.#completeFirebaseCustomToken(exData.custom_token, exData.session_id || null);
          }
        }
      } else if (
        hasWindow &&
        !this.isAuthenticated() &&
        (window.location.hostname === "lanzar.me" || window.location.hostname.endsWith(".lanzar.me")) &&
        typeof sessionStorage !== "undefined" &&
        !sessionStorage.getItem(SILENT_SSO_KEY)
      ) {
        sessionStorage.setItem(SILENT_SSO_KEY, "1");
        try {
          const ssoRes = await fetch(`${AUTH_API_URL}/api/id/session/token`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "X-Lanzar-Client": "id"
            },
            body: JSON.stringify({ clientApp: CLIENT_ID })
          });
          if (ssoRes.ok) {
            const ssoData = await ssoRes.json().catch(() => ({}));
            if (ssoData.customToken) {
              await this.#completeFirebaseCustomToken(ssoData.customToken, ssoData.sessionId || null);
            }
          }
        } catch (_) {}
      }

      const headers = this.getAuthHeaders();
      const res = await fetch('/api/auth/me', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.user && data.user.authenticated) {
          this.#currentUser = {
            ...this.#currentUser,
            ...data.user
          };
          this.#saveSession(this.#currentUser);
        } else if (!this.#currentUser || this.#currentUser.isGuest) {
          this.#currentUser = {
            uid: data.user.uid || 'user_default',
            displayName: data.user.displayName || 'Guest Pilot',
            email: data.user.email || '',
            photoURL: '',
            authenticated: false,
            isGuest: true,
            token: ''
          };
        }
      }
    } catch (err) {
      console.warn("[AuthService] Failed to verify session with backend:", err);
    }

    this.#isInitialized = true;
    globalBus.emit("auth:initialized", { user: this.#currentUser });
    return this.#currentUser;
  }

  async loginWithLanzarId(mode = "login") {
    if (typeof window === "undefined") return "";
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const state = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : generateCodeVerifier();

    try {
      sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
      sessionStorage.setItem(PKCE_STATE_KEY, state);
    } catch (_) {}

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: window.location.origin,
      code_challenge: challenge,
      code_challenge_method: "S256",
      state
    });
    if (mode === "register") {
      params.set("mode", "register");
    }
    const targetUrl = `${AUTH_HUB_URL}?${params.toString()}`;
    window.location.href = targetUrl;
    return targetUrl;
  }

  // =====================================
  // Session Accessors
  // =====================================

  getUser() {
    return this.#currentUser;
  }

  getUid() {
    return this.#currentUser ? this.#currentUser.uid : 'user_default';
  }

  isAuthenticated() {
    return Boolean(this.#currentUser && this.#currentUser.authenticated && !this.#currentUser.isGuest);
  }

  getAuthHeaders() {
    if (this.#currentUser && this.#currentUser.token) {
      return { 'Authorization': `Bearer ${this.#currentUser.token}` };
    }
    return {};
  }

  // =====================================
  // Authentication Actions
  // =====================================

  /**
   * Logs in using a verified session or test/dev identity.
   * @param {string} userId
   * @param {string} displayName
   * @param {string} [email]
   * @returns {Object}
   */
  signInWithIdentity(userId, displayName, email = '') {
    if (!isLocalDevHost()) {
      throw new Error('Development identity switching is strictly restricted to localhost.');
    }
    const user = {
      uid: userId,
      displayName: displayName || userId,
      email: email || `${userId}@lanzar.me`,
      photoURL: '',
      authenticated: true,
      isGuest: false,
      token: userId,
      lastLogin: new Date().toISOString()
    };

    this.#saveSession(user);
    Analytics.track("Auth", "Login", { uid: user.uid, method: "identity" });
    globalBus.emit("auth:changed", { user: this.#currentUser });
    return user;
  }

  /**
   * Signs out the user, revokes central LANZAR ID session if active, and restores guest session.
   */
  async signOut() {
    const prevUid = this.getUid();
    const prevToken = this.#currentUser?.token || '';
    const sessionId = this.#currentUser?.sessionId ||
      (typeof sessionStorage !== "undefined" ? sessionStorage.getItem(LANZAR_SESSION_ID_KEY) : null);

    try {
      if (sessionId && prevToken && !/^(test_|user_|mock_)/.test(prevToken)) {
        await fetch(`${AUTH_API_URL}/api/id/sessions/${encodeURIComponent(sessionId)}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${prevToken}` }
        }).catch(() => {});
      }
      await fetch(`${AUTH_API_URL}/api/id/session/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Lanzar-Client': 'id'
        }
      }).catch(() => {});
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem(LANZAR_SESSION_ID_KEY);
      }
    } catch (_) {}

    this.#currentUser = {
      uid: 'user_default',
      displayName: 'Guest Pilot',
      email: '',
      photoURL: '',
      authenticated: false,
      isGuest: true,
      token: ''
    };
    this.#saveSession(null);

    Analytics.track("Auth", "Logout", { prevUid });
    globalBus.emit("auth:changed", { user: this.#currentUser });
  }
}

export const authService = new AuthService();
