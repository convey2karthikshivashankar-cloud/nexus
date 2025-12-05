# Kiro Usage Guide - Maximizing Your Efficiency

## 📊 How You've Been Using Kiro So Far

### ✅ Features You've Used Well

#### 1. **Specs (Structured Development)** ⭐⭐⭐⭐⭐
**What you did:**
- Created `.kiro/specs/nexus-blueprint-3.0/` with requirements, design, and tasks
- Used the spec workflow to iterate through requirements → design → implementation
- Tracked task completion with checkboxes

**Impact:** 
- Structured approach to complex feature
- Clear requirements and design documentation
- Trackable progress

#### 2. **Chat Context** ⭐⭐⭐
**What you did:**
- Used natural language to describe what you wanted
- Provided context through conversation
- Asked for clarifications and iterations

**What you could improve:**
- Use `#File` to reference specific files in chat
- Use `#Folder` to reference entire directories
- Use `#Codebase` for semantic search across all code

#### 3. **File Operations** ⭐⭐⭐⭐
**What you did:**
- Created multiple files (Lambda functions, tests, configs)
- Modified existing files (DemoStack.ts, tasks.md)
- Organized code in proper directory structure

**Impact:**
- Clean, organized codebase
- Proper separation of concerns

### ❌ Features You Haven't Used Yet (But Should!)

#### 1. **Steering Rules** 🎯 HIGH IMPACT
**Location:** `.kiro/steering/*.md`

**What it does:**
- Adds project-specific context and standards to ALL interactions
- Ensures consistency across sessions
- Embeds best practices automatically

**How to use it NOW:**

