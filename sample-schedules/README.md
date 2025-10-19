# Enrollmate Sample Schedules

This directory contains sample CSV files for different student archetypes. Use these to quickly test the Enrollmate Scheduler with realistic course data!

## 📁 Folder Structure

```
sample-schedules/
├── computer-science/    🖥️  CS student (6 courses)
├── engineering/         ⚙️  Engineering student (6 courses)
├── law/                ⚖️  Law student (6 courses)
├── psychology/         🧠  Psychology student (6 courses)
├── biology/            🧬  Biology student (6 courses)
├── physics/            ⚛️  Physics student (6 courses)
├── finance/            💰  Finance student (6 courses)
└── accounting/         📊  Accounting student (6 courses)
```

## 🎓 Student Archetypes

### Computer Science Student
**File:** `computer-science/cs-student-schedule.csv`

**Courses:**
- CIS 3100 - Data Structures and Algorithms
- CIS 3320 - Networking II
- CIS 2250 - Assembly Language Programming
- CIS 2103 - Object-Oriented Programming
- CIS 3210 - Web Development II
- MATH 2010 - Calculus I

**Typical Schedule:** Mix of morning and afternoon classes, 3 sections per course

---

### Engineering Student
**File:** `engineering/engineering-student-schedule.csv`

**Courses:**
- ENGR 2100 - Engineering Mechanics
- ENGR 2220 - Thermodynamics
- ENGR 3110 - Fluid Mechanics
- ENGR 2400 - Materials Science
- ENGR 3300 - Circuit Analysis
- MATH 3020 - Differential Equations

**Typical Schedule:** Heavy math/science focus, lab sections available

---

### Law Student
**File:** `law/law-student-schedule.csv`

**Courses:**
- LAW 1101 - Introduction to Legal Systems
- LAW 2210 - Constitutional Law
- LAW 2350 - Criminal Law
- LAW 3120 - Contract Law
- LAW 2450 - Legal Research and Writing
- POLS 1101 - American Government

**Typical Schedule:** 2-hour blocks for in-depth discussion, larger class sizes

---

### Psychology Student
**File:** `psychology/psychology-student-schedule.csv`

**Courses:**
- PSYC 1101 - Introduction to Psychology
- PSYC 2210 - Developmental Psychology
- PSYC 2350 - Abnormal Psychology
- PSYC 3140 - Cognitive Psychology
- PSYC 3200 - Research Methods in Psychology
- STAT 2000 - Introduction to Statistics

**Typical Schedule:** Mix of large lectures and smaller research methods courses

---

### Biology Student
**File:** `biology/biology-student-schedule.csv`

**Courses:**
- BIOL 1107 - Principles of Biology I
- BIOL 2120 - Genetics
- BIOL 2230 - Microbiology
- BIOL 3150 - Cell Biology
- BIOL 3340 - Ecology
- CHEM 1211 - Principles of Chemistry I

**Typical Schedule:** Large lecture sections with lab components

---

### Physics Student
**File:** `physics/physics-student-schedule.csv`

**Courses:**
- PHYS 2211 - Principles of Physics I
- PHYS 2212 - Principles of Physics II
- PHYS 3110 - Modern Physics
- PHYS 3240 - Quantum Mechanics
- PHYS 3350 - Electromagnetism
- MATH 3030 - Linear Algebra

**Typical Schedule:** Challenging upper-level courses with smaller class sizes

---

### Finance Student
**File:** `finance/finance-student-schedule.csv`

**Courses:**
- FIN 3100 - Corporate Finance
- FIN 3220 - Investment Analysis
- FIN 3340 - Financial Markets and Institutions
- FIN 3450 - Risk Management
- FIN 4100 - International Finance
- ECON 2105 - Principles of Macroeconomics

**Typical Schedule:** Business school hours, medium-sized sections

---

### Accounting Student
**File:** `accounting/accounting-student-schedule.csv`

**Courses:**
- ACCT 2101 - Financial Accounting
- ACCT 2102 - Managerial Accounting
- ACCT 3110 - Intermediate Accounting I
- ACCT 3220 - Cost Accounting
- ACCT 4150 - Auditing
- BUSA 2106 - Legal Environment of Business

