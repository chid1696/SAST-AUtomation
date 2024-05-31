export var util = {}
util.data_bind = function(obj) {
  try {
    if (obj.config.data_binding) {
      //let db=obj.config.data_binding.replace('{{vendor}}',(rxds.is_home?"":"../")+"vendor");
      let db=obj.config.data_binding.replaceAll('{{vendor}}',(rxds.is_home?"":"../")+"vendor");   //udhay - to replace all vendor strings
      return JSON.parse(db)
    }  
    else return '{}';
  } catch (e) {console.log(e); return '{}'}  
}   

util.get_transform = function (obj) {
  if (obj.config.widget_id) 
     if (rxds.page_widgets[obj.config.widget_id]) {
         if (obj.config.region_transform && rxds.page_widgets[obj.config.widget_id].widget_transform)
//             return rxds.page_widgets[obj.config.widget_id].widget_transform.trim() + "\n" + obj.config.region_transform.trim();
               return obj.config.region_transform.trim(); // If there is a region transform use that instead of widget transform
         else if (rxds.page_widgets[obj.config.widget_id].widget_transform)
             return rxds.page_widgets[obj.config.widget_id].widget_transform.trim();
     }     
  if (obj.config.region_transform) return obj.config.region_transform.trim();
  return null;
}


/* Need to be careful data transformed will change for all widgets - Detect shared widgets and duplicate the data*/
util.data_transform = function(obj, data, db, rx) {
  var chart_data;
  try {
    var transform = util.get_transform(obj);
    if (db.subset) data = data[db.subset];
    if (transform) {
        var transform_fn = new Function('data','db','rxds','obj', transform);
        chart_data = transform_fn(data,db,rx,obj);
    } 
    if (chart_data) return chart_data; else return data;
  } catch (e) {console.log(e); return data}  
}   

util.get_widget_config = function (obj) {
  if (obj.config.widget_id) 
     if (rxds.page_widgets[obj.config.widget_id]) {
         if (obj.config.region_config)
             return rxds.page_widgets[obj.config.widget_id].widget_config + "\n" + obj.config.region_config.trim();
         else
             return rxds.page_widgets[obj.config.widget_id].widget_config;
     }     
            
  if (obj.config.region_config) return obj.config.region_config.trim();
}

util.get_plugin_template = function(obj) {
  var tmpl;
  if (rxds.page_widgets[obj.config.widget_id] && rxds.page_widgets[obj.config.widget_id].widget_template) 
      return rxds.page_widgets[obj.config.widget_id].widget_template
  else 
      return obj.config.template
  }
  
