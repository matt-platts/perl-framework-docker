/* 
 * File: login.js
*/

/*
 * Click event for the do_login element
 */
(function(){
	$("#do_login").click(function(){
		document.getElementById('loginSpacer').innerHTML='<img style="margin-left:12px;" src="images/spinner.gif" />';
		$.ajax({	
			url: API_PATH + 'auth/login/',
			type: 'POST',
			data: $("#loginForm").serialize(),
			dataType: 'json',

			complete: function(jqXHR, textStatus) {
				document.getElementById('loginSpacer').innerHTML='';
				switch (jqXHR.status) {
					case 200:
						data=JSON.parse(jqXHR.responseText);
						console.log(data);
						console.log(jqXHR.responseText);
						//console.log("Success: ", data.success);
						//console.log("Error: ", data.error);
						if (data.success==1 && data.error==0){
							top.loginframe.document.forms.loginForm.elements.load_after_login.value = ""; 
							top.loginframe.document.getElementById("login_message").style.display="none";
							top.Ext.getCmp("loginWindow").hide();
							console.log("getActiveTab:", top.Ext.getCmp("tabPanel").getActiveTab);
							if ( null != top.Ext.getCmp("tabPanel").getActiveTab()){
								top.Ext.getCmp("tabPanel").getActiveTab().close(); // works without top in bclp_serial_lookup
							}
							top.$("#overlay").fadeOut();
							top.$("#latest_searches").attr("src", function ( i, val ) { return val; });
							top.$("#main").fadeIn();
							top.$("#loading").hide();
							top.drawMenu();
							loginString = "User: " + data.content.username + " <span id='logoutlink'>[ <b>LOG OUT</b> ]</span>";
							top.$("#login_info").html(loginString);
						} else if (data.error==1){

							alert( "unauthorised" );
						}
					break;
					case 0:
						top.Ext.MessageBox.show({
							title: 'Login error',
							msg: 'A error occurred whist connecting to the API..<br />Are you connected to the Network/VPN?.',
							buttons: top.Ext.MessageBox.OK,
							icon: 'ext-mb-error'
					});
					
					case 401:
						top.Ext.MessageBox.show({
							title: 'Login error',
							msg: 'A error occurred whist trying to log in.<br />Please check your login details and ensure you are connected to the network.',
							buttons: top.Ext.MessageBox.OK,
							icon: 'ext-mb-error'
					});
					break;
					default:
						alert("HTTP status error: " + jqXHR.status + " - " + textStatus);
				}
			},

			/*
			statusCode: {
				401: function() {
				},
				200: function(data) {
				}
			},
			*/

		});
		
	});
})();

function validateLoginForm(){
	$("#do_login").click();
}
