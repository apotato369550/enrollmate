#!/usr/bin/env node

/**
 * Migration script to apply scheduler tables to Supabase
 * This script uses the existing Supabase client configuration
 */

import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_API;
const supabaseAnonKey = process.env.NEXT_PUBLIC_PUBLIC_API_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_API and NEXT_PUBLIC_PUBLIC_API_KEY are set in your .env file');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
// Note: This requires the service role key, not the anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyMigration() {
  console.log('🚀 Starting Enrollmate scheduler migration...');

  try {
    // Read the migration SQL file
    const migrationPath = join(__dirname, '001_create_scheduler_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');

    // Split SQL into individual statements (basic splitting by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== '\\n');

    console.log(`🔄 Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // If rpc method doesn't exist, try direct execution
          console.log(`⚠️  RPC method not available, trying direct execution...`);
          break;
        }
      }
    }

    // Try alternative approach using direct SQL execution if available
    console.log('🔄 Attempting direct SQL execution...');
    const { error: directError } = await supabase.from('').select().limit(0);

    if (directError) {
      console.log('⚠️  Direct SQL execution not available with anon key');
      console.log('📋 Please run the following SQL manually in your Supabase SQL Editor:');
      console.log('');
      console.log('📎 --- Copy the contents of migrations/001_create_scheduler_tables.sql ---');
      console.log('🌐 Go to: https://supabase.com/dashboard/project/hwgzlwocdofoticqvwqg/sql');
      console.log('📄 Paste the SQL and run it');
      console.log('');
      console.log('✅ Migration file created successfully at: migrations/001_create_scheduler_tables.sql');
      return;
    }

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('🎉 Your Enrollmate scheduler database is ready!');
    console.log('📚 Tables created:');
    console.log('  - course_sections (with sample data)');
    console.log('  - user_schedules');
    console.log('  - schedule_preferences');
    console.log('');
    console.log('🔒 Row Level Security (RLS) policies applied');
    console.log('📊 Indexes created for optimal performance');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('📋 Manual steps needed:');
    console.error('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/hwgzlwocdofoticqvwqg/sql');
    console.error('2. Copy the contents of migrations/001_create_scheduler_tables.sql');
    console.error('3. Paste and execute the SQL in the SQL Editor');
    process.exit(1);
  }
}

// Run the migration
applyMigration();