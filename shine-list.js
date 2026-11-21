
$('html').addClass("shine-ready");




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


// this gets the ireddit picture url



// shows a gif as an image
function shineShowGif(target, url){

	// Gfycat's transcoder shut down in 2023, so show the gif itself
	shineRenderImage( $(target).find('.large-area'), url );

	$(target).attr("data-original-type", "image");
	$(target).attr("data-original-data", url);

}





// this gets the image type
function getImageFromServer(path, id, target){
    var xhr = new XMLHttpRequest();
    xhr.path = path;
    xhr.open("GET",path,true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function(e){
        
        if(this.status == 200){
            
            var imageType = getImageType(this.response);
			
			if( imageType == "image/gif" ){
      
				// Imgur serves gifs as mp4 too. The old code put the .gif into a
				// <video> tag, which browsers can't play (the "black gif" bug), and
				// checked for the mp4 over http, which https pages block.
				$.ajax({
				    url: 'https://i.imgur.com/' + id + '.mp4',
				    type: 'HEAD',
				    error: function()
				    {
						shineRenderImage( $(target).find('.large-area'), 'https://i.imgur.com/' + id + '.gif' );
						$(target).attr("data-original-type", "image");
						$(target).attr("data-original-data", 'https://i.imgur.com/' + id + '.gif');
				    },
				    success: function ()
				    {
						shineRenderVideo( $(target).find('.large-area'), { mp4: 'https://i.imgur.com/' + id + '.mp4', silent: true } );
						$(target).attr("data-original-type", "html5");
						$(target).attr("data-original-data", 'https://i.imgur.com/' + id + '.mp4');
				    }
				});
				
			}else{

				shineRenderImage( $(target).find('.large-area'), '//i.imgur.com/' + id + '.png' );

				$(target).attr("data-original-type", "image");
				$(target).attr("data-original-data", '//i.imgur.com/' + id + '.png');
				
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




// gets YOUTUBE TIME STAMP
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



// these are all our actions / click events
function resetInterfaces(){

	$('html').removeClass("shine-menu");
	$('html').removeClass("expanding");
	$('html').removeClass("expand-images");
	$('html').removeClass("expand-youtubes");
	$('html').removeClass("expand-html5s");
	$('html').removeClass("expand-albums");
	$('html').removeClass("show-search");
	$('html').removeClass("show-submit");
	$('html').removeClass("expand-comments");
	$('html').removeClass("show-settings");
	$('html').removeClass("shine-hide-children");
	$('html').removeClass("show-shine-bright");

}


// VAriABLE DELCARATION
var startCheckingComments;


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
        
        
        // this is for reddituploads.com
        else if( url.toLowerCase().indexOf("reddituploads.com") != -1 ){

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

			vidID = shineYouTubeID(url);
            
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




// OVERRIDES

$('body').on('click','div.content div#siteTable.linklisting > .thing .arrow', function(e){

	e.stopPropagation();
	e.preventDefault();
	return false;

});

$('body').on('click','div.content div#siteTable.linklisting > .thing a.title', function(e){

	e.preventDefault(); 

});

$('body').on('click','div.content div#siteTable.linklisting > .thing a.thumbnail', function(e){

	window.open( $(this).attr("href") );
	e.stopPropagation();
	return false;

});

$('body').on('click','div.content div#siteTable.linklisting > .thing a.subreddit', function(e){

	e.stopPropagation();

});
 

$('body').on('click','div.content div#siteTable.linklisting > .thing a.comments', function(e){

	e.stopPropagation();
	e.preventDefault();

	checkExists = $("#expand-" + $(this).parents('.thing').data("fullname"));

	if( checkExists.length > 0 ){

		$(checkExists).remove();

		$(this).parents('.thing').removeClass('active-thing');

	}else{

		$('.shine-expand').remove();

		// add expand div
		$(this).parents('.thing').after(''+

			'<div class="shine-expand" id="expand-' + $(this).parents('.thing').data("fullname") + '"><div class="shine-expand-wrapper">'+
				'<div class="large-area"></div>'+
				'<div class="side-comments"></div></div>'+
				'<div class="toggle-child-comments">Child Comments</div>'+
			'</div>'

		);

		theExpand = $("#expand-" + $(this).parents('.thing').data("fullname"));

		$(theExpand).addClass("just-comments");

		// NOW GRAB COMMENTS
		$(theExpand).find('.side-comments').load( $(this).attr("href") + " div.content", function(){
            
            $(this).find('.expando').children('*').not('.usertext').remove();
            $(this).find('.expando-button').remove();

			startCheckingComments = setInterval(checkSideComments, 1000);

		});

		$('html,body').animate({ scrollTop: $(this).parents('.thing').offset().top - 120 }, 'fast');

		$(theExpand).attr("data-original-type", "comments");
		$(theExpand).attr("data-original-data", "comments");

	}

	return false;

});

// MAIN CLICK FUNCTION

$('body').on('click','div.content div#siteTable.linklisting > .thing:not(.shine-prompt, .side-comments .thing)', function(e){

	checkExists = $("#expand-" + $(this).data("fullname"));


	if( checkExists.length > 0 ){

		$(checkExists).remove();

		$(this).removeClass('active-thing');

	}else{

		$('.shine-expand').remove();
		$('.active-thing').removeClass("active-thing");

		$(this).addClass('active-thing');

		dontloadComments = false;

		// add expand div
		$(this).after(''+

			'<div class="shine-expand" id="expand-' + $(this).data("fullname") + '"><div class="shine-expand-wrapper">'+
				'<div class="large-area"></div>'+
				'<div class="side-comments"></div></div>'+
				'<div class="toggle-child-comments">Child Comments</div>'+
			'</div>'

		);

		theLink = $(this);
		theExpand = $("#expand-" + $(this).data("fullname"));

		// time to decide what kind of link this is
		// data-shine-url is set by shineHREF; read the link directly if this post
		// arrived some way SHINE didn't see (#19 showed a blank expando)
		url = $(this).find('a.title').attr("data-shine-url") || shineSafeURL( $(this).find('a.title').attr("href") || "" );

		// REDDIT VIDEO (v.redd.it), REDDIT GALLERIES, AND GIF HOSTS THAT SHUT DOWN
		// these use the media reddit keeps for the post itself
		if( shineUsesRedditMedia( theLink, url ) ){

			shineShowRedditMediaIn( theExpand, $(theLink).data("fullname"), url );

		}

		// IMGUR
		else if( url.toLowerCase().indexOf("imgur.com") != -1 && url.toLowerCase().indexOf("gifsound.com") == -1){

			url = url.split(/[?#]/)[0]; // REMOVES QUERY STRING AND HASH

			if( url.toLowerCase().indexOf("/a/") != -1){

				// album: Imgur's embed (the shared API key was always rate limited)
				albumID = shineImgurID( url.substr(url.toLowerCase().indexOf("/a/") + 3) );

				shineRenderIframe( $(theExpand).find('.large-area'), shineImgurAlbumEmbed( albumID ) );

				$(theExpand).attr("data-original-type", "youtube");
				$(theExpand).attr("data-original-data", shineImgurAlbumEmbed( albumID ));

			}else if( url.toLowerCase().indexOf("/r/") != -1 ){
			
				$(theExpand).addClass("just-comments");

				$(theExpand).attr("data-original-type", "comments");
				$(theExpand).attr("data-original-data", "comments");

			}else if( url.toLowerCase().indexOf("/gallery/") != -1 ){

				// gallery: Imgur's embed handles both albums and single posts
				galleryID = shineImgurID( url.substr(url.toLowerCase().indexOf("/gallery/") + 9) );

				shineRenderIframe( $(theExpand).find('.large-area'), shineImgurAlbumEmbed( galleryID ) );

				$(theExpand).attr("data-original-type", "youtube");
				$(theExpand).attr("data-original-data", shineImgurAlbumEmbed( galleryID ));

			}else if( url.toLowerCase().indexOf(".gifv") != -1 ){

				
				html5 = url.substr(url.toLowerCase().indexOf("imgur.com/") + 10);
				html5 = html5.substring(0, html5.length - 5);

				shineRenderLoopVideo( $(theExpand).find('.large-area'), '//i.imgur.com/' + html5 + '.mp4' );

				$(theExpand).attr("data-original-type", "html5");
				$(theExpand).attr("data-original-data", '//i.imgur.com/' + html5  + '.mp4');

			}else if( url.toLowerCase().indexOf(".gif") != -1 ){	

				html5 = url.substr(url.toLowerCase().indexOf("imgur.com/") + 10);
				html5 = html5.substring(0, html5.length - 4);
  
				$.ajax({
				    url: '//i.imgur.com/' + html5 + '.mp4',
				    type: 'HEAD',
				    error: function()
				    {
						shineShowGif(theExpand, url);
				    },
				    success: function ()
				    {
						shineRenderLoopVideo( $(theExpand).find('.large-area'), '//i.imgur.com/' + html5 + '.mp4' );
				    }
				});

				$(theExpand).attr("data-original-type", "html5");
				$(theExpand).attr("data-original-data", '//i.imgur.com/' + html5  + '.mp4');

			}else{

				url = url.split(/[?#]/)[0];
				url = decodeURIComponent(url);
				IMGURID = url.substr(url.toLowerCase().indexOf("imgur.com/") + 10);

				if( IMGURID.toLowerCase().indexOf(".tiff") != -1 || IMGURID.toLowerCase().indexOf(".jpeg") != -1 ){
					
					IMGURID = IMGURID.substring(0, IMGURID.length - 5);
					
				}
				else if( IMGURID.toLowerCase().indexOf(".png") != -1 || IMGURID.toLowerCase().indexOf(".jpg") != -1 || IMGURID.toLowerCase().indexOf(".tif") != -1){
				
					IMGURID = IMGURID.substring(0, IMGURID.length - 4);
				
				}

				getImageFromServer("https://i.imgur.com/" + IMGURID + ".png", IMGURID, theExpand );


			}

		}

		

		// REGULAR OLD GIFS
		else if( url.toLowerCase().indexOf(".gif") != -1 && url.toLowerCase().indexOf(".gifv") == -1 && url.toLowerCase().indexOf("/r/") == -1 ){

			url = url.split(/[?#]/)[0]; // REMOVES QUERY STRING AND HASH

			shineShowGif( theExpand, url );
			
		}



        
        // REDDIT UPLOADS
		else if( url.toLowerCase().indexOf("reddituploads.com") != -1){

			shineRenderImage( $(theExpand).find('.large-area'), url );

			$(theExpand).attr("data-original-type", "image");
			$(theExpand).attr("data-original-data", url);

		}
        
        
        
        

		// ANY OTHER PICTURE
		else if( url.toLowerCase().indexOf(".png") != -1 || url.toLowerCase().indexOf(".jpg") != -1 || url.toLowerCase().indexOf(".jpeg") != -1 || url.toLowerCase().indexOf(".tif") != -1 || url.toLowerCase().indexOf(".tiff") != -1){

			// this is any other image

			shineRenderImage( $(theExpand).find('.large-area'), url );

			$(theExpand).attr("data-original-type", "image");
			$(theExpand).attr("data-original-data", url);

		}




		// LIVEMEME
		else if( url.toLowerCase().indexOf("livememe.com") != -1){

			url = url.split(/[?#]/)[0]; // REMOVES QUERY STRING AND HASH

			liveMemeURL = url;
			if( liveMemeURL.slice(-1) == "/" ){
				liveMemeURL = liveMemeURL.substring(0, liveMemeURL.length - 1);
			}

			shineRenderImage( $(theExpand).find('.large-area'), liveMemeURL );

			$(theExpand).attr("data-original-type", "image");
			$(theExpand).attr("data-original-data", liveMemeURL);

		}




		//YOUTUBE
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

            embedURL = shineYouTubeEmbed(vidID, timeStamp);

            shineRenderIframe( $(theExpand).find(".large-area"), embedURL );

            $(theExpand).attr("data-original-type", "youtube");
			$(theExpand).attr("data-original-data", embedURL);

		}


		//STREAMABLE INTEGRATION BY u/itzblitz94
		else if( url.toLowerCase().indexOf("streamable.com") != -1 ){
      		embedURL = shineStreamableEmbed( url );

      		shineRenderIframe( $(theExpand).find(".large-area"), embedURL );

      		$(theExpand).attr("data-original-type", "youtube");
			$(theExpand).attr("data-original-data", embedURL);
		}


		//TWITCH CLIPS (clips.twitch.tv/slug and twitch.tv/channel/clip/slug)
		else if( shineTwitchClipEmbed( url ) ){
      		embedURL = shineTwitchClipEmbed( url );

      		shineRenderIframe( $(theExpand).find(".large-area"), embedURL );

      		$(theExpand).attr("data-original-type", "youtube");
			$(theExpand).attr("data-original-data", embedURL);
		}


		////////////////////////////
		//NSFW INTEGRATIONS
		////////////////////////////

		//PORNHUB.COM INTEGRATION
		else if( url.toLowerCase().indexOf("pornhub.com") != -1 ){
      		vidID = url.substr(url.toLowerCase().indexOf("?viewkey=") + 9).split(/[&#]/)[0];
      		embedURL = '//www.pornhub.com/embed/' + encodeURIComponent(vidID);

      		shineRenderIframe( $(theExpand).find(".large-area"), embedURL, "", { scrolling: "no" } );

      		$(theExpand).attr("data-original-type", "pornhub");
			$(theExpand).attr("data-original-data", embedURL);
		}

		//XHAMSTER.COM INTEGRATION
		else if( url.toLowerCase().indexOf("xhamster.com") != -1 ){
      		vidID = url.substr(url.toLowerCase().lastIndexOf("-") + 1).split(/[?#\/]/)[0];
      		embedURL = '//xhamster.com/xembed.php?video=' + encodeURIComponent(vidID);

      		shineRenderIframe( $(theExpand).find(".large-area"), embedURL, "", { scrolling: "no" } );

      		$(theExpand).attr("data-original-type", "xhamster");
			$(theExpand).attr("data-original-data", embedURL);
		}

		//XVIDEOS.COM INTEGRATION
		else if( url.toLowerCase().indexOf("xvideos.com") != -1 ){
      		vidID = url.substr(url.toLowerCase().indexOf("/video") + 6);
      		vidID = vidID.substr('-'+vidID.length,vidID.indexOf("/") + 1);

      		embedURL = '//flashservice.xvideos.com/embedframe/' + encodeURIComponent(vidID);

      		shineRenderIframe( $(theExpand).find(".large-area"), embedURL, "", { scrolling: "no" } );

      		$(theExpand).attr("data-original-type", "xvideos");
			$(theExpand).attr("data-original-data", embedURL);
		}



		//YOUTUBE SHARE
		else if( url.toLowerCase().indexOf("youtu.be") != -1 ){

			vidID = shineYouTubeID(url);

            timeStamp = getUrlVars(url)["t"];
            timeStamp = getYouTubeTimeStamp(timeStamp);

            embedURL = shineYouTubeEmbed(vidID, timeStamp);

			shineRenderIframe( $(theExpand).find(".large-area"), embedURL );

			$(theExpand).attr("data-original-type", "youtube");
			$(theExpand).attr("data-original-data", embedURL);
			

		}






		// VIMEO
		else if( url.toLowerCase().indexOf("vimeo.com") != -1 && url.toLowerCase().indexOf("/r/vimeo") == -1 ){

			// channels/NAME/ID, unlisted ID/HASH and custom URLs used to be
			// passed to the player as-is and didn't play
			$(theExpand).find('.large-area').html('<div class="shine-media-message">Loading…</div>');

			(function(expand, link){
				shineVimeoEmbedAsync( link, function(vimeoEmbed){
					if( !vimeoEmbed ){
						shineRenderMessage( $(expand).find('.large-area'), "This Vimeo link isn't a single video.", link );
						return;
					}
					shineRenderIframe( $(expand).find('.large-area'), vimeoEmbed );
					$(expand).attr("data-original-type", "youtube");
					$(expand).attr("data-original-data", vimeoEmbed);
				});
			})(theExpand, url);

		}





		//SOUNDCLOUD
        else if( url.toLowerCase().indexOf("soundcloud.com") != -1 ){


	        // SoundCloud player URL via oEmbed (the old resolve API needed a client
	        // ID that no longer works, and the widget rejects on.soundcloud.com links)
	        $(theExpand).find('.large-area').html('<div class="shine-media-message">Loading…</div>');

	        (function(expand){
		        shineSoundCloudEmbedAsync( url, true, function(soundCloudEmbed){
			        shineRenderIframe( $(expand).find('.large-area'), soundCloudEmbed, "large-soundcloud", { scrolling: "no" } );
			        $(expand).attr("data-original-type", "youtube");
			        $(expand).attr("data-original-data", soundCloudEmbed);
		        });
	        })(theExpand);

            
        }



        // (gfycat, v.redd.it and i.redd.it are handled at the top by shineUsesRedditMedia)
        
        


		//REDDIT COMMENT
        else if( url.toLowerCase().indexOf("reddit.com/r/") != -1 && url.toLowerCase().indexOf("comments") != -1 && url.toLowerCase().indexOf("np.reddit") == -1){

	        url = url.split(/[?#]/)[0]; // REMOVES QUERY STRING AND HASH

	        $(theExpand).addClass("just-comments");

	        $.ajax({
				url:url,
				type:'GET',
				success: function(data){

					theContent = $(data).find(".commentarea");

					$(theExpand).find('.side-comments').html( theContent );
				
				}
			});

	        dontloadComments = true;

	        $(theExpand).attr("data-original-type", "comments");
			$(theExpand).attr("data-original-data", "comments");
            
		}



/*
		//REDDIT WIKI
        else if( url.toLowerCase().indexOf("reddit.com/r/") != -1 && url.toLowerCase().indexOf("/wiki/index/") != -1){

	        url = url.split(/[?#]/)[0]; // REMOVES QUERY STRING AND HASH


	        $.ajax({
				url:url,
				type:'GET',
				success: function(data){

					theContent = $(data).find(".wiki-page-content");

					$(theExpand).find('.large-area').html( theContent );
				
				}
			});

	        $(theExpand).attr("data-original-type", "comments");
			$(theExpand).attr("data-original-data", "comments");
            
		}
*/


		//SELF POST POST
		else if( url.toLowerCase().indexOf("/r/") != -1 && url.toLowerCase().indexOf("comments") != -1 && url.toLowerCase().indexOf("reddit.com") == -1 && url.toLowerCase().indexOf("np.reddit") == -1){


			$(theExpand).addClass("just-comments");

			$(theExpand).attr("data-original-type", "comments");
			$(theExpand).attr("data-original-data", "comments");
            
		}

		else{

			$(theExpand).addClass("just-comments");

			$(theExpand).attr("data-original-type", "comments");
			$(theExpand).attr("data-original-data", "comments");

		}


		if( dontloadComments == false ){

			// NOW GRAB COMMENTS
			$(theExpand).find('.side-comments').load( $(theLink).find("a.comments").attr("href") + " div.content", function(){
                
                $(this).find('.expando').children('*').not('.usertext').remove();
                $(this).find('.expando-button').remove();

				startCheckingComments = setInterval(checkSideComments, 1000);

			});

		}




		$('html,body').animate({ scrollTop: $(this).offset().top - 120 }, 'fast');

		

	}

});

$('body').on('click','.thing.link > .child', function(e){

	window.open( $(this).parents('.thing').find('a.title').attr("href") );

	e.stopPropagation();
	e.preventDefault();
	return false;

});




$('body').on('click','div.content div#siteTable .thing ul.flat-list', function(e){

	e.stopPropagation();

});

$('body').on('click','div#siteTable .thing form.hide-button a', function(e){
    
    $('#expand-' + $(this).parents('.thing').data("fullname") ).remove();

});

$('body').on('click','.album-thumbnails img', function(){

	$(this).parents('.shine-expand').find('.large-album').css("background-image", shineCSSURL( $(this).attr("data-image") ) );

	$(this).parents('.shine-expand').find('.large-album').trigger('zoom.destroy');

    $(this).parents('.shine-expand').find('.large-album').zoom({url: $(this).data("image"), on: 'click'});

    $(this).parents('.album-thumbnails').find('img').removeClass("active-thumb");

    $(this).addClass("active-thumb");

    $(this).parents('.shine-expand').find('.album-captions').html("");

    if( $(this).data("title") != null || $(this).data("description") != null ){

  		$(this).parents('.shine-expand').find('.album-captions').html('<div class="show-captions"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="-291 389 20 16" style="enable-background:new -291 389 20 16;" xml:space="preserve"><path d="M-273,389h-16c-1.1,0-2,0.9-2,2v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2v-12C-271,389.9-271.9,389-273,389z M-289,397h4v2h-4V397z M-279,403h-10v-2h10V403z M-273,403h-4v-2h4V403z M-273,399h-10v-2h10V399z"/></svg></div><div class="caption-text"><strong></strong><p></p></div>');

  		if( $(this).data("title") != "null" ){
  			$(this).parents('.shine-expand').find('.caption-text strong').text($(this).data("title"));
  		}

  		if( $(this).data("description") != "null" ){
  			$(this).parents('.shine-expand').find('.caption-text p').text($(this).data("description"));	
  		}

  	}

});

$('body').on('click','.show-captions',function(e){

	$(this).parents(".shine-expand").toggleClass("activate-captions");

	e.stopPropagation();

	e.preventDefault();

	return false;

});

$('body').on('click','.large-area', function(){

	$('.active-album').removeClass("active-album");
	$(this).find('.large-album').addClass("active-album");

});

$(document).keydown(function(e) {

	if( $('html').hasClass("shine-no-keys") || $(e.target).is("input, textarea, select, [contenteditable], video, audio") ){
		return;
	}

    if( $('.active-album').length != -1 ){

    	theThumbs = $('.active-album').parents('.large-area').find('.album-thumbnails img');

	    var code = (e.keyCode ? e.keyCode : e.which);
	    if (code == 40) {
	        //down pressed

	        for(i = 0; i < theThumbs.length; i++){

	        	if( $(theThumbs[i]).hasClass("active-thumb") ){

	        		if( i == theThumbs.length - 1 ){

	        			// do nothing 

	        			$('.active-album').removeClass("active-album");

	        		}else{

						$(theThumbs[i+1]).click();

						$('.active-album').parents('.large-area').find('.album-thumbnails').scrollTop($('.active-album').parents('.large-area').find('.album-thumbnails').scrollTop() + $('.active-album').parents('.large-area').find('.active-thumb').position().top);

						e.preventDefault();
					    e.stopPropagation();
					    return false;

	        		}

	        		break;

	        	}

	        }

	        

	    } else if (code == 38) {
	        //up pressed
	        
	        for(i = 0; i < theThumbs.length; i++){

	        	if( $(theThumbs[i]).hasClass("active-thumb") ){

	        		if( i == 0 ){

	        			// do nothing

	        			$('.active-album').removeClass("active-album");

	        		}else{

						$(theThumbs[i-1]).click();

						$('.active-album').parents('.large-area').find('.album-thumbnails').scrollTop($('.active-album').parents('.large-area').find('.album-thumbnails').scrollTop() + $('.active-album').parents('.large-area').find('.active-thumb').position().top);

						e.preventDefault();
					    e.stopPropagation();
					    return false;

	        		}

	        		break;

	        	}

	        }

	    }

	    

	}

});

$('body').on('click','.toggle-child-comments', function(){

	$(this).parents(".shine-expand").toggleClass("shine-hide-children");

});








function replaceExpand(type,data,button){



  if( type === "comments" ){


  	$(button).parents(".shine-expand").find(".large-area").html("");
  	$(button).parents(".shine-expand").addClass("just-comments");

  	container = $(button).parents(".shine-expand").find('.side-comments');
	scrollTo = $(button);

	container.scrollTop(
	    scrollTo.offset().top - container.offset().top + container.scrollTop() - 100
	);


  }else if( type === "image" ){



    shineRenderImage( $(button).parents(".shine-expand").find(".large-area"), data );




  }else if( type === "youtube"){




    shineRenderIframe( $(button).parents(".shine-expand").find(".large-area"), data );




  }else if( type === "html5"){




    shineRenderLoopVideo( $(button).parents(".shine-expand").find(".large-area"), data );




  }else if( type === "reddit"){

    shineShowRedditMediaIn( $(button).parents(".shine-expand"), data, "" );

  }


  if( !$(button).hasClass("closecommentmedia") ){
    $('.shine-comment').removeClass("closecommentmedia");
    $(button).addClass("closecommentmedia");
  }else{
    $('.shine-comment').removeClass("closecommentmedia");
  }

}


// Comment media opens in the post's media area. Posts that only show comments
// (text and link posts) hide that area, so show it and keep the clicked link
// in view. This used to be a separate handler that never ran, because the
// handlers below mark the link before that handler's selector was checked.
function shineShowCommentMediaArea(link){

	var expand = $(link).parents(".shine-expand");

	if( expand.hasClass("just-comments") ){

		expand.removeClass("just-comments");

		var container = expand.find('.side-comments');

		container.scrollTop(
		    $(link).offset().top - container.offset().top + container.scrollTop() - 100
		);

	}

}

$('html').on('click','.comment-image:not(.closecommentmedia)', function(e){

	shineShowCommentMediaArea( this );
	replaceExpand("image", $(this).data("image"), $(this) );
	e.preventDefault();

});

$('html').on('click','.comment-youtube:not(.closecommentmedia)', function(e){

	shineShowCommentMediaArea( this );
	replaceExpand("youtube", $(this).data("video"), $(this) );
	e.preventDefault();

});

$('html').on('click','.comment-html5:not(.closecommentmedia)', function(e){

	shineShowCommentMediaArea( this );
	replaceExpand("html5", $(this).data("video"), $(this) );
	e.preventDefault();

});









$('html').not('.shinelight').on('click','.closecommentmedia', function(e){

  replaceExpand( $(this).parents('.shine-expand').attr("data-original-type"), $(this).parents('.shine-expand').attr("data-original-data"), $(this) );

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








$('body').on('focus','input, textarea', function(){
	$('html').addClass("disable-shift");
});

$('body').on('blur','input, textarea', function(){
	$('html').removeClass("disable-shift");
});

// RES Keyboard Navigation and closing posts
$(document).on('keyup keydown', function(e){
	
	if(e.shiftKey && !$('html').hasClass("disable-shift") && !$('html').hasClass("shine-no-keys") && !$(e.target).is("input, textarea, select, [contenteditable]")){
		$('.RES-keyNav-activeElement').parents('.thing').click();
	}

	if(e.keyCode == "27"){
		$('.shine-expand').remove();
		$('.thing.active-thing').removeClass("active-thing");
	}

});



function shineHREF(n){

	theShinedThings = $('body > .content .thing.link').not(".shined-thing").filter(function(){
		return shineIsListingThing(this);
	});

	// continue numbering after the posts already prepared
	if( n === undefined ){
		n = $('body > .content .thing.shined-thing').filter(function(){ return shineIsListingThing(this); }).length || undefined;
	}

	for( i =  0; i < theShinedThings.length; i++){

		$(theShinedThings[i]).find('a.title').attr("data-shine-url", shineSafeURL( $(theShinedThings[i]).find('a.title').attr("href") ));

		$(theShinedThings[i]).addClass("shined-thing");
		if( !$('body').hasClass('res') ){
			var b = ((!n) ? 1 + +i : 1 + +i + +n);
			$(theShinedThings[i]).find('.rank').html(b);
		}

	}

	var loadingLimit = $('body').attr('data-list-limit');
	//console.log(loadingLimit);
	if(loadingLimit != 0) {
		if ($('#siteTable').find('.thing').length >= loadingLimit) {
			$('#siteTable').find('.thing:lt(25)').remove();
		}
	}

}

shineHREF();

// posts added later by any add-on (#19); RES and SHINE's own loader are
// handled below as well, and shineHREF skips posts it already prepared
shineWatchNewThings("shined-thing", function(){
	shineHREF();
});


// when RES loads new things, run our JS on them

if( $('body').hasClass('res') ){

	window.addEventListener("neverEndingLoad", function() {

		shineHREF();

		setTimeout(function(){
			jQuery('#siteTable > .sitetable.linklisting .thing').first().unwrap();
		}, 1);

	}, false);
 
}else{


	loading = false;

	//SCROLLING FUNCTIONS
    $(window).scroll(function(){

		$('body').find('.thing.recommended-link').remove();

        if( $(window).scrollTop() + $(window).height() >= $('body').height() - 1000 && loading == false ){

            loading = true;

            lastThing = $('body > .content #siteTable > .thing').last().attr('data-fullname');
            lastNumber = $('body > .content #siteTable > .thing').last().find('.rank').text();

            subReddit = window.location.href.split(/[?#]/)[0];

        	$.ajax({
		      url: subReddit + "?count=25&after=" + lastThing,
		      cache: false,
		      success: function(data) { 

			     window.location.hash = "shiny=" + lastThing;

			     $('body > .content #siteTable').append( shineThingsFromPage(data) );

			     loading = false;

				 shineHREF(lastNumber);
			      
			  },
		      error: function(request, status, message) { 
		      	console.log(message); 
		      }
		    });	

        }
        
    });


}

/*
$(document).ready(function(){
});
*/