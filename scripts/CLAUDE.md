# scripts/ - Utility Scripts

**Purpose**: Standalone Node.js scripts for development tasks, maintenance, and automation.

**Pattern**: Executable scripts that can be run independently via Node.js or npm.

**Remember**: Update `/CHANGELOG.md` after adding or modifying scripts.

---

## Files Overview

| File | Purpose | Usage |
|------|---------|-------|
| `create-placeholder-images.js` | Generate placeholder images for development | `node scripts/create-placeholder-images.js` |
| `download-assets.js` | Download external assets/resources | `node scripts/download-assets.js` |

---

## Key Principles

### 1. Standalone Execution
Scripts should run independently:
```javascript
// Top of script
#!/usr/bin/env node

// Can be executed directly
// chmod +x scripts/my-script.js
// ./scripts/my-script.js
```

### 2. Clear Purpose
Each script has one specific task:
- ✅ `create-placeholder-images.js` - Creates images
- ✅ `seed-database.js` - Seeds test data
- ❌ `do-stuff.js` - Unclear purpose

### 3. Error Handling
Scripts should handle errors gracefully:
```javascript
try {
  await performTask();
  console.log('✅ Task completed successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ Task failed:', error.message);
  process.exit(1);
}
```

### 4. Progress Feedback
Provide user feedback during execution:
```javascript
console.log('Starting process...');
console.log('Processing item 1/10...');
console.log('✅ Complete!');
```

---

## Script Details

### create-placeholder-images.js

**Purpose**: Generates placeholder images for development when actual assets aren't available.

**Use Cases**:
- Development without design assets
- Testing image upload functionality
- Filling in missing profile pictures

**Execution**:
```bash
node scripts/create-placeholder-images.js
```

**Output**:
- Creates images in `public/assets/images/placeholders/`
- Various sizes (100x100, 200x200, etc.)
- Different colors/patterns for visual distinction

### download-assets.js

**Purpose**: Downloads external assets or resources needed for the project.

**Use Cases**:
- Pulling assets from CDN or external sources
- Downloading sample data files
- Fetching icon packs or images

**Execution**:
```bash
node scripts/download-assets.js
```

**Features**:
- Progress indicators
- Retry logic for failed downloads
- Checksum verification

---

## Creating New Scripts

### Template Structure
```javascript
#!/usr/bin/env node

/**
 * Script: [Script Name]
 * Purpose: [What this script does]
 * Usage: node scripts/[filename].js
 */

// Imports
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  outputDir: './output',
  // Other config
};

// Main function
async function main() {
  try {
    console.log('Starting [task name]...');

    // Validate inputs
    validateConfig();

    // Perform task
    await performTask();

    console.log('✅ [Task name] completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Helper functions
function validateConfig() {
  // Validation logic
}

async function performTask() {
  // Main logic
}

// Execute
main();
```

### Best Practices

**DO**:
- ✅ Add usage instructions at top of file
- ✅ Use async/await for asynchronous operations
- ✅ Validate inputs/environment
- ✅ Log progress and results
- ✅ Exit with appropriate status codes (0 = success, 1 = error)
- ✅ Handle errors gracefully
- ✅ Make scripts idempotent (safe to re-run)

**DON'T**:
- ❌ Hardcode sensitive data (use env vars)
- ❌ Modify production database without confirmation
- ❌ Leave scripts without error handling
- ❌ Create destructive scripts without warnings

---

## Common Script Types

### Database Scripts
```javascript
// seed-database.js - Populate test data
// reset-database.js - Clear and reset tables
// backup-database.js - Create backup
```

### Asset Scripts
```javascript
// optimize-images.js - Compress images
// generate-thumbnails.js - Create thumbnail versions
// validate-assets.js - Check asset integrity
```

### Maintenance Scripts
```javascript
// cleanup-old-data.js - Remove outdated records
// verify-integrity.js - Check data consistency
// migrate-data.js - Transform data between formats
```

### Development Scripts
```javascript
// setup-dev.js - Initialize dev environment
// generate-test-data.js - Create test fixtures
// check-env.js - Validate environment variables
```

---

## NPM Script Integration

Add scripts to `package.json` for easy access:
```json
{
  "scripts": {
    "setup": "node scripts/setup-dev.js",
    "seed": "node scripts/seed-database.js",
    "placeholders": "node scripts/create-placeholder-images.js",
    "download-assets": "node scripts/download-assets.js"
  }
}
```

**Usage**:
```bash
npm run setup
npm run seed
npm run placeholders
```

---

## Environment Variables

Scripts may require environment variables:
```javascript
// Load from .env file
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_API;
const supabaseKey = process.env.NEXT_PUBLIC_PUBLIC_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}
```

---

## Testing Scripts

### Manual Testing
1. Run script with valid inputs
2. Verify expected output
3. Run again (test idempotency)
4. Test error cases
5. Check cleanup/rollback

### Automated Testing
```javascript
// scripts/__tests__/create-placeholder-images.test.js
describe('create-placeholder-images', () => {
  test('creates expected number of images', async () => {
    await createPlaceholderImages();
    const files = fs.readdirSync('./output');
    expect(files.length).toBe(5);
  });
});
```

---

## Future Scripts

Consider adding:
- `seed-courses.js` - Populate course catalog from CSV
- `generate-schedules.js` - Create test schedules
- `validate-data.js` - Check database integrity
- `backup-user-data.js` - Export user data
- `optimize-db.js` - Database maintenance tasks
- `generate-reports.js` - Analytics reports
- `cleanup-sessions.js` - Remove expired sessions

---

## Security Considerations

- Never commit scripts with hardcoded credentials
- Use environment variables for sensitive data
- Add confirmation prompts for destructive operations
- Validate all user inputs
- Log actions for audit trail

**Example Confirmation**:
```javascript
const readline = require('readline');

async function confirmAction(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

// Usage
const confirmed = await confirmAction('⚠️  This will delete all data. Continue?');
if (!confirmed) {
  console.log('Operation cancelled');
  process.exit(0);
}
```

---

**Last Updated**: 2025-11-07
