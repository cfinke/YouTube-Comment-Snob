var snobs = [
	{
		"id": "youtube@chrisfinke.com",
		"url": "^http://www\.youtube\.com/.*$",
		"allCommentsSelector": "#comments-view",
		"textSelector": "#comments-view li.comment > div.content > div.comment-text",
		"commentContainerSelector": ".comment",
		"placeholderElement": "li",
		"placeholderAttributes": {
			"class": "comment",
			"style": "color: #666;"
		},
		"ajaxInitiatorSelector": ".comments-pagination button, .comments-pagination a, .comments-pagination button > span",
		"updateURL": "http://www.chrisfinke.com/snobs/youtube.snob"
	},
	{
		"url": "^http://www\.fark\.com/comments",
		"allCommentsSelector": "#commentsArea",
		"textSelector": "#commentsArea .ctext",
		"placeholderElement": "div",
		"placeholderAttributes": {
			"class": "ctext",
			"style": "color: #666;"
		}
	},
	{
		"url": "^http://news\.ycombinator\.com/item",
		"allCommentsSelector": "body > center > table > tr:eq(2) > td:first > table:eq(1)",
		"textSelector": "span.comment",
		"placeholderElement": "p",
		"placeholderAttributes": {
			"style": "color: #666; margin-bottom: 10px;"
			
		}
	}
];

