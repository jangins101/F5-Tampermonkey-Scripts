// ==UserScript==
// @name F5 Devcentral Enhancements
// @version 1.03
// @homepage https://github.com/jangins101/F5/blob/master/F5%20Devcentral%20Enhancements.js
// @description Adds a lot of useful features to the GUI in order to make access to different configuration items quicker
// @updateURL https://github.com/jangins101/F5/raw/master/F5%20Devcentral%20Enhancements.js
// @downloadURL https://github.com/jangins101/F5/raw/master/F5%20Devcentral%20Enhancements.js
// @match https://devcentral.f5.com/*
// @run-at document-end
// @require http://code.jquery.com/jquery-latest.js
// @require https://raw.githubusercontent.com/jangins101/F5-Tampermonkey-Scripts/master/F5%20UI%20Enhancements%20Shared.js
// ==/UserScript==

/*
    **************************************************
    ***** Description ********************************
    **************************************************
    
    This script is designed to make the Devcentral site a little better looking.
    
    Purposes:
    * Add "Load All" button to the notifications page
    * Add "Dismiss All" button to the notifications page
    * Trim the padding on some line items to better utilized screen real estate
    
    **************************************************
    ***** Version History Notes **********************
    **************************************************

    Version     Notes
    1.0         Initial version (including Dismiss All button and padding override)
*/


// Turns on logging for the script (useful for debugging issues)
//  0 - Off
//  1 - Notice
//  2 - Informational
//  3 - Debug
var DebugLevel = 3;


//Make sure that the tampermonkey jQuery does not tamper with F5's scripts
this.$ = this.jQuery = jQuery.noConflict(true);


dlog("Location: " + window.location.href);
if (checkLocation("https://devcentral.f5.com/users") && checkLocation("?view=notifications")){
    // Override the CSS to make the page look better
    $("<style type='text/css'>.DnnModule-Messaging-Notifications .smListings .message { white-space: normal !important; }</style>").appendTo("head");

    // Add the Dismiss All button
    var pDiv = $("div.coreNotifications");
    var pEl = $("div.messageFolders", pDiv);

    // Ignore if we've already done this
    if ($("a#dismissAll", pEl).length > 0) { return; }

    // Build the link and action for Load All
    var aEl1 = $("<a href='#' id='loadAll' title='Load All' class='btn btn-primary' style='float:left; margin: auto 2px;'>Load All</a>");
    aEl1.click(function() {
        var aLoadMore = $('a:contains("Load More"):visible', pDiv);        // Get the load more button for the notifications section
        if (aLoadMore.length > 0) {
            var aEl = aLoadMore[0];
            var nCount = parseInt($($("strong", pEl)[1]).text());          // Determine how many pages we'll need
            for (var i=0; i<(Math.floor(nCount/10)); i++) { aEl.click(); } // Click the Load More button to load 10 more items
        }
        return false;
    });
    aEl1.appendTo(pEl);
    
    // Build the link and action to Dismiss All
    var aEl2 = $("<a href='#' id='dismissAll' title='Dismiss All' class='btn btn-primary' style='float:left; margin: auto 2px;'>Dismiss All</a>");
    aEl2.click(function() {
        $('.notificationControls a:contains("Dismiss")', pDiv).each(function(idx,val){val.click();});
        return false;
    });
    aEl2.appendTo(pEl);
}
