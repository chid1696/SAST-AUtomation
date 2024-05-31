

//Attaching refresh event to Venn diagram region
$( ".vennReg" ).on( "refresh", function( event, ajaxReq ) {

  
    var div = this,
        config = $(this).data("config"),
        query=config.query;
    
    vennmain; //call to init venn parmeters


  //eval(config.beforechart); // Run any requested changes to qJSON
  
  
  qJSON = rxds.fngetJSON("","","ussr", query, function(qJSON){
    rxds.postReq({
          ajaxReq:ajaxReq,
          url : rxds.fnGetURL(div)+'/',
          body: qJSON,
          done: function(data){
                  vennmain.load(JSON.stringify(data.result));  // call the load function in venn js
                },// End done cb
          fail: function(err){
                  div.innerText = "Error" + err.responseText;
                }
      });// End rxds.postReq
  }); //fngetJSON

    


}); // On Refresh Venn diagram Region

