$("table").on("click",".showModal",function(){
    $("#Query_ID").val($(this).data("queryid"));
    $("#Query_ID").attr("disabled", "disabled");
    $("#modalQuery").modal('show');
    $("#Tags").val([]).trigger("change");

    rxds.fngetJSON("","#Query_ID","ussr", "{fnGetTag `{{Query_ID}} }[]", function(qJSON){
      qJSON.Tags = Tags;
      qJSON.cache = "N";
      console.log(qJSON);
      rxds.postReq({
          url : rxds.fnGetURL()+'/',
          body: qJSON,
          done: function(data){
                  try{
                      if( data.result != undefined){
                        $("#Tags").val(data.result).trigger("change");
                      }else{
                        alert("Unable to retrive Query Tag List:" + data)
                      }
                  }catch(e){}
                },// .done()
          fail: function(xhr,status,error){
                  console.log("Updating the Query List Failed:>>" + status + ">>" + error);
                }
          }); // End rxds.postReq
    }); //fngetJSON



})

$("#Save").on("click",function(){
    var div =    $("#Save").closest(".modal")[0];
    var config = $(div).data("config");
    var query_id=$(div).data("query_id");
    rxds.fngetJSON("","#Query_ID","ussr", " ", function(qJSON){
      qJSON.query_id = query_id;
      var Tags = $("#Tags").val();
      if(Tags == null){
        Tags = "";
      }else if(Tags.length == 1){
        Tags = '"' + Tags + '"';
      }else{
        Tags = rxds.mapreduce(Tags , ';','"');
      }
      qJSON.Tags = Tags;
      qJSON.cache = "N";
      console.log(qJSON);
      rxds.postReq({
          url : rxds.fnGetURL(div)+'/',
          body: qJSON,
          done: function(data){
                  try{
                      if( data.result.msg === "Success"){
                        $('#modalQuery').modal('hide')
                      }else{
                        alert("Unable to update the Query List:" + data)
                      }
                  }catch(e){}
                },// .done()
          fail: function(xhr,status,error){
                  console.log("Updating the Query List Failed:>>" + status + ">>" + error);
                }
          }); // End rxds.postReq
    }); //fngetJSON
  return false;
})
