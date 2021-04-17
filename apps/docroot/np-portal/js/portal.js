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
}


/* 
 * Function: openTab
 * Param: which (string) - title of tab to open (also relates to filename)
 * Meta: method of opening a new tab without having to go into ext.js code directly
*/
function openTab(which,title){

			var filename = which;

			apiMatch = new RegExp('/');
			if (filename.match(apiMatch)){
				filename = which;
			} else {
				filename = which.replace(" ","_").toLowerCase() + ".html";
			}

			var tabs = Ext.getCmp("tabPanel");
			if (tabs.items.length==0){
				$('.introtext').hide();
				$('#tabs').fadeIn();
			}


			var haveTabAlready=0;
			for (tabId in tabs.items.keys){
				logMessage(tabId,tabs.items.keys[tabId]);
				if (tabs.items.keys[tabId]==title){
					haveTabAlready=true;
				}
			}
			if (!haveTabAlready){
				tabs.add({
					    closable: true,
					    html: '<div id="info_' + title + '"><div style="width:100%; text-align:center;">Loading data for api:' + which + ' <br/><img style="margin:20px auto;" src="images/spinner.gif" /></div></div>',
					    autoLoad:{url:filename},
					    iconCls: 'tabs',
					    id: title,
					    title:title,
					    name: title
						}
				).show();
			} else {
				tabs.setActiveTab(title);
			}
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
				alertBox("The response from the server was empty.","ext-mb-error");
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
						//Ext.getCmp("tabPanel").getActiveTab().close();
					}
				} else if (data.errorCode=="SEARCH2"){
					Ext.getCmp("tabPanel").getActiveTab().close();
					alertBox("Serial number entered is not 10 digits long, or in the correct format for a component.","ext-mb-error");
				} else if (data.errorCode=="SEARCH3"){
					alertBox("Invalid input - serial number should contain exactly 10 digits","ext-mb-error");
				} else {
					alertBox(data.errorMessage,"ext-mb-error");
				}
			} else {

				// Search function only 
				if (url.match(/search\/search_for/)){

					var this_serial = url.split("/").pop();

					$("#info_" + el).html("<h2>Asset overview</h2>");
					var spinner = '<img class="entitlements_loader" src="images/spinner.gif" id="entitlements_loading_"' + el + '" />';

					output = "<div style=\"float:right\">";

						// old version of subsc data
						if (this_serial.match(/\d{10}/)){
						output += "<div class=\"infoblock\"><h3 style='margin:0px; width:100%; font-weight:bold; color:#fff; font-size:12px; margin-bottom:5px;'>Entitlements and Subscriptions: <span style='float:right'><button onClick='javascript:syncApplianceTab(\"" + el + "\")' style='position:relative; top:-3px;' id='sync_button_" + el + "' class='appliance_sync_button'>Sync</button></span></h3><div id=\"entitlement_data_" + el + "\" style=\"background-color:#fff; padding:7px; border-radius:4px; width:370px; height:460px; max-height:460px; overflow:scroll;\">Contacting subscriptions server.. " + "<br /><br />" + spinner + "</div></div>";

						//new autosync version of subsc data
						} else {
							output += "<div class=\"infoblock\"><h3 style='margin:0px; width:100%; font-weight:bold; color:#fff; font-size:12px; margin-bottom:5px;'>Entitlements and Subscriptions server:</h3><div id=\"sync_data" + el + "\" style=\"background-color:#fff; padding:7px; border-radius:4px; width:370px;\">This is a component - no sync info</div></div>";
						}

						output += "<br clear=\"all\" /><br />";

						//phs
						output += "<div class=\"infoblock\" style=\"\"><h3 style='margin:0px; width:100%; font-weight:bold; color:#fff; font-size:12px; margin-bottom:5px;'>Phone home service: <span style='float:right'><button style='position:relative; top:-3px' onClick='loadPhsIntoTab(\"" + el + "\")' id='phs_button_" + el + "' class='appliance_sync_button'>Full PHS Report</button></span></h3><div id=\"phs_overview_" + el + "\" style=\"background-color:#fff; padding:7px; border-radius:4px; width:370px; height:190px;\">";
						output += el;
						output += "</div></div>";

						output += "<br clear=\"all\" /><br />";

						//output += "<div style=\"float:right; margin-left:5px; padding:10px; background-color:transparent; border:1px #c1c1c1 solid; border-radius:5px; position:relative; top:-50px; width:390px;\"><span style='margin:0px; font-weight:normal; font-size:10px; margin-bottom:5px;'>Raw API data: <span id='view_raw_" + this_serial + "' class='view_raw_data' onClick='showRaw(\""+this_serial+"\")'>View</span></span><textarea id='raw_" + this_serial + "' style='display:none' readonly rows=10 cols=43>" + this.response.replace(/,/g,"\n") + "</textarea></div><br clear=\"all\" /><br />";

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
						$("#info_" + el).append("No components");
					}

					/* Asset data */
					if (data.content.Asset){
						var assetData;
						for (x in data.content.Asset){
							assetData = assetData + x + " - " + data.content.Asset[x] + "\n";
						}
					}

					if (data.content.Asset['SerialNumber']){
						// OLD Entitlement format which went through the xml from those pages
						entitlements_url= API_PATH + "entitlement/get_entitlement/serial_no/" + data.content.Asset['SerialNumber'];
						// NEW format (still not in use)
						//entitlements_url = API_PATH + "subscription/overview/serial/" + data.content.Asset['SerialNumber'] + "/";	
						json_get(entitlements_url, el);
					} else {
						end_div = "entitlement_data_" + url.split("/").pop(); // get serial as it is last part of url
						document.getElementById(end_div).innerHTML="Server did nont return any data.";
					}
					
				// All other queries 
				} else {
					if (el){
						document.getElementById(el).innerHTML = json_exploder(data.content);
					} else {
						alertBox("Front end is not sure what to do with the response from the request to " + url,"ext-mb-error");
					}
					console.log(data);
				}

				// need to attach the click event to the a tags for the menu/draw API
				if (url.match(/menu\/draw/)){ 
					$(".header_menu_item").click(function(){
						openTab($(this).attr("rel"),$(this).html());
					});
				}
			}

		// 2. Error
		} else if (this.status==401){
			//alertBox("You are not logged in.");	
			Ext.getCmp('loginWindow').center();
			$("#overlay").fadeIn();
			Ext.getCmp('loginWindow').show();
			if (document.getElementById("search").value && top.loginframe.document.forms['loginForm']){
				top.loginframe.document.forms['loginForm'].elements['load_after_login'].value = document.getElementById("search").value;
				Ext.getCmp("tabPanel").getActiveTab().close();
			}
		} else if (this.status==404){
			alertBox("404 Error - Resource not found at: " + url,"ext-mb-error");
		} else {
		       // We reached our target server, but it returned an error - this is picked up using request.onerror so nothing to worry about here.
			alertBox("Unexpected HTTP status response from server. Status " + this.status + " was received for  Url: " + url,"ext-mb-error");
		}
	};

	request.onerror = function() {
		alertBox("There was a connection error - unable to connect to target server." + this.status,"ext-mb-error");
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
			json_output += "" + x.camelCaseToRegular() + ": " + json_input[x] + "<br />";
		}
	}
	return json_output + "</dl>";
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
		alertBox("Illegal value entered of " + document.forms[0].elements[0].value + " - must be 10 digits","ext-mb-error");
	}
}