//for japan apps
function japanese_options () {
  return {
    //"sEmptyTable":     "テーブルにデータがありません",
    "sEmptyTable":     "この選択に対してデータは返されませんでした",
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

util.toggleDT =  function(k,obj, data_in, full_data) {
    var data;
    //var div = "table#" + $(".flip-container").data("id"); 
    var div = "table#GRID"+k;
    var flipContainer ="flip"+k;
    $("#"+flipContainer).height(Number(obj.config.height)*window.innerHeight/100);
    var cols=[],fils=[],i=0;
    //Intialiaze if DT already exist
    if ( $.fn.dataTable.isDataTable(div) ) {
        var table = $(div).DataTable();
        table.clear();
        if (obj.config.server_filter == 'Y') {
          table.destroy();
          //$(`<table id="GRID${obj.region.region_id}" class="ui celled table" cellspacing="0" width="100%"></table>`).appendTo( `#CONT${obj.region.region_id}` );
        } else table.destroy();
        $(div).empty();
    }
      
    if (typeof data_in.table !== "undefined") data = data_in.table; else data=data_in;
    if (obj.config.data_transform) {
        var transform_fn=new Function('data','db','rxds','obj', obj.config.data_transform);
        data = transform_fn(data,data_binding,this,obj);        
    };

      
      for(var t in data[0]) {
        var title;
        //Is there a config for this column?
        var colSet=rxds.app.report_headers[t];
        if (colSet !== undefined) {
           title=colSet.Label;
           if (colSet.Render==="number"){
              cols.push({"title":title, "data":t, className: "right aligned", render: $.fn.dataTable.render.number(',', '.', 0 ) });
           }else if (colSet.Render==="percentage"){
              cols.push({"title":title, "data":t, className: "right aligned", render: $.fn.dataTable.render.number(',', '.', 0, '', '%') });
           }else if (colSet.Render==="currency"){
              cols.push({"title":title, "data":t, className: "right aligned", render: $.fn.dataTable.render.number(',', '.', 2, '$') });
           }else if (colSet.Render==="text"){
              cols.push({"title":title, "data":t, className: "right aligned", render: $.fn.dataTable.render.text() });
           }else{
              cols.push({"title":title, "data":t});
           }
        }else{ //No settings for this column
           if ((typeof data[0][t] == "number") && (!/Year|_ID$|Zip|NPI/i.test(t))){
              if(Number.isInteger(data[0][t]))
                cols.push({"title":t, "data":t, className: "dt-body-right", render: $.fn.dataTable.render.number( ',', '.', 0 ) });
              else
                cols.push({"title":t, "data":t, className: "dt-body-right", render: (data) => (data ? data.toLocaleString() : data) });
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
          //"language": { search: "", emptyTable: ((rxds.app.config.language === "JP") ? "この選択に対してデータは返されませんでした": "No Data returned for this Selection")},
          "deferRender": true,
          "buttons": false,
          "scrollY": 250,
          "scrollX": 250,
          "scroller": true,
          "scrollCollapse": true,
          "destroy": true,
          "fixedcolumns": true,
          "order"  : [],
          "aaSorting": [],
          "pageLength": 10,
          "paging":true,
          "pagingType":"full_numbers",
          "dom":    "<'ui grid dataTables_wrapper no-footer'"+
                            "<'sixteen wide column'tr>"+
                            "<'left aligned four wide column'i>"+
                            "<'right aligned twelve wide column'p>"+
                    ">",
          "buttons":["copy","excel"]
       };
       
       if (rxds.app.config.language=="JP") {opts.language=japanese_options();}
      
      obj.disk = full_data.disk;
      const limitRows =  obj.config.limit_rows?Number(obj.config.limit_rows):1000;
      if (data.length == limitRows)
         opts.buttons.push({
                text: 'Full Export',
                action: function ( e, dt, node, config ) {
                    //alert( 'Not yet implemented' );
                    rxds.db_path = rxds.is_home ? "db/":"../db/";
                  if (rxds.is_home)  
                      window.open('download_file?cache_id='+obj.disk+'&query_id='+
                              obj.query_id+'&format=xls');
                  else
                      window.open('../download_file?cache_id='+obj.disk+'&query_id='+
                              obj.query_id+'&format=xls');
                }
            });
      /*
      //  Modified for dark UI
      $("#"+k).find('.export.item').click(function() {
            rxds.db_path = rxds.is_home ? "db/":"../db/";
           var t=obj.config.title;
           t= t.replace(/[^a-zA-Z0-9]/g,'_');

              if (rxds.is_home)  
                  window.open('download_file?cache_id='+obj.disk+'&query_id='+
                          obj.query_id+'&export_file='+t+'&format=csv');
              else
                  window.open('../download_file?cache_id='+obj.disk+'&query_id='+
                          obj.query_id+'&export_file='+t+'&format=csv');
      });
      */
      //Udhay to fix the multiple export issue
      if(rxds.app.app.branch.match(/MASTER|QA|UI/)) {
        let fn_export_data  = function() {
            rxds.db_path = rxds.is_home ? "db/":"../db/";
            if(rxds.m.query_tracker[obj.query_id].data.result.length == 0) {  //to show no data info if there is no data to export
                $(".ui.modal.no-data-message").modal("show");
                return;
            }
            //var t=obj.config.title.replace(/(<([^>]+)>)/g, "");
            var t = $(this).parent().prev('.item-header,.item').text().trim();
            if(rxds.app.config.language === "JP")
                t = t.replace(/[^a-zA-Z0-9&\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u2605-\u2606\u2190-\u2195]|\u203B/g,"_").replace(/_*_/g,"_");
            else {
                t= t.replace(/[^a-zA-Z0-9&]/g,'_').replace(/_*_/g,"_");
                t = escape(t);
            }
            if (rxds.is_home)  
                window.open('download_file?cache_id='+obj.disk+'&query_id='+ obj.query_id+'&export_file='+t+'&format=csv');
            else
                window.open('../download_file?cache_id='+obj.disk+'&query_id='+ obj.query_id+'&export_file='+t+'&format=csv');
        };
        //$("#"+k).find('.export.item-header.color-midnight-blue').unbind("click",fn_export_data);
        $("#"+k).find('.export.item-header.color-midnight-blue').unbind("click");
        $("#"+k).find('.export.item-header.color-midnight-blue').on("click", fn_export_data);
      } else {
        $("#"+k).find('.export.item-header.color-midnight-blue').click(function() {
            rxds.db_path = rxds.is_home ? "db/":"../db/";
            if(rxds.m.query_tracker[obj.query_id].data.result.length == 0) {  //to show no data info if there is no data to export
                $(".ui.modal.no-data-message").modal("show");
                return;
            }
            //var t=obj.config.title.replace(/(<([^>]+)>)/g, "");
            var t = $(this).parent().prev('.item-header,.item').text().trim();
            if(rxds.app.config.language === "JP")
                t = t.replace(/[^a-zA-Z0-9&\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u2605-\u2606\u2190-\u2195]|\u203B/g,"_").replace(/_*_/g,"_");
            else {
                t= t.replace(/[^a-zA-Z0-9&]/g,'_').replace(/_*_/g,"_");
                t = escape(t);
            }
            if (rxds.is_home)  
                window.open('download_file?cache_id='+obj.disk+'&query_id='+ obj.query_id+'&export_file='+t+'&format=csv');
            else
                window.open('../download_file?cache_id='+obj.disk+'&query_id='+ obj.query_id+'&export_file='+t+'&format=csv');
        });
      }
      /*-------------------------------------------------------------------*/

      var table;
      /*if (obj.config.region_config) {
          var config_fn=new Function('opts','data', 'rxds', 'div', obj.config.region_config);
          table = config_fn(opts, data, this, div);
          if (!obj.config.region_config.match(/.DataTable/))
               table = $(div).DataTable(opts);
      }
      else */
      table = $(div).DataTable(opts);
    
      
//Create buttons to the top left of the DT

   if (opts.buttons) {

     table.buttons().container()
            .appendTo( $('div.eight.wide.column:eq(0)', table.table().container()) );
   }

   return table;
} //loadDataTable


util.load_annotation_modal = async function(k,obj) {
  
    var data = await util.load_annotation(k, obj);

//hide and show New or Edit option    

    if (Array.isArray(data) && data.length) {
      data = data[0];
      
      //Udhay - to replace new lines with <br> tag as thie displays the content as html
      //data.headline = data.headline.replace(/\n/g,"<br>");
      //data.description = data.description.replace(/\n/g,"<br>");
      
      $("#modalNew"+k).hide();
      $("#modalEdit"+k).show();
      if (!obj.annotateVue)
         obj.annotateVue = new Vue({
              el: "#insights"+k,
              data: {data:data}
           });
      else
          obj.annotateVue.data=data;
      //$("#annotate"+k).show();  
      $("#insights"+k).show();  
      if(data.headline === "Enter the headline here") {
            $("#insights"+k).find(".ui.header").hide()
      }
     }else{
      $("#modalEdit"+k).hide();
      $("#modalNew"+k).show();
      //$("#annotate"+k).hide();  
      $("#insights"+k).hide();  
    }
    
    util.refresh_modal(k,obj);
  
}

util.refresh_modal = async function(k,obj){
// check annotate role Global or App specific 
    $.each(rxds.user.userRoles.split(":"),function(index,value){ 
      if ((value.match(rxds.app.app.url + " Annotate Role") !== null) || (value.match("Annotate Role") !== null)) {
            $("#"+k).find('.right.menu .pointing.dropdown').show();
      }
    });

    $("#"+k).find('.right.menu .pointing.dropdown').dropdown({
      action: 'activate',
      onChange: async function(value, text, $selectedItem) {
       // debugger;
 
        var k = value;
        var obj = rxds.page_controls["region"+k];
        var data = await util.load_annotation("region"+k, obj);
        if (!(Array.isArray(data) && data.length)) {
          data = {headline:"Enter the headline here",description:"Enter the description here"};
        }
        else data=data[0];

        data.region = "region"+k;
        if (rxds.vm_annotation) {
            rxds.vm_annotation.data = data;
        } else {
               rxds.vm_annotation = new Vue({
                  el: "#annotateModal",
                  data: {data:data},
                  methods: {
                      save: function (message,evt) {
                     //   debugger;
                        if (event) {
                          util.save_annotation(evt.target.dataset.region);
                          if (text.match(/New/)) {
                             $("#modalNew"+k).hide();
                             $("#annotate"+k).show(); 
                          }
                          $('.ui.fullscreen.modal').modal('hide');
                        }
                      },
                      cancel: function (evt) {
                        $('.ui.fullscreen.modal').modal('hide');
                      }
                    }

            });
        }
        
        $('.ui.fullscreen.modal')
          .modal('show')
        ;  
      }
    });
}

util.get_annotation_month = function(obj) {
  var mth;
  var parm_name = "ASOF_MONTH";
  var db=util.data_bind(obj);
  
  if (rxds.app.page.config.annotate_field) parm_name = rxds.app.page.config.annotate_field;
  if (db && db.month) parm_name = db.month;
  //if (obj.config.data_binding && obj.config.data_binding.month) parm_name = obj.config.data_binding.month;
  
  try {mth = rxds.m.get_param(parm_name).replaceAll('-','.');} catch(e) {mth="2000.01m"}
  if (mth.length===7) {mth=mth+".01";}
  return mth;
}

util.load_annotation = async function(k,obj) {
  
  var json={"cache":"N","month":""};
  json.month = util.get_annotation_month(obj);
  var db=util.data_bind(obj);
  if (db && db.key) {
     var key = db.key;
     json.key = rxds.m.get_param(key);
     json.query = '{ select region,page,icon, title, headline, description from APP_ANNOTATE ' +
               ' where region=(`$(d`key),d`x_control_key),page=`$d`x_page_name,month="D"$d`month, not null headline}[]';
  }
  else {
  json.query = '{ select region,page,icon, title, headline, description from APP_ANNOTATE ' +
               ' where region=`$d`x_control_key,page=`$d`x_page_name,month="D"$d`month, not null headline}[]';
  }

  var data = await rxds.m.fetchAsync(k, obj, obj.query_id, json, "JSON");
  data=data.result;
  return data;
}

util.save_annotation = async function(k) {
  
  var json={"cache":"N"};
  var obj = rxds.page_controls[k];

  json.headline = $("#taHeadline").val();
  json.description = $("#taContent").val();
  json.icon = "key icon";
  json.month = util.get_annotation_month(obj);
  var db=util.data_bind(obj);
  
  if(obj.config.title_bg === "hidden" && json.description === ""){
      json.headline = "";
  }
  if (db && db.key) {
     var key=db.key;
     json.key = rxds.m.get_param(key);
    json.query = '{`APP_ANNOTATE upsert([region:enlist (`$(d`key),d`x_control_key);page:enlist `$d`x_page_name;month:enlist "D"$d`month]headline:enlist `$d`headline;description:enlist `$d`description;icon:enlist `$d`icon); save `APP_ANNOTATE; send_to_ports["load `APP_ANNOTATE"]; show "saved"}[]';
  } else {
    json.query = '{`APP_ANNOTATE upsert([region:enlist `$d`x_control_key;page:enlist `$d`x_page_name;month:enlist "D"$d`month]headline:enlist `$d`headline;description:enlist `$d`description;icon:enlist `$d`icon); save `APP_ANNOTATE; send_to_ports["load `APP_ANNOTATE"]; show "saved"}[]';
  }  
  var data = await rxds.m.fetchAsync(k, obj, obj.query_id, json, "JSON");
  data=data.result;
  
  if(data) {
     data = util.load_annotation_modal(k, obj);
  }
  return data;
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

util.nmd = function () {
"use strict";

var escapes = '\\[!]#{()}*+-._',
    esc_ofs = 16;

function lex(a) {
	return a.replace(/\\([(){}[\]#*+\-.!_\\])/g, function (m, ch) {
		return String.fromCharCode(1, escapes.indexOf(ch)+esc_ofs);
	}).replace(/(\*\*|__|~~)(\S(?:[\s\S]*?\S)?)\1/g, function (m, delim, text) {
		return (delim === '~~') ? '<del>'+text+'</del>' : '<b>'+text+'</b>';
	}).replace(/(\n|^|\W)([_\*])(\S(?:[\s\S]*?\S)?)\2(\W|$|\n)/g, function (m, l, di, ital, r) {
		return l+'<i>'+ital+'</i>'+r;
	}).replace(/(!?)\[([^\]<>]+)\]\((\+?)([^ \)<>]+)(?: "([^\(\)\"]+)")?\)/g, function (match, is_img, text, new_tab, ref, title) {
		var attrs = title ? ' title="' + title + '"' : '';
		if (is_img)
			return '<img src="' + nmd.href(ref) + '" alt="' + text + '"' + attrs + '/>';
		if (new_tab)
			attrs += ' target="_blank"';
		return '<a href="' + nmd.href(ref) + '"' + attrs + '>' + text + '</a>';
	});
}

function unesc(a) {
	return a.replace(/\x01([\x0f-\x1c])/g, function (m, c) {
		return escapes.charAt(c.charCodeAt(0)-esc_ofs);
	});
}

var nmd = function (md) {
	return md.replace(/.+(?:\n.+)*/g, function (m) {
		var code = /^\s{4}([^]*)$/.exec(m);
		if (code)
			return '<pre><code>' + code[1].replace(/\n    /g, '\n') + '</code></pre>';
		var ps = [], cur,
		    rows = lex(m).split('\n');
		for (var i = 0, l = rows.length; i < l; ++i) {
			var row = rows[i],
			    head = /^\s{0,3}(\#{1,6})\s+(.*?)\s*#*\s*$/.exec(row);
			if (head) { // heading
				ps.push(cur = [ head[2], 'h', head[1].length ]); // cur = [ text, type, level ]
				continue;
			}
			var list = /^(\s*)(?:[-*]|(\d[.)])) (.+)$/.exec(row);
			if (list)
				ps.push(cur = [ list[3], list[2] ? 'ol' : 'ul', list[1].length ]); // cur = [ text, type, level ]
			else
				if (/^\s{0,3}([-])(\s*\1){2,}\s*$/.test(row))
					ps.push(cur = [ '', 'hr' ]);
				else
					if (cur && cur[1] !== 'hr' && cur[1] !== 'h')
						cur[0] += '\n' + row;
					else
						ps.push(cur = [ row, 'p', '' ]);
		}
		var out = '', lists = [];
		for (i = 0, l = ps.length; i < l; ++i) {
			cur = ps[i];
			var text = cur[0], tag = cur[1], lvl = cur[2];
			if (tag === 'ul' || tag === 'ol') {
				if (!lists.length || lvl > lists[0][1]) {
					lists.unshift([ tag, lvl ]);
					out += '<'+lists[0][0]+'><li>'+text;
				} else
					if (lists.length > 1 && lvl <= lists[1][1]) {
						out += '</li></'+lists.shift()[0]+'>';
						--i;
					} else
						out += '</li><li>'+text;
			} else {
				while (lists.length)
					out += '</li></'+lists.shift()[0]+'>';
				out += (tag === 'hr') ? '<hr/>' : '<'+tag+lvl+nmd.headAttrs(lvl, text)+'>'+text+'</'+tag+lvl+'>';
			}
		}
		while (lists.length)
			out += '</li></'+lists.shift()[0]+'>';
		return unesc(out);
	});
};

nmd.href = function (ref) {
	return ref;
};

nmd.headAttrs = function (level, text) {
	return ''; // return ' id=\''+text.replace(/[^a-z0-9]/g, '_').replace(/_{2,}/g, '_').replace(/^_*(.*?)_*$/, '$1').toLowerCase()+'\'';
};

return nmd;
}();

util.isHTML = function(str) {  //Udhay - to check if the string can be parsed as html 
  var doc = new DOMParser().parseFromString(str, "text/html");
  return Array.from(doc.body.childNodes).some(node => node.nodeType === 1);
}
