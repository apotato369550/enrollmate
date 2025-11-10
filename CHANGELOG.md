# Changelog

All notable changes to the Enrollmate project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Created modular documentation structure with CLAUDE.md files in each directory
- Added CHANGELOG.md for tracking project changes
- Added comprehensive import modal to course library with CSV import and manual course addition
- Added "Import Courses" button to course library page with 50-course limit enforcement
- Added checkbox selection for courses in course library
- Added "Clear Selected" and "Clear All Courses" buttons with confirmation dialogs
- Added select all checkbox in table header
- Added API_DOCUMENTATION.md with complete Chrome extension integration guide
- Updated README.md with API usage examples and quick start guide

### Changed
- Updated root CLAUDE.md to reference subdirectory documentation files
- Completely rewrote PDF exporter to match university schedule format
- Improved course library UI with better bulk operations
- Replaced non-functional "Clear" button with functional "Clear Selected" and "Clear All" buttons
- Updated PDF styling with university-style logo, metadata headers, and clean table format
- Changed PDF colors to match sample (orange, pink, purple, teal, green, peach)

### Fixed
- Fixed profile picture not loading on dashboard (was hardcoded to feature-1.png instead of using profile.avatar_url)
- Fixed "Invalid Date" display in Last Updated field on dashboard by properly validating and parsing date strings
- Fixed PDF export styling to match sample output (university format with logo, metadata, clean table)
- Fixed CSV import error - added better validation and error logging for missing/invalid fields
- Fixed Clear button in course library that was never pressable
- Improved PDF exporter schedule parsing to handle "Th" (Thursday) and all day variations correctly

## [0.1.0] - 2025-11-02

### Added
- Initial project setup with Next.js 15.5.3 and React 19.1.0
- Supabase integration for database and authentication
- Domain-Driven Design architecture with DAO pattern
- Schedule management system (CRUD operations)
- Semester management with archiving support
- Course catalog with CSV import functionality
- User course library (max 50 courses)
- Private schedules (not attached to semesters)
- Conflict detection engine using time overlap analysis
- Row-Level Security (RLS) policies for user data isolation
- Authentication with Supabase Auth
- PDF export functionality for schedules
- Sample test data for 8 academic programs
- Database migrations system

### Features
- Multi-semester support
- Schedule conflict detection
- Course search and filtering
- Enrollment status tracking
- Profile management
- Responsive UI with Tailwind CSS 4

### Security
- Row-Level Security on all database tables
- Cascade deletion for user data cleanup
- Protected routes with middleware

---

## Change Categories

Use these categories when documenting changes:

- **Added** - New features or functionality
- **Changed** - Changes to existing functionality
- **Deprecated** - Features that will be removed in future versions
- **Removed** - Removed features or functionality
- **Fixed** - Bug fixes
- **Security** - Security improvements or fixes

## Date Format

Use ISO 8601 date format: YYYY-MM-DD

## Version Format

Follow Semantic Versioning: MAJOR.MINOR.PATCH

- MAJOR: Incompatible API changes
- MINOR: Backwards-compatible functionality additions
- PATCH: Backwards-compatible bug fixes
