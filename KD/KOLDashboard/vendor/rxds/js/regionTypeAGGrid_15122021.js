export async function load(k, obj, data, full_data) {
    if (data) {
      await loadAG(k,obj, data, full_data);
    }
}

export async function refresh(k,obj, data, full_data){
    if (data) {
      await loadAG(k,obj, data, full_data);
    }
}
export function resize(k, obj) {
  obj.table.columns.adjust().draw();
}

export function  get_param(p) {
  return rxds.m.get_param(p);
}

export function get(k,obj) {
    if ( (rxds.m.get_param("TABLE_NAME") == obj.TABLE_NAME) && (rxds.m.get_param("DATA_VIEW") == obj.DATA_VIEW) )
        return obj.ag_state;
}


// create ServerSideDatasource with a reference to your server
function ServerSideDatasource(k, obj) {
    this.k = k;
    this.obj= obj;
}

ServerSideDatasource.prototype.getRows = function(params) {
    // invoke your server with request params supplied by grid
            var obj=this.obj,result={"data":[],lastRow:0};
            const ds=this;
            var param = rxds.m.get_parameters(obj.dependent_items, obj.dependent_regions);
            var pivot_cols = obj.opts.columnApi.getPivotColumns().map(v=>v.colId);
            var last_result = rxds.m.query_tracker[obj.query_id];
            var last_table_meta;
            param.aggrid_data = params.request;
            param.aggrid_data.calc_cols = obj.calc_cols;
            param.aggrid_data.pivot_cols_map = obj.pivot_cols_map;  //Udhay - to fix the pivot and group issue
            param.aggrid_data.pivot_cols_def = obj.pivot_cols_def;
            if (obj.last_meta && obj.opts.columnApi.isPivotMode() && pivot_cols && obj.last_pivot_cols && (pivot_cols.toString() == obj.last_pivot_cols.toString())) {
                param.aggrid_data.last_meta = obj.last_meta;
                param.aggrid_data.last_newct = obj.last_newct;
            }          
            if(last_result && last_result.data && last_result.data.result && last_result.data.result.res && last_result.data.result.res.meta) {
                  last_table_meta = last_result.data.result.res.meta;
            }
            param.aggrid_data.last_table_meta = last_table_meta;

            console.log("Sent to KDB");
            console.log(param);


           const ag_state = {"col_state":obj.opts.columnApi.getColumnState(), 
                    "filter_state": obj.opts.api.getFilterModel(),
                    "sort_state": obj.opts.api.getSortModel(),
                    "calc_cols": obj.calc_cols,
                    "pivot_cols":pivot_cols,
                    "pivot_mode":obj.opts.columnApi.isPivotMode(),
                    "pivot_cols_map": obj.pivot_cols_map,   //Udhay - to fix the pivot and group issue
                    "pivot_cols_def": obj.pivot_cols_def
           };
            if (obj.ag_state) {
               if (JSON.stringify(ag_state) !== JSON.stringify(obj.ag_state)) {
                 obj.ag_state = ag_state;
                 rxds.m.postPageView();
               }
            } else {
              obj.ag_state =ag_state;
            }
            rxds.m.fetchAsync(this.k,obj, obj.query_id,
                  param,obj.dataset_format).then(
                  function(data){
                    console.log("Returned from KDB ");
                    console.log(data);
                    var json = {},d;
                    if (data.qerr) {
                      console.log(data.qerr);
                      //Udhay - to show show empty table when there is an error from the kdb
                      result.data = [];
                      //result.data=obj.data;
                      result.lastRow=obj.data.length;
                    } else {
                      d=data.result?data.result:data;
                      obj.infi_hash = d.dname;
                      result.lastRow=d.res?(d.res.LastRow?d.res.LastRow:1):1;
                      result.data=d.res?(d.res.table?d.res.table:d):d;
                      result.newct=d.newct;
                      if (obj.opts.columnApi.getValueColumns().length == 0) {
                         delete obj.last_meta;
                      }
                      if (obj.opts.columnApi.getValueColumns().length>0) {
                         obj.last_meta=d.res.meta;
                         obj.last_newct=d.newct;
                         obj.last_pivot_cols = pivot_cols;
                      }
                    
                      if(d.res && d.res.jsond && d.res.jsond.aggrid_data.groupKeys 
                             && d.res.jsond.aggrid_data.groupKeys.length === 0) {
                        let pivot_cols_keys = Object.keys(result.newct).filter(v => v.match("CPIV"));
                        //Udhay - to fix the pivot and group issue
	                      pivot_cols_keys.forEach(v => obj.pivot_cols_map[v] = result.newct[v]);
                      }
                      console.log("Pivot column Mapping: ", obj.pivot_cols_map);
                      //result.secondaryColDefs=d.res?(d.res.pivheader_data?d.res.pivheader_data:null):null;
                    }
                    params.successCallback(result.data, result.lastRow);
                    //updateSecondaryColumns(obj, params.request, result);
                   //if (result.secondaryColDefs && result.secondaryColDefs !== "NA")
                      ds.setSecondaryColsIntoGrid(result.data[0], result.newct);
                  }
              );
    
};
// we only set the secondary cols if they have changed since the last time. otherwise
// the cols would reset every time data comes back from the server (which means col
// width, positioning etc would be lost every time we eg expand a group, or load another
// block by scrolling down).
ServerSideDatasource.prototype.setSecondaryColsIntoGrid = function (row1, col_map) {
    const obj=this.obj;
    const secondaryColDefs=this.fixCols(obj,row1,col_map);
    
    var colDefHash = this.createColsHash(secondaryColDefs);
    console.log(secondaryColDefs);
    if (this.colDefHash !== colDefHash) {
        obj.opts.columnApi.setSecondaryColumns(secondaryColDefs);
        //this.gridOptions.columnApi.setSecondaryColumns(secondaryColDefs);
        this.colDefHash = colDefHash;
    }
};

