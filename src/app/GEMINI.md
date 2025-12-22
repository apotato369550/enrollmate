# src/app/ - Next.js App Router

This directory is the core of the Next.js application, where all pages, routes, and layouts are defined using the App Router's file-based routing system.

## File Conventions

-   `page.js`: This file defines the UI for a specific route. Each `page.js` file corresponds to a publicly accessible URL.
-   `layout.js`: This file defines a shared UI wrapper that is used across multiple routes. Layouts can be nested to create complex UI structures.
-   `loading.js`: This is an optional file that provides a loading UI that is automatically shown while a page and its data are loading.
-   `error.js`: This is an optional file that acts as an error boundary for a route segment, allowing you to gracefully handle errors and display a fallback UI.

## Route Structure

The application's routes are defined by the folder structure within this directory. Here are some of the key routes:

-   `/`: The landing page for the application.
-   `/dashboard`: The main user dashboard, which displays an overview of the current semester and schedules.
-   `/scheduler`: The interactive interface for building and managing course schedules.
-   `/schedule/[id]`: A dynamic route that displays the details of a specific schedule.
-   `/courses`: A page for browsing and managing the course catalog.
-g   `/profile`: The user's profile and settings page.
-   `/login` and `/signup`: The authentication pages for logging in and creating a new account.

## Authentication

The application has both public and protected routes. Public routes are accessible to everyone, while protected routes require the user to be authenticated. Authentication is handled on both the client and server:

-   **Client-side:** A `useEffect` hook in each protected page checks if a user is logged in and redirects to the login page if they are not.
-   **Server-side:** The `middleware.js` file at the root of the project intercepts requests at the edge and can perform authentication checks before the request reaches the page.
