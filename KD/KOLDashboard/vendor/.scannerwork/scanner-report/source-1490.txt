export async function load(k, obj, data, full_data) {
    if (data) {
      await loadDT(k,obj, data, full_data);
    }
}

export async function refresh(k,obj, data, full_data){
    if (data) {
      await loadDT(k,obj, data, full_data);
    }
}
export function resize(k, obj) {
  obj.table.columns.adjust().draw();
}

export function  get_param(p) {
  return rxds.m.get_param(p);
}

function export_post(file_type, obj, full_data, params) {
      //Create an hidden form
      //alert( 'Not yet implemented' );
      if(full_data.rowcount === 0 || obj.recordsFiltered===0) {  //to show no data message/popup when there is no data to download
          $(".ui.modal.no-data-message").modal("show");
          return;
      }
      var url, titles;
      if (file_type=="psv") titles=obj.titles.join('|').replace(/<br>/g," ");
      else titles=obj.titles.join(',').replace(/<br>/g," ");
      params.titles= titles;
      
      //params.export_file = obj.config.title.replace(/ /g,"_")+"_"+new Date().toISOString();
      let region_title = obj.config.title;
      let params_in_title = obj.config.title.match(/{{[^}}]+}}/g);
      if(params_in_title) {
          params_in_title.forEach(v => {
              let param_value = rxds.m.get_param(v.replace(/{|}/g,""));
              if(param_value) region_title = region_title.replace(v," " + param_value + " ").replace(/&nbsp;/g,"");
          });
      }
      region_title = $("<span>" + region_title + "</span>").text();
      params.export_file = (rxds.app.page.config.title + "-" + region_title).replace(/ /g,"_");
      
      if (rxds.is_home)  url='download_file';
      else url='../download_file';
        
      var form = $('<form>', {'method': 'POST', 'action': url}).hide();
            
      $.each(params, function (k, v) {
          form.append($('<input>', {'type': 'hidden', 'name': k, 'value': v}));
      });
      
      //Make it part of the document and submit
      $('body').append(form);
      form.submit();
      
      //Clean up
      form.remove();
 }
 
function export_button(file_type, obj, full_data) {
    var label;
    if (rxds.app.config.language=="JP") {label='フルエクスポート ('}
    else {label='Full Export ('}

     return {
                text:  label + file_type.toUpperCase() +')',
                action: function ( e, dt, node, config ) {
                    //alert( 'Not yet implemented' );
                    //rxds.db_path = rxds.is_home ? "db/":"../db/";
                  var params = { cache_id:full_data.disk,query_id:obj.query_id,format:file_type };
                  //if (rxds.app.app.branch == "MASTER" || rxds.app.app.branch == "QA")
                      export_post(file_type, obj, full_data, params);
                  /*else {    
                    if (rxds.is_home)  
                       window.open('download_file?cache_id='+full_data.disk+'&query_id='+
                              obj.query_id+'&format='+file_type);
                    else
                       window.open('../download_file?cache_id='+full_data.disk+'&query_id='+
                              obj.query_id+'&format='+file_type);
                  } 
                  */
                }
            }
} //export_button

function export_button_server(file_type, obj, full_data) {
     var label;
    if (rxds.app.config.language=="JP") {label='フルエクスポート ('}
    else {label='Full Export ('}
    return {
                text: label + file_type.toUpperCase() +')',
                action: function ( e, dt, node, config ) {
                    //alert( 'Not yet implemented' );
                 const cache_id=obj.infi_hash?obj.infi_hash: full_data.disk; 
                 const server_filter=obj.infi_hash?1:0; 
                  var params = { cache_id:cache_id,query_id:obj.query_id,server_filter:server_filter,format:file_type};
                  //if (rxds.app.app.branch == "MASTER" || rxds.app.app.branch == "QA")
                       export_post(file_type, obj, full_data, params);
                  /*else {     
                  if (rxds.is_home)  
                      window.open('download_file?cache_id='+cache_id+'&query_id='+
                              obj.query_id+'&server_filter='+server_filter+'&format='+file_type);
                  else
                      window.open('../download_file?cache_id='+cache_id+'&query_id='+
                              obj.query_id+'&server_filter='+server_filter+'&format='+file_type);
                  }   */         
                }
            };
}

