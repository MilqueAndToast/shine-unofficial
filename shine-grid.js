// all the functions at the top


// this gets URL variables
function getUrlVars(url) {
	var vars = [], hash;
	var hashes = url.slice(url.indexOf('?') + 1).split('&');
	for (var i = 0; i < hashes.length; i++) {
		hash = hashes[i].split('=');
		vars.push(hash[0]);
		vars[hash[0]] = hash[1];
	}
	return vars;
}


// this function gets an imgur album image


// this gets our vimeo thumbnail
function getVimeoThumbnail(vidID, target){

	// Vimeo's oEmbed endpoint allows cross-site requests. The old v2 API was
	// called with JSONP, which ran a script from vimeo.com inside reddit's page.
	// vidID is everything after "vimeo.com/" (can be channels/name/12345);
	// oEmbed resolves it and returns the real video ID
	fetch("https://vimeo.com/api/oembed.json?url=" + encodeURIComponent("https://vimeo.com/" + vidID))
		.then(function(response){
			if( !response.ok ){
				throw new Error("HTTP " + response.status);
			}
			return response.json();
		})
		.then(function(data){
			// the oEmbed player URL keeps the hash unlisted videos need
			var src = ((data && data.html) || "").match(/src="([^"]+)"/);
			var player = (src && shineVimeoEmbed(src[1].replace(/&amp;/g, "&"))) || shineVimeoEmbed("https://vimeo.com/" + vidID);
			if( !player && data && /^\d+$/.test(String(data.video_id)) ){
				player = "https://player.vimeo.com/video/" + data.video_id + "?autoplay=1";
			}
			if( !player ){
				throw new Error("not a video");
			}
			var $preview = $("<div class='preview preview-vimeo'></div>").attr("data-video", player);
			if( data && data.thumbnail_url ){
				$preview.css("background-image", "url(" + shineSafeURL(data.thumbnail_url) + ")");
			}
			$(target).find('.preview-replace').replaceWith($preview);
		})
		.catch(function(){
			$(target).find('.preview-replace').remove();
			$(target).addClass("nopreview");
		});

}


// this gets our clips.twitch.tv thumbnail
function getTwitchThumbnail(vidID, target){

	// Twitch's old (Kraken) API is gone; use reddit's thumbnail for the post
	shineGridEmbedPreview( $(target).first(), "https://clips.twitch.tv/" + vidID );

}


// this gets what type of image we're dealing with
function getImageFromServer(path, id, target){
	var xhr = new XMLHttpRequest();
	xhr.path = path;
	xhr.open("GET",path,true);
	xhr.responseType = "arraybuffer";
	xhr.onload = function(e){

		if(this.status == 200){

			var imageType = getImageType(this.response);

			if( imageType == "image/gif" ){


				$(target).find('.preview-replace').replaceWith( shineBackgroundDiv("preview preview-gifv", "//i.imgur.com/" + id + "h.jpg").attr("data-video", "//i.imgur.com/" + id + ".mp4") );


			}else{


				$(target).find('.preview-replace').replaceWith( shineBackgroundDiv("preview preview-image", "//i.imgur.com/" + id + ".png").attr("data-url", "//i.imgur.com/" + id + ".png") );

			}

		}
		else{
			console.log("Problem retrieving image " + JSON.stringify(e))
		}
	}
	xhr.send();
}

function getCommentImageFromServer(path, id, target){
	var xhr = new XMLHttpRequest();
	xhr.path = path;
	xhr.open("GET",path,true);
	xhr.responseType = "arraybuffer";
	xhr.onload = function(e){

		if(this.status == 200){

			var imageType = getImageType(this.response);

			if( imageType == "image/gif" ){

				$(target).addClass("shine-comment comment-html5");

				$(target).attr("data-video", "//i.imgur.com/" + id + ".mp4");

			}else{

				$(target).addClass("shine-comment comment-image");

				$(target).attr("data-image", "//i.imgur.com/" + id + ".png");

			}

		}
		else{
			console.log("Problem retrieving image " + JSON.stringify(e))
		}
	}
	xhr.send();
}

function getImageType(arrayBuffer){
	var type = "";
	var dv = new DataView(arrayBuffer,0,5);
	var nume1 = dv.getUint8(0,true);
	var nume2 = dv.getUint8(1,true);
	var hex = nume1.toString(16) + nume2.toString(16) ;
	switch(hex){
		case "8950":
			type = "image/png";
			break;
		case "4749":
			type = "image/gif";
			break;
		case "424d":
			type = "image/bmp";
			break;
		case "ffd8":
			type = "image/jpeg";
			break;
		default:
			type = null;
			break;
	}
	return type;
}


// this gets the ireddit picture url


// previews a gif as an image
function shineShowGif(target, url){

	// Gfycat's transcoder shut down in 2023, so preview the gif itself
	$(target).find('.preview-replace').replaceWith( shineBackgroundDiv("preview preview-image", url).attr("data-url", url) );

}


