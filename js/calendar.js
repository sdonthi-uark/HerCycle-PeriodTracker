const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

document.getElementById('month-year').textContent = `${monthNames[currentMonth]} ${currentYear}`;

/*function generateCalendar(date) {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYear = document.getElementById('month-year');
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();

    monthYear.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Assume periodDates and cycleLength are retrieved from the database
    const periodDates = [
    { start: '2024-09-14', end: '2024-09-19' },
    { start: '2024-10-12', end: '2024-10-16' }
    ];
    const cycleLength = 28;

    // Generate calendar days
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    calendarGrid.innerHTML = '';

    for (let i = 0; i < firstDayOfMonth; i++) {
    calendarGrid.innerHTML += '<div class="day"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateString = date.toISOString().slice(0, 10);
    let className = 'day';

    // Highlight period dates
    periodDates.forEach(period => {
    if (dateString >= period.start && dateString <= period.end) {
    className += ' period';
    }
    });

    // Calculate next expected period
    const lastPeriod = periodDates[periodDates.length - 1];
    const lastPeriodEndDate = new Date(lastPeriod.end);
    const nextPeriodStartDate = new Date(lastPeriodEndDate);
    nextPeriodStartDate.setDate(lastPeriodEndDate.getDate() + cycleLength);

    if (dateString === nextPeriodStartDate.toISOString().slice(0, 10)) {
    className += ' expected';
    }

    // Calculate ovulation
    const ovulationStartDate = new Date(nextPeriodStartDate);
    ovulationStartDate.setDate(nextPeriodStartDate.getDate() - 14);
    const ovulationEndDate = new Date(ovulationStartDate);
    ovulationEndDate.setDate(ovulationStartDate.getDate() + 5);

    if (date >= ovulationStartDate && date <= ovulationEndDate) {
    className += ' ovulation';
    }

    calendarGrid.innerHTML += `<div class="${className}">${day}</div>`;
    }
}*/
let currentMonthOffset = 0;
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

function initCalendar() {
    const email = sessionStorage.getItem('email');
    getUserDataFromDB(email)
        .then(userData => {
            const periodDates = userData.periodDates;
            const cycleLength = userData.cycle.cycleLength;

            const latestDate = findLatestPeriodDate(userData);
            const periodLength = userData.cycle.periodLength;

            const predictions = calculatePredictionsForCurrentAndNextMonths(latestDate, periodLength, cycleLength);
            console.log('predictions:: ',predictions)
            console.log('periodDates:: ',periodDates)
            generateCalendar(predictions, periodDates, currentMonthOffset);
        })
        .catch(error => {
            console.error(error);
        });
}

function addDaysToDate(date, days) {
    const result = new Date(date);
    result.setTime(result.getTime() + days * 24 * 60 * 60 * 1000);
    return result;
}

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

/*document.getElementById('next-month').addEventListener('click', function() {
    const currentMonthYear = document.getElementById('month-year').textContent;
    const currentDate = new Date(currentMonthYear);
    const nextMonthDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
    generateCalendar(nextMonthDate);
    });

document.getElementById('prev-month').addEventListener('click', function() {
    const currentMonthYear = document.getElementById('month-year').textContent;
    const currentDate = new Date(currentMonthYear);
    const prevMonthDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
    generateCalendar(prevMonthDate);
    });*/
    document.getElementById('next-month').addEventListener('click', function() {
        currentMonthOffset++;
        initCalendar();
    });
    
    document.getElementById('prev-month').addEventListener('click', function() {
        currentMonthOffset--;
        initCalendar();
    });

document.addEventListener('dbReady', function() {
    initCalendar();
});