function japanese_options () {
  return {
  "sEmptyTable":     "テーブルにデータがありません",
  "sInfo":           " _TOTAL_ 件中 _START_ から _END_ まで表示",
    "sInfoEmpty":      " 0 件中 0 から 0 まで表示",
    "sInfoFiltered":   "（全 _MAX_ 件より抽出）",
  "sInfoPostFix":    "",
  "sInfoThousands":  ",",
    "sLengthMenu":     "_MENU_ 件表示",
  "sLoadingRecords": "読み込み中...",
    "sProcessing":     "処理中...",
  "sSearch":         "検索:",
    "sZeroRecords":    "一致するレコードがありません",
    "oPaginate": {
        "sFirst":    "先頭",
        "sLast":     "最終",
        "sNext":     "次",
        "sPrevious": "前"
    },
  "oAria": {
        "sSortAscending":  ": 列を昇順に並べ替えるにはアクティブにする",
        "sSortDescending": ": 列を降順に並べ替えるにはアクティブにする"
    }
};
  
}
export async function loadDT(k,obj, data_in, full_data) {
    var data;
    var div = "table#" + $("#"+k).data("id"); 
    
    var cols=[],fils=[],i=0;
    //Intialiaze if DT already exist
    if ( $.fn.dataTable.isDataTable(div) ) {
        var table = $(div).DataTable();
        table.clear();
        if (obj.config.server_filter == 'Y') {
          table.destroy();
          //$(`<table id="GRID${obj.region.region_id}" class="ui celled table" cellspacing="0" width="100%"></table>`).appendTo( `#CONT${obj.region.region_id}` );
        } else table.destroy();
        $(div).empty();
    }
      
    if (typeof data_in.table !== "undefined") data = data_in.table; else data=data_in;
    if (typeof data_in.res !== "undefined") data = data_in.res.table;
    if (obj.config.region_transform) {
        var data_binding = {};
        var transform_fn=new Function('data','db', 'rxds', obj.config.region_transform);
        data = transform_fn(data,data_binding, rxds.m.managers["Report"]);        
    };

      var title_arr=[];
      for(var t in data[0]) {
        var title;
        //Is there a config for this column?
        var colSet=rxds.app.report_headers[t];
        if (colSet !== undefined) {
           title=colSet.Label?colSet.Label:t;
           if (colSet.Render==="number"){
              cols.push({"title":title, "data":t, className: "right aligned", render: $.fn.dataTable.render.number(',', '.', 0 ) });
            }else if (colSet.Render==="number2"){
              cols.push({"title":title, "data":t, className: "right aligned", render: $.fn.dataTable.render.number(',', '.', 2 ) });
            }else if (colSet.Render==="percentage"){
              cols.push({"title":title, "data":t, className: "right aligned", render: $.fn.dataTable.render.number(',', '.', 0, '', '%') });
            }else if (colSet.Render==="percentage2"){
              cols.push({"title":title, "data":t, className: "right aligned", render: $.fn.dataTable.render.number(',', '.', 2, '', '%') });
            }else if (colSet.Render==="currency"){
              cols.push({"title":title, "data":t, className: "right aligned", render: $.fn.dataTable.render.number(',', '.', 2, '$') });
            }else if (colSet.Render==="numberplain"){
              cols.push({"title":title, "data":t, className: "right aligned", render: $.fn.dataTable.render.text() });
            }else if (colSet.Render==="text"){
              cols.push({"title":title, "data":t, className: "right aligned", render: $.fn.dataTable.render.text() });
            }else if (colSet.Render==="largenumber"){
              cols.push({"title":title, "data":t, className: "right aligned", render: function (data){return '\u200C'+data} });
            }else{
              cols.push({"title":title, "data":t});
            }
            
        }else{ //No settings for this column
           title = t;
           if ((typeof data[0][t] == "number") && (!/Year|_ID$|Zip|NPI/i.test(t))){
             if(Number.isInteger(data[0][t]))
                cols.push({"title":title, "data":t, className: "dt-body-right", render: $.fn.dataTable.render.number( ',', '.', 0 ) });
             else
                cols.push({"title":t, "data":t, className: "dt-body-right", render: (data) => (data ? data.toLocaleString() : data) });
           }
           else{
             cols.push({"title":title, "data":t});
           }
        }
           fils.push({column_number: i,filter_type: "text",filter_delay: 500,filter_reset_button_text:"<i class='times circle icon'></i>"});
           i++;
      }



       var opts = {};
       opts = {
          "data"   : data,
          "columns": cols,
          "language": { search: "", emptyTable: "No Data returned for this Selection" },
          "deferRender": false,
          "buttons": true,
          "scrollX": 500,
          "scrollY": 500,
          "scroller": false,
          "scrollCollapse": true,
          "destroy": true,
          "fixedcolumns": true,
//          "responsive":false,
          "order"  : [],
          "aaSorting": [],
          "pageLength": 10,
          "paging":true,
          "pagingType":"full_numbers",
          "dom":    "<'ui stackable grid dataTables_wrapper no-footer'"+
                            "<'left aligned eight wide column'B>"+
                            "<'right aligned eight wide column'l>"+
                            "<'sixteen wide column'tr>"+
                            "<'left aligned four wide column'i>"+
                            "<'right aligned twelve wide column'p>"+
                    ">"
                   ,"buttons":[]  //"copy","excel"]
       };
       
       if (rxds.app.config.language=="JP") {opts.language=japanese_options();}
       
//      if  (obj.config.export && obj.config.export.match(/ExcelDB/))
//         opts.buttons=["copy"];
      
      const limitRows =  obj.config.limit_rows?Number(obj.config.limit_rows):1000;
      if ( ((data.length == limitRows) ||   obj.config.export && obj.config.export.match(/CSV/)) 
            && (obj.config.server_filter !== 'Y'))
         opts.buttons.push(export_button('csv', obj, full_data));
      if  (obj.config.export && obj.config.export.match(/PSV/))
         if (obj.config.server_filter !== 'Y')  
             opts.buttons.push(export_button('psv', obj, full_data));
         else     
             opts.buttons.push(export_button_server('psv', obj, full_data));
      if  (obj.config.export && obj.config.export.match(/ExcelDB/))
         opts.buttons.push(export_button_server('xlsx', obj, full_data));
            
      if ((obj.config.server_filter == 'Y') && (!data_in.qerr)) {
         opts.processing = false;
         opts.serverSide = true;
         opts.searchDelay = 350;
         opts.data=[];
         //if (rxds.app.app.name == "AppWiki")
          opts.buttons.push(export_button_server('csv', obj, full_data));
         opts.ajax = function (data, callback, settings) {
            var param = rxds.m.get_parameters(obj.dependent_items, obj.dependent_regions);
            param.datatable_data = data;
            //console.log("Sent to KDB");
            //console.log(param);
            rxds.m.fetchAsync(k, obj, obj.query_id,param,obj.dataset_format).then(
                  function(data){
                    //console.log("Returned from KDB ");
                    //console.log(data);
                    var json = {},d;
                    d=data.result?data.result:data;
                    obj.infi_hash = d.dname;
                    d=d.res?d.res:d;
                    if (typeof d.draw !== "undefined") {
                      json.recordsTotal = d.recordsTotal?d.recordsTotal:d.length;
                      json.recordsFiltered = d.recordsFiltered?d.recordsFiltered:d.length;
                      if (data.draw) d.draw=d.draw;
                      obj.recordsFiltered=d.recordsFiltered;
                      if (d.recordsFiltered===0) {
                        json.data=[];
                      }
                      else {
                      json.data = d.table?d.table:d.res.table;
                      }
                      callback(json);
                     }  
                    else {
                      json.recordsTotal = data.recordsTotal?data.recordsTotal:d.length;
                      json.recordsFiltered = data.recordsFiltered?data.recordsFiltered:d.length;
                      if (data.draw) json.draw=data.draw;
                      json.data = d;
                      callback(json);
                    }
                  }
              );

         }
      } else if (data.length <= opts.pageLength) {
          opts.paging = false;
          opts.dom = `<'ui grid dataTables_wrapper no-footer'
                                <'left aligned eight wide column'B>
                                <'right aligned eight wide column'l>
                                <'sixteen wide column'tr>
                        >`;
     }
     
      var table;
      if (obj.config.region_config) {
        
          try {
          var config_fn=new Function('opts','data', 'rxds', 'div', 'obj', 'rxds_full', obj.config.region_config);
          table = config_fn(opts, data, rxds.m.managers["Report"], div, obj, rxds);
          title_arr = opts.columns.map(v=>v.title);
          if (!obj.config.region_config.match(/.DataTable/))
               table = $(div).DataTable(opts);
          } catch (e) {
             console.log("Error setting configuration " + obj.config.title); console.log(e);
             table = $(div).DataTable(opts);
         }
      }
      else {
        title_arr = opts.columns.map(v=>v.title);
        table = $(div).DataTable(opts);
      }  
      obj.table=table;
      obj.titles=title_arr; 

//Create buttons to the top left of the DT

   if (opts.buttons) {

     table.buttons().container()
            .appendTo( $('div.eight.wide.column:eq(0)', table.table().container()) );
   }
   if (fils.length>0 && obj.config.column_filter == 'Y') {   
       yadcf.init(table,fils);
       if (obj.config.server_filter !== 'Y') table.columns.adjust().draw();
   }
} //loadDataTable
