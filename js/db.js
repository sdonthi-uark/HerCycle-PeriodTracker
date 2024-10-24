let db;

// Open IndexedDB
const request = indexedDB.open('UserDatabase', 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const objectStore = db.createObjectStore('users', { keyPath: 'userId' });
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

