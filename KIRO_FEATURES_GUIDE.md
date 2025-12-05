# 🚀 Kiro Features Guide - Maximizing Your Efficiency

## 📊 How You've Been Using Kiro

### ✅ Features You've Used Successfully

#### 1. **Specs (Specification-Driven Development)** ⭐⭐⭐⭐⭐
**What you did:**
- Created `.kiro/specs/nexus-blueprint-3.0/` with requirements, design, and tasks
- Used structured workflow: Requirements → Design → Tasks → Implementation
- Tracked task completion with checkboxes

**Impact:** 
- Clear roadmap for complex project
- Tracked 18 tasks across multiple components
- Maintained design decisions and requirements

#### 2. **File Operations** ⭐⭐⭐⭐⭐
**What you did:**
- Created 26+ new files (Lambda functions, tests, middleware)
- Modified existing files with strReplace
- Read multiple files to understand context

**Impact:**
- Rapid code generation
- Consistent file modifications
- Context-aware changes

#### 3. **Command Execution** ⭐⭐⭐⭐
**What you did:**
- Ran AWS CLI commands
- Executed CDK deploy
- Ran npm install and build commands
- Checked logs with aws logs tail

**Impact:**
- Deployed to AWS successfully
- Verified functionality
- Debugged issues in real-time

#### 4. **Git Integration** ⭐⭐⭐⭐
**What you did:**
- Committed changes with descriptive messages
- Pushed to remote repository
- Tracked version history

**Impact:**
- Code safely stored
- Collaboration ready
- Version control maintained

---

## 🎯 Features You SHOULD Be Using (But Aren't Yet)

### 1. **Steering Files** 🎯 HIGH IMPACT
**What it is:** Project-specific instructions that guide Kiro's behavior

**How to use it:**
```bash
# You already have: .kiro/KIRO_USAGE_GUIDE.md
# This will now be included in ALL Kiro interactions!
```

**What to add:**
- Coding standards
- Architecture decisions
- Common patterns
- Deployment procedures

**Example:**
```markdown
---
inclusion: always
---

# Project Standards

## When implementing Lambda functions:
- Always use crypto.randomUUID() not uuid package
- Environment variables: EVENT_STORE_TABLE, READ_MODEL_TABLE
- Include error handling with try/catch
- Log all operations for CloudWatch

## When writing tests:
- Use Jest
- Mock AWS services with aws-sdk-mock
- Test both success and error cases
```

**Why you need it:** Kiro will automatically follow your standards without you repeating them!

---

### 2. **Context Keys (#File, #Folder, #Codebase)** 🎯 HIGH IMPACT
**What it is:** Explicitly include files/folders in your prompts

**How to use it:**
```
# Instead of: "Update the Lambda function"
✅ Better: "Update #File:demo/lambda/command-handler/index.js to add validation"

# Instead of: "Check the tests"
✅ Better: "Review #Folder:packages/shared/src/schema/__tests__"

# Instead of: "Find where we use DynamoDB"
✅ Better: "#Codebase search for DynamoDB usage"
```

**Why you need it:** 
- Kiro gets exact context
- Faster, more accurate responses
- No ambiguity

---

### 3. **Agent Hooks** 🎯 MEDIUM IMPACT
**What it is:** Automatic actions triggered by events

**How to set up:**
1. Open Command Palette → "Open Kiro Hook UI"
2. Create hooks like:

**Example Hooks for Your Project:**

**Hook 1: Auto-test on save**
```yaml
Trigger: On file save (*.ts, *.js)
Action: Run tests for changed file
Command: npm test -- {file}
```

**Hook 2: Validate before commit**
```yaml
Trigger: On git commit
Action: Run linter and tests
Command: npm run lint && npm test
```

**Hook 3: Update docs on spec change**
```yaml
Trigger: On file save (.kiro/specs/*/tasks.md)
Action: Remind to update README
Message: "Tasks updated - consider updating README.md"
```

**Why you need it:** Automate repetitive tasks, catch issues early

---

### 4. **Spec Task Execution** 🎯 HIGH IMPACT
**What it is:** Click "Start task" button next to tasks in tasks.md

**How to use it:**
1. Open `.kiro/specs/nexus-blueprint-3.0/tasks.md`
2. Click "Start task" next to any incomplete task
3. Kiro automatically:
   - Reads requirements & design
   - Implements the task
   - Writes tests
   - Updates task status

**Example:**
```markdown
- [ ] 5.1 Create Command Handler base class
  👈 Click "Start task" here!
```

**Why you need it:** 
- Kiro has full context from specs
- Consistent implementation
- Automatic task tracking

---

### 5. **Multi-File Context** 🎯 MEDIUM IMPACT
**What it is:** Reference multiple files in one prompt

**How to use it:**
```
"Compare #File:demo/lambda/command-handler/index.js with 
#File:packages/command-service/src/domain/CommandHandler.ts 
and align the implementations"
```

**Why you need it:** 
- Maintain consistency across files
- Refactor multiple files together
- Cross-reference implementations

---

### 6. **Diagnostics** 🎯 HIGH IMPACT
**What it is:** See TypeScript/ESLint errors in real-time

**How to use it:**
- Kiro automatically checks for errors after edits
- You can also ask: "Check for errors in #File:demo/lambda/command-handler/index.ts"

