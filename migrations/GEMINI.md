# migrations/ - Database Schema Migrations

This directory contains the SQL migration files that define the database schema for the Enrollmate application. The migrations are designed to be sequential and idempotent, allowing for a safe and repeatable process for evolving the database schema.

## Key Principles

-   **Sequential Migrations:** The migration files are numbered and must be applied in sequential order. This ensures that the database schema is always in a consistent state.
-   **Idempotent Migrations:** Each migration is written to be safely re-runnable without causing errors. This is achieved by using `IF NOT EXISTS` and other defensive SQL statements.
-   **Descriptive Naming:** The migration files are named descriptively to make it easy to understand the purpose of each migration at a glance.
-   **No Modification of Existing Migrations:** Once a migration has been applied, it should never be modified. Any changes to the schema should be made in a new migration file.

## Applying Migrations

The migrations are applied using the `apply-migration.js` script in this directory. The script takes a migration file as an argument and applies it to the database.

```bash
# Apply a single migration
node migrations/apply-migration.js migrations/001_create_scheduler_tables.sql
```

## Creating New Migrations

New migrations should be created with the next sequential number and a descriptive name. The SQL in the migration file should be idempotent and, if possible, include rollback instructions in the comments.
