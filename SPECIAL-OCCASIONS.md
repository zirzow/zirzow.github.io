# Seasonal homepage inserts
Edit special-occasion-settings.json only:
- "mode": "auto" automatically selects a US shopping season based on the visitor's local date. General gifts appear outside the defined windows.
- "mode": "manual", "manual": "july4" (or another ID below) overrides the calendar.
- "mode": "off" hides the homepage insert.
Each insert is standalone HTML; edit its corresponding special-occasion-ID.html file. The shared CSS is special-occasions.css. The loader is special-occasions.js. Gift links open gift-guide.html with the corresponding occasion heading and initial category. No prices or sale claims are implied.
Available IDs: general, xmas, black-friday, cyber-monday, new-year, valentines, easter, mothers-day, fathers-day, graduation, july4, back-to-school, halloween, thanksgiving, giving-tuesday, small-business-saturday, birthdays, anniversary, hanukkah, diwali, lunar-new-year, teacher-appreciation.
Manual-only: birthdays, anniversary, Hanukkah, Diwali, Lunar New Year, teacher appreciation. The others are date-based by default. U.S. Mother's Day, Father's Day, Thanksgiving and associated retail dates are computed annually; Easter uses the Gregorian Western date. Auto dates are promotional windows, not comprehensive holiday calendars. To include a movable cultural occasion, use manual mode or add a verified date rule. No background automation or server is needed.
