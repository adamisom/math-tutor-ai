# AI Math Tutor

An intelligent math tutoring application that uses Socratic questioning to guide students through K-12 math problems. Built with Next.js, TypeScript, and Claude AI.

## Features

- **Socratic Tutoring**: Guides students through problems using questions, not direct answers
- **Math Verification**: Automatically verifies student answers using symbolic math tools
- **Image Upload**: Upload photos of math problems for automatic extraction
- **Multi-Problem Detection**: Handles images with multiple problems intelligently
- **Conversation Persistence**: Saves your conversation automatically
- **LaTeX Rendering**: Beautiful math equation rendering (feature-flagged)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Anthropic API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd math-tutor-ai
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
ANTHROPIC_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:unit` - Run unit tests only
- `npm run test:dialogue` - Run dialogue quality testing script

### Project Structure

```
math-tutor-ai/
├── app/
│   ├── api/              # API routes
│   │   ├── chat/         # Main chat endpoint
│   │   └── chat/image-extract/  # Image extraction endpoint
│   ├── components/        # React components
│   │   ├── chat-interface.tsx
│   │   ├── message-list.tsx
│   │   ├── message-input.tsx
│   │   ├── image-upload.tsx
│   │   ├── problem-selector.tsx
│   │   └── error-boundary.tsx
│   ├── lib/              # Utility functions
│   │   ├── prompts.ts    # AI system prompts
│   │   ├── math-verification.ts
│   │   ├── image-processing.ts
│   │   └── ...
│   ├── page.tsx          # Home page
│   └── test/             # Testing interface
├── tests/                # Test files
├── docs/                 # Documentation
└── scripts/              # Utility scripts
```

## Testing

### Unit Tests

Run the unit test suite:
```bash
npm run test
```

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

- [Architecture](./docs/Architecture.md) - Application architecture
- [PRD](./docs/PRD.md) - Product requirements document
- [Implementation Tasks](./docs/Implementation_Tasks.md) - Development roadmap
- [Testing Framework Guide](./docs/Testing-Framework-Usage-Guide.md) - How to test dialogue quality
- [Socratic Evaluation Checklist](./docs/Socratic-Evaluation-Checklist.md) - Evaluation criteria

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
