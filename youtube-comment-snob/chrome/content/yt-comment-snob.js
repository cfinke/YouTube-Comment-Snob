var YT_COMMENT_SNOB = {
	get maxMistakes() { return YT_COMMENT_SNOB.prefs.getIntPref("mistakes"); },
	get allcaps() { return YT_COMMENT_SNOB.prefs.getBoolPref("allcaps"); },
	get nocaps() { return YT_COMMENT_SNOB.prefs.getBoolPref("nocaps"); },
	get startsWithCapital() { return YT_COMMENT_SNOB.prefs.getBoolPref("startsWithCapital"); },
	get punctuation() { return YT_COMMENT_SNOB.prefs.getBoolPref("punctuation"); },
	get excessiveCapitals() { return YT_COMMENT_SNOB.prefs.getBoolPref("excessiveCapitals"); },
	get profanity() { return YT_COMMENT_SNOB.prefs.getBoolPref("profanity"); },
	get extreme() { return YT_COMMENT_SNOB.prefs.getBoolPref("extreme"); },
	
	dict : null,
	
	latestPage : null,

	prefs : null,
	
	load : function () {
		var firefoxBrowser = document.getElementById("appcontent");

		if (firefoxBrowser) {
			firefoxBrowser.addEventListener("DOMContentLoaded", YT_COMMENT_SNOB.DOMContentLoaded, false);
		}
		
		var fennecBrowser = document.getElementById("browsers");
		
		if (fennecBrowser) {
			fennecBrowser.addEventListener("load", YT_COMMENT_SNOB.DOMContentLoaded, true);
		}
		
		YT_COMMENT_SNOB.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.youtube-comment-snob.");
		
		var spellclass = "@mozilla.org/spellchecker/myspell;1";
		if ("@mozilla.org/spellchecker/hunspell;1" in Components.classes)
			spellclass = "@mozilla.org/spellchecker/hunspell;1";
		if ("@mozilla.org/spellchecker/engine;1" in Components.classes)
			spellclass = "@mozilla.org/spellchecker/engine;1";
			
		var spellchecker = Components.classes[spellclass].createInstance(Components.interfaces.mozISpellCheckingEngine);
		spellchecker.dictionary = YT_COMMENT_SNOB.prefs.getCharPref("dictionary");
		
		YT_COMMENT_SNOB.dict = spellchecker;
	},
	
	unload : function () {
		var firefoxBrowser = document.getElementById("appcontent");

		if (firefoxBrowser) {
			firefoxBrowser.removeEventListener("DOMContentLoaded", YT_COMMENT_SNOB.DOMContentLoaded, false);
		}
		
		var fennecBrowser = document.getElementById("browsers");
		
		if (fennecBrowser) {
			fennecBrowser.removeEventListener("load", YT_COMMENT_SNOB.DOMContentLoaded, true);
		}
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
						YT_COMMENT_SNOB.latestPage = b.contentDocument;
						setTimeout('YT_COMMENT_SNOB.filterComments();', 500);
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
						YT_COMMENT_SNOB.latestPage = b.contentDocument;
						setTimeout('YT_COMMENT_SNOB.filterComments();', 500);
					}
				} catch(e) {
					alert(e);
				}
			}
		}
	},
	
	filterComments : function (page) {
		if (!page) page = YT_COMMENT_SNOB.latestPage;
		
		if (YT_COMMENT_SNOB.extreme) {
			var comments = page.getElementById("watch-comment-panel");
			
			if (comments) {
				comments.parentNode.removeChild(comments);
			}
			
			var all_comments = page.getElementById("comment-video-info");
			
			if (all_comments) {
				all_comments.parentNode.removeChild(all_comments);
			}
		}
		else {
			var commentNodes = page.evaluate("//div[@class='watch-comment-body']", page, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
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
			
				var commentNode = comment.parentNode.parentNode;
				var topNode = commentNode.parentNode;
			
				var originalText = comment.innerHTML.replace(/<[^>]+>/gm, " ").replace(/^\s+|\s+$/mg, "");
			
				var reason = '';
			
				if (YT_COMMENT_SNOB.allcaps && !originalText.match(/[a-z]/m)){
					reason = "All capital letters";
				}
				else if (YT_COMMENT_SNOB.nocaps && !originalText.match(/[A-Z]/m)){
					reason = "No capital letters";
				}
				else if (YT_COMMENT_SNOB.startsWithCapital && originalText.match(/^[a-z]/m)){
					reason = "Doesn't start with a capital letter.";
				}
				else if (YT_COMMENT_SNOB.punctuation && originalText.match(/(!{2,})|(\?{3,})/m)){
					reason = "Excessive punctuation.";
				}
				else if (YT_COMMENT_SNOB.excessiveCapitals && originalText.match(/[A-Z]{5,}/m)){
					reason = "Excessive capitalization.";
				}
				else if (YT_COMMENT_SNOB.profanity && originalText.match(/\b(ass(hole)?\b|bitch|cunt|damn|fuc[kc]|(bull)?shits?\b|fag|nigger|nigga)/i)) {
					reason = "Profanity.";
				}
				else {
					var text = originalText;

					text = text.replace(/\s/mg, " ");
					text = text.replace(/\s+|[^a-z0-9\-']/img, " ");
					text = text.replace(/^\s+|\s+$/mg, "");

					words = text.split(" ");

					for (var j = 0; j < words.length; j++){
						if (!YT_COMMENT_SNOB.dict.check(words[j])){
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
				
					if (mistakes >= YT_COMMENT_SNOB.maxMistakes || mistakes == words.length) {
						reason = mistakes + " spelling error";
						if (mistakes != 1) reason += "s";
					}
				}
			
				if (reason != ''){
					if (!commentNode.id) {
						commentNode = topNode;
						topNode = commentNode.parentNode;
					}
				
					if (commentNode.id) {
						commentNode.style.display = 'none';
						topNode.insertBefore(YT_COMMENT_SNOB.createPlaceholder(page, commentNode.id, reason), commentNode);
					}
				}
			}
		}
	},
	
	createPlaceholder : function (page, id, reason) {
		var el = page.createElement("div");
		el.setAttribute("class", "watch-comment-head watch-comment-marked-spam smallText opacity30");
		el.innerHTML = 'Comment hidden (' + reason + ') <a class="eLink smallText" href="javascript:void(0);" onclick="if (document.getElementById(\''+id+'\').style.display == \'\') { document.getElementById(\''+id+'\').style.display = \'none\'; this.innerHTML = \'Show\';} else { document.getElementById(\''+id+'\').style.display = \'\'; this.innerHTML = \'Hide\';}">Show</a>';
		
		return el;
	}
};

addEventListener("load", YT_COMMENT_SNOB.load, false);
addEventListener("unload", YT_COMMENT_SNOB.unload, false);