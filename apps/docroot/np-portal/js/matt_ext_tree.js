Ext.Loader.setConfig({enabled: true});
#Ext.Loader.setPath('Ext.ux', '/js/libs/extjs/examples/ux');
Ext.require([
    'Ext.tree.*',
    'Ext.data.*'
]);

var Tree = Ext.tree;
console.log(Ext,Tree);

    var tree = new Tree.TreePanel('tree', {
        animate:true,
        enableDD:false,
	loader: new Tree.TreeLoader(), // Note: no dataurl, register a TreeLoader to make use of createNode()
	lines: true,
	selModel: new Ext.tree.MultiSelectionModel(),
        containerScroll: false
    });

    // json data describing the tree
    	var json = 
[ 
 {"text" : "Audi", "id" : 100, "leaf" : false, "cls" : "folder", "children" : [ 
    {"text" : "A3", "id" : 1000, "leaf" : false, "cls" : "folder", "children" : 
        [ {"text" : "Fuel Economy", "id" : "100000", "leaf" : true, "cls" : "file"},
          {"text" : "Invoice", "id" : "100001", "leaf" : true, "cls" : "file"},
          {"text" : "MSRP", "id" : "100002", "leaf" : true, "cls" : "file"},
          {"text" : "Options", "id" : "100003", "leaf" : true, "cls" : "file"},
          {"text" : "Specifications", "id" : "100004", "leaf" : true, "cls" : "file"}
        ]
    },
    {"text" : "TT", "id" : 1000, "leaf" : false, "cls" : "folder", "children" : 
        [ {"text" : "Fuel Economy", "id" : "100000", "leaf" : true, "cls" : "file"},
          {"text" : "Invoice", "id" : "100001", "leaf" : true, "cls" : "file"},
          {"text" : "MSRP", "id" : "100002", "leaf" : true, "cls" : "file"},
          {"text" : "Options", "id" : "100003", "leaf" : true, "cls" : "file"},
          {"text" : "Specifications", "id" : "100004", "leaf" : true, "cls" : "file"}
        ]
    }]
 },

 {"text" : "Cadillac", "id" : 300, "leaf" : false, "cls" : "folder", "children" : [ 
    {"text" : "CTS", "id" : 1000, "leaf" : false, "cls" : "folder", "children" : 
        [ {"text" : "Fuel Economy", "id" : "100000", "leaf" : true, "cls" : "file"},
          {"text" : "Invoice", "id" : "100001", "leaf" : true, "cls" : "file"},
          {"text" : "MSRP", "id" : "100002", "leaf" : true, "cls" : "file"},
          {"text" : "Options", "id" : "100003", "leaf" : true, "cls" : "file"},
          {"text" : "Specifications", "id" : "100004", "leaf" : true, "cls" : "file"}
        ]
    },
    {"text" : "CTS-V", "id" : 1000, "leaf" : false, "cls" : "folder", "children" : 
        [ {"text" : "Fuel Economy", "id" : "100000", "leaf" : true, "cls" : "file"},
          {"text" : "Invoice", "id" : "100001", "leaf" : true, "cls" : "file"},
          {"text" : "MSRP", "id" : "100002", "leaf" : true, "cls" : "file"},
          {"text" : "Options", "id" : "100003", "leaf" : true, "cls" : "file"},
          {"text" : "Specifications", "id" : "100004", "leaf" : true, "cls" : "file"}
        ]
    }]
 }
];


    // set the root node
    var root = new Tree.AsyncTreeNode({
    	text: 'Autos',
        draggable:false,
        id:'source',
        children: json
    });
    
    tree.setRootNode(root);
    tree.render();
    root.expand();
