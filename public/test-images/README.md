# Test Images for Manual Testing

This directory contains sample images of math problems for testing the image upload and extraction features.

## Image Naming Convention

Use the prefix `sample-` for images you want to commit to the repository:
- `sample-single-problem-1.png` - Single problem examples
- `sample-two-problems-1.png` - Two problems in one image
- `sample-word-problem-1.png` - Word problems
- `sample-fraction-1.png` - Fraction problems
- etc.

**Note:** Files without the `sample-` prefix are git-ignored (see `.gitignore`)

## Where to Find Sample Images

### Option 1: Create Your Own (Recommended)
1. Use a text editor or LaTeX editor to create clean typed math problems
2. Take screenshots or export as PNG
3. Examples:
   - Google Docs with math equations
   - Overleaf (LaTeX editor) - export as PNG
   - Microsoft Word with equation editor
   - Any markdown editor with math rendering

### Option 2: Online Math Problem Generators
- **Khan Academy** - Screenshot practice problems
- **Mathway** - Screenshot example problems
- **Wolfram Alpha** - Screenshot problem displays
- **Desmos** - Screenshot graph problems

### Option 3: Educational Resources
- **OpenStax** textbooks - Screenshot example problems
- **CK-12** - Screenshot practice problems
- **Math worksheets** from educational sites

### Option 4: Create Simple Test Images Programmatically
You can create simple test images using:
- HTML canvas + screenshot
- Python with PIL/Pillow
- Online tools like Canva

## Recommended Test Image Types

### Single Problem Images
- Simple algebra: `2x + 5 = 13`
- Multi-step: `3(x - 4) = 15`
- Fractions: `3/4 + 1/2 = ?`
- Geometry: "Find the area of a rectangle with length 8cm and width 5cm"
- Word problems: "Sarah has 3 times as many apples as John..."

### Two Problem Images
- Two clear, separate problems
- Different difficulty levels
- Different problem types

### Edge Cases
- Blurry/unclear images
- Very small text
- Handwritten (for comparison)
- Solutions (to test SOLUTION_DETECTED)
- Non-math content

## Image Requirements

- **Format:** PNG, JPEG, or WebP
- **Size:** Under 10MB (will be compressed automatically)
- **Dimensions:** At least 100x100px
- **Quality:** Clear, readable text
- **Content:** K-12 math problems (algebra, geometry, fractions, word problems)

## Usage in Testing

1. Start the dev server: `npm run dev`
2. Navigate to the app
3. Click the image upload button
4. Select a test image from this directory
5. Verify:
   - Image is processed correctly
   - Problem is extracted accurately
   - Multi-problem selection works (if applicable)
   - Error handling works for edge cases

## Example Test Scenarios

1. **Single Problem Extraction**
   - Upload `sample-single-problem-1.png`
   - Verify problem text is extracted correctly
   - Verify conversation starts automatically

2. **Two Problem Selection**
   - Upload `sample-two-problems-1.png`
   - Verify both problems are shown
   - Verify selection works
   - Verify conversation starts with selected problem

3. **Error Handling**
   - Upload blurry image
   - Verify unclear image handling
   - Verify user can edit extracted text

4. **Solution Detection**
   - Upload image with solution
   - Verify SOLUTION_DETECTED is handled correctly