**Typical Schedule:** Sequential accounting courses with business electives

---

## 📥 How to Use These Samples

### Method 1: Import via Web Interface

1. Navigate to `/scheduler` in your Enrollmate app
2. Look for the **"Import CSV"** button (green button in the top-right of the "Add Courses" panel)
3. Click and select one of the CSV files from this folder
4. The courses will automatically populate in the interface
5. Adjust constraints as needed (time preferences, enrollment options)
6. Click **"Generate Schedules"** to see conflict-free options!

### Method 2: Manual Copy-Paste

1. Open any CSV file in a text editor
2. Copy the course data
3. Use the manual course entry form in the scheduler interface
4. Add each course and its sections individually

---

## 📊 CSV File Format

All CSV files follow this format:

```csv
Course Code,Course Name,Group,Schedule,Enrolled
CIS 3100,Data Structures and Algorithms,1,MW 11:00 AM - 12:30 PM,25/30
```

**Columns:**
- **Course Code**: Unique identifier (e.g., CIS 3100)
- **Course Name**: Full course title
- **Group**: Section number (1, 2, 3, etc.)
- **Schedule**: Day/time format (e.g., "MW 10:00 AM - 11:30 AM")
  - Day codes: M (Monday), T (Tuesday), W (Wednesday), Th (Thursday), F (Friday)
- **Enrolled**: Current/Total enrollment (e.g., "25/30")

---

## ✨ Features to Test

With these samples, you can test:

✅ **Conflict Detection** - Mix sections to see which combinations work
✅ **Time Constraints** - Filter by earliest/latest class times
✅ **Enrollment Filters** - Avoid full or at-risk sections
✅ **Visual Timetable** - See your schedule in a weekly grid
✅ **CSV Import/Export** - Import samples, export custom schedules
✅ **Save & Load** - Save generated schedules to your account

---

## 🎯 Quick Test Scenarios

### Scenario 1: Morning Person (CS Student)
- Import `computer-science/cs-student-schedule.csv`
- Set constraints: Earliest Start = 08:00, Latest End = 13:00
- Generate schedules - should get morning-only options!

### Scenario 2: Avoid Full Sections (Engineering)
- Import `engineering/engineering-student-schedule.csv`
- Uncheck "Allow full sections"
- Generate schedules - should exclude sections showing 40/40, 35/35, etc.

### Scenario 3: Night Owl (Finance)
- Import `finance/finance-student-schedule.csv`
- Set constraints: Earliest Start = 12:00, Latest End = 18:00
- Generate schedules - should prefer afternoon/evening sections

### Scenario 4: Balanced Schedule (Psychology)
- Import `psychology/psychology-student-schedule.csv`
- Keep default constraints
- Generate schedules - should get a mix of MW and TTh patterns

---

## 🔧 Customization Tips

Want to create your own archetype?

1. Copy any existing CSV file
2. Modify the course codes, names, and schedules
3. Keep the same CSV format
4. Save with a descriptive name
5. Import into Enrollmate!

**Tips:**
- Use realistic enrollment numbers (most sections shouldn't be 100% full)
- Vary section times to create more scheduling options
- Include at-risk sections (low enrollment) to test filtering
- Mix MW and TTh schedules for flexibility

---

## 📝 Notes

- Each archetype includes **6 core courses** with **3 sections each** (18 total sections)
- Enrollment numbers are realistic based on typical class sizes for each major
- Time slots avoid early morning (before 8 AM) and late evening (after 6:30 PM)
- Some sections are intentionally full or at-risk to test constraint filtering
- All schedules follow standard academic patterns (MW, TTh, or full-week)

---

## 🚀 Happy Scheduling!

These samples are designed to help you:
- Test the scheduler engine thoroughly
- Demonstrate the app to stakeholders
- Understand how different majors have different scheduling needs
- Experiment with various constraints and preferences

**Pro Tip:** Try importing multiple archetypes and mixing courses from different majors to simulate a student with diverse interests or double majors!

---

*Generated for Enrollmate Scheduler - Built with OOP principles and backtracking algorithm magic! 🧙‍♂️*
