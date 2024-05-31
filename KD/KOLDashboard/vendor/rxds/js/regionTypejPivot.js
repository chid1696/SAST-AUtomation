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

export async function loadPiv(k,obj, data_in, full_data) {
    var data;
    var cols=[],fils=[],i=0;
  
    if (obj.config.data_transform) {
        var transform_fn=new Function('data','db', 'rxds', obj.config.data_transform);
        data = transform_fn(data_in,data_binding, this);        
    } else data = data_in;

    var table;
    if (data && data.length > 0 ) {
      table = $("#"+k).pivotUI(data,{
    renderers: $.extend(
    	$.pivotUtilities.renderers, 
      $.pivotUtilities.c3_renderers,
      $.pivotUtilities.d3_renderers
    )
  });
      
      if (obj.config.region_config) {
          var config_fn=new Function('opts','data', 'rxds', 'obj', obj.config.region_config);
          table = config_fn(table, data, this, obj);
      }
    }
} //loadPiv
