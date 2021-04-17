/*
 * Ext.getCmp("tabPanel").removeAll() - removes entire tabPanel;
 * Ext.getCmp("tabPanel").remove(Ext.getCmp("tabPanel").getActiveTab().id); - remove a single tab externally
 */

Ext.Loader.setConfig({enabled: true});
Ext.Loader.setPath('Ext.ux', '/ext/ext-4.2.1.883/examples/ux');
Ext.require([
    'Ext.tab.*',
    'Ext.ux.TabCloseMenu'
]);

Ext.application({
    name: 'BCLP',
    id: 'BCLP',
    launch: function() {

	    var currentItem;

	    var tabs = Ext.widget('tabpanel', {
		renderTo: 'tabs',
		id: 'tabPanel',
		name: 'tabPanel',
		resizeTabs: true,
		enableTabScroll: true,
		height: parseInt(window.innerHeight)-140,
		defaults: {
		    autoScroll: true,
		    bodyPadding: 10
		},

		items: [], /* here I cleared the existing items */ 
		plugins: Ext.create('Ext.ux.TabCloseMenu', {
		    extraItemsTail: [
			'-',
			{
			    text: 'Closable',
			    checked: true,
			    hideOnClick: true,
			    handler: function (item) {
				currentItem.tab.setClosable(item.checked);
			    }
			},
			'-',
			{
			    text: 'Enabled',
			    checked: true,
			    hideOnClick: true,
			    handler: function(item) {
				currentItem.tab.setDisabled(!item.checked);
			    }
			}
		    ],
		    listeners: {
			aftermenu: function () {
			    currentItem = null;
			},
			aftermenu: function () {
			    currentItem = null;
			},
			beforemenu: function (menu, item) {
			    var enabled = menu.child('[text="Enabled"]'); 
			    menu.child('[text="Closable"]').setChecked(item.closable);
			    if (item.tab.active) {
				enabled.disable();
			    } else {
				enabled.enable();
				enabled.setChecked(!item.tab.isDisabled());
			    }

			    currentItem = item;
			}
		    }
		})
	    });


	    // tab generation code
	     var index = 0;

	    /*while(index < 0) {
		addTab(index % 2);
	    }*/
	    
	    function doScroll(item) {
		var id = item.id.replace('_menu', ''),
		    tab = tabs.getComponent(id).tab;
	       
			tabs.getTabBar().layout.overflowHandler.scrollToItem(tab);
	    }

	    function addTab (tabTitle, closable) {
		++index;
		tabs.add({
		    closable: true,
		    html: '<div id="info_' + tabTitle + '"><div style="width:100%; text-align:center;">Loading data for ' + tabTitle + ' <br/><img style="margin:20px auto;" src="images/spinner.gif" /></div></div>',
		/*	autoLoad:{url:'../nowhere/nothing.cgi'},*/
		    iconCls: 'tabs',
		    id: tabTitle,
		    title: tabTitle 
		}).show();
	    }
	    
	    function addToMenu(ct, tab) {
		menu.add({
		   text: tab.title,
		   id: tab.id + '_menu',
		   handler: doScroll
	       });
	    }
	    
	    function removeFromMenu(ct, tab) {
		var id = tab.id + '_menu';
		menu.remove(id);
		if(tabs.items.length==0){
			$(".introtext").fadeIn();
			$('#tabs').fadeOut();
		};
	    }
	    
	    tabs.on({
		add: addToMenu,
		remove: removeFromMenu
	    });


	function goSearch(el){
		logMessage(Ext.app);
		url=API_PATH + "search/search_for/serial_no/" + document.getElementById("search").value;
		json_get(url,el);

	}


	Ext.widget('button', {
		iconCls: 'new-tab',
		renderTo: 'searchForm',
		text: 'Search &nbsp; &nbsp;  ',
		id: 'go',

		handler: function() {

			document.forms['searchForm'].elements['search'].value = document.forms['searchForm'].elements['search'].value.trim();
			if (!document.forms['searchForm'].elements['search'].value){
				alertBox("No text entered - unable to perform search.");
				return;
			}

			$('.introtext').hide();
			$('#tabs').fadeIn();

			// make latest searches tab automatically if there are no tabs, so we don't lose the home page data (commented this out in 2021).
			if(tabs.items.length==0){
				//addTab("History",true);
				//$("#info_History").html("<p></p>"); // clears the loading message
				//$("#info_History").append('<div id="latest_searches_div"><iframe id="latest_searches_tab" src="' + API_PATH + 'search/history/" width="80%" rel="mattplattssearchtab" height="300" border="0" frameborder="0"></iframe></div>'); // loads the iframe
			}

			logMessage(tabs.items.keys);

			var haveTabAlready=0;
			for (tabId in tabs.items.keys){
				logMessage(tabId,tabs.items.keys[tabId]);
				if (tabs.items.keys[tabId]==document.forms['searchForm'].search.value){
					haveTabAlready=true;
				}
			}
			if (!haveTabAlready){
				addTab(document.forms['searchForm'].search.value,true);
				goSearch(document.forms['searchForm'].search.value);
			} else {
				Ext.MessageBox.show({
					title: 'BCLP serial number lookup',
					msg: 'A Tab was already open for ' + document.forms['searchForm'].search.value + '.<br />Please <a href="Javascript:void(0)" onClick="reloadSerialNumberByTab(document.forms.searchForm.search.value)">reload this tab</a> to get up to date information. ',
					buttons: Ext.MessageBox.OK,
					icon: 'ext-mb-error'
				});
				tabs.setActiveTab(document.forms['searchForm'].search.value);
			}

		}

	});

	var menu = new Ext.menu.Menu();
	tabs.items.each(function(tab){
		addToMenu(tabs, tab);
	});

    }
});
