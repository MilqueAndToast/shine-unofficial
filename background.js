// SHINE service worker (Manifest V3).
// Also loaded as a background script in Firefox, so stick to APIs both support.

var api = typeof browser !== "undefined" ? browser : chrome;

var REDIRECT_RULESET = "old_reddit_redirect";

// The toolbar button opens old reddit (www.reddit.com is the redesign now).
api.action.onClicked.addListener(function () {
	api.tabs.create({ url: "https://old.reddit.com/" });
});

// Keep the old-reddit redirect ruleset in sync with the user's setting.
function syncRedirect(settings) {
	var enabled = !(settings && settings.global && settings.global.redirect === "off");
	var opts = enabled ? { enableRulesetIds: [REDIRECT_RULESET] } : { disableRulesetIds: [REDIRECT_RULESET] };
	return api.declarativeNetRequest.updateEnabledRulesets(opts).catch(function (err) {
		console.warn("SHINE: could not update redirect ruleset", err);
	});
}

function syncFromStorage() {
	api.storage.local.get("shine").then(function (data) {
		syncRedirect(data && data.shine);
	});
}

api.runtime.onInstalled.addListener(syncFromStorage);
api.runtime.onStartup.addListener(syncFromStorage);

api.storage.onChanged.addListener(function (changes, area) {
	if (area === "local" && changes.shine) {
		syncRedirect(changes.shine.newValue);
	}
});

// Content scripts can't inject into the page's own JavaScript context, so they
// ask us to do it. The list/grid scripts rely on the jQuery that old reddit
// already loads on the page, so they run in the MAIN world.
api.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
	if (!msg || !sender.tab) {
		return false;
	}

	var target = { tabId: sender.tab.id, frameIds: [sender.frameId || 0] };

	if (msg.type === "shine-inject-main") {
		injectMain(target, msg.files).then(
			function () { sendResponse({ ok: true }); },
			function (err) { sendResponse({ ok: false, error: String(err) }); }
		);
		return true;
	}

	if (msg.type === "shine-inject-old-design") {
		// Old design served on a host other than old.reddit.com (for example
		// www.reddit.com with the "use old reddit" preference).
		var manifest = api.runtime.getManifest();
		var css = manifest.content_scripts[0].css;
		var js = manifest.content_scripts[1].js;
		api.scripting.insertCSS({ target: target, files: css })
			.then(function () { return api.scripting.executeScript({ target: target, files: js }); })
			.then(
				function () { sendResponse({ ok: true }); },
				function (err) { sendResponse({ ok: false, error: String(err) }); }
			);
		return true;
	}

	return false;
});

function injectMain(target, files) {
	files = (files || []).filter(function (f) { return /^[\w.\-\/]+\.js$/.test(f); });

	// Make sure the page has jQuery before the scripts that depend on it run.
	return api.scripting.executeScript({
		target: target,
		world: "MAIN",
		func: function () { return typeof window.jQuery === "function"; }
	}).then(function (results) {
		var hasJQuery = results && results[0] && results[0].result;
		if (!hasJQuery) {
			files.unshift("jquery-3.7.1.min.js");
		}
		return api.scripting.executeScript({ target: target, world: "MAIN", files: files });
	});
}
