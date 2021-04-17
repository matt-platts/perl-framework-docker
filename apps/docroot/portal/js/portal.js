/*
 * File: portal.js
 * Meta: Main functions for rendering data from the lookup API calls 
*/


/* 
 * Function: searchFor
 * Param: what (string) - the serial number we are searching for
 * Meta: Accessor method for the search api. Places whatever we are searching for in the search text field, and fires the click event on the #go element 
*/
function searchFor(what){
	document.forms['searchForm'].elements['search'].value=what; // In case called from elsewhere we fill in the search field for referencing back to it.
	go.click(); // this functionality is in bclp_ext_tabs.js as it is all done as part of the tabs object. It's the handler part of Ext.widget with id 'go'
	//$("#go").click(); // this functionality is in bclp_ext_tabs.js as it is all done as part of the tabs object. It's the handler part of Ext.widget with id 'go'
}


/*
 * Function: json_get
 * Meta: Make calls to the api endpoints to get serial number data. Can be Talend API data, or Entitlements data. 
 * 	 Function reads the url and acts accordingly
 * 	 This function is called from the click event on the #go element in bclp_ext_tabs.js
*/
function json_get(url,el){

	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.onload = function() {

		// 1. Success
		if (this.status >= 200 && this.status < 400) {
			console.log("Response from " + url, this.response);
			logMessage(this.response);
			var data = JSON.parse(this.response);

			if (!this.response){
				alert("The response from the server was empty.");
			}

			if (data.errorMessage){
				if (data.errorCode=="SEARCH1" || data.errorCode=="LOG1"){ // user not logged in
					//alert("Yes! '" + data.errorMessage + "','" + data.errorCode + "'");
					$("#info_" + el).html(data.errorMessage + "<p>Serial number entered: " + document.getElementById("search").value + "</p>");
					Ext.getCmp('loginWindow').center();
					$("#overlay").fadeIn();
					Ext.getCmp('loginWindow').show();
					if (document.getElementById("search").value && top.loginframe.document.forms['loginForm']){
						top.loginframe.document.forms['loginForm'].elements['load_after_login'].value = document.getElementById("search").value;
						Ext.getCmp("tabPanel").getActiveTab().close();
					}
				} else if (data.errorCode=="SEARCH2"){
					targetEl = "info_" + el;
					currentHTML = document.getElementById(targetEl).innerHTML; 
					newHTML = "<p style='text-align:center'>" + "The serial number entered does not fit the required format" + "</p>";
					document.getElementById(targetEl).innerHTML = newHTML;
					//Ext.getCmp("tabPanel").getActiveTab().close();
				} else if (data.errorCode=="SEARCH3"){
					alert("Invalid input - serial number should contain exactly 10 digits");
				} else {
					alert(data.errorMessage);
				}
			} else {

				// Entitlements
				if (url.match(/get_entitlement/)){

					logMessage("Entitlements:");
					logMessage(data.content.Entitlements);
					//logMessage(data.content.Specs);
					
					var entitlementData = "";
					if (Object.keys(data.content.Entitlements).length>0){
						entitlementData = "<p><b>Bundles:</b></p>";
					}
					for (x in data.content.Entitlements){
						entitlementData = entitlementData + "<p style='font-weight:bold'>" + x + "</p>";
						for (y in data.content.Entitlements[x]){	
							entitlementData = entitlementData + y + " - " + data.content.Entitlements[x][y] + "\n";
						}
					}

					var specData="";
					if (Object.keys(data.content.Specs).length>0){
						var specData = "<p><b>Subscriptions:</b></p>";
					}
					for (x in data.content.Specs){
						specData = specData + "<p style='font-weight:bold'>" + x + "</p>";
						for (y in data.content.Specs[x]){
							var print_y = y.camelCaseToRegular();
							specData = specData + print_y + ": " + data.content.Specs[x][y] + "\n";
						}
					}

					output = "";
					if (Object.keys(data.content.Entitlements).length == 0 && Object.keys(data.content.Specs).length == 0){
						output = "<p class='error'>No data found from entitlements/subscriptions server.</p>";
					} else {
						output += entitlementData + specData;
					}
					$("#entitlement_data_" + el).html(output.replace(/\n/g,"<br />"));
					
					//$("#entitlements_loading_" + el).hide();
					//$(".entitlements_loader").remove();
				// End Entitlements

				// Search normal
				} else if (url.match(/search\/search_for/)){

					var this_serial = url.split("/").pop();

					$("#info_" + el).html("<h2>Asset overview</h2>");
					var spinner = '<img class="entitlements_loader" src="images/spinner.gif" id="entitlements_loading_"' + el + '" />';

					output = "<div style=\"float:right\">";

						// old version of subsc data
						//output += "<div style=\"float:right; clear:both; padding:10px; background-color:#1b2c76; border:0px #c1c1c1 solid; border-radius:5px; position:relative; top:-50px;\"><h3 style='margin:0px; width:100%; font-weight:bold; color:#fff; font-size:12px; margin-bottom:5px;'>Entitlements and Subscriptions server: <span style='float:right'><a href='javascript:appliance_sync(\"" + el + "\")' style='color:#fff' id='sync_button_" + el + "' class='appliance_sync_button'>Sync</a></span></h3><div id=\"entitlement_data_" + el + "\" style=\"background-color:#fff; padding:7px; border-radius:4px; width:370px;\">Contacting subscriptions server.. " + "<br /><br />" + spinner + "</div></div>";

						//new autosync version of subsc data
						if (this_serial.match(/\d{10}/)){
						} else {
							output += "<div class=\"infoblock\"><h3 style='margin:0px; width:100%; font-weight:bold; color:#fff; font-size:12px; margin-bottom:5px;'>Entitlements and Subscriptions server:</h3><div id=\"sync_data" + el + "\" style=\"background-color:#fff; padding:7px; border-radius:4px; width:370px;\">This is a component - no sync info</div></div>";
						}

						output += "<br clear=\"all\" /><br />";

						//phs
						output += "<div class=\"infoblock\" style=\"\"><h3 style='margin:0px; width:100%; font-weight:bold; color:#fff; font-size:12px; margin-bottom:5px;'>Phone home service: <span style='float:right'><a href='javascript:appliance_phs(\"" + el + "\")' style='color:#fff' id='phs_button_" + el + "' class='appliance_sync_button'><!--Full PHS Report//--></a></span></h3><div id=\"phs_overview_" + el + "\" style=\"background-color:#fff; padding:7px; border-radius:4px; width:370px; height:190px;\">";
						output += el;
						output += "</div></div>";

						output += "<br clear=\"all\" /><br />";

						output += "<div style=\"float:right; margin-left:5px; padding:10px; background-color:transparent; border:1px #c1c1c1 solid; border-radius:5px; position:relative; top:-50px; width:390px;\"><span style='margin:0px; font-weight:normal; font-size:10px; margin-bottom:5px;'>Raw API data: <span id='view_raw_" + this_serial + "' class='view_raw_data' onClick='showRaw(\""+this_serial+"\")'>View</span></span><textarea id='raw_" + this_serial + "' style='display:none' readonly rows=10 cols=43>" + this.response.replace(/,/g,"\n") + "</textarea></div><br clear=\"all\" /><br />";

					output += "</div>\n";

					$('#info_' + el).append(output);
					$('#info_' + el).append("<div style=\"float:left\">");

					/* Asset */
					$('#info_' + el).append(format_asset_data(data,el));
					/* load private note */
					load_private_note(el);
					getPhsOverview(el);


					/* Components */
					if (data.content.Asset['SerialNumber']!=undefined) {
						$('#info_' + el).append("<p><b>Component Information:</b> ");
						if (ALLOW_EDITING){
							$('#info_' + el).append("<button onClick=\"addComponent('" + this_serial + "')\">Add new component</button>");
						}
						$('#info_' + el).append("</p>");
					}

					// lets set data content components to the licensableComponents
					data.content.Components = data.content.Asset.LicensableComponent;
					if (data.content.Components && data.content.Components.errorMessage){
						$("#info_" + el).append("<p class='error'>This appliance does not have any components:<br /><br />API response: '" + data.content.Components.errorMessage + "'</p> <p>Serial number entered: " + this_serial + "</p>");
					} else if (data.content.Components) {

						$('#info_' + el).append(format_components(data.content.Components));
						$("#info_" + el).append("</div>");

					} else {
						if (data.content.Asset['SerialNumber']!=undefined){
							$("#info_" + el).append("No components");
						}
					}

					/* Asset data */
					if (data.content.Asset){
						var assetData;
						for (x in data.content.Asset){
							assetData = assetData + x + " - " + data.content.Asset[x] + "\n";
						}
					}

					if (data.content.Asset['SerialNumber']){
						//entitlements_url= API_PATH + "entitlement/get_entitlement/serial_no/" + data.content.Asset['SerialNumber'];
						//json_get(entitlements_url, el);
					} else {
						end_div = "entitlement_data_" + url.split("/").pop(); // get serial as it is last part of url
						document.getElementById(end_div).innerHTML="Server did nont return any data.";
					}
					
				// Remove component
				} else if (url.match(/component\/remove/)){
					console.log(data);
					alert("Component removed successfully - please reload this tab to get updated data from the server.");
					

				} else if (url.match(/sync/)){ // for syncing a specific entitlement
					if (data.success){
						reloadSerialNumberByTab(data.content.serial_number);
					} else {
						console.log(data);
						alert("Error in syncing - please check the console");
					}
				// add note
				} else if (url.match(/add_note/)){
						alert("Note updated successfully.");

				// Unknown
				} else {
					if (el){
						if (!el.match(/phs_overview_tabs/)){ // MATTPLATTS
							document.getElementById(el).innerHTML = json_exploder(data.content);
						}
					} else {
						alert("Front end is not sure what to do with the response from the request to " + url);
					}
					console.log(data);
				}

				if (url.match(/menu\/draw/)){ // need to attach the click event for drawring the menu
					$(".header_menu_item").click(function(){
						openTabAccessor($(this).attr("rel"),$(this).html());
					});
				}
			}

		// 2. Error
		} else if (this.status==401){
			//alert("You are not logged in.");	
			Ext.getCmp('loginWindow').center();
			$("#overlay").fadeIn();
			Ext.getCmp('loginWindow').show();
			if (document.getElementById("search").value && top.loginframe.document.forms['loginForm']){
				top.loginframe.document.forms['loginForm'].elements['load_after_login'].value = document.getElementById("search").value;
				Ext.getCmp("tabPanel").getActiveTab().close();
			}
		} else if (this.status==404){
			alert("404 Error - Resource not found at: " + url);
		} else {
		       // We reached our target server, but it returned an error - this is picked up using request.onerror so nothing to worry about here.
			alert("Unexpected HTTP status response from server. Status " + this.status + " was received for  Url: " + url);	
		}
	};

	request.onerror = function() {
		alert("There was a connection error - unable to connect to target server." + this.status);
	};
	    
	request.send();
}


