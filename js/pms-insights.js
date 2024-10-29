// Fetch symptoms data from IndexedDB
function fetchSymptomsData(callback) {
    if (!db) {
        console.error('Database not initialized');
        return;
    }

    const email = sessionStorage.getItem('email');
    if (email) {
        const transaction = db.transaction(['users'], 'readonly');
        const objectStore = transaction.objectStore('users');
        const index = objectStore.index('email');
        const request = index.get(email);

        request.onsuccess = function(event) {
            const userData = event.target.result;
            if (userData && userData.symptoms) {
                callback(userData.symptoms);
            } else {
                console.error('No symptoms data found');
            }
        };

        request.onerror = function(event) {
            console.error('Error retrieving user:', event.target.errorCode);
        };
    } else {
        console.error('User email not found in session');
    }
}

// Process symptoms data to find top 6 symptoms
function processSymptomsData(symptomsData, type, limit = 6) {
    const symptomCounts = {};

    for (const date in symptomsData) {
        const symptoms = symptomsData[date][type] || [];
        symptoms.forEach(symptom => {
            symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
        });
    }

    return Object.entries(symptomCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
}

// Generate bar chart
function generateBarChart(symptoms) {
    const ctx = document.getElementById('pmsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: symptoms.map(s => s[0]),
            datasets: [{
                label: 'Frequency',
                data: symptoms.map(s => s[1]),
                backgroundColor: ['#0000FF', '#FF0000', '#008080', '#FFFF00', '#FFC0CB', '#00FFFF']
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    ticks: {
                        stepSize: 1
                    },
                    min: 0,
                    max: 4
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Generate donut chart
function generateDonutChart(moods) {
    const ctx = document.getElementById('moodChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: moods.map(m => m[0]),
            datasets: [{
                data: moods.map(m => m[1]),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

/*document.addEventListener('dbReady', function() {
    fetchSymptomsData(symptomsData => {
        const topSymptoms = processSymptomsData(symptomsData, 'pms', 5);
        generateBarChart(topSymptoms);

        const topMoods = processSymptomsData(symptomsData, 'mood', 3);
        generateDonutChart(topMoods);
    });
});*/

document.addEventListener('DOMContentLoaded', function() {
    const request = indexedDB.open('UserDatabase', 1);
    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('Database opened successfully');
        fetchSymptomsData(symptomsData => {
            const topSymptoms = processSymptomsData(symptomsData, 'pms', 5);
            generateBarChart(topSymptoms);
    
            const topMoods = processSymptomsData(symptomsData, 'mood', 3);
            generateDonutChart(topMoods);
        });
    };
});

