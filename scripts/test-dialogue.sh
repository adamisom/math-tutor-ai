#!/bin/bash

# AI Math Tutor - Dialogue Quality Testing Script
# This script helps systematically test dialogue quality across all test problems

set -e

echo "🧪 AI Math Tutor - Dialogue Quality Testing"
echo "========================================="
echo ""

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "⚠️  Development server not detected at http://localhost:3000"
  echo "📦 Starting development server..."
  echo ""
  npm run dev > /dev/null 2>&1 &
  DEV_PID=$!
  echo "⏳ Waiting for server to start..."
  sleep 8
  
  # Check if server started successfully
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server started successfully!"
    echo "🌐 Open http://localhost:3000 in your browser"
    echo ""
    echo "⚠️  Note: Server is running in background (PID: $DEV_PID)"
    echo "   To stop it later, run: kill $DEV_PID"
    echo ""
  else
    echo "❌ Failed to start server. Please start it manually: npm run dev"
    exit 1
  fi
else
  echo "✅ Development server is already running at http://localhost:3000"
  echo ""
fi

echo "📋 Testing Instructions:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. For each problem below, enter it in the chat"
echo "3. Have a conversation with the AI tutor"
echo "4. Use the evaluation checklist (docs/Socratic-Evaluation-Checklist.md)"
echo "5. Press Enter when you've completed testing this problem"
echo ""
echo "🔍 Quick Evaluation Checklist:"
echo "   □ Opens with questions (not direct solving)"
echo "   □ Asks 'What do we know?' or 'What are we finding?'"
echo "   □ Guides method selection without giving method"
echo "   □ Validates each student step before proceeding"
echo "   □ Provides hints (not answers) when student stuck >2 turns"
echo "   □ Uses encouraging language consistently"
echo "   □ NEVER gives direct numerical answers"
echo "   □ Maintains Socratic method throughout"
echo ""
echo "📊 Full checklist available at: docs/Socratic-Evaluation-Checklist.md"
echo ""
echo "Press Enter to start testing..."
read

# Use Node.js to read and display test problems
node << 'EOF'
const fs = require('fs');
const path = require('path');

// Read test problems
const testProblemsPath = path.join(__dirname, '../tests/unit/test-problems.ts');
let testProblemsContent = fs.readFileSync(testProblemsPath, 'utf8');

// Extract TEST_PROBLEMS array (simple parsing)
const problems = [];
const problemMatches = testProblemsContent.matchAll(/{\s*id:\s*['"]([^'"]+)['"],\s*type:\s*['"]([^'"]+)['"],\s*problem:\s*['"]([^'"]+)['"],[\s\S]*?expectedPatterns:\s*\[([^\]]+)\],[\s\S]*?redFlags:\s*\[([^\]]+)\]/g);

for (const match of problemMatches) {
  const [, id, type, problem, patternsStr, flagsStr] = match;
  
  // Parse arrays (simple extraction)
  const expectedPatterns = patternsStr
    .split(',')
    .map(p => p.trim().replace(/^['"]|['"]$/g, ''))
    .filter(p => p);
  
  const redFlags = flagsStr
    .split(',')
    .map(f => f.trim().replace(/^['"]|['"]$/g, ''))
    .filter(f => f);
  
  problems.push({ id, type, problem, expectedPatterns, redFlags });
}

if (problems.length === 0) {
  console.log('⚠️  Could not parse test problems. Using fallback...');
  // Fallback: hardcode a few problems
  problems.push(
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
  );
}

console.log(`\n📚 Found ${problems.length} test problems\n`);
console.log("=" .repeat(60));
console.log("");

problems.forEach((problem, index) => {
  console.log(`\n📝 Problem ${index + 1}/${problems.length}: ${problem.type.toUpperCase()}`);
  console.log("─".repeat(60));
  console.log(`Problem: ${problem.problem}`);
  console.log("");
  console.log("✅ Expected Patterns (look for these):");
  problem.expectedPatterns.forEach(pattern => {
    console.log(`   • ${pattern}`);
  });
  console.log("");
  console.log("❌ Red Flags (should NOT appear):");
  problem.redFlags.forEach(flag => {
    console.log(`   • ${flag}`);
  });
  console.log("");
  console.log("─".repeat(60));
  console.log("");
  console.log("⏸️  Press Enter when you've tested this problem...");
  console.log("   (Or type 'skip' to skip, 'quit' to exit)");
  
  // Wait for user input
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('', (answer) => {
      rl.close();
      if (answer.toLowerCase() === 'quit' || answer.toLowerCase() === 'q') {
        console.log("\n👋 Exiting test suite. Goodbye!");
        process.exit(0);
      }
      if (answer.toLowerCase() !== 'skip' && answer.toLowerCase() !== 's') {
        resolve();
      } else {
        console.log("⏭️  Skipping this problem...\n");
        resolve();
      }
    });
  });
}).then(() => {
  console.log("\n" + "=".repeat(60));
  console.log("✅ Testing complete!");
  console.log("");
  console.log("📝 Next steps:");
  console.log("   1. Review your notes from each problem");
  console.log("   2. Fill out evaluation checklists");
  console.log("   3. Document any issues found");
  console.log("   4. Update prompts if needed");
  console.log("");
  console.log("📊 Evaluation checklist: docs/Socratic-Evaluation-Checklist.md");
  console.log("");
});
EOF

echo ""
echo "✨ Test session complete!"
echo ""

