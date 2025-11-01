/**
 * Data Access Layer for Enrollmate Scheduler
 * Provides API functions for interacting with Supabase scheduler tables
 */

import { supabase } from '../../src/lib/supabase.js';

/**
 * Fetches all course sections from the database and groups them by course code.
 * @returns {Promise<Array>} Array of Subject objects with sections grouped by course
 */
export async function fetchCourseSections() {
  try {
    console.log('🔄 Fetching all course sections...');

    const { data, error } = await supabase
      .from('course_sections')
      .select('*')
      .order('course_code')
      .order('section_group');

    if (error) {
      console.error('❌ Error fetching course sections:', error);
      throw new Error(`Failed to fetch course sections: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No course sections found');
      return [];
    }

    // Group sections by course code
    const subjectsMap = new Map();

    for (const row of data) {
      const courseKey = row.course_code;

      if (!subjectsMap.has(courseKey)) {
        subjectsMap.set(courseKey, {
          courseCode: row.course_code,
          courseName: row.course_name,
          sections: []
        });
      }

      // Compute status based on enrollment
      let status = 'OK';
      if (row.enrolled_current >= row.enrolled_total) {
        status = 'FULL';
      } else {
        // Check if at-risk (low enrollment)
        const total = row.enrolled_total;
        const current = row.enrolled_current;

        if (current === 0 || (total >= 20 && current < 6) || (total >= 10 && current < 2)) {
          status = 'AT-RISK';
        }
      }

      // Add section to the course
      subjectsMap.get(courseKey).sections.push({
        group: row.section_group,
        schedule: row.schedule,
        enrolled: `${row.enrolled_current}/${row.enrolled_total}`,
        status: status
      });
    }

    const subjects = Array.from(subjectsMap.values());
    console.log(`✅ Fetched ${subjects.length} courses with ${data.length} total sections`);

    return subjects;

  } catch (error) {
    console.error('❌ fetchCourseSections failed:', error);
    throw error;
  }
}

/**
 * Fetches course sections for specific course codes.
 * @param {Array<string>} courseCodes - Array of course codes to fetch
 * @returns {Promise<Array>} Array of Subject objects for the specified courses
 */
export async function fetchCoursesByCodes(courseCodes) {
  try {
    if (!courseCodes || courseCodes.length === 0) {
      console.log('⚠️ No course codes provided');
      return [];
    }

    console.log(`🔄 Fetching courses for codes: ${courseCodes.join(', ')}`);

    const { data, error } = await supabase
      .from('course_sections')
      .select('*')
      .in('course_code', courseCodes)
      .order('course_code')
      .order('section_group');

    if (error) {
      console.error('❌ Error fetching courses by codes:', error);
      throw new Error(`Failed to fetch courses: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No courses found for provided codes');
      return [];
    }

    // Group sections by course code (same logic as fetchCourseSections)
    const subjectsMap = new Map();

    for (const row of data) {
      const courseKey = row.course_code;

      if (!subjectsMap.has(courseKey)) {
        subjectsMap.set(courseKey, {
          courseCode: row.course_code,
          courseName: row.course_name,
          sections: []
        });
      }

      // Compute status based on enrollment
      let status = 'OK';
      if (row.enrolled_current >= row.enrolled_total) {
        status = 'FULL';
      } else {
        const total = row.enrolled_total;
        const current = row.enrolled_current;

        if (current === 0 || (total >= 20 && current < 6) || (total >= 10 && current < 2)) {
          status = 'AT-RISK';
        }
      }

      subjectsMap.get(courseKey).sections.push({
        group: row.section_group,
        schedule: row.schedule,
        enrolled: `${row.enrolled_current}/${row.enrolled_total}`,
        status: status
      });
    }

    const subjects = Array.from(subjectsMap.values());
    console.log(`✅ Fetched ${subjects.length} courses with ${data.length} total sections`);

    return subjects;

  } catch (error) {
    console.error('❌ fetchCoursesByCodes failed:', error);
    throw error;
  }
}

/**
 * Saves a user-generated schedule to the database.
 * @param {string} userId - UUID of the user
 * @param {string} name - Name/label for the schedule
 * @param {Array} sections - Array of section objects (full objects for display)
 * @param {Object} constraints - Constraints object used for generation
 * @returns {Promise<string>} ID of the inserted schedule
 */
export async function saveUserSchedule(userId, name, sections, constraints) {
  try {
    if (!userId || !name || !sections) {
      throw new Error('Missing required parameters: userId, name, or sections');
    }

    console.log(`💾 Saving schedule "${name}" for user ${userId}`);

    const scheduleData = {
      user_id: userId,
      name: name,
      sections_json: sections,
      constraints_json: constraints
    };

    const { data, error } = await supabase
      .from('user_schedules')
      .insert(scheduleData)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error saving user schedule:', error);
      throw new Error(`Failed to save schedule: ${error.message}`);
    }

    console.log(`✅ Schedule saved successfully with ID: ${data.id}`);
    return data.id;

  } catch (error) {
    console.error('❌ saveUserSchedule failed:', error);
    throw error;
  }
}