**Why you need it:** 
- Catch errors before running code
- Fix type issues immediately
- No need to run tsc manually

---

### 7. **Background Processes** 🎯 MEDIUM IMPACT
**What it is:** Run long-running commands (dev servers, watchers)

**How to use it:**
```
"Start the dev server in background"
# Kiro will use controlPwshProcess to start it
# You can continue working while it runs
```

**Why you need it:** 
- Don't block on long commands
- Monitor multiple processes
- Test while developing

---

## 🚀 Recommended Workflow for Remaining Tasks

### Phase 1: Set Up Steering (5 minutes)
1. ✅ Already done: `.kiro/KIRO_USAGE_GUIDE.md`
2. Add more specific patterns as you discover them

### Phase 2: Use Spec Task Execution (Ongoing)
For each remaining task:
```
1. Open .kiro/specs/nexus-blueprint-3.0/tasks.md
2. Click "Start task" on next incomplete task
3. Review Kiro's implementation
4. Test and iterate
5. Move to next task
```

### Phase 3: Use Context Keys (Every prompt)
```
❌ Before: "Update the query handler"
✅ After: "Update #File:demo/lambda/query-handler/index.js to add pagination"

❌ Before: "Check the tests"
✅ After: "Run tests in #Folder:packages/shared/__tests__"
```

### Phase 4: Set Up Hooks (10 minutes)
Create 3 essential hooks:
1. **Test on save** - Catch errors immediately
2. **Lint before commit** - Maintain code quality
3. **Update docs** - Keep documentation current

---

## 📈 Efficiency Gains You'll See

### Current Workflow (What you're doing now):
```
1. Describe what you want
2. Kiro implements
3. You review
4. Iterate if needed
```
**Time per task:** ~15-30 minutes

### Optimized Workflow (With all features):
```
1. Click "Start task" in tasks.md
2. Kiro auto-implements with full context
3. Hooks auto-test on save
4. Steering ensures consistency
5. Diagnostics catch errors
```
**Time per task:** ~5-10 minutes

**Estimated time savings:** 50-70% faster! ⚡

---

## 🎯 Action Plan for Next Session

### Immediate (Do this now):
1. ✅ Steering file created
2. ⏭️ Open `.kiro/specs/nexus-blueprint-3.0/tasks.md`
3. ⏭️ Click "Start task" on Task 5.1
4. ⏭️ Use #File references in your prompts

### This Week:
1. Set up 3 agent hooks (test, lint, docs)
2. Complete 5 tasks using spec task execution
3. Use #Codebase to understand existing patterns

### This Month:
1. Complete all remaining tasks
2. Add conditional steering for specific file types
3. Create hooks for deployment automation

---

## 💡 Pro Tips

### Tip 1: Combine Features
```
"Using #File:demo/lambda/command-handler/index.js as a template,
implement Task 5.1 from #File:.kiro/specs/nexus-blueprint-3.0/tasks.md"
```

### Tip 2: Use Steering for Patterns
When you find yourself repeating instructions, add them to steering:
```markdown
## Lambda Function Pattern
All Lambda functions should:
- Use crypto.randomUUID()
- Include try/catch error handling
- Log to CloudWatch
- Return proper HTTP status codes
```

### Tip 3: Leverage Spec Context
Kiro reads requirements.md and design.md automatically when executing tasks!

### Tip 4: Use Hooks for Quality Gates
Set up hooks to prevent bad commits:
- Run tests before commit
- Check for console.logs
- Validate JSON schemas

---

## 📚 Quick Reference

| Feature | When to Use | Impact | Setup Time |
|---------|-------------|--------|------------|
| Specs | Complex features | ⭐⭐⭐⭐⭐ | 30 min |
| Steering | Project standards | ⭐⭐⭐⭐⭐ | 5 min |
| Context Keys | Every prompt | ⭐⭐⭐⭐ | 0 min |
| Task Execution | Implementing tasks | ⭐⭐⭐⭐⭐ | 0 min |
| Hooks | Automation | ⭐⭐⭐⭐ | 10 min |
| Diagnostics | Error checking | ⭐⭐⭐⭐ | 0 min |
| Multi-File | Refactoring | ⭐⭐⭐ | 0 min |
| Background Processes | Dev servers | ⭐⭐⭐ | 0 min |

---

## 🎓 Learning Resources

### In Kiro:
- Command Palette → Search "Kiro" to see all features
- Explorer → "Agent Hooks" section
- Explorer → "Kiro" panel for specs

### Documentation:
- Steering: `.kiro/steering/*.md` files
- Specs: `.kiro/specs/*/` folders
- Hooks: Command Palette → "Open Kiro Hook UI"

---

## ✅ Your Next Steps

1. **Right now:** Start using #File and #Folder in your prompts
2. **Next task:** Click "Start task" in tasks.md instead of describing it
3. **This week:** Set up 3 agent hooks
4. **Ongoing:** Add patterns to steering as you discover them

**Remember:** The features are already there - you just need to use them! 🚀

---

## 🤔 Questions?

Ask Kiro:
- "Show me how to create an agent hook"
- "What steering files do I have?"
- "How do I use #Codebase search?"
- "Start task 5.1 from the nexus-blueprint-3.0 spec"

You're already 40% through the project - with these features, you'll finish the remaining 60% in half the time! 💪
