# Changelog

All notable changes to the Enrollmate project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Created modular documentation structure with CLAUDE.md files in each directory
- Added CHANGELOG.md for tracking project changes

### Changed
- Updated root CLAUDE.md to reference subdirectory documentation files

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
