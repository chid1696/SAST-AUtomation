$(".modaledit").on("loadmodal",function(e, qJSON, set_function, parent_id, operation){
  var query_id = $(this).data("query_id");
  var config = $(this).data("config");

  $(this).data('parent_id', parent_id); 
  $(this).modal('show');
  qJSON.query_id = query_id;
  qJSON.cache = 'N';
  eval(config.beforequery); // Run any requested changes to qJSON
   console.log(qJSON);
  if (operation == "Edit") {
    rxds.postReq({
        body: qJSON,
        done: function(data){
                console.log(data);
                set_function(data);
              },// End done cb
        fail: function(err){
                //div.innerText = "Error" + err.responseText;
                console.log("Error" + err.responseText);
              }
    });// End rxds.postReq
  } else {
    set_function(); // Add button - No data to set
  }
})


$(".modaledit a.btn").on("click",function(){
    var div =    $(this).closest(".modal")[0]; 
    var config = $(div).data("config");
    var query_id=$(div).data("buttonquery_id");
   var region_items = $(div).data("region_items");
    qJSON = rxds.getAllJSON(region_items);
    qJSON.button = this.id;
    qJSON.query_id = query_id;
    qJSON.cache = 'N';
    eval(config.beforequery); // Run any requested changes to qJSON
    console.log(qJSON);
    rxds.postReq({
      body: qJSON,
      done: function(data){
              console.log(data);
              $(div).modal('hide');
              var parent_id = $(div).data('parent_id'); 
              $("#"+parent_id).trigger("refresh");
              eval(config.afterquery); // Run anything after Save, like UDST refresh
            },// End done cb
      fail: function(err){
              //div.innerText = "Error" + err.responseText;
              console.log("Error" + err.responseText);
            }
  });// End rxds.postReq
  
});


