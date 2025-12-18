# AI Configuration - Google Gemini

This application now uses **Google Gemini AI** instead of OpenAI for all AI-powered features.

## Why Gemini?

- ✅ **Free Tier**: Generous free tier (15 requests/minute, 1500/day)
- ✅ **Fast**: Gemini 1.5 Flash provides quick responses
- ✅ **Cost Effective**: No API costs for most academic use cases
- ✅ **Strong Performance**: Excellent for academic writing tasks

## Setup Instructions

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API key" or "Create API key"
4. Copy your API key

### 2. Configure Environment Variable

Add your Gemini API key to your `.env` file:

```bash
GEMINI_API_KEY=your_api_key_here
```

**Note**: Previously this app used `OPENAI_API_KEY`. Make sure to update your environment variables!

### 3. Restart the Server

After adding the API key, restart your development server:

```bash
npm run dev
```

## Supported AI Features

All the following features now use Gemini 1.5 Flash:

- **Chapter Outline Generation**: Auto-generate structured outlines
- **Academic Polishing**: Improve formal tone and clarity
- **Text Summarization**: Extract key points
- **Content Humanization**: Make AI text sound more natural
- **Ghostwriting**: Generate comprehensive chapter drafts
- **Defense Flashcards**: Auto-generate Q&A for thesis defense
- **Methodology Guide**: Generate methodology chapter structure

## Model Information

- **Default Model**: `gemini-1.5-flash`
- **Context Window**: Up to 1M tokens
- **Output Length**: ~2048 tokens per response
- **Supports**: Text generation, JSON output, RAG (document context)

## Troubleshooting

### "AI assistance is not configured"

- Make sure `GEMINI_API_KEY` is set in your `.env` file
- Restart your server after adding the environment variable
- Verify your API key is valid at [Google AI Studio](https://aistudio.google.com/)

### Rate Limits

Free tier limits:
- **15 requests per minute**  
- **1500 requests per day**

If you hit rate limits, wait a minute and try again, or upgrade to a paid plan.

## Migration from OpenAI

If you were using OpenAI previously:

1. Remove `OPENAI_API_KEY` from your `.env`
2. Add `GEMINI_API_KEY` to your `.env`
3. The `openai` npm package has been removed
4. All AI endpoints now use Gemini's API

No frontend changes required - the API interface remains the same!
