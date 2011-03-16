/*

{
	"id": "unique-id-here-of-any-format",
	"url": "^http://www\.youtube\.com/.*$",
	"allCommentsSelector": "#comments-view", // Selector for the entire comments section.
		"commentContainerSelector": "li.comment", // Combined with allCommentsSelector, selects the highest-level container for each comment.
			"commentTextSelector": "div.comment-text", // Combined with commentContainerSelector, selects the text of a comment
			"commentHideSelector": "> div", // Combined with commentContainerSelector, selects the portion of the comment to be hidden
		"placeholderElement": "div", // The element that will be created to contain the show/hide toggle.
			"toggleContainerSelector": "td.default > div span.comhead", // Combined with commentContainerSelector, finds the node that the placeholder will be added to.
			"togglePlacement": "append", // Whether the placeholder will be "append"ed, "prepend"ed, "before"d, or "after"d
			"placeholderAttributes": { // Attributes for the placeholder element.
				"class": "content",
				"style": "color: #666;"
			},
	"ajaxInitiatorSelector": ".comments-pagination button, .comments-pagination a, .comments-pagination button > span", // Selector for elements that may be clicked to dynamically update the comments.
	"updateURL": "http://www.chrisfinke.com/snobs/youtube.snob" // Will be pinged to get changes to this rule.
}

*/
/*

var snobs = [
	{
		"id": "youtube@chrisfinke.com",
		"version": 1,
		"label": "YouTube",
		"url": "^http://www\\.youtube\\.com/.*$",
		"allCommentsSelector": "#comments-view",
		"commentContainerSelector": "li.comment",
			"commentTextSelector": "div.comment-text",
			"commentHideSelector": "> div",
		"placeholderElement": "div",
		"placeholderAttributes": {
			"class": "content",
			"style": "color: #666;"
		},
		"ajaxInitiatorSelector": ".comments-pagination button, .comments-pagination a, .comments-pagination button > span",
		"updateURL": "http://www.chrisfinke.com/snobs/youtube.snob"
	},
	{
		"id": "fark@chrisfinke.com",
		"label": "Fark",
		"url": "^http://www\\.fark\\.com/comments",
		"allCommentsSelector": "#commentsArea",
			"commentContainerSelector": ".ctext",
			"placeholderElement": "div",
				"togglePlacement": "before",
				"placeholderAttributes": {
					"class": "ctext",
					"style": "color: #666;"
				}
	},
	{
		"id": "hn@chrisfinke.com",
		"site": "Hacker News",
		"url": "^http://news\.ycombinator\.com/item",
		"allCommentsSelector": "body > center:first > table:first > tbody:first > tr:eq(2) > td:first > table:eq(1)",
		"commentContainerSelector": "> tbody > tr",
			"commentTextSelector": "span.comment",
			"commentHideSelector": "span.comment",
		"toggleContainerSelector": "td.default > div span.comhead",
		"togglePlacement": "append",
		"placeholderElement": "span",
		"placeholderAttributes": {
			"class": "comhead",
			"style": "padding-left: 5px; margin-left: 5px; border-left: 1px solid #828282;"
		}
	},
	{
		"id": "digg@chrisfinke.com",
		"site": "Digg",
		"url": "^http://digg\\.com/.+/.+",
		"allCommentsSelector": "#comment-list", // Selector for the entire comments section.
			"commentContainerSelector": "div.comment-thread", // Combined with allCommentsSelector, selects the highest-level container for each comment.
				"commentTextSelector": "p.comment-body:first", // Combined with commentContainerSelector, selects the text of a comment
				"commentHideSelector": ".comment-content:first", // Combined with commentContainerSelector, selects the portion of the comment to be hidden
			"placeholderElement": "div", // The element that will be created to contain the show/hide toggle.
				"toggleContainerSelector": ".comment-content:first",
				"togglePlacement": "before", // Whether the placeholder will be "append"ed, "prepend"ed, "before"d, or "after"d
				"placeholderAttributes": { // Attributes for the placeholder element.
					"class": "comment",
					"style": "color: #666;"
				},
		"ajaxInitiatorSelector": "#more-comments",
		"updateURL": "http://www.chrisfinke.com/snobs/youtube.snob" // Will be pinged to get changes to this rule.
	}
];

*/

