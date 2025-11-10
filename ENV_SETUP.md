# Environment Setup Guide

## Required: Anthropic API Key

To test the AI Math Tutor, you'll need an Anthropic API key.

### 1. Get Your API Key
1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key

### 2. Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy this to .env.local and add your actual API key
ANTHROPIC_API_KEY=sk-ant-api03-your_actual_api_key_here
```

**Important:** Never commit your actual API key to version control!

### 3. Test the Application

```bash
# Start the development server
npm run dev

# Open http://localhost:3000 in your browser
# Try the test problem: "2x + 5 = 13"
```

### 4. Expected Behavior

The AI tutor should:
- ✅ Ask guiding questions like "What are we trying to find?"
- ✅ Guide you through the solution step by step
- ✅ Use encouraging language: "Great!", "Exactly!", "You're on track!"
- ❌ **NEVER** give direct answers like "x = 4" or "The answer is..."

### 5. Test Problems

Try these problems to verify Socratic methodology:
- `2x + 5 = 13`
- `3(x - 4) = 15`
- `Find the area of a rectangle with length 8cm and width 5cm`
- `3/4 + 1/2`
- `Sarah has 3 times as many apples as John. Together they have 24. How many does John have?`

### Troubleshooting

- **"Server configuration error"** → Check your API key in `.env.local`
- **Network errors** → Check your internet connection
- **Rate limiting** → Wait a minute and try again


