// ==UserScript==
// @name BigiIP UI Tweaks
// @version 0.5
// @description Tweaks the F5 UI
// @match https://*/tmui/Control/*
// @match https://*/sam/admin/reports/*
// @run-at          document-end
// @grant none
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==
 
/***************************************************************************************
	
    This script is meant to enhance the GUI of the LTM in a non intefering way     
    
    Version history:
	
	Version		Change
	0.1			Original version
	0.2			Make sure that the script is not executed when not needed
	0.3			Adding noConflict to avoid problems with F5's javascripts
    0.4         Adding iRule links in the virtual server resources tab
	0.5			Adding default settings when creating pools and monitors
*/
 
/***************************************************************************************
						Begin Config section
****************************************************************************************/
 
	
	/**************************************************************
		How many rows do you want the iRule definition textarea to show
		
		Default:
		iRuleDefinitionRows = 35;
	***************************************************************/
	iRuleDefinitionRows = 35;
	
	
	/**************************************************************
		How many rules you want to see in the rule assignment window
		
		Default:
		iRulesCount = 40;
	***************************************************************/
	iRulesCount = 40;
	
	/**************************************************************
		How many monitors you want to show in the monitor selection
		
		Default:
		MonitorCount = 30;
	***************************************************************/
	MonitorCount = 30;
 
	/**************************************************************
		How many data group list entries to show
		
		Default:
		DatagroupListCount = 30;
	***************************************************************/
	DatagroupListCount = 30;
	
	/**************************************************************
		Set this to 1 if you want to catch tabs when writing iRulesCount
		
		Default:
		CatchTab = 1;
	***************************************************************/
	CatchTab = 1;
	
	/**************************************************************
		Set http monitor name default suffix
		
		Default: 
		HttpMonitorSuffix = "";
	***************************************************************/
	HttpMonitorSuffix = "";
	
	/**************************************************************
		Set the default pool name
		
		Default:
		DefaultPoolName = "";
	***************************************************************/
	DefaultPoolName = "";
	
	/**************************************************************
		Set the default action on pool down
		
		Default:
		DefaultActionOnPoolDown = 0;
		
		Options:
		0 = None
		1 = rejected
		2 = drop
	***************************************************************/
	DefaultActionOnPoolDown = 0;
	
	/**************************************************************
		Set the default action on pool down when creating pools
		Default = 0;
		
		Options:
		0 = Round Robin
		1 = Ratio (member)
		2 = Least Connections (member)
		3 = Observed (member)
		4 = Predictive (member)
		5 = Ratio (node)
		6 = Least connections (node)
		7 = Fastest (node)
		8 = Observed (node)
		9 = Predictive (node)
		10 = Dynamic Ratio (node)
		11 = Fastest (application)
		12 = Least sessions
		13 = Dynamic ratio (member)
		14 = Weighted Least Connections (member)
		15 = Weighted Least Connections (node)
		16 = Ratio (session)
		17 = Ratio Least connections (member)
		18 = Ratio Least connections (node)
	**************************************************************/
	DefaultLBMethod = 0;
	
	/**************************************************************	
		Choose Node List as default when creating pools 
		
		Default:
		ChooseNodeAsDefault = 0;
		
		Options:
		0 = No
		1 = Yes
	**************************************************************/
	ChooseNodeAsDefault = "0";
	
