/**
 * PDF Exporter Utility
 * Exports schedules as PDFs styled like University schedule format
 * Uses jsPDF and html2canvas for client-side generation
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class PDFExporter {
  /**
   * Export a schedule as PDF
   * @param {Object} schedule - Schedule object with courses array
   * @param {string} filename - Output filename
   * @returns {Promise<void>}
   */
  static async exportSchedule(schedule, filename = `${schedule.name}.pdf`) {
    try {
      // Create temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '1100px';
      container.style.backgroundColor = 'white';
      container.style.padding = '30px';
      document.body.appendChild(container);

      // Build HTML content
      container.innerHTML = this._buildPDFContent(schedule);

      // Convert to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Calculate dimensions to fit on one page
      let imgWidth = pageWidth;
      let imgHeight = (canvas.height * pageWidth) / canvas.width;

      // If height exceeds page height, scale down to fit
      if (imgHeight > pageHeight) {
        imgHeight = pageHeight;
        imgWidth = (canvas.width * pageHeight) / canvas.height;
      }

      const imgData = canvas.toDataURL('image/png');

      // Center the image on the page
      const xOffset = (pageWidth - imgWidth) / 2;
      const yOffset = (pageHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      pdf.save(filename);

      document.body.removeChild(container);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    }
  }

  /**
   * Build PDF HTML content
   * @private
   */
  static _buildPDFContent(schedule) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <div style="font-family: Arial, sans-serif; color: #000;">
        <table style="width: 100%; margin-bottom: 20px;">
          <tr>
            <td style="width: 100px; vertical-align: top;">
              <svg width="80" height="80" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="#2E7D32" stroke="#1B5E20" stroke-width="2"/>
                <circle cx="50" cy="50" r="35" fill="none" stroke="#4CAF50" stroke-width="2"/>
                <circle cx="50" cy="50" r="25" fill="none" stroke="#66BB6A" stroke-width="1"/>
                <path d="M 35 50 L 45 60 L 65 40" stroke="#FFF" stroke-width="3" fill="none"/>
              </svg>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <h1 style="margin: 0; font-size: 22px;">Student Schedule</h1>
              <p style="margin: 3px 0; font-size: 11px; color: #666;">ENROLLMATE</p>
            </td>
          </tr>
        </table>

        <table style="width: 100%; margin-bottom: 15px; font-size: 11px;">
          <tr>
            <td style="text-align: left;"><strong>Academic Term & Year :</strong> ${schedule.name}</td>
            <td style="text-align: right;"><strong>Date Generated :</strong> ${dateStr}</td>
          </tr>
        </table>

        ${this._buildTimetable(schedule.courses)}
      </div>
    `;
  }

  /**
   * Build timetable grid
   * @private
   */
  static _buildTimetable(courses) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayLetters = ['M', 'T', 'W', 'Th', 'F', 'S'];

    // Calculate dynamic time range from courses
    const timeRange = this._calculateTimeRange(courses);

    // Generate 30-min slots based on actual course times
    const slots = [];
    for (let time = timeRange.start; time <= timeRange.end; time += 30) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;
      slots.push({ hour, minute });
    }

    // Color palette matching sample
    const colors = [
      '#FFB380', // Orange
      '#FF8B94', // Pink/Red
      '#B8A8C8', // Purple
      '#8FD4C1', // Teal
      '#A8D5BA', // Green
      '#FFD6A5', // Peach
    ];

    // Parse courses and map to grid
    const grid = {};
    courses.forEach((course, idx) => {
      const parsed = this._parseSchedule(course.schedule);
      if (!parsed) return;

      const color = colors[idx % colors.length];
      parsed.days.forEach(day => {
        const dayIdx = dayLetters.indexOf(day);
        if (dayIdx === -1) return;
        const dayName = days[dayIdx];

        if (!grid[dayName]) grid[dayName] = {};

        // Fill all slots this course occupies
        for (let time = parsed.startMinutes; time < parsed.endMinutes; time += 30) {
          const hour = Math.floor(time / 60);
          const minute = time % 60;
          const slotKey = `${hour}:${minute}`;

          if (!grid[dayName][slotKey]) {
            grid[dayName][slotKey] = {
              code: course.courseCode || course.course_code,
              color,
              isFirst: time === parsed.startMinutes
            };
          }
        }
      });
    });

    // Build table
    let html = `
      <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
        <thead>
          <tr style="background-color: #fff; border: 1px solid #000;">
            <th style="border: 1px solid #000; padding: 4px 6px; width: 130px; font-weight: bold; font-size: 9px;">Time</th>
    `;

    days.forEach(day => {
      html += `<th style="border: 1px solid #000; padding: 4px 6px; font-weight: bold; font-size: 9px;">${day}</th>`;
    });
    html += `</tr></thead><tbody>`;

    // Add rows (skip the last slot as it's just the end time marker)
    slots.slice(0, -1).forEach(slot => {
      const timeStr = this._formatTimeRange(slot.hour, slot.minute);
      const slotKey = `${slot.hour}:${slot.minute}`;

      html += `<tr style="height: 20px;"><td style="border: 1px solid #000; padding: 2px 6px; background-color: #f9f9f9; font-weight: bold; font-size: 8px;">${timeStr}</td>`;

      days.forEach(day => {
        const cell = grid[day] && grid[day][slotKey];
        if (cell) {
          if (cell.isFirst) {
            html += `<td style="border: 1px solid #000; padding: 4px; background-color: ${cell.color}; text-align: center; font-weight: bold; font-size: 9px; vertical-align: middle;">${cell.code}</td>`;
          } else {
            html += `<td style="border: 1px solid #000; padding: 4px; background-color: ${cell.color};"></td>`;
          }
        } else {
          html += `<td style="border: 1px solid #000; padding: 4px; background-color: #fff;"></td>`;
        }
      });

      html += `</tr>`;
    });

    html += `</tbody></table>`;
    return html;
  }

  /**
   * Parse schedule string
   * @private
   */
  static _parseSchedule(scheduleStr) {
    if (!scheduleStr) return null;

    try {
      const parts = scheduleStr.trim().split(/\s+/);
      if (parts.length < 4) return null;

      // Parse days
      const daysPart = parts[0];
      const days = [];
      for (let i = 0; i < daysPart.length; i++) {
        if (daysPart[i] === 'T' && daysPart[i + 1] === 'h') {
          days.push('Th');
          i++;
        } else {
          days.push(daysPart[i]);
        }
      }

      // Parse times
      const timePart = parts.slice(1).join(' ');
      const match = timePart.match(/(\d{1,2}):(\d{2})\s*([AP]M)\s*-\s*(\d{1,2}):(\d{2})\s*([AP]M)/i);
      if (!match) return null;

      const startMinutes = this._timeToMinutes(parseInt(match[1]), parseInt(match[2]), match[3]);
      const endMinutes = this._timeToMinutes(parseInt(match[4]), parseInt(match[5]), match[6]);

      return { days, startMinutes, endMinutes };
    } catch (e) {
      return null;
    }
  }

  /**
   * Convert time to minutes
   * @private
   */
  static _timeToMinutes(hour, minute, period) {
    let h = hour;
    if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    return h * 60 + minute;
  }

  /**
   * Format time for display
   * @private
   */
  static _formatTime(hour, minute) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    const displayMin = minute.toString().padStart(2, '0');
    return `${displayHour.toString().padStart(2, '0')}:${displayMin} ${period}`;
  }

  /**
   * Format time as a range (e.g., "09:00 AM-09:30 AM")
   * @private
   */
  static _formatTimeRange(hour, minute) {
    const startTime = this._formatTime(hour, minute);

    // Calculate end time (30 minutes later)
    let endMinutes = hour * 60 + minute + 30;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const endTime = this._formatTime(endHour, endMin);

    return `${startTime}-${endTime}`;
  }

  /**
   * Calculate dynamic time range from courses
   * @private
   */
  static _calculateTimeRange(courses) {
    if (!courses || courses.length === 0) {
      // Default to 7 AM - 6 PM if no courses
      return { start: 7 * 60, end: 18 * 60 };
    }

    let minStart = Infinity;
    let maxEnd = -Infinity;

    courses.forEach(course => {
      const parsed = this._parseSchedule(course.schedule);
      if (parsed) {
        minStart = Math.min(minStart, parsed.startMinutes);
        maxEnd = Math.max(maxEnd, parsed.endMinutes);
      }
    });

    // If no valid courses parsed, use defaults
    if (minStart === Infinity || maxEnd === -Infinity) {
      return { start: 7 * 60, end: 18 * 60 };
    }

    // Round down start time to nearest 30-min slot
    const start = Math.floor(minStart / 30) * 30;

    // Round up end time to nearest 30-min slot
    const end = Math.ceil(maxEnd / 30) * 30;

    return { start, end };
  }
}

export default PDFExporter;
