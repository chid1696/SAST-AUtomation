import {util} from './util';
export var vendor;

export async function load(k, obj, data) {
    obj.map_id = "leafletregion" + obj.region.region_id;
    obj.opts = {};
    obj.remove_map = remove_map;
    //obj.map_id = "region" + obj.region.region_id;
//        height: Number(obj.config.height)*window.innerHeight/100 ,
    if (!obj.filters) obj.filters = [];
    if(!obj.secondary_filters) obj.secondary_filters = [];
    if(!obj.secondary_filters_all) obj.secondary_filters_all = [];  //to put all values instead of distinct

    var db = util.data_bind(obj);
    if (Array.isArray(db.resource_url)) {
      db.resource = []; 
      for (var i=0;i<db.resource_url.length;i++) {
        let res = await fetch(db.resource_url[i]).then(response => response.text());
        db.resource.push(res);
      }
    }else if (typeof db.resource_url  == "string") {
        db.resource = await fetch(db.resource_url).then(response => response.text());
    }
    
    //removes the existing map
    obj.remove_map();
    
    //$("#"+k).height(Number(obj.config.height)*window.innerHeight/100);
    //$("#leaflet"+k).height(Number(obj.config.height)*window.innerHeight/100);
    
    obj.region_height = Number(obj.config.height)*window.innerHeight/100;
    obj.chartContainerHeight = (94/100)*obj.region_height;
      
    //$("#"+k).height(region_height);
    //$("#flip"+k).css("max-height","90%");
    //$("#leaflet"+k).height(obj.chartContainerHeight);
    //$("#"+k).height("");
    $("#flip"+k).height(obj.region_height);
    $("#leaflet"+k).height(obj.chartContainerHeight);
    
    var map_data=util.data_transform(obj, data, db, this);
    var widget_config=util.get_widget_config(obj);
    if (!widget_config) {
      console.log("No configuration for this widget " + obj.config.title); return;
    }
    
    
//    if (!widget_config.match(/chart.source/))
//         chart.source(chart_data);
    var config_fn=new Function('k','data','db','rxds', 'obj', widget_config);
    config_fn(k,map_data,db, this, obj);

    if(obj.config.flip_report == "Y")  util.toggleDT(k,obj, data, data);
    if(obj.config.annotate == "Y") util.load_annotation_modal(k,obj);
    
    if(rxds.app.app.branch.match("MASTER|UI")) {
      $("#leafletselected" + obj.region.region_id)
        .off("click")
        .click(function() { show_selected_modal(obj, "leafletselected"); });
      $("#leafletselectedlocation" + obj.region.region_id)
        .off("click")
        .click(function() { show_selected_modal(obj, "leafletselectedlocation"); });
    }
}

export function get(k,obj) {
    let filters = "";
    if (obj.filters && obj.secondary_filters) {
      filters = [obj.filters.join('|'), obj.secondary_filters.join()];
      filters = filters.filter(v => v).join("|");
    }
    return filters;
}

export function set1(k,obj,v) {
   obj.filters=v.split(/\|/);
}


export async function refresh(k,obj, data){
    let h = rxds.m.managers[obj.control_type];
    
    if (data && data.result) /* If we got data */
       await h.load(k, obj, data.result);
    else  await h.load(k, obj, data);
//  var tabid = "table#" + $("#"+k).data("id");     
//           console.log("Refresh DT",data);
 //       loadDataTable(tabid,data);
//           console.log('Need to load report ' + k);
}

export async function repaint(k,obj, data){
//     obj.chart.render();
    //if(obj.map)   
}

export function reset_filter(k,obj,reset_type) {
    const r = obj.region.region_id;
    if(reset_type) {
      if(reset_type == "filter-group-1") {
        $("#selectregionspan"+r).hide();
        //$("#leafletclickregion"+r).hide();
      } else {
        $("#selectlocationspan"+r).hide();
        //$("#leafletclickregion"+r).hide();
      }
    } else {
      $("#clickregion"+r).hide();
    }
    
    let h = rxds.m.managers[obj.control_type];
    let data = rxds.m.query_tracker[obj.query_id].data;
    h.refresh(k,obj,data);
    rxds.load_children(obj.child_regions); 
}