var COMMENT_SNOB = {
	youtubeRule : {
		"id": "youtube@chrisfinke.com",
		"label": "YouTube",
		"url": "^http://www\\.youtube\\.com/.*$",
		"allCommentsSelector": "#comments-view",
		"commentContainerSelector": "li.comment",
		"commentTextSelector": "div.comment-text",
		"commentHideSelector": "> div",
		"placeholderElement": "div",
		"placeholderAttributes": {
			"class": "content",
			"style": "color: #666;"
		},
		"ajaxInitiatorSelector": ".comments-pagination button, .comments-pagination a, .comments-pagination button > span",
		"updateURL": "http://www.chrisfinke.com/comment-snob/rules/youtube.snob"
	},
	
	get defaultPrefs() {
		return {
			"allcaps" : COMMENT_SNOB.prefs.getBoolPref("allcaps"),
			"nocaps" : COMMENT_SNOB.prefs.getBoolPref("nocaps"),
			"punctuation" : COMMENT_SNOB.prefs.getBoolPref("punctuation"),
			"startsWithCapital" : COMMENT_SNOB.prefs.getBoolPref("startsWithCapital"),
			"excessiveCapitals" : COMMENT_SNOB.prefs.getBoolPref("excessiveCapitals"),
			"profanity" : COMMENT_SNOB.prefs.getBoolPref("profanity"),
			"extreme" : COMMENT_SNOB.prefs.getBoolPref("extreme")
		};
	},
	
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
			
			$(".preference").change(function () {
				COMMENT_SNOB.options.save();
			});
			
			var snobList = $("#site");
			
			snobList.change(function () {
				COMMENT_SNOB.options.showSnobSettings($(this).val());
				
				if ($(this).val()) {
					$("#remove").attr("disabled", false);
				}
				else {
					$("#remove").attr("disabled", true);
				}
			});
			
			COMMENT_SNOB.options.populateRuleList();
			
			$("#extreme").click(COMMENT_SNOB.options.setDisabled);
			
			$("#remove").click(function () {
				if (confirm("Are you sure?")) {
					COMMENT_SNOB.removeRule($("#site").val());
					COMMENT_SNOB.options.populateRuleList();
				}
			});
			
			$("#add").click(function () {
				var rule = prompt("Enter the rule.");
				
				if (rule) {
					try {
						var rule = JSON.parse(rule);
					} catch (e) {
						alert("Invalid rule:" + e);
						return;
					}
					
					COMMENT_SNOB.addRule(rule);
					COMMENT_SNOB.options.populateRuleList();
					$("#site").val(rule.id).change();
				}
			});
			
			COMMENT_SNOB.options.setDisabled();
		},
		
		populateRuleList : function () {
			var snobList = $("#site");
			
			snobList.find("option").each(function () {
				if ($(this).val()) {
					$(this).remove();
				}
			});
			
			var rules = COMMENT_SNOB.prefs.getJSONPref("rules", {});
			
			for (var i in rules) {
				var option = $("<option/>");
				option.text(rules[i].label);
				option.val(i);
				
				snobList.append(option);
			}
			
			snobList.change();
		},
		
		showSnobSettings : function (snobId) {
			var prefs = COMMENT_SNOB.prefs.getJSONPref("rulePrefs", {});
			
			if (snobId in prefs) {
				var rulePrefs = prefs[snobId];
			}
			else {
				var rulePrefs = COMMENT_SNOB.defaultPrefs;
			}
			
			$(".preference-bool").each(function () {
				$(this).attr("checked", rulePrefs[$(this).attr("preference")]);
			});
			
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
			var disabled = $("#extreme").attr("checked");
			
			$(".preference").each(function () {
				if ($(this).attr("id") != "extreme") {
					$(this).attr("disabled", disabled);
				}
			});
		},
		
		unload : function () {
			removeEventListener("unload", COMMENT_SNOB.options.unload, false);
			
			$("#extreme").unbind("click", COMMENT_SNOB.options.setDisabled);
		},
		
		save : function () {
			if (!$("#site").val()) {
				$(".preference-bool").each(function () {
					COMMENT_SNOB.prefs.setBoolPref($(this).attr("preference"), $(this).attr("checked"));
				});
			}
			else {
				var prefObject = {};
				
				$(".preference-bool").each(function () {
					prefObject[$(this).attr("preference")] = $(this).attr("checked");
				});
				
				var prefs = COMMENT_SNOB.prefs.getJSONPref("rulePrefs", {});
				prefs[$("#site").val()] = prefObject;
				
				COMMENT_SNOB.prefs.setJSONPref("rulePrefs", prefs);
			}
		}
	},
	
	load : function () {
		function pref(name, val) {
			if (COMMENT_SNOB.prefs.getPref(name) === null) {
				COMMENT_SNOB.prefs.setPref(name, val);
			}
		}
		
		pref("firstrun", true);
		pref("allcaps", true);
		pref("nocaps", true);
		pref("punctuation", true);
		pref("startsWithCapital", true);
		pref("excessiveCapitals", true);
		pref("profanity", false);
		pref("extreme", false);
		
		if (COMMENT_SNOB.prefs.getBoolPref("firstrun")) {
			// Add the YouTube rule.
			COMMENT_SNOB.addRule(COMMENT_SNOB.youtubeRule);
			COMMENT_SNOB.prefs.setBoolPref("firstrun", false);
		}
	},
	
	addRule : function (rule) {
		var rules = COMMENT_SNOB.prefs.getJSONPref("rules", {});
		rules[rule.id] = rule;
		
		COMMENT_SNOB.prefs.setJSONPref("rules", rules);
	},
	
	removeRule : function (ruleId) {
		var rules = COMMENT_SNOB.prefs.getJSONPref("rules", {});
		
		if (ruleId in rules) {
			delete rules[ruleId];
			COMMENT_SNOB.prefs.setJSONPref("rules", rules);
		}
		
		var prefs = COMMENT_SNOB.prefs.getJSONPref("rulePrefs", {});
		
		if (ruleId in prefs) {
			delete prefs[ruleId];
			COMMENT_SNOB.prefs.setJSONPref("rulePrefs", prefs);
		}
	},
	
	getRulePrefs : function (ruleId) {
		var prefs = COMMENT_SNOB.prefs.getJSONPref("rulePrefs", {});
		
		if (!(ruleId in prefs)) {
			return COMMENT_SNOB.defaultPrefs;
		}
		else {
			return prefs[ruleId];
		}
	}
};