// const { response } = require("express");

const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shinIndexedDB;

let database;
const request =indexedDB.open("budget", 1);

request.onupgradeneeded = ({ target }) => {
    let database = target.result;
    database.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = ({ target }) => {
    database = target.result;

    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = function(event) {
console.log("Error! " + event.target.errorCode);
};

function saveRecord(record) {
    const transaction = database.transaction(["pending"], "readwrite");
    const store = transaction.objectStore("pending");

    store.add(record);
}

function checkDatabase() {
    const transaction = database.transaction(["pending"], "readwrite");
    const store = transaction.objectStore("pending");
    const getAll = store.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
            .then(response => {
                return response.json();
            })
            .then(() => {
                const transaction = database.transaction(["pending"], "readwrite");
                const store = transaction.objectStore("pending");
                store.clear();
            })
        }
    }
}

window.addEventListener("online", checkDatabase);