class Donate {

	constructor() {
		this.amount = 10;
		this.lang = window.navigator.language.substr(0, 2).toLowerCase();
		this.currency = {
			"USD": {
				"symbol": "$",
				"min": 1,
				"max": 100,
				"amount": 10
			},
			"RUB": {
				"symbol": "₽",
				"min": 100,
				"max": 5000,
				"amount": 100
			},
			"EUR": {
				"symbol": "€",
				"min": 1,
				"max": 90,
				"amount": 8
			},
			"GBR": {
				"symbol": "£",
				"min": 1,
				"max": 70,
				"amount": 7
			},
			"AUD": {
				"symbol": "$",
				"min": 1,
				"max": 128,
				"amount": 13
			},
			"CAD": {
				"symbol": "$",
				"min": 1,
				"max": 128,
				"amount": 13
			},
			"JPY": {
				"symbol": "¥",
				"min": 105,
				"max": 10491,
				"amount": 1050
			},
			"TWD": {
				"symbol": "$",
				"min": 30,
				"max": 2920,
				"amount": 292
			}
		};
		this.code = "USD";

	}

	buildCurrency(select) {
		select = document.getElementById(select);

		for (let prop in this.currency) {
			const opt = document.createElement('option');
			opt.value = prop;
			opt.textContent = prop + ' ' + this.currency[prop].symbol;
			select.appendChild(opt);
		}

	}

	viewSum() {
		document.getElementById('amount_view').textContent = this.amount + this.currency[this.code].symbol;
	}

	setCode(code) {
		this.code = code;
	}

	setAmount(amount) {
		this.amount = amount;
	}

	setRangeValue(input) {
		document.getElementById(input).value = this.amount;
	}

	setRangeCurrencyCode(name) {
		document.getElementsByName(name)[0].value = this.code;
	}

	getMinMaxRange(input) {
		input = document.getElementById(input);

		if (input.min !== this.currency[this.code].min && input.max !== this.currency[this.code].max) {
			this.setAmount(this.currency[this.code].amount);
			this.setMinMaxRange(input);
		}

	}

	setMinMaxRange(input) {
		input = typeof(input) === 'string' ? document.getElementById(input) : input;
		input.min = this.currency[this.code].min;
		input.max = this.currency[this.code].max;
		this.setRangeValue('range');
		this.callCustomEvent('range', 'change');
	}

	changeRange(input) {
		document.getElementById(input).addEventListener('change', (e) => {
			if (e.isTrusted) {
				this.setAmount(e.target.value);
			}
			this.viewSum();
			document.getElementsByName('amount')[0].value = this.amount;
			this.changeFundingAmount(this.amount);
		});
	}

	changeCurrency(select) {
		document.getElementById(select).addEventListener('change', (e) => {
			this.setCode(e.target.value);
			this.getMinMaxRange('range');
			this.setRangeCurrencyCode('currency_code');
			this.viewSum();
		});
	}

	callCustomEvent(target, ev) {
		const event = new Event(ev);
		target = typeof(target) === 'string' ? document.getElementById(target) : target;
		target.dispatchEvent(event);
	}

	setRussianTranslation(nodelist) {
		if (this.lang === 'ru') {
			nodelist = document.querySelectorAll(nodelist);
			[...nodelist].forEach((el, i) => {
				el.innerHTML = JSON.parse(el.dataset.lang).ru;
			});
		}
	}

	toggleSpinner(spinner, toggle) {
		document.getElementById(spinner).parentNode.classList[toggle ? 'remove' : 'add']('is-hidden');
	}

	buildFunding(src) {
		const iframe_parent = document.getElementById('iframe_place');

		if (!this.iframe) {

			const iframe = document.createElement('iframe');
			iframe.src = `https://funding.webmoney.ru/widgets/horizontal/${src}`;
			iframe.id = 'iframe';
			iframe.width = 468;
			iframe.height = 200;
			iframe.scrolling = 'no';
			iframe.style.border = 0;

			iframe_parent.appendChild(iframe);

			iframe.onload = () => {
				this.toggleSpinner('spinner');
				this.iframe = true;
			};
		}
	}

	setCurrency(code) {
		const select = document.getElementById('select_currency');
		const indx = [...select.options].map((v) => v.value).indexOf(code);
		select.selectedIndex = indx;
		this.callCustomEvent(select, 'change');
	}

	showFunding() {
		if (this.lang === 'ru') {
			document.getElementById('funding').classList.remove('is-hidden');
		}
	}

	changeFundingAmount(n) {
		const iframe = document.getElementById('iframe');

		if (iframe) {
			iframe.src = iframe.src.replace(/sum=\d+/, 'sum='+n);
		}

	}


	events() {
		document.addEventListener('click', e => {
			let target = e.target;
			while (!target.id) {
				if (target.tagName === 'HTML') return;
				target = target.parentNode;
			}

			switch(target.id) {
				case 'paypal':
					this.toggleSpinner('spinner', true);
					break;
				case 'funding':
					if (!this.iframe) {
						this.toggleSpinner('spinner', true);
						this.setCurrency('RUB');
						this.buildFunding('aab58ddd-d6d5-4dad-940f-16eb3422ada9?hs=1&bt=0&sum=100');
					}
					break;
				default:
			}

		});
	}


}

const donate = new Donate();
setTimeout(function() {
	donate.events();
	donate.setRussianTranslation('*[data-lang]');
	donate.showFunding();
	donate.buildCurrency('select_currency');
	donate.changeRange('range');
	donate.changeCurrency('select_currency');
	donate.callCustomEvent('range', 'change');
}, 10);