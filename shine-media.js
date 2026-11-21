// SHINE media helpers shared by the list and grid views.
// Runs in the page's own JavaScript world (like shine-list.js / shine-grid.js)
// and uses the jQuery that old reddit already loads.

var SHINE_IFRAME_ALLOW = "autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write";

// Post links are user-submitted and get pasted into HTML attributes and CSS
// url() values all over the list/grid code. Percent-encode the characters that
// could break out of those contexts. Browsers and servers treat the encoded
// URL the same as the original.
function shineSafeURL(url){
	return String(url == null ? "" : url).replace(/["'<>()\\`\s]/g, function(c){
		var hex = c.charCodeAt(0).toString(16).toUpperCase();
		return "%" + (hex.length < 2 ? "0" + hex : hex);
	});
}

function shineEscapeHTML(text){
	return String(text == null ? "" : text).replace(/[&<>"']/g, function(c){
		return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
	});
}


// ---------------------------------------------------------------------------
// Post media, two sources:
//  1. The expando markup old reddit already puts in the listing
//     (".expando[data-cachedhtml]"): no extra requests.
//  2. The post's JSON (/comments/<id>.json, same origin, the reader's session).
//     Reddit blocks the bulk endpoints (/by_id, /api/info) for browsers, so
//     posts are fetched one at a time, a couple at once.

var shinePostCache = {};
var shinePostWaiting = {};
var shinePostPending = [];
var shinePostActive = 0;
var SHINE_POST_CONCURRENCY = 2;

function shineGetPost(fullname, callback){
	if( !fullname || !/^t3_[a-z0-9]+$/i.test(fullname) ){
		callback(null);
		return;
	}
	if( shinePostCache.hasOwnProperty(fullname) ){
		callback(shinePostCache[fullname]);
		return;
	}
	if( shinePostWaiting[fullname] ){
		shinePostWaiting[fullname].push(callback);
		return;
	}
	shinePostWaiting[fullname] = [callback];
	shinePostPending.push(fullname);
	shinePumpPostQueue();
}

function shinePumpPostQueue(){
	while( shinePostActive < SHINE_POST_CONCURRENCY && shinePostPending.length ){
		shineFetchPost(shinePostPending.shift());
	}
}

function shineFetchPost(fullname){
	shinePostActive++;
	fetch("/comments/" + fullname.slice(3) + ".json?raw_json=1&limit=1&depth=1", { credentials: "same-origin" })
		.then(function(response){
			if( !response.ok ){
				throw new Error("HTTP " + response.status);
			}
			return response.json();
		})
		.then(function(json){
			var post = json && json[0] && json[0].data && json[0].data.children && json[0].data.children[0];
			shinePostCache[fullname] = post ? post.data : null;
		})
		.catch(function(err){
			console.warn("SHINE: could not load post data for " + fullname, err);
			shinePostCache[fullname] = null;
		})
		.then(function(){
			var callbacks = shinePostWaiting[fullname] || [];
			delete shinePostWaiting[fullname];
			shinePostActive--;
			callbacks.forEach(function(cb){ cb(shinePostCache[fullname]); });
			shinePumpPostQueue();
		});
}

