# lib/utils/ - Shared Utilities

**Purpose**: Reusable utility functions and helpers used across the application.

**Pattern**: Pure functions, stateless utilities, no business logic.

**Remember**: Update `/CHANGELOG.md` after any changes to this directory.

---

## Files Overview

| File | Purpose | Key Functions |
|------|---------|---------------|
| `pdfExporter.js` | PDF export functionality | Schedule to PDF conversion |

---

## Key Principles

### 1. Pure Functions
Utilities should be pure (no side effects, same input → same output):
```javascript
// ✅ GOOD (pure function)
function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

// ❌ BAD (side effects)
let counter = 0;
function formatTime(minutes) {
  counter++;  // Side effect!
  return `${minutes} minutes`;
}
```

### 2. No Business Logic
Utilities are generic helpers, not domain-specific:
```javascript
// ❌ BAD (business logic)
function canAddCourse(schedule, course) {
  return schedule.courses.length < 10 && !schedule.hasConflict(course);
}

// ✅ GOOD (generic utility)
function arrayHasItems(arr, minLength = 1) {
  return Array.isArray(arr) && arr.length >= minLength;
}
```

### 3. Self-Contained
Each utility should be independent:
```javascript
// Import only what's needed
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// No dependencies on domain models or API layer
```

---

## pdfExporter.js

**Purpose**: Exports schedules as PDF documents using jsPDF and html2canvas.

**Key Function**:
```javascript
exportScheduleToPDF(scheduleElement, filename)
// scheduleElement: DOM element to capture
// filename: Output PDF filename
```

**Process**:
1. Capture DOM element as canvas (html2canvas)
2. Convert canvas to image data
3. Create PDF document (jsPDF)
4. Add image to PDF
5. Download PDF with specified filename

**Usage Example**:
```javascript
import { exportScheduleToPDF } from '../../lib/utils/pdfExporter.js';

const scheduleDiv = document.getElementById('schedule-container');
await exportScheduleToPDF(scheduleDiv, 'My-Schedule-A.pdf');
```

**Dependencies**:
- `jspdf` - PDF generation library
- `html2canvas` - DOM to canvas conversion

**Configuration Options**:
- Page size: A4 (default)
- Orientation: Portrait/Landscape
- Image quality: Adjustable

---

## Guidelines for Adding New Utilities

### When to Create a Utility
- Function is used in 3+ places
- Logic is domain-agnostic
- Function is pure (no side effects)
- Provides generic transformation/formatting

### File Organization
- One utility per file (or related utilities grouped)
- Named exports for functions
- Clear JSDoc comments

### Example Structure
```javascript
/**
 * Formats a date object to YYYY-MM-DD string
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

---

## Common Utility Categories

### Time Utilities
- Time format conversions
- Duration calculations
- Time range validations

### String Utilities
- Text formatting
- Sanitization
- Truncation/ellipsis

### Array Utilities
- Sorting
- Filtering
- Grouping/chunking

### Validation Utilities
- Input validation
- Format checking
- Range validation

---

## Testing Guidelines

- Test with various inputs (valid, invalid, edge cases)
- Verify pure functions (same input → same output)
- Test error handling
- Mock external dependencies (like DOM for PDF export)

---

## Future Enhancements

- CSV parser utility
- Date/time formatting helpers
- String manipulation utilities
- Array sorting/filtering helpers
- Validation utilities (email, phone, etc.)

---

**Last Updated**: 2025-11-07
