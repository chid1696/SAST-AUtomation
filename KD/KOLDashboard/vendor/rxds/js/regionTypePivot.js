export async function load(k, obj, data, full_data,param) {
    if (data) {
      await loadPiv(k,obj, data, full_data,param);
    }
}

export async function refresh(k,obj, data, full_data,param){
    if (data) {
      await loadPiv(k,obj, data, full_data,param);
    }
}

export function get(k,obj) {
          return obj.h_pivot;
    }


export async function get_col_histogram(k,obj,col,typeDesc,target) {
  var param = rxds.m.get_parameters(obj.dependent_items);
  const init_dropdown = function(parm) {
        if (parm.mounting) {
           $('#clear_filter').on('click', e=>{$("#Filter_Output").find(".checkbox").checkbox("set unchecked");return false;});
           $('#select_filter').on('click', e=>{$("#Filter_Output").find(".checkbox").checkbox("set checked");return  false;});
           $("#col_bin_type").dropdown({
            action: 'activate',
            onChange: function(value, text, $selectedItem) {
              obj.col_bins[obj.current_col] = value;
               $(target.parentElement.getElementsByClassName("bintype")).dropdown("set selected", value);
              get_col_histogram(k,obj,obj.current_col,typeDesc,target).then();
            }
          });
           $('#apply_filter').on('click', function (e) {
             target = obj.target;
             const vals  = $("#Filter_Output");
             const filters = Array.from(vals.find(".checkbox input:checked")).map(v=>v.dataset?v.dataset.column:"");
             const not_filters = Array.from(vals.find('.checkbox input:not(":checked")')).map(v=>v.dataset?v.dataset.column:"");
             if (not_filters && not_filters.length > 0) {
                 obj.col_filters[obj.current_col] = {selected:filters,not_selected:not_filters};
                 $(target).removeClass("tasks");
                 $(target).addClass("filter");
                 
             } else {
                delete obj.col_filters[obj.current_col];
                 $(target).removeClass("filter");
                 $(target).addClass("tasks");
             }    
             $('.ui.modal.pivot_filter').modal('hide');
             runPivot(k, obj);
             return false;
           });
        } // If mounting
        if (obj.col_filters[parm.vm.column]) {
            $("#Filter_Output").find(".checkbox").checkbox("set unchecked");
            const arr=Array.from($("#Filter_Output").find(".checkbox input")).filter(v=>obj.col_filters[parm.vm.column].selected.indexOf(v.dataset?v.dataset.column:"")>=0);
            $(arr).prop('checked', true);
        } else { 
             $("#Filter_Output").find(".checkbox").checkbox("set checked");
        }
        if (obj.col_bins[obj.current_col]) 
             $("#col_bin_type").dropdown("set selected", obj.col_bins[parm.vm.column]);
        else
             $("#col_bin_type").dropdown("set selected", "aut2");
        
   }

  param.h_pivot={};
  param.h_pivot.action = 'COLUMN_FILTER';
  param.h_pivot.TABLE_NAME = param.TABLE_NAME;
  param.h_pivot.column = col; obj.current_col=col;
  param.h_pivot.col_filters = obj.col_filters;
  param.recache_ts = rxds.recache_ts;
  param.reqID = rxds.reqID;

  obj.target = target;
  if (!obj.col_bins[col])
      param.h_pivot.bin_type = "aut2";
  else
      param.h_pivot.bin_type = obj.col_bins[col];
  
  
  let data= await rxds.m.fetchAsync(k, obj, obj.query_id,param,obj.dataset_format);
  data=data.result.table;
  if (rxds.vm_histogram) {
    rxds.vm_histogram.data =data;
    rxds.vm_histogram.column =col;
    rxds.vm_histogram.typeDesc =typeDesc;
  } else {
     rxds.vm_histogram = new Vue({
          el: "#pivot_filter",
          data: {
            data: data,column: col,typeDesc:typeDesc,
            colors: [
              '#1890FF','#66B5FF','#41D9C7','#2FC25B','#6EDB8F','#9AE65C','#FACC14','#E6965C',
              '#57AD71','#223273','#738AE6','#7564CC','#8543E0','#A877ED','#5C8EE6','#13C2C2',
              '#70E0E0','#5CA3E6','#3436C7','#8082FF','#DD81E6','#F04864','#FA7D92','#D598D9' 
            ]
          },
          computed: {
            scaleColor: function() {
              return d3.scaleOrdinal().range(this.colors)
            }
          },
          mounted: function() {
            init_dropdown({mounting:true,vm:this});
          },
          updated: function() {
            init_dropdown({mounting:false,vm:this});
          }
        });
     
     
     //$("#Filter_Output").find(".checkbox").checkbox();
  }   
} //get_col_histogram