/* 
 *  Function: json_exploder
 *  Meta: Explodes json apart and prints key=value pairs. Data in nested arrays is automatically indented, by way of calling this function recursively. 
 *  Param: input (json format) - REQUIRED. The json data
 *  Param: loop (number) - OPTIONAL. Keeps track of how far in nested json structures we are as this is a recursive function - used for indenting successively. 
 *  	   NB: Indenting is simply done with non-breaking spaces at this time.
*/
function json_exploder(json_input,loop){

	var json_output = "<dl>";
	var i;
	var x;

	// we may have only a string - this should fix it
	if (typeof(json_input)=="string"){
		return json_input;
	}
	
	for (x in json_input){
	logMessage(typeof(json_input[x]));

		if (typeof(json_input[x]) == "object" && json_input[x] !== null){

			for (i=0;i<loop;i++){ json_output +="&nbsp; "; } // indent

			if (x != "0"){
				json_output += "<span style='text-decoration:underline; margin-top:5px; display:inline-block;'>" + x + "</span>";
			}
			json_output += json_exploder(json_input[x],loop+1);
			json_output += "";

		} else if (typeof(json_input[x])== "string") {
			for (i=1;i<loop;i++){
				json_output +="&nbsp; ";
			}
			json_output += "" +x + ": " + json_input[x] + "<br />";
		}
	}
	return json_output + "</dl>";
}


