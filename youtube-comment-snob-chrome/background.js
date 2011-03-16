var currentRules = null;

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	currentRules = null;
	
	// Re-get the rules for this tab.
	chrome.tabs.sendRequest(tabId, { subject : "rules" });
	
	// Check if this page matches any of the rules.
	var rules = COMMENT_SNOB.prefs.getJSONPref("rules", {});
	
	for (var i in rules) {
		var regex = new RegExp(rules[i].url, "i");

		if (tab.url.match(regex)) {
			chrome.tabs.sendRequest(tabId, { subject : "filter", rule : rules[i], prefs : COMMENT_SNOB.getRulePrefs(i) });
		}
	}
});

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
	if (request.subject === "content_rules") {
		console.log("background rules:");
		console.log(request.rules);
		
		if (request.rules.length > 0){
			chrome.pageAction.show(sender.tab.id);
		}
		else {
			chrome.pageAction.hide(sender.tab.id);
		}
		
		currentRules = request.rules;
	}
	else if (request.subject === "page_action_rules") {
		console.log("page action almost rules:");
		console.log(currentRules);
		
		var installedRules = COMMENT_SNOB.prefs.getJSONPref("rules", {});
		
		currentRules.forEach(function (el, i) {
			if ("rule" in el && "id" in el.rule && el.rule.id in installedRules) {
				currentRules[i].installed = true;
			}
			else {
				currentRules[i].installed = false;
			}
		});
		
		sendResponse({ rules : currentRules });
	}
	else if (request.subject === "install_rule") {
		if ("rule" in request.rule) {
			COMMENT_SNOB.addRule(request.rule.rule);
			
			sendResponse({ status : true });
		}
		else if ("href" in request.rule) {
			var req = new XMLHttpRequest();
			req.open("GET", request.rule.href, true);
			
			req.onreadystatechange = function () {
				if (req.readyState == 4) {
					var text = JSON.minify(req.responseText);
					
					try {
						var json = JSON.parse(text);
						console.log(json);
					} catch (e) {
						console.log(e);
						sendResponse({ status : false, msg : "Invalid JSON." });
						return;
					}
					
					COMMENT_SNOB.addRule(json);
					sendResponse({ status : true });
				}
			};
			
			req.send(null);
		}
	}
});

COMMENT_SNOB.load();