export async function loadPiv(k,obj, data_in, full_data,param) {
    var data;
    var cols=[],fils=[],i=0;
    var init_dropdown = function(parm) {
      if (parm.mounting) {
              var sortable = new Draggable.Sortable(
                document.querySelectorAll('.pivotcontainer'),
                {
                  draggable: '.ui.item',
                  droppable: '.ui.list',
                  sensors: [Draggable.Sensors.DragSensor]
                }
              );
              sortable.removeSensor(Draggable.Sensors.MouseSensor);  
              sortable.on('sortable:stop', (evt) => {
                 console.log("Sortable:sorted event");
                 runPivot(k, obj,evt);
                return true;   
              }); 
         } // mounting
         $('.ui.dropdown.bintype').dropdown({
            action: 'activate',
            onChange: function(value, text, $selectedItem) {
              obj.col_bins[this.dataset.id] = value;
              runPivot(k, obj);
            }
          });
         if (rxds.view) {
               $("#table_type").dropdown('set selected', obj.h_pivot.table_type);
               $("#metric_type").dropdown('set selected', obj.h_pivot.metric_type);
               $("#metric_column").dropdown('set selected', obj.h_pivot.metric_column.split(/\,/));
              var binned_cols=Object.keys(obj.col_bins);
              binned_cols.forEach(v=>{
                var col_obj = Array.from($(".pivotcols")).find(s=>s.dataset && s.dataset.id==v);
                if (col_obj)
                $(col_obj.getElementsByClassName("bintype")).dropdown("set selected", obj.col_bins[v]);
              });
              var filtered_cols=Object.keys(obj.col_filters);
              filtered_cols.forEach(v=>{
                var col_obj = Array.from($(".pivotcols")).find(s=>s.dataset && s.dataset.id==v);

                if (col_obj) {
                    var target=$(col_obj.getElementsByClassName("icon"));
                    if (target) {
                      $(target).removeClass("tasks");
                      $(target).addClass("filter");
                    }
                }    
              });
          }
          else {
               $("#table_type").dropdown('set selected', 'Table');
               $("#metric_type").dropdown('set selected', 'Count');
                $("#metric_column").dropdown('restore defaults');
          }
         $('#metric_type,#metric_column,#table_type').dropdown({
            action: 'activate',
            onChange: function(value, text, $selectedItem) {
              runPivot(k, obj);
            }
          });

    } //init_dropdown

    
    if (obj.config.data_transform) {
        var transform_fn=new Function('data','db', 'rxds', obj.config.data_transform);
        data = transform_fn(data_in,data_binding, this);        
    } else data = data_in;

    if (rxds.view && rxds.view.param[k] && (rxds.view.param.slTables == param.TABLE_NAME))
         obj.h_pivot = rxds.view.param[k];
    else
         delete obj.h_pivot;
    var fields=[],row_fields=[],col_fields=[];
    
    data.meta.forEach(v=>{
      const colSet=rxds.app.report_headers[v.c];
      if (colSet) v.Label=colSet.Label; else v.Label=v.c;
    });
    
    if ( (!obj.h_pivot) || ((obj.h_pivot.TABLE_NAME) && (obj.h_pivot.TABLE_NAME !== param.TABLE_NAME)) ) {
      obj.col_filters={};
      obj.col_bins={};
      obj.h_pivot={};
      fields=data.meta;
    } else {
      obj.col_filters=obj.h_pivot.col_filters;
      obj.col_bins=obj.h_pivot.col_bins;
      data.meta.forEach(v=>{
        if (obj.h_pivot.row_fields.indexOf(v.c)>-1) row_fields.push(v);
        else if (obj.h_pivot.column_fields.indexOf(v.c)>-1) col_fields.push(v);
        else fields.push(v);
      });
      
    }   

    if (data && data.count >= 0 ) {
      const div = document.getElementById(k);
      if (!obj.vm_fields) {
        obj.vm_fields = new Vue({
            el: div,
            data: {data: fields,row_fields:row_fields,col_fields:col_fields,all_data:data.meta},
            methods: {
              load_column: function(e) {
                const col = e.target.dataset.id;
                  $('.ui.modal.pivot_filter').modal('show');
                  const typeDesc=this.all_data.find(v=>v.c==col).typeDesc;
                  get_col_histogram(k,obj,col,typeDesc,e.target).then(
                    function() {
                        window.setTimeout(function() {window.dispatchEvent(new Event('resize'));}, 500); // Adjust for frozen modal
                    }
                  );
              } //load_column
            },
          mounted: function() {
            init_dropdown({mounting:true});
          },
          updated: function() {
            init_dropdown({mounting:false});
          }

        });
      }
      else {
        obj.vm_fields.data = fields;
        obj.vm_fields.row_fields = row_fields;
        obj.vm_fields.col_fields = col_fields;
        obj.vm_fields.all_data = data.meta;
      }
      if (obj.config.region_config) {
          var config_fn=new Function('opts','data', 'rxds', 'obj', obj.config.region_config);
          config_fn(table, data, this, obj);
      }

      if (rxds.view)
        runPivot(k, obj);
      else   
        loadPivDT(k,obj,{},data);
      
    }
} //loadPiv

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
function runPivot(k, obj,evt) {
  var row_fields = Array.from(row_container.getElementsByClassName("pivotcols")).map(v=>v.dataset.id);
  var column_fields = Array.from(column_container.getElementsByClassName("pivotcols")).map(v=>v.dataset.id);
  if (evt) {
    const target_container = evt.data.newContainer.id;
    const source_container = evt.data.oldContainer.id;
    const dragged_field = evt.dragEvent.data.source.dataset.id;
    if (source_container === target_container) return (true);
    if (target_container !== "row_container") {
       // Eliminate the field being dragged    
       var index = row_fields.indexOf(dragged_field);
       if (index > -1) row_fields.splice(index, 1);
    }   
    if (target_container !== "column_container") {
       var index = column_fields.indexOf(dragged_field);
       if (index > -1) column_fields.splice(index, 1);
    }
  }
  var param = rxds.m.get_parameters(obj.dependent_items);
  param.h_pivot={};
  param.h_pivot.metric_type=$("#metric_type").dropdown('get value');
  if (param.h_pivot.metric_type == "") param.h_pivot.metric_type = "count";
  param.h_pivot.metric_column=$("#metric_column").dropdown('get value').replace(/\|/g,",");
  if (param.h_pivot.metric_column == "Select Column") param.h_pivot.metric_column = "";
  param.h_pivot.action = 'PIVOT';
  param.h_pivot.TABLE_NAME = param.TABLE_NAME;
  param.h_pivot.row_fields = row_fields;
  param.h_pivot.column_fields = column_fields;
  param.h_pivot.GROUP_BY = row_fields.join(",");
  param.h_pivot.ALL_BY = row_fields.concat(column_fields).join(",");
  param.h_pivot.PIVOT_BY = column_fields.join(",");
  param.h_pivot.col_filters = obj.col_filters;
  param.h_pivot.col_bins = obj.col_bins;
  param.h_pivot.table_type=$("#table_type").dropdown('get value');
  if (param.h_pivot.table_type == "")param.h_pivot.table_type="Table";
  obj.h_pivot=param.h_pivot;
  rxds.m.postPageView();
  param.recache_ts = rxds.recache_ts;
  param.reqID = rxds.reqID;
  console.log("Sent to KDB");
  console.log(param);

  rxds.m.fetchAsync(k, obj, obj.query_id,param,obj.dataset_format).then(
                  function(data){
                    console.log("Returned from KDB ");
                    console.log(data);
                    const tab_options=["Table","Table_heatmap","Table_row_heatmap","Table_col_heatmap"];
                    if (tab_options.indexOf(param.h_pivot.table_type)>-1) {
                         $("#echart"+k).hide();
                         $("#" + k.replace('region','GRID') +"_wrapper").show();
                          loadPivDT(k,obj, param, data);
                    }      
                    else {
                         $("#echart"+k).show();
                         $("#" + k.replace('region','GRID') +"_wrapper").hide();
                          loadPivChart(k, obj, param, data);
                    }      
                    //var json = {},d;
                    //d=data.result?data.result:data;
                  });  
}