// Read media from the listing's cached expando markup. DOMParser doesn't run
// the inline scripts in it.
function shineMediaFromThing(thing){
	var $thing = $(thing);
	var cached = $thing.find(".expando").first().attr("data-cachedhtml");
	if( !cached ){
		return null;
	}
	var doc = new DOMParser().parseFromString(cached, "text/html");
	var thumb = $thing.find("a.thumbnail img").attr("src") || "";
	if( thumb.indexOf("//") === 0 ){
		thumb = "https:" + thumb;
	}

	var player = doc.querySelector("[data-hls-url]");
	if( player ){
		return {
			type: "video",
			hls: player.getAttribute("data-hls-url"),
			mp4: "",
			poster: thumb,
			silent: player.getAttribute("data-is-gif") === "true",
			lowResPoster: true
		};
	}

	var tiles = doc.querySelectorAll(".gallery-tile[data-media-id]");
	if( tiles.length ){
		var items = [];
		for( var i = 0; i < tiles.length; i++ ){
			var img = tiles[i].querySelector("img");
			var tileSrc = img ? img.getAttribute("src") : "";
			var id = tiles[i].getAttribute("data-media-id");
			var ext = (tileSrc.match(/\/[a-z0-9]+\.(\w+)\?/i) || [])[1] || "jpg";
			var caption = tiles[i].getAttribute("data-caption") || "";
			items.push({
				image: "https://i.redd.it/" + id + "." + ext,
				thumb: tileSrc,
				caption: caption,
				link: ""
			});
		}
		return { type: "gallery", items: items, poster: items[0].image };
	}

	return null;
}

// Media for a post: listing markup first, then the post JSON.
function shineGetMedia(fullname, callback){
	var thing = document.querySelector('.thing[data-fullname="' + fullname + '"]');
	var media = thing ? shineMediaFromThing(thing) : null;
	if( media ){
		// use the sharper poster if the grid card already fetched the post
		if( media.lowResPoster && shinePostCache[fullname] ){
			media.poster = shinePickPreview(shinePostCache[fullname], 640) || media.poster;
		}
		callback(media, null);
		return;
	}
	shineGetPost(fullname, function(post){
		callback(shineMediaFromPost(post), post);
	});
}


// ---------------------------------------------------------------------------
// Work out how to show a reddit post's media.
// Returns {type: "video"|"gallery"|"image", ...} or null.

function shinePickPreview(post, minWidth){
	var img = post && post.preview && post.preview.images && post.preview.images[0];
	if( !img ){
		if( post && /^https?:/.test(post.thumbnail || "") ){
			return post.thumbnail;
		}
		return "";
	}
	var resolutions = img.resolutions || [];
	for( var i = 0; i < resolutions.length; i++ ){
		if( resolutions[i].width >= (minWidth || 640) ){
			return resolutions[i].url;
		}
	}
	return img.source ? img.source.url : "";
}

function shineMediaFromPost(post){
	if( !post ){
		return null;
	}

	// crossposts keep their media on the original post
	var src = (post.crosspost_parent_list && post.crosspost_parent_list[0]) || post;
	var preview = src.preview || post.preview;
	var poster = shinePickPreview(src, 640) || shinePickPreview(post, 640);

	// reddit galleries
	if( src.is_gallery && src.media_metadata && src.gallery_data && src.gallery_data.items ){
		var items = [];
		for( var i = 0; i < src.gallery_data.items.length; i++ ){
			var item = src.gallery_data.items[i];
			var meta = src.media_metadata[item.media_id];
			if( !meta || meta.status !== "valid" || !meta.s ){
				continue;
			}
			var full = meta.s.u || meta.s.gif || meta.s.mp4;
			var previews = meta.p || [];
			var thumb = previews.length ? previews[Math.min(1, previews.length - 1)].u : full;
			items.push({
				image: meta.s.gif || full,
				thumb: thumb,
				caption: item.caption || "",
				link: item.outbound_url || ""
			});
		}
		if( items.length ){
			return { type: "gallery", items: items, poster: items[0].thumb || items[0].image };
		}
	}

	// reddit-hosted video (v.redd.it)
	var video = (src.secure_media && src.secure_media.reddit_video) || (src.media && src.media.reddit_video);
	if( video ){
		return { type: "video", hls: video.hls_url, mp4: video.fallback_url, poster: poster, silent: !!video.is_gif };
	}

	// reddit's own video copy of an external gif/video (gfycat, redgifs, imgur...)
	if( preview && preview.reddit_video_preview ){
		var pv = preview.reddit_video_preview;
		return { type: "video", hls: pv.hls_url, mp4: pv.fallback_url, poster: poster, silent: !!pv.is_gif };
	}

	var img = preview && preview.images && preview.images[0];
	if( img && img.variants && img.variants.mp4 ){
		return { type: "video", mp4: img.variants.mp4.source.url, poster: poster, silent: true };
	}
	if( img && img.variants && img.variants.gif ){
		return { type: "image", url: img.variants.gif.source.url, poster: poster };
	}
	if( src.post_hint === "image" && src.url ){
		return { type: "image", url: src.url, poster: poster };
	}
	if( img && img.source ){
		return { type: "image", url: img.source.url, poster: poster, isPreview: true };
	}
	return null;
}


