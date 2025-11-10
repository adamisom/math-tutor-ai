# Developer Setup Guide

Quick guide to get the AI Math Tutor running locally for development.

## Prerequisites

- **Node.js** 18+ and npm
- **Anthropic API Key** (required for AI features)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd math-tutor-ai
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the project root:

```bash
# Required: Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-api03-your_actual_api_key_here

# Optional: Enable LaTeX rendering (default: disabled)
NEXT_PUBLIC_ENABLE_LATEX=true
```

**Getting Your API Key:**
1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to **API Keys**
4. Create a new API key
5. Copy it to `.env.local`

**⚠️ Important:** Never commit your actual API key to version control! The `.env.local` file is already in `.gitignore`.

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Scripts

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint -- --fix  # Fix linting issues

# Testing
npm run test            # Run all unit tests (166 tests)
npm run test:watch      # Run tests in watch mode
npm run test:unit       # Run unit tests only
npm run test:dialogue  # Run dialogue quality testing script
```

## Verify Setup

### Test Basic Functionality

Try this test problem: `2x + 5 = 13`

**Expected Behavior:**
- ✅ AI asks guiding questions like "What are we trying to find?"
- ✅ Guides you through the solution step by step
- ✅ Uses encouraging language: "Great!", "Exactly!", "You're on track!"
- ❌ **NEVER** gives direct answers like "x = 4" or "The answer is..."

### Test Problems

Try these to verify Socratic methodology:
- `2x + 5 = 13`
- `3(x - 4) = 15`
- `Find the area of a rectangle with length 8cm and width 5cm`
- `3/4 + 1/2`
- `Sarah has 3 times as many apples as John. Together they have 24. How many does John have?`

## Project Structure

```
math-tutor-ai/
├── app/
│   ├── api/                    # API routes
│   │   ├── chat/               # Main chat endpoint
│   │   ├── chat/generate-problem/  # AI problem generation (Phase 6)
│   │   └── chat/image-extract/ # Image extraction endpoint
│   ├── components/             # React components
│   │   ├── chat-interface.tsx
│   │   ├── conversation-history.tsx  # Phase 6
│   │   ├── xp-display.tsx      # Phase 6
│   │   ├── voice-controls.tsx  # Phase 6
│   │   ├── problem-generator.tsx # Phase 6
│   │   ├── intro-screen.tsx    # Phase 6
│   │   └── ...
│   ├── lib/                    # Utility functions
│   │   ├── prompts.ts          # AI system prompts
│   │   ├── xp-system.ts        # Phase 6: XP calculation
│   │   ├── conversation-history.ts  # Phase 6: History management
│   │   ├── tts.ts              # Phase 6: Text-to-speech
│   │   ├── stt.ts              # Phase 6: Speech-to-text
│   │   └── ...
│   ├── page.tsx                # Home page
│   └── test/                   # Testing interface
├── tests/                      # Test files
│   └── unit/                   # Unit tests (166 tests)
├── docs/                       # Documentation
│   ├── Architecture.md         # System architecture
│   ├── Quick-Testing-Guide.md  # Manual testing guide
│   └── ...
└── scripts/                    # Utility scripts
```

## Testing

### Unit Tests

```bash
npm run test
```

Runs 166 unit tests covering:
- Math verification
- Image processing
- JSON parsing
- LaTeX parsing
- Feature flags
- **XP system** (Phase 6)
- **Problem completion detection** (Phase 6)

### Dialogue Quality Testing

```bash
npm run test:dialogue
```

Systematically tests all problems for Socratic methodology. See `docs/Testing-Framework-Usage-Guide.md` for details.

### Manual Testing

Visit `/test` for visual testing interface with test problem selection and quality tracking.

## Troubleshooting

### "Server configuration error"
- Check your API key in `.env.local`
- Verify the key starts with `sk-ant-`
- Ensure `.env.local` is in the project root (not in a subdirectory)

### Network errors
- Check your internet connection
- Verify Anthropic API is accessible
- Check browser console for detailed error messages

### Rate limiting
- Anthropic API has rate limits
- Wait a minute and try again
- Check your API usage in Anthropic console

### Build errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Test failures
```bash
# Clear test cache
rm -rf node_modules/.vite
npm run test
```

## Browser Compatibility

### Voice Features (Phase 6)
- **Chrome/Edge**: Full TTS + STT support
- **Safari**: TTS supported, limited STT
- **Firefox**: Limited voice support
- **Mobile**: iOS Safari (TTS), Android Chrome (full support)

Voice features gracefully degrade in unsupported browsers.

## Next Steps

- Read [Architecture.md](./docs/Architecture.md) for system design
- Check [Quick-Testing-Guide.md](./docs/Quick-Testing-Guide.md) for testing procedures
- Review [Phase6-Enhancements-Planning.md](./docs/Phase6-Enhancements-Planning.md) for Phase 6 features

---

**Need help?** Open an issue on GitHub or check the documentation in `docs/`.