function loadPivDT(k,obj, param, src_data)
{
    var data=src_data.result?src_data.result.table:src_data.table;
    var div = "table#" + k.replace('region','GRID'); 
    
    var cols=[],fils=[],i=0;
    //Intialiaze if DT already exist
    if ( $.fn.dataTable.isDataTable(div) ) {
        var table = $(div).DataTable();
        table.clear();
        table.destroy();
        $(div).empty();
    }
      

      
      for(var t in data[0]) {
        var title;
        //Is there a config for this column?
        var colSet=rxds.app.report_headers[t];
        if (colSet !== undefined) {
           title=colSet.Label;
           if (colSet.Render==="number"){
              cols.push({"title":title, "data":t, className: "dt-body-right", render: $.fn.dataTable.render.number(',', '.', 0 ) });
            }else if (colSet.Render==="percentage"){
              cols.push({"title":title, "data":t, className: "dt-body-right", render: $.fn.dataTable.render.number(',', '.', 0, '', '%') });
            }else if (colSet.Render==="currency"){
              cols.push({"title":title, "data":t, className: "dt-body-right", render: $.fn.dataTable.render.number(',', '.', 2, '$') });
            }else if (colSet.Render==="text"){
              cols.push({"title":title, "data":t, className: "dt-body-right", render: $.fn.dataTable.render.text() });
            }else{
              cols.push({"title":title, "data":t});
            }
        }else{ //No settings for this column
           if ((typeof data[0][t] == "number") && (!/Year|_ID$|Zip/i.test(t))){
             cols.push({"title":t, "data":t, className: "dt-body-right", render: $.fn.dataTable.render.number( ',', '.', 0 ) });
           }else{
             cols.push({"title":t, "data":t});
           }
        }  
           fils.push({column_number: i,filter_type: "text",filter_delay: 500});
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
          "order"  : [],
          "aaSorting": [],
          "pageLength": 10,
          "paging":true,
          "pagingType":"full_numbers",
          "dom":    "<'ui grid dataTables_wrapper no-footer'"+
                            "<'left aligned eight wide column'B>"+
                            "<'right aligned eight wide column'l>"+
                            "<'sixteen wide column'tr>"+
                            "<'left aligned four wide column'i>"+
                            "<'right aligned twelve wide column'p>"+
                    ">",
          "buttons":[
            /*{
                text: 'Full Export',
                action: function ( e, dt, node, config ) {
                    alert( 'Not yet implemented' );
                }
            },*/
            //"copy","excel"
            ]
       };

        if (rxds.app.config.language=="JP") {opts.language=japanese_options();}
     const tab_options=["Table_heatmap","Table_row_heatmap","Table_col_heatmap"];
      if (param.h_pivot && src_data.result.max_vals && tab_options.indexOf(param.h_pivot.table_type)>-1) {
         var num_cols = Object.keys(src_data.result.max_vals[0]).filter(v=>v!=="ZZZMAX");
         const max_val=src_data.result.max_vals[0].ZZZMAX;
         var cellFunc;
         if ((param.h_pivot.table_type == "Table_heatmap")||(num_cols<=1))
            cellFunc = function (td, cellData, rowData, row, col) {
                    $(td).css('background', 'rgba(0, 0, 255, '+ cellData*.4/max_val+')')
                }
        else if (param.h_pivot.table_type == "Table_row_heatmap")
               cellFunc = function (td, cellData, rowData, row, col) {
                    if (!rowData) return;
                    var max= rowData[num_cols[0]];
                    num_cols.forEach(v=>{if (max<rowData[v]) max=rowData[v]});
                    $(td).css('background', 'rgba(0, 0, 255, '+ cellData*.4/max+')')
                }
        else if (param.h_pivot.table_type == "Table_col_heatmap")
               cellFunc = function (td, cellData, rowData, row, col) {
                    var col_name=Object.keys(rowData)[col];
                    var max=src_data.result.max_vals[0][col_name];
                    $(td).css('background', 'rgba(0, 0, 255, '+ cellData*.4/max+')')
                }
                
         num_cols.forEach(v=>{
           var col=opts.columns.find(i=>i.data==v);
           if (col) {
             col.createdCell = cellFunc;
           }
         });
         debugger;
      }
       table = $(div).DataTable(opts);
    
      
//Create buttons to the top left of the DT

   if (opts.buttons) {

     table.buttons().container()
            .appendTo( $('div.eight.wide.column:eq(0)', table.table().container()) );
   }
} // loadPivDT


