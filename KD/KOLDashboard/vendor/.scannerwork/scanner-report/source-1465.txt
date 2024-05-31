rxds.loadEditTable = function (div, config, data, stTime,parentData) {
  //div.innerText = data;

        var tabid = $(div).data("id");
        var d= data;
        var network = (new Date()).getTime() - stTime;
        var tname = config.table;

        var colheader = [], cols = [], editable = [], insertable = [], identifier = [], i = 0;
        for(var t in data[0]) {
             colheader.push({'<>':'td','class':'column','html':t});
             cols.push({'<>':'td','class':'column','html':"${"+t+"}"});
             if (i == 0){
               identifier.push(i,t);
               editable.push([i,t]);
             }else{
               editable.push([i,t]);
             }

             i += 1;
        }

        var table = {
               rows: [
                  {'<>':'tr','class':'row','html':function() {
                      return($.json2html(this,table.cols));
                  }}
               ],
               cols: cols
        };


        var thead = {
           thead:[
                 {'<>':'thead','html':[
                  {'<>':'tr','html':colheader}
                 ]}
               ]
        };

 //       thead.thead[0].html[0].html = colheader;

        $('<table id="tabledit" class="table table-striped table-bordered"></table>').appendTo(div);
        $('#tabledit').json2html(data[0], thead.thead);
        $('#tabledit').json2html(data, table.rows,{append:true});


  $("#tabledit" ).Tabledit({
      url: rxds.fnGetURL(div)+'/',
      columns: {
          identifier: identifier, //[0, 'Physician_ID']
          editable: editable //[[1, 'First_Name'], [2, 'Last_Name'], [3, 'Middle_Name']]
      },
      buttons: {
          edit: {
              class: 'btn btn-sm btn-default',
              html: '<span class="glyphicon glyphicon-pencil"></span>',
              action: 'edit'
          },
          delete: {
              class: 'btn btn-sm btn-default',
              html: '<span class="glyphicon glyphicon-trash"></span>',
              action: 'delete'
          },
          save: {
              class: 'btn btn-sm btn-success',
              html: 'Save'
          },
          restore: {
              class: 'btn btn-sm btn-warning',
              html: 'Restore',
              action: 'restore'
          },
          confirm: {
              class: 'btn btn-sm btn-danger',
              html: 'Confirm'
          }
      },
      onDraw: function() {
          console.log('onDraw()');
      },
      onSuccess: function(data, textStatus) {
          console.log('onSuccess(data, textStatus, jqXHR)');
          console.log(data);
          console.log(textStatus);
 //         console.log(jqXHR);

      },
      onFail: function(jqXHR, textStatus, errorThrown) {
          console.log('onFail(jqXHR, textStatus, errorThrown)');
          console.log(jqXHR);
          console.log(textStatus);
          console.log(errorThrown.responseText);
      },
      onAlways: function() {
          console.log('onAlways()');
      },
      onAjax: function(action, serialize) {
          console.log('onAjax(action, serialize)');
          console.log(action);
          console.log(serialize);

      }
  });

} //loadEditTable


$( ".tableditReg" ).on( "refresh", function( event, ajaxReq ) {

    var div = this;
    var config = $(this).data("config");
    var query_id = $(this).data("query_id");
    //var template= config.template;
    var stTime = (new Date()).getTime();


     rxds.fngetJSON("","","ussr", " ", function(qJSON){
       qJSON.query_id = query_id;
       qJSON.cache = 'N';
        rxds.postReq({
          ajaxReq:ajaxReq,
          url : rxds.fnGetURL(div)+'/',
          body: qJSON,
          done: function(data){
                    var reportdata;
                    try{
                      reportdata = (data.result.reportdata === undefined)?data.result:data.result.reportdata;
                    }catch(e){
                      reportdata = [{"Error":"Returned data is not in DataTable format :" + e}]
                   }
                    rxds.loadEditTable(div,config,reportdata,stTime);
                },// .done()
          fail: function(xhr,status,error){
                  console.log("Report Region Failed:>>" + status + ">>" + error + ">>" + sel);
                }
          }); // End rxds.postReq
     }); // fngetJSON


});// $(".tableditReg")
