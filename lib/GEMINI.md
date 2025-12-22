# lib/ - Backend Business Logic

This directory contains the server-side business logic for the Enrollmate application. It is organized into subdirectories, each with a specific responsibility, following a Domain-Driven Design approach.

## Directory Structure

-   `api/`: Contains the Data Access Objects (DAOs) responsible for all database operations. This layer provides a clean and reusable interface for interacting with the Supabase database.
-   `domain/`: This directory holds the domain models, which represent the core business entities of the application. These models encapsulate business logic, validation, and state management.
-   `scheduler/`: The core scheduling engine resides here. It includes the algorithms for conflict detection and parsing of schedule strings.
-   `utils/`: A collection of shared utility functions used across the backend, such as the PDF exporter.

## Key Principles

-   **Separation of Concerns:** Each subdirectory has a distinct responsibility, ensuring a clean separation between data access, business logic, and algorithmic processing.
-   **ES Modules:** The entire backend uses ES Modules, and all imports must include the `.js` file extension.
-   **Error Handling:** All API methods are designed to throw descriptive errors to ensure robust error handling.
-   **Factory Pattern:** Domain models utilize static factory methods to create instances from database data, mapping snake_case from the database to camelCase in the application.
-   **DAO Pattern:** All database interactions are channeled through the static API classes in the `api/` directory.
