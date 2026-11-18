// Runs on reddit hosts other than old.reddit.com. If the page is the old
// design (for example www.reddit.com with the old-reddit preference turned
// on), ask the service worker to load SHINE into it. The redesign is left alone.
(function () {
	var isOldDesign = document.getElementById("header") &&
		document.getElementById("header-bottom-left") &&
		document.querySelector("body > .content");

	if (isOldDesign && !document.documentElement.classList.contains("SHINE")) {
		chrome.runtime.sendMessage({ type: "shine-inject-old-design" });
	}
})();
