/**
 * SemesterCourse Domain Class
 * Represents a course section available in a semester's catalog
 * Extends the existing Section concept but semester-specific
 */
export class SemesterCourse {
  constructor(id, semesterId, courseCode, courseName, sectionGroup,
              schedule, enrolledCurrent, enrolledTotal, room, instructor, status) {
    this.id = id;
    this.semesterId = semesterId;
    this.courseCode = courseCode;  // "CIS 3100"
    this.courseName = courseName;  // "Data Structures and Algorithms"
    this.sectionGroup = sectionGroup;  // 1, 2, 3
    this.schedule = schedule;  // "MW 11:00 AM - 12:30 PM"
    this.enrolledCurrent = enrolledCurrent;
    this.enrolledTotal = enrolledTotal;
    this.room = room;  // "CIS311TC"
    this.instructor = instructor;  // "Dr. Smith"
    this.status = status;  // 'OK', 'FULL', 'AT-RISK'
  }

  /**
   * Check if course section is full
   * @returns {boolean}
   */
  isFull() {
    return this.enrolledCurrent >= this.enrolledTotal;
  }

  /**
   * Check if course is at risk of cancellation (underfilled)
   * @returns {boolean}
   */
  isAtRisk() {
    const current = this.enrolledCurrent;
    const total = this.enrolledTotal;

    // At risk if: 0 enrolled, or large section (<6 enrolled), or medium section (<2 enrolled)
    return current === 0 ||
           (total >= 20 && current < 6) ||
           (total >= 10 && current < 2);
  }

  /**
   * Get enrollment percentage
   * @returns {number} Percentage from 0 to 100
   */
  getEnrollmentPercentage() {
    if (this.enrolledTotal === 0) return 0;
    return Math.round((this.enrolledCurrent / this.enrolledTotal) * 100);
  }

  /**
   * Get enrollment status label
   * @returns {string} 'OK', 'FULL', or 'AT-RISK'
   */
  getStatus() {
    if (this.isFull()) return 'FULL';
    if (this.isAtRisk()) return 'AT-RISK';
    return 'OK';
  }

  /**
   * Get enrollment display string
   * @returns {string} e.g., "25/30" or "30/30 (FULL)"
   */
  getEnrollmentDisplay() {
    const base = `${this.enrolledCurrent}/${this.enrolledTotal}`;
    if (this.isFull()) return `${base} (FULL)`;
    if (this.isAtRisk()) return `${base} (AT-RISK)`;
    return base;
  }

  /**
   * Create SemesterCourse from database row
   * @param {Object} data - Database row
   * @returns {SemesterCourse}
   */
  static fromDatabase(data) {
    return new SemesterCourse(
      data.id,
      data.semester_id,
      data.course_code,
      data.course_name,
      data.section_group,
      data.schedule,
      data.enrolled_current,
      data.enrolled_total,
      data.room,
      data.instructor,
      data.status
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
      course_code: this.courseCode,
      course_name: this.courseName,
      section_group: this.sectionGroup,
      schedule: this.schedule,
      enrolled_current: this.enrolledCurrent,
      enrolled_total: this.enrolledTotal,
      room: this.room,
      instructor: this.instructor,
      status: this.status
    };
  }
}
