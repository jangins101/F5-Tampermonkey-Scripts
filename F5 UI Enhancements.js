// ==UserScript==
// @name F5 UI Enhancements
// @version 1.0
// @homepage https://github.com/jangins101/F5-Tampermonkey-Scripts/blob/master/F5%20UI%20Enhancements.js
// @description Wrapper for other included TamperMonkey scripts related to F5 (LTM & APM)
// @updateURL https://raw.githubusercontent.com/jangins101/F5-Tampermonkey-Scripts/master/F5%20UI%20Enhancements.js
// @downloadURL https://raw.githubusercontent.com/jangins101/F5-Tampermonkey-Scripts/master/F5%20UI%20Enhancements.js
// @match https://*/tmui/Control/*
// @match https://*/sam/admin/reports/*
// @run-at document-end
// @require http://code.jquery.com/jquery-latest.js
// @require https://github.com/jangins101/jquery-simple-context-menu/raw/master/jquery.contextmenu.js
// @require https://raw.githubusercontent.com/jangins101/F5-Tampermonkey-Scripts/master/F5%20UI%20Enhancements%20for%20LTM.js
// @require https://raw.githubusercontent.com/jangins101/F5-Tampermonkey-Scripts/master/F5%20UI%20Enhancements%20for%20APM.js
// @resource jqCtxMenu https://github.com/jangins101/jquery-simple-context-menu/raw/master/jquery.contextmenu.css
// @grant GM_addStyle
// @grant GM_getResourceText
// ==/UserScript==

/* 
    **************************************************
    ***** Description ********************************
    **************************************************

    This script was designed in order to enhance the existing UI of the F5 BIG-IP.
    It was originally written for v11.5.1, but should work for many earlier and later versions as well.

    The original inspiration for this script came from Patrik Jonsson's "Web UI Tweaks" codeshare 
      (https://devcentral.f5.com/codeshare/web-ui-tweaks) on F5 DevCentral (https://devcentral.f5.com).

    The latest version of the code can be found on GitHub at https://github.com/jangins101/F5/blob/master/TamperMonkey/F5%20BIG-IP%20UI%20Enhancements.js

    From his script, I began to work on additional enhancements which have resulted in this Tampermonkey script.

    The enhancements that this script provides include links on the list pages for virtual servers, pools, nodes, and iRules to the Network Map page, to make it easier to find other related entities for each one.
    It also includes an enhancement to the APM "Manage Sessions" page that will link to the session variable for a given session (since there's been no quick and easy search functionality in the Access Reports).
    Also, for any item that has the Network Map link, you can right-click the entity name and open the network map in a new window or in the same window - in addition to just clicking the link within the table. This also includes the Manage Sessions link to session details/variables.
    There are other enhancements throughout the configuration pages that add links to other configurations (e.g. a virtual server's default pool will have a link to open the pool configuration page).
    Other enhancements may be seen in the code comments below

    **************************************************
    ***** Version History Notes **********************
    **************************************************

    Version     Notes
    1.0         Initial version - Pulled out of the other script I built

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

// Most functionality is specific to a certain page, so this function is used to check the current page against a specific URL 
function checkLocation(str) {
    return (window.location.href.indexOf(str) >= 0);
}

// This will parse the specified url parameter value form the current page URL if it exists
function getParameterByName(name) {
    // REF: http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// This will grab the specified cookie if it exists
function getCookie(cname) {
    // REF: http://www.w3schools.com/js/js_cookies.asp
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) === 0) return c.substring(name.length,c.length);
    }
    return "";
}

// This will redirect the user the specified url (in a new window if specified)
function redirect(url, newWindow) {
    if (newWindow) {
        window.open(url);
    } else {
        window.location = url;
    }
}