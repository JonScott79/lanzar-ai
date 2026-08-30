# ============================================================
# LANZAR Resume Bootstrap
# Creates project structure, initializes Vite, Git and backend
# ============================================================

$ErrorActionPreference = "Stop"

$Root = "C:\Projects\LANZAR\resume"

Write-Host "Creating project..."

New-Item -ItemType Directory -Force -Path `
$Root, `
"$Root\frontend", `
"$Root\backend", `
"$Root\database", `
"$Root\database\schema", `
"$Root\database\migrations", `
"$Root\database\seed", `
"$Root\docs", `
"$Root\.github", `
"$Root\.github\workflows", `
"$Root\backend\api", `
"$Root\backend\routes", `
"$Root\backend\models", `
"$Root\backend\middleware", `
"$Root\backend\services", `
"$Root\backend\config", `
"$Root\backend\uploads" | Out-Null

@"
# LANZAR Resume

## One Resume. Always Current.

A professional identity platform that allows users to maintain one canonical resume and profile.

Future:
- Recruiter integrations
- Certification verification
- Resume Builder integrations
- ATS integrations
"@ | Set-Content "$Root\README.md"

@"
MIT License

Copyright (c) 2026 LANZAR

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software...
"@ | Set-Content "$Root\LICENSE"

@"
node_modules/
dist/
build/
coverage/

.env
.env.*

.vscode/
.idea/

.firebase/

backend/uploads/

Thumbs.db
.DS_Store
"@ | Set-Content "$Root\.gitignore"

@'
{
  "name":"lanzar-resume",
  "private":true,
  "version":"0.1.0",
  "workspaces":[
    "frontend",
    "backend"
  ]
}
'@ | Set-Content "$Root\package.json"

@'
{
  "name":"lanzar-resume-backend",
  "version":"0.1.0",
  "main":"server.js",
  "scripts":{
    "start":"node server.js",
    "dev":"nodemon server.js"
  }
}
'@ | Set-Content "$Root\backend\package.json"

@'
const express=require("express");
const cors=require("cors");

const app=express();

app.use(cors());
app.use(express.json());

app.get("/health",(req,res)=>{
    res.json({
        status:"ok",
        service:"LANZAR Resume"
    });
});

const PORT=process.env.PORT||3001;

app.listen(PORT,()=>{
    console.log(`Server running on ${PORT}`);
});
'@ | Set-Content "$Root\backend\server.js"

"# Architecture" | Set-Content "$Root\docs\architecture.md"
"# Roadmap" | Set-Content "$Root\docs\roadmap.md"
"# Database" | Set-Content "$Root\docs\database.md"
"# Branding" | Set-Content "$Root\docs\branding.md"
"# Future Ideas" | Set-Content "$Root\docs\future.md"

if(!(Get-Command git -ErrorAction SilentlyContinue)){
    winget install --id Git.Git -e
}

if(!(Get-Command node -ErrorAction SilentlyContinue)){
    winget install --id OpenJS.NodeJS.LTS -e
}

Set-Location $Root

if(!(Test-Path "$Root\frontend\package.json")){
    npm create vite@latest frontend -- --template react
}

Set-Location "$Root\frontend"

npm install
npm install react-router-dom axios firebase

Set-Location "$Root\backend"

npm install express cors dotenv firebase-admin multer nodemon

Set-Location $Root

if(!(Test-Path "$Root\.git")){
    git init
}

git branch -M main

try {
    git remote remove origin
} catch {}

git remote add origin https://github.com/JonScott79/lanzar.resume.git

git add .

git commit -m "Initial LANZAR Resume project"

Write-Host ""
Write-Host "========================================"
Write-Host "Bootstrap Complete!"
Write-Host "========================================"
Write-Host ""
Write-Host "To push:"
Write-Host "git push -u origin main"
