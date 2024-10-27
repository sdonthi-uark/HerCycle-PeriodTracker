const ctx = document.getElementById('flowChart').getContext('2d');
new Chart(ctx, {
    type: 'line',
    data: {
        labels: [0, 1, 2, 3, 4, 5],
        datasets: [{
            label: 'Flow Intensity',
            data: [0,2, 3, 2, 2, 1],
            borderColor: '#000000',
            fill: false,
            tension: 0.1
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'DAY'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Flow Intensity'
                },
                ticks: {
                    callback: function(value) {
                        const labels = ['Low', 'Medium', 'High'];
                        return labels[value - 1];
                    },
                    stepSize: 1,
                    min: 1,
                    max: 3
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    }
});

document.addEventListener('dbReady', calculateAndDisplayAverages);

/**
 * Calculates and displays the average cycle and period lengths for a user
 * This function is triggered when the database is ready ('dbReady' event)
 * It retrieves user data from IndexedDB, calculates averages from period dates,
 * and updates the UI with the results
 * 
 * If there is insufficient data (less than 2 period dates), it falls back to using
 * the user's configured cycle/period lengths
 * 
 * The function:
 * - Gets the user's email from session storage
 * - Queries the IndexedDB for user data
 * - Calculates average cycle length between consecutive period start dates
 * - Calculates average period length from start/end dates
 * - Updates the UI elements with calculated averages
 * 
 * @listens dbReady
 * @returns {void}
 */
function calculateAndDisplayAverages() {
    console.log('calculateAndDisplayAverages');
    const email = sessionStorage.getItem('email');
    if (!email) {
        console.error('No email found in session storage.');
        return;
    }
    console.log('calculateAndDisplayAverages::', email);
    if(email) {
        const transaction = db.transaction(['users'], 'readonly');
        const objectStore = transaction.objectStore('users');
        const index = objectStore.index('email');
        const getRequest = index.get(email);

        getRequest.onsuccess = function(event) {
            const userData = event.target.result;
            console.log('userData:: ', userData);
            if (!userData || !userData.periodDates || userData.periodDates.length < 2) {
                console.warn('Not enough data to calculate averages.');
                const averageCycleLength = userData.cycle.cycleLength;
                const averagePeriodLength = userData.cycle.periodLength;
                // Update the HTML with the calculated averages
                document.getElementById('average-cycle-length').textContent = `${Math.round(averageCycleLength)} Days`;
                document.getElementById('average-period-length').textContent = `${Math.round(averagePeriodLength)} Days`;
                return;
            }

            const periodDates = userData.periodDates;
            let totalCycleLength = 0;
            let totalPeriodLength = 0;

            // Extract and sort start dates
            const startDates = periodDates.map(date => new Date(date.start)).sort((a, b) => a - b);

            // Calculate cycle lengths between consecutive start dates
            for (let i = 0; i < startDates.length - 1; i++) {
                const cycleLength = (startDates[i + 1] - startDates[i]) / (1000 * 60 * 60 * 24);
                totalCycleLength += cycleLength;
            }

            // Calculate period lengths
            for (let i = 0; i < periodDates.length; i++) {
                const start = new Date(periodDates[i].start);
                const end = new Date(periodDates[i].end);
                const periodLength = (end - start) / (1000 * 60 * 60 * 24) + 1;
                totalPeriodLength += periodLength;
            }

            const averageCycleLength = totalCycleLength / (startDates.length - 1);
            const averagePeriodLength = totalPeriodLength / periodDates.length;

            console.log('averageCycleLength:: ', averageCycleLength);
            console.log('averagePeriodLength::', averagePeriodLength);
            // Update the HTML with the calculated averages
            document.getElementById('average-cycle-length').textContent = `${Math.round(averageCycleLength)} Days`;
            document.getElementById('average-period-length').textContent = `${Math.round(averagePeriodLength)} Days`;
        };

        getRequest.onerror = function(event) {
            console.error('Error retrieving user:', event.target.errorCode);
        };
    };
}
