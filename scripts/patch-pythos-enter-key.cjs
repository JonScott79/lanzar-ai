const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../pythos/app.js');
let content = fs.readFileSync(filePath, 'utf8');

const target = `if (lanzarSubmitBtn) {
  lanzarSubmitBtn.addEventListener("click", async () => {`.replace(/\r?\n/g, '\r\n');

const addition = `function handleLanzarInputKeydown(e) {
  if (e.key === "Enter" || e.keyCode === 13) {
    e.preventDefault();
    if (lanzarSubmitBtn) {
      lanzarSubmitBtn.click();
    }
  }
}
if (lanzarEmailInput) lanzarEmailInput.addEventListener("keydown", handleLanzarInputKeydown);
if (lanzarPasswordInput) lanzarPasswordInput.addEventListener("keydown", handleLanzarInputKeydown);
if (lanzarDisplayNameInput) lanzarDisplayNameInput.addEventListener("keydown", handleLanzarInputKeydown);

`.replace(/\r?\n/g, '\r\n');

if (!content.includes(target)) {
  console.error('Target not found in app.js!');
  process.exit(1);
}

content = content.replace(target, addition + target);
fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Successfully attached Enter keydown listener to Pythos auth inputs');
