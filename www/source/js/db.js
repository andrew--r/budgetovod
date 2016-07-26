import Promise from 'promise-polyfill';
import {
	fromNow,
} from './helpers';

const dbName = 'budgetovod3'
const objectStoreName = 'money-entries';
let initializationPromise;

export function initializeDB() {
	return initializationPromise = initializationPromise || new Promise((resolve, reject) => {
		const openDBRequest = indexedDB.open(dbName, 6);
		openDBRequest.onupgradeneeded = handleUpgradeNeeded;
		openDBRequest.onsuccess = handleSuccess(resolve);
		openDBRequest.onerror = handleError(reject);
	});
}

/**
 * @param {String} type - "spend" or "earn"
 * @param {Number} amount
 */
export function addEntry(type, amount, createdAt) {
	return new Promise((resolve, reject) => {
		initializeDB()
			.then((db) => {
				const transaction = db.transaction([objectStoreName], 'readwrite');
				const store = transaction.objectStore(objectStoreName);
				const request = store.add({
					type,
					amount,
					createdAt: createdAt || new Date().valueOf(),
				});

				request.onsuccess = resolve;
				request.onerror = reject;
			})
			.catch(reject);
	});
}

/**
 * @param {String} period - "day", "week", "month", "all"
 */
export function getEntries(period) {
	return new Promise((resolve, reject) => {
		initializeDB()
			.then((db) => {
				const nowTimestamp = new Date().valueOf();
				const transaction = db.transaction([objectStoreName], 'readonly');
				const index = transaction
					.objectStore(objectStoreName)
					.index('createdAt');
				let bound = (period !== 'all') ? fromNow(nowTimestamp)[`${period}Ago`]() : 0;

				const range = IDBKeyRange.lowerBound(bound);
				const cursor = index.openCursor(range);

				const entries = [];

				cursor.onsuccess = (event) => {
					const cursor = event.target.result;

					if (cursor) {
						entries.push(cursor.value);
						cursor.continue();
					}
				};
				cursor.onerror = handleError(reject);
				transaction.oncomplete = () => resolve(entries);
			})
			.catch(reject);
	});
}

function handleUpgradeNeeded(event) {
	const localDB = event.target.result;

	const objectStore = localDB.createObjectStore(objectStoreName, {
		autoIncrement: true,
	});

	objectStore.createIndex('createdAt', 'createdAt', {
		unique: true,
	});
}

function handleSuccess(resolve) {
	return (event) => resolve(event.target.result);
}

function handleError(reject) {
	return (event) => reject(event.target.error);
}

function logError(error) {
	console.error(error);
}
