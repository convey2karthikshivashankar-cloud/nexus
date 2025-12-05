# Agent Hooks Setup Guide for Nexus Blueprint 3.0

## Quick Start

1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Type "Open Kiro Hook UI"
3. Click "Create New Hook"
4. Follow the configurations below

---

## Hook 1: Schema Validation on Save

**Purpose:** Automatically validate schema files when saved

### Configuration
```yaml
Name: Auto-validate Schemas
Description: Validates JSON schema syntax and structure on save
Trigger: On file save
File Pattern: schemas/**/*.json
Action Type: Execute shell command
Command: node scripts/validate-schema.js "{filePath}"
Enabled: true
```

### Supporting Script

Create `scripts/validate-schema.js`:
```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const schemaPath = process.argv[2];

if (!schemaPath) {
  console.error('❌ No schema path provided');
  process.exit(1);
}

try {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const schema = JSON.parse(schemaContent);
  
  // Validate JSON Schema structure
  if (!schema.$schema) {
    console.warn('⚠️  Missing $schema property');
  }
  
  if (!schema.type) {
    console.error('❌ Missing type property');
    process.exit(1);
  }
  
  if (!schema.properties) {
    console.warn('⚠️  No properties defined');
  }
  
  console.log('✅ Schema valid:', path.basename(schemaPath));
  console.log('   Type:', schema.type);
  console.log('   Properties:', Object.keys(schema.properties || {}).length);
  
} catch (error) {
  console.error('❌ Schema validation failed:', error.message);
  process.exit(1);
}
```

Make it executable:
```bash
chmod +x scripts/validate-schema.js
```

---

## Hook 2: Policy Check on Save

**Purpose:** Run policy validation when TypeScript files are saved

### Configuration
```yaml
Name: Policy Validation Check
Description: Runs OPA policy checks on TypeScript file changes
Trigger: On file save
File Pattern: packages/**/*.ts
Action Type: Execute shell command
Command: npm run policy:check:file "{filePath}"
Enabled: true
```

### Supporting Script

Add to `package.json`:
```json
{
  "scripts": {
    "policy:check:file": "node scripts/check-policy-for-file.js"
  }
}
```

Create `scripts/check-policy-for-file.js`:
```javascript
#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

const filePath = process.argv[2];

if (!filePath) {
  console.log('ℹ️  No file specified, skipping policy check');
  process.exit(0);
}

// Skip test files
if (filePath.includes('__tests__') || filePath.includes('.test.')) {
  console.log('ℹ️  Test file, skipping policy check');
  process.exit(0);
}

try {
  console.log('🔍 Running policy check...');
  execSync('npm run policy:check', { stdio: 'inherit' });
  console.log('✅ Policy check passed');
} catch (error) {
  console.error('❌ Policy violations detected');
  console.error('   Run: npm run policy:check for details');
  // Don't exit with error - just warn
  process.exit(0);
}
```

---

## Hook 3: Auto-run Related Tests

**Purpose:** Run tests related to the file you just saved

### Configuration
```yaml
Name: Auto-run Related Tests
Description: Runs tests for the file being saved
Trigger: On file save
File Pattern: packages/**/src/**/*.ts
Action Type: Execute shell command
Command: npm test -- --findRelatedTests "{filePath}" --bail
Enabled: true
```

### Notes
- Automatically finds and runs related tests
- Stops on first failure (--bail)
- Skip if no tests found
- Fast feedback loop

---

## Hook 4: Task Status Reminder

**Purpose:** Remind to update task status after completing work

### Configuration
```yaml
Name: Task Status Reminder
Description: Reminds to update tasks.md after agent execution
Trigger: On agent execution complete
Action Type: Send message to agent
Message: |
  ✅ Task complete! Don't forget to:
  1. Update task status in .kiro/specs/nexus-blueprint-3.0/tasks.md
  2. Run tests: npm test
  3. Commit changes: git add . && git commit -m "..."
Enabled: true
```

---

## Hook 5: Pre-commit Validation (Git Hook)

**Purpose:** Run comprehensive checks before allowing commits

### Configuration

This is a Git hook, not a Kiro hook. Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
set -e

echo "🔍 Running pre-commit checks..."

# 1. Validate all schemas
echo "📝 Validating schemas..."
for schema in schemas/*.json; do
  if [ -f "$schema" ]; then
    node scripts/validate-schema.js "$schema" || exit 1
  fi
done

# 2. Policy validation
echo "📋 Checking policies..."
npm run policy:check || exit 1

# 3. Run tests for staged files
echo "🧪 Running tests..."
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.ts$' | grep -v '\.test\.ts$' || true)
if [ -n "$STAGED_FILES" ]; then
  npm test -- --findRelatedTests $STAGED_FILES --bail || exit 1
fi

# 4. Lint check
echo "✨ Linting..."
npm run lint --quiet || exit 1

echo "✅ All pre-commit checks passed!"
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

---

## Testing Your Hooks

### Test Hook 1: Schema Validation
```bash
# Edit a schema file
echo '{"invalid json}' > schemas/TestSchema.json
# Save the file in your editor
# You should see validation error in Kiro output
```

### Test Hook 2: Policy Check
```bash
# Edit a TypeScript file
# Add a direct service call (policy violation)
# Save the file
# You should see policy warning
```

### Test Hook 3: Auto-run Tests
```bash
# Edit an implementation file
# Save it
# Related tests should run automatically
```

### Test Hook 4: Task Reminder
```bash
# Complete a task using Kiro
# You should see reminder message
```

### Test Hook 5: Pre-commit
```bash
# Stage some changes
git add .
# Try to commit
git commit -m "test"
# All checks should run
```

---

## Troubleshooting

### Hook Not Triggering

1. Check file pattern matches your file
2. Verify hook is enabled in Kiro Hook UI
3. Check Kiro output panel for errors

### Script Errors

1. Verify script has execute permissions: `chmod +x scripts/*.js`
2. Check Node.js is in PATH: `which node`
3. Verify npm packages installed: `npm install`

### Performance Issues

If hooks are slow:
1. Disable auto-test hook for large files
2. Use `--bail` flag to stop on first failure
3. Consider running full tests only on commit

---

## Customization

### Disable Hooks Temporarily

In Kiro Hook UI:
- Toggle "Enabled" checkbox
- Or set file pattern to match nothing: `__never_match__`

### Adjust File Patterns

Common patterns:
- All TypeScript: `**/*.ts`
- Source only: `packages/**/src/**/*.ts`
- Exclude tests: `packages/**/src/**/!(*.test).ts`
- Specific package: `packages/command-service/**/*.ts`

### Add More Hooks

Ideas for additional hooks:
- **Documentation Update**: Remind to update docs when API changes
- **Dependency Check**: Warn about new dependencies
- **Performance Check**: Run benchmarks on critical paths
- **Security Scan**: Check for security issues

---

## Best Practices

1. **Keep hooks fast** - Under 5 seconds for save hooks
2. **Provide clear feedback** - Use emojis and clear messages
3. **Don't block work** - Warnings are better than errors for save hooks
4. **Test hooks thoroughly** - Ensure they work in all scenarios
5. **Document custom hooks** - Help team understand what they do

---

## Next Steps

1. ✅ Create all 4 Kiro hooks
2. ✅ Create supporting scripts
3. ✅ Set up Git pre-commit hook
4. ✅ Test each hook
5. ✅ Document for team
6. ✅ Iterate based on feedback

Ready to set up? Start with Hook 1 (Schema Validation) - it's the easiest and most impactful!
