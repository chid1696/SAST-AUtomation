// Managers handle the life-cyle of items and regions.
var managers = {};
import {util} from './util';

import * as h1 from './regionTypeReport.js'
managers["Report"]     = h1;

import * as h2 from './regionTypeChartG2.js'
managers["Chart G2"]     = h2;

import * as h3 from './regionTypeChartVega.js'
managers["Chart Vega"]     = h3;

import * as h4 from './regionTypeCharteChart.js'
managers["Chart eChart"]     = h4;

import * as h5 from './regionTypePlugin.js'
managers["Plugin"]     = h5;

import * as h6 from './regionTypejPivot.js'
managers["jPivot"]     = h6;

import * as h7 from './regionTypePivot.js'
managers["Pivot"]     = h7;

import * as h8 from './regionTypeExplorer.js'
managers["Explorer"]     = h8;

import * as h9 from './regionTypeMapLeaflet.js'
managers["Map Leaflet"]     = h9;

import * as h10 from './regionTypeInsights.js'
managers["Insights"]     = h10;

function nvl(a,b){return a=='N'?'N':b}

var data_promises = {};
var query_tracker = {};
var eval2 = eval;

async function fetchCore(p_json, dataType) {
  var data;
  
  let response = await fetch(rxds.db_path, p_json);
  // only proceed once promise is resolved
  if ( (typeof dataType == "undefined") || (dataType === "JSON")) {
     try {
         data = await response.text();
         data = JSON.parse(data);
     } catch (e) {data={"result":[{"data":data,"JSON_error":e}]}; console.log(e);}
  } 
  else {
    data = await response.text();
    if (dataType == "CSV") 
      data = toJSON(data,",");
    else if (dataType == "TSV")
      data = toJSON(data,"\t");
    else if (dataType == "PSV")
      data = toJSON(data,"|");
  }
  return data;
}

function load_views() {
  $('.ui.modal.views').modal('show');
  if (!rxds.load_view) {
    $("#save_query").click(v=>{save_query();});
    $("#delete_query").click(v=>{delete_query();});
    rxds.load_view=1;
  }  
  get_saved_views().then(v=>{
  });
}
async function load_view() {
  var json={reqID:rxds.reqID,x_fn:'admin_get_view',md5_hash:rxds.gQueryString.view,branch:rxds.app.app.branch};
  var rxdsPostInit = { method: 'POST',mode: 'cors',credentials: 'same-origin',body: ""};
  rxdsPostInit.body = encodeURI(JSON.stringify(json));
  var data = await fetchCore(rxdsPostInit, "JSON");
  const res=JSON.parse(data)[0];
  if (res) {
    rxds.view={md5_hash:res.md5_hash,view_name:res.view_name,param:JSON.parse(res.param_dict),"public":res.public};
    /* Find all regions with parameters and set them */
    const pc=rxds.page_controls;
    const pc_keys = Object.keys(pc);
    const parm_regions = pc_keys.filter(i=>pc[i].region&&pc[i].config.parameter);
    parm_regions.forEach(i=>{
      const d=rxds.view.param[pc[i].config.parameter];
      const h=managers[pc[i].control_type]
      if (d && h && h.set) h.set(i, pc[i], d);
    });
    $("#view_name").html(res.view_name);
    $("#view_name").show();
  }
}

async function get_saved_views() {
  var json={reqID:rxds.reqID,x_fn:'admin_get_views'};
  json.x_page_name =  rxds.app.page.page.page_name;
  json.x_app_name =  rxds.app.app.name;
  json.branch=rxds.app.app.branch;
  var rxdsPostInit = { method: 'POST',mode: 'cors',credentials: 'same-origin',body: ""};
  rxdsPostInit.body = encodeURI(JSON.stringify(json));
  var data = await fetchCore(rxdsPostInit, "JSON");
  data=JSON.parse(data);
   var vueWidget = new Vue({
        el: "#View_Output",
        data: {data: data},
        methods: {
          load_view: function (ptype, e) {
             const md5_hash = e.target.dataset.md5_hash;
             var views;
             if (ptype == "public") views = data.public;
             else if (ptype == "private") views = data.private;
             else if (ptype == "recent") views = data.recent;
             const view = views.find(v=>v.md5_hash==md5_hash);
             var url = "?view="+view.md5_hash;
             if (view.view_name) url+= "&view_name="+view.view_name;
             window.location.replace(window.location.origin+window.location.pathname+url);
             
           } //load_view
        }
     });
     $('#View_Output').find('.tabular.menu .item')
      .tab({context: 'parent'})
     ;
  if (rxds.view && rxds.view.view_name) $("#rxds_query_name").val(rxds.view.view_name);
  if (rxds.view && rxds.view.public=="Y") $("#public_view").checkbox('set checked');
  else $("#public_view").checkbox('set unchecked');
  rxds.saved_views=data;   
  return data;
}

