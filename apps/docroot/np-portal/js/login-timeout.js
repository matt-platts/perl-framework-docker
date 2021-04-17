/*
 * File: login-timeout.js
 * Meta: display a popup if there has been no browser activity for a set amount of seconds
 */

var IDLE_TIMEOUT = 3600; //seconds

var _idleSecondsCounter = 0;

document.onclick = function() {
    _idleSecondsCounter = 0;
};
document.onmousemove = function() {
    _idleSecondsCounter = 0;
};
document.onkeypress = function() {
    _idleSecondsCounter = 0;
};

window.setInterval(CheckIdleTime, 1000);

/*
 * Function : checkIdleTime
 * Meta: Called once per second, checks to see if there has been any browser activity in the last IDLE_TIMEOUT seconds and displays a login prompt if not
*/
function CheckIdleTime() {
    _idleSecondsCounter++;
    var oPanel = document.getElementById("SecondsUntilExpire");
    if (oPanel)
        oPanel.innerHTML = (IDLE_TIMEOUT - _idleSecondsCounter) + "";
    if (_idleSecondsCounter >= IDLE_TIMEOUT) {
		Ext.getCmp('loginWindow').center();
		$("#loading").fadeOut();
		$("#overlay").fadeIn();
		Ext.getCmp('loginWindow').show();
		top.loginframe.document.getElementById("login_message").style.display="block";
    }
}

