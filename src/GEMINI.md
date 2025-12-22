# src/ - Frontend Application

This directory contains the entire frontend of the Enrollmate application, built with Next.js 15 and React 19. It follows the modern App Router paradigm and leverages both Server and Client Components to create a fast and interactive user experience.

## Directory Structure

-   `app/`: This is the heart of the Next.js application, where all pages and routes are defined using file-based routing.
-   `components/`: This directory contains all the reusable React components that are used to build the user interface.
-   `lib/`: This directory contains frontend-specific utilities, such as the Supabase client and other helper functions.

## Key Principles

-   **Next.js App Router:** The application uses the Next.js App Router, which enables features like Server Components, Client Components, and file-based routing.
-   **Server and Client Components:** The application is built with a mix of Server and Client Components. Server Components are used for fetching data and rendering static content, while Client Components are used for interactive UI elements that require state and event handlers.
-   **Authentication:** All protected pages follow a consistent pattern of checking for an authenticated user and redirecting to the login page if the user is not signed in.
-   **Styling:** The user interface is styled using Tailwind CSS 4, a utility-first CSS framework. The custom theme is defined in the `tailwind.config.js` file at the root of the project.
