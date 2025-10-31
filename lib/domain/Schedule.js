import { ConflictDetector } from '../scheduler/SchedulerEngine.js';

/**
 * Schedule Domain Class
 * Represents a student's schedule (Schedule A, B, C, etc.)
 * Demonstrates COMPOSITION - a schedule contains multiple courses
 */
export class Schedule {
  constructor(id, semesterId, userId, name, description, status, isFavorite, isPrivate = false) {
    this.id = id;
    this.semesterId = semesterId;  // null if isPrivate = true
    this.userId = userId;
    this.name = name;  // "Schedule A", "My Perfect Schedule"
    this.description = description;
    this.status = status;  // 'draft', 'active', 'finalized', 'archived'
    this.isFavorite = isFavorite;
    this.isPrivate = isPrivate;  // true if not attached to semester, false otherwise
    this.courses = [];  // Array of SemesterCourse objects
  }

  /**
   * Add a course to this schedule
   * @param {SemesterCourse} course - Course to add
   * @throws {Error} If time conflict exists
   */
  addCourse(course) {
    if (this.hasConflict(course)) {
      throw new Error(`Time conflict: ${course.courseCode} conflicts with existing course in schedule`);
    }
    this.courses.push(course);
  }

  /**
   * Remove a course from this schedule
   * @param {string} courseId - ID of course to remove
   */
  removeCourse(courseId) {
    this.courses = this.courses.filter(c => c.id !== courseId);
  }

  /**
   * Check if adding this course would create a time conflict
   * Uses existing ConflictDetector from scheduler engine
   * @param {SemesterCourse} newCourse - Course to check
   * @returns {boolean} True if conflict exists
   */
  hasConflict(newCourse) {
    // Convert SemesterCourse to Section format for ConflictDetector
    const newSection = {
      group: newCourse.sectionGroup,
      schedule: newCourse.schedule,
      enrolled: `${newCourse.enrolledCurrent}/${newCourse.enrolledTotal}`,
      status: newCourse.status,
      courseCode: newCourse.courseCode,
      courseName: newCourse.courseName
    };

    return this.courses.some(existingCourse => {
      const existingSection = {
        group: existingCourse.sectionGroup,
        schedule: existingCourse.schedule,
        enrolled: `${existingCourse.enrolledCurrent}/${existingCourse.enrolledTotal}`,
        status: existingCourse.status,
        courseCode: existingCourse.courseCode,
        courseName: existingCourse.courseName
      };

      return ConflictDetector.hasConflict(existingSection, newSection);
    });
  }

  /**
   * Get total credit hours (assuming 3 credits per course)
   * @returns {number}
   */
  getTotalCredits() {
    return this.courses.length * 3;
  }

  /**
   * Get course count
   * @returns {number}
   */
  getCourseCount() {
    return this.courses.length;
  }

  /**
   * Mark schedule as favorite
   */
  setAsFavorite() {
    this.isFavorite = true;
  }

  /**
   * Remove favorite status
   */
  unsetAsFavorite() {
    this.isFavorite = false;
  }

  /**
   * Finalize schedule (no more edits)
   */
  finalize() {
    this.status = 'finalized';
  }

  /**
   * Set schedule as active
   */
  activate() {
    this.status = 'active';
  }

  /**
   * Archive schedule
   */
  archive() {
    this.status = 'archived';
  }

  /**
   * Check if schedule is editable
   * @returns {boolean}
   */
  isEditable() {
    return this.status === 'draft' || this.status === 'active';
  }

  /**
   * Get first 3 course codes for display
   * @returns {string} e.g., "CIS 3100, MATH 2010, ENGL 1101"
   */
  getPreviewCourses() {
    const preview = this.courses.slice(0, 3).map(c => c.courseCode).join(', ');
    if (this.courses.length > 3) {
      return `${preview}...`;
    }
    return preview;
  }

  /**
   * Create Schedule from database row
   * @param {Object} data - Database row
   * @returns {Schedule}
   */
  static fromDatabase(data) {
    return new Schedule(
      data.id,
      data.semester_id,
      data.user_id,
      data.name,
      data.description,
      data.status,
      data.is_favorite,
      data.is_private || false
    );
  }

  /**
   * Convert to plain object for database insertion
   * @returns {Object}
   */
  toDatabase() {
    return {
      id: this.id,
      semester_id: this.semesterId,
      user_id: this.userId,
      name: this.name,
      description: this.description,
      status: this.status,
      is_favorite: this.isFavorite,
      is_private: this.isPrivate
    };
  }
}