// ---------------------------------------------------------------------------
// Video player. v.redd.it serves HLS (video with sound). Browsers that can't
// play HLS natively get hls.js, loaded on first use.

var shineHlsCallbacks = null;
var shineHlsPlayers = [];

function shineWithHls(callback){
	if( window.Hls ){
		callback(window.Hls);
		return;
	}
	if( shineHlsCallbacks ){
		shineHlsCallbacks.push(callback);
		return;
	}
	shineHlsCallbacks = [callback];
	window.addEventListener("message", function onLoaded(e){
		if( e.source !== window || !e.data || e.data.shine !== "hls-loaded" ){
			return;
		}
		window.removeEventListener("message", onLoaded);
		var callbacks = shineHlsCallbacks;
		shineHlsCallbacks = null;
		callbacks.forEach(function(cb){ cb(window.Hls || null); });
	});
	// base.js (the content script) asks the extension to load hls.js
	window.postMessage({ shine: "load-hls" }, "*");
}

// Stop players whose video element is gone (closed expando, new post opened).
function shineCleanupHls(){
	shineHlsPlayers = shineHlsPlayers.filter(function(player){
		if( !document.contains(player.media) ){
			player.destroy();
			return false;
		}
		return true;
	});
}
setInterval(shineCleanupHls, 5000);

function shineVideoElement(media){
	var video = document.createElement("video");
	video.controls = true;
	video.autoplay = true;
	video.loop = true;
	video.playsInline = true;
	video.preload = "auto";
	video.muted = !!media.silent;
	if( media.poster ){
		video.poster = media.poster;
	}

	if( media.hls ){
		// Some browsers (Edge, for one) answer "maybe" to canPlayType for HLS
		// and then fail, so prefer hls.js wherever Media Source Extensions
		// exist and keep native HLS for browsers without them (iOS Safari).
		var hasMSE = !!(window.MediaSource || window.ManagedMediaSource || window.WebKitMediaSource);
		if( !hasMSE && video.canPlayType("application/vnd.apple.mpegurl") ){
			video.src = media.hls;
		}else{
			shineWithHls(function(Hls){
				if( Hls && Hls.isSupported() ){
					shineCleanupHls();
					var player = new Hls({ capLevelToPlayerSize: true });
					player.media = video;
					player.on(Hls.Events.ERROR, function(evt, data){
						if( data && data.fatal && media.mp4 ){
							player.destroy();
							video.src = media.mp4;
						}
					});
					player.loadSource(media.hls);
					player.attachMedia(video);
					shineHlsPlayers.push(player);
				}else if( media.mp4 ){
					video.src = media.mp4;
				}
			});
		}
	}else if( media.mp4 ){
		video.src = media.mp4;
	}

	// Browsers can refuse to autoplay with sound. Start muted rather than
	// leaving the player paused; the reader can unmute.
	video.addEventListener("canplay", function onCanPlay(){
		video.removeEventListener("canplay", onCanPlay);
		if( !video.paused ){
			return;
		}
		var attempt = video.play();
		if( attempt && attempt.catch ){
			attempt.catch(function(){
				video.muted = true;
				video.play().catch(function(){});
			});
		}
	});

	return video;
}


// ---------------------------------------------------------------------------
// Rendering into a "large area" container (list view expando or grid overlay).

