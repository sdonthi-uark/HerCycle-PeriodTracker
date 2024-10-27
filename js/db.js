let db;

// Open IndexedDB
const request = indexedDB.open('UserDatabase', 1);

/**
 * IndexedDB database initialization and configuration
 * Creates a database named 'UserDatabase' to store user information
 * 
 * The database stores:
 * - User profiles with personal details
 * - Period tracking data and cycle information  
 * - Symptoms and mood tracking
 * - Notification preferences
 * 
 * @type {IDBDatabase} db - The IndexedDB database instance
 */

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const objectStore = db.createObjectStore('users', { keyPath: 'email' });
    objectStore.createIndex('email', 'email', { unique: true });
};

request.onsuccess = function(event) {
    db = event.target.result;
    console.log('Database opened successfully');
    document.dispatchEvent(new Event('dbReady'));
};

request.onerror = function(event) {
    console.error('Database error:', event.target.errorCode);
};