function loadPivChart(k, obj, param, src_data) {
    var data=src_data.result?src_data.result.table:src_data.table;
  
      const theme=rxds.app.config.echart_theme?rxds.app.config.echart_theme:'macarons';
      var config = {}

      //if (!db.theme) db.theme = theme
      if (!obj.config.height) obj.config.height = 80;
      var h1=Number(obj.config.height)*window.innerHeight/100;
 
      if (obj.chart) {
        obj.chart.dispose();
      } 

      

      var myChart = echarts.init(document.getElementById("echart"+k),theme);
      obj.chart = myChart;
      
      config=getConfig(data, param, src_data);

      var height=config.categories*40;
      height = height<h1?h1:(height>1200?1200:height);
     
       $("#echart"+k).height(height);
       try {myChart.setOption(config);}
        catch(e) {console.log("Error loading chart" + k); console.log(e);console.log(obj);console.log(config);}
        myChart.hideLoading();
       myChart.resize();
      $(window).resize(function() {
        obj.chart.resize();
      });
    
} //loadPivChart

function getConfig(data, param, src_data) {
  var chart_type,stacked;
  if (param.h_pivot.table_type == "horizontal_bar") {
     chart_type = "bar";stacked=false;
  } else if  (param.h_pivot.table_type == "horizontal_stacked_bar") {
     chart_type = "bar";stacked=true;
  } else if (param.h_pivot.table_type == "bar") {
     chart_type = "bar";stacked=false;
  } else if  (param.h_pivot.table_type == "stacked_bar") {
     chart_type = "bar";stacked=true;
  } else if  (param.h_pivot.table_type == "line") {
     chart_type = "line";stacked=false;
  } else if  (param.h_pivot.table_type == "scatter") {
     chart_type = "scatter";stacked=false;
  } else if  (param.h_pivot.table_type == "3dbar") {
     return config_3D(data, param, src_data);
  } else if  (param.h_pivot.table_type == "3dscatter") {
     return config_3D(data, param, src_data);
  }
  
  
  data= getSeries(data,{x_axis:"group_by",y_axis:"metric",series:"piv_by",stacked:stacked},chart_type);
  var config =  {
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow'
        }
    },
    legend: {
        data: data.legend
    },
    grid: {left: '3%',right: '4%',bottom: '3%',containLabel: true},
    series : data.series,
    dataZoom: {show:false}
  };
  if (param.h_pivot.table_type.match(/^horizontal/)) {
    config.xAxis = {type: 'value', boundaryGap: [0, 0.01],
            axisLabel:{rotate:-45}};
    config.yAxis =  {type: 'category',data: data.categories};
    config.categories = data.categories.length;
  }
  else {
    config.yAxis = {type: 'value', boundaryGap: [0, 0.01]};
    config.xAxis =  {type: 'category',data: data.categories,
            axisLabel:{rotate:-45}}; 
    config.categories = 10;
  }
   
  return config;
}