var SHINE_CAPTION_ICON = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="-291 389 20 16"><path d="M-273,389h-16c-1.1,0-2,0.9-2,2v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2v-12C-271,389.9-271.9,389-273,389z M-289,397h4v2h-4V397z M-279,403h-10v-2h10V403z M-273,403h-4v-2h4V403z M-273,399h-10v-2h10V399z"/></svg>';

function shineShowCaption($captions, title, description){
	$captions.html("");
	if( !title && !description ){
		return;
	}
	$captions.html('<div class="show-captions">' + SHINE_CAPTION_ICON + '</div><div class="caption-text"><strong></strong><p></p></div>');
	$captions.find(".caption-text strong").text(title || "");
	$captions.find(".caption-text p").text(description || "");
}

// Builds the same album markup the imgur album code uses, so the existing
// thumbnail clicks, captions and arrow-key navigation keep working.
function shineRenderGallery($area, items){
	$area.html('<div class="large-album"></div><div class="album-thumbnails"></div><div class="album-captions"></div>');
	var $thumbs = $area.find(".album-thumbnails");
	for( var i = 0; i < items.length; i++ ){
		var $img = $("<img>").attr({ src: items[i].thumb, "data-image": shineSafeURL(items[i].image) });
		if( items[i].caption ){
			$img.attr("data-title", items[i].caption);
		}
		if( items[i].link ){
			$img.attr("data-description", items[i].link);
		}
		$thumbs.append($img);
	}
	$thumbs.find("img").first().addClass("active-thumb");
	var first = shineSafeURL(items[0].image);
	$area.find(".large-album").css("background-image", "url(" + first + ")");
	if( $.fn.zoom ){
		$area.find(".large-album").zoom({ url: first, on: "click" });
	}
	shineShowCaption($area.find(".album-captions"), items[0].caption, items[0].link);
}

function shineRenderImage($area, url){
	url = shineSafeURL(url);
	$area.html('<div class="large-image"></div>');
	$area.find(".large-image").css("background-image", "url(" + url + ")");
	if( $.fn.zoom ){
		$area.find(".large-image").zoom({ url: url, on: "click" });
	}
}

function shineRenderVideo($area, media){
	$area.html('<div class="large-html5"></div>');
	$area.find(".large-html5").append(shineVideoElement(media));
}

// Element builders. Values go in through jQuery's attr() and css(), never
// pasted into an HTML string, so a quote or bracket in a link can't add
// markup or attributes.
function shineIframe(src, extra){
	return $("<iframe>").attr($.extend({ src: src, frameborder: "0", allow: SHINE_IFRAME_ALLOW, allowfullscreen: "" }, extra || {}));
}

function shineCSSURL(url){
	return 'url("' + shineSafeURL(url) + '")';
}

function shineBackgroundDiv(className, url){
	return $("<div>").addClass(className).css("background-image", shineCSSURL(url));
}

// Silent looping video (Imgur gifv and similar)
function shineLoopVideo(src){
	var $video = $('<video controls preload="auto" autoplay muted loop playsinline></video>');
	$video.append( $("<source>").attr({ src: src, type: "video/mp4" }) );
	return $video;
}

function shineRenderIframe($area, src, wrapperClass, extra){
	var $wrap = $("<div>").addClass(wrapperClass || "large-youtube").append( shineIframe(src, extra) );
	$area.empty().append($wrap);
}

function shineRenderLoopVideo($area, src){
	$area.empty().append( $('<div class="large-html5"></div>').append( shineLoopVideo(src) ) );
}

function shineRenderMessage($area, message, link){
	var $msg = $('<div class="shine-media-message"></div>').text(message);
	if( link && /^https?:\/\//i.test(link) ){
		$msg.append(" ", $('<a target="_blank" rel="noopener noreferrer"></a>').attr("href", link).text("Open link"));
	}
	$area.html("").append($msg);
}

