export async function load(k, obj, data, full_data) {
    if (data) {
      await loadPiv(k,obj, data, full_data);
    }
}

export async function refresh(k,obj, data, full_data){
    if (data) {
      await loadPiv(k,obj, data, full_data);
    }
}


export async function get_col_histogram(k,obj,col) {
  var param = rxds.m.get_parameters(obj.dependent_items);
  param.h_pivot={};
  param.h_pivot.action = 'COLUMN_FILTER';
  param.h_pivot.column = col; obj.current_col=col;
  param.h_pivot.col_filters = obj.col_filters;
  

  let data= await rxds.m.fetchAsync(k, obj, obj.query_id,param,obj.dataset_format);
  data=data.result.table;
  if (rxds.vm_histogram) {
    rxds.vm_histogram.data =data;
    if (obj.col_filters[col]) {
       //Array.from($("#Filter_Output").find(".checkbox input:checked")).filter(v=>v.dataset?v.dataset.column:"")
    } else { 
       e=>$("#Filter_Output").find(".checkbox").checkbox("set checked");
    }   
  } else {
     rxds.vm_histogram = new Vue({
        el: "#Filter_Output",
        data: {data: data},
        methods: {
          select_filter: function (e) {
             const md5_hash = e.target.dataset.md5_hash;
           } //select_filter
        }
     });
     $('#clear_filter').on('click', e=>$("#Filter_Output").find(".checkbox").checkbox("set unchecked"));
     $('#select_filter').on('click', e=>$("#Filter_Output").find(".checkbox").checkbox("set checked"));
     $('#apply_filter').on('click', function (e) {
       const filters = Array.from($("#Filter_Output").find(".checkbox input:checked")).map(v=>v.dataset?v.dataset.column:"");
       obj.col_filters[obj.current_col] = filters;
       $('.ui.modal.pivot_filter').modal('hide');
       runPivot(k, obj);
     });
     $("#Filter_Output").find(".checkbox").checkbox();
  }   
} //get_col_histogram

export async function loadPiv(k,obj, data_in, full_data) {
    var data;
    var cols=[],fils=[],i=0;
    obj.col_filters={};
    if (!obj.col_charts) obj.col_charts={};
    obj.col_bins={};
    if (obj.config.data_transform) {
        var transform_fn=new Function('data','db', 'rxds', obj.config.data_transform);
        data = transform_fn(data_in,data_binding, this);        
    } else data = data_in;

    if (data && data.count > 0 ) {
      const div = document.getElementById(k);
//      if (obj.vm) {obj.vm.$destroy();}
      if (!obj.vm_fields) {
        obj.vm_fields = new Vue({
            el: div,
            data: {data: data.meta},
            methods: {
              load_column: function(e) {
                const col = e.target.dataset.id;
                console.log(i);
                console.log(e);
                console.log(col);
                  $('.ui.modal.pivot_filter').modal('show');
                  get_col_histogram(k,obj,col).then();
              } //load_column
            },
          mounted: function() {
              console.log('mounted in pivot');
              console.log($('.ui.dropdown.explorerbintype'));
              $('.ui.dropdown.explorerbintype').dropdown({
                  action: 'hide',
                  onChange: function(value, text, $selectedItem) {
                    console.log(value + " " + text);
                    console.log($selectedItem);
                  }
                });
                var sortable = new Draggable.Sortable(
                  document.querySelectorAll('.explorecontainer'),
                  {
                    draggable: '.ui.item',
                    droppable: '.ui.list',
                    sensors: [Draggable.Sensors.DragSensor]
                  }
                );
                sortable.removeSensor(Draggable.Sensors.MouseSensor);  
          
                sortable.on('sortable:stop', (evt) => {
                   console.log("Sortable:sorted event");
                   console.log(sortable.containers);
                   console.log(evt.dragEvent.overContainer);
                   runExplore(k, obj, evt).then();
                });
                runExploreAll(k,obj);
          },
          updated: function() {
              $('.ui.dropdown.explorerbintype').dropdown({
                  action: 'hide',
                  onChange: function(value, text, $selectedItem) {
                    console.log(value + " " + text);
                    console.log($selectedItem);
                  }
                });
                runExploreAll(k,obj);
          }

        });
      }
      else {
        obj.vm_fields.data = data.meta;
      }
      obj.columns=data.meta;
      if (obj.config.region_config) {
          var config_fn=new Function('opts','data', 'rxds', 'obj', obj.config.region_config);
          config_fn(table, data, this, obj);
      }

      
    }
} //loadPiv

async function runExploreAll(k,obj) {
  var field_dom = Array.from(explore_fields.getElementsByClassName("pivotcols"));
  var col_fields = field_dom.map(v=>v.dataset.id);
  var param = rxds.m.get_parameters(obj.dependent_items);
  param.h_pivot={};
  param.h_pivot.action = 'COLUMN_CHART';
  param.h_pivot.column = col_fields; 
  param.h_pivot.col_filters = obj.col_filters;
  let data = await rxds.m.fetchAsync(k, obj, obj.query_id,param,obj.dataset_format);
  let cols=data.result.table; //[0].bins;
  cols.forEach((v,i)=>{
   let colspec= obj.columns.find(t=>(t.c==v.column));
   let bin=v.bins;
   obj.col_bins[v.column]=bin;
    if (colspec.typeDesc.match(/int|real|short|long|float/))
       bin.forEach(t=>(t.column_value=t.column_value.toString()));
       
    //const g2Container = $(evt.newContainer).find(".g2chart")[0];
    const g2Container = $(field_dom[i]).parent().find(".g2chart")[0];
    render_g2_chart(k, v.column, obj,bin,g2Container);
  });
  
}