export function get_param(p) {
  return rxds.m.get_param(p);
}

export function toggleSelection(group,obj,db,data,highlight,param) {
  const r = obj.region.region_id;
  
  //if the value is selected from market cluster
  if(param.targetElement.match("markerCluster|marker")) {
        if(param.targetElement == "markerCluster") {
            /*let selected_count = group.filter(v => obj.secondary_filters.includes(String(v))).length;
            if(group.length != selected_count) {
              group.forEach(v => {
                if (obj.secondary_filters.indexOf(String(v)) === -1)  obj.secondary_filters.push(String(v));
              });
            } else {
              group.forEach(v => {
                obj.secondary_filters.splice(obj.secondary_filters.indexOf(String(v)),1);
              });
            }*/
            obj.secondary_filters_all = group.map(v => String(v));
            obj.secondary_filters = group.filter((v,i,arr) => arr.indexOf(v) === i).map(v => String(v));
        } else {
            if (obj.secondary_filters.indexOf(String(group)) === -1) {
              obj.secondary_filters.push(String(group));
              obj.secondary_filters_all.push(String(group))
              //obj.filters.push(String(group));
            } 
            else {
              //obj.secondary_filters.splice(obj.filters.indexOf(String(group)),1);
              obj.secondary_filters.splice(obj.secondary_filters.indexOf(String(group)),1);
              obj.secondary_filters_all.splice(obj.secondary_filters_all.indexOf(String(group)),1);
            }
        }
  } else {
      if (obj.filters.indexOf(group) === -1)  obj.filters.push(String(group)); 
      else  obj.filters.splice(obj.filters.indexOf(String(group)),1);
  }
  
  if (obj.filters.length > 0) {
    //let selected_values = obj.filters.map(v => v.replace(/^\$GJV|^\$MCV/,'')).join();
    
    //$("#leafletselected"+r).html(selected_values);
    $("#leafletselected"+r).html(obj.filters.length);
    $("#selectregionspan"+r).show();
    $("#leafletclickregion"+r).show();
    
    ///$("#leafletselected"+r).html(obj.filters.filter(v => !v.match(/^MV/)).join().replace(/\$MV|\$MCV/g,""));
    ///$("#selectregionspan").show();
    ///$("#leafletclickregion"+r).show();
  }
  else {
    $("#selectregionspan" + r).hide();
  }
  
  if (obj.secondary_filters.length > 0) {
    //let selected_values = obj.secondary_filters.map(v => v.replace(/^\$MCV/,"")).join();
    let no_of_selected_loc = obj.secondary_filters_all.length;
    
    //$("#leafletselectedlocation"+r).html(selected_values);
    $("#leafletselectedlocation"+r).html(no_of_selected_loc);
    $("#selectlocationspan"+r).show();
    $("#leafletclickregion"+r).show();
  }
  else {
    $("#selectlocationspan"+r).hide();
  }
  
  if (!obj.filters.length && !obj.secondary_filters.length){
    $("#selectregionspan"+r).hide();
    $("#selectlocationspan"+r).hide();
    $("#leafletclickregion"+r).hide();
  }

  rxds.load_children(obj.child_regions); 
  //setTimeout(function(){console.log(obj.filters);obj.chart.resize();console.log(obj.chart)}, 3000);
}

