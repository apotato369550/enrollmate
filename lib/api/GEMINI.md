# lib/api/ - Data Access Layer (DAO)

This directory implements the Data Access Object (DAO) pattern for all database interactions. It provides a clear and centralized API for performing Create, Read, Update, and Delete (CRUD) operations, abstracting the underlying Supabase queries.

## Key Principles

-   **Static Methods Only:** All DAO classes are designed to be used statically, without instantiation. This provides a simple and consistent interface for accessing data.
-   **No Business Logic:** The API layer is strictly for database operations. All business logic, validation, and state management should be handled in the `lib/domain/` layer.
-   **Case Conversion:** This layer is responsible for mapping a
-   **Error Handling:** All methods are designed to throw descriptive errors to ensure robust error handling throughout the application.

## Files Overview

-   `scheduleAPI.js`: Manages CRUD operations for schedules, including the relationships between schedules and courses.
-   `semesterAPI.js`: Handles the lifecycle of semesters, including creation, archiving, and tracking the current semester.
-   `semesterCourseAPI.js`: Manages the course catalog for each semester, including bulk imports from CSV files and course searching.
-   `userCourseAPI.js`: Manages each user's personal library of saved courses, including source tracking and enforcing the 50-course limit.
