function getUserDataFromDB() {
    const email = sessionStorage.getItem('email');

    let userData;
    if (email) {
        const transaction = db.transaction(['users'], 'readwrite');
        const objectStore = transaction.objectStore('users');
        const index = objectStore.index('email');
        const request = index.get(email);
        console.log('In getUserDataFromDB 77 email:: ', email);
        request.onsuccess = function(event) {
            userData = event.target.result;
            console.log('In getUserDataFromDB 79 userDate:: ', userData);
            return userData;
        };
        request.onerror = function(event) {
            console.error('Error retrieving user:', event.target.errorCode);
        };
    } else {
        console.error('User Email not found in session');
    }
    console.log('In getUserDataFromDB 87 userDate:: ', userData);
    return userData;
}

function findLatestPeriodDate(userData) {

    console.log('In findLatestPeriodDate:: ', userData);
    const periodDates = userData.periodDates;
    const lastPeriodDate = userData.lastPeriodDate;

    // Convert lastPeriodDate to a Date object
    const lastPeriod = new Date(lastPeriodDate);

    // Check if periodDates is not null and has elements
    if (periodDates && periodDates.length > 0) {
        // Map the start dates to Date objects
        const periodStartDates = periodDates.map(date => new Date(date.start));

        // Find the latest start date in the periodDates array
        const latestPeriodStartDate = periodStartDates.reduce((latest, date) => {
            return date > latest ? date : latest;
        }, new Date(0));

        // Compare the latest start date with lastPeriodDate
        return latestPeriodStartDate > lastPeriod ? latestPeriodStartDate : lastPeriod;
    } else {
        // If periodDates is null or empty, return lastPeriodDate
        return lastPeriod;
    }
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
    console.log('latestDate:: ',latestDate);
    console.log('cycleLength:: ',cycleLength);
    // Start from the current month
    let nextPeriodStart = new Date(latestDate);
    console.log('nextPeriodStart:: ',nextPeriodStart)
    // Move nextPeriodStart to the first predicted period in the current or future months
    while (nextPeriodStart < today) {
        //nextPeriodStart.setDate(nextPeriodStart.getDate() + cycleLength);
        nextPeriodStart = addDaysToDate(nextPeriodStart, cycleLength)
        console.log('nextPeriodStart:: ',nextPeriodStart)
    }

    for (let i = 0; i < 3; i++) {
        // Calculate the first day of the current month + i
        const firstDayOfMonth = new Date(currentYear, currentMonth + i, 1);

        // If the next predicted period start is before the first day of the month, move it to the next cycle
        while (nextPeriodStart < firstDayOfMonth) {
            //nextPeriodStart.setDate(nextPeriodStart.getDate() + cycleLength);
            nextPeriodStart = addDaysToDate(nextPeriodStart, cycleLength)
        }

        // Calculate the next period end date
        const nextPeriodEnd = new Date(nextPeriodStart);
        //nextPeriodEnd.setDate(nextPeriodStart.getDate() + periodLength - 1);
        nextPeriodStart = addDaysToDate(nextPeriodStart, periodLength-1)

        // Calculate the ovulation period (5 days, including ovulation day)
        const ovulationStart = new Date(nextPeriodStart);
        ovulationStart.setDate(nextPeriodStart.getDate() - 14);

        const ovulationEnd = new Date(ovulationStart);
        ovulationEnd.setDate(ovulationStart.getDate() + 4);

        predictions.push({
            month: firstDayOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
            nextPeriodStart: nextPeriodStart.toISOString().slice(0, 10),
            nextPeriodEnd: nextPeriodEnd.toISOString().slice(0, 10),
            ovulationStart: ovulationStart.toISOString().slice(0, 10),
            ovulationEnd: ovulationEnd.toISOString().slice(0, 10)
        });

        // Move to the next cycle
        nextPeriodStart.setDate(nextPeriodStart.getDate() + cycleLength);
    }

    return predictions;
}

function generateCalendar(predictions) {
    const calendarGrid = document.getElementById('calendar-grid');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    calendarGrid.innerHTML = '';

    for (let i = 0; i < 3; i++) {
        const firstDayOfMonth = new Date(currentYear, currentMonth + i, 1);
        const daysInMonth = new Date(currentYear, currentMonth + i + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth + i, day);
            const dateString = date.toISOString().slice(0, 10);
            let className = 'day';

            predictions.forEach(prediction => {
                if (dateString >= prediction.periodStart && dateString <= prediction.periodEnd) {
                    className += ' period';
                }
                if (dateString >= prediction.ovulationStart && dateString <= prediction.ovulationEnd) {
                    className += ' ovulation';
                }
            });

            calendarGrid.innerHTML += `<div class="${className}">${day}</div>`;
        }
    }
}

function initCalendar() {
    //const userData = getUserDataFromDB();
    //console.log('In initCalendar userData:: ', userData);
    

    const email = sessionStorage.getItem('email');
    if (email) {
        const transaction = db.transaction(['users'], 'readwrite');
        const objectStore = transaction.objectStore('users');
        const index = objectStore.index('email');
        const request = index.get(email);
        request.onsuccess = function(event) {
            const userData = event.target.result;
            const latestDate = findLatestPeriodDate(userData);
            const periodLength = userData.cycle.periodLength;
            const cycleLength = userData.cycle.cycleLength;

            const predictions = calculatePredictionsForCurrentAndNextMonths(latestDate, periodLength, cycleLength);
            console.log('predictions:: ', predictions);
            generateCalendar(predictions);
        };
        request.onerror = function(event) {
            console.error('Error retrieving user:', event.target.errorCode);
        };
    } else {
        console.error('User Email not found in session');
    }
}