/***************************************************************************************
						End Config section
****************************************************************************************/
	
	//Make sure that the tampermonkey jQuery does not tamper with F5's scripts
	this.$ = this.jQuery = jQuery.noConflict(true);

	//console.log(window.location);
	
	function checkLocation(str) {
		return (window.location.href.indexOf(str) >= 0);
	}
	
	function endsWith(str, suffix) {
		return str.indexOf(suffix, str.length - suffix.length) !== -1;
	}
	
	function getParameterByName(name) {
		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	    	results = regex.exec(location.search);
		return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}
	
	

	if($('textarea#rule_definition').length){
		//Change the iRule definition row count
		$('textarea#rule_definition').attr('rows', iRuleDefinitionRows);
		
		//Catch tabs in the text areas
		if(CatchTab == 1){
			$("textarea").keydown(function(e) {
				if(e.keyCode === 9) { // tab was pressed
					// get caret position/selection
					var start = this.selectionStart;
					var end = this.selectionEnd;
 
					var $this = $(this);
					var value = $this.val();
 
					// set textarea value to: text before caret + tab + text after caret
					$this.val(value.substring(0, start) + "\t" + value.substring(end));
 
					// put caret at right position again (add one for the tab)
					this.selectionStart = this.selectionEnd = start + 1;
 
					// prevent the focus lose
					e.preventDefault();
				}
			});
		}
	}

    
        
        
    // ASSIGNED iRULES for MONITORS
	if($("#monitor_rule").length && $("#available_monitor_select").length){
		//Change the monitor count
		$("#monitor_rule").attr('size', MonitorCount);
		$("#available_monitor_select").attr('size', MonitorCount);
                
        // Add dblclick ability to add/remove iRules
        $("#monitor_rule").dblclick(function() {  $("#available_monitor_select_button").click(); });
        $("#available_monitor_select").dblclick(function() { $("#monitor_rule_button").click(); });
	}


	if($('select#class_string_item').length || $('select#class_ip_item').length){
		//Change the data grouplist count
		$('select#class_string_item').attr('size', DatagroupListCount);
		$('select#class_ip_item').attr('size', DatagroupListCount);
	}
	
	//Set the default suffix of the HTTP monitors
	if($('select[name=mon_type]').length){
		if($('select[name=mon_type]').find(":selected").text().trim() == "HTTP"){
			
			monitorname = $('input[name=monitor_name]').attr("value");
			
			if($('input[name=monitor_name]').length && monitorname === "") {
				$('input[name=monitor_name]').attr("value", HttpMonitorSuffix);
			} else if ($('input[name=monitor_name]').length && !(endsWith(monitorname, HttpMonitorSuffix))) {
				monitorname = monitorname + HttpMonitorSuffix;
				$('input[name=monitor_name]').attr("value", monitorname);
			}
		}
	}
 
	//This function checks if an iRule exists or not
	function checkiRule(iRuleName){
		
        var iRuleLink = "https://" + window.location.host + "/tmui/Control/jspmap/tmui/locallb/rule/properties.jsp?name=" + iRuleName;
        var response = '';
		
		//Request the iRule page to see if the instance exists or not
		$.ajax({
			url: iRuleLink,
			type: "GET",
			beforeSend: function(xhr){xhr.setRequestHeader('X-Test-Header', 'test-value');},
			success: function(htmlresponse) { 
				response = htmlresponse;		
			},
			async: false
		});
		
		//Search for the string indicating if the instance exists or not
		if (response.indexOf("Instance not found") >= 0){
			return false;
		} else {
			return true;
		}	
	}
	
	//Get a cookie value. Used to get the current partition
	//Shamelessly stolen from http://www.w3schools.com/js/js_cookies.asp
	
	function getCookie(cname) {
		var name = cname + "=";
		var ca = document.cookie.split(';');
		for(var i=0; i<ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1);
			if (c.indexOf(name) === 0) return c.substring(name.length,c.length);
		}
		return "";
	}
	
	//Check if an iRules list in exists in the DOM
	//This one is a bit ugly because of iframes, F5's strange DOM tree and me not being able to find an alternative
	
	if($('div').find("table#rule_list").find("tbody#list_body").children().length){
		
		//Get all iRule rows from the iRule table
		irulerows = $('div').find("table#rule_list").find("tbody#list_body").children();
        
		for(i=0;i<irulerows.length;i++){
			
			//Get each iRule name without the white spaces
            tdcontent = $(irulerows[i]).children()[0].innerHTML.trim();    
			
			//Get the current partition
			currentpartition = getCookie("F5_CURRENT_PARTITION");
			
            var response = '';
            currentRule = $(irulerows[i]).children()[0];
            
            //Request the iRule page to see if the instance exists in Common or not
            $.ajax({
                url: "https://" + window.location.host + "/tmui/Control/jspmap/tmui/locallb/rule/properties.jsp?name=/Common/" + tdcontent,
                type: "GET",
                currentRule: currentRule,
                currenttdcontent: tdcontent,
                success: function(response) {
                    replaceContent(response, this.currentRule, this.currenttdcontent);
                    function replaceContent(response, currentRule, currenttdcontent){
                    if (response.indexOf("Instance not found") == -1){
                        $(currentRule)[0].innerHTML = currenttdcontent.replace(currenttdcontent, "<a href='https://" + window.location.host + "/tmui/Control/jspmap/tmui/locallb/rule/properties.jsp?name=/Common/" + currenttdcontent + "'>" + currenttdcontent + "</a>");
                     }
                    }
                },
                async: true
            });
 
            //Request the iRule page to see if the instance exists in the current partition or not
            $.ajax({
                url: "https://" + window.location.host + "/tmui/Control/jspmap/tmui/locallb/rule/properties.jsp?name=/" + currentpartition + "/" + tdcontent,
                type: "GET",
                currentRule: currentRule,
                currenttdcontent: tdcontent,
                currentpartition: currentpartition,
                success: function(response) {
                    replaceContent(response, this.currentRule, this.currenttdcontent, this.currentpartition);
                    function replaceContent(response, currentRule, currenttdcontent, currentpartition){
                    if (response.indexOf("Instance not found") == -1){
                        $(currentRule)[0].innerHTML = currenttdcontent.replace(currenttdcontent, "<a href='https://" + window.location.host + "/tmui/Control/jspmap/tmui/locallb/rule/properties.jsp?name=/" + currentpartition + "/" + currenttdcontent + "'>" + currenttdcontent + "</a>");
                     }
                    }
                },
                async: true
            });
            
            
			
        }
     }

	//Check if a pool is being created
	if($('#pool_name').find('input[name=name]').length){
		//Set the default pool name suffix 
		$('#pool_name').find('input[name=name]').attr("value", DefaultPoolName);
		//Set the default action on pool down value
		$('#action_on_service_down').find('option[value="' + DefaultActionOnPoolDown + '"]').attr("SELECTED", "");
		//Set the default LB Method
		$('#lb_mode').find('option[value="' + DefaultLBMethod + '"]').attr("SELECTED", "");
		//If configured, choose node as default when selecting pool members
		if(ChooseNodeAsDefault == "Yes"){
			$('#member_address_radio_address').attr("unchecked","");
			$('#member_address_radio_node').attr("checked","");
			$('#member_address_radio_node').click();
		}
	}
	 




    // **********************************************
    // ***** ACCESS POLICIES ************************
    // **********************************************
        /***** Access Profile List *****/
        if (checkLocation("/tmui/Control/jspmap/tmui/accessctrl/profiles/") || checkLocation("/tmui/Control/form?__handler=/tmui/accessctrl/profiles/list&__source=list_apply&__linked=false&__fromError=false")) {
            console.log("Checking access profile list");
            
            var rows = $("table#list_table tbody tr");
            for (var i=0; i<rows.length; i++) {
                var img = $(rows[i]).find('img[src*=status_flag_yellow]');
                if (img.length > 0) {
                    // Make an A tag with onclick
                    var el = $("<a href='#' style='background: #ffcccc;padding: 5px;border: solid 1px #ff0000;'></a>");
                    el.append(img.clone());
                    el.click(function() {
                        console.log("Testing"); 
                        
                        // Uncheck all the boxes
                        var tbody = $(this).closest("tbody");
                        tbody.find("input[type=checkbox]").attr('checked', false);
                        
                        // Check just this box
                        $(this).closest("tr")
                            .find("input[type=checkbox]")
                            .attr('checked', true);
                        
                        // Submit the form
                        $(this).closest("form").find("input[type=submit]#list_apply").click();
                    });
                    img.parent().html(el);
                }
            }
        }