// Show a reddit post's media (video, gallery, gif or image) in $area.
// Calls done(media) afterwards; media is null when there was nothing to show.
function shineRenderRedditMedia($area, fullname, done){
	shineGetMedia(fullname, function(media, post){
		if( media ){
			if( media.type === "gallery" ){
				shineRenderGallery($area, media.items);
			}else if( media.type === "video" ){
				shineRenderVideo($area, media);
			}else{
				shineRenderImage($area, media.url);
			}
		}
		if( done ){
			done(media, post);
		}
	});
}


// Posts whose media should come from reddit's post data rather than the link:
// reddit video, reddit galleries, and gif hosts that no longer exist.
function shineUsesRedditMedia(thing, url){
	var domain = $(thing).find("span.domain a").first().text().toLowerCase();
	url = (url || "").toLowerCase();
	return domain === "v.redd.it" ||
		url.indexOf("v.redd.it/") != -1 ||
		/reddit\.com\/gallery\//.test(url) ||
		url.indexOf("gfycat.com") != -1 ||
		url.indexOf("redgifs.com") != -1 ||
		(domain === "i.redd.it" && !/\.(png|jpe?g|gif|webp|avif)(\?|$)/.test(url));
}

// List view: fill a post's expando with its reddit-hosted media.
function shineShowRedditMediaIn(expand, fullname, url){
	var $area = $(expand).find(".large-area");
	$area.html('<div class="shine-media-message">Loading…</div>');
	$(expand).attr("data-original-type", "reddit");
	$(expand).attr("data-original-data", fullname);
	shineRenderRedditMedia($area, fullname, function(media){
		if( !media ){
			if( /gfycat\.com/i.test(url) ){
				shineRenderMessage($area, "Gfycat shut down in 2023, and reddit has no copy of this one.", url);
			}else{
				shineRenderMessage($area, "This media couldn't be loaded.", url);
			}
		}
		if( media && media.type === "gallery" ){
			$(".active-album").removeClass("active-album");
			$area.find(".large-album").addClass("active-album");
		}
	});
}


// Run fn once the element gets near the viewport (used to fetch sharper
// posters only for cards the reader actually scrolls to).
var shineVisibilityObserver = null;
function shineWhenVisible(el, fn){
	if( !("IntersectionObserver" in window) ){
		fn();
		return;
	}
	if( !shineVisibilityObserver ){
		shineVisibilityObserver = new IntersectionObserver(function(entries){
			entries.forEach(function(entry){
				if( entry.isIntersecting ){
					shineVisibilityObserver.unobserve(entry.target);
					var callback = $(entry.target).data("shine-visible");
					$(entry.target).removeData("shine-visible");
					if( callback ){
						callback();
					}
				}
			});
		}, { rootMargin: "800px 0px" });
	}
	$(el).data("shine-visible", fn);
	shineVisibilityObserver.observe(el);
}

function shineThumbnail(thing){
	var src = $(thing).find("a.thumbnail img").attr("src") || "";
	return src.indexOf("//") === 0 ? "https:" + src : src;
}

// Swap in a sharper poster from the post JSON once the card is near view.
function shineUpgradePoster($preview, fullname){
	shineWhenVisible($preview[0], function(){
		shineGetPost(fullname, function(post){
			var poster = shinePickPreview(post, 480);
			if( poster ){
				$preview.css("background-image", "url(" + shineSafeURL(poster) + ")");
			}
		});
	});
}

