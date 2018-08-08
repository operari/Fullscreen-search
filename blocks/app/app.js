class Search {
	constructor() {
		this.search = false; // поиск отображен
		this.tabs = false; // табы отображены
		this.search_id = 'f_search';
		this.element = null;
		this.open = '_blank';
		this.pressed = []; // контенйнер для нажатой клавишы
		this.my_latest_tap = 0;
		this.taps = 0;
		this.lang = 'en';
		this.self = false; // открыть на странице; копируется из настроек popup.js
		this.background = true; // копируется из настроек popup.js
		this.bg_animation = true; // копируется из настроек popup.js
		this.touch = true; // копируется из настроек popup.js
		this.search_engine = 'google'; // копируется из настроек popup.js
		this.keys = ['Control', 'Enter']; // копируется из настроек popup.js
		this.keys_tabs = ['ArrowDown', 'ArrowUp'];
		this.shortcuts = ['f:facebook.com']; // кастомные сокращения
		this.exclude_urls = ['linkedin.com'];
		this.tabs_collection = null; // коллекция табов при открытии окна с табами
		this.suggests_collection = null; // коллекция подсказок
		this.suggests = [];
		this.suggest = {"id": 0, "request": "", "typeCount": 0};
		this.matches_request = [];
		this.suggests_limit = 10;
		this.suggests_show = false; // подсказки отображены
		this.search_engine_data = {
			'google': {
				'origin': 'https://google.by/',
				'search': 'search?q=',
				'shortcut': 'g',
				'favicon': 'img/google.png'
			},
			'bing': {
				'origin': 'https://bing.com/',
				'search': 'search?q=',
				'shortcut': 'b',
				'favicon': 'img/bing.png'
			},
			'yandex': {
				'origin': 'https://yandex.by/',
				'search': 'search/?text=',
				'shortcut': 'y',
				'favicon': 'img/yandex.png'
			},
			'duckduck': {
				'origin': 'https://duckduckgo.com/',
				'search': '?q=',
				'shortcut': 'd',
				'favicon': 'img/duckduck.png'
			},
			'baidu': {
				'origin': 'http://baidu.com/',
				'search': 's?wd=',
				'shortcut': 'du',
				'favicon': 'img/baidu.png'
			},
			'youtube': {
				'origin': 'http://youtube.com/',
				'search': 'results?search_query=',
				'shortcut': 'yt',
				'favicon': 'img/youtube.png'
			},
			'wikipedia': {
				'origin': 'http://wikipedia.org/',
				'search': 'w/index.php?search=',
				'shortcut': 'w',
				'favicon': 'img/wikipedia.png'
			},
			'github': {
				'origin': 'http://github.com/',
				'search': 'search?utf8=✓&q=',
				'shortcut': 'gt',
				'favicon': 'img/github.png'
			}
		};
	}

	appendSearch() {
		const w = utils.addElement('div', 'wrp-textfield fs-search is-hidden--fs-search mdl-shadow--4dp');
		const d = utils.addElement('div', 'mdl-textfield mdl-js-textfield mdl-textfield--floating-label');
		const inp = utils.addElement('input', 'mdl-textfield__input', this.search_id, false, false, {'autocomplete': 'off'});
		const lbl = utils.addElement('label', 'mdl-textfield__label', false, (this.lang === 'en' ? 'Search' : 'Введите запрос'), false, {'for': this.search_id});
		const cls_ico = utils.addElement('span', 'mdl-textfield__close svg-icon', 'f_close_btn');
		const s_ico = utils.addElement('span', 'mdl-textfield__search svg-icon', 'f_search_btn');
		const suggests = utils.addElement('div', 'mdl-textfield__suggests mdl-shadow--2d is-hidden--fs-search', 'suggests_search');
		const ul = utils.addElement('ul', 'mdl-textfield__suggests-ul');
		const shortcuts_list_img = utils.addElement('div', 'shortcuts-list-img');
		const ul1 = utils.addElement('ul', 'shortcuts-list-img__ul mdl-shadow--2dp is-hidden--fs-search');
		const sl_ico = utils.addElement('span', 'shortcuts-list-img__arrow svg-icon', 'f_arrow');
		Object.keys(this.search_engine_data).forEach((v, i) => {
			const li =  utils.addElement('li', 'shortcuts-list-img__li');
			const ico = utils.addElement('img', 'shortcuts-list-img__ico', ('search_icon_'+i), false, false, {'src': chrome.extension.getURL(this.search_engine_data[v].favicon), 'data-shortcut': this.search_engine_data[v].shortcut});
			const tooltip = utils.addElement('div', 'mdl-tooltip mdl-tooltip--right', false, this.search_engine_data[v].shortcut, false, {'data-mdl-for': ('search_icon_'+i)});
			li.appendChild(ico);
			li.appendChild(tooltip);
			ul1.appendChild(li);
			setTimeout(() => {
				componentHandler.upgradeElement(tooltip);
			}, 10);
		});
		shortcuts_list_img.appendChild(sl_ico);
		shortcuts_list_img.appendChild(ul1);
		suggests.appendChild(ul);
		d.appendChild(inp);
		d.appendChild(lbl);
		d.appendChild(s_ico);
		d.appendChild(cls_ico);
		d.appendChild(suggests);
		d.appendChild(shortcuts_list_img);
		w.appendChild(d);
		componentHandler.upgradeElement(d);
		document.documentElement.appendChild(w);
		this.element = document.getElementById(this.search_id);
	}

	appendBackground() {
		const d = utils.addElement('div', 'layout-bg--fs-search layout-bg--animation is-hidden--fs-search', 'f_bg');
		document.documentElement.appendChild(d);
	}

	addPrefixLangSearchEngine() {
		let url = this.search_engine_data.wikipedia.origin;
		this.search_engine_data.wikipedia.origin = url.replace(/^http:\/\//, `http://${this.lang}.`);
	}

	docEvents() {
		for (var i = 0; i < this.search_engine_data.length; i++) {
			// console.log(this.search_engine_data[i]);
		}

		const error_keys = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];

		document.addEventListener('keyup', e => {
			const id = e.target.id;

			if (id && id === this.search_id) {
				if (error_keys.indexOf(e.key) === -1) {
					const m = this.saveMatchesRequest(this.element.value);
					if (m) {
						this.buildSuggests();
					} else {
						this.removeSuggests();
					}
				}
				this.appendSearchEngineFavicon(e);
			}
		});

		document.addEventListener('keydown', e => {
			const id = e.target.id;
			switch(id) {
				case (this.search_id):
					this.checkKeys(e, true);
					break;
				default:
					const check = this.checkKeys(e);
					if (check)
						this.sendMessage({ "query": "update", "data": check });

			}
		});

		document.addEventListener('touchstart', e => {
			if (this.touch && e.target.tagName !== 'VIDEO')
				this.tap(e);
		});

		document.addEventListener('click', e => {
			var target = e.target.id ? e.target : e.target.parentNode;

			switch(target.id) {
				case 'f_search_btn':
					this.openRequest(this.element.value);
					break;
				case 'f_close_btn':
					this.search = false;
					this.toggleSearch();
					break;
				case 'f_arrow':
					this.toggleShortcutsListImg();
					break;
				default:
					target = e.target;

					if (target.classList.contains('shortcuts-list-img__ico')) {
						this.insertShortcutWithClick(target);
					}

					if (target.classList.contains('mdl-textfield__suggests-button')) {
						this.removeSuggest(target);
						break;
					}

					if (target.classList.contains('mdl-textfield__suggests-text')) {
						this.element.value += target.textContent;
						this.openRequest(this.element.value);
						break;
					}

					if (target.classList.contains('tab-nav__close')) {
						// console.log(target);
						this.sendMessage({ "query" : "remove", "data" : +(target.parentNode.dataset.id) });
					} else {
						while (!target.classList.contains('tab-nav__tab')) {
							if (target.tagName === 'HTML') return;
							target = target.parentNode;
						}
						this.sendMessage({ "query" : "update", "data" : +(target.dataset.id) });
					}

			}

		});


	}

	tap(e) {
		const touch = e.type === 'touchstart' ? true : false;
		const now = new Date().getTime();
		let time_since = now - this.my_latest_tap;

		this.taps += 1;

		if(time_since < 190){
			if (time_since > 50) {
				if (this.tabs) {
					this.removeLinksTab();
				} else {
					if (!this.tabs) {
						this.search = !this.search ? true : false;
						this.toggleSearch(touch);
					}
				}
				this.taps = 0;
			} else {
				if (this.taps === 3 && !this.tabs && !this.search) {
					this.sendMessage({"query": "tabs"});
				}
			}
		}

		this.taps = !(this.taps % 3) ? 0 : this.taps;
		this.my_latest_tap = now;

	}

	checkKeys(e, input) {
		const k = e.key;

		if (k === 'Escape') {
			if (this.search) {
				this.search = false;
				setTimeout(() => {	this.toggleSearch(); }, 0);
			}
			if (this.tabs) {
				this.removeLinksTab();
			}
		}

		if (k === 'Delete' && this.tabs) {
			const tabs = document.querySelectorAll('.tab-nav__tab');
			const tab_active = [...tabs].filter((v, i) => v.classList.contains('is-active'))[0];
			if (tab_active) {
				tab_active.querySelector('.tab-nav__close').click();
			}
		}

		// if (k === 'Delete' && this.suggests_show) {
		// 	const active_suggest = [...this.suggests_collection].filter(v => v.classList.contains('is-active'))[0];
		// 	active_suggest.querySelector('button').click();
		// }

 		if (input) {

			if (k === 'Enter') {
				this.updateSuggests(this.element.value);
				this.openRequest(this.element.value);
			}

			if ((k === 'ArrowUp' || k === 'ArrowDown')) {
				if (this.suggests_show) {
					this.selectList(Array.from(this.suggests_collection), k);
					this.removePlugSuggest();
				}
				this.setSelectSuggest();
				this.setSeletionRange(e.target);
			}

			return;
		}

		if (this.keys && k === this.keys[0]) {
			this.pressed[0] = k;
			setTimeout(() => { this.pressed = []; }, 500);
		}

		// toggle search
		if (k === this.keys[1] && this.pressed[0] && !this.tabs) {
			this.search = true;
			this.pressed = [];
			this.rewriteProps();

			setTimeout(() => { this.toggleSearch(); }, 0);
		}

		// toggle tabs
		if (~this.keys_tabs.indexOf(k) && this.pressed[0] && !this.search) {
			if (!this.tabs) {
				setTimeout(() => {
					this.sendMessage({"query": "tabs"});
				 }, 0);
			} else {
				setTimeout(() => {
					this.removeLinksTab();
				}, 0);
			}
		}

		if ((k === 'ArrowUp' || k === 'ArrowDown') && this.tabs) {
			this.selectList(this.tabs_collection, k);
			this.scrollTabs(k);
		}

		if (k === 'f' && this.search) {
			this.element.focus();
			setTimeout(() => { if (this.element.value.length == 1) this.element.value = ""; });
		}

		// go to tab
		if (k === 'Enter' && this.tabs) {
			let n;
			if (e.target.classList.contains('tab-nav__tab')) {
				n = e.target.dataset.id;
			}  else {
				[...document.querySelectorAll('.tab-nav__tab')].some((v, i) => {
					if (v.classList.contains('is-active')) {
						n = v.dataset.id;
						return true;
					}
				});
			}
			return +(n);
		}

	}

	rewriteProps() {
		return new Promise((resolve, reject) => {
			chrome.storage.local.get('search_props_', items => {
				this.sendMessage({'query': 'storage', 'key': 'search_props_'});
				if (Object.keys(items).length) {
					const storage_obj = JSON.parse(items.search_props_);

					for (let prop in storage_obj) {
						let val = storage_obj[prop];
						this[prop] = val;
					}
				}
				// console.log(this);
				resolve();
			});
		});
	}

	toggleShortcutsListImg() {
		document.querySelector('.shortcuts-list-img__ul').classList.toggle('is-hidden--fs-search');
		document.querySelector('.shortcuts-list-img__arrow').classList.toggle('shortcuts-list-img__arrow--rotate');
	}


	insertShortcutWithClick(target) {
		const shortcut = target.dataset.shortcut;
		this.element.focus();
		this.element.value = shortcut + ':';
		this.callCustomEvent(this.element);
		this.toggleShortcutsListImg();
	}

	callCustomEvent(target) {
		const event = new Event('keyup');
		const handler = e => {
			this.appendSearchEngineFavicon(e);
		};
		target.addEventListener('keyup', handler, false);
		target.dispatchEvent(event);
		target.removeEventListener('keyup', handler, false);
	}

	appendSearchEngineFavicon(e) {
		const key = e.key;
		const fav_class = 'mdl-textfield__favicon';

		const append_favicon = (favicon) => {

			let fav = document.createElement('img');

			fav.onload = function() {
				e.target.parentNode.appendChild(this);
				e.target.classList.add('mdl-textfield__input--indent');
			};

			fav.className = fav_class;
			fav.src = chrome.extension.getURL(favicon);

		};

		const searches_data = this.search_engine_data;
		const re = /^([^:]+)(:)?(.*)?$/;
		const parse = re.exec(e.target.value);
		const shortcuts = [];
		const shortcuts_url = [];

		if (!shortcuts.length) {
			for (let prop in searches_data) {
				shortcuts.push(searches_data[prop].shortcut);
				shortcuts_url.push(searches_data[prop].favicon);
			}
		}

		const current_indx_match = shortcuts.indexOf(parse && parse[1]);

		if (~current_indx_match) {
			if (!document.querySelector('.'+fav_class)) {
				append_favicon(shortcuts_url[current_indx_match]);
				this.paste_indx_match = current_indx_match;
			} else {
				if (current_indx_match !== this.paste_indx_match) {
					this.removeSearchEngineFavicon(e.target);
					append_favicon(shortcuts_url[current_indx_match]);
				}
				this.paste_indx_match = current_indx_match;
			}
		} else {
			if (document.querySelector('.'+fav_class)) {
				this.removeSearchEngineFavicon(e.target);
			}
		}

	}

	removeSearchEngineFavicon(input) {
		const fav = document.querySelector('.mdl-textfield__favicon');

		if (fav) {
			fav.remove();

			if (input) {
				input.classList.remove('mdl-textfield__input--indent');

				return true;
			}
		}

		return false;

	}

	checkHostname() {
		const hostname = window.location.hostname;
		return this.exclude_urls.some((v, idx) => v === hostname.replace(/^www./, ''));
	}

	handlerToggleScroll() {
		window.scrollTo(0, scroll_pos);
	}

	toggleScroll() {
		window.scroll_pos = document.documentElement.scrollTop;
		window[this.tabs ? "addEventListener" : "removeEventListener"]("scroll", this.handlerToggleScroll);
	}

	toggleSearch(touch) {
		if(this.checkHostname())
			return false;
		this.element.parentNode.parentNode.classList[this.search ? 'remove' : 'add']('is-hidden--fs-search');

		if (!this.search) {
			this.element.value = '';
			this.removeSearchEngineFavicon(this.element);
			this.removeSuggests();
		}

		if (!this.element.parentNode.parentNode.classList.contains('is-hidden--fs-search')) {
			const delay = touch ? 350 : 0;
			setTimeout(() => {
				this.element.focus();
			}, delay);

		}
		this.toggleBackground();
		return true;
	}

	toggleBackground() {
		if (this.background) {
			const bg = document.getElementById('f_bg');
			bg.classList[this.search || this.tabs ? 'remove' : 'add']('is-hidden--fs-search');
			bg.classList[this.bg_animation ? 'add' : 'remove']('layout-bg--animation');
		}
	}

	updateSuggests(request) {
		const re = /^(.+:)/;
		request = request.replace(re, '').toLowerCase();

		const find_suggest_indx = this.suggests.findIndex((o, i) => request === o.request);

		if (~find_suggest_indx) {
			this.suggests[find_suggest_indx].typeCount++;
		} else {
			const suggest_tmp = Object.assign({}, this.suggest);
			suggest_tmp.request = request;
			let n = this.suggests.push(suggest_tmp);
			this.suggests[--n].id = n;
		}

		this.saveSuggests();
		this.getSuggests();
	}

	getSuggests() {
		chrome.storage.local.get('suggests', (items) => {
			if (items.suggests && items.suggests.length) {
				this.suggests = items.suggests;
				// console.log(JSON.stringify(this.suggests, null, 3));
			}
		});
	}

	saveSuggests() {
		chrome.storage.local.set({'suggests': this.suggests});
	}

	setSelectSuggest() {
		const active = [...this.suggests_collection].filter(v => v.classList.contains('is-active'))[0];
		const re = /^(.+:)?(.+)/;

		if (active) {
			const txt = active.firstElementChild.textContent;
			this.element.value = this.element.value.replace(re, '$1'+txt);
		}

	}

	setSeletionRange(input) {
		const n = input.value.length;
		setTimeout(() => {
			input.setSelectionRange(n, n);
		}, 0);
	}

	reindexSuggests() {
		if (!this.suggest_removed) return;
		this.suggests.forEach((v, i) => this.suggests[i].id = i);
		this.saveSuggests();
		this.suggest_removed = false;
	}

	removeSuggest(target) {
		const id = target.parentNode.dataset.suggestId;
		const indx = this.suggests.findIndex(v => v.id === +id);
		this.suggests.splice(indx, 1);

		const suggests = document.querySelectorAll('.mdl-textfield__suggests-suggest');
		const elem = [...suggests].filter((v, i) => v.dataset.suggestId && +v.dataset.suggestId === +id)[0];

		if (elem) {
			elem.innerHTML = (this.lang === 'ru' ? 'Подсказка удалена' : 'Suggest removed');
			elem.classList.add('is-remove');
		}

		this.suggest_removed = true;

	}

	removeSuggests() {
		const suggests = document.getElementById('suggests_search');
		parent = suggests.firstElementChild;

		if (parent.childElementCount) {
			while (parent.firstElementChild) {
				parent.removeChild(parent.firstElementChild);
			}
			parent.parentNode.classList.add('is-hidden--fs-search');
		}

		this.suggests_collection = [];
		this.suggests_show = false;
		this.reindexSuggests();
	}

	removePlugSuggest() {
		if (this.plug_suggest) {
			const suggests = document.getElementById('suggests_search');
			const ul = suggests.firstElementChild;
			ul.removeChild(ul.firstElementChild);
			this.suggests_collection = document.querySelectorAll('.mdl-textfield__suggests-suggest');
			this.plug_suggest = false;
		}
	}

	addPlugSuggest(ul, n) {
		if (!n) {
			let plug_suggest = utils.addElement('li', 'mdl-textfield__suggests-suggest');
			ul.appendChild(plug_suggest);
			this.plug_suggest = true;
		}
	}

	buildSuggests() {
		this.removeSuggests();
		this.reindexSuggests();

		const suggests = document.getElementById('suggests_search');

		if (!this.matches_request.length) return;

		this.matches_request.some((v, i) => {

			if (i > 9) return true;

			this.addPlugSuggest(suggests.firstElementChild, i);

			let suggest = utils.addElement('li', 'mdl-textfield__suggests-suggest', false, false, false, {'data-suggest-id': v.id});
			let span = utils.addElement('span', 'mdl-textfield__suggests-text', false, v.request);
			let button = utils.addElement('button', 'mdl-textfield__suggests-button', false, (this.lang === 'ru' ? 'Удалить' : 'Remove'), false);
			suggest.appendChild(span);
			suggest.appendChild(button);

			suggests.firstElementChild.appendChild(suggest);
		});

		this.suggests_collection = document.querySelectorAll('.mdl-textfield__suggests-suggest');

		if (!this.suggests_show) {
			suggests_search.classList.remove('is-hidden--fs-search');
			this.suggests_show = true;
		}

	}

	saveMatchesRequest(request, e) {
		const re = /^(.+:)/;
		request = request.replace(re, '').toLowerCase();

		if (!request) return false;

		const request_words = request.split(' ').filter(v => v);

		this.matches_request = [];
		this.suggests.forEach((o, i) => {
			const suggest = Object.assign({}, o);
			const suggest_words = suggest.request.split(' ').filter(v => v);

			request_words.some((v, n) => {
				const request_split_word = v;

				return suggest_words.some((v1, n1) => {
					const suggest_split_word = v1;

					if (suggest_split_word.indexOf(request_split_word) === 0) {
						this.matches_request.push({"id": suggest.id, "sort": suggest.typeCount, "request": suggest.request});
						return true;
					}

					return false;
				});

			});

		});

		this.matches_request.sort((a,b) => b.sort - a.sort);

		return true;
	}

	openRequest(val) {
		const request = val;
		const open = this.self ? '_self' : this.open;

		const parseShortcutSearchEgine = (request) => {
			const o1 = this.search_engine_data;
			const re = /^(.+):(.+)/;
			const parse = re.exec(request);

			for (let o2 in o1) {
				let s = o1[o2].shortcut;

				if (request === s) return o1[o2];
				if (parse && parse[1] === s) {
					o1[o2].url = parse[2];
					o1[o2].key = o2;
					return o1[o2];
				}
			}

			return false;
		};

		const parseCustomShortCut = (request) => {
			const re = /^(.+):([^/]+)(.*)?/;
			const req = re.exec(request);

			let shortcut = this.shortcuts.filter((v, idx) => re.exec(v)[1] === (req ? req[1] : request))[0];

			return shortcut && !req ?
				re.exec(shortcut)[2] :
				shortcut && req ?
				re.exec(shortcut)[2] + re.exec(shortcut)[3] + req[2] :
				false;
		};

		const parseDomain = (request) => {
			const zone = /\.[a-zA-Z]+$/g;
			const url = /(?:http[s]?:\/\/)?(.+)/i;

			return zone.test(request) ? url.exec(request)[1] : false;
		};

		const { origin, search, favicon, url, key } = parseShortcutSearchEgine(request);
		const parse_engine = origin;
		const parse_custom = parseCustomShortCut(request);
		const parse_domain = parseDomain(request);

		if (parse_engine) {
			window.open(url ? origin + search + url : origin, open);
			if (key) {
				delete this.search_engine_data[key].url;
				delete this.search_engine_data[key].key;
			}
		} else if (parse_custom) {
			window.open(`http://${parse_custom}`, open);
		} else if (parse_domain) {
			window.open(`http://${parse_domain}`, open);
		} else {
			if (!request) return;
			// open url
			const { origin, search } = this.search_engine_data[this.search_engine];
			window.open(origin + search + request, open);
		}

		this.search = false;
		this.toggleSearch();

	}

	removeLinksTab() {
		const card = document.querySelector('.tab-nav');
		card.remove();
		this.tabs = false;
		this.tabs_collection = null;
		this.toggleScroll();
		this.toggleBackground();
	}

	buildLinksTab(arr) {
		const card = utils.addElement('div', 'mdl-card fs-search tab-nav mdl-shadow--2dp is-hidden--fs-search');

		const appendData = function(tab, ...args) {
			args.forEach((v, n) => {
				tab.appendChild(v);
			});
		};

		arr.forEach((v, n) => {
			const favicon = utils.addElement('img', 'tab-nav__favicon');

			favicon.src = v.favIconUrl;

			const j = n += 1;
			const tab = utils.addElement('div', (v.active ? 'tab-nav__tab tab-nav__tab--load is-active' : 'tab-nav__tab tab-nav__tab--load'), false, false, false, {
				'tabIndex': j,
				'data-id': v.id
			});
			const number = utils.addElement('span', 'tab-nav__number', false, (j + '.'));
			const title = utils.addElement('span', 'tab-nav__title', false, v.title);
			const close = utils.addElement('span', 'tab-nav__close svg-icon', false);

			favicon.addEventListener('load', function(e) {
				appendData(tab, this, number, title, close);
				this.parentNode.classList.remove('tab-nav__tab--load');
			});

			favicon.addEventListener('error', function(e) {
				this.src =  chrome.extension.getURL("img/no_favicon.png");
				appendData(tab, this, number, title, close);
				this.parentNode.classList.remove('tab-nav__tab--load');
			});

			card.appendChild(tab);
		});

		this.tabs = true;
		this.toggleScroll();
		this.toggleBackground();
		setTimeout(() => { card.classList.remove('is-hidden--fs-search'); }, 10);

		document.documentElement.appendChild(card);
		this.tabs_collection = Array.from(document.querySelectorAll('.tab-nav__tab'));
		this.checkTabOutView();
	}

	scrollTabs(key) {
		const tab_window = document.querySelector('.tab-nav');
		const tab_active = this.tabs_collection.filter((v) => v.classList.contains('is-active'))[0];
		const tab_offset_top = tab_active.offsetTop;
		const tab_height = tab_active.offsetHeight;

		const scroller = function(tab_pos, up) {

			if (tab_pos > tab_window.clientHeight) {
				const tab_offset = tab_pos - tab_window.clientHeight;
				const must_scroll = !up ? tab_window.scrollTop + tab_offset : tab_window.scrollTop - tab_offset;
				tab_window.scrollTo(0, must_scroll);
			}

		};

		const scrollToEdge = function(x, y) {
			tab_window.scrollTo(x, y);
		};

		if (key === 'ArrowDown') {
			if (!tab_offset_top && (tab_window.scrollHeight - tab_window.clientHeight) === tab_window.scrollTop) {
				scrollToEdge(0, 0);
			} else {
				scroller(tab_offset_top + tab_height);
			}
		} else {
			const tab_offset_bot = tab_window.scrollHeight - (tab_offset_top + tab_height);
			if (!tab_offset_bot && !tab_window.scrollTop) {
				scrollToEdge(0, tab_window.scrollHeight - tab_window.clientHeight);
			} else {
				scroller(tab_offset_bot + tab_height, true);
			}
		}

	}

	checkTabOutView() {
		const tab_window = document.querySelector('.tab-nav');
		const tab_active = this.tabs_collection.filter((v) => v.classList.contains('is-active'))[0];

		const must_scroll = (tab_active.offsetTop + tab_active.offsetHeight) - tab_window.clientHeight;

		if (must_scroll) {
			tab_window.scrollTo(0, must_scroll);
		}

	}

	selectList(elements, key) {
		if (!elements || !elements.length) return false;
		let index_actived = 0;
		let arr_assoc = new Array(elements.length);

		elements.forEach((v, i) => {
			if (v.classList.contains('is-active')) {
				index_actived = i;
				arr_assoc[i] = 1;
			} else {
				arr_assoc[i] = 0;
			}
		});

		let n = index_actived;
		arr_assoc[n] = 0;

		if (key === 'ArrowDown') {
			arr_assoc[++n <= elements.length-1 ? n : 0] = 1;
		} else {
			arr_assoc[--n === -1 ? elements.length-1 : n] = 1;
		}

		let index_will_active = arr_assoc.indexOf(1);

		elements[index_actived].classList.remove('is-active');
		elements[index_will_active].classList.add('is-active');
	}

	removeLinkTab(id) {
		const point = this.tabs_collection.findIndex(elem => {
			return elem.dataset.id == id;
		});
		this.selectList(this.tabs_collection, 'ArrowDown');

		document.querySelector(`div[data-id="${id}"]`).remove();

		this.tabs_collection.splice(point, 1);
	}

	sendMessage(msg = {}) {
		chrome.runtime.sendMessage(msg, response => {
			if (msg.query === "tabs")
				this.buildLinksTab(response);
			if (response.action === "tab_removed")
				this.removeLinkTab(response.data);
			if (response.action === "update")
				this.removeLinksTab();
		});
	}

	getMessage() {
		chrome.runtime.onMessage.addListener((request) => {
			if (request && request.action === "change_tab" && this.tabs) {
				this.removeLinksTab();
			}
		});
	}

	storageClear() {
		chrome.storage.local.clear();
	}

	onbeforeunload() {
		window.onbeforeunload = () => {
			this.reindexSuggests();
		};
	}

}

const srch = new Search();
// srch.storageClear();
srch.rewriteProps()
	.then(
		result => {
			srch.addPrefixLangSearchEngine();
			srch.appendBackground();
			srch.appendSearch();
			srch.getMessage();
			srch.docEvents();
			srch.getSuggests();
			srch.onbeforeunload();
		},
		error => console.log(error.message)
	);
// console.log(chrome.tabs);