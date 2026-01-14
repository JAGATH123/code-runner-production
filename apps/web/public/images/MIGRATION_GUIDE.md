# Image Migration Guide

This guide helps you migrate existing images to the new organized folder structure.

## Current Images to Migrate

Based on the current `/images/` folder, here are the images that need to be moved:

### Background Images (Backdrop)

Move these to the backdrop folder:

1. **15-18 bg 1.png** → `15-18/backdrop/bg-1.png`
2. **15-18 bg 2.png** → `15-18/backdrop/bg-2.png`

### Session-specific Images (Flowcharts for Arena Warm-Up)

Move these to their respective session flashcards folders:

1. **if statement.png** → `11-14/sessions/session-5/flashcards/if-statement.png`
2. **if-else statement.png** → `11-14/sessions/session-5/flashcards/if-else-statement.png`
3. **elif.png** → `11-14/sessions/session-5/flashcards/elif.png`
4. **nested elif.png** → `11-14/sessions/session-6/flashcards/nested-elif.png`
5. **comparison operator.jpg** → `11-14/sessions/session-5/flashcards/comparison-operator.jpg`

### Cheat Sheet Images

Move these to the cheat-sheet folder for the appropriate session:

1. **cheet sheet 3.png** → `11-14/sessions/session-X/cheat-sheet/cheat-sheet.png`
   - Replace `X` with the appropriate session number (1-10)
   - Rename to `cheat-sheet.png` for consistency

## Migration Steps

### Step 1: Move Backdrop Images

```bash
# Move background images to backdrop folders
cd "D:\LOF\PROJECTS\LOF\Code_Runner-main\public\images"

move "15-18 bg 1.png" "15-18/backdrop/bg-1.png"
move "15-18 bg 2.png" "15-18/backdrop/bg-2.png"
```

### Step 2: Move Flashcard Images (Arena Warm-Up)

```bash
# Example for Session 5 if statement images
cd "D:\LOF\PROJECTS\LOF\Code_Runner-main\public\images"

# Move if statement images to Session 5
move "if statement.png" "11-14/sessions/session-5/flashcards/if-statement.png"
move "if-else statement.png" "11-14/sessions/session-5/flashcards/if-else-statement.png"
move "elif.png" "11-14/sessions/session-5/flashcards/elif.png"
move "comparison operator.jpg" "11-14/sessions/session-5/flashcards/comparison-operator.jpg"

# Move nested elif to Session 6
move "nested elif.png" "11-14/sessions/session-6/flashcards/nested-elif.png"
```

### Step 3: Move Cheat Sheet Images

```bash
# Determine which session the cheat sheet belongs to
# Then move it to that session's cheat-sheet folder

# Example for Session 1:
move "cheet sheet 3.png" "11-14/sessions/session-1/cheat-sheet/cheat-sheet.png"
```

### Step 4: Update Database (if needed)

If you stored image paths in the database `introduction_content` field, update them:

**Old format:**
```
1. if statement.png
➡️ Explanation text
```

**New format (no change needed - code handles it automatically):**
```
1. if-statement.png
➡️ Explanation text
```

The code will automatically construct the full path using the session's age_group and session_id.

## Adding New Images

### For Arena Warm-Up (Flashcards)

1. Navigate to the session's flashcards folder:
   ```
   /images/11-14/sessions/session-X/flashcards/
   ```

2. Add your flowchart/concept images:
   ```
   concept-1.png
   concept-2.png
   variables.png
   loops.png
   ```

3. Reference them in the database `introduction_content`:
   ```
   1. variables.png
   ➡️ Variables are containers for storing data

   2. loops.png
   ➡️ Loops allow you to repeat code
   ```

### For Cheat Sheets

1. Navigate to the session's cheat-sheet folder:
   ```
   /images/11-14/sessions/session-X/cheat-sheet/
   ```

2. Add your cheat sheet image:
   ```
   cheat-sheet.png
   ```

3. The code automatically loads `cheat-sheet.png` from this folder

### For Code Convergence (Mini Project)

1. **Flashcards (Arena Warm-Up):**
   ```
   /images/11-14/mini-project/flashcards/
   ```

2. **Cheat Sheet:**
   ```
   /images/11-14/mini-project/cheat-sheet/
   ```

### For Backdrop (Background Images)

1. **Age Group 11-14:**
   ```
   /images/11-14/backdrop/
   ```
   Add: `bg-1.png`, `bg-2.png`, `background.png`, etc.

2. **Age Group 15-18:**
   ```
   /images/15-18/backdrop/
   ```
   Add: `bg-1.png`, `bg-2.png`, `background.png`, etc.

**Usage in Code:**
```typescript
import { getBackdropPath } from '@/lib/imagePaths';

// Get backdrop image
const bgImage = getBackdropPath('11-14', 'bg-1.png');
// Returns: /images/11-14/backdrop/bg-1.png
```

## Quick Reference

| Content Type | Age Group | Session | Image Type | Path |
|-------------|-----------|---------|------------|------|
| Flowchart | 11-14 | 1-10 | Flashcard | `/images/11-14/sessions/session-X/flashcards/` |
| Cheat Sheet | 11-14 | 1-10 | Reference | `/images/11-14/sessions/session-X/cheat-sheet/` |
| Code Convergence Flowchart | 11-14 | - | Flashcard | `/images/11-14/mini-project/flashcards/` |
| Code Convergence Cheat Sheet | 11-14 | - | Reference | `/images/11-14/mini-project/cheat-sheet/` |
| Backdrop | 11-14 | - | Background | `/images/11-14/backdrop/` |
| Flowchart | 15-18 | 1-10 | Flashcard | `/images/15-18/sessions/session-X/flashcards/` |
| Cheat Sheet | 15-18 | 1-10 | Reference | `/images/15-18/sessions/session-X/cheat-sheet/` |
| Backdrop | 15-18 | - | Background | `/images/15-18/backdrop/` |

## File Naming Best Practices

- Use lowercase with hyphens: `if-statement.png`, `for-loop.png`
- Be descriptive: `nested-if-flowchart.png` instead of `concept1.png`
- For cheat sheets, use consistent naming: `cheat-sheet.png`
- Avoid spaces in filenames
- Supported formats: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`
