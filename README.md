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

See [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) for:
- Development scripts
- Project structure
- Testing procedures
- Troubleshooting

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy!

The app will automatically deploy on every push to your main branch.


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
