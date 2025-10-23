import { supabase } from '../../src/lib/supabase.js';
import { SemesterCourse } from '../domain/SemesterCourse.js';

/**
 * SemesterCourseAPI - Data access layer for semester course operations
 * Manages the course catalog for each semester
 */
export class SemesterCourseAPI {
  /**
   * Add a course to semester catalog
   * @param {string} semesterId - Semester ID
   * @param {Object} courseData - Course data
   * @returns {Promise<SemesterCourse>}
   */
  static async addCourseToSemester(semesterId, courseData) {
    const { data, error } = await supabase
      .from('semester_courses')
      .insert({
        semester_id: semesterId,
        course_code: courseData.courseCode,
        course_name: courseData.courseName,
        section_group: courseData.sectionGroup,
        schedule: courseData.schedule,
        enrolled_current: courseData.enrolledCurrent || 0,
        enrolled_total: courseData.enrolledTotal,
        room: courseData.room || null,
        instructor: courseData.instructor || null,
        status: courseData.status || 'OK'
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add course to semester: ${error.message}`);
    return SemesterCourse.fromDatabase(data);
  }

  /**
   * Get all courses for a semester
   * @param {string} semesterId - Semester ID
   * @returns {Promise<Array<SemesterCourse>>}
   */
  static async getSemesterCourses(semesterId) {
    const { data, error } = await supabase
      .from('semester_courses')
      .select('*')
      .eq('semester_id', semesterId)
      .order('course_code', { ascending: true })
      .order('section_group', { ascending: true });

    if (error) throw new Error(`Failed to fetch semester courses: ${error.message}`);
    return data.map(c => SemesterCourse.fromDatabase(c));
  }

  /**
   * Get course by ID
   * @param {string} courseId - Course ID
   * @returns {Promise<SemesterCourse>}
   */
  static async getCourseById(courseId) {
    const { data, error } = await supabase
      .from('semester_courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error) throw new Error(`Failed to fetch course: ${error.message}`);
    return SemesterCourse.fromDatabase(data);
  }

  /**
   * Update course in semester catalog
   * @param {string} courseId - Course ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<SemesterCourse>}
   */
  static async updateCourse(courseId, updates) {
    const dbUpdates = {};
    if (updates.enrolledCurrent !== undefined) dbUpdates.enrolled_current = updates.enrolledCurrent;
    if (updates.enrolledTotal !== undefined) dbUpdates.enrolled_total = updates.enrolledTotal;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.room !== undefined) dbUpdates.room = updates.room;
    if (updates.instructor !== undefined) dbUpdates.instructor = updates.instructor;

    const { data, error } = await supabase
      .from('semester_courses')
      .update(dbUpdates)
      .eq('id', courseId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update course: ${error.message}`);
    return SemesterCourse.fromDatabase(data);
  }

  /**
   * Delete course from semester catalog
   * @param {string} courseId - Course ID
   * @returns {Promise<void>}
   */
  static async deleteCourse(courseId) {
    const { error } = await supabase
      .from('semester_courses')
      .delete()
      .eq('id', courseId);

    if (error) throw new Error(`Failed to delete course: ${error.message}`);
  }

  /**
   * Search courses by course code
   * @param {string} semesterId - Semester ID
   * @param {string} searchTerm - Search term for course code
   * @returns {Promise<Array<SemesterCourse>>}
   */
  static async searchCourses(semesterId, searchTerm) {
    const { data, error } = await supabase
      .from('semester_courses')
      .select('*')
      .eq('semester_id', semesterId)
      .ilike('course_code', `%${searchTerm}%`)
      .order('course_code', { ascending: true });

    if (error) throw new Error(`Failed to search courses: ${error.message}`);
    return data.map(c => SemesterCourse.fromDatabase(c));
  }

  /**
   * Get available courses (not full) for a semester
   * @param {string} semesterId - Semester ID
   * @returns {Promise<Array<SemesterCourse>>}
   */
  static async getAvailableCourses(semesterId) {
    const { data, error} = await supabase
      .from('semester_courses')
      .select('*')
      .eq('semester_id', semesterId)
      .neq('status', 'FULL')
      .order('course_code', { ascending: true });

    if (error) throw new Error(`Failed to fetch available courses: ${error.message}`);
    return data.map(c => SemesterCourse.fromDatabase(c));
  }

  /**
   * Bulk import courses from CSV/array
   * @param {string} semesterId - Semester ID
   * @param {Array<Object>} courses - Array of course data
   * @returns {Promise<Array<SemesterCourse>>}
   */
  static async bulkImportCourses(semesterId, courses) {
    const coursesToInsert = courses.map(c => ({
      semester_id: semesterId,
      course_code: c.courseCode,
      course_name: c.courseName,
      section_group: c.sectionGroup,
      schedule: c.schedule,
      enrolled_current: c.enrolledCurrent || 0,
      enrolled_total: c.enrolledTotal,
      room: c.room || null,
      instructor: c.instructor || null,
      status: c.status || 'OK'
    }));

    const { data, error } = await supabase
      .from('semester_courses')
      .insert(coursesToInsert)
      .select();

    if (error) throw new Error(`Failed to bulk import courses: ${error.message}`);
    return data.map(c => SemesterCourse.fromDatabase(c));
  }
}
