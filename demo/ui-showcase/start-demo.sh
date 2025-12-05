#!/bin/bash

# Nexus Blueprint 3.0 Demo UI - Quick Start Script
# This script sets up and launches the VC-pitch demo UI

set -e

echo "🚀 Nexus Blueprint 3.0 - Demo UI Setup"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
else
    echo "✅ Dependencies already installed"
    echo ""
fi

# Check if build exists
if [ ! -d "dist" ]; then
    echo "🔨 Building application for first time..."
    npm run build
    echo "✅ Build complete"
    echo ""
fi

echo "🎬 Starting demo UI..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Demo UI will be available at: http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Demo Features:"
echo "  • Live Dashboard - Real-time system metrics"
echo "  • Performance Demo - Automated performance testing"
echo "  • Architecture View - Interactive system diagram"
echo "  • Governance Dashboard - Policy enforcement monitoring"
echo ""
echo "💡 Tips:"
echo "  • Auto-play mode cycles through views every 15 seconds"
echo "  • Click 'Pause Demo' to explore manually"
echo "  • Hover over components for details"
echo "  • Click architecture components for deep-dive"
echo ""
echo "🎯 Perfect for:"
echo "  • VC pitches"
echo "  • Technical demos"
echo "  • Architecture reviews"
echo "  • Stakeholder presentations"
echo ""
echo "Press Ctrl+C to stop the demo"
echo ""

# Start the development server
npm run dev
