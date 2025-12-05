# Nexus Blueprint 3.0 Demo UI - Quick Start Script (PowerShell)
# This script sets up and launches the VC-pitch demo UI

$ErrorActionPreference = "Stop"

Write-Host "🚀 Nexus Blueprint 3.0 - Demo UI Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    Write-Host "   Visit: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check Node.js version
$versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($versionNumber -lt 18) {
    Write-Host "❌ Node.js version 18 or higher is required. Current version: $nodeVersion" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if npm is installed
try {
    $npmVersion = npm -v
    Write-Host "✅ npm $npmVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
    Write-Host ""
}

# Check if build exists
if (-not (Test-Path "dist")) {
    Write-Host "🔨 Building application for first time..." -ForegroundColor Yellow
    npm run build
    Write-Host "✅ Build complete" -ForegroundColor Green
    Write-Host ""
}

Write-Host "🎬 Starting demo UI..." -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Demo UI will be available at: http://localhost:3000" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Demo Features:" -ForegroundColor Yellow
Write-Host "  • Live Dashboard - Real-time system metrics"
Write-Host "  • Performance Demo - Automated performance testing"
Write-Host "  • Architecture View - Interactive system diagram"
Write-Host "  • Governance Dashboard - Policy enforcement monitoring"
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "  • Auto-play mode cycles through views every 15 seconds"
Write-Host "  • Click 'Pause Demo' to explore manually"
Write-Host "  • Hover over components for details"
Write-Host "  • Click architecture components for deep-dive"
Write-Host ""
Write-Host "🎯 Perfect for:" -ForegroundColor Yellow
Write-Host "  • VC pitches"
Write-Host "  • Technical demos"
Write-Host "  • Architecture reviews"
Write-Host "  • Stakeholder presentations"
Write-Host ""
Write-Host "Press Ctrl+C to stop the demo" -ForegroundColor Gray
Write-Host ""

# Start the development server
npm run dev
