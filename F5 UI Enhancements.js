//***** Description *****//
//    This script will house the shared methods and variables within other Tampermonkey scripts, so we don't have to duplicate effort in every new scripts. It will help with the 'modularization' of these scripts.
//*****//


// Turns on logging for the script (useful for debugging issues)
//  0 - Off
//  1 - Notice
//  2 - Informational
//  3 - Debug
var DebugLevel = 3;

// Make sure that the tampermonkey jQuery does not tamper with F5's scripts
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