/* 
 * Function: format_asset_data 
 * Meta: reads the json data for the asset and formats it for the portal. 
*/
function format_asset_data(data,el){
	
	var output = "";

	if (data.content.Asset['SerialNumber']==undefined){
		output = "<p class='errormsg'>No asset data found for serial number " + document.forms['searchform'].elements['searchfor'].value + ".</p>";
	} else {
		output += '<p><b>Serial number: </b><span class="ui-li-aside">'+ data.content.Asset['SerialNumber'] +'</span>';
		output += '<div style="float:right; margin-right:24px;">';
		output += ' <span id="note_' + data.content.Asset['SerialNumber'] + '" class="add_note" title="Add a note to yourself about this appliance" onClick="addNote(\'' + data.content.Asset['SerialNumber'] + '\')">[ Add note ]</span>';

		$('#info_' + el).append("<span style='align:right; text-align:right; float:right;'><a alt=\"Reload data\" title=\"Reload appliance data\" onClick=\"reloadSerialNumberByTab('" + data.content.Asset['SerialNumber'] + "')\" style=\"\" alt=\"Reload tab\" class=\"reloadTab\">&#8635;</a></span>");
		output += "</div>";

		output += '<div class="component_infoblock">';
		output += '<span class="ui-li-aside"><b>'+ data.content.Asset['ProductName'] +'</b></span><br />';
		output += '<span class="ui-li-aside">'+ data.content.Asset['ProductDescription'] +'</span><br />';
		output += '</div><br /><br />';

		output += '<div id="AssetIntro_' + data.content.Asset['SerialNumber'] + '">';
		output += 'Status: <span class="ui-li-aside">'+ data.content.Asset['Status'] +'</span><br />';
		output += 'Install Date: <span class="ui-li-aside">'+ data.content.Asset['StartDate'] +'</span><br />';
		//if (data.content.Entitlement && data.content.Entitlement['ExpirationDate']){
		//	output += 'Entitlement Expiry Date: <span class="ui-li-aside">'+ data.content.Entitlement['ExpirationDate'] +'</span><br />';
		//} else if (data.content.Asset.LicensableComponent[0]['ExpirationDate']){// //-->component serials
		//	output += 'Expires: <span class="ui-li-aside">' + data.content.Asset.LicensableComponent[0]['ExpirationDate'] + '</span><br />';;
		//}
		
		console.log(data.content.Asset);
		//output += 'Expires: <span class="ui-li-aside">' + data.content.Asset.LicensableComponent[0]['ExpirationDate'] + '</span><br />';;
		output += 'Expires (SW): <span class="ui-li-aside">' + data.content.Asset['SW_ExpirationDate'] + '</span><br />';
		output += 'Expires (HW): <span class="ui-li-aside">' + data.content.Asset['HW_ExpirationDate'] + '</span><br />';

		if (data.content.Asset['ParentSerialNumber']){
			output += 'Parent Serial No: <span class="ui-li-aside"><a href="Javascript:searchFor(\'' + data.content.Asset['ParentSerialNumber'] + '\')">' + data.content.Asset['ParentSerialNumber'] + '</a></span><br />';;
		}

		if (data.content.Asset.LicensableComponent[0]){
		if (data.content.Asset.LicensableComponent[0]['ParentSerialNumber']){
			output += "Attached to: ";
			for (inc=0;inc<data.content.Asset.LicensableComponent.length;inc++){
				output += "<a href=\"Javascript:searchFor('" +  data.content.Asset.LicensableComponent[inc]['ParentSerialNumber']  + "')\">"  +  data.content.Asset.LicensableComponent[inc]['ParentSerialNumber'] + "</a>";
				output += "  ";
			}
			output += "<br />";
		}
		}

		if (data.content.Asset['EndUserAccountName']){
			output += 'Account: <span class="ui-li-aside">' +  data.content.Asset['EndUserAccountName'] + '</span><br />';
		}
		//output += 'Product Line: <span class="ui-li-aside">'+ data.content.Asset['ProductLine'] +'</span><br />';
		output += '</div>';
		/* Lets not bother with too much information up front..
		output += 'Activation Code: <span class="ui-li-aside">'+ data.content.Components['ActivationCode'] +'</span><br />';
		output += 'Product part no: <span class="ui-li-aside">'+ data.content.Components['ProductPartNumber'] +'</span><br />';
		output += 'Internal id: <span class="ui-li-aside">'+ data.content.Components['InternalId'] +'</span><br />';
		output += 'Demo: <span class="ui-li-aside">'+ data.content.Components['DemoCount'] +'</span><br />';
		output += 'Status: <span class="ui-li-aside">'+ data.content.Components['Status'] +'</span><br />';
		output += 'Error Message: <span class="ui-li-aside">'+ data.content.Components['errorMessage'] +'</span><br />';
		output += 'Error Status: <span class="ui-li-aside">'+ data.content.Components['ErrorStatus'] +'</span><br />';
		*/

		/*output += '<a class="showAssetData" onClick="$(\'#assetData_' + el + '\').fadeIn(); $(this).hide(); $(\'#AssetIntro_' + el + '\').hide();">[+] Show all Asset data</a><div id="assetData_' + el + '" style="display:none;">'; */

		output += '<br /><button id="button_show_asset_data_' + el + '" style="margin-top:1px" class="showAssetData" onClick="showFullAssetData(this,\'' + el + '\')">[+] Show all Asset data</button>';
		output += '<div id="assetData_' + el + '" style="display:none;">';

		var assetOnlyData = JSON.parse(JSON.stringify(data.content.Asset)); // deep copy
		delete assetOnlyData['LicensableComponent'];
		output += json_exploder(assetOnlyData,1);
		output += "</div>\n";
	}
	return output; 
}

