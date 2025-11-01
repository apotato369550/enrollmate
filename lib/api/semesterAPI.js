import { supabase } from '../../src/lib/supabase.js';
import { Semester } from '../domain/Semester.js';

/**
 * SemesterAPI - Data access layer for semester operations
 * Demonstrates SEPARATION OF CONCERNS
 */
export class SemesterAPI {
  /**
   * Create a new semester
   * @param {string} userId - User ID
   * @param {string} name - Semester name (e.g., "1st Semester 2025")
   * @param {string} schoolYear - School year (e.g., "2024-2025")
   * @param {string} semesterType - Type: "1st", "2nd", or "Summer"
   * @param {number} year - Year (e.g., 2025)
   * @returns {Promise<Semester>}
   */
  static async createSemester(userId, name, schoolYear, semesterType, year) {
    const { data, error } = await supabase
      .from('semesters')
      .insert({
        user_id: userId,
        name,
        school_year: schoolYear,
        semester_type: semesterType,
        year,
        status: 'active',
        is_current: true
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create semester: ${error.message}`);
    return this._mapToSemester(data);
  }

  /**
   * Get all semesters for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array<Semester>>}
   */
  static async getUserSemesters(userId) {
    const { data, error } = await supabase
      .from('semesters')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch semesters: ${error.message}`);
    return data.map(s => this._mapToSemester(s));
  }

  /**
   * Get current active semester for a user
   * @param {string} userId - User ID
   * @returns {Promise<Semester|null>}
   */
  static async getCurrentSemester(userId) {
    const { data, error } = await supabase
      .from('semesters')
      .select('*')
      .eq('user_id', userId)
      .eq('is_current', true)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch current semester: ${error.message}`);
    return data ? this._mapToSemester(data) : null;
  }

  /**
   * Get semester by ID
   * @param {string} semesterId - Semester ID
   * @returns {Promise<Semester>}
   */
  static async getSemesterById(semesterId) {
    const { data, error } = await supabase
      .from('semesters')
      .select('*')
      .eq('id', semesterId)
      .single();

    if (error) throw new Error(`Failed to fetch semester: ${error.message}`);
    return this._mapToSemester(data);
  }

  /**
   * Set semester as current (unsets all others)
   * @param {string} userId - User ID
   * @param {string} semesterId - Semester ID to set as current
   * @returns {Promise<Semester>}
   */
  static async setCurrentSemester(userId, semesterId) {
    // First, unset all other semesters
    await supabase
      .from('semesters')
      .update({ is_current: false })
      .eq('user_id', userId);

    // Then set this one as current
    const { data, error } = await supabase
      .from('semesters')
      .update({ is_current: true, status: 'active' })
      .eq('id', semesterId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(`Failed to set current semester: ${error.message}`);
    return this._mapToSemester(data);
  }

  /**
   * Update semester
   * @param {string} semesterId - Semester ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Semester>}
   */
  static async updateSemester(semesterId, updates) {
    const dbUpdates = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.isCurrent !== undefined) dbUpdates.is_current = updates.isCurrent;

    const { data, error } = await supabase
      .from('semesters')
      .update(dbUpdates)
      .eq('id', semesterId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update semester: ${error.message}`);
    return this._mapToSemester(data);
  }

  /**
   * Delete semester
   * @param {string} semesterId - Semester ID
   * @returns {Promise<void>}
   */
  static async deleteSemester(semesterId) {
    const { error } = await supabase
      .from('semesters')
      .delete()
      .eq('id', semesterId);

    if (error) throw new Error(`Failed to delete semester: ${error.message}`);
  }

  /**
   * Archive semester
   * @param {string} semesterId - Semester ID
   * @returns {Promise<Semester>}
   */
  static async archiveSemester(semesterId) {
    return this.updateSemester(semesterId, { status: 'archived', isCurrent: false });
  }

  /**
   * Map database row to Semester object
   * @private
   */
  static _mapToSemester(data) {
    return new Semester(
      data.id,
      data.user_id,
      data.name,
      data.school_year,
      data.semester_type,
      data.year,
      data.status,
      data.is_current
    );
  }
}
