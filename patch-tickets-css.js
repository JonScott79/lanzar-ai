const fs = require('fs');
let code = fs.readFileSync('C:/Projects/LANZAR/tickets/website/frontend/src/App.jsx', 'utf8');

code = code.replace(
  /<div style=\{\{\s*textAlign:\s*'center',\s*margin:\s*'2rem 0'\s*\}\}>[\s\S]*?<\/div>/g,
  `
    <div className="signin-form" style={{ alignItems: 'center' }}>
      <button 
        type="button" 
        className="google-signin-button" 
        onClick={initiateAuthHubLogin}
        disabled={isLoading}
      >
        {isLoading ? 'REDIRECTING...' : 'SIGN IN WITH LANZAR ID'}
      </button>
    </div>
  `
);

fs.writeFileSync('C:/Projects/LANZAR/tickets/website/frontend/src/App.jsx', code, 'utf8');
