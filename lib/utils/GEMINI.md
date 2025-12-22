# lib/utils/ - Shared Utilities

This directory contains reusable utility functions that are used across the Enrollmate application. These utilities are designed to be pure, stateless, and free of any business logic.

## Key Principles

-   **Pure Functions:** All utility functions are pure, meaning they have no side effects and will always produce the same output for the same input.
-   **No Business Logic:** These utilities are generic and do not contain any domain-specific logic. Business logic should be implemented in the `lib/domain/` layer.
-   **Self-Contained:** Each utility is independent and has no dependencies on the domain models or the API layer.

## Files Overview

-   `pdfExporter.js`: This utility is responsible for exporting schedules as PDF documents. It uses the `jsPDF` and `html2canvas` libraries to capture a DOM element, convert it to an image, and then embed it into a PDF document. This is a good example of a self-contained utility that performs a specific, reusable task.
