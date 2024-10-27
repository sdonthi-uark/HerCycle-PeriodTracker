function handleSignup(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');

    let isValid = true;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        emailError.textContent = 'Please enter a valid email address!';
        isValid = false;
    } else {
        emailError.textContent = '';
    }

    if (password !== confirmPassword) {
        passwordError.textContent = 'Passwords do not match!';
        isValid = false;
    } else {
        passwordError.textContent = '';
    }

    if (isValid) {
        const userId = generateUserId();
        const hashedPassword = hashPassword(password);

        const transaction = db.transaction(['users'], 'readwrite');
        const objectStore = transaction.objectStore('users');
        const request = objectStore.add({ userId, email, hashedPassword });

        request.onsuccess = function() {
            console.log('User added to the database');
            // Store email in sessionStorage
            sessionStorage.setItem('email', email);
            window.location.href = 'details.html';
        };

        request.onerror = function(event) {
            console.error('Error adding user:', event.target.errorCode);
        };
    }
}

function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

function hashPassword(password) {
    // Simple hash function for demonstration (use a proper hashing library in production)
    return btoa(password);
}

function cancel() {
    // Handle cancel action, e.g., redirect to another page
    console.log('Cancelled');
    window.location.href = 'dashboard.html';
}

function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');

    const transaction = db.transaction(['users'], 'readonly');
    const objectStore = transaction.objectStore('users');
    const index = objectStore.index('email');
    const request = index.get(email);

    request.onsuccess = function(event) {
        const userData = event.target.result;

        if (userData) {
            const hashedPassword = hashPassword(password);
            if (userData.hashedPassword === hashedPassword) {
                sessionStorage.setItem('email', email);
                console.info('Login successful');
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                passwordError.textContent = 'Password does not match!';
            }
        } else {
            emailError.textContent = 'User does not exist with the given email!';
        }
    };

    request.onerror = function(event) {
        console.error('Error retrieving user:', event.target.errorCode);
    };
}
function saveSymptoms(event) {
    event.preventDefault();
    console.log('Symptoms saving to the database');
    const form = document.getElementById('symptoms-form');
    const formData = new FormData(form);

    const mood = formData.getAll('mood');
    const pms = formData.getAll('pms');
    const spotting = formData.get('spotting');
    const flow = formData.get('flow');

    const today = new Date();
    const dateKey = today.toLocaleDateString('en-US');

    const email = sessionStorage.getItem('email');

    if (email) {
        const transaction = db.transaction(['users'], 'readwrite');
        const objectStore = transaction.objectStore('users');
        const index = objectStore.index('email');
        const request = index.get(email);

        request.onsuccess = function(event) {
            const userData = event.target.result;
            console.log('userData',userData);
            if (!userData.symptoms) {
                userData.symptoms = {};
            }
            userData.symptoms[dateKey] = { mood, pms, spotting, flow };

            const updateRequest = objectStore.put(userData);

            updateRequest.onsuccess = function() {
                console.log('Symptoms saved to the database');
                window.location.href = 'dashboard.html';
            };

            updateRequest.onerror = function(event) {
                console.error('Error saving symptoms:', event.target.errorCode);
            };
        };

        request.onerror = function(event) {
            console.error('Error retrieving user:', event.target.errorCode);
        };
    } else {
        console.error('User ID not found in session');
    }
}

function calculatePeriodEndDate(lastPeriodDate, periodLength) {
    // Parse the lastPeriodDate string into a Date object
    const startDate = new Date(lastPeriodDate);

    // Add the periodLength to the start date
    const endDate = new Date(startDate);
    endDate.setTime(startDate.getTime() + periodLength* 24 * 60 * 60 * 1000);

    return formatDate(endDate);
}
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

        // Format the start and end dates
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);

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
                userData.periodDates.push({ start: formattedStartDate, end: formattedEndDate });

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
// Function to format a Date object into "YYYY-MM-DD"
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
