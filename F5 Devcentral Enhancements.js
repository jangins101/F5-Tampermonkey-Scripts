// ==UserScript==
// @name DevCentral
// @version 1.0
// @homepage https://github.com/jangins101/F5/blob/master/F5%20Devcentral%20Enhancements.js
// @description Adds a lot of useful features to the GUI in order to make access to different configuration items quicker
// @updateURL https://github.com/jangins101/F5/raw/master/F5%20Devcentral%20Enhancements.js
// @downloadURL https://github.com/jangins101/F5/raw/master/F5%20Devcentral%20Enhancements.js
// @match https://devcentral.f5.com/users/*
// @run-at document-end
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==

/*
    **************************************************
    ***** Description ********************************
    **************************************************
    
    This script is designed to make the Devcentral site a little better looking.
    
    Purposes:
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


// ***********************************
// ***** SECTION: Helper Functions ***
// ***********************************

// If the IsDebug setting not empty/undefined/false, then we'll log messages to the console
function dlog(o, minLevel) {
    if (DebugLevel && (!minLevel || (minLevel >= DebugLevel) )) { console.log(o); }
}

// Most functionality is specific to a certain page, so this function is used to check the current
//  page against a specific URL
function checkLocation(str) {
    return (window.location.href.indexOf(str) >= 0);
}

dlog("Location: " + window.location.href);
if (checkLocation("https://devcentral.f5.com/users") && checkLocation("?view=notifications")){
    // Override the CSS to make the page look better
    $("<style type='text/css'>.DnnModule-Messaging-Notifications .smListings .message { white-space: normal !important; }</style>").appendTo("head");

    // Add the Dismiss All button
    var pDiv = $("div.coreNotifications");
    var pEl = $("div.messageFolders", pDiv);

    // Ignore if we've already done this
    if ($("a#dismissAll", pEl).length > 0) { return; }

    // Build the link and action to dismiss all
    var aEl = $("<a href='#' id='dismissAll' title='Dismiss All' class='btn btn-primary' style='float:left'>Dismiss All</a>");
    aEl.click(function() {
        debugger;
        var aLoadMore = $('a:contains("Load More"):visible', pDiv);          // Get the load more button for the notifications section
        var nCount = parseInt($($("strong", pEl)[1]).text());                // Determine how many pages we'll need
        for (var i=0; i<(Math.floor(nCount/10)); i++) { aLoadMore.click(); } // Click the Load More button to load 10 more items
        dLog($('a:contains("Dismiss").currentURL', pDiv));//.click();        // Dismiss all the notification;
    });
    aEl.appendTo(pEl);
}
