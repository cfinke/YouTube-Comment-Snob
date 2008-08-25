var YT_COMMENT_SNOB = {
	get maxMistakes() { return YT_COMMENT_SNOB.prefs.getIntPref("mistakes"); },
	get allcaps() { return YT_COMMENT_SNOB.prefs.getBoolPref("allcaps"); },
	get nocaps() { return YT_COMMENT_SNOB.prefs.getBoolPref("nocaps"); },
	get startsWithCapital() { return YT_COMMENT_SNOB.prefs.getBoolPref("startsWithCapital"); },
	get punctuation() { return YT_COMMENT_SNOB.prefs.getBoolPref("punctuation"); },
	get excessiveCapitals() { return YT_COMMENT_SNOB.prefs.getBoolPref("excessiveCapitals"); },
	get profanity() { return YT_COMMENT_SNOB.prefs.getBoolPref("profanity"); },
	
	dict : null,
	
	latestPage : null,

	prefs : null,
	
	load : function () {
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.youtube-comment-snob.");
		
		var spellclass = "@mozilla.org/spellchecker/myspell;1";
		if ("@mozilla.org/spellchecker/hunspell;1" in Components.classes)
			spellclass = "@mozilla.org/spellchecker/hunspell;1";
		if ("@mozilla.org/spellchecker/engine;1" in Components.classes)
			spellclass = "@mozilla.org/spellchecker/engine;1";
			
		var spellchecker = Components.classes[spellclass].createInstance(Components.interfaces.mozISpellCheckingEngine);
		spellchecker.dictionary = this.prefs.getCharPref("dictionary");
		
		this.dict = spellchecker;
	},
	
	DOMContentLoaded : function (event) {
		try {
			var page = event.target;
			if (page.location.host.match(/youtube/)) {
				this.filterComments(page);
			}
		} catch (e) {
			return;
		}
	},
	
	getTabFromId : function (id) {
		var num = gBrowser.browsers.length;
		var re = new RegExp(id, "i");
		
		for (var i = 0; i < num; i++) {
			var b = gBrowser.getBrowserAtIndex(i);
			
			try {
				if (b.currentURI.spec.match(re)) {
					this.latestPage = b.contentDocument;
					setTimeout('YT_COMMENT_SNOB.filterComments();', 500);
				}
			} catch(e) {
				alert(e);
			}
		}
	},
	
	filterComments : function (page) {
		if (!page) page = this.latestPage;
		
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
			
			if (this.allcaps && !originalText.match(/[a-z]/m)){
				reason = "All capital letters";
			}
			else if (this.nocaps && !originalText.match(/[A-Z]/m)){
				reason = "No capital letters";
			}
			else if (this.startsWithCapital && originalText.match(/^[a-z]/m)){
				reason = "Doesn't start with a capital letter.";
			}
			else if (this.punctuation && originalText.match(/(!{2,})|(\?{3,})/m)){
				reason = "Excessive punctuation.";
			}
			else if (this.excessiveCapitals && originalText.match(/[A-Z]{5,}/m)){
				reason = "Excessive capitalization.";
			}
			else if (this.profanity && originalText.match(/\b(ass(hole)?\b|bitch|cunt|damn|fuc[kc]|(bull)?shits?\b|fag|nigger|nigga)/i)) {
				reason = "Profanity.";
			}
			else {
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
				if (!commentNode.id) {
					commentNode = topNode;
					topNode = commentNode.parentNode;
				}
				
				if (commentNode.id) {
					commentNode.style.display = 'none';
					topNode.insertBefore(this.createPlaceholder(page, commentNode.id, reason), commentNode);
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

addEventListener("load", function (event) { YT_COMMENT_SNOB.load(); }, false);

var appcontent = document.getElementById("appcontent");

if (appcontent) {
	appcontent.addEventListener("DOMContentLoaded", function (event) { YT_COMMENT_SNOB.DOMContentLoaded(event); }, false);
}