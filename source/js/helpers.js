export function toArray(collection) {
	return [].slice.call(collection);
}

export function capitalize(string) {
	return string[0].toUpperCase() + string.slice(1);
}

export function createInputMarkup(type) {
	return `
		<div class="input-field">
			<input type="${type}" class="modal-text-input" />
		</div>
	`;
}

export function fromNow(timestamp) {
	const day = 1000 * 60 * 60 * 24;
	const week = day * 7;
	const month = day * 30;

	return {
		dayAgo() {
			return timestamp - day;
		},
		weekAgo() {
			return timestamp - week;
		},
		monthAgo() {
			return timestamp - month;
		},
	};
}
