# Level 2, Session 1 Cheat Sheet

## Nested Loops - Mastering Multi-Level Iteration

This folder contains the cheat sheet image for Level 2, Session 1: Nested Loops.

### Required Image
- **Filename**: `cheat-sheet.png`
- **Format**: PNG (portrait orientation recommended)
- **Content**: Quick reference guide for nested loops concepts

### Nested Loops Concepts to Include

1. **Basic Nested Loop Structure**
   ```python
   for i in range(3):
       for j in range(2):
           print(i, j)
   ```

2. **Three-Level Nesting**
   ```python
   for i in range(2):
       for j in range(2):
           for k in range(2):
               print(i, j, k)
   ```

3. **Nested Loops with Variable Steps**
   ```python
   for i in range(1, 4):
       for j in range(10, 0, -2):
           print(i, j)
   ```

4. **Nested Loops with Conditionals**
   ```python
   for i in range(3):
       for j in range(4):
           if j % 2 == 0:
               print(f"Even: {j}")
   ```

5. **Variable Bounds in Nested Loops**
   ```python
   start = 5
   for i in range(1, 4):
       for j in range(start, 0, -1):
           print(i, j)
   ```

### Design Guidelines
- Use space theme colors (cyan/blue #00BFFF)
- Clear, readable font (Terminal Grotesque or monospace)
- Include syntax examples with proper indentation
- Add visual hierarchy for different nesting levels
- Keep it concise - this is a quick reference guide

### File Path Expected by App
The app will look for the image at:
```
/images/11-14/level-2/sessions/session-1/cheat-sheet/cheat-sheet.png
```

Place your cheat sheet image in this directory with the filename `cheat-sheet.png`.