```markdown
# Create: .kiro/steering/project-standards.md
---
inclusion: always
---

# Nexus Blueprint 3.0 - Project Standards

## Architecture Principles
- Event Sourcing: All state changes as immutable events
- CQRS: Separate read/write models
- Governance-First: Schema validation before deployment
- Serverless: Lambda + DynamoDB + API Gateway

## Code Standards
- TypeScript for type safety
- Jest for testing
- CDK for infrastructure
- Minimal dependencies

## Testing Requirements
- Unit tests for business logic
- Integration tests for AWS services
- Property-based tests for correctness properties

## File Organization
- `/packages/*` - Core implementation
- `/demo/*` - Demo deployment
- `/schemas/*` - Event schemas
- `/policies/*` - OPA policies

## Deployment
- Region: us-east-2
- Stack: NexusDemoStack
- API: https://6lo5q41e31.execute-api.us-east-2.amazonaws.com/prod
```

**Benefits:**
- I'll automatically follow these standards
- No need to repeat context in every session
- Consistent code quality

#### 2. **Agent Hooks** 🔄 HIGH IMPACT
**Location:** Explorer View → "Agent Hooks" section

**What it does:**
- Automatically triggers actions on events
- Runs tests when you save files
- Updates documentation automatically
- Validates code on commit

**Recommended Hooks for Your Project:**

**Hook 1: Auto-test on save**
```yaml
Trigger: When you save a .ts file
Action: Run tests for that file
Command: npm test -- <file-path>
```

**Hook 2: Update tasks on commit**
```yaml
Trigger: Before commit
Action: Check if all tests pass
Command: npm test
```

**Hook 3: Validate schemas**
```yaml
Trigger: When you save a schema file
Action: Validate schema format
Command: node scripts/validate-schema.js <file>
```

**How to create:**
1. Open Command Palette (Ctrl+Shift+P)
2. Type "Open Kiro Hook UI"
3. Create hooks for your workflow

#### 3. **Context Keys in Chat** 🔍 MEDIUM IMPACT

**What you should be doing:**

Instead of:
```
"Can you check the DemoStack file?"
```

Do this:
```
"Can you check #File:demo/infrastructure/DemoStack.ts for errors?"
```

Instead of:
```
"Look at all the Lambda functions"
```

Do this:
```
"Review #Folder:demo/lambda for optimization opportunities"
```

Instead of:
```
"Find where we handle commands"
```

Do this:
```
"Search #Codebase for command handling logic"
```

**Benefits:**
- Faster, more accurate responses
- I see exactly what you're referring to
- Better context for suggestions

#### 4. **Problems Panel** 🐛 HIGH IMPACT

**What it does:**
- Shows TypeScript errors, linting issues
- Real-time feedback as you code
- Integrated with Kiro's understanding

**How to use:**
```
"Fix all #Problems in the command-handler"
"Why am I getting #Problems in DemoStack.ts?"
"Review #Problems and suggest fixes"
```

#### 5. **Git Diff Context** 📝 MEDIUM IMPACT

**What it does:**
- Shows what changed since last commit
- Helps review changes before committing
- Useful for understanding recent work

**How to use:**
```
"Review my #Git Diff and suggest improvements"
"Explain the changes in #Git Diff"
"Are there any issues in #Git Diff?"
```

#### 6. **Terminal Integration** 💻 MEDIUM IMPACT

**What it does:**
- Shows your terminal output
- Helps debug command failures
- Provides context for errors

**How to use:**
```
"Check my #Terminal for errors"
"Why did the command in #Terminal fail?"
"Explain the output in #Terminal"
```

## 🚀 Action Plan for Remaining Tasks

### Immediate Actions (Do This Now!)

#### 1. Create Steering Rules (5 minutes)

<function_calls>
<invoke name="fsWrite">
<parameter name="path">.kiro/steering/nexus-standards.mdnclusion: always
---

# Nexus Blueprint 3.0 Standards

## Project Context
- **Project**: Event-Sourced Microservice Architecture
- **Stack**: AWS Lambda, DynamoDB, API Gateway, CDK
- **API**: https://6lo5q41e31.execute-api.us-east-2.amazonaws.com/prod
- **Region**: us-east-2
- **Account**: 557810226161

## Architecture Principles
1. **Event Sourcing**: All state changes stored as immutable events
2. **CQRS**: Separate command (write) and query (read) models
3. **Governance-First**: Schema validation and policy enforcement
4. **Serverless**: No servers to manage, auto-scaling
5. **Free Tier Optimized**: Stay within AWS free tier limits

## Code Standards
- **Language**: TypeScript (packages), JavaScript (Lambda)
- **Testing**: Jest for unit/integration tests
- **Infrastructure**: AWS CDK
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier

## File Organization
```
/packages/*          - Core implementation
  /command-service   - Write model
  /query-dashboard   - Read model
  /event-router      - Event propagation
  /shared            - Shared utilities
  /infrastructure    - CDK stacks
  /adapters          - AWS/OSS adapters
/demo/*              - Demo deployment
  /lambda            - Lambda functions
  /infrastructure    - Demo CDK stack
  /ui                - React UI
/schemas/*           - JSON event schemas
/policies/*          - OPA policies
/.kiro/specs/*       - Feature specifications
```

## Testing Requirements
- Unit tests for business logic
- Integration tests for AWS services
- Property-based tests for correctness properties
- All tests must pass before deployment

## Deployment Process
1. Run tests: `npm test`
2. Synth CDK: `npx cdk synth`
3. Deploy: `npx cdk deploy`
4. Verify: Run test-api.ps1

## Common Commands
```bash
# Install dependencies
npm install

# Run tests
npm test

# Deploy demo
cd demo && npx cdk deploy

# Test API
cd demo && .\test-api.ps1

# View logs
aws logs tail /aws/lambda/nexus-demo-command-handler --follow
```

## Remaining Tasks
See `.kiro/specs/nexus-blueprint-3.0/tasks.md` for incomplete tasks:
- Task 5: Command Service implementation
- Task 6: Event Bus (SNS/SQS)
- Task 7: Snapshot Manager
- Task 8: Query Dashboard with OpenSearch
- Task 9: Real-time notifications
- Task 10: Saga Coordinator
- Tasks 11-18: Error handling, monitoring, schema evolution, etc.

## Key Decisions
- WebSocket temporarily disabled for initial deployment
- Using crypto.randomUUID() instead of uuid package
- Lambda environment variables: EVENT_STORE_TABLE, READ_MODEL_TABLE
- DynamoDB table names: nexus-demo-event-store, nexus-demo-read-model
