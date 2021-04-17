function loadStaticContent(page,tab) {

	if (page.match(/portal-api/)){

	} else {
		page = "static-pages/" + page.toLowerCase() + ".html";
	}
	console.log("Loading " + page);
	var request = new XMLHttpRequest();
	request.open('GET', page, true);

	request.onreadystatechange = function() {
	  if (this.readyState === 4) {
	    if (this.status >= 200 && this.status < 400) {
	      // Success!
	      console.log("response: ",this.response);
	      var resp = this.response; // previously used responseText!
		document.getElementById(tab).innerHTML = resp;
	    } else {
	      // Error :(
	    }
	  }
	};

	request.send();
	request = null;
}