/*
 * function: searchMultiple
 * meta: a wrapper round searchFor(serial) - which itself pops open a tab and displays info on an appliance serial number.
 * 	 - consequently displays multiple tabs
*/
function searchMultiple(){

	var snList = document.forms['multisearch'].elements['multisearch_input'].value.split(/[,=;:'"&\s+\t\r\n]/)
	var goodSnList = new Array();

	for (i=0;i<snList.length;i++){


		//console.log("On " + snList[i]);
		if (snList[i].match(/^\d+$/)){
			//console.log(' - number match');
			if (snList[i].length%10==0){
				//console.log(' - - modulo match');
				appliances=snList[i].match(/.{1,10}/g);
				//console.log(appliances);
				for (j=0;j<appliances.length;j++){

					goodSnList.push(appliances[j]);

				}
			}
		}
	}


	console.log(goodSnList);
	loopThroughSearch(goodSnList);

}

function loopThroughSearch(splitText) {
    for (var i = 0; i < splitText.length; i++) {
        (function (i) {
            setTimeout(function () {
                console.log(splitText[i]);
                searchFor(splitText[i]);
            }, 500 * i);
        })(i);
    };
}

function showSpinner(el){
	document.getElementById(el).innerHTML='<p>Getting data from server.. <img style="margin-left:12px;" src="images/spinner.gif" /></p>';
}

function showRaw(sn){
	document.getElementById("raw_" + sn).style.display="block";
	document.getElementById("view_raw_" + sn).style.display="none";
}

function themeSelect(val){
	removefile('css/userstyle-Black.css');
	removefile('css/userstyle-Plain.css');
	removefile('css/userstyle-Tech.css');
	removefile('css/userstyle-Bright.css');
	cssFile='css/userstyle-' + val + '.css';
	load_css(cssFile);
}


function drawMenu(){
        url = API_PATH + "menu/draw/";
        json_get(url,"menu"); // click events are now attached through special code in json_get function 
	//console.log("Menu not drawn - this has been disabled and menu still hard coded");
}

function example1(){
	url = API_PATH + "example/test1";
	json_get(url,"apiResponse");
	$("#apiResponse").fadeIn();
}
	

function example2(){
	url = API_PATH + "example/test2";
	json_get(url,"apiResponse");
	$("#apiResponse").fadeIn();
}

function example3(){
	url = API_PATH + "example/test3";
	json_get(url,"apiResponse");
	$("#apiResponse").fadeIn();
}

function example4(){
	url = API_PATH + "example/test4";
	json_get(url,"apiResponse");
	$("#apiResponse").fadeIn();
}

function example5(){
	url = API_PATH + "example/test5";
	json_get(url,"apiResponse");
	$("#apiResponse").fadeIn();
}

function example6(){
	url = API_PATH + "example/test6";
	json_get(url,"apiResponse");
	$("#apiResponse").fadeIn();
}
