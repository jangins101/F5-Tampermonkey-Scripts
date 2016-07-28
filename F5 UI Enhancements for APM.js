// ==UserScript==
// @name F5 UI Enhancements for APM
// @version 1.01
// @homepage https://github.com/jangins101/F5-Tampermonkey-Scripts/blob/master/F5%20UI%20Enhancements%20for%20APM.js
// @description Modifies the Manage Session list to include a link so you can open session variables from there instead of going thruogh the Reports section
// @updateURL https://raw.githubusercontent.com/jangins101/F5-Tampermonkey-Scripts/master/F5%20UI%20Enhancements%20for%20APM.js
// @downloadURL https://raw.githubusercontent.com/jangins101/F5-Tampermonkey-Scripts/master/F5%20UI%20Enhancements%20for%20APM.js
// @match https://*/tmui/Control/*
// @match https://*/sam/admin/reports/*
// @run-at document-end
// @require http://code.jquery.com/jquery-latest.js
// @require https://raw.githubusercontent.com/jangins101/F5-Tampermonkey-Scripts/master/F5%20UI%20Enhancements%20Shared.js
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

    Disclaimer: All scripts are provided AS IS without warranty of any kind. I dislaim any/all liability from the use of this script.
*/

// Override the DebugLevel that was set in the required shared script
//DebugLevel = 3;

/*
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

*/

// ***********************************
// ***** SECTION: Custom CSS *********
// ***********************************

// This is the style we'll be using for the NetworkMap links created by the function above (addNetworkMapLink)
$("<style type='text/css'> \
     .tmLink { \
        text-decoration:none; \
        padding: 1px 20px 1px 5px; \
        background: rgba(255, 255, 255, .5) url(/xui/framework/images/icon_jump_menu.png) no-repeat 100% 50%; \
        border: 1px solid #e6e6e6; \
        border-left: 5px solid #e6e6e6; \
        color: #666 !important; \
    } \
    .tmLink:hover { \
        text-decoration:none !important; \
        background-color: rgba(149, 163, 178, .1); \
        border-left: solid 5px rgba(255, 204, 0, 1); \
    } \
    .noExt { \
        background-image: none; \
        padding-right: 5px; \
    } \
  </style>").appendTo("head");




// When debugging this script, it's nice to know what the current URL is that we're working with
dlog("Location: " + window.location.href, 3);


// ***********************************
// ***** SECTION: Access Policy ******
// ***********************************

// Access Profile List
if (checkLocation("/tmui/Control/jspmap/tmui/accessctrl/profiles/list.jsp") || checkLocation("/tmui/Control/form?__handler=/tmui/accessctrl/profiles/list")) {
    console.log("Access Policy | List ");

    // Convert the Status Flag icon to a link that will apply only that Access Policy
    var rows = $("table#list_table tbody tr");
    for (var i=0; i<rows.length; i++) {
        var tr = $(rows[i]);
        var img = tr.find('img[src*=status_flag_yellow]');
        var name = $("input[type=checkbox]", tr).val();

        var aLink = $("<a href='#' class='tmLink noExt'>Apply</a>");
        aLink.click(function() {
            var tForm = $(this).closest("form");
            $("tbody tr td:nth-child(1) input[type=checkbox]", tForm).prop('checked', false);
            $("td:nth-child(1) input[type=checkbox]", $(this).closest("tr")).prop('checked', true);

            // Submit the form
            tForm.find("input[type=submit]#list_apply").click()
        });
        aLink.appendTo(img.parent());
    }
}

// Manage Sessions
if (checkLocation("tmui/Control/jspmap/tmui/overview/reports/current_sessions.jsp") || checkLocation("/tmui/Control/form?__handler=/tmui/overview/reports/current_sessions")) {
    dlog("Access Policy | Current Sessions");

    /* This script will add an extra link on the "Manage Sessions" with the text "(show variables)".
     * It will open the APM reports page displaying the session variables for that session
     * This makes working finding the right session much simpler since we can search from the Manage Sessions screen and then open the session variables directly
     */
    var table = $("#list_table");

    // Add the header column
    var theadTds = $("thead .columnhead td", table);
    $("<td>Session Variables</td>").insertAfter(theadTds[2]);

    // Increment the Header TD with colspan
    var tdColspan = $("tr.tablehead td[colspan]", table);
    if (tdColspan.attr("colspan") % 1 === 0){
        tdColspan.attr("colspan", (parseInt(tdColspan.attr("colspan"))+1));
    }

    // Add the link in each row
    var tbodyTds = $("tbody tr", table);
    tbodyTds.each(function(idx, el) {
        var td = $($("td", el)[2]);
        var aCopy = $("a", td).clone();
        var newHref = aCopy.attr("href").replace("showSessionDetails=1", "showSessionDetails=2");
        aCopy.attr("href", newHref);
        aCopy.attr("target", "_blank");
        aCopy.html("show");
        aCopy.addClass("tmLink");
        $('<td></td>').append(aCopy).insertAfter(td);
    });
}

// Reports
if (checkLocation("/sam/admin/reports/index.php")) {
    dlog("Access Policy | Access Reports");

    // Show Variables
    if (checkLocation("showSessionDetails=2")) {
        // This script will execute if the user clicked the "show variables" link from above and will automatically open the session variables reports
        var sid = getParameterByName("sid");

        // Need time for page to parse the settings necessary to build the report.
        window.setTimeout(function(){showSessionVariables(sid);}, 1000);
    }
}
