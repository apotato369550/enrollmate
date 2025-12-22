# scripts/ - Utility Scripts

This directory contains standalone Node.js scripts that are used for various development, maintenance, and automation tasks. These scripts are designed to be run independently from the main application.

## Key Principles

-   **Standalone Execution:** Each script is self-contained and can be run directly from the command line using Node.js.
-   **Clear Purpose:** Each script has a single, well-defined purpose, which is reflected in its filename.
-   **Error Handling:** The scripts are written to handle errors gracefully and provide clear feedback to the user.
-   **Progress Feedback:** The scripts provide progress feedback to the user during execution, so it is clear what is happening.

## Files Overview

-   `create-placeholder-images.js`: This script generates placeholder images for use in development when the actual design assets are not yet available. This is useful for testing image upload functionality and for filling in missing images in the UI.
-   `download-assets.js`: This script downloads external assets or resources that are needed for the project, such as sample data files or icon packs.
-   `run-migrations.js`: This script is used to apply the database migrations to the Supabase database.
