# Deploy and push script for foto-segundo (PowerShell)
# This script assumes the Vercel CLI is installed and you are logged in.
# Set working directory to project root
Set-Location 'C:\foto-segundo'

Write-Host "Installing dependencies..."
# Frontend dependencies
Set-Location 'frontend'
if (Test-Path package-lock.json) { npm ci } else { npm install }
Set-Location '..'
# Backend dependencies
Set-Location 'backend'
if (Test-Path package-lock.json) { npm ci } else { npm install }
Set-Location '..'

Write-Host "Running lint and tests..."
# Frontend lint & tests
Set-Location 'frontend'
npm run lint
npm test
Set-Location '..'
# Backend lint & tests
Set-Location 'backend'
npm run lint
npm test
Set-Location '..'

Write-Host "Building frontend..."
Set-Location 'frontend'
npm run build
Set-Location '..'

Write-Host "Committing any pending changes..."
# Add all changes
git add .
# Commit only if there are staged changes
if (-not (git diff --cached --quiet)) {
    $date = Get-Date -Format u
    git commit -m "Deploy: build and push $date"
} else {
    Write-Host "No changes to commit."
}

Write-Host "Pushing to remote..."
# Ensure remote and branch are set (default: origin main)
$remote = "origin"
$branch = "main"
git push $remote $branch

Write-Host "Triggering Vercel deployment..."
vercel --prod --confirm