var _isdebug = 1;
function dlog(o) { if (_isdebug) { console.log(o); } }

    $("<style type='text/css'> .tmLink {text-decoration:none;padding:1px 20px 1px 1px;background: rgba(150,150,0,.25) url(/xui/framework/images/icon_jump_menu.png) no-repeat 100% 50%;border:solid 1px rgba(150,150,0,.5);} .tmLink:hover {text-decoration:none !important; background-color: rgba(150,150,0,.35)}</style>").appendTo("head");
    dlog("Location: " + window.location.href);

    // **********************************************
    // ***** VIRTUAL SERVERS ************************
    // **********************************************
    // Selected/Available options | Add double click ability for selection/removal
    if (checkLocation("/tmui/Control/jspmap/tmui/locallb/virtual_server/properties.jsp")) {
        dlog("Virtual Servers | Properties");
        
        //  SSL Profile (client)
        $("#selectedclientsslprofiles").dblclick(function() { $("#availableclientsslprofiles_button").click(); });
        $("#availableclientsslprofiles").dblclick(function() { $("#selectedclientsslprofiles_button").click(); });

        //  SSL Profile (server)
        $("#selectedserversslprofiles").dblclick(function() { $("#availableserversslprofiles_button").click(); });
        $("#availableserversslprofiles").dblclick(function() { $("#selectedserversslprofiles_button").click(); });

        //  VLANs and Tunnels
        $("#selected_vlans").dblclick(function() { $("#available_vlans_button").click(); });
        $("#available_vlans").dblclick(function() { $("#selected_vlans_button").click(); });
    }

    // Load Balancing selections
    // This script will modify the VS resources page to add a new link for the default pool and persistence settings which will open a new window on the object's configuration page
    if (checkLocation("/tmui/Control/jspmap/tmui/locallb/virtual_server/resources.jsp")) {
        dlog("Virtual Servers | Resources");
        
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
                var a = $('<a id="' + aId + '" class="tmLink" data-link="' + o.link + '" style="visible:hidden;" onclick="" title="" onmouseover="" onmouseup="" onmousedown="" target="_blank" class="" href="" onmouseout="">Open ' + o.name + ' Configuration</a>');                
                eParent.append(a);

                // Add a change event to the selectbox so we can manage visibility and href for the pool link
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
    }
    
    if (checkLocation("/tmui/Control/form?__handler=/tmui/locallb/virtual_server/resources")) {
        dlog("Virtual Servers | Resources | iRule Selection");
        
        // Assigned iRules
        //   Make the width of the iRules selection page the same for both list boxes.
        if($("#assigned_rules").length && $("#rule_references").length){
            //Change the iRule selection choice
            assignedrules = $("#assigned_rules").attr('size', iRulesCount);
            rulereferences = $("#rule_references").attr('size', iRulesCount);

            // Sync widths of the select boxes
            var maxW = Math.max($("#assigned_rules").width(), $("#rule_references").width());
            $("#assigned_rules").width(maxW);
            $("#rule_references").width(maxW);

            // Add dblclick ability to add/remove iRules
            $("#assigned_rules").dblclick(function() {  $("#rule_references_button").click(); });
            $("#rule_references").dblclick(function() { $("#assigned_rules_button").click(); });
        }
    }


    // **********************************************
    // ***** SESSION REPORTS ************************
    // **********************************************
        // MANAGE SESSIONS page
        if (checkLocation("tmui/Control/jspmap/tmui/overview/reports/current_sessions.jsp")) {
            // This script will add an extra link on the "Manage Sessions" with the text "(show variables)". It will open the APM reports page displaying the session variables for that session
            //    This makes working finding the right session much simpler since we can search from the Manage Sessions screen and then open the session variables directly
            var table = $("#list_table");
            var tbody = $("#list_body", table);
            var as = $('a', tbody);
                as.each(function(idx, el) {
                    var aCopy = $(el).clone();
                    var newHref = aCopy.attr("href").replace("showSessionDetails=1", "showSessionDetails=2");
                    aCopy.attr("href", newHref);
                    aCopy.html("(show variables)");
                    aCopy.addClass("tmLink");
                    aCopy.css({float: "right"});
                    
                    var td = $(el).parent();
                    td.append(aCopy);
                });
        }

        // REPORTS page
        if (checkLocation("/sam/admin/reports/index.php")) {
            if (checkLocation("showSessionDetails=2")) {
                // This script will execute if the user clicked the "show variables" link from above and will automatically open the session variables reports
                var sid = getParameterByName("sid");
                // Need time for page to parse the settings necessary to build the report.
                window.setTimeout(function(){showSessionVariables(sid);}, 1000);
            }
        }



    // **********************************************
    // ***** POOLS **********************************
    // **********************************************
        // POOL LIST
        if (checkLocation("/tmui/Control/jspmap/tmui/locallb/pool/list.jsp")) {
            // This script will add a link to the pools list that opens a new Network Map window with the search text of this pool name (including the "Search in iRule" option
            var table = $("#list_table");
            var tbody = $("#list_body", table);
            var trs   = $("tr", tbody);
            trs.each(function(idx, el) {
                var td = $($("td", el)[2]);
                var name = td.text().trim();
                var a = $('<small style="float:right"><a class="tmLink" data-link="' + name + '" target="_blank" href="/tmui/Control/form?form_page=%2Ftmui%2Flocallb%2Fnetwork_map.jsp&show_map=1&SearchString=' + name + '&irule_body=true">(show net map)</a></small>');
                td.append(a);
            });
        }
