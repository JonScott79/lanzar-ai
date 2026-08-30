const fs = require('fs');
let css = fs.readFileSync('C:/Projects/LANZAR/tickets/website/frontend/src/index.css', 'utf8');

const replacementCss = `
/* ==========================================================
   Admin Dialogue Bubble Fix
   ========================================================== */
.stella-dialogue.admin-dialogue {
  width: 110%;
  max-width: 850px;
  margin-left: auto;
  margin-right: -60px;
  margin-top: -10px;
  transform: translateY(-20px);
}
.stella-dialogue.admin-dialogue .stella-dialogue-content {
  min-height: 280px;
  /* Moved UP and to the LEFT */
  padding: 45px 140px 65px 90px;
}
.stella-dialogue.admin-dialogue .stella-greeting {
  font-size: 3.2rem;
  text-align: center;
  margin-bottom: 5px;
}
.stella-dialogue.admin-dialogue .stella-question {
  font-size: 1.55rem;
  text-align: center;
  /* Force it into 2 lines */
  max-width: 320px;
  margin: 0 auto;
  line-height: 1.3;
}
@media (max-width: 1100px) {
  .stella-dialogue.admin-dialogue {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
  }
}
@media (max-width: 850px) {
  .stella-dialogue.admin-dialogue {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
    transform: translateY(-40px);
  }
  .stella-dialogue.admin-dialogue .stella-dialogue-content {
    padding: 52px 70px 52px 80px;
  }
}
`;

css = css.replace(/\/\* ==========================================================\s*Admin Dialogue Bubble Fix\s*========================================================== \*\/[\s\S]*?(?=\/\*|$)/, replacementCss);

fs.writeFileSync('C:/Projects/LANZAR/tickets/website/frontend/src/index.css', css, 'utf8');
