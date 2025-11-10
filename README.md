# AI Math Tutor

An intelligent math tutoring application that uses Socratic questioning to guide students through K-12 math problems. Built with Next.js, TypeScript, and Claude AI.

## Features

### Core Features
- **Socratic Tutoring**: Guides students through problems using questions, not direct answers
- **Math Verification**: Automatically verifies student answers using symbolic math tools
- **Image Upload**: Upload photos of math problems for automatic extraction
- **Multi-Problem Detection**: Handles images with multiple problems intelligently
- **LaTeX Rendering**: Beautiful math equation rendering (feature-flagged)

### Phase 6 Enhancements
- **Conversation History**: Searchable, filterable history of past sessions with export
- **XP System**: Gamification with points, levels, and progress tracking
- **AI Problem Generation**: Dynamically generate new problems with variety and difficulty matching
- **Voice Interface**: Text-to-Speech (TTS) and Speech-to-Text (STT) support
- **Polished Intro Screen**: Engaging welcome experience with animations

## Quick Start

See [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) for detailed setup instructions.

**TL;DR:**
```bash
git clone <repository-url>
cd math-tutor-ai
npm install
# Create .env.local with ANTHROPIC_API_KEY
npm run dev
# Open http://localhost:3000
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run all unit tests (166 tests)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:unit` - Run unit tests only
- `npm run test:dialogue` - Run dialogue quality testing script

### Project Structure

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
├── tests/                      # Test files (166 unit tests)
├── docs/                       # Documentation
└── scripts/                    # Utility scripts
```

## Testing

### Unit Tests

Run the unit test suite (166 tests):
```bash
npm run test
```

Tests cover: math verification, image processing, JSON/Latex parsing, feature flags, XP system, and problem completion detection.

### Dialogue Quality Testing

Test the Socratic dialogue quality systematically:
```bash
npm run test:dialogue
```

This will:
- Start the dev server (if not running)
- Cycle through all test problems
- Show expected patterns and red flags
- Guide you through systematic testing

See `docs/Testing-Framework-Usage-Guide.md` for detailed instructions.

### Manual Testing

Visit `/test` for a visual testing interface with:
- Test problem selection
- Expected patterns and red flags
- Pass/Fail tracking
- Tricky input scenarios

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy!

The app will automatically deploy on every push to your main branch.

### Environment Variables

Required:
- `ANTHROPIC_API_KEY` - Your Anthropic API key

Optional:
- `NEXT_PUBLIC_ENABLE_LATEX` - Set to `"true"` to enable LaTeX rendering (default: disabled)

## Architecture

### Core Components

- **ChatInterface**: Main chat component managing conversation state
- **MessageList**: Displays messages with LaTeX and markdown support
- **MessageInput**: Text input with image upload capability
- **ImageUpload**: Handles image processing and upload
- **ErrorBoundary**: Catches React errors and provides fallback UI

### Key Features

1. **Socratic Methodology**: The AI uses questions to guide students, never giving direct answers (except after 20+ attempts)
2. **Math Verification**: Uses `nerdamer` for symbolic math verification
3. **Image Processing**: Validates, compresses, and processes images before sending to Claude Vision API
4. **State Management**: React hooks with localStorage persistence
5. **Error Handling**: Retry mechanisms and error boundaries for resilience

## Documentation

### Setup & Development
- [Developer Setup Guide](./DEVELOPER_SETUP.md) - Complete setup instructions
- [Architecture](./docs/Architecture.md) - System architecture (v2.0 with Phase 6)
- [Quick Testing Guide](./docs/Quick-Testing-Guide.md) - Manual testing procedures

### Testing
- [Testing Framework Guide](./docs/Testing-Framework-Usage-Guide.md) - Automated dialogue quality testing
- [Socratic Evaluation Checklist](./docs/Socratic-Evaluation-Checklist.md) - Evaluation criteria

### Planning
- [PRD](./docs/PRD.md) - Product requirements document
- [Phase 6 Enhancements Planning](./docs/Phase6-Enhancements-Planning.md) - Phase 6 feature details

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm run test && npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, TypeScript, and Claude AI.