/* 
 * Function: format_components
 * Param: data - string (json formatted data)
 * Meta: format components section of returned json data
*/
function format_components(data){

	//console.log(data);
	console.log("Reached format components");
	console.log(data);
	plural= (data.length==1)? "": "s";

	var output = "";
	if (data.length>0){
		output = "<p style='font-weight:bold'>This product contains " + data.length + " component" + plural + ":</p>";
	}
	output += "<ul style='list-style-type:none; margin:0; padding:0;'>";

	for (i=0;i<data.length;i++){
		//console.log("Component data: ",data[i]);
		output += "<li><div id=\"Component_" + data[i]['SerialNumber'] + "\" style=\"background-color:#f1f1f1; border:1px gray solid; border-radius:5px; width:450px; max-width:450px; padding:4px; margin-bottom:5px;\"><b>";
		output += data[i]['ProductName'] + "</b> - " + data[i]['ProductDescription'];
		if (data[i]['TrialLicense']){
			output += "<span style='color:#cc0000; font-weight:bold'>&nbsp;" + data[i]['TrialLicense'] + "</span>";
		}
		if (ALLOW_EDITING){
		output += " [ <a href=\"Javascript:removeComponent('" + document.forms['searchForm'].elements['search'].value + "','" + data[i]['SerialNumber'] + "')\">Remove</a> ] ";
		}
		output += "<br />";
		output += "Serial No: " + data[i]['SerialNumber'] + "<br />";
		output += "Platform: " + data[i]['ProductPlatform'] + "<br />Part No: " + data[i]['ProductPartNumber'] + "<br />";
		output += "Model: " + data[i]['ProductModel'] + "<br />Users: " + data[i]['Users'] + "<br />";
		output += "ActivationCode: " + data[i]['ActivationCode'] + "<br />";
		//output += "DemoCount: " + data[i]['DemoCount'] + "<br />";
		output += "<div style=\"margin-top:10px;\"><b>Entitlement data:</b> <br />";

		//if (data[i]['Entitlements']['errorMessage']=="No data found for given SerialNumber."){
		//	output += "<span class='error'>" + data[i]['Entitlements']['errorMessage'] + "</span>";
		//} else {
			output += "Start date: " + data[i]['StartDate'] + "<br  />Expiry date: " + data[i]['ExpirationDate'] + "<br  />";
			//delete data[i]['ExpirationDate'];
			//for (ent in data[i]['Entitlements']){
				//output += ent + ":" + data[i]['Entitlements'][ent] + "<br />";
			//}
		//}

		output += "<br /><!--<b>Component full asset data</b>//-->";

		var sub_output = json_exploder(data[i],1);
		console.log("sub output");
		console.log(sub_output);
		output += '<a class="showAssetData" style="clear:left; display:block;" id="ComponentAssetIntro_' + data[i]['SerialNumber'] + '" onClick="showFullComponentAssetData(this,\'' + data[i]['SerialNumber'] + '\')">[+] View all component data</a>';
		output += '<div id="ComponentAssetData_' + data[i]['SerialNumber'] + '" style="display:none;">';
		output += sub_output;
		output += "</div>";
		output += "</div></div>";
		output += "<!--<hr size=1 style='height:1px'/>//--></li>";
	}

	output += "</ul>";
	if (data.length==0){
		output += "<p style='color:#990000'>No components to show.</p>";
	}
	return output;
}


