# migrations/ - Database Schema Migrations

**Purpose**: Sequential SQL migrations for database schema evolution and version control.

**Pattern**: Numbered migration files applied in order, never modify existing migrations.

**Remember**: Update `/CHANGELOG.md` after creating new migrations.

---

## Migration Files

| File | Version | Purpose |
|------|---------|---------|
| `001_create_scheduler_tables.sql` | v0.0.1 | Initial tables: profiles, courses, sections |
| `002_create_semester_architecture.sql` | v0.0.5 | Semesters, semester_courses, schedules refactor |
| `003_fix_cascade_delete.sql` | v0.0.8 | Fix ON DELETE CASCADE constraints |
| `004_private_schedules_and_saved_courses.sql` | v0.1.0 | Private schedules, user_courses table |
| `apply-migration.js` | - | Node.js script for applying migrations |

---

## Key Principles

### 1. Sequential Migrations
Migrations are applied in numerical order:
```
001 → 002 → 003 → 004 → ...
```

**Never**:
- Modify existing migrations after they're applied
- Skip migration numbers
- Reorder migrations

**Always**:
- Create new migration for changes
- Use next sequential number
- Include rollback logic (if possible)

### 2. Idempotent Migrations
Migrations should be safely re-runnable:
```sql
-- ✅ CORRECT (idempotent)
CREATE TABLE IF NOT EXISTS schedules (...);

DROP TABLE IF EXISTS old_table;

ALTER TABLE schedules ADD COLUMN IF NOT EXISTS new_column TEXT;

-- ❌ WRONG (not idempotent)
CREATE TABLE schedules (...);  -- Fails if exists

DROP TABLE old_table;  -- Fails if doesn't exist
```

### 3. Descriptive Naming
Use clear, descriptive names:
```
✅ 005_add_course_prerequisites.sql
✅ 006_create_waitlist_tables.sql
❌ 005_update.sql
❌ 006_changes.sql
```

---

## Migration Details

### 001: Initial Scheduler Tables
**Purpose**: Create foundational tables for user profiles and course sections.

**Tables Created**:
- `profiles` - User profile data (1:1 with auth.users)
- `courses` - Course catalog
- `sections` - Course sections with schedules

**Key Features**:
- Row-Level Security (RLS) policies
- Foreign key constraints
- Indexes on frequently queried columns

### 002: Semester Architecture
**Purpose**: Introduce semester-based organization with many-to-many relationships.

**Changes**:
- Created `semesters` table (semester containers)
- Created `semester_courses` table (courses per semester)
- Created `schedules` table (student schedules)
- Created `schedule_courses` join table (many-to-many)
- Refactored data model from flat to hierarchical

**Migration Path**:
- Data migration from old structure to new
- Preserved existing user data

### 003: Fix Cascade Delete
**Purpose**: Ensure proper cascade deletion when users are deleted.

**Changes**:
- Updated all `user_id` foreign keys to `ON DELETE CASCADE`
- Ensures orphaned data is cleaned up
- Applied to: schedules, semesters, profiles

**Why Needed**:
- Original migrations used `ON DELETE RESTRICT`
- Prevented user account deletion
- Manual cleanup was error-prone

### 004: Private Schedules & User Courses
**Purpose**: Add private schedules and user course library features.

**Changes**:
- Added `is_private` column to schedules
- Made `semester_id` nullable for private schedules
- Added CHECK constraint for private schedule logic
- Created `user_courses` table (max 50 per user)
- Added `source` column ('manual', 'csv', 'extension')

**Business Rules Enforced**:
```sql
CHECK (
  (is_private = true AND semester_id IS NULL) OR
  (is_private = false AND semester_id IS NOT NULL)
)
```

---

## Applying Migrations

### Using apply-migration.js Script
```bash
# Apply single migration
node migrations/apply-migration.js migrations/001_create_scheduler_tables.sql

# Apply all migrations in order
node migrations/apply-migration.js migrations/001_create_scheduler_tables.sql
node migrations/apply-migration.js migrations/002_create_semester_architecture.sql
node migrations/apply-migration.js migrations/003_fix_cascade_delete.sql
node migrations/apply-migration.js migrations/004_private_schedules_and_saved_courses.sql
```

### Manual Application (Supabase Dashboard)
1. Open Supabase dashboard
2. Navigate to SQL Editor
3. Copy migration SQL
4. Execute query
5. Verify changes

---

## Creating New Migrations

### Step 1: Create File
```bash
touch migrations/005_your_migration_name.sql
```

### Step 2: Write Migration SQL
```sql
-- migrations/005_add_course_prerequisites.sql

-- Add prerequisites table
CREATE TABLE IF NOT EXISTS course_prerequisites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES semester_courses(id) ON DELETE CASCADE,
  prerequisite_id UUID REFERENCES semester_courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, prerequisite_id)
);

-- Add RLS policies
ALTER TABLE course_prerequisites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view prerequisites"
  ON course_prerequisites FOR SELECT
  USING (true);  -- Public read

-- Add indexes
CREATE INDEX idx_prerequisites_course ON course_prerequisites(course_id);
```

### Step 3: Test Migration
```bash
# Test on development database first
node migrations/apply-migration.js migrations/005_add_course_prerequisites.sql

# Verify tables created
# Check RLS policies applied
# Test application functionality
```

### Step 4: Update Documentation
- Update `/CHANGELOG.md` with changes
- Update root `/CLAUDE.md` if schema significantly changed
- Document new tables/columns

---

## Migration Best Practices

### DO
- ✅ Add IF NOT EXISTS clauses
- ✅ Include rollback instructions in comments
- ✅ Test on development database first
- ✅ Back up production before applying
- ✅ Add indexes for foreign keys
- ✅ Enable RLS on all user tables
- ✅ Use transactions for complex migrations

### DON'T
- ❌ Modify existing migrations
- ❌ Delete old migrations
- ❌ Apply migrations out of order
- ❌ Skip migration testing
- ❌ Forget RLS policies
- ❌ Forget to update CHANGELOG.md

---

## Common Migration Patterns

### Adding a Column
```sql
ALTER TABLE schedules
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
```

### Creating Index
```sql
CREATE INDEX IF NOT EXISTS idx_schedules_user_semester
ON schedules(user_id, semester_id);
```

### Adding RLS Policy
```sql
CREATE POLICY "Users can update their own schedules"
  ON schedules FOR UPDATE
  USING (auth.uid() = user_id);
```

### Renaming Column
```sql
-- Rename with data preservation
ALTER TABLE schedules
RENAME COLUMN old_name TO new_name;
```

### Dropping Column
```sql
-- Drop with safety check
ALTER TABLE schedules
DROP COLUMN IF EXISTS deprecated_column;
```

---

## Rollback Strategy

For reversible migrations, include rollback SQL in comments:
```sql
-- Migration: Add priority column
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- Rollback:
-- ALTER TABLE schedules DROP COLUMN IF EXISTS priority;
```

---

## Testing Migrations

1. **Apply to development database**
2. **Verify schema changes**
   - Check tables created
   - Verify columns added
   - Test RLS policies
3. **Test application functionality**
   - Run app against new schema
   - Test affected features
   - Check for errors
4. **Test data migration** (if applicable)
   - Verify data transformed correctly
   - Check no data loss
   - Validate relationships

---

**Last Updated**: 2025-11-07
