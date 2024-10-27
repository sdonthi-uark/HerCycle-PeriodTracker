function displayCurrentDate() {
    const dateElement = document.getElementById('current-date');
    const today = new Date();
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    dateElement.textContent = today.toLocaleDateString('en-GB', options);
}
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
document.addEventListener('dbReady', function() {
    calculateDaysUntilNextPeriod();
});