// To store a jquery ref to the timeout dialog
var box;
var sessionTimeOutBannerDisplayed = false;

/**
 * Tells the caller if the session timeout banner is displayed.
 */
function isSessionTimeOutBannerDisplayed() {
	return sessionTimeOutBannerDisplayed;
}

/**
 * Keeps PS session alive for both user (manual stay signed in) and long running 
 * processes (automatic stay signed in).
 *
 * Use the startKeepSessionAlive() and stopKeepSessionAlive() functions to 
 * demark suspension of the session timeout dialog and to perform automatic PowerSchool 
 * session keep alive for long running processes.  Long running processes are AJAX
 * calls that exceed the session timeout.
 */
var psKeepAlive;
var isSAMLSPUser = false;
function PSKeepAlive() {
    var lastActivity = null;
    var timeout = null;
    var secondsToShowDialog = 120;

	/** keeps the session alive during long running processes */
	var keepAlive = false;

    var messageKeysLoaded = false;
	var dialogShowing = false;
	var nextPoll = false;

    var el = $j('meta#keep-alive-config');
    var dataBindAttr;
    var disabled = $j('meta#keep-alive-config-disabled');
    if (el && disabled.length == 0) {
        dataBindAttr = el.attr('content');
    }

    if (dataBindAttr) {
    	// Note here: the default do-not-display condition from the display:none style attribute. This will 
    	// come into play in a variety of conditions:
    	// 1) Time to timeout has not been approached
    	// 2) Time to timeout is near, but not in the screen medium; screen.css has an !important
    	//    style to make this div show up when showBox(true) is called;
    	// 3) Non-CSS-ified pages, where the !important will never be applied because screen.css is not included
	    box = $j('<div id="sessiontimeoutwarning" style="display: none" />');
	    $j(document.body).append(box);

    	// Check a couple of conditions we don't want to have keep alive timer in. These
    	// conditions really shouldn't call a timer anyway (based on frame type); but if there is a missing frame
    	// type they might, so we'll make sure here. This will come into play especially in state reporting pages.
    	if (window.name == 'menu') log("in a menu, no keep-alive; url="+window.location);
    	if (window.name == 'task_navigator') log("in a task_navigator, no keep-alive; url="+window.location);
    	else if ($j('frameset').length) log("in a frameset, no keep-alive; url="+window.location);
    	else {
            $j('body').on('mousedown keydown', function(event) {
            	// Don't try to do it if user clicked a sign in link. If that's what he clicked, we just
            	// want to let it follow the link without interference from the likes of us.
            	var target = $j(event.target);
            	if (!target.is('a[data-type="sign_in"]')) {
                    lastActivity = new Date();
                    if (dialogShowing) {
        		    	resetSessionTimeout(receiveUpdatedTimeRemaining);
                    }
            	}
            });

            var t = dataBindAttr * 60;
            if (t < secondsToShowDialog) {
                secondsToShowDialog = t * .5;
                if (secondsToShowDialog < 20) {
                    secondsToShowDialog = 20;
                }
            }

            var expireTime = new Date(new Date().getTime() + (t*1000));
            log("Init - session is set to expire in " + t + " seconds at " + expireTime.toLocaleTimeString());
            receiveUpdatedTimeRemaining(t);
    	}
    }  // end: if found a keep alive config meta

    function receiveUpdatedTimeRemaining(timeout) {
        log("receiveUpdatedTimeRemaining - timeout: " + timeout);

		if (nextPoll) {
            clearTimeout(nextPoll);
		}

        var wakeUpMillis;
        if (timeout <= (secondsToShowDialog)) {
            if (!dialogShowing) {
                handleImpendingTimeout(timeout);
            }
            wakeUpMillis = 5 * 1000;
        }
        else {
        	showBox(false);

        	//log ("receiveUpdatedTimeRemaining: dialogShowing <- false");
            dialogShowing = false;
            wakeUpMillis = (timeout * 1000) - (secondsToShowDialog * 1000);
        }

        log("receiveUpdatedTimeRemaining - Wake up in " + parseInt(wakeUpMillis/1000) + " for new timeout");
        nextPoll = setTimeout(wakeUp, wakeUpMillis);
    }

    function wakeUp() {
        getTimeout(receiveUpdatedTimeRemaining);
    }

    function checkLoadMessages() {
        if (!messageKeysLoaded) {
            log("checkLoadMessages - Loading message keys via ajax.");

            //Might not have to get message keys, as these are pre-loaded.
            pss_get_texts("psx.js.keep_alive.keep_alive", "psx.js.keep_alive.keep_alive.about_to_expire_title");

            messageKeysLoaded = true;
        }
    }
    
    function getTimeout(callback) {
        //getTimeout
        log("getTimeout - Checking server for timeout");
        checkLoadMessages();

       clearTimeout(nextPoll);

       $j.ajax({
          type: 'GET',
          url: "/ws/session/seconds-remaining?_="+new Date().getTime(),
          dataType:'json',
          context: document.body,
          success: function(timeJSON) {
            timeout = timeJSON.Seconds.value;
            sessionStorage.uid = timeJSON.Seconds.uid;
            callback(timeout);
          },
		  statusCode: {
		    401: function() {
		      showTimeoutErrorDialog();
            }
		  }
       });
    }
	
    function resetSessionTimeout(callback) {
		if (sessionTimeOutBannerDisplayed){
				return;		// If we've already timed out then don't reset anything and don't bother the server
		}
		if (lastActivity !== null ) {
            clearTimeout(nextPoll);
            $j.ajax({
              type: 'PUT',
              url: "/ws/session/last-hit?seconds=" + parseInt((new Date().getTime()-lastActivity.getTime()) / 1000),
              dataType:'json',
              context: document.body,
              success: function(timeJSON) {
                timeout = timeJSON.Seconds.value;
                callback(timeout);
              },
			  statusCode: {
				401: function() {
		          showTimeoutErrorDialog();
				}
			  }
            });
        }
       
        lastActivity = null;
    }
	
	/**
	 * Resets the session timeout now.
	 *
	 * @param callback - a function callback
	 */
	function resetSessionTimeoutNow(callback) {
		lastActivity = new Date();
		resetSessionTimeout(callback);
	}	

	/**
	 * Handles the impending timeout.
	 */
    function handleImpendingTimeout(timeout) {
        if (lastActivity !== null) {
            resetSessionTimeout(receiveUpdatedTimeRemaining);
        } else if ( keepAlive ) {
			// if keep alive, then treat this as if the user clicked the remain logged in button.
			resetSessionTimeoutNow(receiveUpdatedTimeRemaining);
		} else {
			setSAMLUserBoolean();
			showTimeoutDialog();
        }
    }
	
	function setupTimeoutDialog() {
		checkLoadMessages();

		box.html('<div id="sessiontimeoutwarningBox">' +
			'<h2 class="warning"></h2>' +
			'<p class="warning"></p>' +
			'<button class="warning continueButton" type="button"></button>' +
			'<h2 class="signedout"></h2>' +
			'<p class="signedout"></p>' +
			'</div>');

		box.find('h2.warning').html(pss_text("psx.js.keep_alive.keep_alive.about_to_expire_title"));
		box.find('p.warning').html(pss_text("psx.js.keep_alive.keep_alive.about_to_expire_text"));
		box.find('button.warning').html(pss_text("psx.js.keep_alive.keep_alive.continue"));
		box.find('h2.signedout').html(pss_text("psx.js.keep_alive.keep_alive.session_is_expired"));
		if (isSAMLSPUser == true) {
			box.find('h2.signedout').html(pss_text("psx.js.keep_alive.keep_alive.session_is_expired_with_saml"));
			box.find('p.signedout').html(pss_text("psx.js.keep_alive.keep_alive.return_to_sign_in_page_with_saml"));
		} else {
			box.find('h2.signedout').html(pss_text("psx.js.keep_alive.keep_alive.session_is_expired"));
			box.find('p.signedout').html(pss_text("psx.js.keep_alive.keep_alive.return_to_sign_in_page"));
		}

        // Add sign in again link, but don't embed the link href in the message (having it here is bad enough)
        var link = box.find('p.signedout a');
        var location = "/"+getPortal();
        link.attr("href", location+"?request_locale="+get_locale());
        link.attr("data-type", 'sign_in');
        
	    box.find('.continueButton').click(function() {
	      log("continueButton clicked");
	      resetSessionTimeoutNow(receiveUpdatedTimeRemaining);
	    });
	}

	/**
	 * Make the warning dialog "visible" or not "visible". Notice that "visible" does not
	 * actually mean the dialog is shown: it will only be shown if .visible is mapped to a
	 * display:block CSS rule, and this will only happen if screen.css has been loaded.
	 * @param showIt if true, make the dialog "visible", else make it not visible
	 */
	function showBox(showIt) {
		if (showIt) {
	    	box.addClass("visible");
		} else {
        	box.removeClass("visible");
		}
	}
	
    function showTimeoutDialog() {
    	//log("showTimeoutDialog: enter");
    	setupTimeoutDialog();

    	showBox(true);
    	
        //log ("showTimeoutDialog: dialogShowing <- true");
	    dialogShowing = true;
    	//log("showTimeoutDialog: exit");
    }

    function showTimeoutErrorDialog() {
    	
    	// verify browser supports sessionStorage
    	if(typeof(Storage)!==undefined){
    		if(sessionStorage.timedOut === undefined||sessionStorage.timedOut === null){
	    		// determine whether the page is framed
	    		var frameContent = parent.document.getElementById('frameContent') ? parent.document.getElementById('frameContent') : parent.document.getElementsByName('content')[0];
	    		if(frameContent!==undefined&&frameContent!==null){
	    			// grab the frame info
	    			sessionStorage.framedPage = 'true';
	    			sessionStorage.url = window.parent.location.href;
	    			doc = frameContent.contentDocument ? frameContent.contentDocument : (frameContent.document || frameContent.contentWindow.document);
	    			// If the url and doc.URL are the same this is not a framed page IE specific fix
	    			if(sessionStorage.url !== doc.URL){
	    				sessionStorage.frameContentUrl = doc.URL;
	    			}else{
	    				sessionStorage.framedPage = 'false';
	    			}
	    			// find all rns necessary to display page correctly and store them
	    			var rns = $j(doc).find('input[name$="rn"]');
	    			if(rns.length>0){
	    				sessionStorage.rns = '';
		    			rns.each(function(index, element){
		    				sessionStorage.rns += $j(element).attr('name')+',';
		    				sessionStorage.setItem($j(element).attr('name'), $j(element).attr('value'));
		    			});
	    			}
	    		}else{
	    			// find all rns necessary to display page correctly and store them
	    			var rns = $j('input[name$="rn"]');
	    			if(rns.length>0){
	    				sessionStorage.rns = '';
		    			rns.each(function(index, element){
		    				sessionStorage.rns += $j(element).attr('name')+',';
		    				sessionStorage.setItem($j(element).attr('name'), $j(element).attr('value'));
		    			});
	    			}
	    			// store url
	    			sessionStorage.url = window.location.href;
	    		}
	    	// handles student and staff search bar selections
    		if(sessionStorage.url.indexOf('?') === -1){
    			var xselect = $j('input[name^="xselect"]');
    			if(xselect.length > 0){
    				var select = xselect.attr('name');
    				select = select.substring(1, select.length);
    				sessionStorage.url = sessionStorage.url+'?'+select+'='+xselect.attr('value');
    				if(xselect.attr('name')==='xselectstudent'){
    					sessionStorage.url = sessionStorage.url+'&homesearch='+$j('input[name="homesearch"]').attr('value');
    				}
    			}
			}
    		// store necessary variable to trigger restore dialogue bar
    		sessionStorage.timedOut = true;
    		}
    	 }
    		
    	//log("showTimeoutErrorDialog: enter");
    	setupTimeoutDialog();
    	box.addClass("signedout");
    	
    	$j('body').append($j('<div/>', {'class':'signedout ui-widget-overlay ui-front security-overlay'}));
    	
    	
    	// Just in case ...
    	showBox(true);
    	
        //log ("showTimeoutErrorDialog: dialogShowing <- true");
	    dialogShowing = true;
	    
	    // set the flag that the banner is displayed
	    sessionTimeOutBannerDisplayed = true;
    	//log("showTimeoutErrorDialog: exit");

        //need to remove any potential dirty state listeners
        $j(window).off('beforeunload');
        $j(window).off('unload');
        // fix the title if the asterisk dirty state indicator is present
        var curTitle = $j('title',top.document).text();
        if (curTitle.charAt(0) === '*'){
            $j('title',top.document).text(curTitle.substring(1));
        }

    }

    function log(msg) {
//        if (window.console && console.log) console.log(new Date().toLocaleTimeString() + " :: " + msg);
    }
	
	function setSAMLUserBoolean() {
		$j.ajax({
			  type: 'POST',
			  url: "/ws/session/is-sso-user",
			  dataType:'json',
			  context: document.body,
			  success: function(isSAMLSP) {
				if(isSAMLSP == true) {
					isSAMLSPUser = true;
				} 
			  }
			});			
	}
	
	/**
	 * PRIVELEDGED METHODS
	 *
	 * These methods may be invoked publically and can be
	 * replaced with public flavors.
	 */ 
	
	/**
	 * Starts the keep alive PS session mode. While in this mode normal timeout behavior is
	 * suspended and PS session is updated automatically.
	 */
	this.startKeepAlive = function() {
		keepAlive = true;
	}

	/**
	 * Stops the keep alive PS session mode.  Normal timeout behavior will resume.
	 */
	this.stopKeepAlive = function() {
		keepAlive = false;
	}	
}

$j(document).ready(function(){psKeepAlive = new PSKeepAlive()});
