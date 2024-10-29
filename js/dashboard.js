/**
 * Displays the current date in the format "DD MMM YYYY" in the element with id 'current-date'
 */

let isDbReady = false;
let isDomContentLoaded = false;

function displayCurrentDate() {
    const dateElement = document.getElementById('current-date');
    const today = new Date();
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    dateElement.textContent = today.toLocaleDateString('en-GB', options);
}

/**
 * Calculates and displays the number of days until the user's next expected period
 * Uses the user's email from sessionStorage to retrieve their data from IndexedDB
 * Calculates based on either:
 * - The latest start date from recorded period dates, or
 * - The last period date if no period dates are recorded
 * Updates the 'days-until-next-period' element with the calculated days remaining
 */

function calculateDaysUntilNextPeriod() {
    const email = sessionStorage.getItem('email');
    if (email) {
        const transaction = db.transaction(['users'], 'readonly');
        const objectStore = transaction.objectStore('users');
        const index = objectStore.index('email');
        const request = index.get(email);

        request.onsuccess = function(event) {
            const userData = event.target.result;
            if (userData) {
                const cycleLength = parseInt(userData.cycle.cycleLength, 10);
                let latestStartDate;

                if (userData.periodDates && userData.periodDates.length > 0) {
                    const periodStartDates = userData.periodDates.map(date => new Date(date.start));
                    
                    // Find the latest start date
                    latestStartDate = periodStartDates.reduce((latest, date) => {
                        return date > latest ? date : latest;
                    }, new Date(0));
                } else {
                    latestStartDate = new Date(userData.lastPeriodDate);
                }

                if (!isNaN(latestStartDate.getTime())) {
                    const today = new Date();
                    let nextPeriodDate = new Date(latestStartDate);
                    // Calculate the next period date if the last period was a few months back
                    while (nextPeriodDate < today) {
                        //nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);
                        nextPeriodDate.setTime(nextPeriodDate.getTime() + cycleLength * 24 * 60 * 60 * 1000);
                    }
                    
                    //const timeDiff = nextPeriodDate - today;
                    const timeDiff = nextPeriodDate.getTime() - today.getTime();
                    const daysUntilNextPeriod = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

                    document.getElementById('days-until-next-period').textContent = `${daysUntilNextPeriod} Days for your next period`;
                } else {
                    console.error('Invalid latestStartDate');
                }
            }
        };

        request.onerror = function(event) {
            console.error('Error retrieving user:', event.target.errorCode);
        };
    }
}
displayCurrentDate();
/*document.addEventListener('dbReady', function() {
    calculateDaysUntilNextPeriod();
});*/

/*document.addEventListener('dbReady', function() {
    isDbReady = true;
    checkAndLoadDashboard();
    //calculateDaysUntilNextPeriod();
});*/

document.addEventListener('DOMContentLoaded', function() {
    const request = indexedDB.open('UserDatabase', 1);
    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('Database opened successfully');
        calculateDaysUntilNextPeriod();
    };
});

function checkAndLoadDashboard() {
    if (isDbReady && isDomContentLoaded) {
        calculateDaysUntilNextPeriod();
    }
}