ServerSideDatasource.prototype.fixCols = function(obj,row1,col_map) {
        //var row1=temp1.result.res.table[0]
        var cols=Object.keys(row1).filter(v=>{return col_map[v].match(/\|/)})
        var col_headers=col_map;
        
        var s=[],s1={}
        obj.seccol=[];
        cols.forEach(w=>{
            const v=col_map[w];
            obj.seccol.push(v.replace(/\|/,'/'));
            var i=0,c="",pc,p=v.split(/\|/);
            const l=p.length;
            for(;i<l;i++) {
                var o;
                pc=c;
                if (i>0) c=c+"|"+p[i]; else c=p[i];
                if((i+1)<l)
                    o={"headerName":p[i],"children":[], "groupID":c};
                else {
                  //o={"headerName":p[i],"field":w, "colId":c};
                  //Udhay - to fix the chart legend issue in pivot mode (testing)s
                  o={"headerName":p[i],"field":w, "colId":c, "pivotKeys":[pc]};
                } 
                
                if (!s1[c]) {
                    s1[c]=o;
                    if(i==0) {
                        if(!s[c]) s.push(o);
                    } else {
                        s1[pc].children.push(o);
                    }
                }    
            }
        });

return s;
};

ServerSideDatasource.prototype.createColsHash = function (colDefs) {
    if (!colDefs) {
        return null;
    }
    var parts = [];
    var that = this;
    colDefs.forEach(function (colDef) {
        if (typeof colDef.children == "object" && colDef.children.colId) {
          const c=colDef.children;
          colDef.children=[{"colId":c.colId[0],"headerName":c.headerName[0],"field":c.field[0]}];
        }
        if (colDef.children) {
            parts.push(colDef.groupId);
            parts.push('[' + that.createColsHash(colDef.children) + ']');
        } else {
            parts.push(colDef.colId);
            // headerName can change if the aggFunc was changed in a value col. if we didn't
            // do this, then the grid would not pick up on new header names as we move from
            // eg min to max.
            if (colDef.headerName) {
                parts.push(colDef.headerName);
            }
        }
    });
    return parts.join(',');
};


function numberCellFormatter(params) {
  let formattedNumber = Math.floor(Math.abs(params.value)).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
  return params.value < 0 ? '(' + formattedNumber + ')' : formattedNumber;
}

//export_button_server('psv', obj, full_data)

function export_post(file_type, obj, full_data, params) {
       //Create an hidden form
              //alert( 'Not yet implemented' );
    var url, titles;
    if (file_type=="psv") titles=obj.titles.join('|'); else titles=obj.titles.join(',');
    if (obj.seccol && obj.seccol.length>0) {
        if (file_type=="psv") titles=titles+obj.seccol.join('|'); else titles=titles+obj.seccol.join(',');
    }
    
    //Udhay - Updating the header based on different ag_grid states
    let new_header;
    if(obj.config.server_filter === "Y") {
      try {
        let new_titles = [];
        let result = full_data.result;
        let ag_data = (result.res && result.res.jsond) ? result.res.jsond.aggrid_data : null;

        if(ag_data && ag_data.pivotCols.length) {
            var newct = result.newct;
            if(ag_data.rowGroupCols.length)   
              new_titles = ag_data.rowGroupCols.map(v => v.displayName);
            Object.keys(newct).filter(v => v.match("CPIV")).forEach(v => new_titles.push(newct[v].replace(/\|/g,"-").replace(/^-/,"")));
        }
        else if(ag_data && ag_data.rowGroupCols.length) {
            new_titles = ag_data.rowGroupCols.map(v => v.displayName );
            ag_data.valueCols.forEach(v => {
              let col_name = v.displayName;
              let aggFunc = v.aggFunc ? v.aggFunc : "";
              if(aggFunc) col_name = aggFunc + "(" + col_name + ")";
              new_titles.push(col_name);
            });
        }
        else {
          let cols = Object.keys(result.newct);
          cols.forEach(v => {
              let col_name = obj.cols.find(v1 => v1.field === v).headerName;
              let aggFunc = obj.ag_state.col_state.find(v1 => v1.colId === v);
              aggFunc = aggFunc ? aggFunc.aggFunc : "";
              if(aggFunc) col_name = aggFunc + "(" + col_name + ")";
              new_titles.push(col_name);
          });
        }
        if (file_type=="psv") new_header=new_titles.join('|');
        else new_header=("\"" + new_titles.join("\",\"") + "\"");
        
      } catch(err){
        console.error(err);
        new_header = titles;
      }
    }
    //Udhay - End of code Updating the header based on different ag_grid states
    
    params.titles= new_header;
    
    //params.export_file = obj.config.title.replace(/ /g,"_")+"_"+new Date().toISOString();
    params.export_file = (rxds.app.page.config.title + "-" + obj.config.title).replace(/ /g,"_");
    
            if (rxds.is_home)  url='download_file';
            else url='../download_file';

     if (rxds.m.get_param("DBNAME")) {
       params.DBNAME = rxds.m.get_param("DBNAME");
     }
          
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
  var params = { cache_id:full_data.disk,query_id:obj.query_id,format:file_type };
  export_post(file_type, obj, full_data, params);
}

