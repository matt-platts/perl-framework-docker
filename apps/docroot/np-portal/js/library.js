/* 
 * Filename: Library.js
 * Meta: Common javascript functions
*/

/*
 * Function: createCooke
*/
function createCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}

/*
 * Function: getCookier
 * Meta: Retrieve a cookie value by name
 */
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}

/*
 * Function: eraseCookie
 * Meta: to erase a cookie
 */
function eraseCookie(c_name){
    createCookie(c_name,"",-1);
}

/*
 * Function: camelCaseToRegular
 * Meta: Convert camel case to regular printable text with initial capitalisation and spaces
 */
String.prototype.camelCaseToRegular = function() {
	myString = this.replace(/([A-Z])/g,' $1').replace(/^./,function(str){return str.toUpperCase();});
	myString = myString.replace(/([A-Z])_ /g,'$1 ');
	myString = myString.replace(/([A-Z]) ([A-Z])/g,'$1$2');
	myString = myString.replace(/EU LA/g,'EULA');
	myString = myString.replace(/SY MLegacy/g,'SYM Legacy');
	myString = myString.replace(/AP IKey/g,'API Key');
	return myString;
}

/*
 * Function: logMessage
 * Meta: Wrapper around console logging - will not print logs if in PRODUCTION mode
*/
function logMessage(message){
	if (ENVIRONMENT != "PRODUCTION"){
		console.log(message);
	}
}

/* 
 * Function: whenDocumentReady 
 * Meta: call a function automatically when the document is ready 
 * Exampe Usage: call the function 'init()' when the document is ready: whenDocumentReady(init());
 */
function whenDocumentReady(fn) {
	if (document.readyState != 'loading'){
		fn();
	} else {
		document.addEventListener('DOMContentLoaded', fn);
	}
}