// Grid view: swap a card's ".preview-replace" placeholder for a preview of
// its reddit-hosted media (fixes missing v.redd.it / gallery / gif thumbnails).
function shineGridRedditPreview(thing){
	var $thing = $(thing);
	var fullname = $thing.attr("data-fullname");
	var $placeholder = $thing.find(".preview-replace");
	var media = shineMediaFromThing(thing);
	var $preview = $('<div class="preview preview-reddit"></div>').attr("data-fullname", fullname);

	if( media ){
		$preview.css("background-image", "url(" + shineSafeURL(media.poster) + ")");
		$preview.addClass(media.type === "gallery" ? "preview-reddit-gallery" : "preview-reddit-video");
		$placeholder.replaceWith($preview);
		if( media.lowResPoster ){
			shineUpgradePoster($preview, fullname);
		}
		return;
	}

	// Nothing in the listing markup (e.g. a dead gfycat link): show the
	// thumbnail now and check reddit's copy of the media when it's near view.
	var thumb = shineThumbnail(thing);
	if( thumb ){
		$preview.css("background-image", "url(" + shineSafeURL(thumb) + ")");
	}
	$placeholder.replaceWith($preview);
	shineWhenVisible($preview[0], function(){
		shineGetPost(fullname, function(post){
			var postMedia = shineMediaFromPost(post);
			var poster = postMedia && (postMedia.poster || (postMedia.type === "image" ? postMedia.url : ""));
			if( !postMedia ){
				if( !thumb ){
					$preview.remove();
					$thing.addClass("nopreview");
				}
				return;
			}
			if( poster ){
				$preview.css("background-image", "url(" + shineSafeURL(poster) + ")");
			}
			if( postMedia.type === "video" ){
				$preview.addClass("preview-reddit-video");
			}else if( postMedia.type === "gallery" ){
				$preview.addClass("preview-reddit-gallery");
			}
		});
	});
}

// Grid view: a card for an embeddable video (Twitch clip, Streamable, Imgur
// album embed) using reddit's thumbnail, since those services' thumbnail
// URLs changed.
function shineGridEmbedPreview(thing, url, embedOverride){
	var $thing = $(thing).closest(".thing");
	var embed = embedOverride || shineTwitchClipEmbed(url) || shineStreamableEmbed(url);
	var thumb = shineThumbnail($thing);
	var $preview = $('<div class="preview preview-youtube"></div>').attr("data-video", embed);
	if( thumb ){
		$preview.css("background-image", "url(" + shineSafeURL(thumb) + ")");
	}
	$thing.find(".preview-replace").replaceWith($preview);
	shineUpgradePoster($preview, $thing.attr("data-fullname"));
}

// Grid view: open reddit-hosted media in the overlay.
function shineGridOpenRedditMedia(fullname){
	shineGetMedia(fullname, function(media){
		var $expand = $(".shine-expand");
		if( !media ){
			return;
		}
		if( media.type === "video" ){
			$expand.find(".large-html5").empty().append(shineVideoElement(media));
			$("html").addClass("expanding expand-html5s");
		}else if( media.type === "gallery" ){
			var $thumbs = $expand.find(".album-thumbnails").html("");
			for( var i = 0; i < media.items.length; i++ ){
				var $img = $("<img>").attr({ src: media.items[i].thumb, "data-image": shineSafeURL(media.items[i].image) });
				if( media.items[i].caption ){
					$img.attr("data-title", media.items[i].caption);
				}
				if( media.items[i].link ){
					$img.attr("data-description", media.items[i].link);
				}
				$thumbs.append($img);
			}
			$thumbs.find("img").first().addClass("active-thumb");
			var first = shineSafeURL(media.items[0].image);
			$expand.find(".large-album").css("background-image", "url(" + first + ")");
			if( $.fn.zoom ){
				$expand.find(".large-album").zoom({ url: first, on: "click" });
			}
			shineShowCaption($expand.find(".album-captions"), media.items[0].caption, media.items[0].link);
			$("html").addClass("expanding expand-albums");
		}else{
			var url = shineSafeURL(media.url);
			$expand.find(".large-image").css("background-image", "url(" + url + ")");
			if( $.fn.zoom ){
				$expand.find(".large-image").zoom({ url: url, on: "click" });
			}
			$("html").addClass("expanding expand-images");
		}
		$expand.attr("data-original-type", "reddit");
		$expand.attr("data-original-data", fullname);
	});
}


