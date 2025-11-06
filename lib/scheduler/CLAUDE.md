# lib/scheduler/ - Scheduling Engine

**Purpose**: Core scheduling algorithms including conflict detection, schedule parsing, and time overlap analysis.

**Pattern**: Strategy pattern for parsers, utility classes for detection algorithms.

**Remember**: Update `/CHANGELOG.md` after any changes to this directory.

---

## Files Overview

| File | Purpose | Key Components |
|------|---------|----------------|
| `SchedulerEngine.js` | Core scheduling algorithms | ScheduleParser, StandardScheduleParser, ConflictDetector |
| `schedulerAPI.js` | Legacy data access | (Consider deprecating in favor of lib/api/) |

---

## Architecture

### Class Hierarchy

```
ScheduleParser (abstract)
    ↓
StandardScheduleParser (concrete)

ConflictDetector (static utility)
```

### Design Pattern: Strategy Pattern

Multiple parser implementations can be swapped:
```javascript
// Abstract base
class ScheduleParser {
  parse(scheduleString) {
    throw new Error('Must implement parse()');
  }
}

// Concrete implementation
class StandardScheduleParser extends ScheduleParser {
  parse(scheduleString) {
    // Parsing logic
  }
}

// Easy to extend
class CustomScheduleParser extends ScheduleParser {
  parse(scheduleString) {
    // Different parsing logic
  }
}
```

---

## ScheduleParser (Abstract Base Class)

**Purpose**: Defines interface for schedule string parsing.

**Key Method**:
- `parse(scheduleString)` - Must be implemented by subclasses

**Utility Method**:
- `toMinutes(timeStr)` - Converts "HH:MM AM/PM" to minutes from midnight

**Example**:
```javascript
// "10:00 AM" → 600 minutes (10 * 60)
// "02:30 PM" → 870 minutes (14 * 60 + 30)
```

---

## StandardScheduleParser

**Purpose**: Parses standard schedule format: `"MW 10:00 AM - 11:30 AM"`

### Input Format
```
[Days] [Start Time] - [End Time]

Days: M, T, W, Th, F, S, Su (no spaces)
Time: HH:MM AM/PM
```

### Parse Output
```javascript
{
  days: ['M', 'W'],      // Array of day codes
  startTime: 600,        // Minutes from midnight (10:00 AM)
  endTime: 690           // Minutes from midnight (11:30 AM)
}
```

### Supported Day Codes
- M = Monday
- T = Tuesday
- W = Wednesday
- Th = Thursday
- F = Friday
- S = Saturday
- Su = Sunday

### Edge Cases
- Handles spaces: `"M W 10:00 AM - 11:30 AM"` (though format should be `"MW"`)
- Validates time format
- Returns null for invalid formats

---

## ConflictDetector

**Purpose**: Detects time conflicts between two course sections.

**Key Method**:
```javascript
static hasConflict(section1, section2)
// Returns: boolean
```

### Conflict Detection Algorithm

**Step 1**: Parse both schedule strings
```javascript
const schedule1 = parser.parse(section1.schedule);
const schedule2 = parser.parse(section2.schedule);
```

**Step 2**: Check day overlap
```javascript
const daysOverlap = schedule1.days.some(day =>
  schedule2.days.includes(day)
);
```

**Step 3**: Check time overlap
```javascript
const timeOverlap =
  schedule1.startTime < schedule2.endTime &&
  schedule2.startTime < schedule1.endTime;
```

**Step 4**: Return result
```javascript
return daysOverlap && timeOverlap;
```

### Time Overlap Logic

Two time ranges overlap if:
```
start1 < end2 AND start2 < end1
```

**Visual Examples**:

```
Conflict:
  Course A: |-------|
  Course B:     |-------|
  (10:00-11:30 and 11:00-12:30 overlap)

No Conflict:
  Course A: |-------|
  Course B:           |-------|
  (10:00-11:30 and 12:00-1:30 don't overlap)

No Conflict (different days):
  Course A: MW 10:00-11:30
  Course B: TF 10:00-11:30
  (Same time but different days)
```

### Edge Cases Handled
- Same day, different times → no conflict
- Different days, same time → no conflict
- Back-to-back classes (end = start) → no conflict
- TBA or flexible schedules → special handling needed

---

## Usage Examples

### Basic Conflict Check
```javascript
import { ConflictDetector } from './SchedulerEngine.js';

const course1 = {
  schedule: 'MW 10:00 AM - 11:30 AM'
};

const course2 = {
  schedule: 'MW 11:00 AM - 12:30 PM'
};

if (ConflictDetector.hasConflict(course1, course2)) {
  console.log('Conflict detected!');
}
```

### Parsing Custom Schedule
```javascript
import { StandardScheduleParser } from './SchedulerEngine.js';

const parser = new StandardScheduleParser();
const parsed = parser.parse('TThF 02:00 PM - 03:30 PM');

console.log(parsed.days);       // ['T', 'Th', 'F']
console.log(parsed.startTime);  // 840 (2:00 PM)
console.log(parsed.endTime);    // 930 (3:30 PM)
```

### Batch Conflict Detection
```javascript
function hasAnyConflict(newCourse, existingCourses) {
  return existingCourses.some(course =>
    ConflictDetector.hasConflict(newCourse, course)
  );
}
```

---

## Extending the Engine

### Adding New Parser
```javascript
class FlexibleScheduleParser extends ScheduleParser {
  parse(scheduleString) {
    // Handle TBA, online, asynchronous schedules
    if (scheduleString === 'TBA') {
      return { days: [], startTime: 0, endTime: 0 };
    }
    // Custom parsing logic
  }
}
```

### Parser Selection Strategy
```javascript
class ScheduleParserFactory {
  static getParser(scheduleType) {
    switch(scheduleType) {
      case 'standard':
        return new StandardScheduleParser();
      case 'flexible':
        return new FlexibleScheduleParser();
      default:
        return new StandardScheduleParser();
    }
  }
}
```

---

## Performance Considerations

- Parsing is O(1) for fixed format
- Conflict detection is O(n) where n = number of courses in schedule
- Consider caching parsed schedules if checking same courses repeatedly
- Batch operations use Array.some() for early exit

---

## Testing Guidelines

### Test Cases for Parser
- Standard format: `"MW 10:00 AM - 11:30 AM"`
- Multi-day: `"MWF 10:00 AM - 11:30 AM"`
- Afternoon: `"TF 02:00 PM - 03:30 PM"`
- Single day: `"F 09:00 AM - 12:00 PM"`
- Edge times: `"M 12:00 PM - 01:00 PM"` (noon/1pm)
- Invalid formats: `"Invalid"`, `""`, `null`

### Test Cases for Conflict Detection
- Same day, overlapping time → conflict
- Same day, non-overlapping time → no conflict
- Different days, same time → no conflict
- Back-to-back classes → no conflict
- Completely contained schedule → conflict
- Partial overlap → conflict

---

## Future Enhancements

- Support for TBA/flexible schedules
- Block schedule parsing (e.g., "MWF blocks")
- Break time considerations (5-minute buffer)
- Multi-location conflict detection
- Optimization for large schedule sets

---

**Last Updated**: 2025-11-07
