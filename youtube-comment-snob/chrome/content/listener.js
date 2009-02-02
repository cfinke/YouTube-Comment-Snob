function YT_COMMENT_SNOB_LISTENER() {
	this.register();
}

function logTubeFilterMsg(message) {
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
	consoleService.logStringMessage("YT_COMMENT_SNOB: " + message);
}

YT_COMMENT_SNOB_LISTENER.prototype = {
	observe : function (subject, topic, data) {
		if ((typeof Components == 'undefined') || !Components) return;
		
		var request = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
		
		if (request.URI.spec.match(/^http:\/\/[^\/]*youtube.com\/watch_ajax.*action_get_comments/i)){
			var videoId = request.URI.spec.split("v=")[1].split("&")[0];
			YT_COMMENT_SNOB.getTabFromId(videoId);
		}
	},
	
	register : function () {
		var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
		observerService.addObserver(this, "http-on-examine-response", false);
	},
	
	unregister : function () {
		var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
		observerService.removeObserver(this, "http-on-examine-response");
	}
};

var yt_comment_snob_ob = new YT_COMMENT_SNOB_LISTENER();