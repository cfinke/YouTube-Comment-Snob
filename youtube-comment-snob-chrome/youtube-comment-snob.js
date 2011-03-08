var YT_COMMENT_SNOB = {
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
			addEventListener("unload", YT_COMMENT_SNOB.options.unload, false);
			
			YT_COMMENT_SNOB.options.localize(document);
			
			document.getElementById("save-button").addEventListener("click", YT_COMMENT_SNOB.options.save, false);
			
			var items = document.getElementsByClassName("preference-bool");
			
			for (var i = 0, _len = items.length; i < _len; i++) {
				var item = items.item(i);
				
				item.checked = YT_COMMENT_SNOB.prefs.getBoolPref(item.getAttribute("preference"));
			}

			var items = document.getElementsByClassName("preference-char");
			
			for (var i = 0, _len = items.length; i < _len; i++) {
				var item = items.item(i);
				
				item.value = YT_COMMENT_SNOB.prefs.getCharPref(item.getAttribute("preference"));
			}
			
			document.getElementById("extreme").addEventListener("change", YT_COMMENT_SNOB.options.setDisabled, false);
			YT_COMMENT_SNOB.options.setDisabled();
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
			removeEventListener("unload", YT_COMMENT_SNOB.options.unload, false);
			
			document.getElementById("save-button").removeEventListener("click", YT_COMMENT_SNOB.options.save, false);
			
			document.getElementById("extreme").removeEventListener("change", YT_COMMENT_SNOB.options.setDisabled, false);
		},
		
		save : function () {
			var items = document.getElementsByClassName("preference-bool");
			
			for (var i = 0, _len = items.length; i < _len; i++) {
				var item = items.item(i);
				
				YT_COMMENT_SNOB.prefs.setBoolPref(item.getAttribute("preference"), item.checked);
			}

			var items = document.getElementsByClassName("preference-char");
			
			for (var i = 0, _len = items.length; i < _len; i++) {
				var item = items.item(i);
				
				YT_COMMENT_SNOB.prefs.setCharPref(item.getAttribute("preference"), item.value);
			}
			
			document.getElementById("save-button").innerHTML = "Saved!";
			
			setTimeout(function () {
				document.getElementById("save-button").innerHTML = "Save";
			}, 2000);
		}
	},
	
	load : function () {
		function pref(name, val) {
			if (YT_COMMENT_SNOB.prefs.getPref(name) === null) {
				YT_COMMENT_SNOB.prefs.setPref(name, val);
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
	if (request.subject === "prefs") {
		var prefs = {};
		
		prefs.maxMistakes = YT_COMMENT_SNOB.prefs.getIntPref("mistakes");
		prefs.allcaps = YT_COMMENT_SNOB.prefs.getBoolPref("allcaps");
		prefs.nocaps = YT_COMMENT_SNOB.prefs.getBoolPref("nocaps");
		prefs.startsWithCapital = YT_COMMENT_SNOB.prefs.getBoolPref("startsWithCapital");
		prefs.punctuation = YT_COMMENT_SNOB.prefs.getBoolPref("punctuation");
		prefs.excessiveCapitals = YT_COMMENT_SNOB.prefs.getBoolPref("excessiveCapitals");
		prefs.profanity = YT_COMMENT_SNOB.prefs.getBoolPref("profanity");
		prefs.extreme = YT_COMMENT_SNOB.prefs.getBoolPref("extreme");
		
		sendResponse({ "prefs" : prefs });
	}
});

addEventListener("load", YT_COMMENT_SNOB.load, false);