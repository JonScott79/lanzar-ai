const fs = require('fs');
let css = fs.readFileSync('C:/Projects/LANZAR/tickets/website/frontend/src/index.css', 'utf8');

const replacementCss = `
/* ==========================================================
   Admin Dialogue Bubble Fix
   ========================================================== */
.stella-dialogue.admin-dialogue {
  width: 100%;
  max-width: 550px;
  margin-left: auto;
  margin-right: -30px;
  margin-top: 20px;
  transform: translateY(-20px);
}
.stella-dialogue.admin-dialogue .stella-dialogue-content {
  min-height: 230px;
  padding: 65px 70px 20px 75px;
}
.stella-dialogue.admin-dialogue .stella-greeting {
  font-size: 2.8rem;
  text-align: center;
  margin-bottom: 5px;
}
.stella-dialogue.admin-dialogue .stella-question {
  font-size: 1.15rem;
  text-align: center;
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