/*
 * Function: showFullAssetData
 * Param clickElement (object) - the element that was clicked
 * Param: serial (string) - serial number - used to relate to the tab, div id etc
 * Meta:
 * Simply displays the full asset data that is hidden on the page by default.
 */
function showFullAssetData(clickElement,serial){
	$('#assetData_' + serial).fadeIn();
	$('#AssetIntro_' + serial).hide();
	$(clickElement).hide();

}

function showFullComponentAssetData(clickElement,serial){
	$('#ComponentAssetData_' + serial).fadeIn();
	$('#ComponentAssetIntro_' + serial).hide();
	$(clickElement).hide();
}

/*
 * Function: reloadSerialNumberByTab
 * Param: tabId (string) - this is actually the serial number of the appliance - the tabs are given these same ids
 * Meta: Reloads a tab containing a new search for a serial number.
 * 	 Note that the searchFor function automatically takes care of adding the tab, so here we just remove the tab and re-search
 */
function reloadSerialNumberByTab(tabId){
	//Ext.getCmp('tabPanel').remove(Ext.getCmp('tabPanel').getActiveTab().id); // only removes the active tab
	Ext.getCmp('tabPanel').remove(tabId); // works better but still removes and replaces the tab at the end of the list - it would be better to refresh the tab content.
	searchFor(tabId); 
}

/*
 * Function: addComponent
 */
function addComponent(applianceSerial){

	var promptMessage = "Please enter the serial number of the component you wish to add.<br />This should be in the format: XXXXX[_-]XXXXX.";
	Ext.MessageBox.prompt('Add component',promptMessage,promptResponse);

	function promptResponse(btn,component_serial) {

		if (btn=="ok"){
			var addUrl = API_PATH + "component/add/serial_no/" + applianceSerial + "/component_serial_no/" + component_serial + "/";
			json_get(removeUrl,"NONE");
		} else {
			alert("No new component was added.");
		}

	}

}

/*
 * Function: removeComponent
 * Param: parent_serial - serial number of the appliance itself
 * Param: component_serial - serial number of the component to be removed
 */
function removeComponent(parent_serial,component_serial){

	var confirmMessage = "Are you sure that you want to remove component " + component_serial + " from appliance " + parent_serial + "?";
	Ext.MessageBox.confirm('Confirm',confirmMessage,checkConfirmation);

	function checkConfirmation(btn){

		if (btn=="yes"){
			var removeUrl = API_PATH + "component/remove/serial_no/" + parent_serial + "/component_serial_no/" + component_serial + "/";
			json_get(removeUrl,"NONE");
		} else {
			alert("Item not removed.");
		}
	}
}

/*
 * function: doSync
 * meta: Calls the api to sync a particular service
 */
function doSync(element,service,serial){

	document.getElementById(element).innerHTML="Syncing.. please wait - this tab will automatically refresh when complete.";

	url = API_PATH + "entitlement/sync/service/" + service + "/serial/" + serial + "/";

	json_get(url,"NONE");

	/*
	var sync_request = new XMLHttpRequest();
	sync_request.open('GET', url, true);
	sync_request.onload = function() {
		alert("DONE");
		if (this.status >= 200 && this.status < 400) {
			alert("ok");
		} else {
			alert("not ok");
		}
	}
	*/

}

/*
 * function: validateSearchform
 * meta: checks for 10 digits only (needs to be expanded to also take the old style packet shaper serial numbers. NOT YET USED IN PRODUCTION.
*/
function validateSearchForm(){
	var reg = /^\d{10}$/;
	if (reg.test(document.forms[0].elements[0].value)){
		searchFor (document.forms[0].elements[0].value);
	} else {
		alert("Illegal value entered of " + document.forms[0].elements[0].value + " - must be 10 digits");
	}
}


/*
 * function: getAccountDetails
 * meta: displays account information from a user name
 */
function getAccountDetails(){
	showSpinner("account_result");
	value = document.forms['account'].elements['username'].value;
	url = API_PATH + "account/getAccount/username/" + value + "/";
	json_get(url,"account_result");
}

