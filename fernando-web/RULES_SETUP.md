# Fernando Rules Viewer - Setup Guide

## Overview

The Rules Viewer is a comprehensive interface that displays all the guardrails, principles, and behavioral rules that Fernando follows. Peter can view, understand, and provide feedback on any rule through an integrated comment system.

## Features

- **Rule Categories**: 5 main categories
  - Architecture Principles (5 rules)
  - Classification Rules (5 rules)
  - Cost Thresholds (3 rules)
  - Growth Triggers (4 rules)
  - Behavioral Guidelines (8 rules)

- **Interactive UI**:
  - Filter by category
  - Search across all rules
  - Click any rule to see full details
  - Add comments/feedback on any rule
  - View comment history

- **Data Storage**:
  - Rules are defined in code (`lib/rules.ts`)
  - Comments are stored in DynamoDB
  - Persistent across sessions

## Setup Instructions

### 1. Configure AWS Credentials

Add these to your `.env.local` file:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
DYNAMODB_COMMENTS_TABLE=fernando-rule-comments
```

### 2. Create DynamoDB Table

Run the setup script to create the comments table:

```bash
npx tsx scripts/setup-rule-comments-table.ts
```

This will create a table with:
- **Name**: `fernando-rule-comments`
- **Primary Key**: `PK` (partition), `SK` (sort)
- **GSI**: `GSI1` for querying all comments
- **Billing**: Pay Per Request (no upfront costs)

### 3. Verify Installation

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `/admin/rules`

3. You should see 25 rules organized by category

4. Click any rule to view details

5. Add a test comment to verify DynamoDB integration

## Architecture

### File Structure

```
fernando-web/
├── app/
│   └── admin/
│       └── rules/
│           └── page.tsx          # Main rules viewer page
├── app/api/
│   └── rules/
│       └── comments/
│           └── route.ts          # API routes for comments
├── lib/
│   ├── rules.ts                  # Rule definitions & utilities
│   └── db.ts                     # DynamoDB client & functions
├── scripts/
│   └── setup-rule-comments-table.ts  # Table setup script
└── components/
    ├── DesktopNav.tsx            # Updated with Rules link
    └── MobileNav.tsx             # Updated with Rules link
```

### Data Model

**Rules** (stored in code):
```typescript
{
  id: string              // e.g., "arch-001"
  category: string        // architecture, classification, cost, growth, behavior
  title: string           // Short rule name
  description: string     // What the rule says
  reasoning: string       // Why this rule exists
  lastUpdated: string     // When last modified
  priority: string        // high, medium, low
}
```

**Comments** (stored in DynamoDB):
```typescript
{
  PK: "RULE#<ruleId>"              // Partition key
  SK: "COMMENT#<timestamp>#<id>"   // Sort key
  ruleId: string
  commentId: string
  userId: string
  userName: string
  comment: string
  timestamp: string
  GSI1PK: "COMMENTS"               // For querying all comments
  GSI1SK: timestamp                // Sort by time
}
```

## API Endpoints

### GET /api/rules/comments

Get all comments or comments for a specific rule.

**Query Parameters**:
- `ruleId` (optional): Filter comments for a specific rule

**Response**:
```json
{
  "comments": {
    "arch-001": [
      {
        "id": "comment-123",
        "ruleId": "arch-001",
        "userId": "peter",
        "userName": "Peter Faquart",
        "comment": "This rule is working great!",
        "timestamp": "2025-10-31T10:00:00Z"
      }
    ]
  }
}
```

### POST /api/rules/comments

Add a new comment to a rule.

**Body**:
```json
{
  "ruleId": "arch-001",
  "comment": "This rule could be improved by..."
}
```

**Response**:
```json
{
  "success": true,
  "comment": { /* new comment */ },
  "comments": [ /* all comments for this rule */ ]
}
```

## Usage

### Viewing Rules

1. Navigate to `/admin/rules`
2. Use category filters to browse specific types of rules
3. Use search bar to find rules by keyword
4. Click any rule to see full details in the right panel

### Adding Feedback

1. Select a rule to view details
2. Scroll to the "Comments & Feedback" section
3. Type your comment in the text area
4. Click "Add Comment"
5. Comment appears immediately in the list

### Updating Rules

To add or modify rules:

1. Edit `lib/rules.ts`
2. Add new rules to the `FERNANDO_RULES` array
3. Follow the existing format
4. Use appropriate category and priority
5. Provide clear description and reasoning

Example:
```typescript
{
  id: 'arch-006',
  category: 'architecture',
  title: 'New architecture principle',
  description: 'Clear description of what to do',
  reasoning: 'Explanation of why this matters',
  lastUpdated: '2025-11-01',
  priority: 'high'
}
```

## Deployment

### Production Environment Variables

Add to your production environment:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<production-key>
AWS_SECRET_ACCESS_KEY=<production-secret>
DYNAMODB_COMMENTS_TABLE=fernando-rule-comments
```

### Deploy Steps

1. Deploy the Next.js app as usual
2. Run table setup script in production environment
3. Verify the `/admin/rules` page loads
4. Test adding a comment

## Maintenance

### Adding New Rule Categories

1. Update the `Rule['category']` type in `lib/rules.ts`
2. Add category label in `getCategoryLabel()`
3. Add category icon in `getCategoryIcon()`
4. Add category description in `getCategoryDescription()`
5. Add rules with the new category

### Monitoring

Watch for:
- DynamoDB read/write capacity (should be minimal with Pay Per Request)
- API errors in logs
- Comment loading failures
- User feedback on rule clarity

## Troubleshooting

**Comments not loading**:
- Check AWS credentials in `.env.local`
- Verify DynamoDB table exists
- Check browser console for API errors
- Verify table has correct schema

**Can't add comments**:
- Ensure user is logged in (NextAuth session required)
- Check API route logs for errors
- Verify DynamoDB write permissions
- Check network tab for 401/500 errors

**Rules not displaying**:
- Check for TypeScript compilation errors
- Verify `FERNANDO_RULES` array is valid
- Check browser console for React errors

## Cost Estimate

With Pay Per Request billing:
- **Reads**: $0.25 per million requests
- **Writes**: $1.25 per million requests
- **Storage**: $0.25 per GB-month

Expected monthly cost: **< $1** (assuming moderate usage)

## Future Enhancements

Possible improvements:
- Edit/delete comments
- Rule version history
- Rule effectiveness metrics
- Visual rule dependency graph
- Export rules as PDF/Markdown
- Rule approval workflow
- Email notifications for rule changes
