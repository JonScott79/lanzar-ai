const fs = require('fs');
let code = fs.readFileSync('C:/Projects/LANZAR/tickets/website/frontend/src/App.jsx', 'utf8');

// 1. Add imports
code = code.replace(
  "import { onAuthStateChanged } from 'firebase/auth'",
  "import { onAuthStateChanged } from 'firebase/auth'\nimport { generateRandomString, generateCodeChallenge } from './pkce.js'"
);
code = code.replace(
  "import { auth, signInWithEmail, sendPasswordReset, signInWithGoogle, signOutUser } from './firebase/auth.js'",
  "import { auth, signInWithEmail, sendPasswordReset, signInWithGoogle, signOutUser, signInWithCustomToken } from './firebase/auth.js'"
);

// 2. Add Exchange Logic
const exchangeLogic = `
  const authBackendUrl = window.location.hostname === 'localhost' ? 'http://localhost:4001' : 'https://auth-api.lanzar.me';
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      setIsLoading(true);
      const storedState = sessionStorage.getItem('pkce_state');
      const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

      if (state !== storedState) {
        setAuthError('Authentication state mismatch.');
        setIsLoading(false);
      } else {
        fetch(authBackendUrl + '/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              code,
              client_id: 'tickets',
              redirect_uri: window.location.origin + window.location.pathname,
              code_verifier: codeVerifier
          })
        })
        .then(res => res.json().then(data => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          if (!ok) throw new Error(data.error_description || data.error || 'Exchange failed');
          return signInWithCustomToken(data.custom_token);
        })
        .then(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          sessionStorage.removeItem('pkce_state');
          sessionStorage.removeItem('pkce_code_verifier');
        })
        .catch(err => {
          console.error('[AUTH] Exchange Error:', err);
          setAuthError('Failed to login via Auth Hub.');
          setIsLoading(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        });
      }
    }
  }, []);
`;

code = code.replace(
  "useEffect(() => {",
  exchangeLogic + "\n  useEffect(() => {"
);

// 3. Update the login UI function to trigger Auth Hub
const loginFn = `
  const initiateAuthHubLogin = async () => {
    setIsLoading(true);
    setAuthError(null);
    const state = generateRandomString();
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    sessionStorage.setItem('pkce_state', state);
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);

    const redirectUri = window.location.origin + window.location.pathname;
    const authHubUrl = 'https://auth.lanzar.me';
    const authUrlBase = window.location.hostname === 'localhost' ? 'http://localhost:4000' : authHubUrl;

    const authUrl = \`\${authUrlBase}?client_id=tickets&redirect_uri=\${encodeURIComponent(redirectUri)}&state=\${state}&code_challenge=\${codeChallenge}&code_challenge_method=S256\`;
    window.location.href = authUrl;
  }
`;

code = code.replace(
  "const handleEmailSignIn = async (e) => {",
  loginFn + "\n  const handleEmailSignIn = async (e) => {"
);

// 4. Replace the rendered Login form with a single button
code = code.replace(
  /<form onSubmit=\{handleEmailSignIn\}[\s\S]*?<\/form>/g,
  `
    <div style={{ textAlign: 'center', margin: '2rem 0' }}>
      <button 
        type="button" 
        className="primary-action-button" 
        onClick={initiateAuthHubLogin}
        disabled={isLoading}
        style={{ padding: '1rem 2rem', fontSize: '1.2rem', cursor: 'pointer' }}
      >
        {isLoading ? 'REDIRECTING...' : 'SIGN IN WITH LANZAR ID'}
      </button>
    </div>
  `
);

fs.writeFileSync('C:/Projects/LANZAR/tickets/website/frontend/src/App.jsx', code, 'utf8');
console.log('App.jsx patched successfully.');
