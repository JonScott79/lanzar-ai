const fs = require('fs');
const path = require('path');

// 1. Patch pythos/index.html
const htmlPath = path.resolve(__dirname, '../pythos/index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const targetPasswordGroup = `        <div>
          <label for="lanzarPasswordInput" style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Password (min. 8 characters)</label>
          <input type="password" id="lanzarPasswordInput" class="check-input" placeholder="••••••••" autocomplete="current-password" data-clarity-mask="true" />
        </div>`.replace(/\r?\n/g, '\r\n');

const newPasswordGroup = `        <div>
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <label for="lanzarPasswordInput" style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin: 0;">Password (min. 8 characters)</label>
            <button type="button" id="lanzarForgotPasswordBtn" style="background: none; border: none; padding: 0; color: var(--primary-color, #f97316); text-decoration: underline; font-size: 0.75rem; cursor: pointer; font-family: inherit;" aria-label="Forgot Password?">Forgot Password?</button>
          </div>
          <input type="password" id="lanzarPasswordInput" class="check-input" placeholder="••••••••" autocomplete="current-password" data-clarity-mask="true" />
        </div>

        <div style="display: flex; align-items: center; gap: 8px; margin: 2px 0;">
          <hr style="flex: 1; border: none; border-top: 1px solid var(--border-color, rgba(255,255,255,0.1));" />
          <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Or</span>
          <hr style="flex: 1; border: none; border-top: 1px solid var(--border-color, rgba(255,255,255,0.1));" />
        </div>

        <button type="button" id="lanzarOpenCentralHubBtn" class="tool-btn" style="width: 100%; justify-content: center; gap: 8px; font-weight: 600; font-size: 0.82rem; padding: 8px 12px; background: rgba(255,255,255,0.06); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; color: var(--text-main);">
          <span>🌐 Continue with Central LANZAR ID Hub</span>
        </button>`.replace(/\r?\n/g, '\r\n');

if (!html.includes(targetPasswordGroup)) {
  console.error('Target password group not found in pythos/index.html!');
  process.exit(1);
}

html = html.replace(targetPasswordGroup, newPasswordGroup);
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✓ Successfully patched pythos/index.html with Forgot Password and Central Hub buttons');

// 2. Patch pythos/app.js to hook up the Forgot Password button & Central Hub button
const appJsPath = path.resolve(__dirname, '../pythos/app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');

// Add sendPasswordResetEmail to dynamic Firebase imports
const targetAuthImport = `    signOut = authMod.signOut;\r\n`;
const newAuthImport = `    signOut = authMod.signOut;\r\n    sendPasswordResetEmail = authMod.sendPasswordResetEmail;\r\n`;

if (appJs.includes(targetAuthImport) && !appJs.includes('sendPasswordResetEmail = authMod.sendPasswordResetEmail;')) {
  appJs = appJs.replace(targetAuthImport, newAuthImport);
  console.log('✓ Added sendPasswordResetEmail to ensureFirebaseInitialized');
}

// Add declaration of sendPasswordResetEmail
const targetSignOutDecl = `let signOut = null;\r\n`;
const newSignOutDecl = `let signOut = null;\r\nlet sendPasswordResetEmail = null;\r\n`;
if (appJs.includes(targetSignOutDecl) && !appJs.includes('let sendPasswordResetEmail = null;')) {
  appJs = appJs.replace(targetSignOutDecl, newSignOutDecl);
  console.log('✓ Added let sendPasswordResetEmail = null declaration');
}

// Add event handlers for lanzarForgotPasswordBtn & lanzarOpenCentralHubBtn
const targetSubmitHandler = `if (lanzarSubmitBtn) {\r\n`;
const newHandlers = `const lanzarForgotPasswordBtn = document.getElementById("lanzarForgotPasswordBtn");
if (lanzarForgotPasswordBtn) {
  lanzarForgotPasswordBtn.addEventListener("click", async () => {
    const email = (lanzarEmailInput && lanzarEmailInput.value) ? lanzarEmailInput.value.trim() : "";
    if (!email) {
      if (lanzarAuthStatusMsg) {
        lanzarAuthStatusMsg.style.display = "block";
        lanzarAuthStatusMsg.style.color = "#f97316";
        lanzarAuthStatusMsg.textContent = "Please enter your email address above, then click 'Forgot Password?' to receive a reset link.";
      }
      if (lanzarEmailInput) lanzarEmailInput.focus();
      return;
    }

    try {
      if (lanzarAuthStatusMsg) {
        lanzarAuthStatusMsg.style.display = "block";
        lanzarAuthStatusMsg.style.color = "var(--text-muted)";
        lanzarAuthStatusMsg.textContent = "Sending password reset instructions...";
      }

      await ensureFirebaseInitialized();
      if (typeof sendPasswordResetEmail === "function" && auth) {
        await sendPasswordResetEmail(auth, email);
      } else {
        window.location.href = "https://auth.lanzar.me?view=reset&email=" + encodeURIComponent(email);
        return;
      }

      if (lanzarAuthStatusMsg) {
        lanzarAuthStatusMsg.style.display = "block";
        lanzarAuthStatusMsg.style.color = "#10b981";
        lanzarAuthStatusMsg.textContent = "A password reset link has been dispatched to " + email + ". Check your inbox.";
      }
    } catch (err) {
      console.warn("[AUTH] In-app reset fallback to Central Auth:", err);
      window.location.href = "https://auth.lanzar.me?view=reset&email=" + encodeURIComponent(email);
    }
  });
}

const lanzarOpenCentralHubBtn = document.getElementById("lanzarOpenCentralHubBtn");
if (lanzarOpenCentralHubBtn) {
  lanzarOpenCentralHubBtn.addEventListener("click", () => {
    const redirectUri = encodeURIComponent(window.location.origin);
    const authHubUrl = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:3000"
      : "https://auth.lanzar.me";
    window.location.href = authHubUrl + "?client_id=pythos&redirect_uri=" + redirectUri;
  });
}

if (lanzarSubmitBtn) {\r\n`.replace(/\r?\n/g, '\r\n');

if (appJs.includes(targetSubmitHandler)) {
  appJs = appJs.replace(targetSubmitHandler, newHandlers);
  fs.writeFileSync(appJsPath, appJs, 'utf8');
  console.log('✓ Successfully attached handlers for Forgot Password and Central Hub');
} else {
  console.error('Target submit handler not found in app.js!');
  process.exit(1);
}
