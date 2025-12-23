import { describe, it, expect } from 'vitest';
import { ConflictDetector, Section, StandardScheduleParser } from '../../../lib/scheduler/SchedulerEngine.js';

describe('Conflict Detection Logic', () => {
  describe('StandardScheduleParser', () => {
    const parser = new StandardScheduleParser();

    it('should parse standard schedule string correctly', () => {
      const result = parser.parse("MW 10:00 AM - 11:30 AM");
      expect(result).toEqual({
        days: ['M', 'W'],
        startTime: 600, // 10 * 60
        endTime: 690   // 11 * 60 + 30
      });
    });

    it('should parse TTh correctly', () => {
      const result = parser.parse("TTh 02:00 PM - 03:30 PM");
      expect(result).toEqual({
        days: ['T', 'Th'],
        startTime: 840, // 14 * 60
        endTime: 930    // 15 * 60 + 30
      });
    });
    
    it('should return null for invalid strings', () => {
        expect(parser.parse("Invalid String")).toBeNull();
    });
  });

  describe('ConflictDetector', () => {
    it('should detect conflict for overlapping times on same day', () => {
      const s1 = new Section(1, "MW 10:00 AM - 11:30 AM", "0/30", "OK");
      const s2 = new Section(2, "MW 11:00 AM - 12:30 PM", "0/30", "OK"); // Overlaps 11:00-11:30

      expect(ConflictDetector.hasConflict(s1, s2)).toBe(true);
    });

    it('should NOT detect conflict for non-overlapping times on same day', () => {
      const s1 = new Section(1, "MW 10:00 AM - 11:30 AM", "0/30", "OK");
      const s2 = new Section(2, "MW 12:00 PM - 01:30 PM", "0/30", "OK");

      expect(ConflictDetector.hasConflict(s1, s2)).toBe(false);
    });

    it('should NOT detect conflict for same times on different days', () => {
      const s1 = new Section(1, "MW 10:00 AM - 11:30 AM", "0/30", "OK");
      const s2 = new Section(2, "TTh 10:00 AM - 11:30 AM", "0/30", "OK");

      expect(ConflictDetector.hasConflict(s1, s2)).toBe(false);
    });
    
    it('should handle back-to-back classes correctly (no conflict)', () => {
        // Class A ends at 11:30, Class B starts at 11:30
        const s1 = new Section(1, "MW 10:00 AM - 11:30 AM", "0/30", "OK");
        const s2 = new Section(2, "MW 11:30 AM - 01:00 PM", "0/30", "OK");
        
        // Assuming strict inequality in conflict check (end1 > start2)
        expect(ConflictDetector.hasConflict(s1, s2)).toBe(false);
    });
  });
});