function export_button_server(file_type, obj, full_data) {
  //Udhay - Show alert if the record count exceeds 100k for excel export
  let rec_count = full_data.res ? full_data.res.LastRow : full_data.result.res.LastRow;
  let col_count = full_data.res ? full_data.res.meta.length : full_data.result.res.meta.length;
  let message;
  if(file_type === "xlsx") {
    /*if(rec_count > 100000 || col_count > 100){
      //message = "This export doesn't support records more than 100k, Please try CSV/PSV export options.";
      //$(".ui.modal.custom-modal .custom-content").html("This export doesn't support records more than 100k, Please try CSV/PSV export options.");
    }*/
    //if(rec_count > 100000 || col_count > 100 || (rec_count > 80000 && col_count > 25) || (rec_count > 50000 && col_count > 40)){
    if(rec_count > 100000 || col_count > 200 || (rec_count > 80000 && col_count > 25) || (rec_count > 50000 && col_count > 40) || (rec_count > 25000 && col_count > 100)){
      //message = "Number of records or columns exceeds the export limit, Please try CSV/PSV options.";
      //message = "You are trying to export large data with either more fields or records, Plese try CSV/PSV export options for this view.";
      message = "You are trying to export a dataset with large amount of rows and/or fields, Plese use CSV/PSV export options.";
    }
    if(message) {
      $(".ui.modal.custom-modal .custom-content").html(message);
      $(".ui.modal.custom-modal").modal("show");
      return;
    }
  }
  const cache_id=obj.infi_hash?obj.infi_hash: full_data.disk; 
  const server_filter=obj.infi_hash?2:0; 
  var params = { cache_id:cache_id,server_filter:server_filter,query_id:obj.query_id,format:file_type };
  export_post(file_type, obj, full_data, params);
}

function add_column(colDef,obj,calctype,calctype_fn,datatype) {
  var calcCol;
  if (datatype == "number") {
    calcCol={"headerName":calctype + " " +colDef.headerName, "field":"calc_" + calctype_fn + "_" +colDef.field, filter: "agNumberColumnFilter", type: "numericColumn" }
  }else if (datatype == "text") {
    calcCol={"headerName":calctype + " " +colDef.headerName, "field":"calc_" + calctype_fn + "_" +colDef.field, filter: "agTextColumnFilter", allowedAggFuncs:['count']}
  }else if (datatype == "date") {
    calcCol={"headerName":calctype + " " +colDef.headerName, "field":"calc_" + calctype_fn + "_" +colDef.field, filter: "agDateColumnFilter", allowedAggFuncs:['count']}
  }
  const llbase=obj.cols.findIndex(v=>v.field==colDef.field);
  obj.cols.splice(llbase,0,calcCol);
  //console.log(obj.cols);
  calcCol.base_field=colDef.field;
  calcCol.calctype=calctype_fn;
  //if (!calcCol.type) calcCol.type = "textColumn";
  obj.calc_cols.push(calcCol);
  //obj.opts.api.deltaColumnMode=true;
  var cur_state=obj.opts.columnApi.getColumnState();
  cur_state=cur_state.filter(w=>w.hide);
  cur_state.map(v=>{
    var w=obj.cols.find(x=>x.field==v.colId);
    if (w) w.hide=true;
  });
  
  obj.opts.api.setColumnDefs(obj.cols);
  obj.opts.api.purgeServerSideCache();
  //obj.opts.api.resetColumnState();

} 

