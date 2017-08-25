// ==UserScript==
// @name F5 UI Enhancements for LTM
// @version 1.3.1
// @homepage https://github.com/jangins101/F5/blob/master/F5%20UI%20Enhancements%20for%20LTM.js
// @description Adds a lot of useful features to the GUI in order to make access to different configuration items quicker 
// @updateURL https://github.com/jangins101/F5/raw/master/F5%20UI%20Enhancements%20for%20LTM.js
// @downloadURL https://github.com/jangins101/F5/raw/master/F5%20UI%20Enhancements%20for%20LTM.js
// @match https://*/tmui/Control/*
// @match https://*/sam/admin/reports/*
// @run-at document-end
// @require http://code.jquery.com/jquery-latest.js
// @require https://github.com/jangins101/jquery-simple-context-menu/raw/master/jquery.contextmenu.js
// @require https://raw.githubusercontent.com/jangins101/F5-Tampermonkey-Scripts/master/F5%20UI%20Enhancements%20Shared.js
// @resource jqCtxMenu https://github.com/jangins101/jquery-simple-context-menu/raw/master/jquery.contextmenu.css
// @grant GM_addStyle
// @grant GM_getResourceText
// ==/UserScript==
 
var jqCtxMenuSrc = GM_getResourceText("jqCtxMenu");
GM_addStyle(jqCtxMenuSrc);
 
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
    1.0         Initial version
    1.1         Added context menu for SSL profiles on virtual server properties page
    1.2         Added network map link for nodes using a Monitor instance
    1.3         Removed APM stuff because I moved it to a separate script
    1.3.1       Cosmetic fixes when showing network map
 
    
    ToDo:
    * Add create policy button to the Virtual Server details for quick access
    * Add create iRule button to the VS details for quick access
 
    Disclaimer: All scripts are provided AS IS without warranty of any kind. I dislaim any/all liability from the use of this script.
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

    // This will add a link to every record in the "list_table" that opens the Network Map page in a new window
    // It will make use of the dymanic CSS addition below
    function addNetworkMapLink(col, nameFcn, tableName) {
        col = ((col != null && col >= 0) ? col : 2);
        var table = $("#" + (tableName || "list_table"));
        
        // Add the header column
        var theadTds = $("thead .columnhead td", table);
        $("<td>Show Network Map</td>").insertAfter(theadTds[col]);
        
        // Increment the Header TD with colspan
        var tdColspan = $("tr.tablehead td[colspan]", table);
        if (tdColspan.attr("colspan") % 1 === 0){
            tdColspan.attr("colspan", (parseInt(tdColspan.attr("colspan"))+1));
        }
        
        // Add the row columns
        var tbodyTds = $("tbody tr", table);
        tbodyTds.each(function(idx, el) {
            var td = $($("td", el)[col]);
            var name = ((nameFcn && typeof(nameFcn) === "function") ? nameFcn(el) : td.text().trim());
            var a = $('<td style="text-align: center;"><small><a class="tmLink" data-link="' + name + '" target="_blank" href="/tmui/Control/form?form_page=%2Ftmui%2Flocallb%2Fnetwork_map.jsp&show_map=1&SearchString=' + name + '&irule_body=true">Open</a></small></td>');
            a.insertAfter(td);
            //td.append(a);
            
            $("a", td).contextPopup({
                title: 'Show network map',
                items: [
                        { label: 'Open', action: function() { redirect('/tmui/Control/form?form_page=%2Ftmui%2Flocallb%2Fnetwork_map.jsp&show_map=1&SearchString=' + this.data + '&irule_body=true'); }, data: name },
                        { label: 'Open in new window', icon: '/xui/framework/images/icon_jump_menu.png', action: function() { redirect('/tmui/Control/form?form_page=%2Ftmui%2Flocallb%2Fnetwork_map.jsp&show_map=1&SearchString=' + this.data + '&irule_body=true', true); }, data: name }
                    ]
            });
        });
    }
 
    // This will add a doubleclick event to automate clicking a button
    function addDoubleClick(el, btn) {
        $("#" + el).dblclick(function() {  $("#" + btn).click(); });
    }
    
    // Sync width to the maximum between 2 select boxes
    function syncWidths(el1, el2) {        
        // Sync widths of the select boxes to the max value
        var maxW = Math.max($("#" + el1).width(), $("#" + el2).width());
        $("#" + el1).width(maxW);
        $("#" + el2).width(maxW);
    }
 
    // This wraps the monitor lists in a quick function to simplify adding doubleclick option
    function addMonitorListDoubleClick() {
        // Add dblclick ability to add/remove iRules
        addDoubleClick("monitor_rule", "available_monitor_select_button");
        addDoubleClick("available_monitor_select", "monitor_rule_button");
        
        // Sync widths of the select boxes to the max value
        syncWidths("monitor_rule", "available_monitor_select");
    }
 
    // This wraps the necessary code to add create a context menu for an item and append the item value to the URL 
    function addContextMenu(el, title, url) {
        $("#" + el).contextPopup({
            title: title,
            items: [
                { label: 'Open', action: function(e, data) { if (e.target.value) { redirect(data + e.target.value); } }, data: url },
                { label: 'Open in new window', icon: '/xui/framework/images/icon_jump_menu.png', action: function(e, data) { if (e.target.value) { redirect(data + e.target.value, true); } }, data: url }
            ]
        });
    }

    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }
 
 
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
      </style>").appendTo("head");
 
 
 
 
