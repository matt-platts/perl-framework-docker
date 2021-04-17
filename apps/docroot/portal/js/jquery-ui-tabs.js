// This is the main function which runs onload, and contains the logic for opening and closing tabs
$( function() {

	var tabTitle = $( "#tab_title" ),
	tabContent = $( "#tab_content" ),
	tabTemplate = "<li class='ui-tabs-active ui-state-active'><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>",
	tabCounter = 0;

	var tabs = $( "#tabs" ).tabs();
 
 
	// Actual addTab function: adds new tab using the input from the form above
	function addTab() {
		var label = tabTitle.val() || "Tab " + tabCounter,
		id = "tabs-" + tabCounter,
		li = $( tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) ),
		tabContentHtml = tabContent.val() || "Tab " + tabCounter + " content.";

		tabs.find( ".ui-tabs-nav" ).append( li );
		tabs.append( "<div id='" + id + "'><p>" + tabContentHtml + "</p></div>" );
		tabs.tabs( "refresh" );
		tabCounter++;
	}

	// Function for opening tab from a menu item	
	function openTab(var1,var2){
		var label = var2,
		id = "tabs-" + tabCounter,
		li = $( tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) ),
		tabContentHtml = "Tab " + tabCounter + " content inserted here from openTab function. " + var1 + " - " + var2;
		      
		tabs.find( ".ui-tabs-nav" ).append( li ); //append the new tab
		tabs.append( "<div id='" + id + "' style='display:block; overflow:scroll; max-height:72vh;'><p>" + tabContentHtml + "</p></div>" ); // append the new tab content
		tabs.tabs( "refresh" );
		tabCounter++;

		// two methods of doing the same thing here - use the second
                var currentCounter=0;
                $( ".ui-tabs-tab" ).each(function( index ) {
                        $( this ).removeClass("ui-tabs-active ui-state-active");
                        currentCounter++;
                });
                //alert("Have " + currentCounter + " tabs at the moment!");
		currentCounter--;


		tabs.find( ".ui-tabs-active" ).removeClass( 'ui-tabs-active ui-state-active' );

		li.addClass("ui-tabs-active ui-state-active");
		$("#" + id).css("display","block");
		li.click();
		$("#tabs").fadeIn();
		$("#intro").fadeOut();

		var active = tabs.tabs( "option", "active" );
		//alert("Active tab is " + active + " going to set it to " + currentCounter);

		$("#tabs").tabs( "option", "active", currentCounter);	
		//alert("Active tab is " + active);

		// load the content
		loadStaticContent(var1,id);
	}

	/* Add tab from search box - used for serial numbers */
	function addTabFromSearch() {

		searchFor = document.forms['searchform'].elements['searchfor'].value;
		url=API_PATH + "search/search_for/serial_no/" + searchFor; 


		var label = searchFor,
		id = "tabs-" + tabCounter,
		li = $( tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) ),
		tabContentHtml = "Tab " + tabCounter + " content inserted here from function.";
		tabContentHtml = '<div id="info_' + id + '"><div style="width:100%; text-align:center;">Loading asset data from api:' + searchFor + ' <br/><img style="margin:20px auto;" src="images/spinner.gif" /></div></div>';

		// append the li, remove active class from other li's, add active class to this one
		tabs.find( ".ui-tabs-nav" ).append( li );
		tabs.append( "<div id='" + id + "' style='display:block; max-height:72vh; overflow:scroll;'><p>" + tabContentHtml + "</p></div>" );
		tabs.tabs( "refresh" );
		tabCounter++;
	

		$("#" + id).css("display","block");


		// two methods of doing the same thing here - use the second
                var currentCounter=0;
                $( ".ui-tabs-tab" ).each(function( index ) {
                        $( this ).removeClass("ui-tabs-active ui-state-active");
                        currentCounter++;
                });
                //alert("Have " + currentCounter + " tabs at the moment!");
		currentCounter--;


		li.addClass("ui-tabs-active ui-state-active");
		$("#" + id).css("display","block");
		li.click();
		tabs.tabs( "refresh" );
		$("#tabs").fadeIn();
		$("#intro").fadeOut();

		$("#tabs").tabs( "option", "active", currentCounter);	

		// load the content
                json_get(url,id);
		
	}

	// Trigger for the search button to call the function above
	$( "#searchbutton" ).button().on( "click", function() {
		addTabFromSearch();
	});

 
	// Close icon: removing the tab on click
	tabs.on( "click", "span.ui-icon-close", function() {
		var panelId = $( this ).closest( "li" ).remove().attr( "aria-controls" );
	      	$( "#" + panelId ).remove();
		console.log(JSON.stringify(tabs))

		// close entire tabs panel if the last one is closed
		console.log("Length" + $( ".ui-tabs-tab" ).length);
		if ( $( ".ui-tabs-tab" ).length==0){
			$("#tabs").fadeOut();
			$("#intro").fadeIn();
		}
		
		/*
		$( ".ui-tabs-tab" ).each(function( index ) {
		  console.log( index + ": " + $( this ).text() );
		});
		*/


		tabs.tabs( "refresh" );
	});
 
	// keyup function for tabs
	tabs.on( "keyup", function( event ) {
		if ( event.altKey && event.keyCode === $.ui.keyCode.BACKSPACE ) {
			var panelId = tabs.find( ".ui-tabs-active" ).remove().attr( "aria-controls" );
			$( "#" + panelId ).remove();
			tabs.tabs( "refresh" );
		}
	});

	// Trigger for opening a tab from a menu item
	$(".header_menu_item").click(function(){
		openTab($(this).attr("rel"),$(this).html());
	});


} );



// Make the tabs re-orderable on drag
$( function() {
	var tabs = $( "#tabs" ).tabs();
	tabs.find( ".ui-tabs-nav" ).sortable({
		axis: "x",
		stop: function() {
			tabs.tabs( "refresh" );
		}
	});
} );

// This function is for preloading data by ajax and is not currently used, but left as it could come in useful
$( function() {
	$( "#tabs" ).tabs({
		beforeLoad: function( event, ui ) {
			ui.jqXHR.fail(function() {
				ui.panel.html("Couldn't load this tab. Query failed.");
			});
	      	}
	});
} );