var COMMENT_SNOB = {
	prefs : {
		namespace : "extensions.youtube-comment-snob.",
		
		_observers : {},
		
		addObserver : function (observer) {
			var key = Math.random();
			
			this._observers[key] = observer;
		},
		
		removeObserver : function (key) {
			delete this._observers[key];
		},
		
		getPref : function (prefName) {
			var key = this.namespace + prefName;
			
			if (key in localStorage) {
				return localStorage[this.namespace + prefName];
			}
			else {
				return null;
			}
		},

		getBoolPref : function (prefName) {
			var rv = this.getPref(prefName);

			if (!rv || rv == "false" || rv == "null") {
				return false;
			}

			return true;
		},

		getCharPref : function (prefName) {
			var rv = this.getPref(prefName);
			
			if (typeof rv == 'undefined' || rv == "null") {
				rv = "";
			}

			return rv;
		},
		
		getIntPref : function (prefName) {
			var rv = this.getPref(prefName);
			
			if (typeof rv == 'undefined' || rv == "null") {
				rv = 0;
			}
			else {
				rv = parseInt(rv, 10);
			}

			return rv;
		},
		
		getJSONPref : function (prefName, defaultValue) {
			var rv = this.getCharPref(prefName);
			
			if (!rv) {
				return defaultValue;
			}
			else {
				return JSON.parse(rv);
			}
		},
		
		setPref : function (prefName, prefVal) {
			var existing = this.getPref(prefName);
			
			if (existing !== prefVal) {
				if (typeof prefVal == 'undefined' || prefVal === null) {
					prefVal = "";
				}
				
				localStorage[this.namespace + prefName] = prefVal;
				
				for (var i in this._observers) {
					this._observers[i].observe(null, "nsPref:changed", prefName);
				}
			}
		},

		setCharPref : function (prefName, prefVal) {
			this.setPref(prefName, prefVal);
		},
		
		setIntPref : function (prefName, prefVal) {
			this.setPref(prefName, prefVal.toString());
		},
		
		setJSONPref : function (prefName, prefVal) {
			var stringPrefVal = JSON.stringify(prefVal);
			
			this.setCharPref(prefName, stringPrefVal);
		},
		
		setBoolPref : function (prefName, prefVal) {
			this.setPref(prefName, !!prefVal);
		}
	},
	
	options : {
		load : function () {
			addEventListener("unload", COMMENT_SNOB.options.unload, false);
			
			COMMENT_SNOB.options.localize(document);
			
			document.getElementById("save-button").addEventListener("click", COMMENT_SNOB.options.save, false);
			
			var items = document.getElementsByClassName("preference-bool");
			
			for (var i = 0, _len = items.length; i < _len; i++) {
				var item = items.item(i);
				
				item.checked = COMMENT_SNOB.prefs.getBoolPref(item.getAttribute("preference"));
			}

			var items = document.getElementsByClassName("preference-char");
			
			for (var i = 0, _len = items.length; i < _len; i++) {
				var item = items.item(i);
				
				item.value = COMMENT_SNOB.prefs.getCharPref(item.getAttribute("preference"));
			}
			
			document.getElementById("extreme").addEventListener("change", COMMENT_SNOB.options.setDisabled, false);
			COMMENT_SNOB.options.setDisabled();
		},
		
		localize : function (page) {
			$(page).find("i18n").each(function () {
				var $this = $(this);

				var string = chrome.i18n.getMessage($this.attr("data-key"));

				if (string) {
					$this.replaceWith(string);
				}
			});

			$(page).find(".i18n").each(function () {
				var $this = $(this);

				var string = chrome.i18n.getMessage($this.attr("data-key"));

				if (string) {
					$this.text(string);
				}
			});
			
			page.title = chrome.i18n.getMessage("options_page_title");
		},
		
		setDisabled : function () {
			var disabled = document.getElementById("extreme").checked;
			
			var items = document.getElementsByClassName("preference");
			
			for (var i = 0, _len = items.length; i < _len; i++) {
				items.item(i).disabled = disabled;
			}
		},
		
		unload : function () {
			removeEventListener("unload", COMMENT_SNOB.options.unload, false);
			
			document.getElementById("save-button").removeEventListener("click", COMMENT_SNOB.options.save, false);
			
			document.getElementById("extreme").removeEventListener("change", COMMENT_SNOB.options.setDisabled, false);
		},
		
		save : function () {
			var items = document.getElementsByClassName("preference-bool");
			
			for (var i = 0, _len = items.length; i < _len; i++) {
				var item = items.item(i);
				
				COMMENT_SNOB.prefs.setBoolPref(item.getAttribute("preference"), item.checked);
			}

			var items = document.getElementsByClassName("preference-char");
			
			for (var i = 0, _len = items.length; i < _len; i++) {
				var item = items.item(i);
				
				COMMENT_SNOB.prefs.setCharPref(item.getAttribute("preference"), item.value);
			}
			
			document.getElementById("save-button").innerHTML = "Saved!";
			
			setTimeout(function () {
				document.getElementById("save-button").innerHTML = "Save";
			}, 2000);
		}
	},
	
	load : function () {
		function pref(name, val) {
			if (COMMENT_SNOB.prefs.getPref(name) === null) {
				COMMENT_SNOB.prefs.setPref(name, val);
			}
		}
		
		pref("mistakes", 2);
		pref("allcaps", true);
		pref("nocaps", true);
		pref("punctuation", true);
		pref("startsWithCapital", true);
		pref("excessiveCapitals", true);
		pref("profanity", false);
		pref("extreme", false);
	}
};

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
	if (request.subject === "snobs") {
		var prefs = {};
		
		prefs.maxMistakes = COMMENT_SNOB.prefs.getIntPref("mistakes");
		prefs.allcaps = COMMENT_SNOB.prefs.getBoolPref("allcaps");
		prefs.nocaps = COMMENT_SNOB.prefs.getBoolPref("nocaps");
		prefs.startsWithCapital = COMMENT_SNOB.prefs.getBoolPref("startsWithCapital");
		prefs.punctuation = COMMENT_SNOB.prefs.getBoolPref("punctuation");
		prefs.excessiveCapitals = COMMENT_SNOB.prefs.getBoolPref("excessiveCapitals");
		prefs.profanity = COMMENT_SNOB.prefs.getBoolPref("profanity");
		prefs.extreme = COMMENT_SNOB.prefs.getBoolPref("extreme");
		
		sendResponse({ "prefs" : prefs, "snobs": snobs });
	}
});

addEventListener("load", COMMENT_SNOB.load, false);