// When debugging this script, it's nice to know what the current URL is that we're working with
dlog("Location: " + window.location.href, 3);
 
 
 
// ***********************************
// ***** SECTION: Virtual Server *****
// ***********************************
 
    // Virtual Servers List
    if (checkLocation("/tmui/Control/jspmap/tmui/locallb/virtual_server/list.jsp")) {
        dlog("Virtual Servers | List");
        addNetworkMapLink();        
    }
 
    // Selected/Available options | Add double click ability for selection/removal
    if (checkLocation("/tmui/locallb/virtual_server/properties") || checkLocation("/tmui/Control/jspmap/tmui/locallb/virtual_server/properties.jsp")) {
        dlog("Virtual Servers | Properties");
        
        //  SSL Profile (client)
        addDoubleClick("selectedclientsslprofiles", "availableclientsslprofiles_button");
        addDoubleClick("availableclientsslprofiles", "selectedclientsslprofiles_button");
        syncWidths("selectedclientsslprofiles", "availableclientsslprofiles");
        addContextMenu("selectedclientsslprofiles", "SSL Profile Config", "/tmui/Control/jspmap/tmui/locallb/profile/clientssl/properties.jsp?name=");
        addContextMenu("availableclientsslprofiles", "SSL Profile Config", "/tmui/Control/jspmap/tmui/locallb/profile/clientssl/properties.jsp?name=");
 
        //  SSL Profile (server)
        addDoubleClick("selectedserversslprofiles", "availableserversslprofiles_button");
        addDoubleClick("availableserversslprofiles", "selectedserversslprofiles_button");
        syncWidths("selectedserversslprofiles", "availableserversslprofiles");
        addContextMenu("selectedserversslprofiles", "SSL Profile Config", "/tmui/Control/jspmap/tmui/locallb/profile/serverssl/properties.jsp?name=");
        addContextMenu("availableserversslprofiles", "SSL Profile Config", "/tmui/Control/jspmap/tmui/locallb/profile/serverssl/properties.jsp?name=");
 
        //  VLANs and Tunnels
        addDoubleClick("selected_vlans", "available_vlans_button");
        addDoubleClick("available_vlans", "selected_vlans_button");
        syncWidths("selected_vlans", "available_vlans");
    }
 
    // Load Balancing selections
    // This script will modify the VS resources page to add a new link for the default pool and 
    //      persistence settings which will open a new window on the object's configuration page
    if (checkLocation("/tmui/locallb/virtual_server/resources") || checkLocation("/tmui/Control/jspmap/tmui/locallb/virtual_server/resources.jsp")) {
        dlog("Virtual Servers | Resources");

        // We'er going to add links for default values on the following things
        var selects = [
            {id: "default_pool", name: "Pool", link: "pool" },
            {id: "default_persist", name: "Default Persistence", link: "profile/persistence" },
            {id: "fallback_persist", name: "Fallback Persistence", link: "profile/persistence" },
        ];                
        for (var i=0; i<selects.length; i++) {
            var o = selects[i];
            var el = $('select#' + o.id);
            if (el.length) {
                // Add the link to the DOM next to the select box
                var eParent = el.parent();
                var aId = 'link_' + o.id;
                var a = $('<a id="' + aId + '" class="tmLink" target="_blank" data-link="' + o.link + '" style="visible:hidden;" target="_blank">Open Configuration</a>');
                eParent.append(a);
 
                // Add a change event to the selectbox so we will only show the link if a value is selected
                el.change(function() {
                    var a = $(this).siblings("a");
 
                    // Hide the link if there's no valid selection
                    if ($(this).val() == "NO_SELECTION") { 
                        a.hide(); 
                        a.attr("href", '');
                    } else { 
                        a.show(); 
                        a.attr("href", '/tmui/Control/jspmap/tmui/locallb/' + a.data("link") + '/properties.jsp?name=' + $(this).val());
                    }
                });
                el.change(); // Execute the change function so it'll update the link
            }
        }
 
 
        // iRule List Helper Functions
        function doesiRuleExist(partition, name, responseObject) {
            //This function checks if an iRule exists or not in the given partition
            var exists = null;
 
            $.ajax({
                url: "/tmui/Control/jspmap/tmui/locallb/rule/properties.jsp?name=/" + partition + "/" + name,
                type: "GET",
                success: function(response) {
                    exists = response.indexOf("Instance not found") == -1;
                    responseObject.response = response;
                },
                async: false
            });
 
            return exists;
        }
        function replaceiRuleName(response, currentObject){
            if (response.indexOf("Instance not found") != -1){ return; }
            var a = $("<a href='/tmui/Control/jspmap/tmui/locallb/rule/properties.jsp?name=/" + currentObject.partition + "/" + currentObject.name + "'>" + currentObject.name + "</a>");
            $("td", currentObject.element).html(a);
        }
 
        // Update iRule list to use links instead of just text (duplicated functionality from Patrik's script)
        var rows = $("table#rule_list tbody#list_body tr");
        rows.each(function(idx, el) {
            var jEl = $(el);
            var name = jEl.text().trim();
 
            // Skip the check if there's no records to display
            if (jEl.text().indexOf("No records to display") >= 0 ) { return; }
 
            //Get the current partition
            var partition = getCookie("F5_CURRENT_PARTITION") || "Common";
 
            // Build the replacement object details
            var obj = { element: jEl, name: name, partition: partition };
 
            // Check for iRule existence in current partition (fallback to Common partition)
            var rObj = {};
            if (doesiRuleExist(partition, name, rObj)) {
                replaceiRuleName(rObj.response, obj);
            } else if (doesiRuleExist("Common", name, rObj)) {
                obj.partition = "Common";
                replaceiRuleName(rObj.response, obj);
            }
        });
        
        // Policy List Helper Functions
        function doesPolicyExist(partition, name, responseObject) {
            //This function checks if an iRule exists or not in the given partition
            var exists = null;
 
            $.ajax({
                url: "/tmui/Control/jspmap/tmui/locallb/policy/properties.jsp?policy_name=/" + partition + "/" + name,
                type: "GET",
                success: function(response) {
                    exists = response.indexOf("Instance not found") == -1;
                    responseObject.response = response;
                },
                async: false
            });
 
            return exists;
        }
        function replacePolicyName(response, currentObject){
            if (response.indexOf("Instance not found") != -1){ return; }
            var a = $("<a href='/tmui/Control/jspmap/tmui/locallb/policy/properties.jsp?policy_name=/" + currentObject.partition + "/" + currentObject.name + "'>" + currentObject.name + "</a>");
            $("td", currentObject.element).html(a);
        }
 
        // Update iRule list to use links instead of just text
        var rows = $("table#policy_list tbody#list_body tr");
        rows.each(function(idx, el) {
            var jEl = $(el);
            var name = jEl.text().trim();
 
            // Skip the check if there's no records to display
            if (jEl.text().indexOf("No records to display") >= 0 ) { return; }
 
            //Get the current partition
            var partition = getCookie("F5_CURRENT_PARTITION") || "Common";
 
            // Build the replace object
            var obj = { element: jEl, name: name, partition: partition };
 
            // Check for Policy existence in current partition (fallback to Common partition)
            var rObj = {};
            if (doesPolicyExist(partition, name, rObj)) {
                replacePolicyName(rObj.response, obj);
            } else if (doesPolicyExist("Common", name, rObj)) {
                obj.partition = "Common";
                replacePolicyName(rObj.response, obj);
            }
        });
    }
 
    // iRule & Policy selection pages
    if (checkLocation("/tmui/Control/form?__handler=/tmui/locallb/virtual_server/resources")) {
        dlog("Virtual Servers | Resources | iRule & Policy Selection");

        // Assigned iRules
        if($("#assigned_rules").length && $("#rule_references").length){
            // Sync widths of the select boxes to the max value
            var maxW = Math.max($("#assigned_rules").width(), $("#rule_references").width());
            $("#assigned_rules").width(maxW);
            $("#rule_references").width(maxW);
 
            // Add dblclick ability to add/remove iRules
            $("#assigned_rules").dblclick(function() {  $("#rule_references_button").click(); });
            $("#rule_references").dblclick(function() { $("#assigned_rules_button").click(); });
        }
 
        // Policy select boxes
        if ($("#assigned_l7policies").length && $("#l7policy_references").length) {
            // Sync widths of the select boxes to the max value
            var maxW = Math.max($("#assigned_l7policies").width(), $("#l7policy_references").width());
            $("#assigned_l7policies").width(maxW);
            $("#l7policy_references").width(maxW);
 
            // Add dblclick ability to add/remove iRules
            $("#assigned_l7policies").dblclick(function() {  $("#l7policy_references_button").click(); });
            $("#l7policy_references").dblclick(function() { $("#assigned_l7policies_button").click(); });
        }
    }
 
 
 
