Ext.require([
    'Ext.window.MessageBox',
    'Ext.tip.*'
]);

Ext.onReady(function(){
    Ext.get('mb1').on('click', function(e){
        Ext.MessageBox.confirm('Confirm', 'Are you sure you want to do that?', showResult);
});


function showResult(btn){
        Ext.example.msg('Button Click', 'You clicked the {0} button', btn);
}

