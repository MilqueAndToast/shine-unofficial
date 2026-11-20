
$('html').addClass("shine-ready");


// imgur authorization
function setHeader(xhr) {
    xhr.setRequestHeader('Authorization', 'Client-ID 4120f4b7ddae1ea');
}

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

				$(target).find('.large-area').html('<div class="large-image" style="background-image:url(//i.imgur.com/' + id + '.png);"></div>');

				$(target).find('.large-image').zoom({url: '//i.imgur.com/' + id + '.png' , on: 'click'});

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

				$(theSideCommentLinks[i]).attr("data-album", "https://api.imgur.com/3/album/" + albumID + "/images");

				$(theSideCommentLinks[i]).addClass("shine-comment comment-album");

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

			$(theSideCommentLinks[i]).attr("data-video", "//www.youtube.com/embed/" + vidID + "?rel=0&autoplay=1&vq=hd1080&wmode=transparent&start=" + timeStamp);

			$(theSideCommentLinks[i]).addClass("shine-comment comment-youtube");

		}


		// this is youtube share
		else if( url.toLowerCase().indexOf("youtu.be") != -1 ){

			vidID = url.substr(url.toLowerCase().indexOf("youtu.be/") + 9);
            
            timeStamp = getUrlVars(url)["t"];
            timeStamp = getYouTubeTimeStamp(timeStamp);

            $(theSideCommentLinks[i]).attr("data-video", "//www.youtube.com/embed/" + vidID + "?rel=0&autoplay=1&vq=hd1080&wmode=transparent&start=" + timeStamp);

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
		url = $(this).find('a.title').attr("data-shine-url");

		// REDDIT VIDEO (v.redd.it), REDDIT GALLERIES, AND GIF HOSTS THAT SHUT DOWN
		// these use the media reddit keeps for the post itself
		if( shineUsesRedditMedia( theLink, url ) ){

			shineShowRedditMediaIn( theExpand, $(theLink).data("fullname"), url );

		}

		// IMGUR
		else if( url.toLowerCase().indexOf("imgur.com") != -1 && url.toLowerCase().indexOf("gifsound.com") == -1){

			url = url.split(/[?#]/)[0]; // REMOVES QUERY STRING AND HASH

			if( url.toLowerCase().indexOf("/a/") != -1){


				// we got an album
				albumID = url.substr(url.toLowerCase().indexOf("/a/") + 3);	
				albumID = shineImgurID( albumID );

				$.ajax({
			      url: "https://api.imgur.com/3/album/" + albumID + "/images",
			      type: 'GET',
			      dataType: 'json',
			      success: function(data) { 


				      	$(theExpand).find('.large-area').html('<div class="large-album"></div><div class="album-thumbnails"></div><div class="album-captions"></div>');

				      	$('.active-album').removeClass("active-album");
						$(theExpand).find(".large-album").addClass("active-album");

				      	for( i = 0; i < data.data.length; i++ ){

				      		captionTitle = data.data[i].title;
				      		captionDescription = data.data[i].description;

				      		if( captionTitle != null){
				      			captionTitle = captionTitle.replace('"',"'");
				      		}

				      		if( captionDescription != null){
				      			captionDescription = captionDescription.replace('"',"'");
      						}

      						$(theExpand).find('.album-thumbnails').append('<img data-title="' + shineEscapeHTML(captionTitle) + '" data-description="' + shineEscapeHTML(captionDescription) + '" data-image="' + data.data[i].link + '" src="//i.imgur.com/' + data.data[i].id + 't.jpg" />');

				      	}

				      	$(theExpand).find('.album-thumbnails').find("img").first().addClass("active-thumb");

				      	$(theExpand).find('.large-album').css("background-image", "url(" + data.data[0].link + ")" );

				      	$(theExpand).find('.large-album').zoom({url: data.data[0].link, on: 'click'});

				      	if( data.data[0].title != null || data.data[0].description != null ){

				      		$(theExpand).find('.album-captions').html('<div class="show-captions"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="-291 389 20 16" style="enable-background:new -291 389 20 16;" xml:space="preserve"><path d="M-273,389h-16c-1.1,0-2,0.9-2,2v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2v-12C-271,389.9-271.9,389-273,389z M-289,397h4v2h-4V397z M-279,403h-10v-2h10V403z M-273,403h-4v-2h4V403z M-273,399h-10v-2h10V399z"/></svg></div><div class="caption-text"><strong></strong><p></p></div>');

				      		if( data.data[0].title != null ){
				      			$(theExpand).find('.caption-text strong').text(data.data[0].title);
				      		}

				      		if( data.data[0].description != null ){
				      			$(theExpand).find('.caption-text p').text(data.data[0].description);	
				      		}

				      	}

				      	$(theExpand).attr("data-original-type", "album");
				      	$(theExpand).attr("data-original-data", "https://api.imgur.com/3/album/" + albumID + "/images");

			      },
			      error: function(request, status, message) {
			      	// the shared Imgur API key is often rate limited; fall back to Imgur's own embed
			      	shineRenderIframe( $(theExpand).find('.large-area'), shineImgurAlbumEmbed( albumID ) );
			      	$(theExpand).attr("data-original-type", "youtube");
			      	$(theExpand).attr("data-original-data", shineImgurAlbumEmbed( albumID ));
			      },
			      beforeSend: setHeader
			    });


			}else if( url.toLowerCase().indexOf("/r/") != -1 ){
			
				$(theExpand).addClass("just-comments");

				$(theExpand).attr("data-original-type", "comments");
				$(theExpand).attr("data-original-data", "comments");

			}else if( url.toLowerCase().indexOf("/gallery/") != -1 ){
                
                
                
                
                
                
                
                // this is a gallery
                galleryID = url.substr(url.toLowerCase().indexOf("/gallery/") + 9);	
				galleryID = shineImgurID( galleryID );
                
                $.ajax({
			      url: "https://api.imgur.com/3/gallery/album/" + galleryID,
			      type: 'GET',
			      dataType: 'json',
			      success: function(data) { 
                      
                      
                      
                      albumID = data.data.id;
                      //ALBUM CODE
                      
                      if( data.data.images.length > 1 ){
                          
                          $.ajax({
                              url: "https://api.imgur.com/3/album/" + albumID + "/images",
                              type: 'GET',
                              dataType: 'json',
                              success: function(data) { 
                                  


                                    $(theExpand).find('.large-area').html('<div class="large-album"></div><div class="album-thumbnails"></div><div class="album-captions"></div>');

                                    $('.active-album').removeClass("active-album");
                                    $(theExpand).find(".large-album").addClass("active-album");

                                    for( i = 0; i < data.data.length; i++ ){

                                        captionTitle = data.data[i].title;
                                        captionDescription = data.data[i].description;

                                        if( captionTitle != null){
                                            captionTitle = captionTitle.replace('"',"'");
                                        }

                                        if( captionDescription != null){
                                            captionDescription = captionDescription.replace('"',"'");
                                        }

                                        $(theExpand).find('.album-thumbnails').append('<img data-title="' + shineEscapeHTML(captionTitle) + '" data-description="' + shineEscapeHTML(captionDescription) + '" data-image="' + data.data[i].link + '" src="//i.imgur.com/' + data.data[i].id + 't.jpg" />');

                                    }

                                    $(theExpand).find('.album-thumbnails').find("img").first().addClass("active-thumb");

                                    $(theExpand).find('.large-album').css("background-image", "url(" + data.data[0].link + ")" );

                                    $(theExpand).find('.large-album').zoom({url: data.data[0].link, on: 'click'});

                                    if( data.data[0].title != null || data.data[0].description != null ){

                                        $(theExpand).find('.album-captions').html('<div class="show-captions"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="-291 389 20 16" style="enable-background:new -291 389 20 16;" xml:space="preserve"><path d="M-273,389h-16c-1.1,0-2,0.9-2,2v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2v-12C-271,389.9-271.9,389-273,389z M-289,397h4v2h-4V397z M-279,403h-10v-2h10V403z M-273,403h-4v-2h4V403z M-273,399h-10v-2h10V399z"/></svg></div><div class="caption-text"><strong></strong><p></p></div>');

                                        if( data.data[0].title != null ){
                                            $(theExpand).find('.caption-text strong').text(data.data[0].title);
                                        }

                                        if( data.data[0].description != null ){
                                            $(theExpand).find('.caption-text p').text(data.data[0].description);	
                                        }

                                    }

                                    $(theExpand).attr("data-original-type", "album");
                                    $(theExpand).attr("data-original-data", "https://api.imgur.com/3/album/" + albumID + "/images");

                              },
                              error: function(request, status, message) { 
                                console.log(message); 
                              },
                              beforeSend: setHeader
                            });
                          
                          

                      }else{

                            getImageFromServer( data.data.images[0].link , data.data.images[0].id , theExpand); 

                      }
                      
                      // END ALBUM CODE
                      
                      
                      
                  },
			      error: function(request, status, message) { 
			      	// shared Imgur API key rate limited: use Imgur's own embed
			      	shineRenderIframe( $(theExpand).find('.large-area'), shineImgurAlbumEmbed( galleryID ) );
			      },
			      beforeSend: setHeader
			    });

				
	
			}else if( url.toLowerCase().indexOf(".gifv") != -1 ){

				
				html5 = url.substr(url.toLowerCase().indexOf("imgur.com/") + 10);
				html5 = html5.substring(0, html5.length - 5);

				$(theExpand).find('.large-area').html('<div class="large-html5"><video  controls preload="auto" autoplay="autoplay" muted="muted" loop="loop" webkit-playsinline ><source src="//i.imgur.com/' + html5  + '.mp4" /></video></div>');

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
				    	console.log('URL:'+url);
				    	console.log('HTML5:'+html5);
						shineShowGif(theExpand, url);
				    },
				    success: function ()
				    {
						$(theExpand).find('.large-area').html('<div class="large-html5"><video controls preload="auto" autoplay="autoplay" muted="muted" loop="loop" webkit-playsinline ><source src="//i.imgur.com/' + html5 + '.mp4" /></video></div>');
				    }
				});

				//$(theExpand).find('.large-area').html('<div class="large-html5"><video controls preload="auto" autoplay="autoplay" muted="muted" loop="loop" webkit-playsinline ><source src="//i.imgur.com/' + html5  + '.mp4" /></video></div>');

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
			
			$(theExpand).find('.large-area').html('<div class="large-image" style="background-image:url(' + url + ');"></div>');

			$(theExpand).find('.large-image').zoom({url: url, on: 'click'});

			$(theExpand).attr("data-original-type", "image");
			$(theExpand).attr("data-original-data", url);

		}
        
        
        
        

		// ANY OTHER PICTURE
		else if( url.toLowerCase().indexOf(".png") != -1 || url.toLowerCase().indexOf(".jpg") != -1 || url.toLowerCase().indexOf(".jpeg") != -1 || url.toLowerCase().indexOf(".tif") != -1 || url.toLowerCase().indexOf(".tiff") != -1){

			// this is any other image

			// url = url.split(/[?#]/)[0]; // REMOVES QUERY STRING AND HASH
			
			$(theExpand).find('.large-area').html('<div class="large-image" style="background-image:url(' + url + ');"></div>');

			$(theExpand).find('.large-image').zoom({url: url, on: 'click'});

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

			$(theExpand).html('<div class="large-image" style="background-image:url(' + liveMemeURL + ');"></div>');

			$(theExpand).find('.large-album').zoom({url: liveMemeURL, on: 'click'});

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

            $(theExpand).find(".large-area").html('<div class="large-youtube"><iframe allow="autoplay; fullscreen; encrypted-media; picture-in-picture" frameborder="0" allowfullscreen src="//www.youtube.com/embed/' + vidID + '?rel=0&autoplay=1&vq=hd1080&wmode=transparent&start=' + timeStamp + '" /></div>');

            $(theExpand).attr("data-original-type", "youtube");
			$(theExpand).attr("data-original-data", '//www.youtube.com/embed/' + vidID + '?rel=0&autoplay=1&vq=hd1080&wmode=transparent&start=' + timeStamp);

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
      		vidID = url.substr(url.toLowerCase().indexOf("?viewkey=") + 9);

      		$(theExpand).find(".large-area").html('<div class="large-youtube"><iframe allow="autoplay; fullscreen; encrypted-media; picture-in-picture" src="//www.pornhub.com/embed/' + vidID + '" frameborder="0" width="560" height="315" scrolling="no" allowfullscreen autoplay /></div>');

      		$(theExpand).attr("data-original-type", "pornhub");
			$(theExpand).attr("data-original-data", '//www.pornhub.com/embed/' + vidID);
		}

		//XHAMSTER.COM INTEGRATION
		else if( url.toLowerCase().indexOf("xhamster.com") != -1 ){
      		vidID = url.substr(url.toLowerCase().lastIndexOf("-") + 1);

      		$(theExpand).find(".large-area").html('<div class="large-youtube"><iframe allow="autoplay; fullscreen; encrypted-media; picture-in-picture" src="//xhamster.com/xembed.php?video=' + vidID + '" frameborder="0" width="560" height="315" scrolling="no" allowfullscreen autoplay /></div>');

      		$(theExpand).attr("data-original-type", "xhamster");
			$(theExpand).attr("data-original-data", '//xhamster.com/xembed.php?video=' + vidID);
		}

		//XVIDEOS.COM INTEGRATION
		else if( url.toLowerCase().indexOf("xvideos.com") != -1 ){
      		vidID = url.substr(url.toLowerCase().indexOf("/video") + 6);
      		vidID = vidID.substr('-'+vidID.length,vidID.indexOf("/") + 1);

      		$(theExpand).find(".large-area").html('<div class="large-youtube"><iframe allow="autoplay; fullscreen; encrypted-media; picture-in-picture" src="//flashservice.xvideos.com/embedframe/' + vidID + '" frameborder="0" scrolling="no" allowfullscreen="allowfullscreen" /></div>');

      		$(theExpand).attr("data-original-type", "xvideos");
			$(theExpand).attr("data-original-data", '//flashservice.xvideos.com/embedframe/' + vidID);
		}



		//YOUTUBE SHARE
		else if( url.toLowerCase().indexOf("youtu.be") != -1 ){

			vidID = url.substr(url.toLowerCase().indexOf("youtu.be/") + 9);
            
            timeStamp = getUrlVars(url)["t"];
            timeStamp = getYouTubeTimeStamp(timeStamp);

			$(theExpand).find(".large-area").html('<div class="large-youtube"><iframe allow="autoplay; fullscreen; encrypted-media; picture-in-picture" frameborder="0" allowfullscreen src="//www.youtube.com/embed/' + vidID + '?rel=0&autoplay=1&vq=hd1080&wmode=transparent&start=' + timeStamp + '" /></div>');

			$(theExpand).attr("data-original-type", "youtube");
			$(theExpand).attr("data-original-data", '//www.youtube.com/embed/' + vidID + '?rel=0&autoplay=1&vq=hd1080&wmode=transparent&start=' + timeStamp);
			

		}






		// VIMEO
		else if( url.toLowerCase().indexOf("vimeo.com") != -1 && url.toLowerCase().indexOf("/r/vimeo") == -1 ){

			url = url.split(/[?#]/)[0]; // REMOVES QUERY STRING AND HASH

			vidID = url.substr(url.toLowerCase().indexOf("vimeo.com/") + 10);

			$(theExpand).find(".large-area").html('<div class="large-youtube"><iframe allow="autoplay; fullscreen; encrypted-media; picture-in-picture" frameborder="0" allowfullscreen src="//player.vimeo.com/video/' + vidID + '?autoplay=1" /></div>');

			$(theExpand).attr("data-original-type", "youtube");
			$(theExpand).attr("data-original-data", '//player.vimeo.com/video/' + vidID + '?autoplay=1');

		}





		//SOUNDCLOUD
        else if( url.toLowerCase().indexOf("soundcloud.com") != -1 ){


	        // SoundCloud player URL via oEmbed (the old resolve API needed a client
	        // ID that no longer works, and the widget rejects on.soundcloud.com links)
	        $(theExpand).find('.large-area').html('<div class="shine-media-message">Loading…</div>');

	        (function(expand){
		        shineSoundCloudEmbedAsync( url, true, function(soundCloudEmbed){
			        $(expand).find('.large-area').html("<div class='large-soundcloud'><iframe allow='autoplay; fullscreen; encrypted-media; picture-in-picture' scrolling='no' frameborder='no' src='" + soundCloudEmbed + "'></iframe></div>");
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

	$(this).parents('.shine-expand').find('.large-album').css("background-image", "url(" + $(this).data("image") + ")" );

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




function getCommentAlbumImages( api, target ){

	$.ajax({
      url: api,
      type: 'GET',
      dataType: 'json',
      success: function(data) { 

		$(target).find(".large-area").html('<div class="large-album"></div><div class="album-thumbnails"></div><div class="album-captions"></div>');

		$('.active-album').removeClass("active-album");
		$(target).find(".large-album").addClass("active-album");

      	for( i = 0; i < data.data.length; i++ ){

      		captionTitle = data.data[i].title;
      		captionDescription = data.data[i].description;

      		if( captionTitle != null){
      			captionTitle = captionTitle.replace('"',"'");
      		}

      		if( captionDescription != null){
      			captionDescription = captionDescription.replace('"',"'");
			}

			$(target).find('.album-thumbnails').append('<img data-title="' + shineEscapeHTML(captionTitle) + '" data-description="' + shineEscapeHTML(captionDescription) + '" data-image="' + data.data[i].link + '" src="//i.imgur.com/' + data.data[i].id + 't.jpg" />');

      	}

      	$(target).find('.album-thumbnails img').first().addClass("active-thumb");

      	$(target).find('.large-album').css("background-image", "url(" + data.data[0].link + ")" );

      	$(target).find('.large-album').zoom({url: data.data[0].link, on: 'click'});

      	if( data.data[0].title != null || data.data[0].description != null ){

      		$(target).find('.album-captions').html('<div class="show-captions"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="-291 389 20 16" style="enable-background:new -291 389 20 16;" xml:space="preserve"><path d="M-273,389h-16c-1.1,0-2,0.9-2,2v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2v-12C-271,389.9-271.9,389-273,389z M-289,397h4v2h-4V397z M-279,403h-10v-2h10V403z M-273,403h-4v-2h4V403z M-273,399h-10v-2h10V399z"/></svg></div><div class="caption-text"><strong></strong><p></p></div>');

      		if( data.data[0].title != null ){
      			$(target).find('.caption-text strong').text(data.data[0].title);
      		}

      		if( data.data[0].description != null ){
      			$(target).find('.caption-text p').text(data.data[0].description);	
      		}

      	}

      },
      error: function(request, status, message) { 
      	console.log(message); 
      },
      beforeSend: setHeader
    });

}



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



    $(button).parents(".shine-expand").find(".large-area").html('<div class="large-image" style="background-image:url(' + data + ');"></div>');

	$(button).parents(".shine-expand").find(".large-image").zoom({url: data, on: 'click'});




  }else if( type === "youtube"){




    $(button).parents(".shine-expand").find(".large-area").html('<div class="large-youtube"><iframe allow="autoplay; fullscreen; encrypted-media; picture-in-picture" frameborder="0" allowfullscreen src="' + data + '" /></div>');




  }else if( type === "html5"){




    $(button).parents(".shine-expand").find(".large-area").html('<div class="large-html5"><video controls preload="auto" autoplay="autoplay" muted="muted" loop="loop" webkit-playsinline ><source src="' + data + '" type="video/mp4" /></video></div>');




  }else if( type === "album"){

    getCommentAlbumImages( data, $(button).parents(".shine-expand") );

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





$('html').on('click','.comment-album:not(.closecommentmedia)', function(e){

	shineShowCommentMediaArea( this );
	replaceExpand("album", $(this).data("album"), $(this) );
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

	theShinedThings = $('body > .content #siteTable > .thing').not(".shined-thing");

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


// when RES loads new things, run our JS on them

if( $('body').hasClass('res') ){

	window.addEventListener("neverEndingLoad", function() {

		shineHREF();

		setTimeout("jQuery('#siteTable > .sitetable.linklisting .thing').first().unwrap()", 1);

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

			     $('body > .content #siteTable').append( $(data).find('#siteTable .thing') );

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