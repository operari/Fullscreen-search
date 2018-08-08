class Popup {
	constructor() {
		this.self = false;
		this.background = true;
		this.bg_animation = true;
		this.touch = true;
		this.lang = 'en';
		this.search_engine = 'google';
		this.keys = ['Control', 'Enter'];
		this.shortcuts = ['f:facebook.com'];
		this.exclude_urls = ['linkedin.com'];
	}

	rewriteProps(o1, o2) {
		for (let prop in o2) {
			let val = o2[prop];

			if (typeof(val) === "object" && !(val instanceof Array)) {
				let o3 = val;
				for (let prop1 in o3) {
					o1[prop][prop1] = o3[prop1];
				}
			} else {
				o1[prop] = val;
			}
		}

		return o1;
	}

	changeViewSettings() {

		const selectOption = (elem, val) => {
			for (let i = 0; i < elem.options.length; i++) {
				if (elem.options[i].value === val) elem.selectedIndex = i;
			}
		};

		for (let prop in this) {
			let val = this[prop];

			if (typeof(val) === "object" && !(val instanceof Array)) {
				// object
			} else if (typeof(val) === "object" && val instanceof Array) {
				// array
				if (prop === 'keys') {
					let elem1 = document.getElementById(prop + '_one');
					let elem2 = document.getElementById(prop + '_two');
					if (elem1 && elem2) {
						selectOption(elem1, val[0]);
						selectOption(elem2, val[1]);
					}
				}
			} else if (typeof(val) === "string") {
				let elem = document.getElementById(prop);
				if (elem)
					selectOption(elem, val);
			} else {
				// boolean
				let elem = document.getElementById(prop);
				if (elem) {
					elem.value = val;
					elem.parentNode.MaterialSwitch[this[prop] ? 'on' : 'off']();
				}
			}

		}

		return true;
	}

	testSettings() {
		document.getElementById('test_settings').disabled = false;
	}

	// save prop in object or storage
	saveSearchProps(changed) {
		return new Promise((resolve, reject) => {
			chrome.storage.local.get('search_props_', items => {
				let storage_obj = items.search_props_ ? JSON.parse(items.search_props_) : null;
				if (changed) {
					// console.log(this.exclude_urls);
					storage_obj = this.rewriteProps(storage_obj, this);
					chrome.storage.local.set({'search_props_': JSON.stringify(storage_obj)});
					this.testSettings();
					return;
				}

				if (!Object.keys(items).length) {
					chrome.storage.local.set({'search_props_': JSON.stringify(this)});
				} else {
					if (this.rewriteProps(this, storage_obj)) {
						if (this.changeViewSettings())
							resolve();
					}
				}
			});
		});
	}

	buildOptions(prop) {
		if (this.removeOptions(prop, true)) {
			const addOptions = (prop) => {
				const select = document.getElementById(prop);
				if (!select) return false;
				for (let i = 0; i < this[prop].length; i++) {
					let option = document.createElement('option');
					option.value = this[prop][i];
					option.textContent = this[prop][i];
					select.appendChild(option);
				}
				return true;
			};
			return addOptions(prop);
		}
	}

	removeOptions(prop, all) {
		const select = document.getElementById(prop);
		if (!select) return false;
		if (all) {
			while(select.firstElementChild) {
				select.removeChild(select.firstElementChild);
			}
			return true;
		}
		if (select.options.length) {
			const selected = select.options.selectedIndex;
			const val = select.options[selected].value;
			const indx = this[prop].indexOf(val);
			if (~indx) {
				this[prop].splice(indx, 1);
			} else {
				return new Error(`Don\'t find element in array ${prop}`);
			}
			select.removeChild(select.options[selected]);
			return true;
		}
	}

	blurValidate() {
		const is_invalid = 'is-invalid';
		const re1 = /^(?!(http|www\.)).+\..+$/; // sitename.com
		const re2 = /^.+:.+\..+$/; // abc:sitename.com
		const validate = (re, selector) => {
			document.getElementById(selector).addEventListener('blur', e => {
				e.target.parentNode.classList[!re.test(e.target.value) ? 'add' : 'remove'](is_invalid);
			});
		};
		validate(re1, 'exclude');
		validate(re2, 'shortcut_inp');
	}

	approveInputData(input, select) {
		const elem = document.getElementById(input);
		if (elem.value) {
			if (this[select].indexOf(elem.value) === -1) this[select].push(elem.value);
			if (this.buildOptions(select)) {
				this.saveSearchProps(true);
			}
			elem.value = "";
		}
	}

	docEvents() {
		document.addEventListener('change', e => {
			const target = e.target;

			switch(target.tagName.toLowerCase()) {
				case 'input':
					// checkboxes
					if (target.type === "checkbox") {
						this[target.id] = (!!target.checked);
						this.saveSearchProps(true);
					}
					break;
				default:
					// selects
					if (/^keys_/.test(target.id)) {
						this.keys[0] = document.getElementById('keys_one').value;
						this.keys[1] = document.getElementById('keys_two').value;
					}
					if (target.id === 'search_engine') {
						this.search_engine = target.value;
					}
					this.saveSearchProps(true);
			}

		});

		document.addEventListener('click', e => {

			let target = e.target;

			while (!target.id) {
				if (target.tagName === 'HTML') return;
				target = target.parentNode;
			}

			// const target = e.target.id ? e.target : e.target.parentNode;

			switch(target.id) {
				case 'test_settings':
					if (!target.disabled)
						window.open('https://google.com', '_blank');
					break;
				case 'exclude_approve':
					this.approveInputData('exclude', 'exclude_urls');
					break;
				case 'remove_exclude':
					if (this.removeOptions('exclude_urls'))
						this.saveSearchProps(true);
					break;
				case 'shortcut_approve':
					this.approveInputData('shortcut_inp', 'shortcuts');
					break;
				case 'remove_shortcut':
					if (this.removeOptions('shortcuts'))
						this.saveSearchProps(true);
					break;
				case 'en':
				case 'ru':
					this.switchLang(target.value);
					break;
				case 'btn_support':
					window.open(chrome.extension.getURL('donate.html'));
					break;
				case 'help':
					this.toggleHelp();
					break;
				case 'help_close':
					this.toggleHelp();
					break;
				default:
			}
		});

	}

	toggleHelp() {
		document.querySelector('.help').classList.toggle('is-hidden');
	}

	switchLang(lang) {
		const elems = document.querySelectorAll('*[data-lang]');
		if (!elems.length) return false;

		this.lang = lang;
		chrome.storage.local.set({'search_props_': JSON.stringify(this)});

		[...elems].forEach((el, indx) => {
			const o = JSON.parse(el.dataset.lang);
			el.innerHTML = o[lang];
		});

		return true;
	}

	setLangOnload() {
		document.getElementById(this.lang).click();
	}

	getCurrentTabUrl() {

		var queryInfo = {
			active: true,
			currentWindow: true
		};

		chrome.tabs.query(queryInfo, function(tabs) {
			var tab = tabs[0];
			var url = tab.url;

			console.assert(typeof url == 'string', 'tab.url should be a string');
			// console.log(url);
		});

	}

	messageReceivingEnd() {
		// chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		//   chrome.tabs.sendMessage(tabs[0].id, {obj: chrome.tabs}, function(response) {
		//     console.log(response.farewell);
		//   });
		// });
	}

	storageClear() {
		chrome.storage.local.clear();
	}
}

const popup = new Popup();
popup.messageReceivingEnd();
setTimeout(() => {
	popup.saveSearchProps()
		.then(
			result => {
				popup.setLangOnload();
				popup.buildOptions('exclude_urls');
				popup.buildOptions('shortcuts');
			},
			error => console.log(error.message)
		);
	popup.blurValidate();
	popup.docEvents();
	// popup.storageClear();
}, 10);
