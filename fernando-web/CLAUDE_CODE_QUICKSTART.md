# Claude Code Session Runner - Quick Start

## 🚀 Start Using Now (Development Mode)

```bash
# 1. Start the development server
npm run dev

# 2. Open in browser
# http://localhost:3000/admin/sessions/runner

# 3. Log in with your Fernando admin credentials

# 4. Create your first session!
```

## 📍 Access Points

### Primary Interface
- **URL**: `/admin/sessions/runner`
- **Full URL**: `http://localhost:3000/admin/sessions/runner`

### From Sessions Page
- Navigate to `/admin/sessions`
- Click "Launch Session Runner" button

## 🎯 First Session in 30 Seconds

1. **Fill out the form**:
   - Session Name: `My First Session`
   - Working Directory: `/tmp`
   - Model: `claude-sonnet-4` (default)

2. **Click "Create Session"**
   - Session opens in a new tab automatically

3. **Send your first prompt**:
   ```
   Hello! Can you help me understand what you can do?
   ```

4. **Press Enter**
   - Watch the response appear in the terminal

## 🎨 UI Tour

### Main Screen
```
┌─────────────────────────────────────────────────────┐
│ Claude Code Session Runner      [Back to Sessions] │
├─────────────────────────────────────────────────────┤
│ [+ New Session] [Tab 1] [Tab 2] [Tab 3]           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Terminal Output or Session List                   │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [Prompt Input]                           [Send]    │
└─────────────────────────────────────────────────────┘
```

### Active Session Tab
```
┌─────────────────────────────────────────────────────┐
│ My Session      [running]    [End Session] [Close] │
├─────────────────────────────────────────────────────┤
│ [Terminal] [Files]                                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  > User: Hello!                    10:30:45        │
│  < AI: Hi! I'm Claude Code...      10:30:46        │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Enter your prompt...                      [Send]   │
└─────────────────────────────────────────────────────┘
```

## ⌨️ Keyboard Shortcuts

- **Enter**: Send prompt
- **Shift + Enter**: New line in prompt
- **↑ (Up Arrow)**: Previous prompt in history
- **↓ (Down Arrow)**: Next prompt in history

## 🎮 Try These Examples

### Example 1: Simple Question
```
What is the difference between React hooks and class components?
```

### Example 2: Code Request
```
Write a TypeScript function that validates email addresses using regex.
```

### Example 3: Multiple Prompts
```
1. First prompt: "List 5 popular web frameworks"
2. Wait for response
3. Second prompt: "Compare the first two in detail"
```

## 🔄 Working with Multiple Sessions

### Create Multiple Sessions
1. Click "+ New Session"
2. Create "Session A" for one task
3. Click "+ New Session" again
4. Create "Session B" for another task
5. Switch between tabs to work on both

### Session Isolation
- Each session maintains its own:
  - Message history
  - Working directory
  - State and context
- No cross-talk between sessions

## 📊 Session States

### 🟢 Running
- Can send prompts
- Actively processing
- Receiving responses

### 🟡 Paused
- Temporarily stopped
- Can resume later
- History preserved

### ⚫ Ended
- Completed/terminated
- Read-only view
- Cannot send new prompts

## 🎯 Common Workflows

### Workflow 1: Quick Q&A
1. Create session
2. Ask question
3. Get answer
4. End session

### Workflow 2: Extended Development
1. Create session
2. Ask multiple related questions
3. Build on previous responses
4. Keep session running
5. Return later
6. Resume and continue

### Workflow 3: Parallel Tasks
1. Open Session A for frontend work
2. Open Session B for backend work
3. Switch between tabs as needed
4. Each maintains separate context

## 🛠️ Features at a Glance

### ✅ Available Now
- Multiple concurrent sessions
- Tab-based interface
- Message history
- Command history (↑↓)
- Session management
- Status indicators
- Dark mode support
- Responsive design

### 🔜 Coming Soon (Requires AWS Deployment)
- Real-time streaming
- File tree population
- File content viewing
- Code execution
- Persistent storage

## 🐛 Troubleshooting

### Session Won't Create
- Check form is filled completely
- Verify working directory path
- Check browser console for errors

### Prompts Not Sending
- Ensure session status is "running"
- Check network tab for API errors
- Verify dev server is running

### Tabs Not Switching
- Refresh the page
- Check if session is still active
- Try closing and reopening tab

## 💡 Pro Tips

### Tip 1: Use Descriptive Names
```
✅ "Debug Auth Flow"
❌ "Session 1"
```

### Tip 2: Organize by Project
```
- "ProjectX - Frontend"
- "ProjectX - Backend"
- "ProjectX - Database"
```

### Tip 3: Keep Related Work Together
- Use one session for related tasks
- Create new session for different contexts

### Tip 4: Use History Feature
- Press ↑ to repeat previous prompts
- Modify and resend
- Build on previous conversations

## 📚 Learn More

- **Full Documentation**: `CLAUDE_CODE_RUNNER.md`
- **Deployment Guide**: `CLAUDE_CODE_DEPLOYMENT.md`
- **Build Summary**: `CLAUDE_CODE_SUMMARY.md`

## 🎉 Ready to Go!

You're all set! The Claude Code Session Runner is ready to use right now in development mode.

**Start your first session**:
```bash
npm run dev
```

Then navigate to: `http://localhost:3000/admin/sessions/runner`

---

**Need Help?**
- Check the documentation files
- Review browser console for errors
- Verify dev server is running on port 3000

**Have Fun Coding!** 🚀