async function runExplore(k, obj, evt) {
  const col = evt.dragEvent.data.source.dataset.id;
  var param = rxds.m.get_parameters(obj.dependent_items);
  param.h_pivot={};
  param.h_pivot.action = 'COLUMN_CHART';
  param.h_pivot.column = [col]; 
  param.h_pivot.col_filters = obj.col_filters;
  
  console.log("Sent to KDB");
  console.log(param);
  let data = await rxds.m.fetchAsync(k, obj, obj.query_id,param,obj.dataset_format);
  console.log("Returned from KDB ");
  console.log(JSON.stringify(data));
  //loadPivDT(k,obj, data.result.table)
  console.log(obj.columns);
  let colspec= obj.columns.find(v=>(v.c==col));
  let bin=data.result.table[0].bins;
  if (colspec.typeDesc.match(/int|real|short|long|float/))
     bin.forEach(v=>(v.column_value=v.column_value.toString()));
  obj.col_bins[col]=bin;   
  const g2Container = $(evt.newContainer).find(".g2chart")[0];
  render_g2_chart(k, col, obj,bin,g2Container);
}

function render_g2_chart(k, col, obj,bin,g2Container)
{
    var chart;
    const theme=rxds.app.config.g2_theme?rxds.app.config.g2_theme:'default';
    
    G2.Global.setTheme(theme);

    if (!obj.col_charts[g2Container.id]) {
        chart = new G2.Chart({
        container: g2Container,
        forceFit : true ,
        height: Number(obj.config.height)*window.innerHeight/100
      });
      obj.col_charts[g2Container.id] = chart;
    } else {
        chart = obj.col_charts[g2Container.id];
        chart.clear();
    }


    const llcount = bin.length;
    
    if (llcount < 8) {
        chart.source(bin, {
            percent: {
              formatter: val => {
                val=val*100
                val = val.format(1) + '%';
                return val;
              }
            }
          });

        pie_chart(chart, k, obj, col, {x_axis:"column_value",y_axis:"row_percent"});
    }    
    else {
        chart.source(bin);
        column_chart(chart, k, obj, col, {x_axis:"column_value",y_axis:"row_count"});
    }    


    chart.render();
}


function column_chart(chart, k, obj, col, db)
{
  chart.coord().transpose();

  chart.axis(db.x_axis, {
      label: {
         textStyle: {
      textAlign: 'center', // 文本对齐方向，可取值为： start center end
      fill: '#404040', // 文本的颜色
      fontSize: '10', // 文本大小
      fontWeight: 'bold', // 文本粗细
      rotate: 0, 
      textBaseline: 'middle' // 文本基准线，可取 top middle bottom，默认为middle
    } 
      }
    });
  
chart.interval()
     .position(db.x_axis+'*'+db.y_axis)
     .color(db.x_axis, function(group) {
            const sel=obj.col_filters?(obj.col_filters[col]?obj.col_filters[col].selected:[]):[];
            if (sel.length === 0) {
              return this.values[this.scales[0].translate(group)]
            }
            if (sel.indexOf(group) > -1) {
              return this.values[this.scales[0].translate(group)]
            }
            return 'gray'
          })
     ;
chart.scale (db.y_axis , {"type": 'log'});
if (!chart.click_handler) chart.on("interval:click", (s) => {toggleSelection(s,k,obj,chart,db);chart.repaint();});
chart.click_handler = true;
chart.col=col;

}

function pie_chart(chart, k, obj, col, db) {
  chart.tooltip({
    showTitle: false,
   itemTpl: '<li><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</li>'
   });
  
  chart.coord('theta', {
    radius: 0.80
  });
  chart.intervalStack()
    .position(db.y_axis)
    .color(db.x_axis, function(group) {
            const sel=obj.col_filters?(obj.col_filters[col]?obj.col_filters[col].selected:[]):[];
            if (sel.length === 0) {
              return this.values[this.scales[0].translate(group)]
            }
            if (sel.indexOf(group) > -1) {
              return this.values[this.scales[0].translate(group)]
            }
            return 'gray'
          })
    .tooltip(db.x_axis+'*'+db.y_axis, (item, percent) => {
      percent = percent* 100;
      percent = percent.format(1)  + '%';
      return {
        name: item,
        value: percent
      };
    })
    .style({
      lineWidth: 1,
      stroke: '#fff'
    });
    
  if (!chart.click_handler) chart.on("interval:click", (s) => {toggleSelection(s,k,obj,chart,db);chart.repaint();});
  chart.click_handler = true;
  chart.col=col;
}
export function toggleSelection(source,k,obj,chart,db) {
  const col=chart.col;
  var group = source.data._origin[db.x_axis];
  if (!obj.col_filters[col]) {
    obj.col_filters[col] = {selected:[],not_selected:obj.col_bins[col].map(v=>v.column_value)};
  }  
  var sel=obj.col_filters[col].selected;
  var not_sel = obj.col_filters[col].not_selected;
  if (sel.indexOf(group) === -1)
    sel.push(group);
  else 
    sel.splice(sel.indexOf(group),1);

  if (not_sel.indexOf(group) === -1)
    not_sel.push(group);
  else 
    not_sel.splice(not_sel.indexOf(group),1);


  runExploreAll(k,obj);
  //obj.child_regions.forEach((i)=>{rxds.m.load(i)})
}
