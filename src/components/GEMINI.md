# src/components/ - Reusable React Components

This directory contains shared, reusable React components that are used to build the user interface of the Enrollmate application. These components are designed to be composable, testable, and have clear and well-defined props.

## Key Principles

-   **Single Responsibility:** Each component has a single, well-defined purpose. This makes them easier to understand, test, and maintain.
-   **Reusability:** The components are designed to be used in multiple pages and contexts throughout the application.
-   **Props Interface:** Each component has a clear and well-defined props interface, which makes them easy to use and understand.
-   **Client Components:** All components in this directory are Client Components, as they are interactive and use React hooks.

## Files Overview

-   `SemesterSelector.jsx`: A dropdown component that allows users to select and manage their semesters. It lists all of a user's semesters, highlights the current one, and provides an option to create a new semester.
-   `PFPToolbar.js`: The user profile toolbar, which displays the user's profile picture, name, and provides a logout button and navigation to the user's profile page.
