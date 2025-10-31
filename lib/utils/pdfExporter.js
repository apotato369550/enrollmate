/**
 * PDF Exporter Utility
 * Exports schedules as PDFs with timetable and course list
 * Uses jsPDF and html2canvas for client-side generation
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class PDFExporter {
  /**
   * Export a schedule as PDF
   * Includes timetable visualization and course listing
   * @param {Object} schedule - Schedule object with courses array
   * @param {string} filename - Output filename (default: "schedule.pdf")
   * @returns {Promise<void>}
   */
  static async exportSchedule(schedule, filename = `${schedule.name}.pdf`) {
    try {
      // Create a temporary container for rendering
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '1200px';
      container.style.backgroundColor = 'white';
      container.style.padding = '40px';
      container.style.fontFamily = 'Plus Jakarta Sans, sans-serif';
      document.body.appendChild(container);

      // Build HTML content for PDF
      container.innerHTML = this._buildPDFContent(schedule);

      // Convert HTML to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Create PDF in landscape orientation
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      // Add additional pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      // Download PDF
      pdf.save(filename);

      // Clean up temporary container
      document.body.removeChild(container);
    } catch (error) {
      console.error('Error exporting schedule to PDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  /**
   * Build HTML content for PDF rendering
   * @private
   * @param {Object} schedule - Schedule object
   * @returns {string} HTML string
   */
  static _buildPDFContent(schedule) {
    const timetableHTML = this._buildTimetable(schedule.courses);
    const courseListHTML = this._buildCourseList(schedule.courses);

    return `
      <div style="font-family: Plus Jakarta Sans, sans-serif; color: #333;">
        <!-- Header -->
        <div style="margin-bottom: 30px; border-bottom: 3px solid #8BC34A; padding-bottom: 20px;">
          <h1 style="color: #8BC34A; margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">
            ${schedule.name}
          </h1>
          <p style="margin: 5px 0; color: #666; font-size: 12px;">
            Generated on ${new Date().toLocaleDateString()}
          </p>
        </div>

        <!-- Timetable Section -->
        <div style="margin-bottom: 40px;">
          <h2 style="color: #7CB342; font-size: 18px; margin: 0 0 20px 0; border-bottom: 2px solid #9ACD32; padding-bottom: 10px;">
            Weekly Timetable
          </h2>
          ${timetableHTML}
        </div>

        <!-- Course List Section -->
        <div>
          <h2 style="color: #7CB342; font-size: 18px; margin: 0 0 20px 0; border-bottom: 2px solid #9ACD32; padding-bottom: 10px;">
            Course Details
          </h2>
          ${courseListHTML}
        </div>

        <!-- Footer -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #999;">
          <p>EnrollMate - Course Schedule Planner</p>
        </div>
      </div>
    `;
  }

  /**
   * Build timetable HTML grid
   * @private
   * @param {Array} courses - Array of courses
   * @returns {string} HTML table
   */
  static _buildTimetable(courses) {
    // Days of week
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = this._generateTimeSlots();

    // Parse course schedules and organize by day/time
    const scheduleMap = {};
    const courseColors = [
      '#FFB6C1', '#FFDAB9', '#FFE4B5', '#FFFACD', '#F0FFFF',
      '#E6E6FA', '#F5F5DC', '#FFF8DC', '#FFEFD5', '#FFF0F5'
    ];

    courses.forEach((course, idx) => {
      const dayMatch = this._parseCourseSchedule(course.schedule, days);
      if (dayMatch) {
        if (!scheduleMap[dayMatch.day]) scheduleMap[dayMatch.day] = {};
        scheduleMap[dayMatch.day][dayMatch.time] = {
          code: course.courseCode,
          name: course.courseName,
          time: dayMatch.time,
          color: courseColors[idx % courseColors.length],
          room: course.room || 'TBA',
        };
      }
    });

    // Build table HTML
    let tableHTML = `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #8BC34A; color: white;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: bold;">Time</th>
    `;

    days.forEach(day => {
      tableHTML += `<th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-weight: bold;">${day}</th>`;
    });

    tableHTML += `</tr></thead><tbody>`;

    // Add time slot rows
    timeSlots.forEach(time => {
      tableHTML += `<tr>
        <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold; font-size: 11px;">
          ${time}
        </td>`;

      days.forEach(day => {
        const cell = scheduleMap[day] && scheduleMap[day][time];
        if (cell) {
          tableHTML += `
            <td style="padding: 10px; border: 1px solid #ddd; background-color: ${cell.color}; text-align: center; vertical-align: middle;">
              <div style="font-weight: bold; font-size: 11px;">${cell.code}</div>
              <div style="font-size: 9px;">${cell.room}</div>
            </td>`;
        } else {
          tableHTML += `<td style="padding: 10px; border: 1px solid #ddd; background-color: #fafafa;"></td>`;
        }
      });

      tableHTML += `</tr>`;
    });

    tableHTML += `</tbody></table>`;
    return tableHTML;
  }

  /**
   * Build course details list
   * @private
   * @param {Array} courses - Array of courses
   * @returns {string} HTML list
   */
  static _buildCourseList(courses) {
    if (!courses || courses.length === 0) {
      return '<p style="color: #999; font-style: italic;">No courses in this schedule</p>';
    }

    let listHTML = `<table style="width: 100%; border-collapse: collapse;">`;

    courses.forEach((course, idx) => {
      const bgColor = idx % 2 === 0 ? '#ffffff' : '#f9f9f9';
      listHTML += `
        <tr style="background-color: ${bgColor}; border-bottom: 1px solid #eee;">
          <td style="padding: 12px; border: 1px solid #ddd;">
            <div style="font-weight: bold; color: #8BC34A; margin-bottom: 5px;">
              ${course.courseCode} - Section ${course.sectionGroup}
            </div>
            <div style="font-size: 12px; margin: 3px 0;">
              ${course.courseName}
            </div>
            <div style="font-size: 11px; color: #666; margin-top: 5px;">
              <strong>Schedule:</strong> ${course.schedule}<br>
              <strong>Room:</strong> ${course.room || 'TBA'}<br>
              <strong>Instructor:</strong> ${course.instructor || 'TBA'}<br>
              <strong>Enrollment:</strong> ${course.enrolledCurrent}/${course.enrolledTotal} (${this._getEnrollmentPercentage(course)}%)
            </div>
          </td>
        </tr>
      `;
    });

    listHTML += `</table>`;
    return listHTML;
  }

  /**
   * Generate array of time slots for timetable
   * @private
   * @returns {Array<string>} Time slots (e.g., ["08:00", "09:00", ...])
   */
  static _generateTimeSlots() {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      const time = `${String(hour).padStart(2, '0')}:00`;
      slots.push(time);
    }
    return slots;
  }

  /**
   * Parse course schedule string and extract day/time
   * @private
   * @param {string} schedule - Schedule string (e.g., "MW 11:00 AM - 12:30 PM")
   * @param {Array<string>} days - Array of day names
   * @returns {Object|null} { day, time } or null if parse fails
   */
  static _parseCourseSchedule(schedule, days) {
    if (!schedule) return null;

    try {
      // Extract time from schedule (e.g., "11:00 AM" from "MW 11:00 AM - 12:30 PM")
      const timeMatch = schedule.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
      if (!timeMatch) return null;

      let hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2];
      const period = timeMatch[3].toUpperCase();

      // Convert to 24-hour format
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;

      const time = `${String(hour).padStart(2, '0')}:${minute}`;

      // Extract first day mentioned in schedule (e.g., "M" from "MW")
      const dayMatch = schedule.match(/[MTWRF]+/i);
      if (!dayMatch) return null;

      const dayLetters = dayMatch[0].toUpperCase();
      let day = null;

      // Map day letters to full day names
      const dayMap = {
        'M': 'Monday',
        'T': 'Tuesday',
        'W': 'Wednesday',
        'R': 'Thursday',
        'F': 'Friday'
      };

      // Use first day letter mentioned
      if (dayLetters.length > 0) {
        day = dayMap[dayLetters[0]];
      }

      return day && days.includes(day) ? { day, time } : null;
    } catch (error) {
      console.warn('Error parsing course schedule:', error);
      return null;
    }
  }

  /**
   * Calculate enrollment percentage
   * @private
   * @param {Object} course - Course object
   * @returns {number} Percentage
   */
  static _getEnrollmentPercentage(course) {
    if (course.enrolledTotal === 0) return 0;
    return Math.round((course.enrolledCurrent / course.enrolledTotal) * 100);
  }
}

export default PDFExporter;
