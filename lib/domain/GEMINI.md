# lib/domain/ - Domain Models

This directory contains the rich domain models that represent the core business entities of the Enrollmate application. These models are not just data containers; they encapsulate business logic, validation, and state management, forming the heart of the application's backend.

## Design Principles

-   **Rich Domain Models:** The models are "rich," meaning they contain behavior (methods) that operates on their data. This keeps business logic organized and co-located with the data it pertains to.
-   **Factory Pattern:** All domain models use a static `fromDatabase` factory method to create instances from raw database data. This pattern is also responsible for mapping `snake_case` column names to `camelCase` properties.
-   **Encapsulation:** The models manage their own internal state and expose methods to transition between states, ensuring that all state changes are valid.
-   **Immutability:** Where appropriate, methods that transform data return new objects or values, rather than mutating the model's state directly.

## Files Overview

-   `Schedule.js`: Represents a student's course schedule. It manages the courses within the schedule, checks for scheduling conflicts, and handles status transitions (e.g., from `draft` to `finalized`).
-   `Semester.js`: Acts as a container for a semester, holding the available courses and schedules for that semester. It also manages the semester's lifecycle, such as archiving.
-   `SemesterCourse.js`: Represents a specific section of a course within a semester. It tracks enrollment numbers and availability.