function getRedditText(url, content, target){

	$.ajax({
		url:url,
		type:'GET',
		success: function(data){

			// parsed in a detached document, so the fetched page's images and
			// scripts never load; the .md body is reddit's own sanitized markup
			var found = typeof data === "string" ? new DOMParser().parseFromString(data, "text/html").querySelector(content) : null;

			if( found ){

				var $text = $("<div class='preview preview-text'></div>");
				while( found.firstChild ){
					$text[0].appendChild( document.adoptNode(found.firstChild) );
				}
				$(target).find('.preview-replace').replaceWith( $text );

				$(target).find('.preview-text a').attr("target","_blank");

			}else{

				$(target).find('.preview-replace').remove();
				$(target).addClass("nopreview");

			}

		}
	});

}


function getWikiContent(articleURL, target){

	// Wikipedia's page summary API gives the lead image directly and allows
	// cross-site requests. The old code loaded the whole article with JSONP
	// (a script from wikipedia.org inside reddit's page), measured its images
	// while they were hidden, and never found one.
	var match = String(articleURL).match(/\/\/([a-z0-9-]+)\.(?:m\.)?wikipedia\.(?:org|com)\/wiki\/([^?#]+)/i);
	if( !match ){
		$(target).find('.preview-replace').remove();
		$(target).addClass("nopreview");
		return;
	}

	fetch("https://" + match[1] + ".wikipedia.org/api/rest_v1/page/summary/" + match[2])
		.then(function(response){
			if( !response.ok ){
				throw new Error("HTTP " + response.status);
			}
			return response.json();
		})
		.then(function(data){
			var image = data && ((data.originalimage && data.originalimage.source) || (data.thumbnail && data.thumbnail.source));
			if( !image ){
				throw new Error("no image");
			}
			$(target).find('.preview-replace').replaceWith( shineBackgroundDiv("preview preview-wikipedia", image) );
		})
		.catch(function(){
			$(target).find('.preview-replace').remove();
			$(target).addClass("nopreview");
		});

}


// getting the Sound Cloud embed
function getSoundCloudContent(soundCloudURL, target){

	// SoundCloud player URL via oEmbed (resolves on.soundcloud.com share links).
	// No autoplay: the player sits inside the grid card.
	shineSoundCloudEmbedAsync( soundCloudURL, false, function(embed){
		$(target).find('.preview-replace').replaceWith( $("<div class='preview preview-soundcloud'></div>").append( shineIframe(embed, { scrolling: "no" }) ) );
	});

}


function getYouTubeTimeStamp(timeStamp){

	if(timeStamp != undefined){

		timeStamp = timeStamp.replace("s", "");
		timeStamp = timeStamp.replace("S", "");

		// if there are minutes
		if ( timeStamp.toLowerCase().indexOf("m") != -1 ){

			timeStamp = timeStamp.split("m");

			if(timeStamp[1]){
				timeStamp = parseInt((timeStamp[0] * 60)) + parseInt(timeStamp[1]);
			}else{
				timeStamp = parseInt((timeStamp[0] * 60));
			}

		}

	}else{
		timeStamp = "0";
	}

	return timeStamp;

}


// ADDING SHINE HTML TO OUR INTERFACE

$('body').append(''+

	'<div class="shine-expand">'+
		'<div class="large-image"></div>'+
		'<div class="large-youtube"></div>'+
		'<div class="large-html5"></div>'+
		'<div class="large-album"></div>'+
		'<div class="album-thumbnails"></div>'+
		'<div class="album-captions"></div>'+
		'<div class="side-comments"></div>'+
		'<div class="toggle-child-comments">Child Comments</div>'+
	'</div>'

);


// this javascript runs on the SHINE grid interface

function createPreviews(theThings){

	for( i = 0; i < theThings.length; i++ ){


		// setting up variables

		url = shineSafeURL( $(theThings[i]).find('a.title').attr("href") ).replace(".httml","");
		extension = url.substr(url.lastIndexOf('.')+1);

		// figuring out where to place our preview
		whereToPlace = '.entry';
		if( $(theThings[i]).find('.top-matter').length ){
			whereToPlace = '.top-matter';
		}


		// global changes to every card
		if( $(theThings[i]).find('ul.flat-list a.comments').html() != undefined ){

			$(theThings[i]).find('ul.flat-list a.comments').html( $(theThings[i]).find('ul.flat-list a.comments').html().replace(/\D/g,'') );

		}

		$(theThings[i]).find('ul.flat-list a.comments').attr("target","_blank");
		$(theThings[i]).find('a.title').attr("target","_blank");


		// creating previews time


		// REDDIT VIDEO (v.redd.it), REDDIT GALLERIES, AND GIF HOSTS THAT SHUT DOWN
		// previews and playback come from reddit's own post data
		if( shineUsesRedditMedia( theThings[i], url ) ){

			$(theThings[i]).find(whereToPlace).append("<div class='preview preview-replace'></div>");

			shineGridRedditPreview( theThings[i] );

		}

		// IMGUR
		else if( url.toLowerCase().indexOf("imgur.com") != -1 && url.toLowerCase().indexOf("gifsound.com") == -1){

			url = url.split(/[?#]/)[0]; // REMOVES QUERY STRING AND HASH

			if( url.toLowerCase().indexOf("/a/") != -1){

				// album: card with reddit's thumbnail that opens Imgur's embed
				albumID = shineImgurID( url.substr(url.toLowerCase().indexOf("/a/") + 3) );

				$(theThings[i]).find(whereToPlace).append("<div class='preview preview-replace'></div>");

				shineGridEmbedPreview( theThings[i], "", shineImgurAlbumEmbed( albumID ) );

			}else if( url.toLowerCase().indexOf("/r/") != -1 ){

				// we got a subreddit image
				$(theThings[i]).addClass("nopreview");


			}else if( url.toLowerCase().indexOf("/gallery/") != -1 ){

				galleryID = shineImgurID( url.substr(url.toLowerCase().indexOf("/gallery/") + 9) );

				$(theThings[i]).find(whereToPlace).append("<div class='preview preview-replace'></div>");

				shineGridEmbedPreview( theThings[i], "", shineImgurAlbumEmbed( galleryID ) );

			}else if( url.toLowerCase().indexOf(".gifv") != -1 ){

				// we have a gifv
				html5 = url.substr(url.toLowerCase().indexOf("imgur.com/") + 10);
				html5 = html5.substring(0, html5.length - 5);

				$(theThings[i]).find(whereToPlace).append( shineBackgroundDiv("preview preview-gifv", "//i.imgur.com/" + html5 + "h.jpg").attr("data-video", "//i.imgur.com/" + html5 + ".mp4") );

			}else if( url.toLowerCase().indexOf(".gif") != -1 ){

				// we have a gif we're going to turn into a gifv
				html5 = url.substr(url.toLowerCase().indexOf("imgur.com/") + 10);
				html5 = html5.substring(0, html5.length - 4);

				$(theThings[i]).find(whereToPlace).append( shineBackgroundDiv("preview preview-gifv", "//i.imgur.com/" + html5 + "h.jpg").attr("data-video", "//i.imgur.com/" + html5 + ".mp4") );

			}else{


				// now we gotta figure out what kind of image it is before we know what to do with it

				IMGURID = url.substr(url.toLowerCase().indexOf("imgur.com/") + 10);

				if( IMGURID.indexOf(".tiff") != -1 || IMGURID.indexOf(".jpeg") != -1 ){

					IMGURID = IMGURID.substring(0, IMGURID.length - 5);

				}
				else if( IMGURID.indexOf(".png") != -1 || IMGURID.indexOf(".jpg") != -1 || IMGURID.indexOf(".tif") != -1){

					IMGURID = IMGURID.substring(0, IMGURID.length - 4);

				}

				$(theThings[i]).find(whereToPlace).append("<div class='preview preview-replace'></div>");

				getImageFromServer("https://i.imgur.com/" + IMGURID + ".png", IMGURID, ".id-" + $(theThings[i]).attr("data-fullname") );

			}


		}


		// REGULAR OLD GIFS
		else if( url.toLowerCase().indexOf(".gif") != -1 && url.toLowerCase().indexOf(".gifv") == -1 && url.toLowerCase().indexOf("/r/") == -1 ){


			url = url.split(/[?#]/)[0]; // REMOVES QUERY STRING AND HASH

			$(theThings[i]).find(whereToPlace).append("<div class='preview preview-replace'></div>");

			shineShowGif( ".id-" + $(theThings[i]).attr("data-fullname"), url );


		}


		// ANY OTHER PICTURE
		else if( url.toLowerCase().indexOf(".png") != -1 || url.toLowerCase().indexOf(".jpg") != -1 || url.toLowerCase().indexOf(".jpeg") != -1 || url.toLowerCase().indexOf(".tif") != -1 || url.toLowerCase().indexOf(".tiff") != -1){

			// this is any other image

			url = url.split(/[?#]/)[0]; // REMOVES QUERY STRING AND HASH

			$(theThings[i]).find(whereToPlace).append( shineBackgroundDiv("preview preview-image", url).attr("data-url", url) );

		}


		// REDDIT UPLOADS
		else if( url.toLowerCase().indexOf("reddituploads.com") != -1){

			$(theThings[i]).find(whereToPlace).append( shineBackgroundDiv("preview preview-image", url).attr("data-url", url) );

		}


		// LIVEMEME
		else if( url.toLowerCase().indexOf("livememe.com") != -1){

			url = url.split(/[?#]/)[0]; // REMOVES QUERY STRING AND HASH

			liveMemeURL = url;
			if( liveMemeURL.slice(-1) == "/" ){
				liveMemeURL = liveMemeURL.substring(0, liveMemeURL.length - 1);
			}

			$(theThings[i]).find(whereToPlace).append( shineBackgroundDiv("preview preview-image", liveMemeURL + ".jpg").attr("data-url", liveMemeURL) );

		}


		//YOUTUBE
		else if( url.toLowerCase().indexOf("youtube.com") != -1 && url.toLowerCase().indexOf("/r/youtube") == -1 ){

			if( url.toLowerCase().indexOf("attribution") != -1){

				vidID = getUrlVars(url)["u"];
				vidID = decodeURIComponent(vidID);
				vidID = getUrlVars(vidID)["v"];

				timeStamp = getUrlVars(url)["t"];
				timeStamp = getYouTubeTimeStamp(timeStamp);

				$(theThings[i]).find(whereToPlace).append( shineBackgroundDiv("preview preview-youtube", "https://img.youtube.com/vi/" + encodeURIComponent(vidID || "") + "/0.jpg").attr("data-video", shineYouTubeEmbed(vidID, timeStamp)) );


			}
			else{

				vidID = shineYouTubeID(url) || getUrlVars(url)["v"];

				timeStamp = getUrlVars(url)["t"];
				timeStamp = getYouTubeTimeStamp(timeStamp);

				$(theThings[i]).find(whereToPlace).append( shineBackgroundDiv("preview preview-youtube", "https://img.youtube.com/vi/" + encodeURIComponent(vidID || "") + "/0.jpg").attr("data-video", shineYouTubeEmbed(vidID, timeStamp)) );

			}

		}


	//STREAMABLE INTEGRATION BY u/itzblitz94
	else if(url.toLowerCase().indexOf("streamable.com") != -1){
	  url = url.split(/[?#]/)[0]; // REMOVES QUERY STRING AND HASH
	  url = decodeURIComponent(url);
	  shortcode = url.substr(url.toLowerCase().indexOf("streamable.com/") + 15);

	  $(theThings[i]).find(whereToPlace).append("<div class='preview preview-replace'></div>");

	  shineGridEmbedPreview( theThings[i], url );
	}


	//CLIPS.TWITCH.TV INTEGRATION
	else if( shineTwitchClipEmbed( url ) ){

		  $(theThings[i]).find(whereToPlace).append("<div class='preview preview-replace'></div>");

		  shineGridEmbedPreview( theThings[i], url );

	}


	//v.redd.it


		//YOUTUBE SHARE
		else if( url.toLowerCase().indexOf("youtu.be") != -1 ){


			vidID = url.substr(url.toLowerCase().indexOf("youtu.be/") + 9);
			vidID = vidID.split(/[?#]/)[0]; // REMOVES QUERY STRING AND HASH

			timeStamp = getUrlVars(url)["t"];
			timeStamp = getYouTubeTimeStamp(timeStamp);

			$(theThings[i]).find(whereToPlace).append( shineBackgroundDiv("preview preview-youtube", "https://img.youtube.com/vi/" + encodeURIComponent(vidID || "") + "/0.jpg").attr("data-video", shineYouTubeEmbed(vidID, timeStamp)) );


		}


		// VIMEO
		else if( url.toLowerCase().indexOf("vimeo.com") != -1 && url.toLowerCase().indexOf("/r/vimeo") == -1 ){

			url = url.split(/[?#]/)[0]; // REMOVES QUERY STRING AND HASH

			vidID = url.substr(url.toLowerCase().indexOf("vimeo.com/") + 10);

			$(theThings[i]).find(whereToPlace).append("<div class='preview preview-replace'></div>");

			getVimeoThumbnail(vidID,  ".id-" + $(theThings[i]).attr("data-fullname"));

		}


		// i.reddit.com uploads


		//SELF POST POST
		else if( url.toLowerCase().indexOf("/r/") != -1 && url.toLowerCase().indexOf("comments") != -1 && url.toLowerCase().indexOf("reddit.com") == -1 && url.toLowerCase().indexOf("np.reddit") == -1){

			url = url.split(/[?#]/)[0]; // REMOVES QUERY STRING AND HASH

			$(theThings[i]).find(whereToPlace).append("<div class='preview preview-replace'></div>");

			getRedditText(url, ".sitetable.linklisting .usertext-body .md", ".id-" + $(theThings[i]).attr("data-fullname") );

		}


		//REDDIT COMMENT
		else if( url.toLowerCase().indexOf("reddit.com/r/") != -1 && url.toLowerCase().indexOf("comments") != -1 && url.toLowerCase().indexOf("np.reddit") == -1){

			url = url.split(/[?#]/)[0]; // REMOVES QUERY STRING AND HASH

			$(theThings[i]).find(whereToPlace).append("<div class='preview preview-replace'></div>");

			getRedditText(url, ".usertext.border .md", ".id-" + $(theThings[i]).attr("data-fullname") );

		}


		//WIKIPEDIA
		else if( url.toLowerCase().indexOf("wikipedia.com") != -1 || url.toLowerCase().indexOf("wikipedia.org") != -1 ){

			url = url.split(/[?#]/)[0]; // REMOVES QUERY STRING AND HASH


			$(theThings[i]).find(whereToPlace).append("<div class='preview preview-replace'></div>");

			getWikiContent(url, ".id-" + $(theThings[i]).attr("data-fullname"));

		}


		//SOUNDCLOUD
		else if( url.toLowerCase().indexOf("soundcloud.com") != -1 ){

			url = url.split(/[?#]/)[0]; // REMOVES QUERY STRING AND HASH

			$(theThings[i]).find(whereToPlace).append("<div class='preview preview-replace'></div>");

			getSoundCloudContent( url,  ".id-" + $(theThings[i]).attr("data-fullname") );

		}


		// IF NO PREVIEW
		else{

			$(theThings[i]).addClass("nopreview");

		}


		$(theThings[i]).addClass("shined");

	}

	$('html').addClass("shine-ready");

}

createPreviews( $('body > .content #siteTable .thing') );

// posts added later by any add-on (#19); createPreviews marks posts "shined",
// so posts handled by the RES and SHINE loaders below aren't done twice
shineWatchNewThings("shined", function(fresh){
	createPreviews( fresh );
});


// when RES loads new things, run our JS on them

if( $('body').hasClass('res') ){

	window.addEventListener("neverEndingLoad", function() {

		createPreviews( $('body > .content .sitetable.linklisting .thing').not(".shined") );

		setTimeout(function(){
			jQuery('#siteTable > .sitetable.linklisting .thing').first().unwrap();
		}, 1);

	}, false);

}else{


	loading = false;

	//SCROLLING FUNCTIONS
	$(window).scroll(function(){

		if( $(window).scrollTop() + $(window).height() >= $('body').height() - 1000 && loading == false ){

			loading = true;

			lastThing = $('body > .content #siteTable > .thing').last().attr('data-fullname');

			subReddit = window.location.href.split(/[?#]/)[0];

			$.ajax({
			  url: subReddit + "?count=25&after=" + lastThing,
			  cache: false,
			  success: function(data) {

				 window.location.hash = "shiny=" + lastThing;

				 $('body > .content #siteTable').append( shineThingsFromPage(data) );

				 createPreviews( $('body > .content #siteTable .thing').not(".shined") );

				 loading = false;

		  var loadingLimit = $('body').attr('data-grid-limit');
		  //console.log(loadingLimit);
		  if(loadingLimit != 0) {
			if ($('#siteTable').find('.thing').length >= loadingLimit) {
			  $('#siteTable').find('.thing:lt(25)').remove();
			}
		  }

			  },
			  error: function(request, status, message) {
				console.log(message);
			  }
			});

		}

	});


}


var startCheckingComments;


// these are all our actions / click events
function resetInterfaces(){

	clearInterval(startCheckingComments);

	$('html').removeClass("shine-menu");
	$('html').removeClass("expanding");
	$('html').removeClass("expand-images");
	$('html').removeClass("expand-youtubes");
	$('html').removeClass("expand-html5s");
	$('html').removeClass("expand-albums");
	$('html').removeClass("show-search");
	$('html').removeClass("show-submit");
	$('html').removeClass("expand-comments");
	$('html').removeClass("show-shine-bright");
	$('.shine-grid .shine-expand .large-image').html("");
	$('.shine-grid .shine-expand .large-image').css("background-image","");
	$('.shine-grid .shine-expand .large-youtube').html("");
	$('.shine-grid .shine-expand .large-html5').html("");
	$('.shine-grid .shine-expand .large-album').html("");
	$('.shine-grid .shine-expand .album-thumbnails').html("");
	$('.shine-grid .shine-expand .side-comments').html("");
	$('html').removeClass("show-settings");
	$('html').removeClass("shine-hide-children");
	$('.album-captions').html("");

}


function checkSideComments(){

	theSideCommentLinks = $('.side-comments .thing .usertext-body a').not('.shine-comment');

	for( i = 0; i < theSideCommentLinks.length; i++ ){

		$(theSideCommentLinks[i]).attr("target","_blank");

		url = shineSafeURL( $(theSideCommentLinks[i]).attr("href") );

		// it's an imgur link
		if( url.toLowerCase().indexOf("imgur.com") != -1 && url.toLowerCase().indexOf("gifsound.com") == -1 && url.toLowerCase().indexOf("google.com") == -1 ){

			// we have an album
			if( url.toLowerCase().indexOf("/a/") != -1){

				// we got an album
				albumID = url.substr(url.toLowerCase().indexOf("/a/") + 3);
				albumID = shineImgurID( albumID );

				$(theSideCommentLinks[i]).attr("data-video", shineImgurAlbumEmbed( albumID ));

				$(theSideCommentLinks[i]).addClass("shine-comment comment-youtube");

			// we have a gifv
			}else if( url.toLowerCase().indexOf(".gifv") != -1 ){

				// we have a gifv
				html5 = url.substr(url.toLowerCase().indexOf("imgur.com/") + 10);
				html5 = html5.substring(0, html5.length - 5);

				$(theSideCommentLinks[i]).attr("data-video", "//i.imgur.com/" + html5  + ".mp4");

				$(theSideCommentLinks[i]).addClass("shine-comment comment-html5");

			// we have a gif make a gifv
			}else if( url.toLowerCase().indexOf(".gif") != -1 ){

				html5 = url.substr(url.toLowerCase().indexOf("imgur.com/") + 10);
				html5 = html5.substring(0, html5.length - 4);

				$(theSideCommentLinks[i]).attr("data-video", "//i.imgur.com/" + html5  + ".mp4");

				$(theSideCommentLinks[i]).addClass("shine-comment comment-html5");

			// time to find out what kind of image we have
			}else{

				url = url.split(/[?#]/)[0];

				url = decodeURIComponent(url);

				IMGURID = url.substr(url.toLowerCase().indexOf("imgur.com/") + 10);

				if( IMGURID.indexOf(".tiff") != -1 || IMGURID.indexOf(".jpeg") != -1 ){

					IMGURID = IMGURID.substring(0, IMGURID.length - 5);

				}
				else if( IMGURID.indexOf(".png") != -1 || IMGURID.indexOf(".jpg") != -1 || IMGURID.indexOf(".tif") != -1){

					IMGURID = IMGURID.substring(0, IMGURID.length - 4);

				}

				$(theSideCommentLinks[i]).addClass("comment-" + i + "-" + IMGURID);

				getCommentImageFromServer("https://i.imgur.com/" + IMGURID + ".png", IMGURID, ".comment-" + i + "-" + IMGURID );

			}

		}

		// this is a gif we should convert to gifycat
		else if( url.toLowerCase().indexOf(".gif") != -1 && url.toLowerCase().indexOf(".gifv") == -1 && url.toLowerCase().indexOf("/r/") == -1 ){

			// show the gif itself (Gfycat's transcoder shut down in 2023)
			$(theSideCommentLinks[i]).attr("data-image", url);

			$(theSideCommentLinks[i]).addClass("shine-comment comment-image");

		}


		// this is reddit uploads
		else if( url.toLowerCase().indexOf("reddituploads.com") != -1){

			$(theSideCommentLinks[i]).attr("data-image", url);

			$(theSideCommentLinks[i]).addClass("shine-comment comment-image");

		}


		// this is any other photo
		else if( url.toLowerCase().indexOf(".png") != -1 || url.toLowerCase().indexOf(".jpg") != -1 || url.toLowerCase().indexOf(".jpeg") != -1 || url.toLowerCase().indexOf(".tif") != -1 || url.toLowerCase().indexOf(".tiff") != -1){

			$(theSideCommentLinks[i]).attr("data-image", url);

			$(theSideCommentLinks[i]).addClass("shine-comment comment-image");

		}

		// this is youtube
		else if( url.toLowerCase().indexOf("youtube.com") != -1 && url.toLowerCase().indexOf("/r/youtube") == -1 ){

			vidID = "";

			if( url.toLowerCase().indexOf("attribution") != -1){

				vidID = getUrlVars(url)["u"];
				vidID = decodeURIComponent(vidID);
				vidID = getUrlVars(vidID)["v"];

			}
			else{

				vidID = shineYouTubeID(url) || getUrlVars(url)["v"];

			}

			timeStamp = getUrlVars(url)["t"];
			timeStamp = getYouTubeTimeStamp(timeStamp);

			$(theSideCommentLinks[i]).attr("data-video", shineYouTubeEmbed(vidID, timeStamp));

			$(theSideCommentLinks[i]).addClass("shine-comment comment-youtube");

		}


		// this is youtube share
		else if( url.toLowerCase().indexOf("youtu.be") != -1 ){

			vidID = url.substr(url.toLowerCase().indexOf("youtu.be/") + 9);

			timeStamp = getUrlVars(url)["t"];
			timeStamp = getYouTubeTimeStamp(timeStamp);

			$(theSideCommentLinks[i]).attr("data-video", shineYouTubeEmbed(vidID, timeStamp));

			$(theSideCommentLinks[i]).addClass("shine-comment comment-youtube");

		}


		else{

			$(theSideCommentLinks[i]).addClass("shine-comment");

		}

	}

	topLevelComments = $('.side-comments .commentarea > .sitetable > .thing').not(".been-shined");

	for( i = 0; i < topLevelComments.length; i++ ){

	commentNumber = -1;
		$(topLevelComments[i]).addClass("been-shined comment-"+i);

		theChildren = $(topLevelComments[i]).find('.child .sitetable');

		if( theChildren.length > 0 ){

			$(topLevelComments[i]).find("ul.flat-list").first().append("<li class='inline-child-toggle'><a>hide / show child comments</a></li>");

		}

	}

	// stuff to do to all anchor tags
	$('.side-comments a').each(function(){

		$(this).not('.expand').attr("target","_blank");

	});

}


function loadSideComments(target, url){

	$(target).load( url + " div.content", function(){

		$(this).find('.expando').children('*').not('.usertext').remove();
		$(this).find('.expando-button').remove();

		startCheckingComments = setInterval(checkSideComments, 1000);

	});

}

$('body').on('click','.preview-image', function(){

	resetInterfaces();

	$('.shine-expand .large-image').css('background-image', shineCSSURL( $(this).attr("data-url") ));

	$('.shine-expand .large-image').zoom({url: $(this).data("url"), on: 'click'});

	loadSideComments( $('.shine-expand .side-comments'), $(this).parents('.thing').find('a.comments').attr("href") );

	$('html').addClass("expanding expand-images");


  $('.shine-expand').attr("data-original-type", "image");
  $('.shine-expand').attr("data-original-data", $(this).data("url"));


});

$('body').on('click','.preview-youtube', function(){

	resetInterfaces();

	$('.shine-expand .large-youtube').empty().append( shineIframe( $(this).attr("data-video") ) );

	loadSideComments( $('.shine-expand .side-comments'), $(this).parents('.thing').find('a.comments').attr("href") );

	$('html').addClass("expanding expand-youtubes");

  $('.shine-expand').attr("data-original-type", "youtube");
  $('.shine-expand').attr("data-original-data", $(this).data("video"));

});

$('body').on('click','.preview-reddit', function(){

	resetInterfaces();

	loadSideComments( $('.shine-expand .side-comments'), $(this).parents('.thing').find('a.comments').attr("href") );

	shineGridOpenRedditMedia( $(this).attr("data-fullname") );

});


$('body').on('click','.preview-gifv', function(){

	resetInterfaces();

	$('.shine-expand .large-html5').empty().append( shineLoopVideo( $(this).attr("data-video") ) );

	loadSideComments( $('.shine-expand .side-comments'), $(this).parents('.thing').find('a.comments').attr("href") );

	$('html').addClass("expanding expand-html5s");

  $('.shine-expand').attr("data-original-type", "html5");
  $('.shine-expand').attr("data-original-data", $(this).data("video"));

});


$('body').on('click','.preview-vimeo', function(){

	resetInterfaces();

	$('.shine-expand .large-youtube').empty().append( shineIframe( $(this).attr("data-video") ) );

	loadSideComments( $('.shine-expand .side-comments'), $(this).parents('.thing').find('a.comments').attr("href") );

	$('html').addClass("expanding expand-youtubes");

  $('.shine-expand').attr("data-original-type", "youtube");
  $('.shine-expand').attr("data-original-data", $(this).data("video"));

});


$('body').on('click','.album-thumbnails img', function(){

	$('.large-album').css("background-image", shineCSSURL( $(this).attr("data-image") ) );

	$('.shine-expand .large-album').trigger('zoom.destroy');

	$('.shine-expand .large-album').zoom({url: $(this).data("image"), on: 'click'});

	$('.album-thumbnails img').removeClass("active-thumb");

	$(this).addClass("active-thumb");

	$('.album-captions').html("");

	if( $(this).data("title") != null || $(this).data("description") != null ){

		$('.album-captions').html('<div class="show-captions"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="-291 389 20 16" style="enable-background:new -291 389 20 16;" xml:space="preserve"><path d="M-273,389h-16c-1.1,0-2,0.9-2,2v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2v-12C-271,389.9-271.9,389-273,389z M-289,397h4v2h-4V397z M-279,403h-10v-2h10V403z M-273,403h-4v-2h4V403z M-273,399h-10v-2h10V399z"/></svg></div><div class="caption-text"><strong></strong><p></p></div>');

		if( $(this).data("title") != "null" ){
			$('.caption-text strong').text($(this).data("title"));
		}

		if( $(this).data("description") != "null" ){
			$('.caption-text p').text($(this).data("description"));
		}

	}

});

$('body').on('click','.show-captions',function(e){

	$('html').toggleClass("activate-captions");

	e.stopPropagation();

	e.preventDefault();

	return false;

});

$(document).keydown(function(e) {

	if( $('html').hasClass("shine-no-keys") || $(e.target).is("input, textarea, select, [contenteditable], video, audio") ){
		return;
	}

	if( $('html').hasClass("expand-albums") ){

		theThumbs = $('.album-thumbnails img');

		var code = (e.keyCode ? e.keyCode : e.which);
		if (code == 40) {
			//down pressed

			for(i = 0; i < theThumbs.length; i++){

				if( $(theThumbs[i]).hasClass("active-thumb") ){

					if( i == theThumbs.length - 1 ){

						$(theThumbs[0]).click();

					}else{

						$(theThumbs[i+1]).click();

					}

					break;

				}

			}

			$('.album-thumbnails').scrollTop($('.album-thumbnails').scrollTop() + $('.active-thumb').position().top);

		} else if (code == 38) {
			//up pressed

			for(i = 0; i < theThumbs.length; i++){

				if( $(theThumbs[i]).hasClass("active-thumb") ){

					if( i == 0 ){

						$(theThumbs[theThumbs.length - 1]).click();

					}else{

						$(theThumbs[i-1]).click();

					}

					break;

				}

			}

			$('.album-thumbnails').scrollTop($('.album-thumbnails').scrollTop() + $('.active-thumb').position().top);

		}

		e.preventDefault();
		e.stopPropagation();
		return false;

	}

});

$('body').on('click','.preview-text',function(){

	$(this).parents('.thing').addClass("reading");

});


$('body').on('click','.thing.shined a.comments', function(e){

	resetInterfaces();

	loadSideComments( $('.shine-expand .side-comments'), $(this).attr("href") );

	$('html').addClass("expanding expand-comments");

  $('.shine-expand').attr("data-original-type", "comments");
  $('.shine-expand').attr("data-original-data", "comments");

	e.preventDefault();

});


function clearExpandStuff(){

	$('html').removeClass("expand-images");
	$('html').removeClass("expand-youtubes");
	$('html').removeClass("expand-html5s");
	$('html').removeClass("expand-albums");
	$('html').removeClass("expand-comments");
	$('.shine-expand .large-image').html("");
	$('.shine-expand .large-image').css("background-image","");
	$('.shine-expand .large-youtube').html("");
	$('.shine-expand .large-html5').html("");
	$('.shine-expand .large-album').html("");
	$('.shine-expand .album-thumbnails').html("");

}


function replaceExpand(type,data,button){


  jumpTime = false;

  if( $('html').hasClass("expand-comments") ){

	jumpTime = true;

  }


  clearExpandStuff();


  if( type === "comments" ){


	clearExpandStuff();

	$('html').addClass("expand-comments");

	jumpTime = true;


  }else if( type === "image" ){


	$('.shine-expand .large-image').css("background-image", shineCSSURL(data) );

	$('.shine-expand .large-image').zoom({url: data, on: 'click'});

	$('html').addClass("expand-images");


  }else if( type === "youtube"){


	$('.shine-expand .large-youtube').empty().append( shineIframe(data) );

	$('html').addClass("expand-youtubes");


  }else if( type === "html5"){


	$('.shine-expand .large-html5').empty().append( shineLoopVideo(data) );

	$('html').addClass("expand-html5s");


  }else if( type === "reddit"){

	shineGridOpenRedditMedia( data );

  }


  if( jumpTime ){

	container = $('.side-comments');
	  scrollTo = button;

	container.scrollTop(
		scrollTo.offset().top - container.offset().top + container.scrollTop() - 100
	);

  }


  if( !$(button).hasClass("closecommentmedia") ){
	$('.shine-comment').removeClass("closecommentmedia");
	$(button).addClass("closecommentmedia");
  }else{
	$('.shine-comment').removeClass("closecommentmedia");
  }


}


$('html').not('.shinelight').on('click','.comment-image:not(.closecommentmedia)',function(e){

  replaceExpand("image", $(this).data("image"), $(this) );

	e.preventDefault();

});


$('html').not('.shinelight').on('click','.comment-youtube:not(.closecommentmedia)',function(e){

  replaceExpand("youtube", $(this).data("video"), $(this) );

	e.preventDefault();

});


$('html').not('.shinelight').on('click','.comment-html5:not(.closecommentmedia)', function(e){

  replaceExpand("html5", $(this).data("video"), $(this) );

	e.preventDefault();

});


$('html').not('.shinelight').on('click','.closecommentmedia', function(e){

  replaceExpand( $('.shine-expand').attr("data-original-type"), $('.shine-expand').attr("data-original-data"), $(this) );

  e.preventDefault();

});


$('body').on('click','.toggle-child-comments', function(){

	$('html').toggleClass("shine-hide-children");

});

$('body').on('click','.inline-child-toggle', function(){

	if( !$(this).parents('.been-shined').hasClass("show-child-comments") ){

		$(this).parents('.been-shined').addClass("show-child-comments");
		$(this).parents('.been-shined').removeClass("hide-child-comments");

	}else{

		$(this).parents('.been-shined').removeClass("show-child-comments");
		$(this).parents('.been-shined').addClass("hide-child-comments");

	}

});


$(document).on('keyup keydown', function(e){

  if(e.keyCode == "27"){
	resetInterfaces();
  }

});
