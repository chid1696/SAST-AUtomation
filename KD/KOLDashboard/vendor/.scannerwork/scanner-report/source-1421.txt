// For testing browser cache
//$('#reload').append(" V 0.2 ");
function load_develop_controls() {
  rxds.debug={controls:[],stop_query:false,stop_load:false};
  if (!localStorage.debug) 
      localStorage.debug = JSON.stringify(rxds.debug);  
  else
      rxds.debug = JSON.parse(localStorage["debug"]);
      
  var pc=rxds.page_controls;
  var pc_keys = Object.keys(pc);
  var controls = pc_keys.map(v=>{return {"value":v,"name":pc[v].config.name}});
//  var regions=R.filter(v=>pc[v].region, pc_keys).map(v=>{return {"value":v,"name":pc[v].region?pc[v].config.title:pc[v].config.name}});
  const parm_controls = pc_keys.filter(v=>pc[v].query_id>0).map(v=>{return {"value":v,"name":pc[v].region?pc[v].config.title:pc[v].config.name}});
  $('.ui.accordion').accordion({animateChildren: false});
  
  $("#slControls").dropdown({values: controls,delimiter: ',', fullTextSearch: true});
  
  
  if (rxds.debug.controls.length > 0) {
     $("#slControls").dropdown('set selected',rxds.debug.controls.split(/\,/));
  }
  if (rxds.debug.stop_query) $('#debug_query').checkbox('check'); 
  if (rxds.debug.stop_load) $('#debug_load').checkbox('check'); 
  $('#top_panel').find('.tabular.menu .item')
      .tab({context: 'parent'})
     ;
  
  $("#slRegions").dropdown({values: parm_controls,delimiter: ',', fullTextSearch: true});

  $('#reload').on('click', function(e) { 
    rxds.debug.controls = $("#slControls").dropdown('get value');
    rxds.debug.stop_query = $('#debug_query').checkbox('is checked');
    rxds.debug.stop_load = $('#debug_load').checkbox('is checked');
    localStorage.debug = JSON.stringify(rxds.debug);
    location.reload();
  });
  
  
  function set_ace(p_edit, p_val) {
     if (p_val)
         ace.edit(p_edit).getSession().setValue(p_val);
     else
         ace.edit(p_edit).getSession().setValue("");
  }
  
  window.setTimeout(function() {
    $('#slRegions').dropdown('setting', 'onChange',
      function(val) {
        var p = pc[val];
        var q = p.query_id;
        var qq = rxds.m.query_tracker[q];
        if (!qq) {
            set_ace("data_sent","This region has not executed yet. Usually caused by not all fields populated or  error while populating items"); return;
        }
        //set_ace("url_details",rxds.url_string.slice(0,-1));   //commented this temporarily becsuse this line showed error and not configured properly
        set_ace("data",JSON.stringify(qq.data, null, '\t'));
        set_ace("data_sent",JSON.stringify(qq.json_sent, null, '\t'));
        
       if (qq.data && qq.data.submitted && qq.data.submitted.qsql)
         set_ace("sql_text", qq.data.submitted.qsql)
       else if (qq.data && qq.data.submitted && qq.data.submitted.query)
         set_ace("sql_text", qq.data.submitted.query)
       $('pre code').each(function(i, block) {
          hljs.highlightBlock(block);
        });

        set_ace("data_binding", p.config.data_binding);
        set_ace("region_transform", p.config.region_transform);
        set_ace("region_config", p.config.region_config);
        set_ace("region_template", p.config.template);
        if (p.options) set_ace("options", JSON.stringify(p.options, null, '\t'));

        if (p.config.widget_id) {
          var w = rxds.page_widgets[p.config.widget_id];
          set_ace("widget_config", w.widget_config);
          set_ace("widget_transform", w.widget_transform);
          set_ace("widget_template", w.widget_template);
        }


        $("#dev_upd_region").removeClass("disabled");
        $("#dev_query").removeClass("disabled");
        $("#dev_cache").removeClass("disabled");
        $("#dev_upd_region").on('click', function(){
          p.config["data_binding"]=ace.edit("data_binding").getSession().getValue();
          p.config["region_transform"]=ace.edit("region_transform").getSession().getValue();
          p.config["region_config"]=ace.edit("region_config").getSession().getValue();
          p.config["template"]=ace.edit("region_template").getSession().getValue();
          if (w) {
            w.widget_config=ace.edit("widget_config").getSession().getValue();
            w.widget_transform=ace.edit("widget_transform").getSession().getValue();
            w.widget_template=ace.edit("widget_template").getSession().getValue();
          }
          if (p.vuePlugin) p.vuePlugin = false;
          rxds.m.refresh(val,p,qq.data);
          return false;
        });
        $("#dev_query").on('click', function(){
            var json = qq.json_sent;
            json.get_query = 1;
            rxds.m.fetchAsync(val,pc[val],p.query_id,json,p.dataset_format).then(
              function(data) {
                if (typeof data == "object" && data.Submitted && data.Submitted.query)
                  set_ace("sql_text", data.Submitted.query);
                else if (typeof data == "object" && data.submitted && data.submitted.query)
                  set_ace("sql_text", data.submitted.query);
                else
                  set_ace("sql_text", JSON.parse(data)[0].query);
              }
            );
            return false;
        });
        $("#dev_cache").on('click', function(){
           var hash="";
           if (qq.data && qq.data.disk) hash=qq.data.disk;
           window.open('https://apps20.rxdatascience.com/MASTER/AppAnalysis/AppCache/?slAA_APP_CACHE_FromDate=&slAA_APP_CACHE_ToDate=&slAAHost=&slAA_AppCache_App='+rxds.app.app.name+'&slAA_AppCache_Page='+rxds.app.page.page.page_name+'&slAA_UDST=&slAA_Cache_loc=&slAAQueryId='+p.query_id+'&slAA_Cache_Hash='+hash, '_blank');
        });
        
     }
    );

    $("#redo_region").checkbox('setting', 'onChange', function(){
       if ($('#redo_region').checkbox('is checked'))
          $('#top_panel').show();
       else
          $('#top_panel').hide();
     });

    $("#edit_links").checkbox('setting', 'onChange', function(){
       if ($('#edit_links').checkbox('is checked')) {
         if (rxds.edit_links) {
           $(".edit_link").show();
         } else {
          rxds.edit_links = true;
          $('DIV [id^=region]').each(function(){
            let id = $(this).attr('id');
            let div = rxds.page_controls[id];
            //console.log(div.config.title,id,div.query_id);
            if (div) {
              $(this).prepend('<a href="https://tesla-apex.rxdatascience.com/ords/f?p=1000:6::P6_DATASET_ID:::P6_DATASET_ID:' + div.query_id + '" class="edit_link" target="_Q' + div.query_id + '">Edit Query</a> ');
              $(this).prepend('<a href="https://tesla-apex.rxdatascience.com/ords/f?p=1000:12::P12_REGION_ID:::P12_REGION_ID:' + div.region.region_id + '" class="edit_link" target="_R' + div.region.region_id + '">Edit Reg</a> ');
            }
          });    
         }
       } else $(".edit_link").hide();
     });
     
     var editor;
    $('.editor').each(function( index ) {
      editor = ace.edit(this);
      if (this.id == "sql_text")
          editor.getSession().setMode('ace/mode/q');
      else if (this.id == "region_template")    
          editor.getSession().setMode('ace/mode/html');
      else if (this.id == "widget_template")    
          editor.getSession().setMode('ace/mode/html');
      else
          editor.getSession().setMode('ace/mode/javascript');
      editor.setTheme("ace/theme/idle_fingers");
      editor.$blockScrolling = Infinity;
      editor.setOptions({maxLines:30});

    });

   },1000);

 // console.log(controls);
}

