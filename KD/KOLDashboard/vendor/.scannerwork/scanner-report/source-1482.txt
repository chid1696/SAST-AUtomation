import {util} from './util';
export var vendor;
export async function load(k, obj, data, full_data) {
        var elem = "#"+k;
        var pconfig = obj.config;
        var legend = [];
        var config,theme;
        vendor=rxds.vendor;
        theme=rxds.app.config.vega_theme?rxds.app.config.vega_theme:'default';

        if (full_data.qerr !== undefined) {
          // There is an error running the query
          console.log("Error running chart code - Error: '" + full_data.qerr + "; See submitted values below");
          console.log(full_data);
          return;
        }

      var data_binding = util.data_bind(obj);
      var chart_data=util.data_transform(obj, data, data_binding, this);
      var widget_config=util.get_widget_config(obj);

        var actions = (data_binding.debug === "Y");

        obj.width= $(elem).width();
        obj.height= Number(obj.config.height)*window.innerHeight/100;
        if (!widget_config) {
          console.log("No configuration for this widget " + obj.config.title); return;
        }
        var vlSpec = {"width": 300,"autosize": {"type": "fit","contains": "padding"}, "autoResize":"pad"};
        
        var config_fn=new Function('data','db','rxds', 'obj', 'config', widget_config);
        config_fn(chart_data,data_binding, this, obj, vlSpec);

//        vlSpec.autoResize = "pad";
        vlSpec.width = obj.width;
        vlSpec.height = obj.height;
        
        //if the flip report is set to Y
        
        if(pconfig.flip_report == "Y") {
           util.toggleDT(k,obj, data, full_data);
        } 


        var opt = {actions: actions};
        
        if (!vlSpec["$schema"]) {
          if ((vlSpec.spectype == undefined) || (vlSpec.spectype == "VegaLite")) {
            vlSpec["$schema"] = "https://vega.github.io/schema/vega-lite/v2.json";
             opt.mode= "vega-lite";
          }else{
            vlSpec["$schema"] = "https://vega.github.io/schema/vega/v3.0.json";
               opt.mode= "vega";
          }
        }

         var tooltip = {showAllFields: true};
         if (vlSpec.tooltip) {
           tooltip = vlSpec.tooltip;
           delete vlSpec.tooltip;
         }
     
        if (theme !== "default") opt.config = vega_themes[theme];


      if(opt.mode=="vega-lite") {
           vlSpec = vl.compile(vlSpec, {config: opt.config}).spec;
          opt.mode = "vega"
       }
       obj.options = vlSpec;


       obj.vega = await vegaEmbed(elem, vlSpec, opt);
       vegaTooltip.vega(obj.vega.view, tooltip);

     
      if (obj.config.parameter_id) {
          if (!obj.filters) obj.filters = [];
          obj.vega.view.addSignalListener('clicked', (sig, sel) => {toggleVega(sel,obj)});
      }

}

export function get(k,obj) {
   if (obj.filters) 
       return obj.filters.join('|');  
   else 
       return '';
}

export function reset_filter(k,obj) {
    $("#click"+k).hide();
    //repaint(k,obj);
    rxds.load_children(obj.child_regions); 
}


export function toggleVega(selected,obj) {
  if (!selected) return;
  const sel = (selected)?selected.value:"";
  if (obj.filters.indexOf(sel) === -1)
    obj.filters.push(sel)
  else 
    obj.filters.splice(obj.filters.indexOf(sel),1);
    
  if (obj.filters.length > 0) {
    const r=obj.region.region_id;
    $("#selectregion"+r).html(obj.filters.join());
    $("#clickregion"+r).show();
  }
  else {
    const r=obj.region.region_id;
    $("#clickregion"+r).hide();
  }

  rxds.load_children(obj.child_regions);
}


