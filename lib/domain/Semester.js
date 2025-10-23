/**
 * Semester Domain Class
 * Represents a semester container (e.g., "1st Semester 2025", "Summer 2024")
 * Demonstrates ENCAPSULATION by managing semester data and state
 */
export class Semester {
  constructor(id, userId, name, schoolYear, semesterType, year, status, isCurrent) {
    this.id = id;
    this.userId = userId;
    this.name = name;  // "1st Semester 2025"
    this.schoolYear = schoolYear;  // "2024-2025"
    this.semesterType = semesterType;  // "1st", "2nd", "Summer"
    this.year = year;  // 2025
    this.status = status;  // 'active', 'archived', 'draft'
    this.isCurrent = isCurrent;
    this.courses = [];  // Array of SemesterCourse objects
    this.schedules = [];  // Array of Schedule objects
  }

  /**
   * Checks if semester is currently active
   * @returns {boolean}
   */
  isActive() {
    return this.status === 'active';
  }

  /**
   * Archive this semester
   */
  archive() {
    this.status = 'archived';
    this.isCurrent = false;
  }

  /**
   * Set as current semester
   */
  setAsCurrent() {
    this.isCurrent = true;
    this.status = 'active';
  }

  /**
   * Add a course to this semester's catalog
   * @param {SemesterCourse} course - Course to add
   */
  addCourse(course) {
    this.courses.push(course);
  }

  /**
   * Get all available courses for this semester (not full)
   * @returns {Array<SemesterCourse>}
   */
  getAvailableCourses() {
    return this.courses.filter(c => c.status !== 'FULL');
  }

  /**
   * Get total number of courses in catalog
   * @returns {number}
   */
  getTotalCourses() {
    return this.courses.length;
  }

  /**
   * Get all schedules for this semester
   * @returns {Array<Schedule>}
   */
  getSchedules() {
    return this.schedules;
  }

  /**
   * Add a schedule to this semester
   * @param {Schedule} schedule - Schedule to add
   */
  addSchedule(schedule) {
    this.schedules.push(schedule);
  }
}