function config_3D(data, param,src_data) {
  var groups={}, pivs={},series_data=[],chart_type;
  const max_val=src_data.result.max_vals[0].ZZZMAX;
  if  (param.h_pivot.table_type == "3dbar") chart_type = 'bar3D';
  else if (param.h_pivot.table_type == "3dscatter") chart_type = 'scatter3D';
  data.forEach(v=>{
     groups[v.group_by]=1;
     pivs[v.piv_by]=1;
     series_data.push({value: [v.group_by, v.piv_by, v.metric]});
  });
  
  var option = {
        grid3D: {},
        tooltip: {},
        xAxis3D: {
            type: 'category',data: Object.keys(groups)
        },
        yAxis3D: {
            type: 'category',data: Object.keys(pivs)
        },
        zAxis3D: {type: 'value'},
        visualMap: [{
            top: 10,
            calculable: true,
            dimension: 2,
            max: max_val,
            inRange: {
                color: ['#1710c0', '#0b9df0', '#00fea8', '#00ff0d', '#f5f811', '#f09a09', '#fe0300']
            },
            textStyle: {
                color: '#000'
            }
        }],
       series: [{
                type: chart_type,
                symbolSize: 20,
                shading: 'lambert',
                data:series_data
            }]
    };
    return option;
}

export function getSeries(data,db,chart_type) {
  var s={}, lo={}, la=[], l={},min,max;
    data.forEach((v)=> {
        const series=db.series?v[db.series]:"series";
        const x=v[db.x_axis],y=v[db.y_axis];
        if (!s[series]) {s[series]={min:y,max:y}}
        if (!l[x]) {l[x]={min:y,max:y};la.push(x);}
        s[series][x]=y;
        if (s[series].min >y) s[series].min = y;
        if (s[series].max < y) s[series].max = y;
        if (l[x].min > y) l[x].min = y;
        if (l[x].max < y) l[x].max = y;
    });
  
    var legend=Object.keys(s);
    var series;
    if (legend.length > 0) {min=s[legend[0]].min;max=s[legend[0]].max;}
    series=legend.map((v)=>{
        if (s[v].max>max) max=s[v].max;
        if (s[v].min<max) min=s[v].min;
        var o={name:v,type:chart_type,min:s[v].min,max:s[v].max,data:
       la.map((l)=>{return s[v][l]?s[v][l]:0})};
       if (db.stacked) o.stack = "stack";
       if (chart_type == "scatter") o.symbolSize = 20;
       return o;
    });
    return {legend:legend,series:series,categories:la,limits:l,min:min,max:max}
}