export function toggleSelection1(group,obj,db,data,highlight,param) {
  //udhay - updated this section to support secondary filters
  var is_there_sec_filter = (param && param.secondary_filters);
  
  if(param.targetElement == "markerCluster"){
      let selected_count = group.filter(v => obj.filters.includes(v)).length;
      if(group.length != selected_count) {
        group.forEach(v => {
          if (obj.filters.indexOf(v) === -1) {
              obj.filters.push(v); 
              if(is_there_sec_filter)  obj.secondary_filters.push(param.name);
          }
        });
      } else {
        group.forEach(v => {
          obj.filters.splice(obj.filters.indexOf(v),1);
          if(is_there_sec_filter)   
            obj.secondary_filters.splice(obj.secondary_filters.indexOf(param.name),1);
        });
      }
      /*group.forEach(v => {
          if (obj.filters.indexOf(v) === -1) {
            obj.filters.push(v); 
            if(is_there_sec_filter)  obj.secondary_filters.push(param.name);
          } else { 
            obj.filters.splice(obj.filters.indexOf(v),1);
            if(is_there_sec_filter)   obj.secondary_filters.splice(obj.secondary_filters.indexOf(param.name),1);
          }
      });*/
  } else {
      if (obj.filters.indexOf(group) === -1) {
        obj.filters.push(group); 
        if(is_there_sec_filter)  obj.secondary_filters.push(param.name);
      } else { 
        obj.filters.splice(obj.filters.indexOf(group),1);
        if(is_there_sec_filter)   obj.secondary_filters.splice(obj.secondary_filters.indexOf(param.name),1);
      }
  }
  
  if (obj.filters.length > 0) {
  ///if (obj.filters.filter(v => !v.match(/^MV/).length > 0) {
    const r=obj.region.region_id;
    //$("#selectregion"+r).html(obj.filters.join().replace(/\$MV|\$MCV/g,""));
    //$("#clickregion"+r).show();
    
    $("#leafletselected"+r).html(obj.filters.join().replace(/\$MV|\$MCV/g,""));
    $("#selectregionspan"+r).show();
    $("#leafletclickregion"+r).show();
    
    ///$("#leafletselected"+r).html(obj.filters.filter(v => !v.match(/^MV/)).join().replace(/\$MV|\$MCV/g,""));
    ///$("#selectregionspan").show();
    ///$("#leafletclickregion"+r).show();
  } 
  else {
    const r=obj.region.region_id;
    $("#clickregion"+r).hide();
    $("#leafletclickregion"+r).hide();
  }
  /*else {
    const r=obj.region.region_id;
    $("#selectregionspan" + r).hide();
  }
  if (obj.filters.filter(v => v.match(/^MV/).length > 0) {
    $("#leafletselected"+r).html(obj.filters.filter(v => v.match(/^MV/)).join().replace(/\$MV|\$MCV/g,""));
    $("#selectlocationspan").show();
    $("#leafletclickregion"+r).show();
  }
  else {
  const r=obj.region.region_id;
    $("#selectlocationspan" + r).hide();
  }
  if (obj.filters.length){
    const r=obj.region.region_id;
    $("#clickregion"+r).hide();
    $("#leafletclickregion"+r).hide();
  }*/
  
  if (highlight) obj.highlight=true;
  if(is_there_sec_filter)   obj.highlight_secondary_filters= true;
  console.log(obj.filters);

  rxds.load_children(obj.child_regions); 
  //setTimeout(function(){console.log(obj.filters);obj.chart.resize();console.log(obj.chart)}, 3000);
}

function remove_map() {
  let obj = this;
  if (obj.map) {   //added by udhay
      if(obj.map.gestureHandling) obj.map.gestureHandling.disable();
      obj.map.off();
      obj.map.remove();
      obj.map = undefined;
  }
}

function show_selected_modal(obj, type) {   //Udhay - to update the leaflet model and show with the selected values
  let div = $("<div>").addClass("ui bulleted list");
  if(type == "leafletselected") {
    obj.filters.forEach(v => div.append($(`<div class='item'>${v}</div>`)));
    $('.leaflet-selected-modal').find(".content").html(div);
    $('.leaflet-selected-modal').modal('show');
  } else {
    obj.secondary_filters_all.forEach(v => div.append($(`<div class='item'>${v}</div>`)));
    $('.leaflet-selected-locations-modal').find(".content").html(div);
    $('.leaflet-selected-locations-modal').modal('show');
  }
}