var pageRules = null;

var theRule = null;
var thePrefs = null;

var refilterTimeout = null;
var inCommentFilter = false;

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
	if (request.subject === "filter") {
		console.log(request);
		theRule = request.rule;
		thePrefs = request.prefs;
		filterComments();
	}
	else if (request.subject === "rules") {
		console.log("here");
		if (pageRules !== null) {
			checkForRules();
		}
	}
});

function filterComments(isRefilter) {
	inCommentFilter = true;

	var prefs = thePrefs;
	
	var allComments = $(theRule.allCommentsSelector);

	if (prefs.extreme) {
		allComments.remove();
	}
	else {
		allComments.find(theRule.commentContainerSelector).each(function (idx) {
			var reason = false;
			var $this = $(this);
		
			if ("commentTextSelector" in theRule) {
				var textContainer = $this.find(theRule.commentTextSelector);
			}
			else {
				var textContainer = $this;
			}
		
			var originalText = $.trim(textContainer.text());
			originalText = originalText.replace(/https?:\/\/[^\s]+\s/g, "");
		
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
				var id = "comment-snob-" + idx;
			
				if ("commentHideSelector" in theRule) {
					var commentHide = $this.find(theRule.commentHideSelector);
				}
				else {
					if ("commentTextSelector" in theRule) {
						var commentHide = $this.find(theRule.commentTextSelector);
					}
					else {
						var commentHide = $this;
					}
				}
			
				commentHide.addClass(id);
				commentHide.hide();
			
				if ("toggleContainerSelector" in theRule) {
					var toggleContainer = $this.find(theRule.toggleContainerSelector);
				}
				else {
					var toggleContainer = $this;
				}
			
				var inserter = "prepend";
			
				if ("togglePlacement" in theRule) {
					switch (theRule.togglePlacement) {
						case "prepend":
						case "append":
						case "before":
						case "after":
							inserter = theRule.togglePlacement;
						break;
					}
				}
			
				toggleContainer[inserter](createPlaceholder(id, reason));
			
			}
		});
	}

	inCommentFilter = false;

	if (!isRefilter) {
		if ("ajaxInitiatorSelector" in theRule) {
			$(theRule.ajaxInitiatorSelector).live("click", function (e) {
				allComments.each(function (idx, el) {
					el.addEventListener("DOMNodeRemoved", refilterComments, false);
				});
			});
		}
	}
}

function refilterComments() {
	clearTimeout(refilterTimeout);
	
	if (!inCommentFilter) {
		refilterTimeout = setTimeout(doRefilterComments, 250);
	}
}

function doRefilterComments() {
	$(theRule.allCommentsSelector).each(function (idx, el) {
		el.removeEventListener("DOMNodeRemoved", refilterComments, false);
	});
	
	filterComments(true);
}

function createPlaceholder(id, reason) {
	if ("placeholderElement" in theRule) {
		var el = $("<" + theRule.placeholderElement+"/>");
	}
	else {
		var ele = $("<span/>");
	}
	
	for (var attr in theRule.placeholderAttributes) {
		el.attr(attr, theRule.placeholderAttributes[attr]);
	}
	
	el.html(
		chrome.i18n.getMessage("label_hidden_reason", 
			[ reason ]) + 
			' <a href="javascript:void(0);" ' +
			' onclick="var elements = document.getElementsByClassName(\''+id+'\'); ' + 
				" if (elements.item(0).style.display == '') { " +
					' for (var i = 0, _len = elements.length; i < _len; i++) { ' +
						" elements.item(i).style.display = 'none'; " +
					' } ' +
					" this.innerHTML = '"+chrome.i18n.getMessage("label_show")+"'; " +
				' } else { ' +
					' for (var i = 0, _len = elements.length; i < _len; i++) { ' +
						" elements.item(i).style.display = ''; " +
					' } ' + 
					" this.innerHTML = '"+chrome.i18n.getMessage("label_hide")+"';" +
				' }">' + chrome.i18n.getMessage("label_show") + '</a>'
	);
	
	return el;
}

function checkForRules() {
	if (pageRules === null) {
		var rules = [];
	
		if ($(".comment-snob-rule, *[rel='comment-snob-rule']").length > 0) {
			$(".comment-snob-rule, *[rel='comment-snob-rule']").each(function (e) {
				if ($(this).attr("href")) {
					rules.push( { "label" : $(this).attr("title"), "href" : $(this).attr("href") } );
				}
				else {
					var rule = JSON.minify($(this).text());
				
					var jsonRule = JSON.parse(rule);
			
					rules.push( { "label" : jsonRule.label, "rule" : jsonRule } );
				}
			});
		}
	
		pageRules = rules;
	}
	
	console.log("Found rules")
	console.log(pageRules);
	
	chrome.extension.sendRequest({ subject : "content_rules", rules : rules });
}

checkForRules();