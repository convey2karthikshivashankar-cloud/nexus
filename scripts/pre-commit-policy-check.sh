#!/bin/bash

###############################################################################
# Pre-commit Policy Check
# 
# This script runs OPA policy validation before allowing commits.
# It ensures that code changes comply with architectural policies.
#
# To install: ln -s ../../scripts/pre-commit-policy-check.sh .git/hooks/pre-commit
###############################################################################

set -e

echo "🔍 Running pre-commit policy checks..."
echo ""

# Check if OPA is installed
if ! command -v opa &> /dev/null; then
    echo "❌ OPA is not installed. Please install it:"
    echo "   curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64"
    echo "   chmod +x opa && sudo mv opa /usr/local/bin/"
    exit 1
fi

# Run OPA policy tests
echo "📋 Running OPA policy tests..."
if opa test policies/ -v; then
    echo "✅ OPA policy tests passed"
else
    echo "❌ OPA policy tests failed"
    exit 1
fi

echo ""

# Check for Event Store mutations
echo "🔒 Checking Event Store immutability..."
if git diff --cached --name-only | xargs grep -l "UPDATE.*EventStore\|DELETE.*EventStore" 2>/dev/null; then
    echo "❌ Event Store mutation detected in staged files!"
    echo "   Only INSERT operations are allowed on EventStore table."
    exit 1
else
    echo "✅ Event Store immutability verified"
fi

echo ""

# Check for missing schemas
echo "📝 Checking schema registration..."
MISSING_SCHEMAS=()
EVENT_TYPES=$(git diff --cached --name-only | xargs grep -h "eventType:" 2>/dev/null | grep -oP "eventType:\s*['\"]\\K[^'\"]+")

for event in $EVENT_TYPES; do
    if [ ! -f "schemas/${event}.json" ]; then
        MISSING_SCHEMAS+=("$event")
    fi
done

if [ ${#MISSING_SCHEMAS[@]} -gt 0 ]; then
    echo "❌ Missing schemas for events: ${MISSING_SCHEMAS[*]}"
    echo "   Please create schema files in schemas/ directory"
    exit 1
else
    echo "✅ All events have registered schemas"
fi

echo ""

# Check for direct service calls
echo "🔗 Checking service decoupling..."
if git diff --cached --name-only | xargs grep -l "axios.*query-dashboard\|fetch.*command-service" 2>/dev/null; then
    echo "❌ Direct service-to-service HTTP calls detected!"
    echo "   Services must communicate via Event Bus only."
    exit 1
else
    echo "✅ Service decoupling verified"
fi

echo ""
echo "========================================="
echo "✅ All policy checks passed!"
echo "========================================="
echo ""

exit 0
