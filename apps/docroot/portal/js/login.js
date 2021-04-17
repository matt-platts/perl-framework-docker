/* 
 * File: login.js
*/

function doLogin(){

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
							//document.forms.loginForm.elements.load_after_login.value = ""; 
							document.getElementById("login_message").style.display="none";
							$("#loading").hide();
							drawMenu();
							$(".header_menu_item").click(function(){
								openTab($(this).attr("rel"),$(this).html());
							});

							loginString = "User: " + data.content.username + " <span id='logoutlink'>[ <b>LOG OUT</b> ]</span>";
							$("#login_info").html(loginString);
							$(".ui-dialog").fadeOut(); 
							$(".ui-widget-overlay").fadeOut(); 
						} else if (data.error==1){

							alert( "unauthorised" );
						}
					break;
					case 0:
							alert('A error occurred whist connecting to the API..<br />Are you connected to the Network/VPN?.');
					
					case 401:
							alert('A error occurred whist trying to log in.<br />Please check your login details and ensure you are connected to the network.');
					break;
					default:
						alert("HTTP status error: " + jqXHR.status + " - " + textStatus);
				}
			},

		});
		
	};

