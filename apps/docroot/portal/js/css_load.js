function load_css (filename){
	var headID = document.getElementsByTagName("head")[0];
	var cssNode = document.createElement('link');
	cssNode.type = 'text/css';
	cssNode.rel = 'stylesheet';
	cssNode.href = filename;
	cssNode.media = 'screen';
	headID.appendChild(cssNode);
}

function removefile(filename) {

	var targetElement = "link"; 
	var targetAttr = "href"; 

	var allCtrl = document.getElementsByTagName(targetElement);
	for (var i=allCtrl.length; i>=0; i--)  { //search backwards within nodelist for matching elements to remove
		if (allCtrl[i] && allCtrl[i].getAttribute(targetAttr)!=null && allCtrl[i].getAttribute(targetAttr).indexOf(filename)!=-1){
			allCtrl[i].parentNode.removeChild(allCtrl[i]);
		}
	}
}
