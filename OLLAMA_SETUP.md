# Setting Up Local AI (Ollama) - Free & Unlimited

## Step 1: Install Ollama

1. Download Ollama for Windows from: **https://ollama.com/download**
2. Run the installer
3. Ollama will start automatically in the background

## Step 2: Pull a Model

Open PowerShell or Command Prompt and run:

```bash
# Recommended: Llama 3 (8B) - Fast and capable
ollama pull llama3

# OR Alternative: Mistral (7B) - Also excellent
ollama pull mistral

# OR For better quality (but slower): Llama 3.1 (8B)
ollama pull llama3.1
```

**Wait for the download to complete** (will take a few minutes depending on your internet speed)

## Step 3: Verify Installation

Test that Ollama is running:

```bash
ollama list
```

You should see your downloaded model listed.

## Step 4: Configuration Already Done! ✅

Your `.env` file is ready. I just need to switch it to `local` mode.

## What You Get

- ✅ **100% Free** - No API costs ever
- ✅ **Unlimited Requests** - No rate limits
- ✅ **Privacy** - Your data never leaves your computer
- ✅ **Offline Capable** - Works without internet (after model download)

## Model Recommendations

- **llama3** - Best balance of speed and quality (recommended)
- **mistral** - Slightly faster, good quality
- **llama3.1** - Better quality, slower
- **qwen2.5** - Great for academic writing

Once you've installed Ollama and pulled a model, let me know and I'll restart the server!
