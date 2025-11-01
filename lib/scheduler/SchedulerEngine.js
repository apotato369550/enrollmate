/**
 * Abstract base class for schedule parsing functionality.
 * Demonstrates ABSTRACTION by defining the interface for parsing schedule strings.
 */
class ScheduleParser {
  /**
   * Abstract method to parse a schedule string into a structured format.
   * Must be implemented by subclasses.
   * @param {string} scheduleString - The schedule string to parse (e.g., "MW 10:00 AM - 11:30 AM")
   * @returns {{days: string[], startTime: number, endTime: number}|null} Parsed schedule object or null if invalid
   */
  parse(scheduleString) {
    throw new Error('parse() method must be implemented by subclass');
  }

  /**
   * Converts a time string in HH:MM format to minutes from midnight.
   * Demonstrates ENCAPSULATION by hiding the conversion logic.
   * @param {string} timeStr - Time string in HH:MM format
   * @returns {number} Minutes from midnight
   */
  toMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

/**
 * Standard implementation of ScheduleParser for parsing common schedule formats.
 * Demonstrates INHERITANCE by extending the abstract ScheduleParser class.
 */
class StandardScheduleParser extends ScheduleParser {
  /**
   * Parses a standard schedule string format like "MW 10:00 AM - 11:30 AM".
   * @param {string} scheduleString - The schedule string to parse
   * @returns {{days: string[], startTime: number, endTime: number}|null} Parsed schedule object or null if invalid
   */
  parse(scheduleString) {
    if (!scheduleString || typeof scheduleString !== 'string') {
      return null;
    }

    // Split by space to separate days and time parts
    const parts = scheduleString.trim().split(/\s+/);
    if (parts.length < 4) {
      return null;
    }

    // Extract days (first part) and time range (remaining parts)
    const daysPart = parts[0];
    const timePart = parts.slice(1).join(' ');

    // Parse days - handle special case for "Th" (Thursday)
    const days = [];
    for (let i = 0; i < daysPart.length; i++) {
      const day = daysPart[i];
      if (day === 'T' && i + 1 < daysPart.length && daysPart[i + 1] === 'h') {
        days.push('Th');
        i++; // Skip next character as it's part of "Th"
      } else {
        days.push(day);
      }
    }

    // Parse time range "10:00 AM - 11:30 AM"
    const timeMatch = timePart.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
    if (!timeMatch) {
      return null;
    }

    const startTimeStr = timeMatch[1];
    const endTimeStr = timeMatch[2];

    // Convert to 24-hour format and minutes
    const startMinutes = this._convertToMinutes(startTimeStr);
    const endMinutes = this._convertToMinutes(endTimeStr);

    if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
      return null;
    }

    return {
      days,
      startTime: startMinutes,
      endTime: endMinutes
    };
  }

  /**
   * Converts a time string with AM/PM to minutes from midnight.
   * @param {string} timeStr - Time string like "10:00 AM"
   * @returns {number|null} Minutes from midnight or null if invalid
   */
  _convertToMinutes(timeStr) {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i);
    if (!match) return null;

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const ampm = match[3].toUpperCase();

    // Convert 12-hour to 24-hour format
    if (ampm === 'PM' && hours !== 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  }
}

/**
 * Represents a course section with schedule and enrollment information.
 * Demonstrates ENCAPSULATION through private fields and controlled access methods.
 */
class Section {
  /**
   * Creates a new Section instance.
   * @param {number} group - Section number/group
   * @param {string} schedule - Schedule string (e.g., "MW 10:00 AM - 11:30 AM")
   * @param {string} enrolled - Enrollment string (e.g., "15/30")
   * @param {string} status - Status ("OK", "FULL", or "AT-RISK")
   */
  constructor(group, schedule, enrolled, status) {
    this.group = group;
    this.schedule = schedule;
    this.enrolled = enrolled;
    this.status = status;
    this._parsedSchedule = null; // Cache for parsed schedule
  }

  /**
   * Gets the parsed schedule, using caching for performance.
   * @returns {{days: string[], startTime: number, endTime: number}|null} Parsed schedule or null if invalid
   */
  getParsedSchedule() {
    if (this._parsedSchedule === null) {
      const parser = new StandardScheduleParser();
      this._parsedSchedule = parser.parse(this.schedule);
    }
    return this._parsedSchedule;
  }

  /**
   * Checks if the section is full based on enrollment.
   * @returns {boolean} True if the section is full
   */
  isFull() {
    const match = this.enrolled.match(/(\d+)\/(\d+)/);
    if (!match) return false;

    const current = parseInt(match[1]);
    const total = parseInt(match[2]);
    return current >= total;
  }

  /**
   * Checks if the section is at risk (underfilled).
   * @returns {boolean} True if the section is at risk
   */
  isAtRisk() {
    const match = this.enrolled.match(/(\d+)\/(\d+)/);
    if (!match) return false;

    const current = parseInt(match[1]);
    const total = parseInt(match[2]);

    // At risk if: 0 enrolled, or large section (<6 enrolled), or medium section (<2 enrolled)
    return current === 0 || (total >= 20 && current < 6) || (total >= 10 && current < 2);
  }

