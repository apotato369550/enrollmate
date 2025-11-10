/**
 * UserCourseAPI - Handles user's personal course library (saved courses)
 * Enforces 50-course limit per user and provides dependency checking
 */

import { supabase } from '../../src/lib/supabase.js';

class UserCourseAPI {
  /**
   * Get all saved courses for a user
   * @param {string} userId - User's UUID
   * @returns {Promise<Array>} Array of saved courses
   */
  static async getUserCourses(userId) {
    try {
      const { data, error } = await supabase
        .from('user_courses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user courses:', error.message || error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  /**
   * Get a specific saved course by ID
   * @param {string} courseId - Course UUID
   * @returns {Promise<Object>} Course object
   */
  static async getUserCourse(courseId) {
    try {
      const { data, error } = await supabase
        .from('user_courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user course:', error);
      throw error;
    }
  }

  /**
   * Count saved courses for a user
   * @param {string} userId - User's UUID
   * @returns {Promise<number>} Count of saved courses
   */
  static async getUserCourseCount(userId) {
    try {
      const { count, error } = await supabase
        .from('user_courses')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error counting user courses:', error);
      throw error;
    }
  }

  /**
   * Save a single course to user's library
   * @param {string} userId - User's UUID
   * @param {Object} courseData - Course object with courseCode, courseName, sectionGroup, schedule, enrolledTotal, etc.
   * @param {string} source - Source of course: 'manual', 'csv', or 'extension' (default: 'manual')
   * @returns {Promise<Object>} Saved course object
   */
  static async saveCourse(userId, courseData, source = 'manual') {
    try {
      // Validate required fields
      const courseCode = courseData.courseCode || courseData.course_code;
      const courseName = courseData.courseName || courseData.course_name;
      const sectionGroup = parseInt(courseData.sectionGroup || courseData.section_group) || 1;

      if (!courseCode || !courseName) {
        throw new Error(`Missing required fields: courseCode="${courseCode}", courseName="${courseName}"`);
      }

      // Check if at 50-course limit
      const count = await this.getUserCourseCount(userId);
      if (count >= 50) {
        throw new Error('Course library is full (50-course limit per user). Delete some courses to save new ones.');
      }

      // Check if course already exists for this user
      const { data: existing, error: existingError } = await supabase
        .from('user_courses')
        .select('id')
        .eq('user_id', userId)
        .eq('course_code', courseCode)
        .eq('section_group', sectionGroup)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        // Course already saved, just update the source and timestamp
        return await this.updateCourse(existing.id, { source });
      }

      // Insert new course
      const { data, error } = await supabase
        .from('user_courses')
        .insert({
          user_id: userId,
          course_code: courseCode,
          course_name: courseName,
          section_group: sectionGroup,
          schedule: courseData.schedule || '',
          enrolled_current: parseInt(courseData.enrolledCurrent || courseData.enrolled_current) || 0,
          enrolled_total: parseInt(courseData.enrolledTotal || courseData.enrolled_total) || 0,
          room: courseData.room || null,
          instructor: courseData.instructor || null,
          source: source,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Failed to save course: ${error.message || JSON.stringify(error)}`);
      }
      return data;
    } catch (error) {
      console.error('Error saving course:', {
        message: error.message,
        stack: error.stack,
        courseData: courseData
      });
      throw error;
    }
  }

  /**
   * Save multiple courses to user's library in bulk
   * @param {string} userId - User's UUID
   * @param {Array<Object>} coursesData - Array of course objects
   * @param {string} source - Source of courses: 'manual', 'csv', or 'extension'
   * @returns {Promise<Array>} Array of saved course objects
   */
  static async saveCourses(userId, coursesData, source = 'manual') {
    try {
      // Check if total would exceed 50-course limit
      const count = await this.getUserCourseCount(userId);
      if (count + coursesData.length > 50) {
        throw new Error(`Cannot save ${coursesData.length} courses. Would exceed 50-course limit (currently have ${count})`);
      }

      const savedCourses = [];
      const errors = [];

      for (const courseData of coursesData) {
        try {
          const saved = await this.saveCourse(userId, courseData, source);
          savedCourses.push(saved);
        } catch (error) {
          errors.push({
            course: `${courseData.courseCode} - Section ${courseData.sectionGroup || courseData.section_group}`,
            error: error.message,
          });
        }
      }

      if (errors.length > 0) {
        console.warn(`Saved ${savedCourses.length}/${coursesData.length} courses. Errors:`, errors);
      }

      return {
        success: savedCourses,
        errors: errors,
        message: errors.length > 0
          ? `Saved ${savedCourses.length}/${coursesData.length} courses. ${errors.length} failed.`
          : `Successfully saved all ${savedCourses.length} courses`,
      };
    } catch (error) {
      console.error('Error saving multiple courses:', error);
      throw error;
    }
  }

  /**
   * Update a saved course
   * @param {string} courseId - Course UUID
   * @param {Object} updates - Fields to update (can be partial)
   * @returns {Promise<Object>} Updated course object
   */
  static async updateCourse(courseId, updates) {
    try {
      const { data, error } = await supabase
        .from('user_courses')
        .update(updates)
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  /**
   * Delete a saved course
   * WARNING: Check getCourseUsage() first to warn user about dependent schedules
   * @param {string} courseId - Course UUID
   * @returns {Promise<void>}
   */
  static async deleteCourse(courseId) {
    try {
      const { error } = await supabase
        .from('user_courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  /**
   * Get courses from a specific source (csv, extension, manual)
   * @param {string} userId - User's UUID
   * @param {string} source - Source filter: 'csv', 'extension', or 'manual'
   * @returns {Promise<Array>} Filtered courses
   */
  static async getCoursesBySource(userId, source) {
    try {
      const { data, error } = await supabase
        .from('user_courses')
        .select('*')
        .eq('user_id', userId)
        .eq('source', source)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching courses by source:', error);
      throw error;
    }
  }

  /**
   * Check if a course is used in any schedule
   * @param {string} userId - User's UUID
   * @param {string} courseCode - Course code (e.g., "CIS 3100")
   * @param {number} sectionGroup - Section group number
   * @returns {Promise<Array>} Array of schedules using this course
   */
  static async getCourseUsage(userId, courseCode, sectionGroup) {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          id,
          name,
          user_id,
          schedule_courses (
            semester_course_id,
            semester_courses!inner (
              course_code,
              section_group
            )
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      // Filter schedules that contain this specific course
      const dependentSchedules = data.filter(schedule =>
        schedule.schedule_courses.some(sc =>
          sc.semester_courses.course_code === courseCode &&
          sc.semester_courses.section_group === sectionGroup
        )
      );

      return dependentSchedules.map(s => ({
        scheduleId: s.id,
        scheduleName: s.name,
      }));
    } catch (error) {
      console.error('Error checking course usage:', error);
      throw error;
    }
  }

  /**
   * Search courses by course code
   * @param {string} userId - User's UUID
   * @param {string} searchTerm - Course code or name to search for
   * @returns {Promise<Array>} Matching courses
   */
  static async searchCourses(userId, searchTerm) {
    try {
      const { data, error } = await supabase
        .from('user_courses')
        .select('*')
        .eq('user_id', userId)
        .or(`course_code.ilike.%${searchTerm}%,course_name.ilike.%${searchTerm}%`)
        .order('course_code', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching courses:', error);
      throw error;
    }
  }

  /**
   * Get course statistics for a user
   * @param {string} userId - User's UUID
   * @returns {Promise<Object>} Statistics object
   */
  static async getCourseStats(userId) {
    try {
      const { data, error } = await supabase
        .from('user_courses')
        .select('source')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        total: data.length,
        manual: data.filter(c => c.source === 'manual').length,
        csv: data.filter(c => c.source === 'csv').length,
        extension: data.filter(c => c.source === 'extension').length,
        remaining: 50 - data.length,
      };

      return stats;
    } catch (error) {
      console.error('Error getting course statistics:', error.message || error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  /**
   * Clear all courses from a specific source
   * @param {string} userId - User's UUID
   * @param {string} source - Source to clear: 'csv', 'extension', or 'manual'
   * @returns {Promise<number>} Number of courses deleted
   */
  static async clearCoursesBySource(userId, source) {
    try {
      const { count, error } = await supabase
        .from('user_courses')
        .delete()
        .eq('user_id', userId)
        .eq('source', source);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error clearing courses by source:', error);
      throw error;
    }
  }
}

export default UserCourseAPI;
