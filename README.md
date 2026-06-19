# Book and Notes Tracker

This is a simple offline website to track books read, pages, and take notes.

## Chosen Theme
- Book & Notes Vault (Theme 3)

## Features
1. **Stats Dashboard**: Displays cataloged book count, total pages read, favorite category tag, and goal progress.
2. **Weekly Reading Chart**: Renders a bar graph showing pages read day-by-day for the last 7 days.
3. **Goal Progress Ring**: An SVG circle that changes fill state depending on goal percentage completion.
4. **Activity Logs list**: Automatically updates a ledger list of recent user actions.
5. **My Books Grid/Table**: Shows a list of all active books with search, sort, and notes details.
6. **Input Validation**: Form checks all inputs using regular expressions before saving.
7. **Soft-Delete Recycle Bin**: Deleted books are sent here for 7 days before permanent purge.
8. **JSON Export and Import**: Allows saving a copy of the database as a file and restoring from it.

## Regex in the book tracker

| Field | Pattern | Example Match | Example Fail |
|---|---|---|---|
| **Title** | `/^\S(?:.*\S)?$/` | `Chemistry 101` | ` Chemistry ` (spaces at ends) |
| **Pages** | `/^[1-9]\d*$/` | `342` | `0` or `-15` (non-positive integers) |
| **Date** | `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | `2025-09-29` | `29-09-2025` (DD-MM-YYYY) |
| **Tag** | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | `Fiction-Novel` | `Sci3nce!` (numbers and specials) |
| **Author** | `/^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ -][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/` | `Kush Kush` | `Jane D0e` (numbers) |
| **ISBN** | `/^(?:97[89][ -]?)?\d{1,5}[ -]?\d{1,7}[ -]?\d{1,7}[ -]?[\dX]$/i` | `9780132350884` | `9780132350880` (checksum fails) |
| **Double Word** | `/\b(\w+)\s+\1\b/i` | `The The Hobbit` | `The Hobbit` (no repeating word) |

## Keyboard Map
- `Tab` / `Shift + Tab`: Focus navigation links, inputs, and buttons.
- `Enter` / `Space`: Click focused links and buttons.
- Accesskeys to jump tabs (using `Alt + [Number]` on Windows or `Ctrl + Option + [Number]` on Mac):
  - `Alt + 1`: About Page
  - `Alt + 2`: Dashboard Page
  - `Alt + 3`: My Books Page
  - `Alt + 4`: Add Book Page
  - `Alt + 5`: Settings Page

## Accessibility (a11y) Notes
- **Skip Link**: An invisible link at the top appears when focused via keyboard to skip navigation directly to the main content.
- **Visual Focus Outline**: Focused items receive a prominent orange outline.
- **ARIA Live Region**: The monthly goal element announces status updates (like goal completion or form errors) to screen readers.

## How to Run Tests
1. Start a local server (e.g. `npx serve` or Live Server) in the repository folder.
2. Open `tests.html` in your web browser.
3. The page runs unit tests and shows PASS/FAIL outputs.

## Demo Video  
https://drive.google.com/file/d/18QzfNaaGy3FPFP7Xb5vN-Fg2zg5kfTOV/view?usp=sharing