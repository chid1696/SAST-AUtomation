import {util} from './util';
export var vendor;

export async function load(k, obj, data) {
//        height: Number(obj.config.height)*window.innerHeight/100 ,
    if (!obj.filters) obj.filters = [];

    var db = util.data_bind(obj);
    if (Array.isArray(db.resource_url)) {
      db.resource = []; 
      for (var i=0;i<db.resource_url.length;i++) {
        let res = await fetch(resource_url[i]).then(response => response.text());
        db.resource.push(res);
      }
    }else if (typeof db.resource_url  == "string") {
        db.resource = await fetch(db.resource_url).then(response => response.text());
    }

    
    var map_data=util.data_transform(obj, data, db, this);
    var widget_config=util.get_widget_config(obj);
    $("#"+k).height(Number(obj.config.height)*window.innerHeight/100);
    if (!widget_config) {
      console.log("No configuration for this widget " + obj.config.title); return;
    }
    
    
//    if (!widget_config.match(/chart.source/))
//         chart.source(chart_data);
    var config_fn=new Function('k','data','db','rxds', 'obj', widget_config);
    config_fn(k,map_data,db, this, obj);

    if(obj.config.flip_report == "Y")  util.toggleDT(k,obj, data, data);
    if(obj.config.annotate == "Y") util.load_annotation_modal(k,obj);
}

export function get(k,obj) {
   if (obj.filters) 
       return obj.filters.join('|');  
   else 
       return '';
}

export function set(k,obj,v) {
   obj.filters=v.split(/\|/);
}


export async function refresh(k,obj, data){
//  var tabid = "table#" + $("#"+k).data("id");     
//           console.log("Refresh DT",data);
 //       loadDataTable(tabid,data);
//           console.log('Need to load report ' + k);
}

export async function repaint(k,obj, data){
//     obj.chart.render();
}

export function reset_filter(k,obj) {
    $("#click"+k).hide();
//    repaint(k,obj);
    rxds.load_children(obj.child_regions); 
}