function delete_query() {
  $("#rxds_query_name").val(" ");
  save_query();
}
async function save_query() {
  var json={reqID:rxds.reqID,x_fn:'admin_save_view'};
  json.md5_hash=rxds.view.md5_hash;
  json.branch=rxds.app.app.branch;
  json.view_name=$("#rxds_query_name").val();
  json.public_view=$('#public_view').checkbox('is checked')?"Y":"N";
  var rxdsPostInit = { method: 'POST',mode: 'cors',credentials: 'same-origin',body: ""};
  rxdsPostInit.body = encodeURI(JSON.stringify(json));
  
  var data = await fetchCore(rxdsPostInit, "JSON");
  const res=JSON.parse(data).result[0];
  rxds.view={md5_hash:res.md5_hash,view_name:res.view_name,param:JSON.parse(res.param_dict),"public":res.public};
  $("#view_name").html(res.view_name);
  if (res.view_name != " ") $("#view_name").show();
  $('.ui.modal.views').modal('hide');
  //window.location.replace(window.location.origin+window.location.pathname+"?view="+rxds.md5_hash);
}

async function postPageView() {
  var json={},params=false,page_init=rxds.page_init;
  if (!page_init) {
    Object.entries(rxds.page_controls).forEach(i=>{
      var o = i[1], k=i[0], v, n; 
      if (o.item && o.control_type != "button") {
          n=o.config.name; v = get(k);
      } else if (o.config.parameter) {
          n=o.config.parameter; v = get(k); 
      } else if (o.control_type=="Pivot") {
         n=k;v=get(k);
      }  
      if (n && v) json[n]=v;
      params=true;
    });
    if (!params) return; //No controls on the page
  }  
  json.x_page_name =  rxds.app.page.page.page_name;
  json.x_app_name =  rxds.app.app.name;
  json.branch=rxds.app.app.branch;
  json.reqID = rxds.reqID;
  json.x_fn='admin_page_view';
  json.x_stats = rxds.stats;
  json.x_origin=location.origin;
  json.x_pathname=location.pathname;
  json.x_errors = "";
  var rxdsPostInit = { method: 'POST',mode: 'cors',credentials: 'same-origin',body: ""};
  rxdsPostInit.body = encodeURI(JSON.stringify(json));
  
  var v = await fetchCore(rxdsPostInit, "JSON");
  if (!page_init) {
    var url = "?view="+v.md5_hash;
    window.history.pushState(null,null,url);
    var res;
    if (typeof v.data == "object") res = (v.data)[0]; else  res=JSON.parse(v.data)[0];
    if (res && res.md5_hash) {
      rxds.view={md5_hash:res.md5_hash,view_name:res.view_name,param:JSON.parse(res.param_dict),"public":res.public};
      $("#view_name").html(res.view_name);
      if (res.view_name !== " ") $("#view_name").show();
    }
    /* Also get Saved Query name if it exists for the user or public and set it globally */
    /* Get a private/public flag - first priority private view */
  }
  else {json.x_page_load="yes"}
  return v;
}

