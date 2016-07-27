import {
	createInputMarkup,
	toArray,
	capitalize,
} from './helpers';

import {
	addEntry,
	getEntries,
} from './db';

let application;

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

// Classes
const applicationBase = 'application';
const tabsNavBase = 'tabs-nav';
const moneyStatsBase = 'money-stats';
const resultStatsBase = 'result-stats';

const classes = {
	application: {
		base: applicationBase,
		initialized: `${applicationBase}--initialized`,
	},
	tabs: {
		base: tabsNavBase,
		item: {
			base: `${tabsNavBase}__item`,
			active: `${tabsNavBase}__item--active`,
		},
	},
	moneyStats: {
		base: moneyStatsBase,
		value: {
			earned: `${moneyStatsBase}__value--earned`,
			spent: `${moneyStatsBase}__value--spent`,
		},
	},
	resultStats: {
		base: resultStatsBase,
		negative: `${resultStatsBase}--negative`,
		positive: `${resultStatsBase}--positive`,
		annotation: `${resultStatsBase}__annotation`,
		value: `${resultStatsBase}__value`,
	},
};

class App {
	constructor() {
		this.f7 = new Framework7();
		this.state = {
			currentTab: 'day',
		};
	}

	initialize() {
		this.elements = {
			application: $(`.${classes.application.base}`),
			tabs: $(`.${classes.tabs.base}`),
			earned: $(`.${classes.moneyStats.value.earned}`),
			spent: $(`.${classes.moneyStats.value.spent}`),
			result: $(`.${classes.resultStats.base}`),
			resultAnnotation: $(`.${classes.resultStats.annotation}`),
			resultValue: $(`.${classes.resultStats.value}`),
		};

		this.mainView = this.f7.addView('.view-main', {dynamicNavbar: true});
		this.bindEventHandlers();
		this.renderStats();
		this.f7.showPreloader('Считаю деньги...');

		setTimeout(() => {
			this.f7.hidePreloader();
			this.elements.application.classList.add(classes.application.initialized);
		}, 700);
	}

	bindEventHandlers() {
		const earnModalTogglers = toArray($$('[data-modal="earn"]'));
		const spendModalTogglers = toArray($$('[data-modal="spend"]'));

		earnModalTogglers.forEach((element) => {
			element.addEventListener('click', this.showEarnPrompt.bind(this));
		});

		spendModalTogglers.forEach((element) => {
			element.addEventListener('click', this.showSpendPrompt.bind(this));
		});

		this.elements.tabs.addEventListener('click', this.switchTab.bind(this));
	}

	switchTab(event) {
		const {currentTarget, target} = event;
		if (!target.classList.contains(classes.tabs.item.base)) return;
		const activeClass = classes.tabs.item.active;
		currentTarget.querySelector(`.${activeClass}`).classList.remove(activeClass);
		target.classList.add(activeClass);
		this.state.currentTab = target.getAttribute('data-tab');
		this.renderStats();
	}

	renderStats(period) {
		const {elements} = this;

		getEntries(this.state.currentTab).then((entries) => {
			const totalEarned = entries.reduce(getEntriesAmount('earn'), 0);
			const totalSpent = entries.reduce(getEntriesAmount('spend'), 0);
			const result = totalEarned - totalSpent;

			elements.earned.innerText = totalEarned;
			elements.spent.innerText = totalSpent;

			this._renderResult(result);
		});
	}

	_renderResult(value) {
		const {elements} = this;
		const annotation = (value < 0) ? 'Ну ты и транжира!' : 'Продолжай в том же духе!';

		elements.resultAnnotation.innerText = annotation;
		elements.resultValue.innerText = (value < 0) ? value * -1 : value;

		elements.result.classList.remove((value < 0) ? classes.resultStats.positive : classes.resultStats.negative);
		elements.result.classList.add((value < 0) ? classes.resultStats.negative : classes.resultStats.positive);
	}

	showEarnPrompt() {
		createPrompt('Сколько заработано?', createModalCallback('earn'));
	}

	showSpendPrompt() {
		createPrompt('Сколько потрачено?', createModalCallback('spend'));
	}
}

function createPrompt(title, onSuccess) {
	const prompt = application.f7.modal({
		title,
		afterText: createInputMarkup('number'),
		buttons: [
			{
				text: 'Отмена',
			},
			{
				text: 'Записать',
				bold: true,
				onClick: onSuccess,
			},
		],
	});

	prompt.addEventListener('opened', (event) => {
		event.currentTarget.querySelector('input').focus();
	});
}

function createModalCallback(type) {
	return () => {
		const amount = parseInt($$('.modal input')[0].value, 10);

		if (!amount) {
			application[`show${capitalize(type)}Prompt`]();
		} else {
			saveEntry(type, amount);
		}
	};
}

function saveEntry(type, amount) {
	application.f7.showPreloader('Сохраняем');

	addEntry(type, amount).then(() => {
		// setTimeout for better ux
		setTimeout(application.f7.hidePreloader, 400);
		application.renderStats();
	});
}

function getEntriesAmount(type) {
	return (result, currentEntry) => {
		if (currentEntry.type === type) {
			result += currentEntry.amount;
		}

		return result;
	};
}

function onDeviceReady() {
	application = new App();
	application.initialize();
}

function handleErrors() {
	navigator.app.exitApp();
}

document.addEventListener('deviceready', onDeviceReady);
window.onerror = handleErrors;
