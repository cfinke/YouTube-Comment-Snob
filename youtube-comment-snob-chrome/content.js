var theSnob = null;

var refilterTimeout = null;
var inCommentFilter = false;

function filterComments(isRefilter) {
	chrome.extension.sendRequest({ subject : "snobs" }, function (response) {
		var snobs = response.snobs;
		var prefs = response.prefs;
		
		for (var i = 0, _len = snobs.length; i < _len; i++) {
			var regex = new RegExp(snobs[i].url, "i");
			
			if (document.location.href.match(regex)) {
				theSnob = snobs[i];
				
				inCommentFilter = true;
				
				if (prefs.extreme) {
					$(theSnob.allCommentsSelector).remove();
				}
				else {
					$(theSnob.textSelector).each(function (idx) {
						var reason = false;
						var $this = $(this);
						
						var originalText = $.trim($this.text());
						
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
					
						if (reason) {
							if ("commentContainerSelector" in theSnob) {
								var commentNode = $this.closest(theSnob.commentContainerSelector);
							}
							else {
								var commentNode = $this;
							}
						
							var topNode = commentNode.parent();
							var id = "comment-snob-" + idx;
							commentNode.attr("id", id);
							commentNode.hide();
							commentNode.before(createPlaceholder(id, reason));
						}
					});
				}
				
				inCommentFilter = false;
			
				if (!isRefilter) {
					if ("ajaxInitiatorSelector" in theSnob) {
						$(theSnob.ajaxInitiatorSelector).live("click", function (e) {
							$(theSnob.allCommentsSelector).each(function (idx, el) {
								el.addEventListener("DOMNodeRemoved", refilterComments, false);
							});
						});
					}
				}
			
				break;
			}
		}
	});
}

function refilterComments() {
	clearTimeout(refilterTimeout);
	
	if (!inCommentFilter) {
		refilterTimeout = setTimeout(doRefilterComments, 250);
	}
}

function doRefilterComments() {
	$(theSnob.allCommentsSelector).each(function (idx, el) {
		el.removeEventListener("DOMNodeRemoved", refilterComments, false);
	});
	
	filterComments(true);
}

function createPlaceholder(id, reason) {
	var el = $("<" + theSnob.placeholderElement+"/>");
	
	for (var attr in theSnob.placeholderAttributes) {
		el.attr(attr, theSnob.placeholderAttributes[attr]);
	}
	
	el.html(chrome.i18n.getMessage("label_hidden_reason", [ reason ]) + ' <a href="javascript:void(0);" onclick="if (document.getElementById(\''+id+'\').style.display == \'\') { document.getElementById(\''+id+'\').style.display = \'none\'; this.innerHTML = \''+chrome.i18n.getMessage("label_show")+'\';} else { document.getElementById(\''+id+'\').style.display = \'\'; this.innerHTML = \''+chrome.i18n.getMessage("label_hide")+'\';}">'+chrome.i18n.getMessage("label_show")+'</a>');
	
	return el;
}

filterComments();