  /**
   * Checks if the section is viable based on given constraints.
   * @param {Object} constraints - Constraint object
   * @param {string} constraints.earliestStart - Earliest allowed start time (HH:MM)
   * @param {string} constraints.latestEnd - Latest allowed end time (HH:MM)
   * @param {boolean} constraints.allowFull - Whether to allow full sections
   * @param {boolean} constraints.allowAtRisk - Whether to allow at-risk sections
   * @returns {boolean} True if the section meets all constraints
   */
  isViable(constraints) {
    const parsed = this.getParsedSchedule();
    if (!parsed) return false;

    // Check time constraints
    const earliestMinutes = this.toMinutes(constraints.earliestStart);
    const latestMinutes = this.toMinutes(constraints.latestEnd);

    if (parsed.startTime < earliestMinutes || parsed.endTime > latestMinutes) {
      return false;
    }

    // Check enrollment constraints
    if (!constraints.allowFull && this.isFull()) {
      return false;
    }

    if (!constraints.allowAtRisk && this.isAtRisk()) {
      return false;
    }

    return true;
  }

  /**
   * Converts time string to minutes (helper method).
   * @param {string} timeStr - Time in HH:MM format
   * @returns {number} Minutes from midnight
   */
  toMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

/**
 * Utility class for detecting schedule conflicts between sections.
 * Demonstrates POLYMORPHISM by working with any Section objects.
 */
class ConflictDetector {
  /**
   * Checks if two sections have a time conflict.
   * @param {Section} section1 - First section to compare
   * @param {Section} section2 - Second section to compare
   * @returns {boolean} True if there's a time conflict
   */
  static hasConflict(section1, section2) {
    const schedule1 = section1.getParsedSchedule();
    const schedule2 = section2.getParsedSchedule();

    if (!schedule1 || !schedule2) {
      return false; // No conflict if either schedule is invalid
    }

    // Check if schedules share any days
    const sharedDays = schedule1.days.filter(day => schedule2.days.includes(day));
    if (sharedDays.length === 0) {
      return false;
    }

    // Check if time ranges overlap
    // Overlap if: start1 < end2 AND start2 < end1
    return schedule1.startTime < schedule2.endTime &&
           schedule2.startTime < schedule1.endTime;
  }
}

/**
 * Main class for generating valid course schedules using backtracking algorithm.
 */
class ScheduleGenerator {
  /**
   * Creates a new ScheduleGenerator instance.
   * @param {Array} sections - Array of section arrays (one array per course)
   * @param {Object} constraints - Constraint object for schedule generation
   */
  constructor(sections, constraints) {
    this.sections = sections;
    this.constraints = constraints;
  }

  /**
   * Generates all valid schedule combinations using backtracking.
   * @returns {Array} Array of generated schedule objects
   */
  generate() {
    const results = [];
    const viableSections = [];

    // Pre-filter viable sections for each course
    for (const courseSections of this.sections) {
      const viable = courseSections.filter(section => section.isViable(this.constraints));
      if (viable.length === 0) {
        return []; // No solution possible if any course has no viable sections
      }
      viableSections.push(viable);
    }

    // Start backtracking
    this._backtrack(0, [], results, viableSections);

    // Apply safety limit
    return results.slice(0, this.constraints.maxSchedules);
  }

  /**
   * Recursive backtracking function to generate schedule combinations.
   * @param {number} index - Current course index
   * @param {Array} current - Current selection of sections
   * @param {Array} results - Array to store valid results
   * @param {Array} viableSections - Pre-filtered viable sections per course
   */
  _backtrack(index, current, results, viableSections) {
    // Early exit if we have enough results (optimization)
    if (results.length >= this.constraints.maxSchedules) {
      return;
    }

    // Base case: all courses scheduled
    if (index >= this.sections.length) {
      const fullCount = current.filter(section => section.isFull()).length;
      if (fullCount <= this.constraints.maxFullPerSchedule) {
        // Create a copy of current array to preserve the schedule
        results.push(this._createScheduleObject([...current]));
      }
      return;
    }

    // Try each viable section for current course
    for (const section of viableSections[index]) {
      // Check conflicts with already-selected sections
      let hasConflict = false;

      for (const selectedSection of current) {
        if (ConflictDetector.hasConflict(section, selectedSection)) {
          hasConflict = true;
          break;
        }
      }

      // No conflict: add and recurse
      if (!hasConflict) {
        current.push(section);
        this._backtrack(index + 1, current, results, viableSections);
        current.pop(); // Backtrack
      }
    }
  }

  /**
   * Creates a schedule object from selected sections.
   * @param {Array} sections - Array of selected sections
   * @returns {Object} Schedule object with selections, parsed data, and metadata
   */
  _createScheduleObject(sections) {
    const parsed = sections.map(section => section.getParsedSchedule()).filter(Boolean);

    // Calculate metadata
    const fullCount = sections.filter(section => section.isFull()).length;
    const latestEnd = Math.max(...parsed.map(p => p.endTime));
    const endsByPreferred = latestEnd <= this.toMinutes(this.constraints.latestEnd);
    const hasLate = parsed.some(p => p.startTime >= this.toMinutes('12:00'));

    return {
      selections: sections,
      parsed,
      meta: {
        fullCount,
        endsByPreferred,
        hasLate,
        latestEnd
      }
    };
  }

  /**
   * Converts time string to minutes (helper method).
   * @param {string} timeStr - Time in HH:MM format
   * @returns {number} Minutes from midnight
   */
  toMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

// Export all classes
export {
  ScheduleParser,
  StandardScheduleParser,
  Section,
  ConflictDetector,
  ScheduleGenerator
};