/*
 * function: searchMultiple
 * meta: a wrapper round searchFor(serial) - which itself pops open a tab and displays info on an appliance serial number.
 * 	 - consequently displays multiple tabs
*/
function searchMultiple(){
	var snList = document.forms['multisearch'].elements['multisearch_input'].value.split(/[,=;:'"&\s+\t\r\n]/)

	for (i=0;i<snList.length;i++){
		console.log("On " + snList[i]);
		if (snList[i].match(/^\d+$/)){
			console.log(' - number match');
			if (snList[i].length%10==0){
			console.log(' - - modulo match');
				appliances=snList[i].match(/.{1,10}/g);
				console.log(appliances);
				for (j=0;j<appliances.length;j++){
					searchFor(appliances[j]);
				}
			}
		}

	}
}

/* 
 * function checkComponent
 * meta: display data on a component by its XXXXX_-XXXXX serial number
*/
function checkComponent(){
	showSpinner("component_result");
	value = document.forms['component_form'].elements['component_id'].value;
	if (!value){ alert("No serial entered"); }
	url = API_PATH + "component/getComponent/component_id/" + value + "/";
	json_get(url,"component_result");
}

/*
 * function checkComponentByActivationCode
 * meta: display data on a component by its activation code
*/
function checkComponentByActivationCode(){
	showSpinner("component_result");
	value = document.forms['component_form'].elements['activation_code'].value;
	if (!value){ alert("No code entered"); }
	url = API_PATH + "component/getComponentByActivationCode/activation_code/" + value + "/";
	json_get(url,"component_result");
}

/*
 * function: licenseSwap
 * meta: displays the product types on screen and checks if a swap is compatible - it does NOT actually do this yet. 
 */
function licenseSwap(){
	$.ajax({
		url: API_PATH + 'license/swap_check/',
		type: 'POST',
		data: $("#license_swap_form").serialize(),
		dataType: 'json',
		complete: function(jqXHR, textStatus){

			switch (jqXHR.status){
				case 200:
					data = JSON.parse(jqXHR.responseText);
					if (data.success == 1){
						if (!data.content.serial_from){ data.content.serial_from = "Serial no. does not exist"; }
						if (!data.content.serial_to){ data.content.serial_to= "Serial no. does not exist"; }
						$("#description_from").html(data.content.serial_from);
						$("#description_to").html(data.content.serial_to);
						$("#compatibility_info").html(data.content.compatibility_info);
						if (data.content.compatibility_result ==1){
							$("#compatibility_info").css("color","green");
						} else {
							$("#compatibility_info").css("color","red");

						}
					} else {
						$("#compatibility_info").html(data.content);
						$("#compatibility_info").css("color","red");

					}
				break;
				default:
					alert("HTTP status error: " + jqXHR.status + " - " + textStatus);

			}
		}
	});

}

function licenseSwapDo(){
	alert("Do the swap - not yet tested");
}

function addNote(applianceSerial){

	var noteMessage = "Add/Edit a note on this serial number for your future reference:";
	Ext.MessageBox.prompt('Add note to ' + applianceSerial,noteMessage,noteResponse);

	function noteResponse(btn,myNote) {

		if (btn=="ok"){
			var addNoteUrl = API_PATH + "search/add_note/serial/" + applianceSerial + "/note/" + myNote + "/";
			json_get(addNoteUrl);
			updateField = "note_" + applianceSerial;
			$("#" + updateField).html(myNote);
			$("#" + updateField).css("clear","left");
			$("#" + updateField).css("display","block");
			$("#" + updateField).css("color","blue");
		} else {
			alert("No note was added.");
		}

	}
}

function clearNote(applianceSerial){

			var note="";
			var addNoteUrl = API_PATH + "search/add_note/serial/" + applianceSerial + "/note/" + myNote + "/";
			json_get(addNoteUrl);
			updateField = "note_" + applianceSerial;
			$("#" + updateField).html(myNote);
			$("#" + updateField).css("clear","left");
			$("#" + updateField).css("display","block");
			$("#" + updateField).css("color","blue");

}

function load_private_note(el){

	url = API_PATH + "search/get_note/serial/" + el + "/";

	var noteRequest = new XMLHttpRequest();
	noteRequest.open('GET', url, true);
	noteRequest.onload = function() {

		if (this.status >= 200 && this.status < 400) {
			console.log("Response from " + url, this.response);
			logMessage(this.response);
			var data = JSON.parse(this.response);
			if (data.content){
				$("#note_" + el).html(data.content);
				$("#note_" + el).append("<span id=\"clearNote_" + el + "\" class=\"clearNote\" onClick=\"clearNote('" + el + "')\">X</span>");
				/*
					$('.item-button').click(function(e) 
					     e.stopPropagation();
					*/
				document.getElementById("note_" + el).className="is_note";
			} else {
			}
		} else {
			alert("Illegal XHR status response");
		}

	}

	noteRequest.onerror = function() {
		alert("There was a connection error - unable to connect to target server.");
	};

	noteRequest.send();
}

function syncSubscription(){
	
	if (!document.forms['subsc_to_appliance_form'].elements['subsc_serial_no'].value || !document.forms['subsc_to_appliance_form'].elements['type'].value){
		document.getElementById("subsc_result").innerHTML = "<p class='error'>Please enter both a serial no. and a subscription type.</p>";
		return;
	} else if (isNaN(document.forms['subsc_to_appliance_form'].elements['subsc_serial_no'].value) || document.forms['subsc_to_appliance_form'].elements['subsc_serial_no'].length<10){
		document.getElementById("subsc_result").innerHTML = "<p class='error'>Serial no. is not valid.</p>";
		return;
	}
	showSpinner("subsc_result");

	$.ajax({
		url: API_PATH + 'subscription/sync/',
		type: 'POST',
		data: $("#subsc_to_appliance_form").serialize(),
		dataType: 'json',
		complete: function(jqXHR, textStatus){

			switch (jqXHR.status){
				case 200:
					data = JSON.parse(jqXHR.responseText);
					if (data.error){
						document.getElementById("subsc_result").innerHTML = "<p class='error'>" + data.errorMessage + "</p>";
					} else {
						document.getElementById("subsc_result").innerHTML = "<p class='success'>" + data.content.message + "</p>" + json_exploder(data.content);
					}
				break;
				default:
					alert("Invalid data sent to server - Error " + jqXHR.status + " received at " + API_PATH + "subscription/sync:" + $("#subsc_to_appliance_form").serialize());
					document.getElementById("subsc_result").innerHTML = "<p class='error'>Invalid data sent to server.</p>";
			}
		}
	});
}

function syncApplianceTab(serial) {
	url = "";
	url += serial + ""; 
	openTab(url,"Sync for " + serial);
}

function syncAppliance(){

	document.getElementById('syncframe').style.display='block';
	document.getElementById('syncframe').style.border="1px gray solid";
	var url = "http://subsc.symc.symantec.com:8080/entitlements/sync/update.cgi?sn=";
	url = "";
	var syncsrc = url + document.forms['subsc_sync_form'].elements['subsc_serial_no'].value;
	document.getElementById('syncframe').src = syncsrc; 
}

function showSpinner(el){
	document.getElementById(el).innerHTML='<p>Getting data from server.. <img style="margin-left:12px;" src="images/spinner.gif" /></p>';
}

/* 
 * function isValidSerial
 * meta: serial numbers should be either numeric or the old style packetshaper serials which may contain a hyphen and x digits (13?) - function currently not in use
 * param sn (string) - serial no. to check
*/
function isValidSerial(sn){

}

function showRaw(sn){
	document.getElementById("raw_" + sn).style.display="block";
	document.getElementById("view_raw_" + sn).style.display="none";
}

function decodeLicense(){

	document.getElementById('decode_lic_result').innerHTML='Getting data from server.. <img style="margin-left:12px;" src="images/spinner.gif" />';

	$.ajax({
		url: API_PATH + 'license/decode/',
		type: 'POST',
		data: $("#decode_license_form").serialize(),
		dataType: 'json',
		complete: function(jqXHR, textStatus){

			data = JSON.parse(jqXHR.responseText);
			$("#decoded_license").html(data.content);
			document.getElementById('decode_lic_result').innerHTML="";
			$('#decoded_license_div').fadeIn();
		}
	});

}

function appliance_sync(sn){
	title="Subscription sync ";
	//title="Subscription sync for " + sn;
	which="Subscriptions_Sync";

	var tabs = Ext.getCmp("tabPanel");
	var haveTabAlready=0;
	for (tabId in tabs.items.keys){
		logMessage(tabId,tabs.items.keys[tabId]);
		if (tabs.items.keys[tabId]==title){
			haveTabAlready=true;
		}
	}
	if (!haveTabAlready){
		openExtTab(which,title);
	} else {
		tabs.setActiveTab(title);
		document.forms['subsc_to_appliance_form'].elements['subsc_serial_no'].value=sn;
		document.getElementById("subsc_result").innerHTML=""; 
	}
}

function appliance_phs(sn){

	title="PHS Data";
	which="phs";

	var tabs = Ext.getCmp("tabPanel");
	var haveTabAlready=0;
	for (tabId in tabs.items.keys){
		logMessage(tabId,tabs.items.keys[tabId]);
		if (tabs.items.keys[tabId]==title){
			haveTabAlready=true;
		}
	}
	if (!haveTabAlready){
		openExtTab(which,title);
	} else {
		tabs.setActiveTab(title);
		document.getElementById('phs_single_serial').value=sn;
		document.getElementById('phs_placeholder').value=sn;
		document.getElementById("phs_data").innerHTML=""; 
	}

}

function extractSerials(){

	input = document.forms['extractForm'].elements['text_input'].value;
	words = input.split(/[,=;:'"&\s+\t\r\n]/);

	var appliances= Array();
	var components= Array();

	for (i=0;i<words.length;i++){
		// components
		if (words[i].match(/^\w{5}[\-_]\w{5}$/) || words[i].match(/[0-9]{8}-[0-9]{1}-[0-9]{1}/)){
			components.push(words[i]);
		}
		// appliances (10 digit only)
		if (words[i].match(/^\d+$/)){
			if (words[i].length%10==0){
				appliances=appliances.concat(words[i].match(/.{1,10}/g));
			}
		}
	}

	var appString = appliances.join("<br />");
	var appFeedString = "sn=";
	var appFeedString2 = appliances.join("&sn=");
	appFeedString = appFeedString +  appFeedString2
	var compString = components.join("<br />");
		
	if (appString){
		document.getElementById('extract_result').innerHTML = "<b>Appliance serial numbers:</b><br />" + appString + "<br /><br /><b>Component serial numbers:</b><br />" + compString + "<br /><br /><!--<b>Need to paste appliances as a query string?</b><br /><textarea rows='8' cols='50'>" + appFeedString + "</textarea>//-->";
	} else if (compString){
		document.getElementById('extract_result').innerHTML = "<b>Found the following component serial numbers:</b><br />" +  compString;
	} else{
		document.getElementById('extract_result').innerHTML = "No serials found"; 
	}

}

function getPhs(){
	url =  API_PATH + "phs/getPhs/";
	document.getElementById('phs_data').innerHTML='eee';
}

function getPhsForSerial(){
	url = API_PATH + "phs/getPhs/serial_no/";
	url += document.getElementById('phs_single_serial').value;
	json_get(url,"phs_data");
}

function getPhsOverview(serial){
	url = API_PATH + "phs/getPhsOverview/serial_no/";
	url += serial; 
	json_get(url,"phs_overview_" + serial);
}

function loadPhsIntoTab(serial){
	url = API_PATH + "phs/getPhs/serial_no/";
	url += serial + "/"; 
	openTab(url,"PHS for " + serial);
}

function themeSelect(val){
	removefile('css/userstyle-Black.css');
	removefile('css/userstyle-Plain.css');
	removefile('css/userstyle-Tech.css');
	removefile('css/userstyle-Bright.css');
	cssFile='css/userstyle-' + val + '.css';
	load_css(cssFile);
}

function checkFRS(){
	showSpinner("frs_result");
	value = document.forms['frs_form'].elements['frs_id'].value;
	if (!value){ alert("No serial entered"); }
	url = API_PATH + "frs/getFRS/frs_serial/" + value + "/";
	json_get(url,"frs_result");

}

function frsForm(){
	
	if (document.getElementById("addKey").style.display=="block"){
		document.getElementById("addKey").style.display="none";
	} else {
		document.getElementById("addKey").style.display="block";
	}
}

function sendFrsForm(){
	console.log("on sendFrsForm function");
	$.ajax({
		url: API_PATH + 'frs/update/',
		type: 'POST',
		data: $("#addKey").serialize(),
		dataType: 'json',
		complete: function(jqXHR, textStatus){
			data = JSON.parse(jqXHR.responseText);
			$("#frs_add_update_response").html(data.content);
		}
	});

	console.log("done sendFrsForm function");
}

function getLicenseKeyFile(){

	console.log("on getLicekseKeyFile");
	document.getElementById('get_lic_result').innerHTML='Getting data from server.. <img style="margin-left:12px;" src="images/spinner.gif" />';
	$.ajax({
		url: API_PATH + 'license/download/serial/' + document.getElementById('serialForLicense').value,
		type: 'POST',
		data: $("#decode_license_form").serialize(),
		dataType: 'json',
		complete: function(jqXHR, textStatus){
			data = JSON.parse(jqXHR.responseText);
			$("#lkf").text(data.content);
			$("#get_lic_result").html('');
			decodeLicense();
		}
	});

	console.log("done getLicenseKeyFile function");
}

function drawMenu(){
	console.log("Drawring menu");
        url = API_PATH + "menu/draw/";
        json_get(url,"menu"); // click events are now attached through special code in json_get function 
	//console.log("Menu not drawn - this has been disabled and menu still hard coded");
	console.log("Menu drawn - now to return");

}

function openTabAccessor(var1,var2){

        var tabTitle = $( "#tab_title" ),
        tabContent = $( "#tab_content" ),
        tabTemplate = "<li class='ui-tabs-active ui-state-active'><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>",
        tabCounter = 1000;

	var tabs = $( "#tabs" ).tabs();

	var label = var2, 
	id = "tabs-" + tabCounter,
	li = $( tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) ),
	tabContentHtml = tabContent.val() || "Tab " + tabCounter + " content.";

	tabs.find( ".ui-tabs-nav" ).append( li );
	tabs.append( "<div id='" + id + "' style='display:block; overflow:scroll; max-height:72vh;'><p>It's:" + tabContentHtml + "</p></div>" ); // append the new tab content
	tabs.tabs( "refresh" );
	tabCounter++;

	if ( $( ".ui-tabs-tab" ).length==0){
		$("#tabs").fadeOut();
		$("#intro").fadeIn();
	}

	// set the active tab
	var currentCounter=0;
        $( ".ui-tabs-tab" ).each(function( index ) {
        	$( this ).removeClass("ui-tabs-active ui-state-active");
                currentCounter++;
	});
	//alert("Have " + currentCounter + " tabs at the moment!");
	currentCounter--;
	$("#tabs").tabs( "option", "active", currentCounter);	

	loadStaticContent(var1,id);
}

function alertBox(message){
	document.getElementById('alertBox').innerHTML="<p>"+message+"</p>";
	$("#alertBox").dialog("open");

}
