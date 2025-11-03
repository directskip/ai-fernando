# Fernando Chat - Quick Start Guide

## 🚀 Get Started in 3 Minutes

### Step 1: Add AWS Credentials

Edit `/Users/pfaquart/fernando-web/.env.local` and add:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
```

### Step 2: Verify Bedrock Access

1. Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock)
2. Click "Model access" (left sidebar)
3. Find "Anthropic Claude Sonnet 4.5"
4. If not enabled, click "Request access" (usually instant approval)

### Step 3: Start the Server

```bash
npm run dev
```

### Step 4: Open Chat

Navigate to: **http://localhost:3003/admin/chat**

That's it! Start chatting with Fernando.

---

## ✅ What's Already Done

- ✅ DynamoDB tables created (`fernando-conversations`, `fernando-messages`)
- ✅ All code built and tested
- ✅ Dependencies installed
- ✅ Navigation updated (Chat link in sidebar)

## 📋 What You Need

1. **AWS Access Key** with permissions for:
   - Bedrock (invoke model)
   - DynamoDB (read/write)

2. **Claude Sonnet 4.5 access** enabled in Bedrock (us-east-1)

## 🎯 First Conversation

Try these starter messages:

- "What do you know about my preferences?"
- "Help me brainstorm ideas for..."
- "What's in my knowledge base about..."
- "Can you help me with..."

## 📚 Full Documentation

- **Setup Guide:** `CHAT_SETUP.md`
- **Implementation Summary:** `CHAT_FEATURE_SUMMARY.md`

## 🐛 Troubleshooting

**Error: "Failed to get response from Claude"**
→ Check Bedrock access is enabled for Claude Sonnet 4.5

**Error: "Failed to fetch conversations"**
→ Verify AWS credentials and DynamoDB permissions

**Tables missing?**
→ Run: `node scripts/setup-chat-tables.js`

## 💰 Cost Estimate

**Light usage (50 conversations/month):** ~$5-10/month
**Moderate usage (200 conversations/month):** ~$20-30/month

Mostly from Bedrock API calls. DynamoDB is pennies.

## 🎉 Enjoy!

You now have a fully functional AI chat assistant that remembers your conversations!
