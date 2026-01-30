# Cheat Sheet Seed Scripts

This folder contains database seed scripts for populating cheat sheets for each session.

## Structure

Each script follows the naming convention: `seed-session-{N}-cheatsheet.ts`

- `seed-session-1-cheatsheet.ts` - Session 1: Understanding Output & Displaying Messages in Python

## Usage

Run from the project root:

```bash
# Seed Session 1
npx tsx scripts/seed-session-1-cheatsheet.ts

# Future sessions
npx tsx scripts/seed-session-2-cheatsheet.ts
npx tsx scripts/seed-session-3-cheatsheet.ts
# ... etc
```

## Script Template

Each script should include:
- **session_id**: Unique session number
- **age_group**: '11-14' or '15-18'
- **level_number**: 1-4
- **title**: Session title from database
- **subtitle**: Usually "QUICK REFERENCE"
- **boxes**: Array of exactly 5 boxes with:
  - number (1-5)
  - title
  - description
  - code_example (use `\\n` for line breaks)
  - tip (use `\\n` for multi-line tips with bullet points)

## Notes

- Scripts automatically update existing cheat sheets if they exist
- Line breaks in code_example and tip use `\\n` which gets converted to actual line breaks
- Multi-line tips will automatically render with bullet points for each line
