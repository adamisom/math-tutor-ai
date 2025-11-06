# Guide: Finding Test Images for Math Problems

## Quick Answer: Best Sources for Typed Math Problem Images

### 🎯 **Easiest Method: Create Your Own**

**Option 1: Google Docs (Fastest)**
1. Open Google Docs
2. Type a math problem (e.g., "Solve for x: 2x + 5 = 13")
3. Use Insert > Equation for formatted math
4. Take a screenshot (Cmd+Shift+4 on Mac, Snipping Tool on Windows)
5. Save as PNG

**Option 2: LaTeX/Overleaf (Best Quality)**
1. Go to [Overleaf.com](https://www.overleaf.com) (free account)
2. Create a simple document:
   ```latex
   \documentclass{article}
   \begin{document}
   Solve for $x$: $2x + 5 = 13$
   \end{document}
   ```
3. Compile and download as PNG
4. Or screenshot the rendered output

**Option 3: Markdown with Math (GitHub-style)**
1. Use any markdown editor that supports LaTeX
2. Type: `Solve for $x$: $2x + 5 = 13$`
3. Render and screenshot

### 📚 **Online Math Problem Sources (Screenshot These)**

**Khan Academy**
- Go to any practice problem
- Screenshot the problem (not the answer)
- URL: https://www.khanacademy.org/math

**Mathway**
- Enter a problem to see it formatted
- Screenshot the problem display
- URL: https://www.mathway.com

**Wolfram Alpha**
- Enter a problem
- Screenshot the input/problem section
- URL: https://www.wolframalpha.com

**OpenStax Textbooks (Free)**
- Open any OpenStax math textbook
- Screenshot example problems
- URL: https://openstax.org/subjects/math

### 🖼️ **Stock Photo Sites (Search for "math equation" or "algebra problem")**

**Free Options:**
- **Unsplash** - Search "math equation" or "algebra"
- **Pexels** - Search "math problem"
- **Pixabay** - Search "mathematics equation"

**Note:** Most stock photos show handwritten math. For typed text, creating your own is better.

### 🛠️ **Programmatic Creation (For Multiple Test Images)**

**Python Script Example:**
```python
from PIL import Image, ImageDraw, ImageFont

# Create a simple image with text
img = Image.new('RGB', (800, 200), color='white')
draw = ImageDraw.Draw(img)
text = "Solve for x: 2x + 5 = 13"
draw.text((50, 50), text, fill='black')
img.save('sample-single-problem-1.png')
```

**HTML Canvas (Browser-based):**
```html
<canvas id="canvas" width="800" height="200"></canvas>
<script>
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = '24px Arial';
  ctx.fillText('Solve for x: 2x + 5 = 13', 50, 100);
  // Right-click and save as image
</script>
```

## Recommended Test Image Set

Create these specific images for comprehensive testing:

### Single Problem Images
1. **sample-single-algebra-1.png**
   - Content: "Solve for x: 2x + 5 = 13"
   - Type: Simple linear equation

2. **sample-single-algebra-2.png**
   - Content: "Solve: 3(x - 4) = 15"
   - Type: Multi-step with parentheses

3. **sample-single-fraction-1.png**
   - Content: "Add: 3/4 + 1/2"
   - Type: Fraction addition

4. **sample-single-geometry-1.png**
   - Content: "Find the area of a rectangle with length 8cm and width 5cm"
   - Type: Geometry word problem

5. **sample-single-word-1.png**
   - Content: "Sarah has 3 times as many apples as John. Together they have 24. How many does John have?"
   - Type: Word problem with variables

### Two Problem Images
6. **sample-two-problems-1.png**
   - Content: Two clear problems, numbered or separated
   - Example:
     ```
     1. Solve for x: 2x + 5 = 13
     2. Find the area of a rectangle with length 8cm and width 5cm
     ```

7. **sample-two-problems-2.png**
   - Content: Two different problem types
   - Example: One algebra, one geometry

### Edge Case Images
8. **sample-solution-detected-1.png**
   - Content: A completed solution (not a problem to solve)
   - Example: "x = 4" with work shown

9. **sample-unclear-1.png**
   - Content: Blurry or low-quality image
   - Purpose: Test error handling

10. **sample-multiple-problems-1.png**
    - Content: 3+ problems in one image
    - Purpose: Test MULTIPLE_PROBLEMS handling

## Quick Creation Workflow

1. **Open Google Docs** (fastest)
2. **Type problem** with equation editor if needed
3. **Screenshot** (Cmd+Shift+4 / Snipping Tool)
4. **Save as** `sample-[type]-[number].png` in `public/test-images/`
5. **Test immediately** in your app

## Image Quality Tips

- ✅ Use **high contrast** (black text on white background)
- ✅ Use **readable font size** (at least 12pt)
- ✅ **Clear spacing** between problems
- ✅ **PNG format** for text (better than JPEG)
- ✅ **At least 800px wide** for readability

## Testing Checklist

Once you have images:

- [ ] Single problem extraction works
- [ ] Two problem selection works
- [ ] Multiple problems (>2) handled correctly
- [ ] Solution detection works
- [ ] Unclear image handling works
- [ ] Low confidence extraction confirmation works
- [ ] Mobile camera upload works (if testing on mobile)

## File Organization

```
public/test-images/
├── README.md (this file)
├── sample-single-algebra-1.png
├── sample-single-algebra-2.png
├── sample-single-fraction-1.png
├── sample-single-geometry-1.png
├── sample-single-word-1.png
├── sample-two-problems-1.png
├── sample-two-problems-2.png
├── sample-solution-detected-1.png
├── sample-unclear-1.png
└── sample-multiple-problems-1.png
```

**Note:** Files with `sample-` prefix are committed to git. Other files are ignored.