// ---------------------------------------------------------------------------
// Posts added after the page loaded (SHINE's or RES's infinite scrolling,
// uAutoPagerize and similar add-ons) need the same preparation as the first
// page. Watch the listing and hand new posts to the view's callback.

// Posts from a fetched listing page. Parsing in a detached document means the
// page's images, iframes and scripts never load; only the posts are adopted.
function shineThingsFromPage(html){
	var doc = new DOMParser().parseFromString(html, "text/html");
	return $(doc).find("#siteTable > .thing").map(function(){
		return document.adoptNode(this);
	}).get();
}

function shineIsListingThing(el){
	return $(el).is(".thing.link") && !$(el).closest(".shine-expand, .side-comments").length;
}

function shineWatchNewThings(processedClass, callback){
	var content = document.querySelector("body > .content");
	if( !content || !("MutationObserver" in window) ){
		return;
	}
	var pending = false;
	var flush = function(){
		pending = false;
		var siteTable = document.getElementById("siteTable");
		var fresh = $(content).find(".thing.link").not("." + processedClass).filter(function(){
			return shineIsListingThing(this);
		});
		if( !fresh.length ){
			return;
		}
		// some add-ons insert the next page beside the listing; move those
		// posts into it so the list/grid layout applies to them
		if( siteTable ){
			fresh.each(function(){
				if( !$.contains(siteTable, this) ){
					siteTable.appendChild(this);
				}
			});
		}
		callback(fresh);
	};
	new MutationObserver(function(mutations){
		if( pending ){
			return;
		}
		for( var i = 0; i < mutations.length; i++ ){
			var added = mutations[i].addedNodes;
			for( var j = 0; j < added.length; j++ ){
				var node = added[j];
				if( node.nodeType === 1 && ($(node).is(".thing.link") || node.querySelector(".thing.link")) ){
					pending = true;
					setTimeout(flush, 50);
					return;
				}
			}
		}
	}).observe(content, { childList: true, subtree: true });
}


// ---------------------------------------------------------------------------
// Third-party embed URLs for services that changed since SHINE was written.

function shineTwitchClipEmbed(url){
	var m = url.match(/clips\.twitch\.tv\/(?:embed\?clip=)?([\w-]+)/i) || url.match(/twitch\.tv\/[\w-]+\/clip\/([\w-]+)/i);
	if( !m ){
		return "";
	}
	// Twitch embeds refuse to load without the embedding page's hostname
	return "https://clips.twitch.tv/embed?clip=" + encodeURIComponent(m[1]) + "&parent=" + location.hostname + "&autoplay=true";
}

function shineStreamableEmbed(url){
	var m = url.match(/streamable\.com\/(?:[es]\/)?([\w]+)/i);
	return m ? "https://streamable.com/e/" + m[1] + "?autoplay=1" : "";
}

function shineSoundCloudEmbed(url, autoplay){
	return "https://w.soundcloud.com/player/?url=" + encodeURIComponent(url.split("#")[0]) + "&auto_play=" + (autoplay ? "true" : "false") + "&visual=true";
}

// The widget rejects on.soundcloud.com share links, so ask SoundCloud's
// oEmbed service (which resolves them) for the player URL first.
function shineSoundCloudEmbedAsync(url, autoplay, callback){
	var fallback = shineSoundCloudEmbed(url, autoplay);
	fetch("https://soundcloud.com/oembed?format=json&url=" + encodeURIComponent(url.split("#")[0]))
		.then(function(response){
			if( !response.ok ){
				throw new Error("HTTP " + response.status);
			}
			return response.json();
		})
		.then(function(data){
			var src = ((data && data.html) || "").match(/src="([^"]+)"/);
			if( src && src[1].indexOf("https://w.soundcloud.com/player/") === 0 ){
				var player = src[1].replace(/&amp;/g, "&").replace(/&auto_play=(true|false)/, "");
				callback(player + (player.indexOf("?") === -1 ? "?" : "&") + "auto_play=" + (autoplay ? "true" : "false"));
			}else{
				callback(fallback);
			}
		})
		.catch(function(){
			callback(fallback);
		});
}

