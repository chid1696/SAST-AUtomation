import {util} from './util';

export async function load(k, obj, data, full_data) {
    if (data) {
      await loadPlugin(k,obj, data, full_data);
    }
}

export async function refresh(k,obj, data, full_data){
    if (data) {
      await loadPlugin(k,obj, data, full_data);
    }
}
export function rx() {
  return rxds;
} 

export async function loadPlugin(k,obj, data_in, full_data) {
  
    var data_binding = util.data_bind(obj);
    var data_out=util.data_transform(obj, data_in, data_binding,rxds);
    var tmpl=util.get_plugin_template(obj);
    var pconfig = obj.config;
    
    //$("#"+k)[0].innerHTML=tmpl;
    
    var widget_config=util.get_widget_config(obj);
    //Udhay - to fix the configuration issue while updating the plugin with new configuration
    //if (!obj.config_fn && widget_config) {
    if (widget_config) {
      obj.config_fn=new Function('data','db','rxds', 'obj', 'mounting', widget_config);
    }
    var methods = {};
   if (data_binding.methods) methods = data_binding.methods;
   if (!obj.vuePlugin) {
     $("#"+k)[0].innerHTML=tmpl;
     var mount_func = function() {
               if (obj.config_fn)
                   obj.config_fn(data_out, data_binding, rxds, obj, "mounting");
             };
     var upd_func =    function() {
               if (obj.config_fn)
                   obj.config_fn(obj.vuePlugin.data, data_binding, rxds, obj);
             };     
     var bd_func = function() {};         
     if (data_binding.mounted) mount_func = data_binding.mounted;
     if (data_binding.updated) upd_func = data_binding.updated;
     if (data_binding.beforeDestroy) bd_func = data_binding.beforeDestroy;
     obj.vuePlugin = new Vue({
              el: "#"+k,
//              template: obj.config.template,
              data: {
                  data: data_out,
                  db: data_binding,
                  others: data_binding.others?data_binding.others:{}
              },
             computed: data_binding.computed?data_binding.computed:{},
             methods: methods,
             mounted: mount_func,
             updated: upd_func,
             beforeDestroy:bd_func
           });
      
   } else {
     obj.vuePlugin.data = data_out;
   }
   
   if(pconfig.flip_report == "Y") {
          util.toggleDT(k,obj, data, full_data);
   }
   
    
} //loadPlugin


export function get(k,obj) {
   if (obj.get) 
       return obj.get();  
   else 
       return '';
}

export function set(k,obj,v) {
   if (obj.set) 
       return obj.set(v);  
   else 
       return '';
}