function getContextMenuItems(params, obj, full_data) {
    const c=params.column.userProvidedColDef;
    //var result = params.defaultItems ? params.defaultItems.splice(0) : [];
    var result = params.defaultItems ? params.defaultItems.filter(v => v !== "pivotChart").splice(0) : [];  //Udhay - to disable pivot chart option
    if (c.filter =="agDateColumnFilter") {
        result.push({
                name: 'Add Calculation',
                subMenu: [{name: 'Year',
                    action: function() {add_column(c,obj,"Year", "ag_year", "number");}
                    },{name: 'Year Month',
                    action: function() {add_column(c,obj,"YearMonth", "ag_yearmonth", "text");}
                    },{name: 'Year Qtr',
                    action: function() {add_column(c,obj,"YearQtr", "ag_yrqtr", "text");}
                    }/*,{name: 'Add Year',  //Udhay - Removed this as this is not working, not available in kxgrid.q file
                    action: function() {add_column(c,obj,"agf_plus1", "date");}
                    }*/]
            });
    } 
    
    /*  Udhay - to disable the Add Calculation options for strinng and number fields as these are not working
    else if  (c.filter =="agTextColumnFilter") {
        result.push({
                name: 'Add Calculation',
                subMenu: [{name: 'Rollup less used',
                    action: function() {add_column(c,obj,"ag_most_used", "text");}
                    }]
            });
    }  
    else if  (c.filter =="agNumberColumnFilter") {
        result.push({
                name: 'Add Calculation',
                subMenu: [{name: 'Rounded Bins',
                    action: function() {add_column(c,obj,"Rounded Bins", "ag_rnd2", "text");}
                    },{name: 'Equal Width Bins',
                    action: function() {add_column(c,obj,"Equal Width", "ag_eqw2", "text");}
                    },{name: 'Equal Count Bins',
                    action: function() {add_column(c,obj,"Equal Count", "ag_eqc2", "text");}
                    },{name: 'Equal Sum Bins',
                    action: function() {add_column(c,obj,"Equal Sum", "ag_dec2", "text");}
                    },{name: 'K-Means Cluster',
                    action: function() {add_column(c,obj,"kMeans", "ag_hkm2", "text");}
                    },{name: 'cK-Means Cluster',
                    action: function() {add_column(c,obj,"ckMeans", "ag_ckm2", "text");}
                    },{name: 'ML K-Means Cluster',
                    action: function() {add_column(c,obj,"MLkMeans", "ag_mlp2", "text");}
                    }
                    ]
            });
    }
    */
      
    result.push('separator');
    let kdb_res = rxds.m.query_tracker[obj.query_id];
    result.push(    
        {
            name: 'Export All',
            subMenu: [
                {
                    name: 'CSV',
                    action: function() {
                      //Udhay - to fix export issue on right click
                      $("#region" + obj.region.region_id).find(".AG-buttons .button.csv").click();

                      /*if(kdb_res.data.qerr || !kdb_res.data.result.res.LastRow) {
                        $(".ui.modal.no-data-message").modal("show");
                        return;
                      }
                      export_button_server('csv',obj,full_data);*/
                    }
                },
                {
                    name: 'Excel',
                    action: function() {
                      //Udhay - to fix export issue on right click
                      $("#region" + obj.region.region_id).find(".AG-buttons .button.xlsx").click();
                      /*
                      if(kdb_res.data.qerr || !kdb_res.data.result.res.LastRow) {
                        $(".ui.modal.no-data-message").modal("show");
                        return;
                      }
                      export_button_server('xlsx',obj,full_data);*/
                    }
                },
                {
                    name: 'PSV',
                    action: function() {
                      //Udhay - to fix export issue on right click
                      $("#region" + obj.region.region_id).find(".AG-buttons .button.psv").click();
                      
                      /*if(kdb_res.data.qerr || !kdb_res.data.result.res.LastRow) {
                        $(".ui.modal.no-data-message").modal("show");
                        return;
                      }
                      export_button_server('psv',obj,full_data);*/
                    }
                }
            ]
        });
    return result;
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

function formatNumber(number) {
    // this puts commas into the number eg 1000 goes to 1,000,
    // i pulled this from stack overflow, i have no idea how it works
    if (number)
       return number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    return number;
}

function numFormatter(params) {
    if(!params.value)
      return params.value;
    return params.value.toLocaleString();
}

function num0Formatter(params) {
    if(params.value == null)
      return params.value;
    return formatNumber(Math.round(params.value));
}

function num2Formatter(params) {
    if(params.value == null)
      return params.value;
    return formatNumber(Math.round(params.value,2));
}

function per0Formatter(params) {
    if(params.value == null)
      return params.value;
    return formatNumber(Math.round(params.value)) + ' %';
}

function per2Formatter(params) {
    if(params.value == null)
      return params.value;
    return formatNumber(Math.round(params.value,2)) + '%';
}
function largenumFormatter(params) {
    if(params.value == null)
      return params.value;
     return '\u200C'+ params.value;
}

function count_distinct(val) {
  console.log("cnt_dist",val);
   return 1;
}
function autoSizeAll(opts, skipHeader) {
    var allColumnIds = [];
    opts.columnApi.getAllColumns().forEach(function(column) {
        allColumnIds.push(column.colId);
    });

    opts.columnApi.autoSizeColumns(allColumnIds, skipHeader);
}


function dollarFormatter(params) {
    return '$'+formatNumber(Math.round(params.value,2)) ;
}
export async function loadAG(k,obj, data_in, full_data) {
    var data, meta={};
    var div = "#GRID" + k; 
    
    var cols=[],fils=[],i=0;
    
    if (obj.opts &&  obj.opts.api) {
      obj.opts.api.destroy();
      delete obj.ag_state;
    }
     
    if (typeof data_in.table !== "undefined") data = data_in.table; else data=data_in;
    if (typeof data_in.res !== "undefined") {
        data = data_in.res.table;
        if (typeof data_in.res.meta !== "undefined") {
          data_in.res.meta.forEach(v=>{
            meta[v.c] = v.t;
          });
        }
    }    
    if (obj.config.region_transform) {
        var data_binding = {};
        var transform_fn=new Function('data','db', 'rxds', obj.config.region_transform);
        data = transform_fn(data,data_binding, rxds.m.managers["Report"]);        
    };

      
      for(var t in data[0]) {
        var title;
        //Is there a config for this column?
        var colSet=rxds.app.report_headers[t];
        if (colSet !== undefined && !rxds.app.app.name.match(/Data Explorer/)) {
           title=colSet.Label?colSet.Label:t;
           if (colSet.Render==="number"){
              cols.push({"headerName":title, "field":t, filter: "agNumberColumnFilter", valueFormatter: num0Formatter, type: "numericColumn" });
            }else if (colSet.Render==="number2"){
              cols.push({"headerName":title, "field":t, filter: "agNumberColumnFilter", valueFormatter: num2Formatter, type: "numericColumn" });
            }else if (colSet.Render==="percentage"){
              cols.push({"headerName":title, "field":t, filter: "agNumberColumnFilter", valueFormatter: per0Formatter, type: "numericColumn" });
            }else if (colSet.Render==="percentage2"){
              cols.push({"headerName":title, "field":t, filter: "agNumberColumnFilter", valueFormatter: per2Formatter, type: "numericColumn" });
            }else if (colSet.Render==="currency"){
              cols.push({"headerName":title, "field":t, valueFormatter: dollarFormatter, filter: "agNumberColumnFilter", type: "numericColumn" });
            }else if (colSet.Render==="date"){
              cols.push({"headerName":title, "field":t, filter: "agDateColumnFilter", allowedAggFuncs:['count']});
            }else if (colSet.Render==="text"){
              cols.push({"headerName":title, "field":t, filter: "agTextColumnFilter", allowedAggFuncs:['count']});
            }else if (colSet.Render==="numberplain"){
              cols.push({"headerName":title, "field":t, filter: "agNumberColumnFilter", allowedAggFuncs:['count']});
            }else if (colSet.Render==="largenumber"){
              cols.push({"headerName":title, "field":t, valueFormatter: largenumFormatter, filter: "agNumberColumnFilter"});
            }else{
              cols.push({"headerName":title, "field":t, filter: "agTextColumnFilter", allowedAggFuncs:['count']});
            }
        }else{ //No settings for this column
            if(meta[t]) {
              if(meta[t].match(/h|i|j|e|f/)){
                cols.push({"headerName":t, "field":t, filter: "agNumberColumnFilter", filterParams:{ buttons:['clear','reset']},"type": "numericColumn"});
              }
              else if(meta[t].match(/d|m/)){
                cols.push({
                  "headerName":t, 
                  "field":t, 
                  "filter": "agDateColumnFilter", 
                  "filterParams":{ 
                    "buttons":['clear','reset'],
                    "filterOptions": ['equals', 'notEqual', 'lessThan', 'greaterThan', 'inRange', 'empty'],
                    "inRangeInclusive": true
                  }, 
                  "allowedAggFuncs":['count']
                });
              }
              else if(meta[t].match(/p|z/)) {
                cols.push({
                  "headerName":t, 
                  "field":t, 
                  "filter": "agDateColumnFilter", 
                  "filterParams":{ 
                    "buttons":['clear','reset'],
                    "filterOptions": ['inRange', 'lessThan', 'greaterThan', 'empty'],
                    "inRangeInclusive": true
                  }, 
                  "allowedAggFuncs":['count']
                });
              }
              else if(meta[t].match(/n|u|v|t/)) {
                cols.push({
                  "headerName":t, 
                  "field":t,
                  "filter": false,
                  //"filter": "agTextColumnFilter",
                  "filterParams":{ 
                    "buttons":['clear','reset'],
                    "filterOptions": ['equals','notEqual', 'empty'],
                  },
                  "allowedAggFuncs":['count']
                });
              }
              //else if(meta[t].match(/C|c|s|g/)) {
              else {
                cols.push({"headerName":t, "field":t, filter: "agTextColumnFilter", filterParams:{ buttons:['clear','reset']}, allowedAggFuncs:['count']});
              }
            }
            else if(typeof data[0][t] == "string") {
              cols.push({"headerName":t, "field":t, filter: "agTextColumnFilter", allowedAggFuncs:['count']});
            }
            else if(typeof data[0][t] == "number") {
              cols.push({"headerName":t, "field":t, filter: "agNumberColumnFilter"});
              /*
               if (/Year|ID$|Zip|NPI/i.test(t)) {
                  cols.push({"headerName":t, "field":t, filter: "agNumberColumnFilter", allowedAggFuncs:['count']});
               }
               else if(Number.isInteger(data[0][t])) {
                 cols.push({
                   "headerName":t, "field":t, filter: "agNumberColumnFilter", "valueFormatter1": num0Formatter,type: "numericColumn"
                 });
               }
               else {
                 cols.push({
                   "headerName":t, "field":t, filter: "agNumberColumnFilter", "valueFormatter1": numFormatter,"type": "numericColumn"
                 });
               }*/
             }
             else{
               cols.push({"headerName":t, "field":t, filter: "agTextColumnFilter", allowedAggFuncs:['count']});
             }
        }
        
        //Udhay - delay filters from getting applyed
        var debounceMs = 1500;
        var buttons = ['apply', 'clear', 'reset', 'cancel'];
        cols.forEach(v => {
          if(v.filterParams) {
            v.filterParams.debounceMs = debounceMs;
            v.filterParams.buttons = buttons;
          }
          else {
            v.filterParams = { debounceMs,buttons }
          }
        });
        
        fils.push({column_number: i,filter_type: "text",filter_delay: 500,filter_reset_button_text:"<i class='times circle icon'></i>"});
        i++;
      }


       var opts = {};
   
      const ctx= function(params) {
         return getContextMenuItems(params,obj, data_in);
      };
     
      opts = {
        /*aggFuncs: {
          count_distinct: count_distinct 
        },*/
        defaultColDef: {
          // allow every column to be aggregated
          enableValue: true,
          resizable:true,
          // allow every column to be grouped
          enableRowGroup: true,
          // allow every column to be pivoted
          enablePivot: true,
          sortable: true,
          filter: true
        },
        columnTypes: {
          dimension: {
            enableRowGroup: true,
            enablePivot: true,
          },
          measure: {
            width: 150,
            aggFunc: 'sum',
            enableValue: true,
            cellClass: 'number',
            valueFormatter: numberCellFormatter,
            cellRenderer:'agAnimateShowChangeCellRenderer',
            allowedAggFuncs: ['avg','sum','min','max'],
            cellClassRules: {'negative': 'x < 0'}
          }
        },
        //autoGroupColumnDef: {
        //  headerName: 'Hierarchy',
        //  width: 200
        enableCharts: true,
        enableRangeSelection: true, 
        columnDefs: cols,
        cacheBlockSize: 100,
        rowGroupPanelShow: 'always',
        pivotPanelShow: 'always',
        suppressAggFuncInHeader: false,
        blockLoadDebounceMillis: 100,
        deltaColumnMode:true, // Resets user changes when adding a new column
        animateRows: false,
        floatingFilter: true,
        allowDragFromColumnsToolPanel: true,
        statusBar: {
          statusPanels: [
              { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left',key: 'totalRowComponent' },
              { statusPanel: 'agTotalRowCountComponent', align: 'center' },
              { statusPanel: 'agFilteredRowCountComponent' },
              { statusPanel: 'agSelectedRowCountComponent' },
              { statusPanel: 'agAggregationComponent' }
          ]
        },
        sideBar: {  //detailed properties of sidebar
            toolPanels: [
                {
                    id: 'columns',
                    labelDefault: 'Columns',
                    labelKey: 'columns',
                    iconKey: 'columns',
                    toolPanel: 'agColumnsToolPanel',
                },
                {
                    id: 'filters',
                    labelDefault: 'Filters',
                    labelKey: 'filters',
                    iconKey: 'filter',
                    toolPanel: 'agFiltersToolPanel',
                }
            ],
            defaultToolPanel: 'columns',
        }
        //sideBar: true   //shotcut for sidebar
     };
     
     //Udhay - Conditions to support option to disable some AG-Grid options
        let ag_options = obj.config.aggrid_options || "";
        
        if(!ag_options.match(/Chart/)) {  //disabling the charting option
            opts.enableCharts = false;
        }
        
        if(!ag_options.match(/Pivot/)) {  //disabling the pivot option
            opts.defaultColDef.enablePivot = false;
            opts.pivotPanelShow = 'never';
            opts.pivotMode = false;
            if(opts.sideBar.toolPanels[0].toolPanelParams) {
                opts.sideBar.toolPanels[0].toolPanelParams.suppressPivotMode = true;
                opts.sideBar.toolPanels[0].toolPanelParams.suppressPivots = true;
            } else {
                opts.sideBar.toolPanels[0].toolPanelParams = {
                    suppressPivotMode: true,
                    suppressPivots: true
                }
            }
        }
        
        if(!ag_options.match(/Grouping/)) {   //disabling the group-by option
            opts.defaultColDef.enableValue = false;
            opts.defaultColDef.enableRowGroup = false;
            opts.rowGroupPanelShow = 'never';
            if(opts.sideBar.toolPanels[0].toolPanelParams) {
                opts.sideBar.toolPanels[0].toolPanelParams.suppressRowGroups = true;
                opts.sideBar.toolPanels[0].toolPanelParams.suppressValues = true;
            } else {
                opts.sideBar.toolPanels[0].toolPanelParams = {
                    suppressRowGroups: true,
                    suppressValues: true
                }
            }
        
            //Removing pivot option as pivot will not work without group-by options
            opts.defaultColDef.enablePivot = false;
            opts.pivotPanelShow = 'never';
            opts.pivotMode = false;
            opts.sideBar.toolPanels[0].toolPanelParams.suppressPivotMode = true;
            opts.sideBar.toolPanels[0].toolPanelParams.suppressPivots = true;
        }
     
     //console.log(opts);
      /************** Add export buttons above the Grid **************/
      //Udhay - Add export buttons above the Grid
      $("#CONT" + obj.region.region_id + " .AG-buttons").empty();
      if(obj.config.export) {
        function getExportBtnElem(file_type, label){
          let rtn = "<button class='ui button " + file_type + "' area-control='GRID" + obj.region.region_id + "'>" + label + "</button>";
          if(obj.config.server_filter === "Y")
            rtn = $(rtn).click(function() {
              if( full_data.qerr || (full_data.result.res && !full_data.result.res.LastRow) || !full_data.result.res) {
                $(".ui.modal.no-data-message").modal("show");
                return;
              }
              export_button_server( file_type, obj, full_data );
            });
          else
            rtn = $(rtn).click(function() {
              export_button( file_type, obj, full_data );
            });
          return rtn;
        }
        if(obj.config.export.match("CSVDB")) {
          $("#CONT" + obj.region.region_id + " .AG-buttons").append(getExportBtnElem("csv", "Full Export (CSV)"));
        }
        if(obj.config.export.match("ExcelDB")) {
          $("#CONT" + obj.region.region_id + " .AG-buttons").append(getExportBtnElem("xlsx", "Full Export (XLSX)"));
        }
        if(obj.config.export.match("PSVDB")) {
          $("#CONT" + obj.region.region_id + " .AG-buttons").append(getExportBtnElem("psv", "Full Export (PSV)"));
        }
      }
      else {
        $("#CONT" + obj.region.region_id + " .AG-buttons").hide();
      }
      /************** End of code to add export buttons above the Grid **************/
       /*
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
    */
      var table, datasource;
      $(div).height(Number(obj.config.height)*window.innerHeight/100);

      var gridDiv = document.querySelector(div);
    
    
      if ((obj.config.server_filter == 'Y') && (!data_in.qerr)) {
         var datasource = new ServerSideDatasource(k, obj);
         opts.rowModelType = 'serverSide';
         opts.rowData  = data;
         opts.getMainMenuItems= ctx;
         opts.getContextMenuItems= ctx;
 
        // fetch 100 rows per at a time
         opts.cacheBlockSize = 100;
         // only keep 10 blocks of rows
         opts.maxBlocksInCache= 10;
         opts.animateRows = true;
         //opts.debug= true;
      } else {  opts.rowData  = data;}/*else if (data.length <= opts.pageLength) {
          opts.paging = false;
          opts.dom = `<'ui grid dataTables_wrapper no-footer'
                                <'left aligned eight wide column'B>
                                <'right aligned eight wide column'l>
                                <'sixteen wide column'tr>
                        >`;
     } */

      if (obj.config.region_config) {
          var config_fn=new Function('opts','data', 'rxds', 'div', 'obj', 'rxds_full', obj.config.region_config);
          table = config_fn(opts, data, rxds.m.managers["Report"], div, obj, rxds);
          if (!obj.config.region_config.match(/.agGrid/))
            table = new agGrid.Grid(gridDiv, opts);
               //table = $(div).DataTable(opts);
      }
      else table = new agGrid.Grid(gridDiv, opts);
      obj.resize_needed=0;

      //let totRowCount = "-";
      //let is_groupnig_expanded = false;
      
      /*opts.api.addEventListener("columnRowGroupChanged", function(v) {
        console.log("columnRowGroupChanged");
        if(obj.ag_state.pivot_mode) {
          delete obj.last_meta;
          delete obj.last_newct;
        }
      });*/
      
      opts.api.addEventListener("columnValueChanged", function(v) {
        console.log("columnValueChanged");
        if(obj.ag_state.pivot_mode) {
          delete obj.last_meta;
          delete obj.last_newct;
        }
      });
      
      opts.api.addEventListener("columnPivotChanged", function(v) {
        console.log("columnPivotChanged");
        if(obj.ag_state.pivot_mode) {
          delete obj.last_meta;
          delete obj.last_newct;
        }
      });
      
      
      
      opts.api.addEventListener("modelUpdated", function(v) {
          //console.log("Model Updated", v,obj.ag_state);
        /****************** to show total record count at the bottom of the grid ******************/
          //Udhay - to show total count at the bottom of the grid
          let kdb_response = rxds.m.query_tracker[obj.query_id];
          let kdb_result = kdb_response.data.result;
          let ag_json_send = kdb_response.json_sent.aggrid_data;
          let totRowCount = kdb_result ? (kdb_result.origtrows.toLocaleString()) : "-";
          let filteredRowCount = kdb_result ? (kdb_result.filteredrows.toLocaleString()) : "-";
          let leftInfoLabel = "";
          let leftInfoNum = "";
          //is_groupnig_expanded = is_groupnig_expanded || (Boolean(ag_json_send.groupKeys.length));
          //filteredRowCount = is_groupnig_expanded ? "-" : filteredRowCount;
          /*
          if( ag_json_send && !ag_json_send.calc_cols.length && !Object.keys(ag_json_send.filterModel).length && 
              !ag_json_send.groupKeys.length && !ag_json_send.pivotCols.length && 
              !ag_json_send.pivotMode && !ag_json_send.rowGroupCols.length && 
              !ag_json_send.sortModel.length && !ag_json_send.valueCols.length ) 
              {
                totRowCount = kdb_response.data.result.res.LastRow.toLocaleString();
          }
          */
          //Add filtered, grouped and total records count
          if(Object.keys(opts.api.getFilterModel()).length){
            leftInfoLabel = "Filtered Records";
            leftInfoNum = filteredRowCount;
          }
          $(div).find(".ag-status-bar .ag-status-bar-left .ag-name-value [ref=eLabel]").html(leftInfoLabel);
          $(div).find(".ag-status-bar .ag-status-bar-left .ag-name-value [ref=eValue]").html(leftInfoNum);
          $(div).find(".ag-status-bar .ag-status-bar-center .ag-name-value").removeClass("ag-hidden");
          $(div).find(".ag-status-bar .ag-status-bar-center .ag-name-value [ref=eLabel]").html("Total Records in Table");
          $(div).find(".ag-status-bar .ag-status-bar-center .ag-name-value [ref=eValue]").html(totRowCount);
          //$(div).find(".ag-status-bar .ag-status-bar-left").html("");   //to remove left side status bar colon for server-side
          
          /****************** End of code to show total row count ******************/
          
          full_data = kdb_response.data;   //udhay - to update full_data object with latest data
          
          //Udhay - to fix pivot and group issue while expanding the row groups
          let secCols = opts.columnApi.getSecondaryColumns();
          obj.pivot_cols_def = secCols ? secCols.map(v => v.userProvidedColDef) : [];
          //console.log("modelUpdated...",obj);
          
          if (obj.resize_needed < 2)    {  obj.resize_needed=obj.resize_needed+1; autoSizeAll(opts, false); }
      });    
      if ((obj.config.server_filter == 'Y') && (!data_in.qerr)) {
         opts.api.setServerSideDatasource(datasource);
      }   
      obj.table=table;
      obj.opts = opts;
      obj.data=data;
      obj.cols=cols;
      obj.calc_cols=[];
      obj.pivot_cols_map = {};  //Udhay - to fix the pivot and group issue
      obj.pivot_cols_def = [];
      obj.titles = cols.map(v=>v.headerName.replace(/\n/g, ' '));

      var param = rxds.m.get_parameters(obj.dependent_items);
      obj.TABLE_NAME=param.TABLE_NAME;
      obj.DATA_VIEW=param.DATA_VIEW;
      
      if (rxds.view && rxds.view.param[obj.config.parameter] && (rxds.view.param.slTables == param.TABLE_NAME) && rxds.view.view_name) {
         obj.ag_state = rxds.view.param[obj.config.parameter];
         if (obj.ag_state.col_state) {
           if (obj.ag_state.calc_cols) {obj.calc_cols=obj.ag_state.calc_cols;}   
         opts.api.setFilterModel(obj.ag_state.filter_state);
         opts.columnApi.setColumnState(obj.ag_state.col_state);
         opts.columnApi.setPivotColumns(obj.ag_state.pivot_cols);
         opts.columnApi.setPivotMode(obj.ag_state.pivot_mode);
         opts.api.setSortModel(obj.ag_state.sort_state);
         }
      } else {
         delete obj.h_pivot;
         delete obj.ag_state;
      }

/*   if (opts.buttons) {

     table.buttons().container()
            .appendTo( $('div.eight.wide.column:eq(0)', table.table().container()) );
   }
   if (fils.length>0 && obj.config.column_filter == 'Y') {   
       yadcf.init(table,fils);
       if (obj.config.server_filter !== 'Y') table.columns.adjust().draw();
   } */
} //loadDataTable

/* 
//Udhay - commenting this as these are not used
function updateSecondaryColumns (obj, request, result) {
  let valueCols = request.valueCols;
  if (request.pivotMode && request.pivotCols.length > 0) {
    let secondaryColDefs = createSecondaryColumns(result.secondaryColumnFields, valueCols);
    obj.opts.columnApi.setSecondaryColumns(secondaryColDefs);
  } else {
    obj.opts.columnApi.setSecondaryColumns([]);
  }
};

function createSecondaryColumns(fields, valueCols) {
  let secondaryCols = [];

  function addColDef(colId, parts, res) {
    if (parts.length === 0) return [];

    let first = parts.shift();
    let existing = res.find(r => r.groupId === first);

    if (existing) {
      existing['children'] = addColDef(colId, parts, existing.children);
    } else {
      let colDef = {};
      let isGroup = parts.length > 0;
      if(isGroup) {
        colDef['groupId'] = first;
        colDef['headerName'] = first;
      } else {
        let valueCol = valueCols.find(r => r.field === first);

        colDef['colId'] = colId;
        colDef['headerName'] =  valueCol.displayName;
        colDef['field'] = colId;
        colDef['type'] = 'measure';
      }

      let children = addColDef(colId, parts, []);
      children.length > 0 ? colDef['children'] = children : null;

      res.push(colDef);
    }

    return res;
  }
  if (fields) {
     fields.sort();
     fields.forEach(field => addColDef(field, field.split('_'), secondaryCols));
  }   
  return secondaryCols;
};
*/