// Imgur's newer links put a title slug before the ID
// ("imgur.com/gallery/dogs-are-actors-WsjvXFc"). The API and the embed only
// accept the bare ID (the slug form refuses to be framed), and IDs never
// contain hyphens, so keep the last hyphen-separated part.
function shineImgurID(raw){
	var id = String(raw || "").split(/[?#]/)[0].split("/")[0];
	return id.split("-").pop();
}

function shineImgurAlbumEmbed(albumID){
	return "https://imgur.com/a/" + encodeURIComponent(shineImgurID(albumID)) + "/embed?pub=true&context=false";
}

// Vimeo player URL from a vimeo.com link. Handles vimeo.com/ID,
// vimeo.com/ID/HASH (unlisted), channels/NAME/ID, groups/NAME/videos/ID,
// showcase/N/video/ID and player.vimeo.com/video/ID?h=HASH.
// Returns "" when the link isn't a single video (a showcase, a profile).
function shineVimeoEmbed(url){
	var m = String(url || "").match(/^(?:https?:)?\/\/(?:[\w-]+\.)?vimeo\.com\/([^?#]*)(\?[^#]*)?/i);
	if( !m ){
		return "";
	}
	var parts = m[1].split("/").filter(Boolean);
	var notVideo = /^(showcase|album|event|user|ondemand|channels|groups)$/i;
	var id = "", hash = "";
	for( var i = parts.length - 1; i >= 0; i-- ){
		if( /^\d+$/.test(parts[i]) && !(i > 0 && notVideo.test(parts[i - 1])) ){
			id = parts[i];
			if( parts[i + 1] && /^[0-9a-f]{6,}$/i.test(parts[i + 1]) ){
				hash = parts[i + 1];
			}
			break;
		}
	}
	if( !id ){
		return "";
	}
	var h = (m[2] || "").match(/[?&]h=([0-9a-f]+)/i);
	if( h ){
		hash = h[1];
	}
	return "https://player.vimeo.com/video/" + id + "?autoplay=1" + (hash ? "&h=" + hash : "");
}

// Same, but asks Vimeo's oEmbed service when the link can't be read directly
// (custom URLs like vimeo.com/channels/staffpicks/name). Calls back with "" if
// neither works.
function shineVimeoEmbedAsync(url, callback){
	var direct = shineVimeoEmbed(url);
	if( direct ){
		callback(direct);
		return;
	}
	fetch("https://vimeo.com/api/oembed.json?url=" + encodeURIComponent(String(url).split("#")[0]))
		.then(function(response){
			if( !response.ok ){
				throw new Error("HTTP " + response.status);
			}
			return response.json();
		})
		.then(function(data){
			var src = ((data && data.html) || "").match(/src="([^"]+)"/);
			var player = src ? shineVimeoEmbed(src[1].replace(/&amp;/g, "&")) : "";
			if( !player && data && /^\d+$/.test(String(data.video_id)) ){
				player = "https://player.vimeo.com/video/" + data.video_id + "?autoplay=1";
			}
			callback(player);
		})
		.catch(function(){
			callback("");
		});
}

// youtube.com/shorts/ID, /live/ID, /embed/ID, m.youtube.com, youtube-nocookie
function shineYouTubeID(url){
	var m = url.match(/youtube(?:-nocookie)?\.com\/(?:shorts|live|embed|v)\/([\w-]{6,})/i) ||
		url.match(/[?&]v=([\w-]{6,})/i) ||
		url.match(/youtu\.be\/([\w-]{6,})/i);
	return m ? m[1] : "";
}

// start is seconds (getYouTubeTimeStamp's result); anything else becomes 0
function shineYouTubeEmbed(vidID, start){
	return "https://www.youtube.com/embed/" + encodeURIComponent(vidID || "") + "?rel=0&autoplay=1&start=" + (parseInt(start, 10) || 0);
}
