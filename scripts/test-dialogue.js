#!/usr/bin/env node

/**
 * Cross-platform test dialogue script (Node.js version)
 * Works on Windows, macOS, and Linux
 */

const { spawn } = require('child_process');
const http = require('http');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const SERVER_URL = 'http://localhost:3000';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(SERVER_URL, () => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    log('📦 Starting development server...', 'yellow');
    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'ignore',
      shell: true,
    });

    let attempts = 0;
    const maxAttempts = 30; // 15 seconds max

    const checkInterval = setInterval(async () => {
      attempts++;
      const isRunning = await checkServerRunning();
      
      if (isRunning) {
        clearInterval(checkInterval);
        log('✅ Server started successfully!', 'green');
        resolve(devProcess);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        devProcess.kill();
        reject(new Error('Server failed to start within timeout'));
      }
    }, 500);
  });
}

function parseTestProblems() {
  const testProblemsPath = path.join(__dirname, '../tests/unit/test-problems.ts');
  const content = fs.readFileSync(testProblemsPath, 'utf8');
  
  const problems = [];
  
  // Simple regex-based parsing (works for most cases)
  const problemRegex = /{\s*id:\s*['"]([^'"]+)['"],\s*type:\s*['"]([^'"]+)['"],\s*problem:\s*['"]([^'"]+)['"],[\s\S]*?expectedPatterns:\s*\[([^\]]+)\],[\s\S]*?redFlags:\s*\[([^\]]+)\]/g;
  
  let match;
  while ((match = problemRegex.exec(content)) !== null) {
    const [, id, type, problem, patternsStr, flagsStr] = match;
    
    const expectedPatterns = patternsStr
      .split(',')
      .map(p => p.trim().replace(/^['"]|['"]$/g, ''))
      .filter(p => p && !p.includes('Tool verification')); // Filter out common pattern
    
    const redFlags = flagsStr
      .split(',')
      .map(f => f.trim().replace(/^['"]|['"]$/g, ''))
      .filter(f => f);
    
    problems.push({ id, type, problem, expectedPatterns, redFlags });
  }
  
  // Fallback if parsing fails
  if (problems.length === 0) {
    log('⚠️  Could not parse test problems. Using fallback...', 'yellow');
    return [
      {
        id: 'algebra-1',
        type: 'algebra',
        problem: '2x + 5 = 13',
        expectedPatterns: ['What are we trying to find?', 'What operation', 'How do we undo', 'subtract 5'],
        redFlags: ['x = 4', 'x equals 4', 'The answer is', 'Therefore x = 4']
      },
      {
        id: 'geometry-1',
        type: 'geometry',
        problem: 'Find the area of a rectangle with length 8cm and width 5cm',
        expectedPatterns: ['formula', 'length times width', 'What formula', 'area formula'],
        redFlags: ['40 cm²', '8 × 5 = 40', 'The area is 40']
      }
    ];
  }
  
  return problems;
}

async function waitForInput(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  log('🧪 AI Math Tutor - Dialogue Quality Testing', 'bright');
  log('=========================================', 'bright');
  log('');
  
  // Check if server is running
  const isRunning = await checkServerRunning();
  let devProcess = null;
  
  if (!isRunning) {
    try {
      devProcess = await startServer();
      log(`🌐 Open ${SERVER_URL} in your browser`, 'cyan');
      log('');
      log('⚠️  Note: Server is running in background', 'yellow');
      log('   Press Ctrl+C to stop the server when done', 'yellow');
      log('');
    } catch (error) {
      log('❌ Failed to start server. Please start it manually: npm run dev', 'red');
      process.exit(1);
    }
  } else {
    log(`✅ Development server is already running at ${SERVER_URL}`, 'green');
    log('');
  }
  
  log('📋 Testing Instructions:', 'bright');
  log('1. Open http://localhost:3000 in your browser');
  log('2. For each problem below, enter it in the chat');
  log('3. Have a conversation with the AI tutor');
  log('4. Use the evaluation checklist (docs/Socratic-Evaluation-Checklist.md)');
  log('5. Press Enter when you\'ve completed testing this problem');
  log('');
  log('🔍 Quick Evaluation Checklist:', 'bright');
  log('   □ Opens with questions (not direct solving)');
  log('   □ Asks "What do we know?" or "What are we finding?"');
  log('   □ Guides method selection without giving method');
  log('   □ Validates each student step before proceeding');
  log('   □ Provides hints (not answers) when student stuck >2 turns');
  log('   □ Uses encouraging language consistently');
  log('   □ NEVER gives direct numerical answers');
  log('   □ Maintains Socratic method throughout');
  log('');
  log('📊 Full checklist available at: docs/Socratic-Evaluation-Checklist.md', 'cyan');
  log('');
  
  await waitForInput('Press Enter to start testing...');
  
  const problems = parseTestProblems();
  log(`\n📚 Found ${problems.length} test problems\n`, 'bright');
  log('='.repeat(60), 'bright');
  log('');
  
  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];
    
    log(`\n📝 Problem ${i + 1}/${problems.length}: ${problem.type.toUpperCase()}`, 'bright');
    log('─'.repeat(60));
    log(`Problem: ${problem.problem}`, 'cyan');
    log('');
    log('✅ Expected Patterns (look for these):', 'green');
    problem.expectedPatterns.forEach(pattern => {
      log(`   • ${pattern}`, 'green');
    });
    log('');
    log('❌ Red Flags (should NOT appear):', 'red');
    problem.redFlags.forEach(flag => {
      log(`   • ${flag}`, 'red');
    });
    log('');
    log('─'.repeat(60));
    log('');
    
    const answer = await waitForInput('⏸️  Press Enter when done (or type "skip" to skip, "quit" to exit): ');
    
    if (answer === 'quit' || answer === 'q') {
      log('\n👋 Exiting test suite. Goodbye!', 'yellow');
      if (devProcess) {
        devProcess.kill();
      }
      process.exit(0);
    }
    
    if (answer === 'skip' || answer === 's') {
      log('⏭️  Skipping this problem...\n', 'yellow');
      continue;
    }
  }
  
  log('\n' + '='.repeat(60), 'bright');
  log('✅ Testing complete!', 'green');
  log('');
  log('📝 Next steps:', 'bright');
  log('   1. Review your notes from each problem');
  log('   2. Fill out evaluation checklists');
  log('   3. Document any issues found');
  log('   4. Update prompts if needed');
  log('');
  log('📊 Evaluation checklist: docs/Socratic-Evaluation-Checklist.md', 'cyan');
  log('');
  
  if (devProcess) {
    log('⚠️  Server is still running. Press Ctrl+C to stop it.', 'yellow');
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n\n👋 Exiting...', 'yellow');
  process.exit(0);
});

main().catch((err) => {
  log(`\n❌ Error: ${err.message}`, 'red');
  process.exit(1);
});

