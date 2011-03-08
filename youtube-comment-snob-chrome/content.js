var refilterTimeout = null;
var inCommentFilter = false;

function refilterComments() {
	clearTimeout(refilterTimeout);
	
	if (!inCommentFilter) {
		refilterTimeout = setTimeout(doRefilterComments, 250);
	}
}

function doRefilterComments() {
	document.getElementById("watch-discussion").removeEventListener("DOMNodeRemoved", refilterComments, false);
	
	filterComments();
	
	addPaginationListener();
}

function createPlaceholder(page, id, reason) {
	var el = page.createElement("li");
	el.setAttribute("class", "comment");
	el.style.color = "#666";
	el.innerHTML = chrome.i18n.getMessage("label_hidden_reason", [ reason ]) + ' <a href="javascript:void(0);" onclick="if (document.getElementById(\''+id+'\').style.display == \'\') { document.getElementById(\''+id+'\').style.display = \'none\'; this.innerHTML = \''+chrome.i18n.getMessage("label_show")+'\';} else { document.getElementById(\''+id+'\').style.display = \'\'; this.innerHTML = \''+chrome.i18n.getMessage("label_hide")+'\';}">'+chrome.i18n.getMessage("label_show")+'</a>';
	
	return el;
}

function filterComments() {
	inCommentFilter = true;
	
	var page = document;
	
	chrome.extension.sendRequest({ subject : "prefs" }, function (response) {
		var prefs = response.prefs;
		
		if (prefs.extreme) {
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
		
				if (prefs.allcaps && !originalText.match(/[a-z]/m)){
					reason = chrome.i18n.getMessage("reason_only_capital");
				}
				else if (prefs.nocaps && !originalText.match(/[A-Z]/m)){
					reason = chrome.i18n.getMessage("reason_no_capital");
				}
				else if (prefs.startsWithCapital && originalText.match(/^[a-z]/m)){
					reason = chrome.i18n.getMessage("reason_start_lower");
				}
				else if (prefs.punctuation && originalText.match(/(!{2,})|(\?{3,})/m)){
					reason = chrome.i18n.getMessage("reason_too_much_punctuation");
				}
				else if (prefs.excessiveCapitals && originalText.match(/[A-Z]{5,}/m)){
					reason = chrome.i18n.getMessage("reason_too_much_capitalization");
				}
				else if (prefs.profanity && originalText.match(/\b(ass(hole)?\b|bitch|cunt|damn|fuc[kc]|(bull)?shits?\b|fag|nigger|nigga)/i)) {
					reason = chrome.i18n.getMessage("reason_too_much_profanity");
				}
				/*
				else if (this.dict) {
					var text = originalText;
				
					text = text.replace(/\s/mg, " ");
					text = text.replace(/\s+|[^a-z0-9\-']/img, " "); // '
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
				*/
			
				if (reason != ''){
					var commentNode = comment.parentNode.parentNode;
					var topNode = commentNode.parentNode;
					var id = "youtube-comment-snob-" + i;
					commentNode.setAttribute("id", id);
					commentNode.style.display = 'none';
					topNode.insertBefore(createPlaceholder(page, id, reason), commentNode);
				}
			}
		}
		
		inCommentFilter = false;
	});
}

function addPaginationListener() {
	var pagination = document.getElementsByClassName("comments-pagination");
	
	if (pagination.length > 0) {
		pagination = pagination.item(0);

		pagination.addEventListener("click", function (e) {
			if (e.target.nodeName == "BUTTON" || e.target.nodeName == "A" || (e.target.nodeName == "SPAN" && e.target.parentNode.nodeName == "BUTTON")) {
				document.getElementById("watch-discussion").addEventListener("DOMNodeRemoved", refilterComments, false);
			}
		}, false);
	}
}

filterComments();

addPaginationListener();