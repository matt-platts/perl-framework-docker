Ext.require([
    'Ext.window.Window',
    'Ext.tab.*',
    'Ext.toolbar.Spacer',
    'Ext.layout.container.Card',
    'Ext.layout.container.Border',
    'Ext.window.MessageBox',
    'Ext.tip.*'
]);

Ext.onReady(function(){

	var constrainedWin, constrainedWin2;
    
	Ext.util.Region.override({
		colors: ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'],
		nextColor: 0,

		show: function(){
		    var style = {
			display: 'block',
			position: 'absolute',
			top: this.top + 'px',
			left: this.left + 'px',
			height: ((this.bottom - this.top) + 1) + 'px',
			width: ((this.right - this.left) + 1) + 'px',
			opacity: 0.3,
			'pointer-events': 'none',
			'z-index': 9999999
		    };
		    if (!this.highlightEl) {
			style['background-color'] = this.colors[this.nextColor];
			Ext.util.Region.prototype.nextColor++;
			this.highlightEl = Ext.getBody().createChild({
			    style: style
			});
			if (this.nextColor >= this.colors.length) {
			    this.nextColor = 0;
			}
		    } else {
			this.highlightEl.setStyle(style);
		    }
		},

		hide: function(){
		    if (this.highlightEl) {
			this.highlightEl.setStyle({
			    display: 'none'
			});
		    }
		}
	});
	//win2.show();

	var loginWindow = Ext.create('Ext.Window', {
		id:  'loginWindow',
		title: 'Please log in:',
		width: 350,
		height: 180,
		x: 10,
		y: 200,
		plain: true,
		closable: false,
		headerPosition: 'top',
		layout: 'fit',
		items: {
			html: '<iframe id="loginframe" name="loginframe" style="border:0" src="login.html"></iframe>',
			border: false
		},
		listeners:{
			'close':function(win){
				document.getElementById("overlay").style.visibility="none";
			},
			'hide':function(win){
				document.getElementById("overlay").style.display="none";
			}

		 }
	});


});
