var YT_COMMENT_SNOB = {
	latestPage : null,
	
	prefs : null,
	
	maxMistakes : null,
	allcaps : null,
	nocaps : null,
	startsWithCapital : null,
	punctuation : null,
	excessiveCapitals : null,
	profanity : null,
	extreme : null,
	dict : null,
	
	load : function () {
		var firefoxBrowser = document.getElementById("appcontent");

		if (firefoxBrowser) {
			firefoxBrowser.addEventListener("DOMContentLoaded", this.DOMContentLoaded, false);
		}
		else {
			var fennecBrowser = document.getElementById("browsers");
		
			if (fennecBrowser) {
				fennecBrowser.addEventListener("load", this.DOMContentLoaded, true);
			}
		}
		
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.youtube-comment-snob.");	
		this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this.prefs.addObserver("", this, false);
		
		this.maxMistakes = this.prefs.getIntPref("mistakes");
		this.allcaps = this.prefs.getBoolPref("allcaps");
		this.nocaps = this.prefs.getBoolPref("nocaps");
		this.startsWithCapital = this.prefs.getBoolPref("startsWithCapital");
		this.punctuation = this.prefs.getBoolPref("punctuation");
		this.excessiveCapitals = this.prefs.getBoolPref("excessiveCapitals");
		this.profanity = this.prefs.getBoolPref("profanity");
		this.extreme = this.prefs.getBoolPref("extreme");
		
		this.loadDictionary();
	},
	
	loadDictionary : function () {
		var spellclass = "@mozilla.org/spellchecker/myspell;1";
		
		if ("@mozilla.org/spellchecker/hunspell;1" in Components.classes) {
			spellclass = "@mozilla.org/spellchecker/hunspell;1";
		}
		
		if ("@mozilla.org/spellchecker/engine;1" in Components.classes) {
			spellclass = "@mozilla.org/spellchecker/engine;1";
		}
		
		var spellchecker = Components.classes[spellclass].createInstance(Components.interfaces.mozISpellCheckingEngine);
		
		try {
			spellchecker.dictionary = this.prefs.getCharPref("dictionary");
			this.dict = spellchecker;
		} catch (e) {
			// Dictionary not available.
			this.dict = null;
		}
	},
	
	unload : function () {
		this.prefs.removeObserver("", this);
		
		var firefoxBrowser = document.getElementById("appcontent");

		if (firefoxBrowser) {
			firefoxBrowser.removeEventListener("DOMContentLoaded", this.DOMContentLoaded, false);
		}
		else {
			var fennecBrowser = document.getElementById("browsers");
		
			if (fennecBrowser) {
				fennecBrowser.removeEventListener("load", this.DOMContentLoaded, true);
			}
		}
	},
	
	observe : function(subject, topic, data) {
		if (topic != "nsPref:changed") {
			return;
		}
		
		YT_COMMENT_SNOB.maxMistakes = YT_COMMENT_SNOB.prefs.getIntPref("mistakes");
		YT_COMMENT_SNOB.allcaps = YT_COMMENT_SNOB.prefs.getBoolPref("allcaps");
		YT_COMMENT_SNOB.nocaps = YT_COMMENT_SNOB.prefs.getBoolPref("nocaps");
		YT_COMMENT_SNOB.startsWithCapital = YT_COMMENT_SNOB.prefs.getBoolPref("startsWithCapital");
		YT_COMMENT_SNOB.punctuation = YT_COMMENT_SNOB.prefs.getBoolPref("punctuation");
		YT_COMMENT_SNOB.excessiveCapitals = YT_COMMENT_SNOB.prefs.getBoolPref("excessiveCapitals");
		YT_COMMENT_SNOB.profanity = YT_COMMENT_SNOB.prefs.getBoolPref("profanity");
		YT_COMMENT_SNOB.extreme = YT_COMMENT_SNOB.prefs.getBoolPref("extreme");
		YT_COMMENT_SNOB.loadDictionary();
	},
	
	DOMContentLoaded : function (event) {
		try {
			var page = event.target;
			if (page.location.host.match(/youtube/)) {
				YT_COMMENT_SNOB.filterComments(page);
			}
		} catch (e) {
			return;
		}
	},
	
	getTabFromId : function (id) {
		var re = new RegExp(id, "i");
		
		if (typeof gBrowser != 'undefined') {
			var num = gBrowser.browsers.length;
		
			for (var i = 0; i < num; i++) {
				var b = gBrowser.getBrowserAtIndex(i);
			
				try {
					if (b.currentURI.spec.match(re)) {
						this.latestPage = b.contentDocument;
						setTimeout(function () { YT_COMMENT_SNOB.filterComments(); }, 500);
					}
				} catch(e) {
					alert(e);
				}
			}
		}
		else {
			var browsers = Browser.browsers;
			
			for (var i = 0; i < browsers.length; i++) {
				var b = browsers[i];
				
				try {
					if (b.currentURI.spec.match(re)) {
						this.latestPage = b.contentDocument;
						setTimeout(function () { YT_COMMENT_SNOB.filterComments(); }, 500);
					}
				} catch(e) {
					alert(e);
				}
			}
		}
	},
	
	filterComments : function (page) {
		if (!page) page = this.latestPage;
		
		if (this.extreme) {
			var comments = page.getElementById("comments-view");
			
			if (comments) {
				comments.parentNode.removeChild(comments);
			}
		}
		else {
			var commentNodes = page.evaluate("//div[@id='comments-view']//li[@class='comment']/div[@class='content']/div[@class='comment-text']", page, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
			var comment = commentNodes.iterateNext();
			var comments = [];
			var mistakes = 0;
		
			while (comment) {
				comments.push(comment);
				comment = commentNodes.iterateNext();
			}
			
			for (var i = 0; i < comments.length; i++){
				mistakes = 0;
				comment = comments[i];
			
				var originalText = comment.innerHTML.replace(/<[^>]+>/gm, " ").replace(/^\s+|\s+$/mg, "").replace(/^@\S+/g, "");
				
				var reason = '';
			
				if (this.allcaps && !originalText.match(/[a-z]/m)){
					reason = "All capital letters";
				}
				else if (this.nocaps && !originalText.match(/[A-Z]/m)){
					reason = "No capital letters";
				}
				else if (this.startsWithCapital && originalText.match(/^[a-z]/m)){
					reason = "Doesn't start with a capital letter";
				}
				else if (this.punctuation && originalText.match(/(!{2,})|(\?{3,})/m)){
					reason = "Excessive punctuation";
				}
				else if (this.excessiveCapitals && originalText.match(/[A-Z]{5,}/m)){
					reason = "Excessive capitalization";
				}
				else if (this.profanity && originalText.match(/\b(ass(hole)?\b|bitch|cunt|damn|fuc[kc]|(bull)?shits?\b|fag|nigger|nigga)/i)) {
					reason = "Profanity";
				}
				else if (this.dict) {
					var text = originalText;
					
					text = text.replace(/\s/mg, " ");
					text = text.replace(/\s+|[^a-z0-9\-']/img, " ");
					text = text.replace(/^\s+|\s+$/mg, "");
					
					words = text.split(" ");
					
					for (var j = 0; j < words.length; j++){
						if (!this.dict.check(words[j])){
							if (
								(words[j].charAt(0) === words[j].charAt(0).toUpperCase()) &&
								(words[j].substring(1) === words[j].substring(1).toLowerCase())
							)
							{
								// Probably a name.
							}
							else {
								mistakes++;
							}
						}
					}
					
					if (mistakes >= this.maxMistakes || mistakes == words.length) {
						reason = mistakes + " spelling error";
						if (mistakes != 1) reason += "s";
					}
				}
				
				if (reason != ''){
					var commentNode = comment.parentNode.parentNode;
					var topNode = commentNode.parentNode;
					var id = "youtube-comment-snob-" + i;
					commentNode.setAttribute("id", id);
					commentNode.style.display = 'none';
					topNode.insertBefore(this.createPlaceholder(page, id, reason), commentNode);
				}
			}
		}
	},
	
	createPlaceholder : function (page, id, reason) {
		var el = page.createElement("li");
		el.setAttribute("class", "comment");
		el.style.color = "#666";
		el.innerHTML = 'Comment hidden (' + reason + ') <a href="javascript:void(0);" onclick="if (document.getElementById(\''+id+'\').style.display == \'\') { document.getElementById(\''+id+'\').style.display = \'none\'; this.innerHTML = \'Show\';} else { document.getElementById(\''+id+'\').style.display = \'\'; this.innerHTML = \'Hide\';}">Show</a>';
		
		return el;
	},
	
	log : function (msg) {
		var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		consoleService.logStringMessage("YCS: " + msg);
	}
};

addEventListener("load", function () { YT_COMMENT_SNOB.load(); }, false);
addEventListener("unload", function () { YT_COMMENT_SNOB.unload(); }, false);