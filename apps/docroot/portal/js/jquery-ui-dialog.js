  $( function() {
 
    // Modal dialog init: custom buttons and a "close" callback resetting the form inside
    var dialog = $( "#login" ).dialog({
      autoOpen: true,
      modal: true,
	width: "450px",
      buttons: {
        Login: function() {
          doLogin();
        },
        Close: function() {
          $( this ).dialog( "close" );
        }
      },
      close: function() {
        //form[ 0 ].reset();
      }
    }).dialog("widget")
      .next(".ui-widget-overlay")
      .css("background", "#000");;
 
    // AddTab form: calls addTab function on submit and closes the dialog
    var form = dialog.find( "form" ).on( "submit", function( event ) {
      //addTab();
      //dialog.dialog( "close" );
      event.preventDefault();
    });
 
    // AddTab button: just opens the dialog
    $( "#add_tab" )
      .button()
      .on( "click", function() {
        dialog.dialog( "open" );
      });
 
  } );


  // dialog for AlertBox
  $( function() {
 
    // Modal dialog init: custom buttons and a "close" callback resetting the form inside
    var dialog = $( "#alertBox" ).dialog({
      autoOpen: false,
      modal: true,
      width: "450px",
      buttons: {
        OK: function() {
          $( this ).dialog( "close" );
        },
      },
      close: function() {
        //form[ 0 ].reset();
      }
    }).dialog("widget")
      .next(".ui-widget-overlay")
      .css("background", "#000");;
 
    // AddTab form: calls addTab function on submit and closes the dialog
    var form = dialog.find( "form" ).on( "submit", function( event ) {
      //addTab();
      //dialog.dialog( "close" );
      event.preventDefault();
    });
 
    // AddTab button: just opens the dialog
    $( "#add_tab" )
      .button()
      .on( "click", function() {
        dialog.dialog( "open" );
      });
 
  } );