// ***********************************
// ***** SECTION: iRules *************
// ***********************************
 
    // Virtual Servers List
    if (checkLocation("/tmui/Control/jspmap/tmui/locallb/rule/list.jsp")) {
        dlog("iRules | List");
        addNetworkMapLink(1);
    }
 
 
 
// ***********************************
// ***** SECTION: DataGroups *********
// ***********************************
 
    // Virtual Servers List
    if (checkLocation("/tmui/Control/jspmap/tmui/locallb/datagroup/list.jsp")) {
        dlog("DataGroups | List");
        addNetworkMapLink();
    }
 
 
 
// ***********************************
// ***** SECTION: Pools **************
// ***********************************
 
    // Pool List
    if (checkLocation("/tmui/Control/jspmap/tmui/locallb/pool/list.jsp")) {
        dlog("Pools | List");
        addNetworkMapLink();
    }
 
    // Pool properties
    if (checkLocation("/tmui/locallb/pool/properties") || checkLocation("/tmui/Control/jspmap/tmui/locallb/pool/properties.jsp")) {
        dlog("Pools | Properties");
        
        // Add doubleclick for monitor select boxes
        addMonitorListDoubleClick();
    }
 
    // Create pool
    if (checkLocation("/tmui/Control/jspmap/tmui/locallb/pool/create.jsp")) {
        dlog("Pools | Create");
        
        // Add doubleclick for monitor select boxes
        addMonitorListDoubleClick();
    }

    // Pool Members
    if (checkLocation("/tmui/Control/jspmap/tmui/locallb/pool/resources.jsp?name=")) {
        dlog("Pools | Members");
        // TODO: Get link to use just hostname
        addNetworkMapLink(null, null, "member_table");
    }
 


// ***********************************
// ***** SECTION: Nodes **************
// ***********************************
 
    // Virtual Servers List
    if (checkLocation("/tmui/Control/jspmap/tmui/locallb/node/list.jsp")) {
        dlog("Nodes | List");
        addNetworkMapLink();
    }
 
    // Create node
    if (checkLocation("/tmui/Control/jspmap/tmui/locallb/node/create.jsp")) {
        dlog("Nodes | Create");
        
        // Add doubleclick for monitor select boxes
        addMonitorListDoubleClick();
    }
 


// ***********************************
// ***** SECTION: Monitors ***********
// ***********************************

    // Monitor Instances List
    if (checkLocation("/tmui/Control/jspmap/tmui/locallb/monitor/instances.jsp")) {
        dlog("Monitors | Instances");
        addNetworkMapLink(0, function(row) {
            return $($("td", row)[1]).text().trim() + ":" + $($("td", row)[2]).text().trim();
        });
    }
