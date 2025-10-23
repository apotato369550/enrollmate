import { supabase } from '../../src/lib/supabase.js';
import { Schedule } from '../domain/Schedule.js';
import { SemesterCourse } from '../domain/SemesterCourse.js';

/**
 * ScheduleAPI - Data access layer for schedule operations
 * Demonstrates SEPARATION OF CONCERNS
 */
export class ScheduleAPI {
  /**
   * Create a new schedule
   * @param {string} semesterId - Semester ID
   * @param {string} userId - User ID
   * @param {string} name - Schedule name (e.g., "Schedule A")
   * @param {string} description - Optional description
   * @returns {Promise<Schedule>}
   */
  static async createSchedule(semesterId, userId, name, description = '') {
    const { data, error } = await supabase
      .from('schedules')
      .insert({
        semester_id: semesterId,
        user_id: userId,
        name,
        description,
        status: 'draft',
        is_favorite: false
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create schedule: ${error.message}`);
    return this._mapToSchedule(data);
  }

  /**
   * Get all schedules for a semester
   * @param {string} semesterId - Semester ID
   * @returns {Promise<Array<Schedule>>}
   */
  static async getSemesterSchedules(semesterId) {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        schedule_courses (
          semester_course:semester_courses (*)
        )
      `)
      .eq('semester_id', semesterId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch schedules: ${error.message}`);
    return data.map(s => this._mapToSchedule(s));
  }

  /**
   * Get schedule by ID with courses
   * @param {string} scheduleId - Schedule ID
   * @returns {Promise<Schedule>}
   */
  static async getScheduleById(scheduleId) {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        schedule_courses (
          semester_course:semester_courses (*)
        )
      `)
      .eq('id', scheduleId)
      .single();

    if (error) throw new Error(`Failed to fetch schedule: ${error.message}`);
    return this._mapToSchedule(data);
  }

  /**
   * Update schedule
   * @param {string} scheduleId - Schedule ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Schedule>}
   */
  static async updateSchedule(scheduleId, updates) {
    const dbUpdates = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite;

    const { data, error } = await supabase
      .from('schedules')
      .update(dbUpdates)
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update schedule: ${error.message}`);
    return this._mapToSchedule(data);
  }

  /**
   * Delete schedule
   * @param {string} scheduleId - Schedule ID
   * @returns {Promise<void>}
   */
  static async deleteSchedule(scheduleId) {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) throw new Error(`Failed to delete schedule: ${error.message}`);
  }

  /**
   * Duplicate schedule
   * @param {string} scheduleId - Schedule ID to duplicate
   * @param {string} newName - Name for duplicated schedule
   * @returns {Promise<Schedule>}
   */
  static async duplicateSchedule(scheduleId, newName) {
    // Get original schedule with courses
    const original = await this.getScheduleById(scheduleId);

    // Create new schedule
    const duplicate = await this.createSchedule(
      original.semesterId,
      original.userId,
      newName,
      `Copy of ${original.description || original.name}`
    );

    // Copy all courses
    for (const course of original.courses) {
      await this.addCourseToSchedule(duplicate.id, course.id);
    }

    return this.getScheduleById(duplicate.id);
  }

  /**
   * Add course to schedule
   * @param {string} scheduleId - Schedule ID
   * @param {string} semesterCourseId - Semester course ID
   * @returns {Promise<Object>}
   */
  static async addCourseToSchedule(scheduleId, semesterCourseId) {
    const { data, error } = await supabase
      .from('schedule_courses')
      .insert({
        schedule_id: scheduleId,
        semester_course_id: semesterCourseId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('This course is already in the schedule');
      }
      throw new Error(`Failed to add course to schedule: ${error.message}`);
    }
    return data;
  }

  /**
   * Remove course from schedule
   * @param {string} scheduleId - Schedule ID
   * @param {string} semesterCourseId - Semester course ID
   * @returns {Promise<void>}
   */
  static async removeCourseFromSchedule(scheduleId, semesterCourseId) {
    const { error } = await supabase
      .from('schedule_courses')
      .delete()
      .eq('schedule_id', scheduleId)
      .eq('semester_course_id', semesterCourseId);

    if (error) throw new Error(`Failed to remove course from schedule: ${error.message}`);
  }

  /**
   * Get courses for a schedule
   * @param {string} scheduleId - Schedule ID
   * @returns {Promise<Array<SemesterCourse>>}
   */
  static async getScheduleCourses(scheduleId) {
    const { data, error } = await supabase
      .from('schedule_courses')
      .select('semester_course:semester_courses (*)')
      .eq('schedule_id', scheduleId);

    if (error) throw new Error(`Failed to fetch schedule courses: ${error.message}`);
    return data.map(item => SemesterCourse.fromDatabase(item.semester_course));
  }

  /**
   * Map database row to Schedule object
   * @private
   */
  static _mapToSchedule(data) {
    const schedule = new Schedule(
      data.id,
      data.semester_id,
      data.user_id,
      data.name,
      data.description,
      data.status,
      data.is_favorite
    );

    // Map courses if included in query
    if (data.schedule_courses && Array.isArray(data.schedule_courses)) {
      schedule.courses = data.schedule_courses
        .filter(sc => sc.semester_course) // Filter out nulls
        .map(sc => SemesterCourse.fromDatabase(sc.semester_course));
    }

    return schedule;
  }
}
