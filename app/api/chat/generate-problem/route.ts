import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { NextRequest } from 'next/server';

const PROBLEM_GENERATION_PROMPT = `You are a math problem generator. Generate educational math problems that are appropriate for students.

REQUIREMENTS:
1. Generate problems that can be solved using Socratic questioning (not just calculation)
2. Match the specified math field and difficulty level
3. Problems should be clear, well-formatted, and educational
4. Include variety - don't generate the same problem repeatedly

RESPONSE FORMAT (JSON only):
{
  "problem": "The math problem text",
  "type": "Algebra" | "Geometry" | "Word Problem" | "Fractions" | "Calculus",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "hints": ["hint 1", "hint 2"],
  "estimatedTime": 5
}

MATH FIELD VARIETIES:

Algebra:
- Beginner: Simple linear equations (2x + 5 = 13)
- Intermediate: Multi-step equations, distributive property, variables on both sides
- Advanced: Complex multi-step, absolute value, quadratic simplification

Geometry:
- Beginner: Area/perimeter of basic shapes
- Intermediate: Pythagorean theorem, angle problems
- Advanced: Complex area calculations, coordinate geometry

Word Problems:
- Beginner: Simple one-step word problems
- Intermediate: Multi-step with variables, ratios, percentages
- Advanced: Complex real-world scenarios, mixture problems

Fractions:
- Beginner: Basic addition/subtraction
- Intermediate: Mixed numbers, multiplication, division
- Advanced: Complex operations, order of operations

Calculus:
- Beginner: Basic derivatives (power rule)
- Intermediate: Chain rule, product rule
- Advanced: Integration, complex derivatives

DIFFICULTY GUIDELINES:
- Beginner: 1-2 steps, straightforward concepts
- Intermediate: 3-4 steps, requires some reasoning
- Advanced: 5+ steps, complex reasoning, multiple concepts

Generate a problem now based on the requested type and difficulty.`;

export async function POST(req: NextRequest) {
  try {
    const { type, difficulty, excludeProblems = [] } = await req.json();
    
    const validTypes = ['Algebra', 'Geometry', 'Word Problem', 'Fractions', 'Calculus'];
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    
    if (!validTypes.includes(type) || !validDifficulties.includes(difficulty)) {
      return new Response(
        JSON.stringify({ error: 'Invalid type or difficulty' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const exclusionText = excludeProblems.length > 0
      ? `\n\nEXCLUDE THESE PROBLEMS (generate something different):\n${excludeProblems.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}`
      : '';
    
    const fullPrompt = `${PROBLEM_GENERATION_PROMPT}\n\nGenerate a ${difficulty} ${type} problem.${exclusionText}`;
    
    const result = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt: fullPrompt,
      temperature: 0.8,
      maxTokens: 500,
    });
    
    let problemData;
    try {
      problemData = JSON.parse(result.text);
    } catch (parseError) {
      const problemMatch = result.text.match(/problem["\s:]+"([^"]+)"/i);
      if (problemMatch) {
        problemData = {
          problem: problemMatch[1],
          type,
          difficulty,
        };
      } else {
        throw new Error('Failed to parse problem generation response');
      }
    }
    
    if (!problemData.problem) {
      throw new Error('Generated problem is empty');
    }
    
    return new Response(
      JSON.stringify(problemData),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Problem generation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate problem' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

