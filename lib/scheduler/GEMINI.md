# lib/scheduler/ - Scheduling Engine

This directory houses the core scheduling algorithms for the Enrollmate application. It is responsible for parsing schedule strings, detecting time conflicts, and providing the logic for analyzing course schedules.

## Key Components

-   `SchedulerEngine.js`: This file contains the primary components of the scheduling engine:
    -   `ScheduleParser`: An abstract base class that defines the interface for parsing schedule strings. It uses a Strategy pattern to allow for different parsing implementations.
    -   `StandardScheduleParser`: A concrete implementation of `ScheduleParser` that parses the standard schedule format (e.g., `"MW 10:00 AM - 11:30 AM"`).
    -   `ConflictDetector`: A static utility class that contains the logic for detecting time conflicts between two course sections.

-   `schedulerAPI.js`: This is a legacy data access file. New development should use the more modern DAO pattern found in the `lib/api/` directory.

## Conflict Detection Algorithm

The conflict detection algorithm is a two-step process:

1.  **Day Overlap:** The algorithm first checks if the two courses are scheduled on any of the same days.
2.  **Time Overlap:** If there is a day overlap, the algorithm then checks if the start and end times of the courses overlap.

A conflict is only registered if both a day and time overlap exist. The time parsing and comparison logic is robust, handling various time formats and edge cases like back-to-back classes.
