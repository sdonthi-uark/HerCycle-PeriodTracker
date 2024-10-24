// Initialize Flatpickr for date range selection
flatpickr("#period-dates", {
    mode: "range",
    dateFormat: "Y-m-d",
    onClose: function(selectedDates, dateStr, instance) {
        console.log("Selected dates:", dateStr);
    }
});

function savePeriodDates() {
    const periodDatesInput = document.getElementById('period-dates');
    const selectedDates = periodDatesInput.value;

    if (selectedDates) {
        // Split the selectedDates string into start and end dates
        const [startDateStr, endDateStr] = selectedDates.split(' to ');

        // Parse the start and end dates
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);


        // Assume email is stored in sessionStorage after login/signup
        const email = sessionStorage.getItem('email');

        if (email) {
            const transaction = db.transaction(['users'], 'readwrite');
            const objectStore = transaction.objectStore('users');
            const index = objectStore.index('email');
            const request = index.get(email);

            request.onsuccess = function(event) {
                const userData = event.target.result;
                if (!userData.periodDates) {
                    userData.periodDates = [];
                }

                // Add the new date range to the periodDates array
                userData.periodDates.push({ start: startDate, end: endDate });

                const updateRequest = objectStore.put(userData);

                updateRequest.onsuccess = function() {
                    console.log('Period dates saved to the database');
                };

                updateRequest.onerror = function(event) {
                    console.error('Error saving period dates:', event.target.errorCode);
                };
            };

            request.onerror = function(event) {
                console.error('Error retrieving user:', event.target.errorCode);
            };
        } else {
            console.error('Email not found in session');
        }
    } else {
        console.error("No dates selected");
    }
}

function cancel() {
    // Redirect to dashboard.html
    window.location.href = 'dashboard.html';
}

