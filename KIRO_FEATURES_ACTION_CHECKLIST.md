# 🚀 Kiro Advanced Features - Action Checklist

## ✅ Immediate Actions (Next 30 Minutes)

### 1. Enable Codebase Indexing
- [ ] In Kiro chat, type a message using `#Codebase`
- [ ] Test with: "Using #Codebase, show me all EventStore implementations"
- [ ] Verify you get semantic search results
- [ ] **Time:** 2 minutes
- [ ] **Impact:** Instant search improvement

### 2. Create First Agent Hook (Schema Validation)
- [ ] Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
- [ ] Type "Open Kiro Hook UI"
- [ ] Click "Create New Hook"
- [ ] Configure:
  - Name: `Auto-validate Schemas`
  - Trigger: `On file save`
  - File Pattern: `schemas/**/*.json`
  - Command: `node scripts/validate-schema.js "{filePath}"`
- [ ] Create `scripts/validate-schema.js` (see `.kiro/hooks/SETUP_GUIDE.md`)
- [ ] Test by editing and saving a schema file
- [ ] **Time:** 15 minutes
- [ ] **Impact:** Immediate schema validation feedback

### 3. Test Git Diff Context
- [ ] Make a small change to any file
- [ ] In Kiro chat, use `#Git Diff` context
- [ ] Ask: "Review my changes and suggest improvements"
- [ ] Verify Kiro sees your changes
- [ ] **Time:** 3 minutes
- [ ] **Impact:** Better change review workflow

---

## 📋 Today's Tasks (Next 2 Hours)

### 4. Create Remaining Agent Hooks
- [ ] **Hook 2: Policy Check on Save**
  - File Pattern: `packages/**/*.ts`
  - Command: `npm run policy:check:file "{filePath}"`
  - Time: 10 minutes
  
- [ ] **Hook 3: Auto-run Related Tests**
  - File Pattern: `packages/**/src/**/*.ts`
  - Command: `npm test -- --findRelatedTests "{filePath}" --bail`
  - Time: 5 minutes
  
- [ ] **Hook 4: Task Status Reminder**
  - Trigger: `On agent execution complete`
  - Message: Reminder to update tasks.md
  - Time: 5 minutes

