const fs = require('fs');
let code = fs.readFileSync('C:/Projects/LANZAR/tickets/website/frontend/src/App.jsx', 'utf8');

// Replace both the reset form and the signin form completely with the new button
code = code.replace(
  /\{resetMode \? \([\s\S]*?<\/svg>[\s\S]*?SIGN IN WITH GOOGLE[\s\S]*?<\/button>[\s\S]*?<\/form>[\s\S]*?\)\}/g,
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
