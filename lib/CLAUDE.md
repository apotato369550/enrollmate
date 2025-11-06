# lib/ - Backend Business Logic

**Purpose**: Server-side business logic layer with domain models, data access, and core scheduling algorithms.

**Module Type**: ES Modules (always use `.js` extensions in imports)

**Remember**: Update `/CHANGELOG.md` after any changes to this directory.

---

## Directory Structure

```
lib/
├── api/          # Data Access Objects (DAOs) - Database operations
├── domain/       # Domain models - Business entities with behavior
├── scheduler/    # Core scheduling engine - Conflict detection & parsing
└── utils/        # Shared utility functions
```

---

## Key Principles

### 1. Separation of Concerns
- **api/**: Pure database operations, no business logic
- **domain/**: Business logic, validation, state management
- **scheduler/**: Algorithm implementations (conflict detection, parsing)
- **utils/**: Reusable helper functions

### 2. Data Flow
```
Frontend → API Layer (DAOs) → Database
              ↓
         Domain Models (business logic)
              ↓
         Scheduler Engine (algorithms)
```

### 3. Import Pattern
```javascript
// Always use .js extensions
import { ScheduleAPI } from './api/scheduleAPI.js';
import { Schedule } from './domain/Schedule.js';
import { SchedulerEngine } from './scheduler/SchedulerEngine.js';
```

### 4. Error Handling
All API methods should throw descriptive errors:
```javascript
if (error) {
  throw new Error(`Failed to [operation]: ${error.message}`);
}
```

---

## Subdirectory Contexts

- **api/**: See `lib/api/CLAUDE.md` for DAO patterns and database operations
- **domain/**: See `lib/domain/CLAUDE.md` for domain model design and business logic
- **scheduler/**: See `lib/scheduler/CLAUDE.md` for scheduling algorithms
- **utils/**: See `lib/utils/CLAUDE.md` for utility functions

---

## Common Patterns

### Factory Pattern
Domain models use static factory methods:
```javascript
static fromDatabase(data) {
  return new Schedule(
    data.id,
    data.semester_id,  // snake_case → camelCase
    data.user_id,
    // ...
  );
}
```

### DAO Pattern
All database operations go through static API classes:
```javascript
const schedule = await ScheduleAPI.getScheduleById(id);
```

### Strategy Pattern
Multiple parser implementations extend abstract base class:
```javascript
class ScheduleParser {
  parse(scheduleString) { throw new Error('Must implement'); }
}

class StandardScheduleParser extends ScheduleParser {
  parse(scheduleString) { /* implementation */ }
}
```

---

## Testing Considerations

- Unit test domain model methods independently
- Mock Supabase client for API layer tests
- Test scheduler engine with various schedule formats
- Validate error handling in all layers

---

**Last Updated**: 2025-11-07
