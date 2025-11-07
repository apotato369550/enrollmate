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
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayLetters = ['M', 'T', 'W', 'Th', 'F'];
    const timeSlots = this._generateTimeSlots();

    // Parse course schedules and organize by day/time
    const scheduleMap = {};
    const courseColors = [
      '#FFB6C1', '#FFDAB9', '#FFE4B5', '#FFFACD', '#F0FFFF',
      '#E6E6FA', '#F5F5DC', '#FFF8DC', '#FFEFD5', '#FFF0F5'
    ];

    courses.forEach((course, idx) => {
      const parsed = this._parseScheduleString(course.schedule);
      if (parsed) {
        const { days, startTime, endTime } = parsed;
        const color = courseColors[idx % courseColors.length];

        // Map each day to a time slot
        days.forEach(dayLetter => {
          const dayIndex = dayLetters.indexOf(dayLetter);
          if (dayIndex !== -1) {
            const dayName = dayNames[dayIndex];
            if (!scheduleMap[dayName]) scheduleMap[dayName] = {};

            // Fill all 30-minute slots this course occupies
            for (let time = startTime; time < endTime; time += 30) {
              const hour = Math.floor(time / 60);
              const minute = time % 60;
              const timeKey = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

              if (!scheduleMap[dayName][timeKey]) {
                scheduleMap[dayName][timeKey] = {
                  code: course.courseCode,
                  name: course.courseName,
                  time: timeKey,
                  color: color,
                  room: course.room || 'TBA',
                  isStart: time === startTime
                };
              }
            }
          }
        });
      }
    });

    // Build table HTML
    let tableHTML = `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #8BC34A; color: white;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: bold;">Time</th>
    `;

    dayNames.forEach(day => {
      tableHTML += `<th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-weight: bold;">${day}</th>`;
    });

    tableHTML += `</tr></thead><tbody>`;

    // Add time slot rows
    timeSlots.forEach(time => {
      tableHTML += `<tr>
        <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold; font-size: 11px;">
          ${time}
        </td>`;

      dayNames.forEach(day => {
        const cell = scheduleMap[day] && scheduleMap[day][time];
        if (cell) {
          // Only show course info at the start time
          if (cell.isStart) {
            tableHTML += `
              <td style="padding: 10px; border: 1px solid #ddd; background-color: ${cell.color}; text-align: center; vertical-align: middle;">
                <div style="font-weight: bold; font-size: 11px;">${cell.code}</div>
                <div style="font-size: 9px;">${cell.room}</div>
              </td>`;
          } else {
            // Continue the colored cell but without text
            tableHTML += `
              <td style="padding: 10px; border: 1px solid #ddd; background-color: ${cell.color}; text-align: center; vertical-align: middle;">
              </td>`;
          }
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
   * Generate array of time slots for timetable (30-minute intervals)
   * @private
   * @returns {Array<string>} Time slots (e.g., ["07:30", "08:00", "08:30", ...])
   */
  static _generateTimeSlots() {
    const slots = [];
    for (let minutes = 450; minutes <= 1050; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
    return slots;
  }

  /**
   * Parse schedule string to extract days and time range
   * @private
   * @param {string} scheduleStr - Schedule string (e.g., "MW 10:00 AM - 11:30 AM")
   * @returns {Object|null} { days: Array, startTime: number, endTime: number } or null
   */
  static _parseScheduleString(scheduleStr) {
    if (!scheduleStr) return null;

    try {
      const parts = scheduleStr.trim().split(/\s+/);
      if (parts.length < 4) return null;

      // Extract days
      const daysPart = parts[0];
      const days = [];
      for (let i = 0; i < daysPart.length; i++) {
        const day = daysPart[i];
        if (day === 'T' && i + 1 < daysPart.length && daysPart[i + 1] === 'h') {
          days.push('Th');
          i++;
        } else {
          days.push(day);
        }
      }

      // Extract times
      const timePart = parts.slice(1).join(' ');
      const timeMatch = timePart.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
      if (!timeMatch) return null;

      const convertToMinutes = (timeStr) => {
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i);
        if (!match) return null;
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[3].toUpperCase();
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };

      const startTime = convertToMinutes(timeMatch[1]);
      const endTime = convertToMinutes(timeMatch[2]);

      if (startTime === null || endTime === null) return null;

      return { days, startTime, endTime };
    } catch (error) {
      console.warn('Error parsing schedule:', error);
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
