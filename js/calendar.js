const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

document.getElementById('month-year').textContent = `${monthNames[currentMonth]} ${currentYear}`;

let currentMonthOffset = 0;

let isDbReady = false;
let isDomContentLoaded = false;

/**
 * Generates and displays the calendar grid for a specific month.
 * - Aligns days correctly within the grid.
 * - Highlights actual period dates from user data.
 * - Displays predicted period and ovulation dates.
 * - Updates the month and year display.
 * 
 * @param {Array} predictions - Array of predicted period and ovulation dates.
 * @param {Array} periodDates - Array of actual recorded period dates.
 * @param {number} monthOffset - Number of months to offset from the current month (0 = current month).
 */
function generateCalendar(predictions, periodDates, monthOffset) {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYear = document.getElementById('month-year');
    const today = new Date();
    const currentMonth = today.getMonth() + monthOffset;
    const currentYear = today.getFullYear() + Math.floor((today.getMonth() + monthOffset) / 12);

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    monthYear.textContent = firstDayOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    calendarGrid.innerHTML = '';

    for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
        calendarGrid.innerHTML += '<div class="day"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateString = date.toISOString().slice(0, 10);
        let className = 'day';

        // Highlight actual period dates
        periodDates.forEach(period => {
            if (dateString >= period.start && dateString <= period.end) {
                className += ' period';
            }
        });

        // Highlight predicted period and ovulation dates
        predictions.forEach(prediction => {
            if (dateString >= prediction.nextPeriodStart && dateString <= prediction.nextPeriodEnd) {
                className += ' expected';
            }
            if (dateString >= prediction.ovulationStart && dateString <= prediction.ovulationEnd) {
                className += ' ovulation';
            }
        });

        calendarGrid.innerHTML += `<div class="${className}">${day}</div>`;
    }
}

/**
 * Finds the most recent period start date from user data.
 * - Checks the periodDates array for recorded periods.
 * - Compares all start dates to find the most recent.
 * - Falls back to lastPeriodDate if no recorded periods exist.
 * 
 * @param {Object} userData - User data containing period history.
 * @returns {Date} The most recent period start date.
 */
function findLatestPeriodDate(userData) {
    const periodDates = userData.periodDates;

    // Check if periodDates is not null and has elements
    if (periodDates && periodDates.length > 0) {
        // Map the start dates to Date objects
        const periodStartDates = periodDates.map(date => new Date(date.start));

        // Find the latest start date in the periodDates array
        const latestPeriodStartDate = periodStartDates.reduce((latest, date) => {
        return date > latest ? date : latest;
        }, new Date(0));

        return latestPeriodStartDate;
    } else {
        // If periodDates is null or empty, return lastPeriodDate
        return userData.lastPeriodDate;
    }
}

/**
 * Retrieves user data from IndexedDB storage using the user's email.
 * - Uses email as a unique identifier.
 * - Returns a promise with user data or an error.
 * - Manages database transactions.
 * 
 * @param {string} email - User's email address.
 * @returns {Promise<Object>} Promise resolving to the user data object.
 */
function getUserDataFromDB(email) {
    return new Promise((resolve, reject) => {
            const transaction = db.transaction(['users'], 'readonly');
            const objectStore = transaction.objectStore('users');
            const index = objectStore.index('email');
            const getRequest = index.get(email);

            getRequest.onsuccess = function(event) {
                const userData = event.target.result;
                if (userData) {
                    resolve(userData);
                } else {
                    reject('User not found');
                }
            };

            getRequest.onerror = function(event) {
                reject('Error retrieving user: ' + event.target.errorCode);
            };
    });
}

/**
 * Initializes the calendar by fetching user data and generating the calendar view.
 * - Fetches user data from the database.
 * - Retrieves period history and cycle information.
 * - Calculates future period predictions.
 * - Renders the calendar with all relevant dates.
 */
function initCalendar() {
    const email = sessionStorage.getItem('email');
    if(email){

        const transaction = db.transaction(['users'], 'readonly');
        const objectStore = transaction.objectStore('users');
        const index = objectStore.index('email');
        const request = index.get(email);
        
        request.onsuccess = function(event) {
            const userData = event.target.result;
            const periodDates = userData.periodDates;
            const cycleLength = userData.cycle.cycleLength;

            const latestDate = findLatestPeriodDate(userData);
            const periodLength = userData.cycle.periodLength;

            const predictions = calculatePredictionsForCurrentAndNextMonths(latestDate, periodLength, cycleLength);
            generateCalendar(predictions, periodDates, currentMonthOffset);
        };
        request.onerror = function(event) {
            console.error('Error retrieving user:', event.target.errorCode);
        };
    }
    else {
        console.error('User email not found in session');
    }
}


/**
 * Utility function to add a specified number of days to a date.
 * - Creates a new date object to avoid modifying the original.
 * - Handles month and year transitions automatically.
 * 
 * @param {Date} date - The starting date.
 * @param {number} days - The number of days to add.
 * @returns {Date} A new date object with the added days.
 */
function addDaysToDate(date, days) {
    const result = new Date(date);
    result.setTime(result.getTime() + days * 24 * 60 * 60 * 1000);
    return result;
}

/**
 * Calculates period and ovulation predictions for the upcoming months.
 * - Uses the latest period date as a starting point.
 * - Calculates predictions for the next three months.
 * - Includes period and ovulation windows.
 * - Accounts for cycle length and period duration.
 * 
 * @param {Date} latestDate - The most recent period start date.
 * @param {number} periodLength - The length of the period in days.
 * @param {number} cycleLength - The length of the cycle in days.
 * @returns {Array} An array of prediction objects for the upcoming months.
 */
function calculatePredictionsForCurrentAndNextMonths(latestDate, periodLength, cycleLength) {
    const predictions = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let nextPeriodStart = new Date(latestDate);

    while (nextPeriodStart < today) {
        nextPeriodStart = addDaysToDate(nextPeriodStart, cycleLength);
    }

    for (let i = 0; i < 3; i++) {
        const firstDayOfMonth = new Date(currentYear, currentMonth + i, 1);

        while (nextPeriodStart < firstDayOfMonth) {
            nextPeriodStart = addDaysToDate(nextPeriodStart, cycleLength);
        }

        const nextPeriodEnd = addDaysToDate(nextPeriodStart, periodLength - 1);

        const ovulationStart = addDaysToDate(nextPeriodStart, -14);
        const ovulationEnd = addDaysToDate(ovulationStart, 4);

        predictions.push({
            month: firstDayOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
            nextPeriodStart: nextPeriodStart.toISOString().slice(0, 10),
            nextPeriodEnd: nextPeriodEnd.toISOString().slice(0, 10),
            ovulationStart: ovulationStart.toISOString().slice(0, 10),
            ovulationEnd: ovulationEnd.toISOString().slice(0, 10)
        });

        nextPeriodStart = addDaysToDate(nextPeriodStart, cycleLength);
    }

    return predictions;
}


    document.getElementById('next-month').addEventListener('click', function() {
        currentMonthOffset++;
        initCalendar();
    });
    
    document.getElementById('prev-month').addEventListener('click', function() {
        currentMonthOffset--;
        initCalendar();
    });

// document.addEventListener('dbReady', function() {
//     initCalendar();
// });

document.addEventListener('dbReady', () => {
    isDbReady = true;
    checkAndLoadCalendar();
});

document.addEventListener('DOMContentLoaded', () => {
    isDomContentLoaded = true;
    checkAndLoadCalendar();
});

function checkAndLoadCalendar() {
    if (isDbReady && isDomContentLoaded) {
        initCalendar();
    }
}
