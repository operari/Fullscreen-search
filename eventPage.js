class Background {
	static messageReceivingEnd() {
		chrome.runtime.onMessage.addListener(
			(request, sender, sendResponse) => {
				switch (request.query) {
					case 'update':
						chrome.tabs.update( request.data, {selected: true}, () => {
							sendResponse({"action": "update"});
						});
						break;
					case 'remove':
						chrome.tabs.remove( request.data, () => {
							sendResponse({"action": "tab_removed", "data": request.data});
						});
						break;
					case 'storage':
						this.getStorageData(request.key)
							.then(
								result => sendResponse({"action": "get_storage", "data": result}),
								error => sendResponse(error.message)
								);
						break;
					default:
						this.getAllTabs()
							.then(
								result => sendResponse(result),
								error => sendResponse(error.message)
								);
				}
				return true;
		});
	}
	static getStorageData(key) {
		return new Promise((resolve, reject) => {
			chrome.storage.local.get(key, items => {
				resolve(items);
			});
		});
	}
	static getAllTabs() {
		return new Promise((resolve, reject) => {
			chrome.tabs.getAllInWindow(tabList => {
				resolve(tabList);
			});
		});
	}
	static sendMessage(msg) {
		chrome.tabs.query({active: true, currentWindow: true}, tabs => {
			chrome.tabs.sendMessage(tabs[0].id, msg);
		});
	}
	static leaveTab() {
		chrome.tabs.onActivated.addListener((tab) => {
			this.sendMessage({"action": "change_tab"});
		});
	}
}
Background.messageReceivingEnd();
Background.leaveTab();