async function fetchAsync (k, obj, queryID, param, dataType) {
  var data;
  var json = param;
  
	var cachekey = JSON.stringify(Array.prototype.slice.call([queryID,param,dataType]));
	if (!data_promises[cachekey] || (json.cache=="N")) {
    json.x_page_name =  rxds.app.page.page.page_name;
    json.x_app_name =  rxds.app.app.name;
    json.x_lang =  (rxds.app.config.language)?rxds.app.config.language:"EN";
    json.branch=rxds.app.app.branch;
    json.cache =  json.cache?json.cache:nvl(nvl(rxds.app.config.cache,rxds.app.page.config.cache),'Y');
    json.x_control_key = k;
    if (typeof obj == "object")
        json.x_control_name = obj.region?obj.config.title:obj.config.name;
    else
        json.x_control_name = obj;
    
    json.recache_ts = rxds.recache_ts;
    json.reqID = rxds.reqID;
    json.limitRows=1000;
    if (obj.config)
    json.limitRows =  obj.config.limit_rows?Number(obj.config.limit_rows):1000;
    json.query_id =  queryID;
    json.x_fn='ussr';
    var rxdsPostInit = { method: 'POST',mode: 'cors',credentials: 'same-origin',body: ""};
    rxdsPostInit.body = encodeURI(JSON.stringify(json));
  
  	data_promises[cachekey] = fetchCore(rxdsPostInit, dataType);
    if (!json.query)  //Check if this is for annotation
  	    query_tracker[queryID] = {json_sent:json, start_time:new Date()};
  	
    data = await data_promises[cachekey];
    if (!json.query) { //Check if this is for annotation
       query_tracker[queryID].end_time = new Date();
       query_tracker[queryID].data = data;
    }
	}
	else {
    data = await data_promises[cachekey];
    if (!json.query) 
       query_tracker[queryID].data = data;
	}
  return data;
}


function get_parameters(d, r, e) {
    var param={};
    d.forEach(i => {param[rxds.page_controls[i].parameter] = get(i);});
    if (r) r.forEach(i => {if (get(i)) param[rxds.page_controls[i].config.parameter] = get(i);});
    if (e) $.extend(param, e);
    return param;
}

function get_param(p) {
    var k=Object.keys(rxds.page_controls).find(v=>rxds.page_controls[v].parameter==p);
    if (k) return get(k); else return ""; 
}
function find(p) {
    var k=Object.keys(rxds.page_controls).find(v=>rxds.page_controls[v].config.name==p);
    return k; 
}
function find_dom(p){
  return $("#dom_"+rxds.m.find(p));
}
function reset_filter(k) {
  var obj=rxds.page_controls[k];
  const h=managers[obj.control_type];
  obj.filters=[];obj.filter_index=[];
  if (h&&h.reset_filter) 
        h.reset_filter(k,obj);
}

function get(k) {
    var obj=rxds.page_controls[k], val;
    var h=managers[obj.control_type];
    if ((h)&&(h.get)) 
        val = h.get(k,obj);
    else
        val = $("#"+k).closest("form").form('get value',obj.config.name);
    return val;
}

function set_param(p,d) {
    var k=Object.keys(rxds.page_controls).find(v=>rxds.page_controls[v].parameter==p);
    if (k) return set(k,d); else return ""; 
}

function set(k,d) {
    var obj=rxds.page_controls[k], val;
    var h=managers[obj.control_type];
     if (h && h.set)
         h.set(k, obj, d)
     else
        $("#"+k).closest("form").form('set value',obj.config.name, d);
    return val;
}

