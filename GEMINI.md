# Enrollmate - AI-Assisted Course Scheduling System

## Project Overview

Enrollmate is a web application designed to assist students with course scheduling and enrollment management. It is built with Next.js and utilizes Supabase for its backend and database, with Tailwind CSS for styling. The architecture follows a Domain-Driven Design approach with a Data Access Object (DAO) pattern for API interactions.

The application allows users to manage courses across multiple semesters, save a personal library of courses, and automatically detect scheduling conflicts. It also supports importing courses from CSV files and provides API endpoints for a planned Chrome extension.

## Building and Running

### Prerequisites

- Node.js 18+
- npm
- A Supabase account and project

### Environment Setup

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env.local` file in the root of the project and add your Supabase project URL and public anon key:
    ```
    NEXT_PUBLIC_SUPABASE_API=https://your-project.supabase.co
    NEXT_PUBLIC_PUBLIC_API_KEY=your-anon-key
    ```

### Database Migrations

The project uses a series of SQL migration files to set up the database schema. These should be run in order through the Supabase SQL editor or a local client connected to your Supabase database. The migration files are located in the `migrations/` directory.

Example of applying a migration (as documented in `README.md`):
```bash
node migrations/apply-migration.js migrations/001_create_scheduler_tables.sql
```

### Running the Application

-   **Development:** To run the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

-   **Production Build:** To create a production build:
    ```bash
    npm run build
    ```

-   **Start Production Server:** To start the production server:
    ```bash
    npm run start
    ```

## Development Conventions

-   **ES Modules:** The project uses ES Modules. All imports must include the `.js` file extension.
-   **API Layer:** Backend interactions are abstracted into a dedicated API layer found in `lib/api/`. These modules (`userCourseAPI.js`, `scheduleAPI.js`, etc.) provide a clear and reusable interface for Supabase queries.
-   **Styling:** Styling is done using Tailwind CSS. Custom theme configurations can be found in `tailwind.config.js`.
-   **Database Security:** The database uses Supabase's Row-Level Security (RLS) to ensure that users can only access their own data.
-   **Component-Based UI:** The frontend is built with React components, located in `src/components/`. Pages are located in `src/app/`.
-   **Documentation:** The codebase is documented with `CLAUDE.md` files in various directories, providing context-specific information. The main API documentation is in `API_DOCUMENTATION.md`.
