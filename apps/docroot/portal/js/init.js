/*
 * File: bclp_init.js
 * Meta: Bootstraps the app, and kicks off code on document ready / on ext.js ready 
*/

/*
 * Function: init
 * Meta: set up page - currently just click event for logging out
*/

$(function(){ // runs automatically when ext.js is ready

	user = getCookie("user");
	if (!user){

		Ext.getCmp('loginWindow').center();
		$("#loading").fadeOut();
		$("#overlay").fadeIn();
		Ext.getCmp('loginWindow').show();

	} else {
		$.ajax({	
			url: API_PATH + 'auth/authenticate/',
			type: 'GET',
			dataType: 'json',

			success: function(data){

				loginString = "User: " + data.content.username + " <span id='logoutlink'>[ <b>LOG OUT</b> ]</span>";
				$("#login_info").html(loginString);
				top.$("#main").fadeIn();
				top.$("#loading").hide();
				console.log("Drawring menu from ext onready");
				drawMenu();
				console.log("Attaching click event to menu items after draw in ext onReady");
				$(".header_menu_item").click(function(){
					openTab($(this).attr("rel"),$(this).html());
				});

			},

			error: function (x,y,z){
				alert("Unable to authenticate user");
				console.log(x);
			}
		});
	}
});

/*
 * Function : init
 * Meta: called automatically when the document is ready (note that ext.js may not be ready)
 */
function init(){

	$("#login_info").click(function(){
		Ext.MessageBox.confirm('Confirm', 'Are you sure you want to log out?', checkLogout);

		function checkLogout(btn){
			if (btn=="yes"){
				eraseCookie("user");
				location.reload();
			}
		}
	});

	
	console.log("On init function - attaching click event to menu items");
	$(".header_menu_item").click(function(){
		openTab($(this).attr("rel"),$(this).html());
	});



	/*
 	Commented out as we don't need this any more - this is now fired from Ext js onready in bclp_ext_window.js 

	user = getCookie("user");
	if (!user){ 
		Ext.getCmp('loginWindow').show();
	} else {
		alert("There is a user");
	}
	*/


	/* Load config from back end */
	$.ajax({
		url: API_PATH + "config/",
		type: 'GET',
		dataType: 'json',

		success: function(data){
			ALLOW_EDITING = data.content.editable;
			ENVIRONMENT = data.content.application_environment;
			API_PATH = data.content.api_path; // yes this is already set in config.js, we have the opportunity to change it from the back end here
		}
	});


}

/*
 * Function: alertBox
 * Meta: generic wrapper for ext.js alertbox
 */
function alertBox(message){

	Ext.MessageBox.show({
		title: 'BCLP serial number lookup',
		msg: message,
		buttons: Ext.MessageBox.OK,
		icon: 'ext-mb-error'
	}); 

}


// Script - all we need to do i call init to set up the page
whenDocumentReady(init());