/**
 * Fetches all schedules for a specific user.
 * @param {string} userId - UUID of the user
 * @returns {Promise<Array>} Array of user's schedule objects
 */
export async function fetchUserSchedules(userId) {
  try {
    if (!userId) {
      throw new Error('Missing required parameter: userId');
    }

    console.log(`🔄 Fetching schedules for user ${userId}`);

    const { data, error } = await supabase
      .from('user_schedules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching user schedules:', error);
      throw new Error(`Failed to fetch schedules: ${error.message}`);
    }

    console.log(`✅ Fetched ${data?.length || 0} schedules for user`);
    return data || [];

  } catch (error) {
    console.error('❌ fetchUserSchedules failed:', error);
    throw error;
  }
}

/**
 * Deletes a user schedule from the database.
 * @param {string} scheduleId - UUID of the schedule to delete
 * @returns {Promise<boolean>} True if deletion was successful
 */
export async function deleteUserSchedule(scheduleId) {
  try {
    if (!scheduleId) {
      throw new Error('Missing required parameter: scheduleId');
    }

    console.log(`🗑️ Deleting schedule ${scheduleId}`);

    const { error } = await supabase
      .from('user_schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) {
      console.error('❌ Error deleting user schedule:', error);
      throw new Error(`Failed to delete schedule: ${error.message}`);
    }

    console.log('✅ Schedule deleted successfully');
    return true;

  } catch (error) {
    console.error('❌ deleteUserSchedule failed:', error);
    throw error;
  }
}

/**
 * Fetches or creates user preferences for schedule generation.
 * @param {string} userId - UUID of the user
 * @returns {Promise<Object>} User's preferences object
 */
export async function fetchUserPreferences(userId) {
  try {
    if (!userId) {
      throw new Error('Missing required parameter: userId');
    }

    console.log(`🔄 Fetching preferences for user ${userId}`);

    const { data, error } = await supabase
      .from('schedule_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error fetching user preferences:', error);
      throw new Error(`Failed to fetch preferences: ${error.message}`);
    }

    if (!data) {
      // Return default preferences if none exist
      console.log('⚠️ No preferences found, returning defaults');
      return {
        default_earliest_start: '07:30',
        default_latest_end: '16:30',
        allow_full_sections: false,
        allow_at_risk_sections: true,
        max_full_per_schedule: 1,
        max_schedules: 20
      };
    }

    console.log('✅ User preferences fetched successfully');
    return data;

  } catch (error) {
    console.error('❌ fetchUserPreferences failed:', error);
    throw error;
  }
}

/**
 * Saves or updates user preferences for schedule generation.
 * @param {string} userId - UUID of the user
 * @param {Object} preferences - Preferences object to save
 * @returns {Promise<boolean>} True if save was successful
 */
export async function saveUserPreferences(userId, preferences) {
  try {
    if (!userId || !preferences) {
      throw new Error('Missing required parameters: userId or preferences');
    }

    console.log(`💾 Saving preferences for user ${userId}`);

    const preferencesData = {
      user_id: userId,
      default_earliest_start: preferences.default_earliest_start || '07:30',
      default_latest_end: preferences.default_latest_end || '16:30',
      allow_full_sections: preferences.allow_full_sections ?? false,
      allow_at_risk_sections: preferences.allow_at_risk_sections ?? true,
      max_full_per_schedule: preferences.max_full_per_schedule || 1,
      max_schedules: preferences.max_schedules || 20
    };

    const { error } = await supabase
      .from('schedule_preferences')
      .upsert(preferencesData, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('❌ Error saving user preferences:', error);
      throw new Error(`Failed to save preferences: ${error.message}`);
    }

    console.log('✅ User preferences saved successfully');
    return true;

  } catch (error) {
    console.error('❌ saveUserPreferences failed:', error);
    throw error;
  }
}