Ext.Loader.setConfig({enabled: true});
Ext.Loader.setPath('Ext.ux', '/BCLP/js/extjs/examples/ux');
Ext.require([
    'Ext.grid.*',
    'Ext.data.*',
    'Ext.util.*',
    'Ext.toolbar.Paging',
    'Ext.ux.PreviewPlugin',
    'Ext.ModelManager',
    'Ext.tip.QuickTipManager'
]);


Ext.onReady(function(){
    Ext.tip.QuickTipManager.init();

    Ext.define('SerialCSRModel', {
        extend: 'Ext.data.Model',
        fields: [
            'time', 'user', 'serial_no', 'response', 'ip', 'csr'
        ],
        idProperty: 'threadid'
    });

    // create the Data Store
    var store = Ext.create('Ext.data.Store', {
        pageSize: 10,
        model: 'SerialCSRModel',
        remoteSort: true,
        proxy: {
            // load using script tags for cross domain, if the data in on the same domain as this page, an HttpProxy would be better
            type: 'jsonp',
	    url: 'http://localhost/manual-keyup-test/?do=access_log&datatype=json',
            reader: {
                root: 'topics',
                totalProperty: 'totalCount'
            },
            // sends single sort as multi parameter
            simpleSortMode: true
        },
        sorters: [{
            property: 'serial_no',
            direction: 'DESC'
        }]
    });

    // pluggable renders
    function renderTopic(value, p, record) {
        return Ext.String.format(
            '<b><a href="http://sencha.com/forum/showthread.php?t={2}" target="_blank">{0}</a></b><a href="http://sencha.com/forum/forumdisplay.php?f={3}" target="_blank">{1} Forum</a>',
            value,
            record.data.forumtitle,
            record.getId(),
            record.data.forumid
        );
    }

    function renderLast(value, p, r) {
        return Ext.String.format('{0}<br/>by {1}', Ext.Date.dateFormat(value, 'M j, Y, g:i a'), r.get('lastposter'));
    }


    var pluginExpanded = true;
    var grid = Ext.create('Ext.grid.Panel', {
        width: 1200,
        height: 200,
        title: 'Abrca: Browse Serial Number Log',
        store: store,
        disableSelection: true,
        loadMask: true,
        viewConfig: {
            id: 'gv',
            trackOver: false,
            stripeRows: false,
            plugins: [{
                ptype: 'preview',
                bodyField: 'excerpt',
                expanded: true,
                pluginId: 'preview'
            }]
        },
        // grid columns
        columns:[{
            // id assigned so we can apply custom css (e.g. .x-grid-cell-topic b { color:#333 })
            // TODO: This poses an issue in subclasses of Grid now because Headers are now Components
            // therefore the id will be registered in the ComponentManager and conflict. Need a way to
            // add additional CSS classes to the rendered cells.
            id: 'time',
            text: "Time",
            width: 140,
	    align: 'right',
            sortable: true 
        },{
            text: "Serial No",
            dataIndex: 'serial_no',
            width: 70,
            align: 'right',
            sortable: true
        },{
            text: "Response",
            dataIndex: 'response',
            width: 150,
            sortable: true
        },{
            text: "IP",
            dataIndex: 'ip',
            width: 150,
            sortable: true
        },{
            text: "User Name",
            dataIndex: 'user',
            width: 150,
            sortable: true
        },{
            text: "CSR",
            dataIndex: 'csr',
            flex: 1,
            sortable: true
        }],
        // paging bar on the bottom
        bbar: Ext.create('Ext.PagingToolbar', {
            store: store,
            displayInfo: true,
            displayMsg: 'Displaying topics {0} - {1} of {2}',
            emptyMsg: "No topics to display",
            items:[
                '-', {
                text: 'Show Preview',
                pressed: pluginExpanded,
                enableToggle: true,
                toggleHandler: function(btn, pressed) {
                    var preview = Ext.getCmp('gv').getPlugin('preview');
                    preview.toggleExpanded(pressed);
                }
            }]
        }),
        renderTo: 'topic-grid'
    });

    // trigger the data store load
    store.loadPage(1);
});
