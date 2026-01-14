# Image Organization Structure

This document explains the organized image folder structure for Code Runner.

## Folder Structure

```
images/
├── 11-14/                          # Age group 11-14
│   ├── backdrop/                   # Background images for 11-14 age group
│   ├── level-1/                    # Level 1 (Novice Operator)
│   │   ├── sessions/               # Regular sessions 1-10
│   │   │   ├── session-1/
│   │   │   │   ├── flashcards/    # Flowchart images for Arena Warm-Up
│   │   │   │   └── cheat-sheet/   # Cheat sheet images
│   │   │   ├── session-2/ to session-10/
│   │   │   │   ├── flashcards/
│   │   │   │   └── cheat-sheet/
│   │   └── mini-project/           # Code Convergence
│   │       ├── flashcards/        # Flowchart images for Code Convergence intro
│   │       └── cheat-sheet/       # Cheat sheet for Code Convergence
│   ├── level-2/                    # Level 2 (same structure as level-1)
│   │   ├── sessions/               # Sessions 1-10
│   │   │   └── session-1/ to session-10/
│   │   └── mini-project/
│   ├── level-3/                    # Level 3 (same structure)
│   │   ├── sessions/
│   │   └── mini-project/
│   └── level-4/                    # Level 4 (same structure)
│       ├── sessions/
│       └── mini-project/
│
└── 15-18/                          # Age group 15-18
    ├── backdrop/                   # Background images for 15-18 age group
    ├── level-1/ to level-4/        # Same structure as 11-14
    │   ├── sessions/
    │   │   └── session-1/ to session-10/
    │   │       ├── flashcards/
    │   │       └── cheat-sheet/
    │   └── mini-project/
    │       ├── flashcards/
    │       └── cheat-sheet/
```

## Image Naming Convention

### Flashcards (Arena Warm-Up)
- Place flowchart/concept images in the `flashcards/` folder
- Name format: `concept-1.png`, `concept-2.png`, etc.
- OR descriptive names: `variables.png`, `loops.png`, etc.

### Cheat Sheets
- Place cheat sheet reference images in the `cheat-sheet/` folder
- Name format: `cheat-sheet.png` or `reference.png`
- Can have multiple images: `cheat-sheet-1.png`, `cheat-sheet-2.png`, etc.

### Backdrop (Background Images)
- Place background/backdrop images in the `backdrop/` folder
- These are age-group specific, not session-specific
- Name format: `bg-1.png`, `bg-2.png`, `background.png`, etc.
- Used for page backgrounds, hero sections, etc.

## Usage in Code

The application automatically reads images from the appropriate folders based on:
- Age group (11-14 or 15-18)
- Level number (1-4)
- Session ID (1-10)
- Content type (flashcards or cheat-sheet)

### Example Paths:
- Arena Warm-Up Session 1 (Level 1): `/images/11-14/level-1/sessions/session-1/flashcards/`
- Cheat Sheet Session 5 (Level 1): `/images/11-14/level-1/sessions/session-5/cheat-sheet/`
- Arena Warm-Up Session 3 (Level 2): `/images/11-14/level-2/sessions/session-3/flashcards/`
- Code Convergence Intro (Level 1): `/images/11-14/level-1/mini-project/flashcards/`
- Code Convergence Cheat Sheet (Level 2): `/images/11-14/level-2/mini-project/cheat-sheet/`
- Background Images (11-14): `/images/11-14/backdrop/`
- Background Images (15-18): `/images/15-18/backdrop/`

## Migration Notes

Old images in root `/images/` folder should be moved to appropriate folders:
- `if statement.png` → `11-14/level-1/sessions/session-5/flashcards/if-statement.png`
- `cheet sheet 3.png` → `11-14/level-1/sessions/session-X/cheat-sheet/cheat-sheet.png`
- Background images → `11-14/backdrop/` or `15-18/backdrop/`

### Important
- Each level (1-4) has its own complete set of sessions (1-10) and mini-project folders
- All levels follow the same structure for consistency
- Images are organized by level to support progressive difficulty