### 5. Enhance Git Pre-commit Hook
- [ ] Open `.git/hooks/pre-commit` (create if doesn't exist)
- [ ] Add comprehensive checks (see `.kiro/hooks/SETUP_GUIDE.md`)
- [ ] Make executable: `chmod +x .git/hooks/pre-commit`
- [ ] Test with dummy commit
- [ ] **Time:** 20 minutes
- [ ] **Impact:** Prevent bad commits

### 6. Install Property-Based Testing
- [ ] Run: `npm install --save-dev fast-check @types/fast-check`
- [ ] Verify installation: `npm list fast-check`
- [ ] **Time:** 5 minutes
- [ ] **Impact:** Enable PBT tests

---

## 📅 This Week (Next 3-4 Hours)

### 7. Create First Property-Based Test
- [ ] Read `.kiro/specs/PROPERTY_BASED_TESTING_GUIDE.md`
- [ ] Create `packages/shared/src/schema/__tests__/SchemaValidation.property.test.ts`
- [ ] Implement Property 1: Validation Rejection
- [ ] Run test: `npm test -- --testNamePattern="Property: Validation Rejection"`
- [ ] Verify 100 runs pass
- [ ] **Time:** 2 hours
- [ ] **Impact:** Mathematical proof of validation correctness

### 8. Update Design Document with Properties
- [ ] Open `.kiro/specs/nexus-blueprint-3.0/design.md`
- [ ] Add "Correctness Properties" section
- [ ] Document 5 key properties:
  1. Validation Rejection
  2. Round-trip Consistency
  3. Compatibility Symmetry
  4. Snapshot Idempotence
  5. Event Count Invariant
- [ ] Link to test implementations
- [ ] **Time:** 1 hour
- [ ] **Impact:** Formalized correctness requirements

### 9. Update Tasks with PBT Items
- [ ] Open `.kiro/specs/nexus-blueprint-3.0/tasks.md`
- [ ] Add task 3.5: Property-based tests for schema validation
- [ ] Add task 7.5: Property-based tests for snapshots
- [ ] Add task 2.4: Property-based tests for event store
- [ ] **Time:** 30 minutes
- [ ] **Impact:** Clear PBT implementation plan

---

## 🎯 Next Week (Optional)

### 10. Implement Remaining Property Tests
- [ ] Property 2: Round-trip Consistency
- [ ] Property 3: Compatibility Symmetry
- [ ] Property 4: Snapshot Idempotence
- [ ] Property 5: Event Count Invariant
- [ ] **Time:** 6-8 hours
- [ ] **Impact:** Comprehensive correctness coverage

### 11. Consider MCP Servers (If Needed)
- [ ] Evaluate if you need AWS documentation lookup
- [ ] If yes, install uv: Follow https://docs.astral.sh/uv/getting-started/installation/
- [ ] Create `.kiro/settings/mcp.json`
- [ ] Add AWS documentation server
- [ ] Test with: "Search AWS documentation for DynamoDB best practices"
- [ ] **Time:** 2-3 hours
- [ ] **Impact:** Faster AWS reference (if needed)

---

## 📊 Progress Tracking

### Completed Features
- [ ] Codebase Indexing
- [ ] Agent Hook 1: Schema Validation
- [ ] Agent Hook 2: Policy Check
- [ ] Agent Hook 3: Auto-run Tests
- [ ] Agent Hook 4: Task Reminder
- [ ] Git Pre-commit Hook
- [ ] Property-Based Testing Setup
- [ ] First Property Test
- [ ] Design Document Updated
- [ ] Tasks Document Updated

### Success Metrics
- **Hooks Created:** 0/4
- **Property Tests:** 0/5
- **Time Saved:** 0 hours/week (target: 18-30 hours/week)
- **Bugs Prevented:** 0 (target: 60-70% reduction)

---

## 🚨 Troubleshooting

### If Hooks Don't Work
1. Check Kiro output panel for errors
2. Verify file patterns match your files
3. Ensure scripts have execute permissions
4. Check Node.js is in PATH

### If Property Tests Fail
1. Read the counterexample carefully
2. Create a unit test with that specific input
3. Debug the unit test
4. Fix the bug
5. Re-run property test

### If You Get Stuck
1. Check the detailed guides:
   - `.kiro/hooks/SETUP_GUIDE.md`
   - `.kiro/specs/PROPERTY_BASED_TESTING_GUIDE.md`
   - `KIRO_ADVANCED_FEATURES_ANALYSIS.md`
2. Test each feature in isolation
3. Ask for help with specific error messages

---

## 💡 Quick Wins Priority

**Do these first for maximum impact:**

1. ✅ **Codebase Indexing** (2 min) - Instant search improvement
2. ✅ **Schema Validation Hook** (15 min) - Catch errors immediately
3. ✅ **Git Pre-commit Hook** (20 min) - Prevent bad commits
4. ✅ **First Property Test** (2 hours) - Prove correctness

**Total time for quick wins: ~2.5 hours**
**Expected impact: 10-15 hours/week saved**

---

## 📝 Notes

- **Don't rush** - Set up one feature at a time
- **Test thoroughly** - Verify each feature works before moving on
- **Document learnings** - Note what works and what doesn't
- **Iterate** - Adjust hooks and tests based on feedback
- **Share with team** - Help others adopt these features

---

## ✅ Ready to Start?

**Recommended order:**
1. Start with Codebase Indexing (easiest)
2. Create Schema Validation Hook (most impactful)
3. Set up Git Pre-commit Hook (prevents issues)
4. Install and test Property-Based Testing (proves correctness)

**Let's begin with #1: Codebase Indexing!**

Just use `#Codebase` in your next Kiro message and see the magic happen! 🎉
