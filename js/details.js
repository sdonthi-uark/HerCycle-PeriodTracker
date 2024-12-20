let isDbReady = false;
let isDomContentLoaded = false;

/**
 * Checks if both the database and DOM are ready to load user data
 * This function acts as a synchronization point between database initialization
 * and DOM content loading. It ensures user data is only loaded when both
 * prerequisites are met.
 * 
 * The function uses two boolean flags:
 * - isDbReady: Set when IndexedDB is initialized and ready
 * - isDomContentLoaded: Set when the DOM content is fully loaded
 * 
 * When both flags are true, it triggers loadUserData() to populate the form
 * 
 * @returns {void}
 */

function loadUserData() {
    const email = sessionStorage.getItem('email');
    if (!email) {
        console.error('No email found in session storage.');
        return;
    }
    
        const transaction = db.transaction(['users'], 'readonly');
        const objectStore = transaction.objectStore('users');
        const index = objectStore.index('email');
        const getRequest = index.get(email);

        getRequest.onsuccess = function(event) {
            const userData = event.target.result;
            if (!userData) {
                console.warn('User not found.');
                return;
            }
            console.log('userData:: ',userData);
            // Populate the input fields with user data
            document.getElementById('name').value = userData.profile.name || '';
            document.getElementById('dob').value = userData.profile.dob || '';
            document.getElementById('height').value = userData.profile.height || '';
            document.getElementById('weight').value = userData.profile.weight || '';
            document.getElementById('lastPeriodDate').value = userData.lastPeriodDate || '';
            document.getElementById('periodLength').value = userData.cycle.periodLength || '';
            document.getElementById('cycleLength').value = userData.cycle.cycleLength || '';
            document.getElementById('periodPredictionReminder').checked = userData.notifications.periodPredictionReminder || false;
            document.getElementById('ovulationReminder').checked = userData.notifications.ovulationReminder || false;
        };

        getRequest.onerror = function(event) {
            console.error('Error retrieving user:', event.target.errorCode);
        };
}

/*document.addEventListener('dbReady', () => {
    isDbReady = true;
    checkAndLoadUserData();
});

document.addEventListener('DOMContentLoaded', () => {
    isDomContentLoaded = true;
    checkAndLoadUserData();
});

function checkAndLoadUserData() {
    if (isDbReady && isDomContentLoaded) {
        loadUserData();
    }
}*/

document.addEventListener('DOMContentLoaded', function() {
    const request = indexedDB.open('UserDatabase', 1);
    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('Database opened successfully');
        loadUserData();
    };
});

function saveDetails(event) {
    event.preventDefault();
    console.info('Saving details...');
    const name = document.getElementById('name').value;
    const dob = document.getElementById('dob').value;
    const height = document.getElementById('height').value;
    const weight = document.getElementById('weight').value;
    const lastPeriodDate = document.getElementById('lastPeriodDate').value;
    const periodLength = document.getElementById('periodLength').value;
    const cycleLength = document.getElementById('cycleLength').value;
    const periodPredictionReminder = document.getElementById('periodPredictionReminder').value;
    const ovulationReminder = document.getElementById('ovulationReminder').value;

    // Assume email is stored in sessionStorage after signup
    const email = sessionStorage.getItem('email');
    console.info('email',email)

    if (email) {
        const transaction = db.transaction(['users'], 'readwrite');
        const objectStore = transaction.objectStore('users');
        const index = objectStore.index('email');
        const request = index.get(email);

        request.onsuccess = function(event) {
            const userData = request.result;
            console.log('userData',userData);
            userData.profile = { name, dob, height, weight};
            userData.cycle = { periodLength, cycleLength };
            userData.lastPeriodDate = lastPeriodDate;
            const periodEndDate = calculatePeriodEndDate(lastPeriodDate, periodLength);
            userData.periodDates = [{start: lastPeriodDate, end: periodEndDate}];
            userData.notifications = { periodPredictionReminder, ovulationReminder };

            const updateRequest = objectStore.put(userData);

            updateRequest.onsuccess = function() {
                console.log('User details updated in the database');
                window.location.href = 'dashboard.html';
            };

            updateRequest.onerror = function(event) {
                console.error('Error updating user details:', event.target.errorCode);
            };
        };

        request.onerror = function(event) {
            console.error('Error retrieving user:', event.target.errorCode);
        };
    } else {
        console.error('User Email not found in session');
    }
}