async function refresh(k, obj, data,param) {
  if (rxds.debug && rxds.debug.stop_load && rxds.debug.controls.match(k)) debugger;
  const h=managers[obj.control_type];
  
  if (h && h.load) { /* If we got data and there is a handler */
     if (data && data.result) 
         await h.load(k, obj, data.result, data,param);
     else
         await h.load(k, obj, data, data,param);
  }    
  
   var d;
   if (rxds.view && rxds.view.param) {
       d=rxds.view.param[obj.config.name];     
   }
   else  {
       const p = obj.parameter;
       d = rxds.gQueryString[p];
       if (!d) d = rxds.gQueryString[obj.config.name];
       d = ((typeof d)=="undefined")?obj.config.def:d;
   }
  

   if (d && obj.item)  { // Set items after load
       try {
       d=d.replace(/{{USER.([^}]*)}}/, function (match, p1,offset, string) {return rxds.user.config?(rxds.user.config[p1]?rxds.user.config[p1]:""):""});
       } catch (e) {console.log(e);console.log(rxds.user);}
       if (d.match(/^`/)) {
         try{d=eval2(d.substr(1))} catch(e) {console.log("error setting default" + d); console.log(e);}
       }
       else if (d == "{{FIRST}}") {
         var qr = rxds.m.query_tracker[obj.query_id];
         if (qr.data.result && qr.data.result[0].value) d = qr.data.result[0].value;
       }
       if (h && h.set)
           h.set(k, obj, d)
       else
          $("#"+k).closest("form").form('set value',obj.config.name, d);
   }

  
} //refresh 


function dependent_handler(k, obj) {
  var h=managers[obj.control_type], children=[];
  if (rxds.app.page.config.reactive == "Y")
     children=obj.children;
  else //Pick only items
     children=R.filter((i)=>i.match(/^item/),obj.children);
  obj.dep_children=children;
  if (h && h.dependent_handler && (children.length > 0 || obj.config.action_code) && !obj.dependent_handler) 
        h.dependent_handler(k,obj,children);
  obj.dependent_handler=true;
}  


function resize(k) {
  window.dispatchEvent(new Event('resize'));
  var obj=rxds.page_controls[k],h=managers[obj.control_type];
  if (h && h.resize)
     h.resize(k,obj);
}

async function load(k,e) {
  var data;
  var dom_obj = $("#dimmer"+k);
  var obj=rxds.page_controls[k];
  var before_load = new Event('before_load');
  var before_query = new Event('before_query');
  var after_query = new Event('after_query');
  var after_load = new Event('after_load');



  obj.dom_obj=dom_obj[0];
  if (dom_obj.length>0) { 
    dom_obj.dimmer('show');
    dom_obj[0].dispatchEvent(before_load);
  }// enable loader
  obj.dependent_handler=false;
  if (obj.query_id > 0) {
    // console.log(obj);
    // Call some function for getting parameters based on dependent objects
    if (rxds.debug && rxds.debug.stop_query && rxds.debug.controls.match(k)) debugger;
    var param = get_parameters(obj.dependent_items, obj.dependent_regions,e);
    if (obj.config.server_filter === 'Y') param.datatable_data = {draw:0,start:0,length:1};
    if (dom_obj.length>0) dom_obj[0].dispatchEvent(before_query);
    data = await fetchAsync(k, obj, obj.query_id,param,obj.dataset_format);
  }
  if (dom_obj.length>0) dom_obj[0].dispatchEvent(after_query);
  await refresh(k, obj, data,param);
  if (dom_obj.length>0) { 
    dom_obj[0].dispatchEvent(after_load);
    dom_obj.dimmer('hide');
  }// disable loader
} //load

export function toJSON(data,sep){
  var lines=data.split("\n");
  var result = [];
  var headers=lines[0].split(sep);
  headers.forEach(
    (v,i)=>{
      if (typeof v == "string")
	      headers[i]=v.replace(/^\"(.*)\"$/, "$1");
    });
  for(var i=1;i<lines.length;i++){
    if (lines[i].trim() !== "") {
  	  var obj = {};
  	  var currentline=lines[i].split(sep);
  	  headers.forEach(
  	    (v,i)=>{
  	      if (typeof currentline[i] == "string")
    	      obj[v]=currentline[i].replace(/^\"(.*)\"$/, "$1");
  	      else
    	      obj[v]=currentline[i];
  	      
  	    });
  	  result.push(obj);
    }
  }
  return result; //JavaScript object
} //toJSON



  managers["selectlist"] = {
    get: function(k,obj) {
      return $("#"+k).dropdown('get value');
    },
    set: function(k,obj,v) {
      if (v=="") 
      $("#"+k).dropdown('clear');
      else {
          $("#"+k).dropdown('set selected',v.split(/\|/));
          if ($("#"+k).dropdown('get value') == "" && obj.query_id > 0) // Pick first value; setting value not in drop-down
          {
               var qr = rxds.m.query_tracker[obj.query_id]; 
               if (qr.data.result && qr.data.result[0].value) {
                 $("#"+k).dropdown('set selected',qr.data.result[0].value);
                 if (obj.config.action_code) {
                    var action_fn=new Function('value','text','obj', obj.config.action_code);
                    action_fn();
                  }
                  if (obj.dep_children) rxds.load_children(obj.dep_children);
               }   
          }
      }    
    },
    load: async function(k, obj, data) {
         var clearable = true;
         if (obj.config.required == "Y") clearable = false;
         if (data) {
           if (obj.config.db_filter == "Y") {
               $("#"+k).dropdown({values: data,
                    apiSettings: {
                        responseAsync:  function(settings, callback) {
                          var param = get_parameters(obj.dependent_items);
                          param.search = settings.urlData.query;
                          fetchAsync(k, obj, obj.query_id,param,obj.dataset_format).then(
                                function(data){
                                  if (data.result)
                                     callback({success:true,results:data.result});
                                  else
                                     callback({success:true,results:data});
                                }
                            )
                        }},
                        filterRemoteData: true,
                        localSearch: true,
                        minCharacters: 3,clearable: clearable,
                        saveRemoteData: true });
           } else if (Array.isArray(data) && data[0])
                $("#"+k).dropdown({values: data,clearable: clearable});
         }
         else $("#"+k).dropdown({clearable: clearable});
         /*
         $("#"+k).children("i.remove.icon").on('click', function(e){
      	  $(this).parent('.dropdown').dropdown('clear');
          e.stopPropagation();
        });
        */
      
    },  
    refresh: load,
    dependent_handler: function(k,obj,children) {
       $("#"+k).dropdown({
            onChange: function(value, text, $selectedItem) {
              if (obj.config.action_code) {
                var action_fn=new Function('value','text','obj', obj.config.action_code);
                action_fn(value,text,obj);
              }
              rxds.load_children(children);
            }
        });
    }
  }

    
  managers["datepicker"] = {
    set: function(k,obj,v) {
          $("#"+k).calendar({on:'hover',type:'date'});
          $("#"+k).calendar('set date',v.toDate());         
    },
    get: function(k,obj) {
          //To return the value as string instead of date type
            var d=$("#"+k).calendar('get date');
            return d.getFullYear() + "-" + ("0" + (d.getMonth()+1)).substr(-2) + "-" + ("0" + d.getDate()).substr(-2);
            //return $("#"+k).calendar('get date');   //Old code to return the value as it is as date type 
    },
    load: async function(k, obj, data) {
        var sDate,today = new Date(); 
        $("#"+k).calendar({ on:'hover',type:'date'});
         if (data) {
           //console.log("date calendar",data);
           sDate = Object.values(data[0])[0];
            $("#"+k).calendar('set date',sDate.toDate());         
         }
         else {
            sDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            $("#"+k).calendar('set date',sDate);         
         }
      },
     dependent_handler: function(k,obj, children) {
       var changed=false;
       $("#"+k).calendar({
            on:'hover',
            type:'date',
            onHidden: function () {
              if (changed) rxds.load_children(children);
              changed= false;
            },
            onChange: function(value, text, $selectedItem) {
              changed=true;
            }
        });
    }

  }
  
  managers["checkbox"] = {
    get:function(k,obj) {
        //return $("#"+k).find(".ui.checkbox.checked input").map((i,v)=>{return v.value}).get().join('|');
        return $("#"+k).find(".ui.checkbox input").filter((i,v)=>{return v.checked}).map((i,v)=>{return v.value}).get().join('|');
    },
    set: function(k,obj,v) {
      if (v=="") { 
          $("#"+k).checkbox('uncheck');
      } else {
          $("#"+k).find(".ui.checkbox input").each((i,c)=>{
              if (('|'+v+'|').match("/\|"+c.value+"\|/")) {
                  c.checked=true;
              } else {
                  c.checked=false;
              }
          });
      }
    },           
    load: async function(k, obj, data) {
         if (data) {
              var vueChk = new Vue({
                        el: "#"+k,
                        data: {
                            cbs: data
                        },
                        methods: {
                                  check: function(e) {
                                    if (e.target.checked) {
                                      console.log(e.target.value)
                                    }
                                  }
                               }
     
                     });
              vueChk.$nextTick(function () {
                $("#"+k).find(".checkbox").checkbox();       
              });       
         }
         else {
            $("#"+k).checkbox();
         }
    },
    dependent_handler: function(k,obj,children) {
       $("#"+k).checkbox({
            onChange: function(value, text, $selectedItem) {
              rxds.load_children(children);
            }
        });
    }
  }
  managers["switch"] = managers["checkbox"];
  managers["slider"] = managers["slider"];
  
  managers["Tabs Container"] = {
     load: async function(k, obj, data) {
       $("#"+k).find('.tabular.menu .item')
           .tab({context: 'parent',onVisible:function(t){
             window.dispatchEvent(new Event('resize'));
             var c=this.dataset.id;
             if (rxds.page_controls[c].control_type=="Report") 
                rxds.page_controls[c].table.columns.adjust().draw();
           }});
     }   
  }
  
  managers["radiobutton"] = {
    get:function(k,obj) {
        return $("#"+k).find(".ui.checkbox input").filter((i,v)=>{return v.checked}).map((i,v)=>{return v.value}).get().join('|');
        //var isFalse = n => n != false,
        //val = $("#"+k).closest("form").form('get value',obj.config.name);
        //return R.filter(isFalse,val)[0];
    },
    set: function(k,obj,v) {
      if (v=="") { 
          $("#"+k).checkbox('uncheck');
      } else {
          $("#"+k).find(".ui.checkbox input").each((i,c)=>{
              if (('|'+v+'|').match("/\|"+c.value+"\|/")) {
                  c.checked=true;
              } else {
                  c.checked=false;
              }
          });
      }
    },           
    load: async function(k, obj, data) {
         if (data) {
              var vueChk = new Vue({
                        el: "#"+k,
                        data: {
                            rbs: data
                        },
                        methods: {
                                  check: function(e) {
                                    if (e.target.checked) {
                                      console.log(e.target.value)
                                    }
                                  }
                               }
     
                     });
              vueChk.$nextTick(function () {
                $("#"+k).find(".checkbox").checkbox();       
              });       
         }
         else {
            $("#"+k).checkbox();
         }
    },
    dependent_handler: function(k,obj,children) {
       $("#"+k).checkbox({
            onChange: function(value, text, $selectedItem) {
              if (obj.config.action_code) {
              var action_fn=new Function('value','text','obj', obj.config.action_code);
              action_fn();}
              rxds.load_children(children); 
            }
        });
    }
  }

  managers["Flip Container"] = {

    load: async function(k, obj, data) {
        var elem = $("#"+k+" .flipped");
        elem.click(function(){
          var s = $("#"+k).find(".ui.shape"); 
          s.shape({width:'next',height:'next'});
          s.shape('flip left');
        });
        
    }
  }  
  
  managers["buttongroup"] = {
    get: function(k,obj) {return null}
  }  
  
  managers["button"] = {
    get: function(k,obj) {return null},
    load: async function(k, obj, data) {
        $("#"+k).click(function(){
          if (obj.config.action && obj.config.action.match(/Reset/)){
              //$('form').form('clear');
              window.location.replace(window.location.origin+window.location.pathname);
          } else if (obj.config.action && obj.config.action.match(/Refresh/)) {
            rxds.load_regions();
          } else if (obj.config.action && obj.config.action.match(/Powerpoint/)) {
            rxds.generate_ppt();
          } else {
            rxds.load_regions();
          }
            return false;
        });
        
    }
  }  

  managers["hiddenitem"] = {
    get: function(k,obj) {
      return obj.value;
    },
    set: function(k,obj,v) {
      obj.value = v;
    },
    load: async function(k, obj, data) {
         if (data) {
             try {
             obj.value = data[0].name;
             } catch(e) {obj.value = 'Need one row with name column'}
         }
         else obj.value = "";
    },  
    refresh: load
  }


  
     
export var manager ={};
manager.load = load;
manager.get = get;
manager.managers = managers;
manager.refresh = refresh;
manager.query_tracker = query_tracker;
manager.dependent_handler = dependent_handler;
manager.fetchAsync = fetchAsync;
manager.postPageView = postPageView;
manager.load_views = load_views;
manager.load_view = load_view;
manager.get_parameters = get_parameters;
manager.get_param = get_param;
manager.fetchCore = fetchCore;
manager.resize = resize;
manager.util = util;
manager.reset_filter = reset_filter;
manager.set_param = set_param;
manager.set = set;
manager.find = find;
manager.find_dom = find_dom;