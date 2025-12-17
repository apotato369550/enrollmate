#!/usr/bin/env node

/**
 * Run database migrations on Vercel deployment
 * Requires: SUPABASE_SERVICE_ROLE_KEY environment variable
 *
 * Usage:
 *   node scripts/run-migrations.js          # Run all migrations
 *   node scripts/run-migrations.js 001      # Run specific migration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_API;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_API not set');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
  console.error('⚠️  Migrations require service role key for admin access');
  console.error('📖 Learn more: https://supabase.com/docs/guides/api#service-role-key');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

/**
 * Get list of migration files
 */
function getMigrationFiles() {
  const migrationsDir = join(__dirname, '..', 'migrations');
  return readdirSync(migrationsDir)
    .filter(file => file.match(/^\d{3}_.*\.sql$/))
    .sort();
}

/**
 * Check if migration has been applied
 */
async function isMigrationApplied(migrationName) {
  try {
    // Check if migration log exists
    const { data } = await supabase
      .from('_migration_log')
      .select('name')
      .eq('name', migrationName)
      .single();

    return !!data;
  } catch (error) {
    // Table doesn't exist yet (first migration)
    if (error.code === 'PGRST116') {
      return false;
    }
    throw error;
  }
}

/**
 * Log applied migration
 */
async function logMigration(migrationName) {
  try {
    await supabase
      .from('_migration_log')
      .insert({ name: migrationName, applied_at: new Date().toISOString() });
  } catch (error) {
    // Table might not exist yet, skip logging
    if (error.code === 'PGRST116') {
      console.log('⚠️  Migration log table not yet created, skipping log');
      return;
    }
    throw error;
  }
}

/**
 * Create migration log table if it doesn't exist
 */
async function ensureMigrationLogTable() {
  try {
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS _migration_log (
          id BIGSERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          applied_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    });
  } catch (error) {
    // RPC doesn't exist, will create table via first migration
    console.log('ℹ️  Migration log table will be created via first migration');
  }
}

/**
 * Apply a single migration
 */
async function applyMigration(filePath, migrationName) {
  console.log(`\n📄 Applying migration: ${migrationName}`);

  // Check if already applied
  const alreadyApplied = await isMigrationApplied(migrationName);
  if (alreadyApplied) {
    console.log(`✅ Already applied, skipping...`);
    return;
  }

  try {
    const sql = readFileSync(filePath, 'utf8');

    // Execute migration
    console.log(`⚡ Executing SQL...`);
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      throw new Error(`SQL execution failed: ${error.message}`);
    }

    // Log successful migration
    await logMigration(migrationName);
    console.log(`✅ Migration applied successfully`);
  } catch (error) {
    console.error(`❌ Migration failed: ${error.message}`);
    throw error;
  }
}

/**
 * Run all migrations
 */
async function runMigrations() {
  console.log('🚀 Enrollmate Database Migration Runner\n');

  try {
    // Ensure migration log table exists
    await ensureMigrationLogTable();

    const files = getMigrationFiles();

    if (files.length === 0) {
      console.log('⚠️  No migration files found in migrations/ directory');
      return;
    }

    console.log(`📋 Found ${files.length} migration(s)\n`);

    const migrationsDir = join(__dirname, '..', 'migrations');

    for (const file of files) {
      const filePath = join(migrationsDir, file);
      await applyMigration(filePath, file);
    }

    console.log('\n🎉 All migrations completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed!\n');
    console.error('Troubleshooting:');
    console.error('1. Verify SUPABASE_SERVICE_ROLE_KEY is set correctly');
    console.error('2. Check Supabase project status (not paused)');
    console.error('3. Ensure service role key has admin privileges');
    console.error('4. Check migration SQL syntax in migrations/ directory\n');
    process.exit(1);
  }
}

// Run migrations
runMigrations();
