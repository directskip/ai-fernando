# Fernando Rules Viewer - Quick Start Guide

## Access the Rules Viewer

**URL**: https://fernando.iwantmyown.com/admin/rules

**Navigation**:
- Desktop: Click "Rules 📜" in top navigation bar
- Mobile: Tap "Rules 📜" icon in bottom navigation bar

---

## What You'll See

### Main View

```
┌──────────────────────────────────────────────────────────────────┐
│  Fernando Rules & Guardrails                                     │
│  View and provide feedback on the rules Fernando follows         │
├──────────────────────────────────────────────────────────────────┤
│  [Search rules...]                                               │
├──────────────────────────────────────────────────────────────────┤
│  [All Rules (25)]  [🏗️ Architecture (5)]  [📋 Classification (5)]│
│  [💰 Cost (3)]  [🌱 Growth (4)]  [🎯 Behavior (8)]              │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│  │ 🏗️ HIGH              │  │ Select a rule to view details    │ │
│  │ Use TypeScript      │  │ and add comments                 │ │
│  │ for all new code    │  │                                  │ │
│  └─────────────────────┘  └──────────────────────────────────┘ │
│  ┌─────────────────────┐                                        │
│  │ 🏗️ HIGH              │                                        │
│  │ Prefer composition  │                                        │
│  │ over inheritance    │                                        │
│  └─────────────────────┘                                        │
│  ... (more rules)                                                │
└──────────────────────────────────────────────────────────────────┘
```

### Rule Details View (After Clicking a Rule)

```
┌──────────────────────────────────────────────────────────────────┐
│  🏗️ Use TypeScript for all new code                              │
│  [HIGH PRIORITY]  [Architecture Principles]                      │
├──────────────────────────────────────────────────────────────────┤
│  Description                                                     │
│  All new code must be written in TypeScript with strict mode    │
│  enabled. Avoid JavaScript files except for configuration.      │
│                                                                  │
│  Reasoning                                                       │
│  TypeScript provides compile-time type safety, better IDE       │
│  support, and catches errors before runtime.                    │
├──────────────────────────────────────────────────────────────────┤
│  Comments & Feedback                                             │
│                                                                  │
│  [No comments yet. Be the first to provide feedback!]           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Share your thoughts, suggestions, or questions...          │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│  [Add Comment]                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Common Actions

### Browse All Rules
1. Visit `/admin/rules`
2. Scroll through the list
3. All 25 rules are displayed by default

### Filter by Category
1. Click any category button:
   - 🏗️ Architecture Principles (5 rules)
   - 📋 Classification Rules (5 rules)
   - 💰 Cost Thresholds (3 rules)
   - 🌱 Growth Triggers (4 rules)
   - 🎯 Behavioral Guidelines (8 rules)
2. Only rules from that category appear

### Search for Specific Rules
1. Type keywords in the search bar
2. Searches across title, description, and reasoning
3. Results update in real-time

### View Rule Details
1. Click any rule card
2. Right panel shows full details
3. See description, reasoning, and all comments

### Add Feedback/Comment
1. Select a rule to view details
2. Scroll to "Comments & Feedback" section
3. Type your comment in the text area
4. Click "Add Comment"
5. Your comment appears immediately

---

## Rule Categories Explained

### 🏗️ Architecture Principles
Technical decisions about code organization and structure.
**Examples**: TypeScript usage, component size limits, code organization

### 📋 Classification Rules
How Fernando categorizes and manages knowledge.
**Examples**: Public vs Private data, conditional sharing rules

### 💰 Cost Thresholds
Token budgets and resource optimization.
**Examples**: Session token limits, incremental syncing

### 🌱 Growth Triggers
How Fernando learns and improves over time.
**Examples**: Pattern recognition, learning from corrections

### 🎯 Behavioral Guidelines
Communication style and interaction patterns.
**Examples**: Explain reasoning, be concise, flag blockers early

---

## Priority Levels

- **🔴 HIGH** - Critical rules that should almost never be violated
- **🟡 MEDIUM** - Important rules with some flexibility
- **🟢 LOW** - Guidelines that can be adjusted based on context

---

## Use Cases

### Understanding How Fernando Works
- Browse all rules to see Fernando's operating principles
- Read reasoning to understand why each rule exists
- See priority levels to know which rules are most important

### Providing Feedback
- Comment when a rule isn't clear
- Suggest modifications to existing rules
- Question reasoning if something doesn't make sense

### Proposing New Rules
- Comment on similar rules suggesting additions
- Explain patterns you've noticed that should become rules

### Tracking Rule Evolution
- See when rules were last updated
- View comment history to understand discussions
- Contribute to rule refinement over time

---

## Tips for Effective Feedback

**Good Comments**:
- "This rule saved me time today when..."
- "Could we adjust this rule for X scenario?"
- "The reasoning here isn't clear because..."
- "I suggest adding: ..."

**Less Helpful Comments**:
- "I don't like this"
- "Why?"
- "Change it"

**Best Practice**:
- Be specific about your experience
- Explain the context
- Suggest concrete improvements
- Ask clarifying questions

---

## FAQ

**Q: Can I edit rules directly?**
A: No, rules are defined in code. Leave comments with suggestions and Peter will review.

**Q: Who can see my comments?**
A: Only authenticated admin users (Peter) can see comments.

**Q: Do comments notify anyone?**
A: Not yet. Check the comments section periodically for responses.

**Q: Can I delete my comments?**
A: Not yet. Contact Peter if you need to remove a comment.

**Q: How often are rules updated?**
A: As needed. Check the "Last updated" date on each rule.

**Q: What if I disagree with a rule?**
A: Comment with your reasoning. Rules should be living documents that evolve.

---

## Mobile Usage

The Rules Viewer is fully mobile-optimized:
- Tap the Rules icon (📜) in the bottom navigation
- Swipe through rules
- Tap any rule to view details
- Add comments from your phone
- All features work on mobile

---

## Keyboard Shortcuts

- **Tab**: Navigate between rules
- **Enter**: Open selected rule details
- **Escape**: Clear search (if focused)
- **Ctrl/Cmd + F**: Focus search bar (browser default)

---

## Getting Help

**Issues with the Rules Viewer?**
1. Check the browser console (F12) for errors
2. Verify you're logged in
3. Try refreshing the page
4. Contact Peter if problems persist

**Want to suggest a new feature?**
Leave a comment on any rule describing the feature idea.

---

## Summary

The Fernando Rules Viewer provides transparency into how Fernando operates. Use it to:
- Understand Fernando's decision-making
- Provide feedback on rules
- Suggest improvements
- Track rule changes over time

**Start exploring**: https://fernando.iwantmyown.com/admin/rules
