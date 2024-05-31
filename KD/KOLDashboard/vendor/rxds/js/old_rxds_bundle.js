/* RXDS Client version 2.0 */
var rxds = (function (exports) {
  'use strict';

  var ENVIRONMENT = "production";var version = 1;

  var util = {};
  util.data_bind = function(obj) {
    try {
      if (obj.config.data_binding) {
        //let db=obj.config.data_binding.replace('{{vendor}}',(rxds.is_home?"":"../")+"vendor");
        let db=obj.config.data_binding.replaceAll('{{vendor}}',(rxds.is_home?"":"../")+"vendor");   //udhay - to replace all vendor strings
        return JSON.parse(db)
      }  
      else return '{}';
    } catch (e) {console.log(e); return '{}'}  
  };   

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
  };


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
  };   

  util.get_widget_config = function (obj) {
    if (obj.config.widget_id) 
       if (rxds.page_widgets[obj.config.widget_id]) {
           if (obj.config.region_config)
               return rxds.page_widgets[obj.config.widget_id].widget_config + "\n" + obj.config.region_config.trim();
           else
               return rxds.page_widgets[obj.config.widget_id].widget_config;
       }     
              
    if (obj.config.region_config) return obj.config.region_config.trim();
  };

  util.get_plugin_template = function(obj) {
    var tmpl;
    if (rxds.page_widgets[obj.config.widget_id] && rxds.page_widgets[obj.config.widget_id].widget_template) 
        return rxds.page_widgets[obj.config.widget_id].widget_template
    else 
        return obj.config.template
    };
    
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
      }

        
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
            "language": { search: "", emptyTable: "No Data to Display" },
            //"language": { search: "", emptyTable: ((rxds.app.config.language === "JP") ? "この選択に対してデータは返されませんでした": "No Data to Display")},
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
  }; //loadDataTable


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
              $("#insights"+k).find(".ui.header").hide();
        }
       }else{
        $("#modalEdit"+k).hide();
        $("#modalNew"+k).show();
        //$("#annotate"+k).hide();  
        $("#insights"+k).hide();  
      }
      
      util.refresh_modal(k,obj);
    
  };

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
  };

  util.get_annotation_month = function(obj) {
    var mth;
    var parm_name = "ASOF_MONTH";
    var db=util.data_bind(obj);
    
    if (rxds.app.page.config.annotate_field) parm_name = rxds.app.page.config.annotate_field;
    if (db && db.month) parm_name = db.month;
    //if (obj.config.data_binding && obj.config.data_binding.month) parm_name = obj.config.data_binding.month;
    
    try {mth = rxds.m.get_param(parm_name).replaceAll('-','.');} catch(e) {mth="2000.01m";}
    if (mth.length===7) {mth=mth+".01";}
    return mth;
  };

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
  };

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
  };

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
  };

  async function load(k, obj, data, full_data) {
      if (data) {
        await loadDT(k,obj, data, full_data);
      }
  }

  async function refresh(k,obj, data, full_data){
      if (data) {
        await loadDT(k,obj, data, full_data);
      }
  }
  function resize(k, obj) {
    obj.table.columns.adjust().draw();
  }

  function  get_param(p) {
    return rxds.m.get_param(p);
  }

  function export_post(file_type, obj, full_data, params) {
        //Create an hidden form
        //alert( 'Not yet implemented' );
        if(full_data.rowcount === 0 || obj.recordsFiltered===0) {  //to show no data message/popup when there is no data to download
            $(".ui.modal.no-data-message").modal("show");
            return;
        }
        var url, titles;
        if (file_type=="psv") titles=obj.titles.join('|').replace(/<br>/g," ");
        else titles=obj.titles.join(',').replace(/<br>/g," ");
        params.titles= titles;
        
        //params.export_file = obj.config.title.replace(/ /g,"_")+"_"+new Date().toISOString();
        let region_title = obj.config.title;
        let params_in_title = obj.config.title.match(/{{[^}}]+}}/g);
        if(params_in_title) {
            params_in_title.forEach(v => {
                let param_value = rxds.m.get_param(v.replace(/{|}/g,""));
                if(param_value) region_title = region_title.replace(v," " + param_value + " ").replace(/&nbsp;/g,"");
            });
        }
        region_title = $("<span>" + region_title + "</span>").text();
        params.export_file = (rxds.app.page.config.title + "-" + region_title).replace(/ /g,"_");
        
        if (rxds.is_home)  url='download_file';
        else url='../download_file';
          
        var form = $('<form>', {'method': 'POST', 'action': url}).hide();
              
        $.each(params, function (k, v) {
            form.append($('<input>', {'type': 'hidden', 'name': k, 'value': v}));
        });
        
        //Make it part of the document and submit
        $('body').append(form);
        form.submit();
        
        //Clean up
        form.remove();
   }
   
  function export_button(file_type, obj, full_data) {
      var label;
      if (rxds.app.config.language=="JP") {label='フルエクスポート (';}
      else {label='Full Export (';}

       return {
                  text:  label + file_type.toUpperCase() +')',
                  action: function ( e, dt, node, config ) {
                      //alert( 'Not yet implemented' );
                      //rxds.db_path = rxds.is_home ? "db/":"../db/";
                    var params = { cache_id:full_data.disk,query_id:obj.query_id,format:file_type };
                    //if (rxds.app.app.branch == "MASTER" || rxds.app.app.branch == "QA")
                        export_post(file_type, obj, full_data, params);
                    /*else {    
                      if (rxds.is_home)  
                         window.open('download_file?cache_id='+full_data.disk+'&query_id='+
                                obj.query_id+'&format='+file_type);
                      else
                         window.open('../download_file?cache_id='+full_data.disk+'&query_id='+
                                obj.query_id+'&format='+file_type);
                    } 
                    */
                  }
              }
  } //export_button

  function export_button_server(file_type, obj, full_data) {
       var label;
      if (rxds.app.config.language=="JP") {label='フルエクスポート (';}
      else {label='Full Export (';}
      return {
                  text: label + file_type.toUpperCase() +')',
                  action: function ( e, dt, node, config ) {
                      //alert( 'Not yet implemented' );
                   const cache_id=obj.infi_hash?obj.infi_hash: full_data.disk; 
                   const server_filter=obj.infi_hash?1:0; 
                    var params = { cache_id:cache_id,query_id:obj.query_id,server_filter:server_filter,format:file_type};
                    //if (rxds.app.app.branch == "MASTER" || rxds.app.app.branch == "QA")
                         export_post(file_type, obj, full_data, params);
                    /*else {     
                    if (rxds.is_home)  
                        window.open('download_file?cache_id='+cache_id+'&query_id='+
                                obj.query_id+'&server_filter='+server_filter+'&format='+file_type);
                    else
                        window.open('../download_file?cache_id='+cache_id+'&query_id='+
                                obj.query_id+'&server_filter='+server_filter+'&format='+file_type);
                    }   */         
                  }
              };
  }

  function japanese_options$1 () {
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
  async function loadDT(k,obj, data_in, full_data) {
      var data;
      var div = "table#" + $("#"+k).data("id"); 
      
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
      if (typeof data_in.res !== "undefined") data = data_in.res.table;
      if (obj.config.region_transform) {
          var data_binding = {};
          var transform_fn=new Function('data','db', 'rxds', obj.config.region_transform);
          data = transform_fn(data,data_binding, rxds.m.managers["Report"]);        
      }

        var title_arr=[];
        for(var t in data[0]) {
          var title;
          //Is there a config for this column?
          var colSet=rxds.app.report_headers[t];
          if (colSet !== undefined) {
             title=colSet.Label?colSet.Label:t;
             if (colSet.Render==="number"){
                cols.push({"title":title, "data":t, className: "right aligned", render: $.fn.dataTable.render.number(',', '.', 0 ) });
              }else if (colSet.Render==="number2"){
                cols.push({"title":title, "data":t, className: "right aligned", render: $.fn.dataTable.render.number(',', '.', 2 ) });
              }else if (colSet.Render==="percentage"){
                cols.push({"title":title, "data":t, className: "right aligned", render: $.fn.dataTable.render.number(',', '.', 0, '', '%') });
              }else if (colSet.Render==="percentage2"){
                cols.push({"title":title, "data":t, className: "right aligned", render: $.fn.dataTable.render.number(',', '.', 2, '', '%') });
              }else if (colSet.Render==="currency"){
                cols.push({"title":title, "data":t, className: "right aligned", render: $.fn.dataTable.render.number(',', '.', 2, '$') });
              }else if (colSet.Render==="numberplain"){
                cols.push({"title":title, "data":t, className: "right aligned", render: $.fn.dataTable.render.text() });
              }else if (colSet.Render==="text"){
                cols.push({"title":title, "data":t, className: "right aligned", render: $.fn.dataTable.render.text() });
              }else if (colSet.Render==="largenumber"){
                cols.push({"title":title, "data":t, className: "right aligned", render: function (data){return '\u200C'+data} });
              }else{
                cols.push({"title":title, "data":t});
              }
              
          }else{ //No settings for this column
             title = t;
             if ((typeof data[0][t] == "number") && (!/Year|_ID$|Zip|NPI/i.test(t))){
               if(Number.isInteger(data[0][t]))
                  cols.push({"title":title, "data":t, className: "dt-body-right", render: $.fn.dataTable.render.number( ',', '.', 0 ) });
               else
                  cols.push({"title":t, "data":t, className: "dt-body-right", render: (data) => (data ? data.toLocaleString() : data) });
             }
             else{
               cols.push({"title":title, "data":t});
             }
          }
             fils.push({column_number: i,filter_type: "text",filter_delay: 500,filter_reset_button_text:"<i class='times circle icon'></i>"});
             i++;
        }



         var opts = {};
         opts = {
            "data"   : data,
            "columns": cols,
            "language": { search: "", emptyTable: "No Data to Display" },
            "deferRender": false,
            "buttons": true,
            "scrollX": 500,
            "scrollY": 500,
            "scroller": false,
            "scrollCollapse": true,
            "destroy": true,
            "fixedcolumns": true,
  //          "responsive":false,
            "order"  : [],
            "aaSorting": [],
            "pageLength": 10,
            "paging":true,
            "pagingType":"full_numbers",
            "dom":    "<'ui stackable grid dataTables_wrapper no-footer'"+
                              "<'left aligned eight wide column'B>"+
                              "<'right aligned eight wide column'l>"+
                              "<'sixteen wide column'tr>"+
                              "<'left aligned four wide column'i>"+
                              "<'right aligned twelve wide column'p>"+
                      ">"
                     ,"buttons":[]  //"copy","excel"]
         };
         
         if (rxds.app.config.language=="JP") {opts.language=japanese_options$1();}
         
  //      if  (obj.config.export && obj.config.export.match(/ExcelDB/))
  //         opts.buttons=["copy"];
        
        const limitRows =  obj.config.limit_rows?Number(obj.config.limit_rows):1000;
        if ( ((data.length == limitRows) ||   obj.config.export && obj.config.export.match(/CSV/)) 
              && (obj.config.server_filter !== 'Y'))
           opts.buttons.push(export_button('csv', obj, full_data));
        if  (obj.config.export && obj.config.export.match(/PSV/))
           if (obj.config.server_filter !== 'Y')  
               opts.buttons.push(export_button('psv', obj, full_data));
           else     
               opts.buttons.push(export_button_server('psv', obj, full_data));
        if  (obj.config.export && obj.config.export.match(/ExcelDB/))
           opts.buttons.push(export_button_server('xlsx', obj, full_data));
              
        if ((obj.config.server_filter == 'Y') && (!data_in.qerr)) {
           opts.processing = false;
           opts.serverSide = true;
           opts.searchDelay = 350;
           opts.data=[];
           //if (rxds.app.app.name == "AppWiki")
            opts.buttons.push(export_button_server('csv', obj, full_data));
           opts.ajax = function (data, callback, settings) {
              var param = rxds.m.get_parameters(obj.dependent_items, obj.dependent_regions);
              param.datatable_data = data;
              //console.log("Sent to KDB");
              //console.log(param);
              rxds.m.fetchAsync(k, obj, obj.query_id,param,obj.dataset_format).then(
                    function(data){
                      //console.log("Returned from KDB ");
                      //console.log(data);
                      var json = {},d;
                      d=data.result?data.result:data;
                      obj.infi_hash = d.dname;
                      d=d.res?d.res:d;
                      if (typeof d.draw !== "undefined") {
                        json.recordsTotal = d.recordsTotal?d.recordsTotal:d.length;
                        json.recordsFiltered = d.recordsFiltered?d.recordsFiltered:d.length;
                        if (data.draw) d.draw=d.draw;
                        obj.recordsFiltered=d.recordsFiltered;
                        if (d.recordsFiltered===0) {
                          json.data=[];
                        }
                        else {
                        json.data = d.table?d.table:d.res.table;
                        }
                        callback(json);
                       }  
                      else {
                        json.recordsTotal = data.recordsTotal?data.recordsTotal:d.length;
                        json.recordsFiltered = data.recordsFiltered?data.recordsFiltered:d.length;
                        if (data.draw) json.draw=data.draw;
                        json.data = d;
                        callback(json);
                      }
                    }
                );

           };
        } else if (data.length <= opts.pageLength) {
            opts.paging = false;
            opts.dom = `<'ui grid dataTables_wrapper no-footer'
                                <'left aligned eight wide column'B>
                                <'right aligned eight wide column'l>
                                <'sixteen wide column'tr>
                        >`;
       }
       
        var table;
        if (obj.config.region_config) {
          
            try {
            var config_fn=new Function('opts','data', 'rxds', 'div', 'obj', 'rxds_full', obj.config.region_config);
            table = config_fn(opts, data, rxds.m.managers["Report"], div, obj, rxds);
            title_arr = opts.columns.map(v=>v.title);
            if (!obj.config.region_config.match(/.DataTable/))
                 table = $(div).DataTable(opts);
            } catch (e) {
               console.log("Error setting configuration " + obj.config.title); console.log(e);
               table = $(div).DataTable(opts);
           }
        }
        else {
          title_arr = opts.columns.map(v=>v.title);
          table = $(div).DataTable(opts);
        }  
        obj.table=table;
        obj.titles=title_arr; 

  //Create buttons to the top left of the DT

     if (opts.buttons) {

       table.buttons().container()
              .appendTo( $('div.eight.wide.column:eq(0)', table.table().container()) );
     }
     if (fils.length>0 && obj.config.column_filter == 'Y') {   
         yadcf.init(table,fils);
         if (obj.config.server_filter !== 'Y') table.columns.adjust().draw();
     }
  } //loadDataTable

  var h1 = /*#__PURE__*/Object.freeze({
    load: load,
    refresh: refresh,
    resize: resize,
    get_param: get_param,
    loadDT: loadDT
  });

  var vendor;

  async function load$1(k, obj, data, full_data) {
      var chart, theme, first_load;
      vendor = rxds.vendor;
      G2.track ( false );
      first_load = false;

      theme=rxds.app.config.g2_theme?rxds.app.config.g2_theme:'default';
      
      G2.Global.setTheme(theme);
      
      if (!obj.chart) {
         $("#g2"+k)[0].innerHTML="<div></div>";
         chart = new G2.Chart({
          container: "g2" + k,
          forceFit : true ,
          height: Number(obj.config.height)*window.innerHeight/100 ,
          padding : [ 20 , 20 , 95 , 80 ]
        });
        obj.chart = chart;
        first_load = true;
      } else {
          chart = obj.chart;
          chart.clear();
      }
      if (!obj.filters) obj.filters = [];

      var data_binding = util.data_bind(obj);
      var chart_data=util.data_transform(obj, data, data_binding, this);
      var widget_config=util.get_widget_config(obj);

      if (!widget_config) {
        console.log("No configuration for this widget " + obj.config.title); return;
      }
      if (!widget_config.match(/chart.source/))
           chart.source(chart_data);
      var config_fn=new Function('chart','data','db','rxds', 'obj', widget_config);
      config_fn(chart,chart_data,data_binding, this, obj);

      chart.render();
      // if  empty
      if (data.length <= 0) {
          $("#g2"+k)[0].innerHTML="<div class='ui center aligned segment'>No Data to Display</div>";
          obj.chart = null;
      }

    //code to add download btn for G2 charts. This code takes a snapshot of the chart and starts the download.
    if (first_load && data.length) {
        //$("#g2" + k).prepend('<a style="position: relative;float: right;margin-right: 10px;z-index: 1;" class="g2-download-icon" href="javascript:void();"><i class="download icon"></i></a>');
        $("#g2" + k).prepend('<a style="position: relative;float: right;margin-right: 10px;z-index: 1;" class="g2-download-icon"><i class="download icon"></i></a>');
        $("#g2" + k +' .g2-download-icon').on('click', function(){
           //this.href= $("#g2" + k +' canvas')[0].toDataURL();
           //this.download = "download.png";
  	      //rxds.page_controls[k].chart.downloadImage();
  		this.href = "javascript:void(0);"; //reset image dataurl
  		let isDarkMode = (localStorage.getItem('mode') == 'dark')? true : false; //set dark/light mode status

  		let canvas = rxds.page_controls[k].chart._attrs.canvas._cfg.canvasDOM;
  		let context = canvas.getContext('2d');
  		let w = canvas.width;
  		let h = canvas.height;
  		let data;
  		data = context.getImageData(0, 0, w, h);
  		var compositeOperation = context.globalCompositeOperation;
  		context.globalCompositeOperation = "destination-over";
  		if(!isDarkMode){
  		  context.fillStyle = 'rgb(255, 255, 255)'; //set white bg 
  		}
  		else{
  		  context.fillStyle = 'rgb(36, 36, 36)'; //set dark bg            
  		}
  		context.fillRect(0,0,w,h);
  		this.href= $("#g2" + k +' canvas')[0].toDataURL(); //set href imagedataurl
  		var downloadName = $(this).parents(".ui.segments.raised").find(".item-header h5 span").text().trim();
  		this.download = downloadName+".png"; //download image
  		context.clearRect (0,0,w,h); //reset bg
  		context.putImageData(data, 0,0); //put original image back 
  		context.globalCompositeOperation = compositeOperation; 
        });
        //end
        
        //code to add a tooltip on the above created download btn. Tooltip gets created on mouseover and destroyed on mouseout.
        $("#g2" + k +' .g2-download-icon').on('mouseenter', function(e){
            var top = ($(this).position().top + 25) + 'px';
            var left = ($(this).position().left - 25) + 'px';
            $("#g2" + k).append('<span class="g2-download-tooltip" style="text-align: center;font-size: 12px;color: #0099dc;position:absolute;top:'+top+';left:'+left+'">Download\nImage</span>');
        });
        $("#g2" + k +' .g2-download-icon').on('mouseleave', function(){
           $('.g2-download-tooltip').remove();
        });
        //end

    }    
      if(obj.config.flip_report == "Y")  util.toggleDT(k,obj, data, full_data);
      
        
      if(obj.config.annotate == "Y") util.load_annotation_modal(k,obj);
           

  }

  function get(k,obj) {
     if (obj.filters) 
         return obj.filters.join('|');  
     else 
         return '';
  }

  function set(k,obj,v) {
     obj.filters=v.split(/\|/);
  }


  async function refresh$1(k,obj, data){
    var tabid = "table#" + $("#"+k).data("id");     
             console.log("Refresh DT",data);
   //       loadDataTable(tabid,data);
             console.log('Need to load report ' + k);
  }

  async function repaint(k,obj, data){
       obj.chart.render();
  }

  function reset_filter(k,obj) {
      $("#click"+k).hide();
      repaint(k,obj);
      rxds.load_children(obj.child_regions); 
  }

  function toggleSelection(source,obj,db,chart,data) {
    var group = source.data._origin[db.x_axis];
    if (obj.filters.indexOf(group) === -1)
      obj.filters.push(group);
    else 
      obj.filters.splice(obj.filters.indexOf(group),1);
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



  function registerPoint() {
    const Shape = G2.Shape;
    // 自定义Shape 部分
    Shape.registerShape('point', 'pointer', {
      drawShape(cfg, group) {
        let point = cfg.points[0]; // 获取第一个标记点
        point = this.parsePoint(point);
        const center = this.parsePoint({ // 获取极坐标系下画布中心点
          x: 0,
          y: 0
        });
        // 绘制指针
        group.addShape('line', {
          attrs:  {
            x1: center.x,
            y1: center.y,
            x2: point.x,
            y2: point.y + 15,
            stroke: '#8c8c8c',
            lineWidth: 5,
            lineCap: 'round'
          }
        });
        return group.addShape('circle', {
          attrs: {
            x: center.x,
            y: center.y,
            r: 9.75,
            stroke: '#8c8c8c',
            lineWidth: 4.5,
            fill: '#fff'
          }
        });
      }
    });
  } //registerPoint

  function register_boundary() {
    const Shape = G2.Shape;
    const Util = G2.Util;
    Shape.registerShape('polygon', 'boundary-polygon', {
      draw(cfg, container) {
        if (!Util.isEmpty(cfg.points)) {
          const attrs = {
            stroke: '#fff',
            lineWidth: 1,
            fill: cfg.color,
            fillOpacity: cfg.opacity
          };
          const points = cfg.points;
          const path = [
            [ 'M', points[0].x, points[0].y ],
            [ 'L', points[1].x, points[1].y ],
            [ 'L', points[2].x, points[2].y ],
            [ 'L', points[3].x, points[3].y ],
            [ 'Z' ]
          ];
          attrs.path = this.parsePath(path);
          const polygon = container.addShape('path', {
            attrs
          });
          if (cfg.origin._origin.last_week_flag) {
            const linePath = [
              [ 'M', points[2].x, points[2].y ],
              [ 'L', points[3].x, points[3].y ],
            ];
            // 最后一周的多边形添加右侧边框
            container.addShape('path', {
              zIndex: 1,
              attrs: {
                path: this.parsePath(linePath),
                lineWidth: 1,
                stroke: '#404040'
              }
            });
            if (cfg.origin._origin.last_day_flag) {
              container.addShape('path', {
                zIndex: 1,
                attrs: {
                  path: this.parsePath([
                    [ 'M', points[1].x, points[1].y ],
                    [ 'L', points[2].x, points[2].y ],
                  ]),
                  lineWidth: 1,
                  stroke: '#404040'
                }
              });
            }
          }
          container.sort();
          return polygon;
        }
      }
    });
  }

  var h2 = /*#__PURE__*/Object.freeze({
    get vendor () { return vendor; },
    load: load$1,
    get: get,
    set: set,
    refresh: refresh$1,
    repaint: repaint,
    reset_filter: reset_filter,
    toggleSelection: toggleSelection,
    registerPoint: registerPoint,
    register_boundary: register_boundary
  });

  var vendor$1;
  async function load$2(k, obj, data, full_data) {
          var elem = "#"+k;
          var pconfig = obj.config;
          var legend = [];
          var config,theme;
          vendor$1=rxds.vendor;
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
            opt.mode = "vega";
         }
         obj.options = vlSpec;


         obj.vega = await vegaEmbed(elem, vlSpec, opt);
         vegaTooltip.vega(obj.vega.view, tooltip);

       
        if (obj.config.parameter_id) {
            if (!obj.filters) obj.filters = [];
            obj.vega.view.addSignalListener('clicked', (sig, sel) => {toggleVega(sel,obj);});
        }

  }

  function get$1(k,obj) {
     if (obj.filters) 
         return obj.filters.join('|');  
     else 
         return '';
  }

  function reset_filter$1(k,obj) {
      $("#click"+k).hide();
      //repaint(k,obj);
      rxds.load_children(obj.child_regions); 
  }


  function toggleVega(selected,obj) {
    if (!selected) return;
    const sel = (selected)?selected.value:"";
    if (obj.filters.indexOf(sel) === -1)
      obj.filters.push(sel);
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

  var h3 = /*#__PURE__*/Object.freeze({
    get vendor () { return vendor$1; },
    load: load$2,
    get: get$1,
    reset_filter: reset_filter$1,
    toggleVega: toggleVega
  });

  async function load$3(k, obj, data, full_data) {
        var db = {}, chart_data, config, theme;
        var pconfig = obj.config;
        db=util.data_bind(obj);
        theme=rxds.app.config.echart_theme?rxds.app.config.echart_theme:'macarons';
        config = {};
        chart_data = (data.chartdata === undefined)?data:data.chartdata;

        var chart_data=util.data_transform(obj, chart_data, db, this);

        if (!obj.filters) {obj.filters = [];}
        if (!obj.secondary_filters) {obj.secondary_filters = [];}

        if (!db.theme) db.theme = theme;

        $("#echart"+k).height(Number(obj.config.height)*window.innerHeight/100);
        if (obj.chart) obj.chart.dispose();
        

        var myChart = echarts.init(document.getElementById("echart"+k),db.theme);
        obj.chart = myChart;
        obj.dom=document.getElementById("echart"+k);
        var widget_config=util.get_widget_config(obj);
        if (!widget_config) {
          console.log("No configuration for this widget " + obj.config.title); return;
        }
        

      if (Array.isArray(db.resource_url)) {
        db.resource = []; 
        for (var i=0;i<db.resource_url.length;i++) {
          let res = await fetch(resource_url[i]).then(response => response.text());
          db.resource.push(res);
        }
      }else if (typeof db.resource_url  == "string") {
          db.resource = await fetch(db.resource_url).then(response => response.text());
      }
      var config_fn=new Function('data','db','rxds','obj','config','chart', widget_config);
      try {
      config_fn(chart_data,db, this, obj, config,myChart);
      } catch(e) {
        console.log("Error with Config script in chart " + obj.config.title);
        console.log(e);
      }
      obj.options = config;

      if (!widget_config.match(/chart.setOption/)) {
          if (config.height) {$("#echart"+k).height(config.height);myChart.resize();}

          try {myChart.setOption(config);}
          catch(e) {console.log("Error loading chart" + k); console.log(e);console.log(obj);console.log(config);}
          myChart.hideLoading();
          myChart.resize();
       }
        $(window).resize(function() {
          obj.chart.resize();
        });
      
      myChart.on('legendselectchanged', function (params) {
          obj.selectedLegend = params.selected;
          obj.chart.resize();
      });

       if (config.events) { /* Hook up events if specified */
          const e=Object.keys(config.events);
          e.forEach(v=>{
            myChart.on(v,config.events[v]);
          });  
          myChart.on('rendered',function(){
             if (obj.highlight) {
              var d=obj.options.series[0].data;
              //udhay - updated this section to support secondary filters highlighting support
              var highlight_filters = (obj.highlight_secondary_filters ? "secondary_filters" : "filters");
              obj[highlight_filters].forEach(v=>{
                 var i =d.findIndex(s=>s.name==v);
                 if (i>=0)
                   obj.chart.dispatchAction({
                    type: 'highlight',
                    seriesIndex: 0,
                    dataIndex: i
                });
              });
            }
          });
       }


       if (db.chart_type && db.chart_type.match(/dataset/)){
            myChart.on('updateAxisPointer', function (event) {
              var xAxisInfo = event.axesInfo[0];
              if (xAxisInfo) {
                  var dimension = xAxisInfo.value + 1;
                  myChart.setOption({
                      series: {
                          id: 'pie',
                          label: {
                              formatter: '{b}: {@[' + dimension + ']} ({d}%)'
                          },
                          encode: {
                              value: dimension,
                              tooltip: dimension
                          }
                      }
                  });
              }
          });
      }
      
        // if  empty
        if (data.length <= 0) {
            var no_data_mes = ((rxds.app.config.language === "JP") ? "この選択に対してデータは返されませんでした" : "No Data to Display");
            console.log("no_data_mes",no_data_mes);
            //$("#echart"+k)[0].innerHTML="<div class='ui center aligned segment'>No Data to Display</div>";
            $("#echart"+k)[0].innerHTML="<div class='ui center aligned segment'>" + no_data_mes + "</div>";
        }
      
        //if the flip report is set to Y
        
        if(pconfig.flip_report == "Y") {
             util.toggleDT(k,obj, data, full_data);
          } 
          
        if(pconfig.annotate == "Y") {
             util.load_annotation_modal(k,obj);
          } 
    

  } // load


  function get$2(k,obj) {
     if (obj.filters) 
         return obj.filters.join('|');  
     else 
         return '';
  }

  function reset_filter$2(k,obj) {
      $("#click"+k).hide();
      obj.chart.resize();
      rxds.load_children(obj.child_regions); 
  }

  function get_param$1(p) {
    return rxds.m.get_param(p);
  }

  function toggleSelection$1(group,obj,db,data,highlight,param) {
    var highlight_type;
    //udhay - updated this section to support secondary filters highlighting support
    var is_there_sec_filter = (param && param.secondary_filters);
    if (obj.filters.indexOf(group) === -1) {
      obj.filters.push(group); 
      if(is_there_sec_filter)  obj.secondary_filters.push(param.name);
    } else { 
      obj.filters.splice(obj.filters.indexOf(group),1);
      if(is_there_sec_filter)   obj.secondary_filters.splice(obj.secondary_filters.indexOf(param.name),1);
    }
    
    if (obj.filters.length > 0) {
      const r=obj.region.region_id;
      $("#selectregion"+r).html(obj.filters.join());
      $("#clickregion"+r).show();
    }
    else {
      const r=obj.region.region_id;
      $("#clickregion"+r).hide();
    }
    
    if (highlight) obj.highlight=true;
    if(is_there_sec_filter)   obj.highlight_secondary_filters= true;
    console.log(obj.filters);
    const opt=obj.chart.getOption();
    obj.chart.clear();
    obj.chart.setOption(opt);
    rxds.load_children(obj.child_regions); 
    //setTimeout(function(){console.log(obj.filters);obj.chart.resize();console.log(obj.chart)}, 3000);
  }


  function getSeries(data,db,chart_type){
    var s={}, lo={}, la=[], l={},min,max;
    if (Array.isArray(db.y_axis)) {
      const empty_y=db.y_axis.map(s=>0);
      data.forEach((v)=> {
          var series=db.series?v[db.series]:"series";
          const x=v[db.x_axis];
          const y=db.y_axis.map(s=>v[s]);
          if (!s[series]) {s[series]={};}
          if (!l[x]) {l[x]=true;la.push(x);}
          s[series][x]=y;
      });
      var legend=Object.keys(s);
      var series;
        series=legend.map((v)=>{
            return {name:v,type:chart_type,data:
           la.map((l)=>{return s[v][l]?s[v][l]:empty_y})}});
       return {legend:legend,series:series,categories:la}
    } else if (Array.isArray(db.series)) {
        var series=[];
        db.series.forEach((v,i)=> {
            s={name:v,type:chart_type};
            if (db[v]) $.extend(s,db[v]);
            s.data=data.map(d=>d[v]);
            s.min = Math.min( ...s.data );
            s.max = Math.max( ...s.data );
            if (!l.min) {l.min=s.min;l.max=s.max;}
            if(l.min>s.min) l.min=s.min;
            if(l.max<s.min) l.max=s.max;
            series.push(s);
          }); 
      var categories=data.map(d=>d[db.x_axis]);    
      var legend=series.map(v=>v.name);
      return {legend:legend,series:series,categories:categories,limits:l}
    }
    else {
      data.forEach((v)=> {
          const series=db.series?v[db.series]:"series";
          const x=v[db.x_axis],y=v[db.y_axis];
          if (!s[series]) {s[series]={min:y,max:y};}
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
      if (chart_type=="radar") {
          series=legend.map((v)=>{return {name:v,min:s[v].min,max:s[v].max,value:
             la.map((l)=>{return s[v][l]?s[v][l]:0})}});
         return {legend:legend,series:series,categories:la,
                 limits:la.map(v=>{return {"name":v,"max":l[v].max}})}
      }       
      else {
          series=legend.map((v)=>{
              if (s[v].max>max) max=s[v].max;
              if (s[v].min<max) min=s[v].min;
              return {name:v,type:chart_type,min:s[v].min,max:s[v].max,data:
             la.map((l)=>{return s[v][l]?s[v][l]:0})}});
         return {legend:legend,series:series,categories:la,limits:l,min:min,max:max}
      }
    }
  }

  var h4 = /*#__PURE__*/Object.freeze({
    load: load$3,
    get: get$2,
    reset_filter: reset_filter$2,
    get_param: get_param$1,
    toggleSelection: toggleSelection$1,
    getSeries: getSeries
  });

  async function load$4(k, obj, data, full_data) {
      if (data) {
        await loadPlugin(k,obj, data, full_data);
      }
  }

  async function refresh$2(k,obj, data, full_data){
      if (data) {
        await loadPlugin(k,obj, data, full_data);
      }
  }
  function rx() {
    return rxds;
  } 

  async function loadPlugin(k,obj, data_in, full_data) {
    
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


  function get$3(k,obj) {
     if (obj.get) 
         return obj.get();  
     else 
         return '';
  }

  function set$1(k,obj,v) {
     if (obj.set) 
         return obj.set(v);  
     else 
         return '';
  }

  var h5 = /*#__PURE__*/Object.freeze({
    load: load$4,
    refresh: refresh$2,
    rx: rx,
    loadPlugin: loadPlugin,
    get: get$3,
    set: set$1
  });

  async function load$5(k, obj, data, full_data) {
      if (data) {
        await loadPiv(k,obj, data, full_data);
      }
  }

  async function refresh$3(k,obj, data, full_data){
      if (data) {
        await loadPiv(k,obj, data, full_data);
      }
  }

  async function loadPiv(k,obj, data_in, full_data) {
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

  var h6 = /*#__PURE__*/Object.freeze({
    load: load$5,
    refresh: refresh$3,
    loadPiv: loadPiv
  });

  async function load$6(k, obj, data, full_data,param) {
      if (data) {
        await loadPiv$1(k,obj, data, full_data,param);
      }
  }

  async function refresh$4(k,obj, data, full_data,param){
      if (data) {
        await loadPiv$1(k,obj, data, full_data,param);
      }
  }

  function get$4(k,obj) {
            return obj.h_pivot;
      }


  async function get_col_histogram(k,obj,col,typeDesc,target) {
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
               runPivot$1(k, obj);
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
          
     };

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

  async function loadPiv$1(k,obj, data_in, full_data,param) {
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
                   runPivot$1(k, obj,evt);
                  return true;   
                }); 
           } // mounting
           $('.ui.dropdown.bintype').dropdown({
              action: 'activate',
              onChange: function(value, text, $selectedItem) {
                obj.col_bins[this.dataset.id] = value;
                runPivot$1(k, obj);
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
                runPivot$1(k, obj);
              }
            });

      }; //init_dropdown

      
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
          runPivot$1(k, obj);
        else   
          loadPivDT(k,obj,{},data);
        
      }
  } //loadPiv

  function japanese_options$2 () {
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
  function runPivot$1(k, obj,evt) {
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
            "language": { search: "", emptyTable: "No Data to Display" },
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

          if (rxds.app.config.language=="JP") {opts.language=japanese_options$2();}
       const tab_options=["Table_heatmap","Table_row_heatmap","Table_col_heatmap"];
        if (param.h_pivot && src_data.result.max_vals && tab_options.indexOf(param.h_pivot.table_type)>-1) {
           var num_cols = Object.keys(src_data.result.max_vals[0]).filter(v=>v!=="ZZZMAX");
           const max_val=src_data.result.max_vals[0].ZZZMAX;
           var cellFunc;
           if ((param.h_pivot.table_type == "Table_heatmap")||(num_cols<=1))
              cellFunc = function (td, cellData, rowData, row, col) {
                      $(td).css('background', 'rgba(0, 0, 255, '+ cellData*.4/max_val+')');
                  };
          else if (param.h_pivot.table_type == "Table_row_heatmap")
                 cellFunc = function (td, cellData, rowData, row, col) {
                      if (!rowData) return;
                      var max= rowData[num_cols[0]];
                      num_cols.forEach(v=>{if (max<rowData[v]) max=rowData[v];});
                      $(td).css('background', 'rgba(0, 0, 255, '+ cellData*.4/max+')');
                  };
          else if (param.h_pivot.table_type == "Table_col_heatmap")
                 cellFunc = function (td, cellData, rowData, row, col) {
                      var col_name=Object.keys(rowData)[col];
                      var max=src_data.result.max_vals[0][col_name];
                      $(td).css('background', 'rgba(0, 0, 255, '+ cellData*.4/max+')');
                  };
                  
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
        var config = {};

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
    
    
    data= getSeries$1(data,{x_axis:"group_by",y_axis:"metric",series:"piv_by",stacked:stacked},chart_type);
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

  function getSeries$1(data,db,chart_type) {
    var s={}, lo={}, la=[], l={},min,max;
      data.forEach((v)=> {
          const series=db.series?v[db.series]:"series";
          const x=v[db.x_axis],y=v[db.y_axis];
          if (!s[series]) {s[series]={min:y,max:y};}
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

  var h7 = /*#__PURE__*/Object.freeze({
    load: load$6,
    refresh: refresh$4,
    get: get$4,
    get_col_histogram: get_col_histogram,
    loadPiv: loadPiv$1,
    getSeries: getSeries$1
  });

  async function load$7(k, obj, data, full_data) {
      if (data) {
        await loadPiv$2(k,obj, data, full_data);
      }
  }

  async function refresh$5(k,obj, data, full_data){
      if (data) {
        await loadPiv$2(k,obj, data, full_data);
      }
  }


  async function get_col_histogram$1(k,obj,col) {
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

  async function loadPiv$2(k,obj, data_in, full_data) {
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
                    get_col_histogram$1(k,obj,col).then();
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
                  val=val*100;
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
  if (!chart.click_handler) chart.on("interval:click", (s) => {toggleSelection$2(s,k,obj,chart,db);chart.repaint();});
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
      
    if (!chart.click_handler) chart.on("interval:click", (s) => {toggleSelection$2(s,k,obj,chart,db);chart.repaint();});
    chart.click_handler = true;
    chart.col=col;
  }
  function toggleSelection$2(source,k,obj,chart,db) {
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

  var h8 = /*#__PURE__*/Object.freeze({
    load: load$7,
    refresh: refresh$5,
    get_col_histogram: get_col_histogram$1,
    loadPiv: loadPiv$2,
    toggleSelection: toggleSelection$2
  });

  var vendor$2;

  async function load$8(k, obj, data) {
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

  function get$5(k,obj) {
      let filters = "";
      if (obj.filters && obj.secondary_filters) {
        filters = [obj.filters.join('|'), obj.secondary_filters.join()];
        filters = filters.filter(v => v).join("|");
      }
      return filters;
  }

  function set1(k,obj,v) {
     obj.filters=v.split(/\|/);
  }


  async function refresh$6(k,obj, data){
      let h = rxds.m.managers[obj.control_type];
      
      if (data && data.result) /* If we got data */
         await h.load(k, obj, data.result);
      else  await h.load(k, obj, data);
  //  var tabid = "table#" + $("#"+k).data("id");     
  //           console.log("Refresh DT",data);
   //       loadDataTable(tabid,data);
  //           console.log('Need to load report ' + k);
  }

  async function repaint$1(k,obj, data){
  //     obj.chart.render();
      //if(obj.map)   
  }

  function reset_filter$3(k,obj,reset_type) {
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

  function get_param$2(p) {
    return rxds.m.get_param(p);
  }

  function toggleSelection$3(group,obj,db,data,highlight,param) {
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
                obj.secondary_filters_all.push(String(group));
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

  function toggleSelection1(group,obj,db,data,highlight,param) {
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

  var h9 = /*#__PURE__*/Object.freeze({
    vendor: vendor$2,
    load: load$8,
    get: get$5,
    set1: set1,
    refresh: refresh$6,
    repaint: repaint$1,
    reset_filter: reset_filter$3,
    get_param: get_param$2,
    toggleSelection: toggleSelection$3,
    toggleSelection1: toggleSelection1
  });

  async function load$9(k, obj, data) {

    var data = await util.load_annotation(k, obj);

  //hide and show New or Edit option    

      if (Array.isArray(data) && data.length) {
        data = data[0];
        
        $("#modalNew"+k).hide();
        $("#modalEdit"+k).show();
        if (!obj.annotateVue)
           obj.annotateVue = new Vue({
                el: "#insights"+k,
                data: {data:data}
             });
        else
            obj.annotateVue.data=data;
            $("#insights"+k).show();
        if(data.headline === "Enter the headline here") {
              $("#insights"+k).find(".ui.header").hide();
        }
      }else{
        $("#modalEdit"+k).hide();
        $("#modalNew"+k).show();
        $("#insights"+k).hide(); 
      }
      
      refresh_modal(k,obj);
  } // load

  async function refresh_modal(k,obj){
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
          
          //Udhay - hide annotate header section if Region Header is set to "hidden"
          if(obj.config.title_bg === "hidden")   $('.ui.fullscreen.modal .field.annotate-header').hide();
          else    $('.ui.fullscreen.modal .field.annotate-header').show();
          
          $('.ui.fullscreen.modal')
            .modal('show')
          ;  
        }
      });

  }

  function get$6(k,obj) {
     if (obj.filters) 
         return obj.filters.join('|');  
     else 
         return '';
  }

  function reset_filter$4(k,obj) {
      $("#click"+k).hide();
      obj.chart.resize();
      rxds.load_children(obj.child_regions); 
  }

  function  get_param$3(p) {
    return rxds.m.get_param(p);
  }

  function get_nmd(mkd) {
    return rxds.m.util.nmd(mkd);
  }

  var h10 = /*#__PURE__*/Object.freeze({
    load: load$9,
    refresh_modal: refresh_modal,
    get: get$6,
    reset_filter: reset_filter$4,
    get_param: get_param$3,
    get_nmd: get_nmd
  });

  var leftscroll=0;
  var displayedVirtualColId=[];
  var agDataSet="";

  async function load$a(k, obj, data, full_data) {
      if (data) {
        await loadAG(k,obj, data, full_data); 
      }
  }

  async function refresh$7(k,obj, data, full_data){
      if (data) {
        await loadAG(k,obj, data, full_data);
      }
  }
  function resize$1(k, obj) {
    obj.table.columns.adjust().draw();
  }

  function  get_param$4(p) {
    return rxds.m.get_param(p);
  }

  function get$7(k,obj) {
      if ( (rxds.m.get_param("TABLE_NAME") == obj.TABLE_NAME) && (rxds.m.get_param("DATA_VIEW") == obj.DATA_VIEW) )
          return obj.ag_state;
  }


  // create ServerSideDatasource with a reference to your server
  function ServerSideDatasource(k, obj) {
      this.k = k;
      this.obj= obj;
  }

  ServerSideDatasource.prototype.getRows = function(params) {
      // invoke your server with request params supplied by grid
              var obj=this.obj,result={"data":[],lastRow:0};
              const ds=this;
              var param = rxds.m.get_parameters(obj.dependent_items, obj.dependent_regions);
              var pivot_cols = obj.opts.columnApi.getPivotColumns().map(v=>v.colId);
              var last_result = rxds.m.query_tracker[obj.query_id];
              var last_table_meta;
              param.aggrid_data = params.request;
              param.aggrid_data.calc_cols = obj.calc_cols;
              param.aggrid_data.pivot_cols_map = obj.pivot_cols_map;  //Udhay - to fix the pivot and group issue
              param.aggrid_data.pivot_cols_def = obj.pivot_cols_def;
              if (obj.last_meta && obj.opts.columnApi.isPivotMode() && pivot_cols && obj.last_pivot_cols && (pivot_cols.toString() == obj.last_pivot_cols.toString())) {
                  param.aggrid_data.last_meta = obj.last_meta;
                  param.aggrid_data.last_newct = obj.last_newct;
              }          
              if(last_result && last_result.data && last_result.data.result && last_result.data.result.res && last_result.data.result.res.meta) {
                    last_table_meta = last_result.data.result.res.meta;
              }
              param.aggrid_data.last_table_meta = last_table_meta;
              
              //Udhay - Adding appropriate values to the blank filters
              let filter_model = param.aggrid_data.filterModel;
              Object.keys(filter_model).forEach(v => {
                let blank_val = "";
                let blank_type = "equals";
                if(filter_model[v].filterType.match(/number|date/))   blank_val = '0n';
                else if(filter_model[v].filterType.match(/text/))   blank_val = "blanks";
              
                if(filter_model[v].type == "blanks") {
                    filter_model[v].type = blank_type;
                    filter_model[v].filter = blank_val;
                } else if(filter_model[v].operator) {
                    let conditions = Object.keys(filter_model[v])
                        .filter(v1 => v1.match(/condition/) && ( filter_model[v][v1].type == "blanks" ));
                    conditions.forEach(v1 => { 
                      filter_model[v].type = blank_type;
                      filter_model[v][v1].filter = blank_val;
                    });
                }
              });
              
              console.log("Sent to KDB");
              console.log(param);


             const ag_state = {"col_state":obj.opts.columnApi.getColumnState(), 
                      "filter_state": obj.opts.api.getFilterModel(),
                      "sort_state": obj.opts.api.getSortModel(),
                      "calc_cols": obj.calc_cols,
                      "pivot_cols":pivot_cols,
                      "pivot_mode":obj.opts.columnApi.isPivotMode(),
                      "pivot_cols_map": obj.pivot_cols_map,   //Udhay - to fix the pivot and group issue
                      "pivot_cols_def": obj.pivot_cols_def
             };
              if (obj.ag_state) {
                 if (JSON.stringify(ag_state) !== JSON.stringify(obj.ag_state)) {
                   obj.ag_state = ag_state;
                   rxds.m.postPageView();
                 }
              } else {
                obj.ag_state =ag_state;
              }
              rxds.m.fetchAsync(this.k,obj, obj.query_id,
                    param,obj.dataset_format).then(
                    function(data){
                      console.log("Returned from KDB ");
                      console.log(data);
                      var json = {},d;
                      if (data.qerr) {
                        console.log(data.qerr);
                        //Udhay - to show show empty table when there is an error from the kdb
                        result.data = [];
                        //result.data=obj.data;
                        result.lastRow=obj.data.length;
                      } else {
                        d=data.result?data.result:data;
                        obj.infi_hash = d.dname;
                        result.lastRow=d.res?(d.res.LastRow?d.res.LastRow:1):1;
                        result.data=d.res?(d.res.table?d.res.table:d):d;
                        result.newct=d.newct;
                        if (obj.opts.columnApi.getValueColumns().length == 0) {
                           delete obj.last_meta;
                        }
                        if (obj.opts.columnApi.getValueColumns().length>0) {
                           obj.last_meta=d.res.meta;
                           obj.last_newct=d.newct;
                           obj.last_pivot_cols = pivot_cols;
                        }
                      
                        if(d.res && d.res.jsond && d.res.jsond.aggrid_data.groupKeys 
                               && d.res.jsond.aggrid_data.groupKeys.length === 0) {
                          let pivot_cols_keys = Object.keys(result.newct).filter(v => v.match("CPIV"));
                          //Udhay - to fix the pivot and group issue
  	                      pivot_cols_keys.forEach(v => obj.pivot_cols_map[v] = result.newct[v]);
                        }
                        console.log("Pivot column Mapping: ", obj.pivot_cols_map);
                        //result.secondaryColDefs=d.res?(d.res.pivheader_data?d.res.pivheader_data:null):null;
                      }
                      
                      if(result.data.length<=0)
                        result.lastRow=0;
                      
                      params.successCallback(result.data, result.lastRow);
                      //updateSecondaryColumns(obj, params.request, result);
                     //if (result.secondaryColDefs && result.secondaryColDefs !== "NA")
                     //if(result.data.length<=0)
                        ds.setSecondaryColsIntoGrid(result.data[0], result.newct);
                        
                        if(rxds.app.config.theme!="alnylam")
                            autoSizeAll(obj.opts, false);
                            
                    }
                );
      
  };
  // we only set the secondary cols if they have changed since the last time. otherwise
  // the cols would reset every time data comes back from the server (which means col
  // width, positioning etc would be lost every time we eg expand a group, or load another
  // block by scrolling down).
  ServerSideDatasource.prototype.setSecondaryColsIntoGrid = function (row1, col_map) {
      const obj=this.obj;
      const secondaryColDefs=this.fixCols(obj,row1,col_map);
      
      var colDefHash = this.createColsHash(secondaryColDefs);
      console.log(secondaryColDefs);
      if (this.colDefHash !== colDefHash) {
          obj.opts.columnApi.setSecondaryColumns(secondaryColDefs);
          //this.gridOptions.columnApi.setSecondaryColumns(secondaryColDefs);
          this.colDefHash = colDefHash;
      }
  };

  ServerSideDatasource.prototype.fixCols = function(obj,row1,col_map) {
          //var row1=temp1.result.res.table[0]
           console.log( "row",row1);
            console.log( "cols",col_map);
          var cols=row1?Object.keys(row1).filter(v=>{return col_map[v].match(/\|/)}):0;
          var col_headers=col_map;
          console.log("col_header",col_headers);
          
          var s=[],s1={};
          obj.seccol=[];
        if(col_map){
          cols.forEach(w=>{
              const v=col_map[w];
              obj.seccol.push(v.replace(/\|/,'/'));
              var i=0,c="",pc,p=v.split(/\|/);
              const l=p.length;
              for(;i<l;i++) {
                  var o;
                  pc=c;
                  if (i>0) c=c+"|"+p[i]; else c=p[i];
                  if((i+1)<l)
                      o={"headerName":p[i],"children":[], "groupID":c};
                  else {
                    //o={"headerName":p[i],"field":w, "colId":c};
                    //Udhay - to fix the chart legend issue in pivot mode (testing)s
                    o={"headerName":p[i],"field":w, "colId":c, "pivotKeys":[pc]};
                  } 
                  
                  if (!s1[c]) {
                      s1[c]=o;
                      if(i==0) {
                          if(!s[c]) s.push(o);
                      } else {
                          s1[pc].children.push(o);
                      }
                  }    
              }
          });
        }

  return s;
  };

  ServerSideDatasource.prototype.createColsHash = function (colDefs) {
      if (!colDefs) {
          return null;
      }
      var parts = [];
      var that = this;
      colDefs.forEach(function (colDef) {
          if (typeof colDef.children == "object" && colDef.children.colId) {
            const c=colDef.children;
            colDef.children=[{"colId":c.colId[0],"headerName":c.headerName[0],"field":c.field[0]}];
          }
          if (colDef.children) {
              parts.push(colDef.groupId);
              parts.push('[' + that.createColsHash(colDef.children) + ']');
          } else {
              parts.push(colDef.colId);
              // headerName can change if the aggFunc was changed in a value col. if we didn't
              // do this, then the grid would not pick up on new header names as we move from
              // eg min to max.
              if (colDef.headerName) {
                  parts.push(colDef.headerName);
              }
          }
      });
      return parts.join(',');
  };




  function numberCellFormatter(params) {
    let formattedNumber = Math.floor(Math.abs(params.value)).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    return params.value < 0 ? '(' + formattedNumber + ')' : formattedNumber;
  }

  //export_button_server('psv', obj, full_data)

  function export_post$1(file_type, obj, full_data, params, opts) {
     
         //Create an hidden form
        console.log(obj.titles);
                //alert( 'Not yet implemented' );
      var url, titles;
      if (file_type=="psv") titles=obj.titles.join('|'); else titles=obj.titles.join(',');
      if (obj.seccol && obj.seccol.length>0) {
          if (file_type=="psv") titles=titles+obj.seccol.join('|'); else titles=titles+obj.seccol.join(',');
      }
     
      //Udhay - Updating the header based on different ag_grid states
      let new_header;
      new_header=obj.titles;
      console.log(new_header);
      if(obj.config.server_filter === "Y") {
        try {
          let new_titles = [];
          let result = full_data.result;
          let ag_data = (result.res && result.res.jsond) ? result.res.jsond.aggrid_data : null;

          if(ag_data && ag_data.pivotCols.length) {
              var newct = result.newct;
              if(ag_data.rowGroupCols.length)   
                new_titles = ag_data.rowGroupCols.map(v => v.displayName);
              Object.keys(newct).filter(v => v.match("CPIV")).forEach(v => new_titles.push(newct[v].replace(/\|/g,"-").replace(/^-/,"")));
          }
          else if(ag_data && ag_data.rowGroupCols.length) {
              new_titles = ag_data.rowGroupCols.map(v => v.displayName );
              ag_data.valueCols.forEach(v => {
                let col_name = v.displayName;
                console.log(col_name);
                let aggFunc = v.aggFunc ? v.aggFunc : "";
                if(aggFunc) col_name = aggFunc + "(" + col_name + ")";
                
                new_titles.push(col_name);
              });
          }
          else {
            let cols = Object.keys(result.newct);
            cols.forEach(v => {
                let col_name = obj.cols.find(v1 => v1.field === v).headerName;
                let aggFunc = obj.ag_state.col_state.find(v1 => v1.colId === v);
                aggFunc = aggFunc ? aggFunc.aggFunc : "";
                if(aggFunc) col_name = aggFunc + "(" + col_name + ")";
                new_titles.push(col_name);
            });
          }
          if (file_type=="psv") new_header=new_titles.join('|');
          else new_header=("\"" + new_titles.join("\",\"") + "\"");
          
        } catch(err){
          console.error(err);
          new_header = titles;
        }
       
      }
      //Udhay - End of code Updating the header based on different ag_grid states
      
      params.titles= new_header;
      
      //params.export_file = obj.config.title.replace(/ /g,"_")+"_"+new Date().toISOString();
      params.export_file = (rxds.app.page.config.title + "-" + obj.config.title).replace(/ /g,"_");
      
              if (rxds.is_home)  url='download_file';
              else url='../download_file';
             if (rxds.m.get_param("DBNAME")) {
         params.DBNAME = rxds.m.get_param("DBNAME");
       }
        var form = $('<form>', {'method': 'POST', 'action': url}).hide();
        
        $.each(params, function (k, v) {
            form.append($('<input>', {'type': 'hidden', 'name': k, 'value': v}));
        });
        
        //Make it part of the document and submit
        $('body').append(form);
        form.submit();
        
        //Clean up
        form.remove();
   }

  function export_button$1(file_type, obj, full_data) {
    var params = { cache_id:full_data.disk,query_id:obj.query_id,format:file_type };
       
    export_post$1(file_type, obj, full_data, params);
  }

  function export_button_server$1(file_type, obj, full_data) {
    //Udhay - Show alert if the record count exceeds 100k for excel export
    let rec_count = full_data.res ? full_data.res.LastRow : full_data.result.res.LastRow;
    let col_count = full_data.res ? full_data.res.meta.length : full_data.result.res.meta.length;
    let message;
    if(file_type === "xlsx") {
      /*if(rec_count > 100000 || col_count > 100){
        //message = "This export doesn't support records more than 100k, Please try CSV/PSV export options.";
        //$(".ui.modal.custom-modal .custom-content").html("This export doesn't support records more than 100k, Please try CSV/PSV export options.");
      }*/
      //if(rec_count > 100000 || col_count > 100 || (rec_count > 80000 && col_count > 25) || (rec_count > 50000 && col_count > 40)){
      if(rec_count > 100000 || col_count > 200 || (rec_count > 80000 && col_count > 25) || (rec_count > 50000 && col_count > 40) || (rec_count > 25000 && col_count > 100)){
        //message = "Number of records or columns exceeds the export limit, Please try CSV/PSV options.";
        //message = "You are trying to export large data with either more fields or records, Please try CSV/PSV export options for this view.";
        message = "You are trying to export a dataset with large amount of rows and/or fields, Please use CSV/PSV export options.";
      }
      if(message) {
        $(".ui.modal.custom-modal .custom-content").html(message);
        $(".ui.modal.custom-modal").modal("show");
        return;
      }
    }
    const cache_id=obj.infi_hash?obj.infi_hash: full_data.disk; 
    const server_filter=obj.infi_hash?2:0; 
    var params = { cache_id:cache_id,server_filter:server_filter,query_id:obj.query_id,format:file_type };
     
    export_post$1(file_type, obj, full_data, params);
  }

  function add_column(colDef,obj,calctype,calctype_fn,datatype) {
    var calcCol;
    if (datatype == "number") {
      calcCol={"headerName":calctype + " " +colDef.headerName, "field":"calc_" + calctype_fn + "_" +colDef.field, filter: "agNumberColumnFilter", type: "numericColumn" };
    }else if (datatype == "text") {
      calcCol={"headerName":calctype + " " +colDef.headerName, "field":"calc_" + calctype_fn + "_" +colDef.field, filter: "agTextColumnFilter", allowedAggFuncs:['count']};
    }else if (datatype == "date") {
      calcCol={"headerName":calctype + " " +colDef.headerName, "field":"calc_" + calctype_fn + "_" +colDef.field, filter: "agDateColumnFilter", allowedAggFuncs:['count']};
    }
    const llbase=obj.cols.findIndex(v=>v.field==colDef.field);
    obj.cols.splice(llbase,0,calcCol);
    //console.log(obj.cols);
    calcCol.base_field=colDef.field;
    calcCol.calctype=calctype_fn;
    //if (!calcCol.type) calcCol.type = "textColumn";
    obj.calc_cols.push(calcCol);
    //obj.opts.api.deltaColumnMode=true;
    var cur_state=obj.opts.columnApi.getColumnState();
    cur_state=cur_state.filter(w=>w.hide);
    cur_state.map(v=>{
      var w=obj.cols.find(x=>x.field==v.colId);
      if (w) w.hide=true;
    });
    
    obj.opts.api.setColumnDefs(obj.cols);
    
    if(obj.config.server_filter=="Y")
      obj.opts.api.purgeServerSideCache();
    else
      {
        obj.opts.api.setRowData(AddCalculationColumn(obj.opts.rowData, calctype, calcCol));
      }
    //obj.opts.api.resetColumnState();

  }

  function AddCalculationColumn(rowData, calctype, calcCol)
  {
    if(calctype.toUpperCase()=="YEAR")
    {
      rowData.map(e=>e[calcCol.field]=parseInt(e[calcCol.base_field].split('-')[0]));
    }
    else if(calctype.toUpperCase()=="YEARMONTH")
    {
      rowData.map(e=>e[calcCol.field]=e[calcCol.base_field].split('-')[0]+"."+e[calcCol.base_field].split('-')[1]);
    }
    else if(calctype.toUpperCase()=="YEARQTR")
    {
      rowData.map(e=>e[calcCol.field]=parseInt(e[calcCol.base_field].split('-')[0]+GetQuarter(e[calcCol.base_field].split('-')[1])));
    }
    
    return rowData;
  }
    
  function GetQuarter(month)
  {
    let qtr="";
    month=parseInt(month);
    if(month>=1 && month<=3)
      qtr="01";
    else if(month>=4 && month<=6)
      qtr="02";
    else if(month>=7 && month<=9)
      qtr="03";
    else if(month>=10 && month<=12)
      qtr="04";
      
    return qtr;
  }

  function getContextMenuItems(params, obj, full_data, opts) {
      const c=params.column.userProvidedColDef;
      console.log(c);
      //var result = params.defaultItems ? params.defaultItems.splice(0) : [];
      var result = params.defaultItems ? params.defaultItems.filter(v => v !== "pivotChart").splice(0) : [];  //Udhay - to disable pivot chart option
     result = params.defaultItems ? params.defaultItems.filter(v => v !== "export").splice(0) :[];
     if(c)
     {
      if (c.filter =="agDateColumnFilter") {
          result.push({
                  name: 'Add Calculation',
                  subMenu: [{name: 'Year',
                      action: function() {add_column(c,obj,"Year", "ag_year", "number");}
                      },{name: 'Year Month',
                      action: function() {add_column(c,obj,"YearMonth", "ag_yearmonth", "text");}
                      },{name: 'Year Qtr',
                      action: function() {add_column(c,obj,"YearQtr", "ag_yrqtr", "text");}
                      }/*,{name: 'Add Year',  //Udhay - Removed this as this is not working, not available in kxgrid.q file
                      action: function() {add_column(c,obj,"agf_plus1", "date");}
                      }*/]
              });
      }
     }
      
      /*  Udhay - to disable the Add Calculation options for strinng and number fields as these are not working
      else if  (c.filter =="agTextColumnFilter") {
          result.push({
                  name: 'Add Calculation',
                  subMenu: [{name: 'Rollup less used',
                      action: function() {add_column(c,obj,"ag_most_used", "text");}
                      }]
              });
      }  
      else if  (c.filter =="agNumberColumnFilter") {
          result.push({
                  name: 'Add Calculation',
                  subMenu: [{name: 'Rounded Bins',
                      action: function() {add_column(c,obj,"Rounded Bins", "ag_rnd2", "text");}
                      },{name: 'Equal Width Bins',
                      action: function() {add_column(c,obj,"Equal Width", "ag_eqw2", "text");}
                      },{name: 'Equal Count Bins',
                      action: function() {add_column(c,obj,"Equal Count", "ag_eqc2", "text");}
                      },{name: 'Equal Sum Bins',
                      action: function() {add_column(c,obj,"Equal Sum", "ag_dec2", "text");}
                      },{name: 'K-Means Cluster',
                      action: function() {add_column(c,obj,"kMeans", "ag_hkm2", "text");}
                      },{name: 'cK-Means Cluster',
                      action: function() {add_column(c,obj,"ckMeans", "ag_ckm2", "text");}
                      },{name: 'ML K-Means Cluster',
                      action: function() {add_column(c,obj,"MLkMeans", "ag_mlp2", "text");}
                      }
                      ]
              });
      }
      */
        
     // result.push('separator');
      let kdb_res = rxds.m.query_tracker[obj.query_id];
      result.push(    
          {
              name: 'Export',
              icon:  '<span class="ag-icon ag-icon-save" unselectable="on" role="presentation"></span>',
              subMenu: [
                  {
                      name: 'CSV Export',
                      action: function() {
                        
                        var excelParams = {
                             fileName: (rxds.app.page.config.title + "-" + obj.config.title).replace(/ /g,"_"),
                         };
                            opts.api.exportDataAsCsv(excelParams);
                            
                        //Udhay - to fix export issue on right click
                      //  $("#region" + obj.region.region_id).find(".AG-buttons .button.csv").click();

                        /*if(kdb_res.data.qerr || !kdb_res.data.result.res.LastRow) {
                          $(".ui.modal.no-data-message").modal("show");
                          return;
                        }
                        export_button_server('csv',obj,full_data);*/
                      }
                  },
                  {
                      name: 'Excel Export (.xlsx)',
                      action: function() {
                        var excelParams = {
                             fileName: (rxds.app.page.config.title + "-" + obj.config.title).replace(/ /g,"_"),
                         };
                            opts.api.exportDataAsExcel(excelParams);
                           
                        //Udhay - to fix export issue on right click
                      //  $("#region" + obj.region.region_id).find(".AG-buttons .button.xlsx").click();
                        /*
                        if(kdb_res.data.qerr || !kdb_res.data.result.res.LastRow) {
                          $(".ui.modal.no-data-message").modal("show");
                          return;
                        }
                        export_button_server('xlsx',obj,full_data);*/
                      }
                  },
                  {
                      name: 'Excel Export (.xml)',
                      action: function() {
                        //Udhay - to fix export issue on right click
                       var excelParams = {
                             fileName: (rxds.app.page.config.title + "-" + obj.config.title).replace(/ /g,"_"),
                         };
                            opts.api.exportDataAsExcel(excelParams,{exportMode: 'xml'});
                           
                        
                        /*if(kdb_res.data.qerr || !kdb_res.data.result.res.LastRow) {
                          $(".ui.modal.no-data-message").modal("show");
                          return;
                        }
                        export_button_server('psv',obj,full_data);*/
                      }
                  }
              ]
          });
      return result;
  }


  function japanese_options$3 () {
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

  function formatNumber(number) {
      // this puts commas into the number eg 1000 goes to 1,000,
      // i pulled this from stack overflow, i have no idea how it works
      if (number)
         return number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
      return number;
  }

  function numFormatter(params) {
      if(!params.value)
        return params.value;
      return params.value.toLocaleString();
  }

  function num0Formatter(params) {
      if(params.value == null)
        return params.value;
      return formatNumber(Math.round(params.value));
  }

  function num2Formatter(params) {
      if(params.value == null)
        return params.value;
      return formatNumber(Math.round(params.value,2));
  }

  function per0Formatter(params) {
      if(params.value == null)
        return params.value;
      return formatNumber(Math.round(params.value)) + ' %';
  }

  function per2Formatter(params) {
      if(params.value == null)
        return params.value;
      return formatNumber(Math.round(params.value,2)) + '%';
  }
  function largenumFormatter(params) {
      if(params.value == null)
        return params.value;
       return '\u200C'+ params.value;
  }

  function count_distinct(val) {
    console.log("cnt_dist",val);
     return 1;
  }
  function autoSizeAll(opts, skipHeader) {
      var allColumnIds = [];
      opts.columnApi.getAllColumns().forEach(function(column) {
          allColumnIds.push(column.colId);
      });
      
      let viewname=rxds.view?(rxds.view.view_name?rxds.view.view_name:""):"";    
      if(viewname=="")  //udhay - don't adjust if the view is a saved view
          opts.columnApi.autoSizeColumns(allColumnIds, skipHeader);
  }


  function dollarFormatter(params) {
      return '$'+formatNumber(Math.round(params.value,2)) ;
  }

  function isValidDate(data, t) {
    var res=data.filter((e)=>e[t]!="");
    
    var inValidDateCount=res.map(v=>v[t]).filter(v=>isCorrectDate(v)==false).length;
    
    if(res.length<=0 || inValidDateCount>0)
      return false;
      
    let dateString=res[0][t];
      
          if(isNaN(dateString))
          {
          // Date format: YYYY-MM-DD
          var datePattern = /^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;
   
          // Check if the date string format is a match
          var matchArray = dateString.match(datePattern);
          if (matchArray == null) {
              return false;
          }
   
          // Remove any non digit characters
          var cleanDateString = dateString.replace(/\D/g, ''); 
   
          // Parse integer values from date string
          var year = parseInt(cleanDateString.substr(0, 4));
          var month = parseInt(cleanDateString.substr(4, 2));
          var day = parseInt(cleanDateString.substr(6, 2));
         
          // Define number of days per month
          var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
   
          // Adjust for leap years
          if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) {
              daysInMonth[1] = 29;
          }
   
          // check month and day range
          if (month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) {
              return false;
          }
   
          // You made it through!
          return true;
          }
          return false;
      }

  function isCorrectDate(date) {
       date   = new Date(date);
      if (date instanceof Date) {
          var text = Date.prototype.toString.call(date);
          return text !== 'Invalid Date';
      }
      return false;
  }

  async function loadAG(k,obj, data_in, full_data) {
      var data, meta={};
      var div = "#GRID" + k; 
      
      var cols=[],fils=[],i=0;
      
      if (obj.opts &&  obj.opts.api) {
        obj.opts.api.destroy();
        delete obj.ag_state;
      }
       
      if (typeof data_in.table !== "undefined") data = data_in.table; else data=data_in;
      if (typeof data_in.res !== "undefined") {
          data = data_in.res.table;
          if (typeof data_in.res.meta !== "undefined") {
            data_in.res.meta.forEach(v=>{
              meta[v.c] = v.t;
            });
          }
      }    
      if (obj.config.region_transform) {
          var data_binding = {};
          var transform_fn=new Function('data','db', 'rxds', obj.config.region_transform);
          data = transform_fn(data,data_binding, rxds.m.managers["Report"]);        
      }

      let blank_opt = {
          displayKey: 'blanks', 
          displayName: 'Blanks',
          test: function (filterValue, cellValue) {
              //return cellValue == undefined;
              return true;
          },
          hideFilterInput: true,
      };
      
      let date_blank_opt = {
          displayKey: 'blanks', 
          displayName: 'Blanks',
          test: function (filterValue, cellValue) {
              return cellValue == "";
          },
          hideFilterInput: true,
      };
      
      let filterParams = {
        agNumberColumn: { 
          "buttons":['clear','reset'],
          "filterOptions": [ 'equals', 'notEqual', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual', 'inRange', blank_opt, 'empty' ],
        },
        agDateColumn: { 
          "buttons":['clear','reset'],
          "filterOptions": [ 'equals', 'notEqual', 'lessThan', 'greaterThan', 'inRange', date_blank_opt, 'empty' ],
          //"inRangeInclusive": true,
          comparator: (filterLocalDateAtMidnight, cellValue) => {
                      const dateAsString = cellValue;

                      if (dateAsString == null) {
                          return 0;
                      }
                      
                      if(dateAsString == "")
                      {
                        return false;
                      }

                      // In the example application, dates are stored as dd/mm/yyyy
                      // We create a Date object for comparison against the filter date
                      const dateParts = dateAsString.split('-');
                      const day = Number(dateParts[2]);
                      const month = Number(dateParts[1]) - 1;
                      const year = Number(dateParts[0]);
                      const cellDate = new Date(year, month, day);

                      // Now that both parameters are Date objects, we can compare
                      if (cellDate < filterLocalDateAtMidnight) {
                          return -1;
                      } else if (cellDate > filterLocalDateAtMidnight) {
                          return 1;
                      }
                      return 0;
                  }
        },
        agDateTimeColumn: { 
          "buttons":['clear','reset'],
          "filterOptions": [ 'equals', 'notEqual', 'lessThan', 'greaterThan', 'inRange', 'empty' ],
          //"inRangeInclusive": true,
          comparator: (filterLocalDateAtMidnight, cellValue) => {
                      const dateAsString = cellValue;

                      if (dateAsString == null) {
                          return 0;
                      }
                      
                      if(dateAsString == "")
                      {
                        return false;
                      }

                      // In the example application, dates are stored as dd/mm/yyyy
                      // We create a Date object for comparison against the filter date
                      const dateParts = dateAsString.split('-');
                      const day = Number(dateParts[2]);
                      const month = Number(dateParts[1]) - 1;
                      const year = Number(dateParts[0]);
                      const cellDate = new Date(year, month, day);

                      // Now that both parameters are Date objects, we can compare
                      if (cellDate < filterLocalDateAtMidnight) {
                          return -1;
                      } else if (cellDate > filterLocalDateAtMidnight) {
                          return 1;
                      }
                      return 0;
                  }
        },
        agTimeColumn: { 
          "buttons":['clear','reset'],
          "filterOptions": [ 'inRange', 'lessThan', 'greaterThan', blank_opt, 'empty' ],
          "inRangeInclusive": true
        },
        agTextColumn: { 
          buttons:['clear','reset'],
          filterOptions: [ 'contains', 'notContains', 'equals', 'notEqual', 'startsWith', 'endsWith', blank_opt, 'empty' ]
        }
      };
        
        for(var t in data[0]) {
          var title;
          //Is there a config for this column?
          var colSet=rxds.app.report_headers[t];
          if (colSet !== undefined && !rxds.app.app.name.match(/Data Explorer/)) {
             title=colSet.Label?colSet.Label:t;
             
             
             if (colSet.Render==="number"){
                cols.push({"headerName":title, "field":t, filter: "agNumberColumnFilter", valueFormatter: num0Formatter, type: "numericColumn" });
              }else if (colSet.Render==="number2"){
                cols.push({"headerName":title, "field":t, filter: "agNumberColumnFilter", valueFormatter: num2Formatter, type: "numericColumn" });
              }else if (colSet.Render==="percentage"){
                cols.push({"headerName":title, "field":t, filter: "agNumberColumnFilter", valueFormatter: per0Formatter, type: "numericColumn" });
              }else if (colSet.Render==="percentage2"){
                cols.push({"headerName":title, "field":t, filter: "agNumberColumnFilter", valueFormatter: per2Formatter, type: "numericColumn" });
              }else if (colSet.Render==="currency"){
                cols.push({"headerName":title, "field":t, valueFormatter: dollarFormatter, filter: "agNumberColumnFilter", type: "numericColumn" });
              }else if (colSet.Render==="date"){
                cols.push({"headerName":title, "field":t, filter: "agDateColumnFilter", allowedAggFuncs:['count']});
              }else if (colSet.Render==="text"){
                cols.push({"headerName":title, "field":t, filter: "agTextColumnFilter", allowedAggFuncs:['count']});
              }else if (colSet.Render==="numberplain"){
                cols.push({"headerName":title, "field":t, filter: "agNumberColumnFilter", allowedAggFuncs:['count']});
              }else if (colSet.Render==="largenumber"){
                cols.push({"headerName":title, "field":t, valueFormatter: largenumFormatter, filter: "agNumberColumnFilter"});
              }else{
                cols.push({"headerName":title, "field":t, filter: "agTextColumnFilter", allowedAggFuncs:['count']});
              }
          }else{ //No settings for this column
              if(meta[t]) {
                if(meta[t].match(/h|i|j|e|f/)){
                  // cols.push({"headerName":t, "field":t, filter: "agNumberColumnFilter", filterParams:{ buttons:['clear','reset']},"type": "numericColumn"});
                  cols.push({"headerName":t, "field":t, filter: "agNumberColumnFilter", filterParams: filterParams.agNumberColumn,"type": "numericColumn"});
                }
                else if(meta[t].match(/d|m/)){
                  /*cols.push({
                    "headerName":t, 
                    "field":t, 
                    "filter": "agDateColumnFilter", 
                    "filterParams":{ 
                      "buttons":['clear','reset'],
                      "filterOptions": ['equals', 'notEqual', 'lessThan', 'greaterThan', 'inRange', 'empty'],
                      "inRangeInclusive": true
                    }, 
                    "allowedAggFuncs":['count']
                  });*/
                  cols.push({"headerName":t, "field":t, "filter": "agDateColumnFilter", "filterParams": filterParams.agDateColumn, "allowedAggFuncs":['count'] });
                }
                else if(meta[t].match(/p/)) {
                  /*cols.push({
                    "headerName":t, 
                    "field":t, 
                    "filter": "agDateColumnFilter", 
                    "filterParams":{ 
                      "buttons":['clear','reset'],
                      "filterOptions": ['inRange', 'lessThan', 'greaterThan', 'empty'],
                      "inRangeInclusive": true
                    }, 
                    "allowedAggFuncs":['count']
                  });*/
                  cols.push({
                    "headerName":t, "field":t, "filter": "agDateColumnFilter","filterParams": filterParams.agTimeColumn,"allowedAggFuncs":['count']
                  });
                }
                else if(meta[t].match(/z/)) {
                  /*cols.push({
                    "headerName":t, 
                    "field":t, 
                    "filter": "agDateColumnFilter", 
                    "filterParams":{ 
                      "buttons":['clear','reset'],
                      "filterOptions": ['inRange', 'lessThan', 'greaterThan', 'empty'],
                      "inRangeInclusive": true
                    }, 
                    "allowedAggFuncs":['count']
                  });*/
                  cols.push({
                    "headerName":t, "field":t, "filter": "agDateColumnFilter","filterParams": filterParams.agDateTimeColumn,"allowedAggFuncs":['count']
                  });
                }
                else if(meta[t].match(/n|u|v|t/)) {
                  cols.push({
                    "headerName":t, 
                    "field":t,
                    "filter": false,
                    //"filter": "agTextColumnFilter",
                    "filterParams":{ 
                      "buttons":['clear','reset'],
                      //"filterOptions": ['equals','notEqual', 'empty'],
                      "filterOptions": ['equals','notEqual', filterParams.agTimeColumn, 'empty'],
                    },
                    "allowedAggFuncs":['count']
                  });
                }
                //else if(meta[t].match(/C|c|s|g/)) {
                else {
                  //cols.push({"headerName":t, "field":t, filter: "agTextColumnFilter", filterParams:{ buttons:['clear','reset']}, allowedAggFuncs:['count']});
                  cols.push({"headerName":t, "field":t, filter: "agTextColumnFilter", filterParams: filterParams.agTextColumn, allowedAggFuncs:['count']});
                }
              }
              else if(isValidDate(data, t))
              {
                cols.push({"headerName":t, "field":t, "filter": "agDateColumnFilter", "filterParams": filterParams.agDateColumn, "allowedAggFuncs":['count'] });
              }
              else if(typeof data[0][t] == "string") {
                //cols.push({"headerName":t, "field":t, filter: "agTextColumnFilter", allowedAggFuncs:['count']});
                cols.push({"headerName":t, "field":t, filter: "agTextColumnFilter", filterParams: filterParams.agTextColumn, allowedAggFuncs:['count']});
              }
              else if(typeof data[0][t] == "number") {
                //cols.push({"headerName":t, "field":t, filter: "agNumberColumnFilter"});
                cols.push({"headerName":t, "field":t, filter: "agNumberColumnFilter", filterParams: filterParams.agNumberColumn,"type": "numericColumn"});
               }
               else{
                 //cols.push({"headerName":t, "field":t, filter: "agTextColumnFilter", allowedAggFuncs:['count']});
                 cols.push({"headerName":t, "field":t, filter: "agTextColumnFilter", filterParams: filterParams.agTextColumn, allowedAggFuncs:['count']});
               }
          }
          
          // Jayapriya --- Start
          if(!rxds.app.app.name.match(/Data Explorer/)){
                cols.forEach(v => {
                v.headerName=v.headerName.split('_').join(' ');
                //console.log(v.headerName)  
              });
            }
          // Jayapriya --- End
          
           
          //Udhay - delay filters from getting applyed
          var debounceMs = 1500;
          var buttons = ['apply', 'clear', 'reset', 'cancel'];
          cols.forEach(v => {
            if(v.filterParams) {
              v.filterParams.debounceMs = debounceMs;
              v.filterParams.buttons = buttons;
            }
            else {
              v.filterParams = { debounceMs,buttons };
            }
          });
         
          
          fils.push({column_number: i,filter_type: "text",filter_delay: 500,filter_reset_button_text:"<i class='times circle icon'></i>"});
          i++;
        }


         var opts = {};
     
        const ctx= function(params) {
         
           return getContextMenuItems(params,obj, data_in, opts);
        };
       
        opts = {
          
          
          
          /*aggFuncs: {
            count_distinct: count_distinct 
          },*/
          defaultColDef: {
            // allow every column to be aggregated
            enableValue: true,
            resizable:true,
            // allow every column to be grouped
            enableRowGroup: true,
            // allow every column to be pivoted
            enablePivot: true,
            sortable: true,
            filter: true
          },
          localeText:{
              noRowsToShow: "<p style=\" font-size:1rem;color:#616161;font-weight:490 \" > No Data to Display </p>",
       
          },
          columnTypes: {
            dimension: {
              enableRowGroup: true,
              enablePivot: true,
            },
            measure: {
              width: 150,
              aggFunc: 'sum',
              enableValue: true,
              cellClass: 'number',
              valueFormatter: numberCellFormatter,
              cellRenderer:'agAnimateShowChangeCellRenderer',
              allowedAggFuncs: ['avg','sum','min','max'],
              cellClassRules: {'negative': 'x < 0'}
            }
          },
          //autoGroupColumnDef: {
          //  headerName: 'Hierarchy',
          //  width: 200
          enableCharts: true,
          enableRangeSelection: true, 
          columnDefs: cols,
          cacheBlockSize: 100,
          suppressCsvExport:false,
          suppressExcelExport:false,
          rowGroupPanelShow: 'always',
          pivotPanelShow: 'always',
          suppressAggFuncInHeader: false,
          blockLoadDebounceMillis: 100,
          deltaColumnMode:true, // Resets user changes when adding a new column
          animateRows: false,
          floatingFilter: true,
          allowDragFromColumnsToolPanel: true,
          statusBar: {
            statusPanels: [
                { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left',key: 'totalRowComponent' },
                { statusPanel: 'agTotalRowCountComponent', align: 'center' },
                //{ statusPanel: 'agFilteredRowCountComponent' },
                { statusPanel: 'agSelectedRowCountComponent' },
                { statusPanel: 'agAggregationComponent' }
            ]
          },
          sideBar: {  //detailed properties of sidebar
              toolPanels: [
                  {
                      id: 'columns',
                      labelDefault: 'Columns',
                      labelKey: 'columns',
                      iconKey: 'columns',
                      toolPanel: 'agColumnsToolPanel',
                  },
                  {
                      id: 'filters',
                      labelDefault: 'Filters',
                      labelKey: 'filters',
                      iconKey: 'filter',
                      toolPanel: 'agFiltersToolPanel',
                  }
              ],
              defaultToolPanel: 'columns',
          }
          //sideBar: true   //shotcut for sidebar
       };
       //console.log(opts);
       
       
        //Udhay - Conditions to support option to disable some AG-Grid options
          let ag_options = obj.config.aggrid_options || "";
          
          if(!ag_options.match(/Chart/)) {  //disabling the charting option
              opts.enableCharts = false;
          }
          
          if(!ag_options.match(/Pivot/)) {  //disabling the pivot option
              opts.defaultColDef.enablePivot = false;
              opts.pivotPanelShow = 'never';
              opts.pivotMode = false;
              if(opts.sideBar.toolPanels[0].toolPanelParams) {
                  opts.sideBar.toolPanels[0].toolPanelParams.suppressPivotMode = true;
                  opts.sideBar.toolPanels[0].toolPanelParams.suppressPivots = true;
              } else {
                  opts.sideBar.toolPanels[0].toolPanelParams = {
                      suppressPivotMode: true,
                      suppressPivots: true
                  };
              }
          }
          
          if(!ag_options.match(/Grouping/)) {   //disabling the group-by option
              opts.defaultColDef.enableValue = false;
              opts.defaultColDef.enableRowGroup = false;
              opts.rowGroupPanelShow = 'never';
              if(opts.sideBar.toolPanels[0].toolPanelParams) {
                  opts.sideBar.toolPanels[0].toolPanelParams.suppressRowGroups = true;
                  opts.sideBar.toolPanels[0].toolPanelParams.suppressValues = true;
              } else {
                  opts.sideBar.toolPanels[0].toolPanelParams = {
                      suppressRowGroups: true,
                      suppressValues: true
                  };
              }
          
              //Removing pivot option as pivot will not work without group-by options
              opts.defaultColDef.enablePivot = false;
              opts.pivotPanelShow = 'never';
              opts.pivotMode = false;
              opts.sideBar.toolPanels[0].toolPanelParams.suppressPivotMode = true;
              opts.sideBar.toolPanels[0].toolPanelParams.suppressPivots = true;
          }
       
        /************** Add export buttons above the Grid **************/
        //Udhay - Add export buttons above the Grid
        $("#CONT" + obj.region.region_id + " .AG-buttons").empty();
        if(obj.config.export) {
          function getExportBtnElem(file_type, label){
            let rtn = "<button class='ui button " + file_type + "' area-control='GRID" + obj.region.region_id + "'>" + label + "</button>";
            if(obj.config.server_filter === "Y")
              rtn = $(rtn).click(function() {
                if( full_data.qerr || (full_data.result.res && !full_data.result.res.LastRow) || !full_data.result.res) {
                  $(".ui.modal.no-data-message").modal("show");
                  return;
                }
                if((full_data.result.res.jsond.x_control_name.match("Provider Report"))||(full_data.result.res.jsond.x_control_name.match("Provider Affiliated with Facilities")) || (full_data.result.res.jsond.x_control_name.match("Affiliated Facility Report"))|| (full_data.result.res.jsond.x_control_name.match("Affiliated Providers Report")) ){
                  delete full_data.result.newct.Location_NPI_1_link;
                  delete full_data.result.newct.Location_NPI_2_link;
                  delete full_data.result.newct.Location_NPI_3_link;
                  delete full_data.result.newct.Location_NPI_4_link;
                  full_data.result.res.jsond.aggrid_data.last_table_meta=full_data.result.res.jsond.aggrid_data.last_table_meta.filter(function(v){return !v.c.match("link")});
                  full_data.result.res.meta=full_data.result.res.meta.filter(function(v){return !v.c.match("link")});
                  full_data.result.res.table.forEach(function(v){
                    delete v.Location_NPI_1_link;
                    delete v.Location_NPI_2_link;
                    delete v.Location_NPI_3_link;
                    delete v.Location_NPI_4_link;
                  });
                }
                export_button_server$1( file_type, obj, full_data );
              });
            else
              rtn = $(rtn).click(function() {
                if(full_data.rowcount<=0)
                {
                  $(".ui.modal.no-data-message").modal("show");
                  return;
                }
                
                var params = {
                  fileName: (rxds.app.page.config.title + "-" + obj.config.title).replace(/ /g,"_")
                };
                
                if(file_type.toUpperCase()=="CSV")
                {
                  params.customHeader="Legal Notice: The material located in this file is highly sensitive. Do not forward. ";
                  opts.api.exportDataAsCsv(params);
                }
                else if(file_type.toUpperCase()=="XLSX")
                {
                  params.sheetName=(rxds.app.page.config.title + "-" + obj.config.title).replace(/ /g,"_");
                  opts.api.exportDataAsExcel(params);
                }
                else
                    export_button$1( file_type, obj, full_data );
              });
            return rtn;
          }
          if(obj.config.export.match("CSVDB")) {
            $("#CONT" + obj.region.region_id + " .AG-buttons").append(getExportBtnElem("csv", "Full Export (CSV)"));
          }
          if(obj.config.export.match("ExcelDB")) {
            $("#CONT" + obj.region.region_id + " .AG-buttons").append(getExportBtnElem("xlsx", "Full Export (XLSX)"));
          }
          if(obj.config.export.match("PSVDB")) {
            $("#CONT" + obj.region.region_id + " .AG-buttons").append(getExportBtnElem("psv", "Full Export (PSV)"));
          }
        }
        else {
          $("#CONT" + obj.region.region_id + " .AG-buttons").hide();
        }
        /************** End of code to add export buttons above the Grid **************/
         /*
         if (rxds.app.config.language=="JP") {opts.language=japanese_options();}
         
  //      if  (obj.config.export && obj.config.export.match(/ExcelDB/))
  //         opts.buttons=["copy"];
        
        const limitRows =  obj.config.limit_rows?Number(obj.config.limit_rows):1000;
        if ( ((data.length == limitRows) ||   obj.config.export && obj.config.export.match(/CSV/)) 
              && (obj.config.server_filter !== 'Y'))
           opts.buttons.push(export_button('csv', obj, full_data));
        if  (obj.config.export && obj.config.export.match(/PSV/))
           if (obj.config.server_filter !== 'Y')  
               opts.buttons.push(export_button('psv', obj, full_data));
           else     
               opts.buttons.push(export_button_server('psv', obj, full_data));
        if  (obj.config.export && obj.config.export.match(/ExcelDB/))
           opts.buttons.push(export_button_server('xlsx', obj, full_data));
      */
        var table, datasource;
        $(div).height(Number(obj.config.height)*window.innerHeight/100);

        var gridDiv = document.querySelector(div);
      
      
        if ((obj.config.server_filter == 'Y') && (!data_in.qerr)) {
           var datasource = new ServerSideDatasource(k, obj);
           opts.rowModelType = 'serverSide';
           opts.rowData  = data;
           opts.getMainMenuItems= ctx;
           opts.getContextMenuItems= ctx;

          
          // fetch 100 rows per at a time
           opts.cacheBlockSize = 100;
           // only keep 10 blocks of rows
           opts.maxBlocksInCache= 10;
           opts.animateRows = true;
         
          
          
           //opts.debug= true;
        } else {  opts.rowData  = data;
          opts.getMainMenuItems= ctx;
           opts.getContextMenuItems= ctx;
        }/*else if (data.length <= opts.pageLength) {
            opts.paging = false;
            opts.dom = `<'ui grid dataTables_wrapper no-footer'
                                  <'left aligned eight wide column'B>
                                  <'right aligned eight wide column'l>
                                  <'sixteen wide column'tr>
                          >`;
       } */



         
      
      
      
        if (obj.config.region_config) {
            var config_fn=new Function('opts','data', 'rxds', 'div', 'obj', 'rxds_full', obj.config.region_config);
            table = config_fn(opts, data, rxds.m.managers["Report"], div, obj, rxds);
            if (!obj.config.region_config.match(/.agGrid/))
              table = new agGrid.Grid(gridDiv, opts);
                 //table = $(div).DataTable(opts);
        }
        else table = new agGrid.Grid(gridDiv, opts);
        obj.resize_needed=0;

        //let totRowCount = "-";
        //let is_groupnig_expanded = false;
        
        /*opts.api.addEventListener("columnRowGroupChanged", function(v) {
          console.log("columnRowGroupChanged");
          if(obj.ag_state.pivot_mode) {
            delete obj.last_meta;
            delete obj.last_newct;
          }
        });*/

       /* opts.api.addEventListener("columnValueChanged", function(v) {
          console.log("columnValueChanged");
          if(obj.ag_state.pivot_mode) {
            delete obj.last_meta;
            delete obj.last_newct;
          }
        });*/
        
        opts.api.addEventListener("columnPivotChanged", function(v) {
          console.log("columnPivotChanged");
          if(obj.ag_state.pivot_mode) {
            delete obj.last_meta;
            delete obj.last_newct;
          }
        });
        
        /* udhay & dhinesh - to trigger new view if the column state like width, position, visibility changes */
        opts.api.addEventListener("columnVisible", function(v) {
          console.log("AG columnVisible...");
          obj.pivot_cols_def = obj.opts.columnApi.getColumnState();
          if (obj.ag_state) {obj.ag_state.col_state = obj.pivot_cols_def;}
          rxds.m.postPageView();
          console.log(obj);
        });
        
        opts.api.addEventListener("columnPinned", function(v) {
          console.log("AG columnPinned...");
          obj.pivot_cols_def = obj.opts.columnApi.getColumnState();
          if (obj.ag_state) {obj.ag_state.col_state = obj.pivot_cols_def;}
          rxds.m.postPageView();
          console.log(obj);
        });
        
       /* opts.api.addEventListener("columnResized", function(v) {
          if(v.finished == true) {
            console.log("AG columnResized...");
            obj.pivot_cols_def = obj.opts.columnApi.getColumnState();
            obj.ag_state.col_state = obj.pivot_cols_def;
            rxds.m.postPageView();
            console.log(v); 
          }
        }); */
        
        opts.api.addEventListener("columnMoved", function(v) {
          console.log("AG columnMoved...");
          obj.pivot_cols_def = obj.opts.columnApi.getColumnState();
          obj.ag_state.col_state = obj.pivot_cols_def;
          rxds.m.postPageView();
          console.log(obj);
        });
        
        //Dhanajayan | 13.10.2021 -> Adjust column size based on content
        opts.api.addEventListener("bodyScroll", function(v) {
          if(rxds.app.config.theme!="alnylam")
          {
            if(agDataSet!=rxds.m.get_param("TABLE_NAME"))
            {
              displayedVirtualColId=[];
            }
              
            if(v.direction=="horizontal")
            {
                let displayedCount=displayedVirtualColId.length;
                let virtualColumn=v.api.columnController.allDisplayedCenterVirtualColumns.map(v=>v.colId);
                let d=displayedVirtualColId.concat(virtualColumn);
                displayedVirtualColId= d.filter((item, pos) => d.indexOf(item) === pos);
                if(displayedVirtualColId.length!=displayedCount)
                {
                  agDataSet=rxds.m.get_param("TABLE_NAME");
                  autoSizeAll(opts, false);
                }
                
            }
          }
        });
        
        /* udhay & dhinesh- end - to trigger new view if the column state like width, position, visibility changes */
        
        opts.api.addEventListener("modelUpdated", function(v) {
            //console.log("Model Updated", v,obj.ag_state);
          /****************** to show total record count at the bottom of the grid ******************/
            
            //Udhay - to show total count at the bottom of the grid
            let kdb_response = rxds.m.query_tracker[obj.query_id];
            let filteredRowCount=0;
            if(obj.config.server_filter=="Y")
            {
            let kdb_result = kdb_response.data.result;
            let totRowCount=0, ag_json_send=0;
              ag_json_send = kdb_response.json_sent.aggrid_data;
              totRowCount = kdb_result ?( kdb_result.origtrows?(formatNumber(kdb_result.origtrows)):0) : 0;
              filteredRowCount = kdb_result.filteredrows ? formatNumber(kdb_result.filteredrows) : 0;

            //let leftInfoLabel = "";
            //let leftInfoNum = "";
            
            let leftInfoLabel = "Rows";
            let leftInfoNum = filteredRowCount;
            
            //is_groupnig_expanded = is_groupnig_expanded || (Boolean(ag_json_send.groupKeys.length));
            //filteredRowCount = is_groupnig_expanded ? "-" : filteredRowCount;
            /*
            if( ag_json_send && !ag_json_send.calc_cols.length && !Object.keys(ag_json_send.filterModel).length && 
                !ag_json_send.groupKeys.length && !ag_json_send.pivotCols.length && 
                !ag_json_send.pivotMode && !ag_json_send.rowGroupCols.length && 
                !ag_json_send.sortModel.length && !ag_json_send.valueCols.length ) 
                {
                  totRowCount = kdb_response.data.result.res.LastRow.toLocaleString();
            }
            */
            //Add filtered, grouped and total records count
            if(Object.keys(opts.api.getFilterModel()).length){
              //leftInfoLabel = "Filtered Records";
              leftInfoNum = filteredRowCount+" of "+totRowCount;
            }
            
            
            $(div).find(".ag-status-bar .ag-status-bar-left .ag-name-value [ref=eLabel]").html(leftInfoLabel);
            $(div).find(".ag-status-bar .ag-status-bar-left .ag-name-value [ref=eValue]").html(leftInfoNum);
            $(div).find(".ag-status-bar .ag-status-bar-center .ag-name-value").removeClass("ag-hidden");
            $(div).find(".ag-status-bar .ag-status-bar-center .ag-name-value [ref=eLabel]").html("Total Rows");
            $(div).find(".ag-status-bar .ag-status-bar-center .ag-name-value [ref=eValue]").html(totRowCount);
            //$(div).find(".ag-status-bar .ag-status-bar-left").html("");   //to remove left side status bar colon for server-side
            }
            else
            {
              filteredRowCount=opts.api.getDisplayedRowCount();
            }
            /****************** End of code to show total row count ******************/
            
            /****************** Start Display No Reocrd *******************/
            if(filteredRowCount<=0)
                opts.api.showNoRowsOverlay();
              else
                opts.api.hideOverlay();
            /****************** End Display No Reocrd *******************/    
            
            full_data = kdb_response.data;   //udhay - to update full_data object with latest data
            
            //Udhay - to fix pivot and group issue while expanding the row groups
            let secCols = opts.columnApi.getSecondaryColumns();
            obj.pivot_cols_def = secCols ? secCols.map(v => v.userProvidedColDef) : [];
            
            //console.log("modelUpdated...",obj);
            
            //if (obj.resize_needed < 2)    {  obj.resize_needed=obj.resize_needed+1; autoSizeAll(opts, false); }
            
        });    
        
       
        
        if ((obj.config.server_filter == 'Y') && (!data_in.qerr)) {
           opts.api.setServerSideDatasource(datasource);
        }
        
        obj.table=table;
        obj.opts = opts;
        obj.data=data;
        obj.cols=cols;
        obj.calc_cols=[];
        obj.pivot_cols_map = {};  //Udhay - to fix the pivot and group issue
        obj.pivot_cols_def = [];
        obj.titles = cols.map(v=>v.headerName.replace(/\n/g, ' '));

        var param = rxds.m.get_parameters(obj.dependent_items);
        obj.TABLE_NAME=param.TABLE_NAME;
        obj.DATA_VIEW=param.DATA_VIEW;
        
        if (rxds.view && rxds.view.param[obj.config.parameter] && (rxds.view.param.slTables == param.TABLE_NAME || rxds.view.param.slDataSetName == param.TABLE_NAME) && ( rxds.view.view_name)) {
           obj.ag_state = rxds.view.param[obj.config.parameter];
           if (obj.ag_state.col_state) {
             if (obj.ag_state.calc_cols) {obj.calc_cols=obj.ag_state.calc_cols;}   
           opts.api.setFilterModel(obj.ag_state.filter_state);
           opts.columnApi.setColumnState(obj.ag_state.col_state);
           opts.columnApi.setPivotColumns(obj.ag_state.pivot_cols);
           opts.columnApi.setPivotMode(obj.ag_state.pivot_mode);
           opts.api.setSortModel(obj.ag_state.sort_state);
           }
        } else {
           delete obj.h_pivot;
           delete obj.ag_state;
        }
  } //loadAGTable

  var h11 = /*#__PURE__*/Object.freeze({
    load: load$a,
    refresh: refresh$7,
    resize: resize$1,
    get_param: get_param$4,
    get: get$7,
    loadAG: loadAG
  });

  var vendor$3;

  async function load$b(k, obj, data) {
      obj.map_id = "leafletregion" + obj.region.region_id;
      obj.opts = {};
      obj.remove_map = remove_map$1;
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
      
      let start_lat = db.start_lat ? db.start_lat : 38.50985839504626;
      let start_lng = db.start_lng ? db.start_lng : -96.59179687500001;
      let start_zoom = db.start_zoom ? db.start_zoom : 4;


      mapboxgl.accessToken = 'pk.eyJ1IjoicnhkcyIsImEiOiJjaXQ1eHh6MjUwMXk5MnNsamkyY3V2dzJyIn0.rG2LnVBUzWNv2fvrQskCWg';
      var map = new mapboxgl.Map({
      container: "leaflet"+k,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [start_lng, start_lat], 
      zoom: start_zoom
      });
      obj.map = map;
      obj.dom = document.getElementById("leaflet"+k);

      map.addControl(new mapboxgl.NavigationControl());
   
      
      var config_fn=new Function('k','data','db','rxds', 'obj', widget_config);
      config_fn(k,map_data,db, this, obj);


      if(obj.config.flip_report == "Y")  util.toggleDT(k,obj, data, data);
      if(obj.config.annotate == "Y") util.load_annotation_modal(k,obj);
      
      /*if(rxds.app.app.branch.match("MASTER|UI")) {
        $("#leafletselected" + obj.region.region_id)
          .off("click")
          .click(function() { show_selected_modal(obj, "leafletselected"); });
        $("#leafletselectedlocation" + obj.region.region_id)
          .off("click")
          .click(function() { show_selected_modal(obj, "leafletselectedlocation"); });
      }*/
  }

  function get$8(k,obj) {
      let filters = "";
      if (obj.filters && obj.secondary_filters) {
        filters = [obj.filters.join('|'), obj.secondary_filters.join()];
        filters = filters.filter(v => v).join("|");
      }
      return filters;
  }

  function set1$1(k,obj,v) {
     obj.filters=v.split(/\|/);
  }


  async function refresh$8(k,obj, data){
      let h = rxds.m.managers[obj.control_type];
      
      if (data && data.result) /* If we got data */
         await h.load(k, obj, data.result);
      else  await h.load(k, obj, data);
  //  var tabid = "table#" + $("#"+k).data("id");     
  //           console.log("Refresh DT",data);
   //       loadDataTable(tabid,data);
  //           console.log('Need to load report ' + k);
  }

  async function repaint$2(k,obj, data){
  //     obj.chart.render();
      //if(obj.map)   
  }

  function reset_filter$5(k,obj,reset_type) {
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

  function get_param$5(p) {
    return rxds.m.get_param(p);
  }

  function toggleSelection$4(group,obj,db,data,highlight,param) {
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
                obj.secondary_filters_all.push(String(group));
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


  function remove_map$1() {
    let obj = this;
    if (obj.map) {   //added by udhay
        if(obj.map.gestureHandling) obj.map.gestureHandling.disable();
        obj.map.off();
        obj.map.remove();
        obj.map = undefined;
    }
  }

  function show_selected_modal$1(obj, type) {   //Udhay - to update the leaflet model and show with the selected values
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

  var h12 = /*#__PURE__*/Object.freeze({
    vendor: vendor$3,
    load: load$b,
    get: get$8,
    set1: set1$1,
    refresh: refresh$8,
    repaint: repaint$2,
    reset_filter: reset_filter$5,
    get_param: get_param$5,
    toggleSelection: toggleSelection$4
  });

  // Managers handle the life-cyle of items and regions.
  var managers = {};
  managers["Report"]     = h1;
  managers["Chart G2"]     = h2;
  managers["Chart Vega"]     = h3;
  managers["Chart eChart"]     = h4;
  managers["Plugin"]     = h5;
  managers["jPivot"]     = h6;
  managers["Pivot"]     = h7;
  managers["Explorer"]     = h8;
  managers["Map Leaflet"]     = h9;
  managers["Insights"]     = h10;
  managers["AG Grid"]     = h11;
  managers["Map Mapbox"]     = h12;

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
      $("#save_query").click(e=>{ 
           e.stopPropagation(); 
           save_query();
      });
      $("#delete_query").click(e=>{e.stopPropagation(); delete_query();});
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
        const h=managers[pc[i].control_type];
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
    json.DBNAME=rxds.m.get_param("DBNAME");
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
    //const res=JSON.parse(data).result[0];
    //rxds.view={md5_hash:json.md5_hash,view_name:json.view_name,param:JSON.parse(res.param_dict),"public":res.public};
    rxds.view.view_name=json.view_name;
    rxds.view.public=json.public_view;
    $("#view_name").html(json.view_name);
    if (json.view_name != " ") $("#view_name").show();
    $('.ui.modal.views').modal('hide');
    //window.location.replace(window.location.origin+window.location.pathname+"?view="+rxds.md5_hash);
  }

  async function postPageView() {
    var json={},params=false,page_init=rxds.page_init;
    rxds.url_string="";
    if (rxds.app.config.disable_views === "Y") return;
    if (!page_init) {
      Object.entries(rxds.page_controls).forEach(i=>{
        var o = i[1], k=i[0], v, n; 
        if (o.item && o.control_type !== "button" && o.control_type !== "hiddenitem") {
            n=o.config.name; v = get$9(k);
        } else if (o.item && o.control_type === "hiddenitem" && !o.query_id) {  
            n=o.config.name; v = get$9(k);
        } else if (o.config.parameter) {
            n=o.config.parameter; v = get$9(k); 
        } else if (o.control_type=="Pivot") {
           n=k;v=get$9(k);
        }  
        if (n && v) {json[n]=v;rxds.url_string=rxds.url_string+n+"="+v+"&";}
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
    else {json.x_page_load="yes";}
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
      json.limitRows=1500;
      if (obj.config)
      json.limitRows =  obj.config.limit_rows?Number(obj.config.limit_rows):1500;
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
      d.forEach(i => {param[rxds.page_controls[i].parameter] = get$9(i);});
      if (r) r.forEach(i => {if (get$9(i)) param[rxds.page_controls[i].config.parameter] = get$9(i);});
      if (e) $.extend(param, e);
      return param;
  }

  function get_param$6(p) {
      var k=Object.keys(rxds.page_controls).find(v=>rxds.page_controls[v].parameter==p);
      if (k) return get$9(k); else return ""; 
  }
  function find(p) {
      var k=Object.keys(rxds.page_controls).find(v=>rxds.page_controls[v].config.name==p);
      return k; 
  }
  function find_obj(p) {
      var k=Object[+rxds.m.find(p)];
      return k; 
  }
  function find_dom(p){
    return $("#dom_"+rxds.m.find(p));
  }

  function reset_filter$6(k,reset_type) {
    var obj=rxds.page_controls[k];
    const h=managers[obj.control_type];
    if(reset_type) {
      if(reset_type == "filter-group-1") {
        obj.filters=[];
        //obj.filter_index=[];
      } else {
        obj.secondary_filters = [];
      }
      if (h&&h.reset_filter) 
            h.reset_filter(k,obj,reset_type);
    } else {
      obj.filters=[];
      obj.filter_index=[];
      obj.secondary_filters = [];
      $("#select"+k).text('');
      if (h&&h.reset_filter) 
          h.reset_filter(k,obj); 
    }
  }

  function get$9(k) {
      var obj=rxds.page_controls[k], val;
      if (!obj) {console.log(k); return;}
      var h=managers[obj.control_type];
      if ((h)&&(h.get)) 
          val = h.get(k,obj);
      else
          val = $("#"+k).closest("form").form('get value',obj.config.name);
      return val;
  }

  function set_param(p,d,refresh_dep_children) {
      var k=Object.keys(rxds.page_controls).find(v=>rxds.page_controls[v].parameter==p);
      if(refresh_dep_children === true)  rxds.page_controls[k].refresh_dep_children = true;   //Udhay - refresh dependent regions with third parameter
      if (k) return set$2(k,d); else return ""; 
  }

  function set$2(k,d) {
      var obj=rxds.page_controls[k], val;
      var h=managers[obj.control_type];
       if (h && h.set)
           h.set(k, obj, d);
       else
          $("#"+k).closest("form").form('set value',obj.config.name, d);
      return val;
  }

  async function refresh$9(k, obj, data,param) {
    if (rxds.debug && rxds.debug.stop_load && rxds.debug.controls.match(k)) debugger;
    const h=managers[obj.control_type];
    
    var old_val = get$9(k);
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
         //if (!d) d = old_val;
         d = ((typeof d)=="undefined")?obj.config.def:d;
     }
    
      let regFirst = /^{{FIRST.*}}$/;  
      let regIndex = /^[+-][0-9]*$/; 

     if (d && obj.item)  { // Set items after load
         try {
         d=d.replace(/{{USER.([^}]*)}}/g, function (match, p1,offset, string) {return rxds.user.config?(rxds.user.config[p1]?rxds.user.config[p1]:""):""});
         } catch (e) {console.log(e);console.log(rxds.user);}
         if(obj.item.item_id=="470001222")
          {
            var qr_view = rxds.m.query_tracker[obj.query_id];
            if(qr_view)
            {
              let indexitem=qr_view.data.result.findIndex(v=>v.name=="All");
              if(indexitem>0)
              d = qr_view.data.result[indexitem].value;
            }
          }
        else if (d.match(/^`/)) {
           try{d=eval2(d.substr(1));} catch(e) {console.log("error setting default" + d); console.log(e);}
         }
         /*else if (d == "{{FIRST}}") {
           var qr = rxds.m.query_tracker[obj.query_id];
           if (qr.data.result[0] && qr.data.result[0].value) d = qr.data.result[0].value;
         }*/
         //Dhanajayan R - Denakaran observation - Start
         else if(d.match(regFirst)!==null)
         {
           let str=d;
           str=str.replace("{{FIRST","").replace("}}","");
           var qr = rxds.m.query_tracker[obj.query_id];
           if(str.match(regIndex)!==null)
            {
            	let val=parseInt(str);
            	if (qr.data.result[0] && qr.data.result[0].value)
            	{
            	  let resLen=(qr.data.result.length);
            	  let ind=val>=0 ? val : resLen+val;
            	  if(ind<=(resLen-1))
            	    d = qr.data.result[ind].value;
            	}
            }
           else
            {
                 if (qr.data && qr.data.result && qr.data.result[0] && qr.data.result[0].value) d = qr.data.result[0].value;
            }
         }
         
         if (h && h.set)
             h.set(k, obj, d);
         else
            $("#"+k).closest("form").form('set value',obj.config.name, d);
     }

    
  } //refresh 


  function dependent_handler(k, obj) {
    if(!obj) return;  //Udhay - To supress the console error when obj is undefined
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


  function resize$2(k) {
    window.dispatchEvent(new Event('resize'));
    var obj=rxds.page_controls[k],h=managers[obj.control_type];
    if (h && h.resize)
       h.resize(k,obj);
  }

  async function load$c(k,e) {
    var data;
    var dom_obj = $("#dimmer"+k);
    var obj=rxds.page_controls[k];
    var before_load = new Event('before_load');
    var before_query = new Event('before_query');
    var after_query = new Event('after_query');
    var after_load = new Event('after_load');
    obj.loaded=true;


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
    await refresh$9(k, obj, data,param);
    if (dom_obj.length>0) { 
      dom_obj[0].dispatchEvent(after_load);
      dom_obj.dimmer('hide');
    }// disable loader
  } //load

  function toJSON(data,sep){
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
                 if (qr.data.result && qr.data.result.length>0 &&qr.data.result[0].value) {
                   $("#"+k).dropdown('set selected',qr.data.result[0].value);
                   if (obj.config.action_code) {
                      var action_fn=new Function('value','text','obj', obj.config.action_code);
                      action_fn();
                    }
                    if (obj.dep_children) rxds.load_children(obj.dep_children);
                 }   
            }
        }
        obj.dependent_handler=false;
        if(rxds.app.app.branch.match("MASTER|QA|UI")) {
          //Udhay - to fix the conditinoal display issue if the value is being set inside item action code section using 'rxds.view' object
          rxds.conditional_regions_wrap();
        }
       },
      load: async function(k, obj, data) {
           var clearable = true;
           if (obj.config.required == "Y" || obj.multiselect != "Y") clearable = false;
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
                              );
                          }},
                          filterRemoteData: true,
                          localSearch: true,
                          minCharacters: 3,clearable: clearable,
                          saveRemoteData: true });
             } else if (Array.isArray(data) && data[0]) {
                  $("#"+k).dropdown({values: data,clearable: clearable});
             } 
             else if(Array.isArray(data) && !data.length) {
                  $("#"+k).dropdown({values: data,clearable: clearable});
             }
           }
           else $("#"+k).dropdown({clearable: clearable});
           //this.dependent_handler(k,obj,rxds.page_controls[k].children);
           obj.dependent_handler=false;
           /*
           $("#"+k).children("i.remove.icon").on('click', function(e){
        	  $(this).parent('.dropdown').dropdown('clear');
            e.stopPropagation();
          });
          */
        
      },  
      refresh: load$c,
      dependent_handler: function(k,obj,children) {
         //if (!obj.dep_handle_set) {
          // obj.dep_handle_set = true;
           $("#"+k).dropdown({
                onChange: function(value, text, $selectedItem) {
                  if (obj.config.action_code) {
                    var action_fn=new Function('value','text','obj', obj.config.action_code);
                    action_fn(value,text,obj);
                  }
                  if (rxds.app.page.config.reactive == "Y")
                      children=rxds.page_controls[k].children;
                   else //Pick only items
                      children=R.filter((i)=>i.match(/^item/),rxds.page_controls[k].children);
         
                  rxds.load_children(children,true,k);
                }
            });
         //} // dep_handle_set
      }
    };

      
    managers["datepicker"] = {
      set: function(k,obj,v) {
            //Udhay and Sriman - to update the datepicker hover functionality
            if(rxds.app.app.branch.match("MASTER|QA|UI"))
              $("#"+k).calendar({on:'click',type:'date'});
            else
              $("#"+k).calendar({on:'hover',type:'date'});
            $("#"+k).calendar('set date',v.toDate());         
          obj.dependent_handler=false;
      },
      get: function(k,obj) {
            //To return the value as string instead of date type
              var d=$("#"+k).calendar('get date');
              if (d)
                  return d.getFullYear() + "-" + ("0" + (d.getMonth()+1)).substr(-2) + "-" + ("0" + d.getDate()).substr(-2);
              else return d;
              //return $("#"+k).calendar('get date');   //Old code to return the value as it is as date type 
      },
      load: async function(k, obj, data) {
          var sDate,today = new Date(); 
          //Udhay and Sriman - to update the datepicker hover functionality
          if(rxds.app.app.branch.match("MASTER|QA|UI"))
              $("#"+k).calendar({ on:'click',type:'date'});
          else
              $("#"+k).calendar({ on:'hover',type:'date'});
           if (data) {
             //console.log("date calendar",data);
             sDate = Object.values(data[0])[0];
              $("#"+k).calendar('set date',sDate.toDate());         
             if (rxds.view && rxds.view.param) {
               rxds.view.param[obj.config.name] = sDate;    
             }
           }
           else {
              sDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              $("#"+k).calendar('set date',sDate);         
           }
          obj.dependent_handler=false;
        },
       refresh: load$c,
       dependent_handler: function(k,obj, children) {
         var changed=false;
         var datepicker_trigger_event = 'hover';
         //Udhay and Sriman - to update the datepicker hover functionality
         if(rxds.app.app.branch.match("MASTER|QA|UI")) {
           datepicker_trigger_event = 'click';
         }
         else {
           datepicker_trigger_event = 'hover';
         }
         $("#"+k).calendar({
              //on:'hover',
              on: datepicker_trigger_event,
              type:'date',
              onHidden: function () {
                if (changed) {
                      if (rxds.app.page.config.reactive == "Y")
                        children=rxds.page_controls[k].children;
                     else //Pick only items
                        children=R.filter((i)=>i.match(/^item/),rxds.page_controls[k].children);
                        
                    rxds.load_children(children,true,k);
                  }  
                  changed= false;
              },
              onChange: function(value, text, $selectedItem) {
                changed=true;
              }
          });
      }

    };
    
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
                                        console.log(e.target.value);
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
    };
    managers["switch"] = managers["checkbox"];
    managers["slider"] = managers["slider"];
    
    managers["Tabs Container"] = {
       load: async function(k, obj, data) {
         $("#"+k).find('.tabular.menu .item')
             .tab({context: 'parent',onVisible:function(t){
               window.dispatchEvent(new Event('resize'));
               var c=this.dataset.id;
               //updated by udhay to avoid the error when there is no config for the region in page_controls object
               if (rxds.page_controls[c] && rxds.page_controls[c].control_type=="Report")
                  rxds.page_controls[c].table.columns.adjust().draw();
             }});
       }   
    };
    
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
                                        console.log(e.target.value);
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
    };

    managers["Flip Container"] = {

      load: async function(k, obj, data) {
          var elem = $("#"+k+" .flipped");
          elem.click(function(){
            var s = $("#"+k).find(".ui.shape"); 
            s.shape({width:'next',height:'next'});
            s.shape('flip left');
          });
          
      }
    };  
    
    managers["buttongroup"] = {
      //get: function(k,obj) {return null}
      get:function(k,obj) {
          //return $("#"+k).find(".ui.checkbox input").filter((i,v)=>{return v.checked}).map((i,v)=>{return v.value}).get().join('|');
          //console.log("buttongroup get method:",k,obj);
          return $("#"+k).find("button.active").val();
      },
      set: function(k,obj,v) {
        //console.log("buttongroup set method", k,obj,v);
        if (v=="") {
            $("#"+k).find("button").removeClass('active');
        } else {
            $("#"+k).find("button").each((i,c)=>{
                if(c.value === v) {
                  $(c).addClass('active')
                    .siblings()
                    .removeClass('active');
                }
            });
        }
        var value = v;
        var text = v;
        if (obj.config.action_code) {
            var action_fn=new Function('value','text','obj', obj.config.action_code);
            action_fn(value,text,obj);
        }
        if (obj.dep_children) rxds.load_children(obj.dep_children);
      },           
      load: async function(k, obj, data) {
          //console.log("buttongroup load:", k, obj, data);
          if (data) {
            var vueChk = new Vue({
                el: "#"+k,
                data: {
                    rbs: data
                },
                methods: {
                  check: function(e) {
                    /*if (e.target.checked) {
                      console.log(e.target.value)
                    }*/
                  }
                }
            });
          }
          //to toggle between semantic grouped buttons
          $("#"+k).find(".button").on('click', function() {
            $(this)
              .addClass('active')
              .siblings()
              .removeClass('active');
          });
          var value = $("#"+k).find("button.active").val();
          var text = value;
          if (obj.config.action_code) {
              var action_fn=new Function('value','text','obj', obj.config.action_code);
              action_fn(value,text,obj);
          }
          if (obj.dep_children) rxds.load_children(obj.dep_children);
          this.dependent_handler(k,obj,rxds.page_controls[k].children);
      },
      dependent_handler: function(k,obj,children) {
         if (obj.dep_handle_set) return;
         //console.log("dependent_handler:",k,obj,children);
         $("#"+k).find("button").on("click", function(e){
            var value = $(this).val();
            var text = value;
            if (obj.config.action_code) {
                var action_fn=new Function('value','text','obj', obj.config.action_code);
                action_fn(value,text,obj);
            }
            rxds.load_children(children);
         });
         obj.dep_handle_set = true;
      }
    };  
    
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
            } else if (obj.config.action && obj.config.action.match(/Custom/)) {
                if (obj.config.action_code) {
                  var action_fn=new Function('value','text','obj', obj.config.action_code);
                  action_fn();
                }
            } else {
              rxds.load_regions();
            }
              return false;
          });
          
      }
    };  

    managers["hiddenitem"] = {
      get: function(k,obj) {
        return obj.value;
      },
      set: function(k,obj,v) {
        obj.value = v;
        if (obj.dep_children && obj.refresh_dep_children === true) {  //Udhay - load dependent regions if needed
          rxds.load_children(obj.dep_children);
        }
      },
      load: async function(k, obj, data) {
           if (data) {
               try {
               obj.value = data[0].name;
               } catch(e) {obj.value = 'Need one row with name column';}
           }
           else obj.value = "";
           //if (obj.dep_children) rxds.load_children(obj.dep_children);
      },  
      refresh: load$c
    };


  /******* Udhay - Custom Functions *********/
  //to show and hide items
  function toggle_item_visibility(name, visibility) {
      if(name === undefined || visibility === undefined) {
          console.log("The function requires two parameters!");
          console.log("1st parameter(string) -> unique item name");
          console.log("2nd parameter(string) -> 'show' or 'hide'");
          return;
      }
      let id = Object.keys(rxds.page_controls).find(v => rxds.page_controls[v].config.name === name);
      if(id) {
          let cont_type,item,help_desc;
          cont_type = rxds.page_controls[id].control_type;
          item = $(".rxds_item[data-item=" + id + "]");
          help_desc = $(".rxds_item_help[data-item=" + id + "]");
          if(visibility === "show"){
              item.show();
              help_desc.show();
          } else if(visibility === "hide"){
              item.hide();
              help_desc.hide();
          }
      } else {
          console.log("No item found with given name!");
      }
  }

  //Update item label
  function update_item_label(name, new_label) {
      if(name === undefined || new_label === undefined) {
          console.log("The function requires two parameters!");
          console.log("1st parameter(string) -> Unique item name");
          console.log("2nd parameter(string) -> New label for the item");
          return;
      }
      let id = Object.keys(rxds.page_controls).find(v => rxds.page_controls[v].config.name === name);
      if(id) {
          let cont_type,item,label,curr_label,help,new_help,help_desc,new_help_desc;
          cont_type = rxds.page_controls[id].control_type;
          item = $(".rxds_item[data-item=" + id + "]");
          label = item.find("label.label");
          curr_label = label.html();
          help = item.find(".item_help");
          help_desc = $(".rxds_item_help[data-item=" + id + "]");
          
          label.html(new_label);  //updating label

          if(help.length) {
              new_help = help.attr("data-html")
                  .replace(curr_label,new_label)
                  .replace(curr_label.toLowerCase(),new_label.toLowerCase());

              help.attr("data-html",new_help);    //Updating help text
          }
          if(help_desc.length) {
              new_help_desc = help_desc.html()
                  .replace(curr_label,new_label)
                  .replace(curr_label.toLowerCase(),new_label.toLowerCase());
              
              help_desc.html(new_help_desc);      //Updating help Description
          }
          
      } else {
          console.log("No item found with given name!");
      }
  }

  //to update region title along with region help title 
  function update_region_title(reg_name, new_title_obj, param) {
      if(reg_name === undefined || new_title_obj === undefined) {
          console.log("The function requires at least two parameters!");
          console.log("Help!");
          console.log("Currently Supports Tab Conntainer, Plugin, eChart and Report Regions!");
          console.log("1st parameter(string) -> unique region name to idenntify the region");
          console.log("2nd parameter(string) -> new title as string");
          console.log("2nd parameter(object) -> if 2nd parameter is an object, you must pass third parameter");
          console.log("3rd parameter(string) -> parameter name which is linked to the item to map the title with parameter value");
          return;
      }

      let id = Object.keys(rxds.page_controls).find(v => rxds.page_controls[v].config.name === reg_name);
      let param_val = param ? rxds.m.get_param(param) : "";
      if(id) {
          let cont_type,tab_cont,region,title_elem,help_elem,old_title,new_title;
          
          if(new_title_obj.constructor === String)   new_title = new_title_obj;
          else if(new_title_obj.constructor === Object && param)   new_title = new_title_obj[param_val];
          else {
              console.log("3rd parameter is required, if the 2nd parameter is an object");
              return;
          }
          
          cont_type = rxds.page_controls[id].control_type;
          region = $(".rxds_region[data-region=" + id + "]");
          tab_cont = region.parents(".rxds_region.tab-container");
          //region = $("#"+id);
          help_elem = $(".rxds_region_help[data-region=" + id + "]").find(".region-title");
          
          if(tab_cont.length && cont_type !== "Tabs Container") {
              let tab_title_elem,tab_segment,new_title_text;
              tab_title_elem = tab_cont.find(".rxds_tab_menu[item-tab-region=" + id + "]");
              tab_segment = tab_cont.find(".tab-segment[data-id=" + id + "]");
              new_title_text = $("<span>" + new_title + "</span>").text();
              old_title = tab_title_elem.find(".tab-title").html();
              tab_title_elem.find(".tab-title").html(new_title);
              tab_title_elem.attr("data-tab-title",new_title_text);
              tab_segment.attr("data-tab-title",new_title_text);
          } else {
              switch(cont_type) {
                  case "Plugin": {
                      //region = region.parents(".rxds_region[data-region=" + id + "]");
                      break;
                  }
                  default: {
                      //title_elem = region.find(".region-title:first");
                  }
              }
              title_elem = region.find(".region-title:first");
              old_title = title_elem.html();
              title_elem.html(new_title);     //updating title
          }

          help_elem.html(new_title);      //updating help description title
          rxds.page_controls[id].config.title = new_title;    //updating title innside region config object
          return old_title + " -> " + new_title;
      } else {
          console.log("No region found with given name!");
      }
  }

  //to add dropdowns inside the regions
  function add_secondary_dropdown(obj, param) {
      if(obj === undefined || obj.config === undefined || param.parameter === undefined || param.lovs === undefined) {
          let dropdownConfig = {
              label: "Dropdown Label",
              parameter: "PARAMETER",
              lovs: ["value1","value2","value3"],
              default: "value2",
              append_to: "region4720999-dropdown1",
              width: "250px",
              show_label: true,
              label_font_weight: "bold"
          };
          console.log("The function requires two parameters!");
          console.log("Help!");
          console.log("Currently Supports eChart Region only!");
          console.log("1st parameter(Object) -> region object (obj)");
          console.log("2nd parameter(Object) -> Object with dropdown configurations");
          console.log("Required: parameter, lovs");
          console.log("Optional: label, default, append_to, show_label, label_font_weight, width");
          console.log("Example (1) Object: ", dropdownConfig);
          dropdownConfig.lovs = ["dis_val1:ret_val1","dis_val2:ret_val2","dis_val2:ret_val2"];
          console.log("Example (2) Object: ", dropdownConfig);
          console.log("'lovs' can be an 'Array' or 'comma separated String'");
          return;
      }

      if(obj.control_type === "Chart eChart") {
          let dropdown_label = param.label || "";
          let dropdown_name = obj.config.name + "-" + dropdown_label.replace(/\s|\//g,"-") + "-dropdown";
          let parameter = param.parameter;
          let append_to = param.append_to;
          //let display_values = param.lovs.toString().split(",").map(v => v.split(":")[0]);
          //let return_values = param.lovs.toString().split(",").map(v => ( v.split(":")[1] ? v.split(":")[1] : v.split(":")[0]));
          let display_values;
          let return_values;
          
          if(param.lovs.constructor === String) {
              param.lovs = param.lovs.replace(/"/g,"\"");
              display_values = param.lovs.split(",").map(v => v.split(":")[0]);
              return_values = param.lovs.split(",").map(v => ( v.split(":")[1] ? v.split(":")[1] : v.split(":")[0]));
          } else {
              param.lovs = param.lovs.map(v => v.replace(/\"/g,"\""));
              display_values = param.lovs.map(v => v.split(":")[0]);
              return_values = param.lovs.map(v => ( v.split(":")[1] ? v.split(":")[1] : v.split(":")[0]));
          }
          
          let param_value = rxds.m.get_param(parameter);
          let def_val = param_value || param.default || return_values[0];
          let show_label = param.show_label || false;

          //dropdown string temoplate
          let label = show_label ? dropdown_label : "";
          let label_font_weight = param.label_font_weight ? ('style="font-weight:' + param.label_font_weight + '"') : "";
          let dropDownElem = `<div id=${dropdown_name}><span ${label_font_weight}>${label}</span><select name=${dropdown_name}></select></div>`;
          let dropDownElemDom = $(dropDownElem);
          
          $(dropDownElemDom).css("padding-bottom","8px");
          $(dropDownElemDom).find("select").css("margin-left","10px");
          if(param.width) 
              $(dropDownElemDom).find("select").css("width",param.width);

          display_values.forEach((v,i) => {   //Adding options
              let selected = (def_val === v ? "selected=selected" : "");
              let opt =  `<option value="${return_values[i]}" ${selected}>${v}</option>`;
              $(dropDownElemDom).find("select").append(opt);
          });
          
          //Appending to DOM
          $("#" + dropdown_name).remove();
          if(append_to)   $("#" + append_to).append(dropDownElemDom);
          else    $(obj.dom).before(dropDownElemDom);

          $("#" + dropdown_name).find("option[value='" + def_val + "']").attr("selected",true);   //setting default value

          //onChange function
          $("#" + dropdown_name).find("select").on("change", function() {
              rxds.m.set_param(parameter,this.value,true);
          });

      } else {
          console.log("This function does not Support regions other than eCharts");
      }
  }
  /******* End of Custom Functions *********/
    
       
  var manager ={};
  manager.load = load$c;
  manager.get = get$9;
  manager.managers = managers;
  manager.refresh = refresh$9;
  manager.query_tracker = query_tracker;
  manager.dependent_handler = dependent_handler;
  manager.fetchAsync = fetchAsync;
  manager.postPageView = postPageView;
  manager.load_views = load_views;
  manager.load_view = load_view;
  manager.get_parameters = get_parameters;
  manager.get_param = get_param$6;
  manager.fetchCore = fetchCore;
  manager.resize = resize$2;
  manager.util = util;
  manager.reset_filter = reset_filter$6;
  manager.set_param = set_param;
  manager.set = set$2;
  manager.find = find;
  manager.find_dom = find_dom;
  manager.find_obj = find_obj;

  manager.toggle_item_visibility = toggle_item_visibility;
  manager.update_item_label = update_item_label;
  manager.update_region_title = update_region_title;
  manager.add_secondary_dropdown = add_secondary_dropdown;

  var user;//Holds the User Object
  var gDebug = true;
  var env="client";
  exports.gQueryString = {};
  var m=manager;
  var promise_arr= {};

  async function get_user() {
      /* if(localStorage.getItem("rxds-user") != null){
        rxds.user = JSON.parse(localStorage.getItem("rxds-userg"));
      }else{ */
        let data = await $.get("/whoami");
        if (data && data.email) {
              localStorage.setItem("rxds-user",JSON.stringify(data));
              rxds.user = data;
              if (rxds.user.userAppRoles) {
                  rxds.user.appRoles=":"+rxds.user.userAppRoles.split(/\:/).filter(v=>v.match(rxds.app.app.url+",")).map(v=>v.split(/,/)[1]).join(":")+ ":";
              }
        } else {
            console.log("/whoami Exception:" + data);
            rxds.user = {name:"unknown",email:"unavilable",userRoles:"none"};
        }
      //}
      //$("#rxuser").html(rxds.user.name);
      $("#rxuser").html("<i class='user circle icon color-blue'></i><strong>" + rxds.user.name + "</strong>");  //Modified for dark UI
      if (rxds.app.config.develop == "Y" && 
           rxds.user.userRoles.indexOf("AB-Developer") >= 0 ) {
              if (rxds.app.app.branch == "MASTER") {
               $("#dev_bar").show();load_develop_controls();
              } else {
                $("#username").click(function() {$("#dev_bar").show();load_develop_controls();});
              }   
           }
      else if (typeof develop !== "undefined" && develop.style) {develop.style.visibility="hidden";}
  }  //get_user


  function launch_tour() {
    if (!rxds.tour) {
      rxds.tour = new Shepherd.Tour({
            defaults: {
              classes: 'shepherd-theme-arrows',
              scrollTo: true
            }
          });
          
      rxds.tour.addStep('first', {
        title: 'Device Info',
        text: 'General device identification data appears on the left ...',
        attachTo: {element: '.item.help', on: 'top left' },
        scrollTo: false
    });

    const t=JSON.parse(rxds.app.page.config.page_tour);
    Object.keys(t).forEach(v=>{
      rxds.tour.addStep('step-'+v, {
          title: 'Device Info', text: t[v],
          attachTo: {element: document.getElementById(v), on: 'top left'}
        });
     });
    }
     rxds.tour.start();
  }

  function load_feedback() {
    //const feedback_url="https://feedback.rxdatascience.com/ords/f?p=1300:1:::::P1_HOST,P1_APP_NAME,P1_PAGE_NAME,P1_REPORTED_BY,P1_PATH,P1_ORIGIN,P1_APP_URL,P1_VIEW:";
    const feedback_url="https://feedback.rxdatascience.com/ords/f?p=1300:1:::NO:RIR,RP,1:P1_HOST,P1_APP_NAME,P1_PAGE_NAME,P1_REPORTED_BY,P1_PATH,P1_ORIGIN,P1_APP_URL,P1_VIEW:";
    const variables=location.host+","+rxds.app.app.name + ","+rxds.app.page.page.page_title+","+rxds.user.name.replace(" ","")+","+location.pathname+","+location.origin.replace("https://","")+","+location.href.replace("https://","")+","+(rxds.view?rxds.view.md5_hash:"");
    
  //  console.log(feedback_url+variables);
    window.open(feedback_url+variables, "_blank", "");
  }
  function  removeElem(arr, elem) {
     return arr.filter(v=>{return v!== elem}); 
  }
  function secure_page() {
      var authRoles=rxds.app.page.auth_roles;
      const userRoles = rxds.user.userAppRoles?rxds.user.userAppRoles.split(/:/):'ALL';
      
      if (authRoles && authRoles  != "" && !authRoles.match(/ALL/) ) {
          const authArr = authRoles.split(/:/).map(v=>rxds.app.app.url+","+v);
          let intersection = authArr.filter(x => userRoles.includes(x));
          if (intersection.length == 0) {
              if (rxds.is_home) { // Home page try to find first open page available
                let p=rxds.app.pages;
                var ind;
                for (ind=1;ind<p.length;ind++) {
                   var pageRole=p[ind].auth_roles;
                   if (!pageRole || pageRole.match(/ALL/)) break;
                   const pauthArr = pageRole.split(/:/).map(v=>rxds.app.app.url+","+v);
                   let pinter = pauthArr.filter(x => userRoles.includes(x));
                   if (pinter.length>0) break;
                }
                if (ind == p.length)
                  {document.open();document.write("Not Authorized");document.close();}
                else {window.location.replace(window.location.href+p[ind].page.page_name+"/");}
              } else {
              document.open();document.write("Not Authorized");document.close();
              }
          }
      }

      $(".page_link").each(function( index ) {
          var authRoles=this.dataset.roles;
          if (authRoles&&!authRoles.match(/ALL/)) {
              const authArr = authRoles.split(/:/).map(v=>rxds.app.app.url+","+v);
              let intersection = authArr.filter(x => userRoles.includes(x));
              //console.log(intersection);
              if (intersection.length == 0) {
                  $( this ).hide();
                  $( this ).addClass("page_link_hidden");
                  $( this ).removeClass("page_link");
              }
          }   
        });

      $(".parent_menu").each(function( index ) {
              var child_count=$(this).next(".content").find(".page_link").length;
               if (child_count == 0) {$( this ).hide();}
      });

      $(".app_link").each(function( index ) {
          var appURL=':'+this.dataset.value+':';
          const userApps=':'+rxds.user.userApps+':';
          if (!userApps.match(appURL)) {
              $( this ).hide();
          }
        });

      $(".rxds_region").each(function( index ) {
          var authRoles=this.dataset.roles;
          if (authRoles&&!authRoles.match(/ALL/)) {
              const authArr = authRoles.split(/:/).map(v=>rxds.app.app.url+","+v);
              let intersection = authArr.filter(x => userRoles.includes(x));
              //console.log(intersection);
              if (intersection.length > 0) {
                  $( this ).show();
              }
              else { // Region not shown for the current user. Remove
                let r = this.dataset.region;
                $(".rxds_region_help[data-region=" + r + "]").remove();   //to remove the help descriptions for removed regions
                $(".rxds_tab_menu[item-tab-region=" + r + "]").remove();  //to remove the tab-menu from tab container if any
                delete rxds.page_controls[r];
                let pc=rxds.page_controls;
                Object.keys(pc).forEach(v=>{let i=pc[v];
                    if (i.children) i.children=removeElem(i.children,r);
                    if (i.child_regions) i.child_regions=removeElem(i.child_regions,r);
                    if (i.dependent_items) i.dependent_items=removeElem(i.dependent_items,r);
                    if (i.dependent_regions) i.dependent_regions=removeElem(i.dependent_regions,r);
                });
              }
          }   
        });
      $(".rxds_item").each(function( index ) {
          var authRoles=this.dataset.roles;
          if (authRoles&&!authRoles.match(/ALL/)) {
              const authArr = authRoles.split(/:/).map(v=>rxds.app.app.url+","+v);
              let intersection = authArr.filter(x => userRoles.includes(x));
              //console.log(intersection);
              if (intersection.length > 0) {
                  $( this ).show();
              }
              else { // Region not shown for the current user. Remove
                let r = this.dataset.item;
                $('.rxds_item_help[data-item="'+r+'"]').hide();   //to hide the help descriptions for hidden items 
                delete rxds.page_controls[r];
                let pc=rxds.page_controls;
                Object.keys(pc).forEach(v=>{let i=pc[v];
                    if (i.children) i.children=removeElem(i.children,r);
                    if (i.dependent_items) i.dependent_items=removeElem(i.dependent_items,r);
                });
              }
          }   
        });
        
  } //secure_page

  function ready(page_id) {
    
    //Added for dark UI
    rxds.hasDarkTheme = true;   //Flag to identify the existance of dark mode
    rxds.theme_mode = "light";  //Flag to identify the current app theme mode (dark or light)
    
    // Added for AG Grid Dark-Light Mode Toggle
    
    if ($("body").find("[class^=ag-theme]").length > 0){
      rxds.hasAGGrid = true;
    } else {
      rxds.hasAGGrid = false;
    }

    if(localStorage.getItem("mode")=="light"){
      $("#darkModeLabel").html("Dark Mode");
      $("#darkModeToggle").prop("checked",false);
      body.className = "light-mode pushable";
      rxds.theme_mode = "light";
      
      /* FOR AG GRID THEME */
      
      if (rxds.hasAGGrid){
        if($("body").find("[class^=ag-theme]").attr("class") == 'ag-theme-balham'){
          $("body").find("[class^=ag-theme]").attr("class",$("body").find("[class^=ag-theme]").attr("class").replace("ag-theme-balham","ag-theme-balham"));  
        }
        else if($("body").find("[class^=ag-theme]").attr("class") == 'ag-theme-balham-dark'){
          $("body").find("[class^=ag-theme]").attr("class",$("body").find("[class^=ag-theme]").attr("class").replace("ag-theme-balham-dark","ag-theme-balham"));
        }
      }
      
      if( rxds.app.config.theme == 'alnylam' ) {
        var alnylamSrc = $(".item.logo.vertically.fitted > img").attr("src");
        $(".item.logo.vertically.fitted > img").attr("src",alnylamSrc.replace("alnylam-50px.png","alnylam-50px.png"));
        
        var copyrightSrc = $("#copyright > img").attr("src");
        $("#copyright > img").attr("src",copyrightSrc.replace("RXDSLogoOnWhite-SVG.svg","RXDSLogoOnWhite-SVG.svg"));
      }
      else if( rxds.app.config.theme.match(/demo|springWorks/)) {
          var logoSrc = $(".item.logo.vertically.fitted > img").attr("src");
          if(rxds.app.config.theme == 'demo')
            $(".item.logo.vertically.fitted > img").attr("src",logoSrc.replace("RXDSLogoOnWhite-SVG-White.svg","RXDSLogoOnWhite-SVG.svg"));
          else if(rxds.app.config.theme == 'springWorks')
            $(".item.logo.vertically.fitted > img").attr("src",logoSrc.replace("LogoWhite","Logo"));
          var copyrightSrc = $("#copyright > img").attr("src");
          $("#copyright > img").attr("src",copyrightSrc.replace("RXDSLogoOnWhite-SVG-White.svg","RXDSLogoOnWhite-SVG.svg"));
        }
      
      rxds.app.config.echart_theme = "macarons";
    }
    
    else if(localStorage.getItem("mode")=="dark"){
      $("#darkModeLabel").html("Light Mode");
      $("#darkModeToggle").prop("checked",true);
      body.className = "dark-mode pushable";
      rxds.theme_mode = "dark";
      
      /* FOR AG GRID THEME */
      /* var agGridTheme = $("body").find("[class^=ag-theme]").attr("class"); */
      
      if(rxds.hasAGGrid){
        if($("body").find("[class^=ag-theme]").attr("class") == 'ag-theme-balham'){
          $("body").find("[class^=ag-theme]").attr("class",$("body").find("[class^=ag-theme]").attr("class").replace("ag-theme-balham","ag-theme-balham-dark"));  
        }
        else if($("body").find("[class^=ag-theme]").attr("class") == 'ag-theme-balham-dark'){
          $("body").find("[class^=ag-theme]").attr("class",$("body").find("[class^=ag-theme]").attr("class").replace("ag-theme-balham-dark","ag-theme-balham-dark"));
        }
      }
      
      
      if( rxds.app.config.theme == 'alnylam') {
        var alnylamSrc = $(".item.logo.vertically.fitted > img").attr("src");
        $(".item.logo.vertically.fitted > img").attr("src",alnylamSrc.replace("alnylam-50px.png","alnylam-50px-white.png"));
        
        var copyrightSrc = $("#copyright > img").attr("src");
        $("#copyright > img").attr("src",copyrightSrc.replace("RXDSLogoOnWhite-SVG.svg","RXDSLogoOnWhite-SVG-White.svg"));
      }
      else if( rxds.app.config.theme.match(/demo|springWorks/)) {
          var logoSrc = $(".item.logo.vertically.fitted > img").attr("src");
          if(rxds.app.config.theme == 'demo')
            $(".item.logo.vertically.fitted > img").attr("src",logoSrc.replace("RXDSLogoOnWhite-SVG.svg","RXDSLogoOnWhite-SVG-White.svg"));
          else if(rxds.app.config.theme == 'springWorks')
            $(".item.logo.vertically.fitted > img").attr("src",logoSrc.replace("Logo","LogoWhite"));
          var copyrightSrc = $("#copyright > img").attr("src");
          $("#copyright > img").attr("src",copyrightSrc.replace("RXDSLogoOnWhite-SVG.svg","RXDSLogoOnWhite-SVG-White.svg"));
        }
      
      rxds.app.config.echart_theme = "dark";
    }
    /*-------------------------------------------------------------------*/
    
    rxds.stats = {page_load:new Date(),start_time:new Date()};             
    rxds.app.page = R.filter(function(i){return i.page.page_id===page_id})(rxds.app.pages)[0];
    rxds.reqID = decodeURIComponent(document.cookie.replace(/(?:(?:^|.*;\s*)reqID\s*\=\s*([^;]*).*$)|^.*$/, "$1"));

    //rxds.is_home = window.location.pathname.split('/').length===4;
    rxds.is_home = rxds.app.pages[0].page.page_id == rxds.app.page.page.page_id;
    
    ////Added for dark UI
    // Change Alnylam Logo Based on rxds.is_home
    var homePageIconURL,vendorDir; 
    
    if ( rxds.is_home ) {
      homePageIconURL = "./vendor/semantic/themes/bootswatch/";
      vendorDir = "./vendor/";
    }
    else {
      homePageIconURL = "../vendor/semantic/themes/bootswatch/";
      vendorDir = "../vendor/";
    }
    
    if ( rxds.app.config.theme == 'alnylam') {
      $("a.item.logo>i").css('background-image',"url('"+homePageIconURL+"alnylam-50px.png')");
    }
    else if(rxds.app.config.theme == 'springWorks'){
      $("a.item.logo>i").css('background-image',"url('"+vendorDir+"rxds/img/"+"springWorks-Logo.png')");
    }
    else if(rxds.app.config.theme == 'bms'){
      $("a.item.logo>i").css('background-image',"url('"+vendorDir+"rxds/img/"+"bms-logo.svg')");
    }
    else {
      $("a.item.logo>i").css('background-image',"url('"+homePageIconURL+"RXDSLogoOnWhite-SVG.svg')");
    }
    /*-------------------------------------------------------------------*/
    
    rxds.db_path = rxds.is_home ? "db/":"../db/";
    rxds.vendor = rxds.is_home ? "vendor/":"../vendor/";
    rxds.load_completed=false;
    rxds.page_init=true;
    rxds.cache_dataset_id = rxds.app.page.config.cache_dataset_id?rxds.app.page.config.cache_dataset_id:rxds.app.config.cache_dataset_id;
    // Build Query String Array
    get_user().then(s=>{
      var search = location.search.substring(1);
      secure_page();
      exports.gQueryString = search?JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}',
                   function(key, value) { return key===""?value:decodeURIComponent(value) }):{};
      $(".item.help").click(v=>{$('.ui.modal.help').modal('show');});
      $(".item_help").on("click", function() {    //Udhay - to open help popup when click on the item help icons
        $('.ui.modal.help').modal('show');
        $("#help_" + $(this).parents("form").attr("id").replace("region",""))[0].scrollIntoView();
      });
      $(".region_help").click(v=>{$('.ui.modal.help').modal('show');document.getElementById("help_"+ v.target.dataset.region_id).scrollIntoView();});
      $(".menu .tour").click(v=>{launch_tour();});
      $(".menu .views").click(v=>m.load_views());
      $('.ui.item.powerpoint.dropdown').dropdown();
      $('.ui.item.switch_app.dropdown').dropdown();
      $(".item .app_link").click(v=>rxds.load_app(v));
      $("#pptdata").click(v=>rxds.generate_ppt(true));
      $("#pptnodata").click(v=>rxds.generate_ppt(false));
      $(".menu .feedback").click(v=>rxds.load_feedback());
      if (rxds.gQueryString.view)
         m.load_view().then(v=>load$d());
      else load$d();             
    });
               
  } // ready

  function dependent_load(depend_list) {
      if (!rxds.load_completed &&  !rxds.conditional_regions) {
        const dlist=depend_list.filter(v=>{return v.match(/^item/)});
        if (dlist.length == 0) {
          Promise.all(Object.values(promise_arr))
               .then( (v) => {conditional_regions();rxds.conditional_regions=true;dependent_load(depend_list);});
          return;
          }
      }
      var pc=rxds.page_controls;
      depend_list=depend_list.filter(v=>{return pc[v]});
      var toFire = R.reject(i=>pc[i].fired,depend_list);
      var promise_keys = Object.keys(promise_arr);
      
      var isReadyToFire = i => R.intersection(pc[i].dependent_items,promise_keys).length == pc[i].dependent_items.length;
      var readyToFire = R.filter(isReadyToFire,toFire);
      var item_list = Object.keys(rxds.page_controls).filter(v=>v.match(/^item/)&&rxds.page_controls[v].loaded == undefined);

          if ((item_list.length == 0) && (toFire.length == 0) && (!rxds.load_completed)) {
            rxds.load_completed = true;
            Promise.all(Object.values(promise_arr))
                   .then( (v) => load_complete(v));
                   
          }
      
      //Fire after resolving dependent promises
      readyToFire.forEach(
          (k) => {
              var prom = R.map(i=>promise_arr[i],pc[k].dependent_items);
              pc[k].fired=true; 
              Promise.all(prom)
                          .then( (values) => { 
                                  if (pc[k]) {
                                    promise_arr[k] = manager.load(k);
                                    dependent_load(pc[k].children);
                                  }  
                          })
                          .catch(  (reason) => {console.log(reason);} );
              }
      );
  }

  function load_app(evt) {
    let obj=evt.currentTarget;
    let app=obj.dataset.value;
    if (rxds.is_home)
        window.location.href="../"+app+"/";
    else     
        window.location.href="../../"+app+"/";
  }

  function load_complete() {
    var pc=rxds.page_controls;
    var pc_keys = Object.keys(pc);
    var parents = R.reject(i => {return pc[i].children.length == 0}, pc_keys);
    parents.forEach( (k) => manager.dependent_handler(k,pc[k]) );

    //Replace title
    $(".bindItem").each(function(){
        const v=rxds.m.get_param($(this).data("item"));
        if (v) $(this).html( v.replaceAll("_"," ")  );
    });
    rxds.stats.end_time = new Date();
    rxds.stats.elapsed = rxds.stats.end_time - rxds.stats.start_time;

    manager.postPageView();
    if (rxds.page_init) {
      //form validation
      $('.rxds_form').form({
         on: 'change',
         fields:rxdsClient.genValJsonStr(rxds.page_controls),
         inline: true
      }); // end of form validation
    
      try{
        if (rxds.app.page.config.page_onload) {
          rxds.load_fn=new Function('rxds', 'first_load', rxds.app.page.config.page_onload);
          rxds.load_fn(rxds, true);        
        }
      }catch(e){}
      rxds.page_init=false;
      
    }
    else {
        if (rxds.app.page.config.page_onload) {
          rxds.load_fn(rxds,false);
        }  
    }
    console.log("Triggering timestamp");
    console.timeStamp('Page Loaded'); //Help with chromium to trigger screenshot
  }


  function del_div(sel)  {
      var elements = document.querySelectorAll(sel);
      for(var i=0; i< elements.length; i++){
          elements[i].parentNode.removeChild(elements[i]);
      }
  }

  function hide_header_footer() {
  let div_selector_to_remove= ".ui.top.fixed.menu";
  del_div(div_selector_to_remove);
  develop.style.visibility="hidden";
  }


  //Function for downloading power point
  function generate_ppt(include_data) {
   var isDarkMode = localStorage.getItem("mode") == "dark" ? true : false;
     var noDataLocMessage = "No Data to Display";
     if (rxds.app.config.language === "JP")
         noDataLocMessage = "この選択に対してデータは返されませんでした";
   
     //showing all charts
     var pc = rxds.page_controls;
     Object.keys(pc)
         .filter((v) => pc[v].control_type === "Tabs Container")
         .forEach((v) => {
             $("#" + v + " .ui.bottom.attached.tab.segment.active").addClass(
                 "keep-me-visible"
             );
             $("#" + v + " .ui.bottom.attached.tab.segment")
                 .addClass("active")
                 .each(function () {
                     let currTabArea = $(this).data("id");
                     if ((rxds.page_controls[currTabArea] && rxds.page_controls[currTabArea].control_type === "Report")) {
                         window.dispatchEvent(new Event("resize"));
                         rxds.page_controls[currTabArea].table.columns.adjust().draw();
                     }
                 });
         });
   
     //create actual ppt object
     function createPPT() {
         var pptx = new PptxGenJS();
         pptx.setLayout("LAYOUT_WIDE");
         pptx.defineSlideMaster({
             title: "MASTER_SLIDE",
             bkgd: "FFFFFF",
             objects: [
                 {
                     text: {
                         text: "RxDataScience Inc.   |",
                         options: {
                             x: 10.8,
                             y: 0.1,
                             fontFace: "Helvetica",
                             fontSize: 14,
                             color: "1A3C65"
                         }
                     }
                 },
                 {
                     text: {
                         text:
                             "Legal Notice: The material located in this file is highly sensitive. Do not forward.",
                         options: {
                             x: 3.9,
                             y: 7.2,
                             fontFace: "Helvetica",
                             fontSize: 10,
                             color: "1A3C65"
                         }
                     }
                 },
                 {
                     image: {
                         x: 11.2,
                         y: 6.9,
                         w: 1.83,
                         h: 0.45,
                         path: rxds.vendor + "/rxds/img/rxdsdark2.png"
                     }
                 }
             ],
             slideNumber: {
                 x: 12.8,
                 y: 0.1,
                 fontFace: "Helvetica",
                 fontSize: 14,
                 color: "1A3C65"
             }
         });
         var slide = pptx.addNewSlide("MASTER_SLIDE");
         /*
             slide.addText(rxds.app.app.name + ' ' + rxds.app.page.config.title, { x:2.4, y:3.6, fontSize:34, color:'1A3C65', fontFace:'Calibri(Body)' });
             slide.addText(rxds.app.app.name + ' ' + rxds.app.page.page.parentmenu.trim() + ' ' + rxds.app.page.config.title, { x:2.4, y:3.6, fontSize:34, color:'1A3C65', fontFace:'Calibri(Body)' });
             */
   
         var app_name = rxds.app.page.config.title.includes(rxds.app.app.name)
             ? ""
             : rxds.app.app.name;
         slide.addText(
             app_name +
             " " +
             rxds.app.page.page.parentmenu.trim() +
             " " +
             rxds.app.page.config.title,
             {
                 x: 2.4,
                 y: 3.6,
                 fontSize: 34,
                 color: "1A3C65",
                 fontFace: "Calibri(Body)"
             }
         );
   
         /*
           @author neha
           This code is commented to replace it sorting function using region.region_seq object. Please note that not all pages have that available. Please donot push this code to prod without proper QA.
           In case of issues, uncomment this block.
          
           Object.keys(pc).filter(v=>(pc[v].control_type==="Chart eChart")||(pc[v].control_type==="Chart G2")||(pc[v].control_type==="Plugin")||(pc[v].control_type==="Report" && pc[v].config.include_in_ppt === "Y")||(pc[v].control_type==="Report" && pc[v].config.include_in_ppt === "N" && include_data)||(pc[v].control_type==="Form" && pc[v].config.include_in_ppt === "Y")).forEach(v=>{
            
             */
         /* Sort code */
         var arrListOfRegs = Object.keys(pc).filter(
             (v) =>
                 pc[v].control_type === "Chart eChart" ||
                 pc[v].control_type === "Chart G2" ||
                 (pc[v].control_type === "Plugin" &&
                     pc[v].config.include_in_ppt !== "N") ||
                 (pc[v].control_type === "Report" &&
                     pc[v].config.include_in_ppt === "Y") ||
                 (pc[v].control_type === "Report" &&
                     pc[v].config.include_in_ppt === "N" &&
                     include_data) ||
                 (pc[v].control_type === "AG Grid" &&
                     pc[v].config.include_in_ppt === "Y") ||
                 (pc[v].control_type === "AG Grid" &&
                     pc[v].config.include_in_ppt === "N" &&
                     include_data) ||
                 (pc[v].control_type === "Form" && pc[v].config.include_in_ppt === "Y")
         );
   
         function regionSort(listOfReg) {
             var done = false;
             while (!done) {
                 done = true;
                 for (var i = 1; i < listOfReg.length; i += 1) {
                     if (
                         pc[listOfReg[i - 1]].region.region_seq >
                         pc[listOfReg[i]].region.region_seq
                     ) {
                         done = false;
                         var tmp = listOfReg[i - 1];
                         listOfReg[i - 1] = listOfReg[i];
                         listOfReg[i] = tmp;
                     }
                 }
             }
   
             arrListOfRegs = listOfReg;
         }
   
         if (pc[arrListOfRegs[0]].region && pc[arrListOfRegs[0]].region.region_seq) {
             regionSort(arrListOfRegs);
         }
         arrListOfRegs.forEach((v) => {
             /* end */
             // try {
   
             var title, imgHeight, imgWidth, img, qid, res, da;
             var imgX = 1.1;
             var imgY = 1.9;
             //to hide scatter echarts with animation
             if (pc[v].options && pc[v].options.baseOption) return;
             if (pc[v].control_type === "Chart G2") {
                 title = $("#" + v)
                     .parent()
                     .find(".ui.menu .ui.header")
                     .text(); //pc[v].config.title;
   
                 if (title === "") {
                     title = $("#" + v)
                         .parent()
                         .parent()
                         .attr("data-tab-title");
                     //.attr("data-tab");
                 }
                 if (!title) {
                     title = pc[v].config.title;
                 }
                 if (title.includes("{")) {
                     title = rxds.replace_params(title);
                 }
                 title = title.replace(/\s+/g, " ").trim();
   
                 if (
                     $("#" + v)
                         .parent()
                         .is(".one,.two,.three,.four,.five,.six")
                 ) {
                     imgHeight = pc[v].chart._attrs.height / 60;
                     imgWidth = pc[v].chart._attrs.width / 60;
                 } else if (
                     $("#" + v)
                         .parent()
                         .is(".seven,.eight,.nine,.ten,.eleven,.twelve")
                 ) {
                     imgHeight = pc[v].chart._attrs.height / 80;
                     imgWidth = pc[v].chart._attrs.width / 80;
                     if (imgHeight > 5.5) {
                         imgHeight = pc[v].chart._attrs.height / 110;
                         imgWidth = pc[v].chart._attrs.width / 110;
                     }
                 } else {
                     imgHeight = 5; //chart.getHeight()/45;
                     imgWidth = 14.34; //chart.getWidth()/45;
                     imgX = -0.7;
                 }
                 if (!isDarkMode) {
                     img = pc[v].chart.toDataURL();
                 } else {
                     let canvas = pc[v].chart._attrs.canvas._cfg.canvasDOM;
                     let context = canvas.getContext("2d");
                     var w = canvas.width;
                     var h = canvas.height;
                     var data;
                     data = context.getImageData(0, 0, w, h);
                     var compositeOperation = context.globalCompositeOperation;
                     context.globalCompositeOperation = "destination-over";
                     context.fillStyle = "rgb(36, 36, 36)";
                     context.fillRect(0, 0, w, h);
   
                     img = pc[v].chart.toDataURL();
   
                     context.clearRect(0, 0, w, h);
                     context.putImageData(data, 0, 0);
                     context.globalCompositeOperation = compositeOperation;
                 }
                 qid = pc[v].query_id;
                 res = rxds.m.query_tracker[qid].data.result;
                 da = [];
             } else if (pc[v].control_type === "Plugin") {
                 title = $("#" + v)
                     .parent()
                     .find(".ui.menu .ui.header")
                     .text();
                 //.replace(/\s+/g, " ");
   
                 //if (title === "") {
                 if (!title) {
                     title = $("#" + v)
                         .parent()
                         .parent()
                         .attr("data-tab-title");
                     //.attr("data-tab");
                     //.replace(/\s+/g, " ");
                 }
                 if (!title) {
                     title = pc[v].config.title;
                 }
                 if (title.includes("{")) {
                     title = rxds.replace_params(title);
                 }
   
                 title = title.replace(/\s+/g, " ").trim();
   
                 img = $(".tempcanvasforppt-" + v)[0].toDataURL();
                 imgX = 0;
                 imgWidth = 13.33;
                 imgHeight = 2;
   
                 ///Udhay - to fix the badge resolution issue (especially if the width is less than eight)
                 if (["three", "four", "five", "six", "seven", "eight"].includes(pc[v].config.cols)) {
                     imgWidth = 7;
                     imgHeight = 5;
                 }
                 //Vishnu Priya- to fix the badge resolution issue for Clinops dashboard
                 if (["three", "four", "five", "six", "seven", "eight"].includes(pc[v].config.cols)
                     && rxds.app.app.name === "ClinOps Dashboard") {
                     // debugger;
                     imgWidth = 4;
                     imgHeight = 5;
                     imgX = 4;
                 }
   
                 qid = pc[v].query_id;
                 res = rxds.m.query_tracker[qid].data.result;
                 da = [];
   
                 $(".tempcanvasforppt-" + v).detach();
             } else if (pc[v].control_type === "Form") {
               if(rxds.app.app.name === "ClinOps Dashboard" && pc[v].control_type === "Form") {
                   title='Study';
                   img = $(".tempcanvasforppt-" + v)[0].toDataURL();
                   imgX = 0;
                   imgWidth = 13.33;
                   imgHeight = 0.94;
                   $(".tempcanvasforppt-" + v).detach();
                  } else  {
                   title = "Filter"; //pc[v].config.title;
                   img = $(".tempcanvasforppt-" + v)[0].toDataURL();
                   imgX = 0;
                   imgWidth = 13.33;
                   imgHeight = 0.94;
                   $(".tempcanvasforppt-" + v).detach();
                  }
             } else if (pc[v].control_type === "Report" || pc[v].control_type === "AG Grid") {
                 title = pc[v].config.title;
                 title = rxds.replace_params(title);
                 var t1 = $("#" + v)
                     .parent()
                     .prev()
                     .text();
                 var t2 = $("#" + v)
                     .parent()
                     .parent()
                     .attr("data-tab-title");
                 title = t1 ? t1 : t2 ? t2 : title;
   
                 if (title === "") {
                     title = $("#" + v)
                         .parent()
                         .parent()
                         .attr("data-tab-title");
                 }
                 if (title.includes("{")) {
                     title = rxds.replace_params(title);
                 }
                 title = title.replace(/\s+/g, " ").trim();
                 let dataLength = pc[v].control_type === "Report" ? pc[v].table.data().length : pc[v].data.length;
                 if (dataLength) {
                     img = $(".tempcanvasforppt-" + v)[0].toDataURL();
                     imgX = 0.4;
                     imgWidth = 9.25;
                     imgHeight = 5.3;
                 } else {
                     var canvasEmpty = document.createElement("canvas");
                     canvasEmpty.width = 500;
                     canvasEmpty.height = 100;
                     var ctx = canvasEmpty.getContext("2d");
                     ctx.font = "30px Arial";
                     //ctx.fillStyle = 'rgb(256, 256, 256)';
                     if (!isDarkMode) {
                         //ctx.fillText("No Data to Display",25,60);
                         ctx.fillText(noDataLocMessage, 25, 60);
                     } else {
                         ctx.fillStyle = "rgb(36, 36, 36)";
                         ctx.fillRect(0, 0, 500, 100);
                         ctx.fillStyle = "rgb(256, 256, 256)";
                         //ctx.fillText("No Data to Display",25,60);
                         ctx.fillText(noDataLocMessage, 25, 60);
                     }
   
                     img = canvasEmpty.toDataURL();
                     imgHeight = 1.04;
                     imgWidth = 5.21;
                     imgX = 1.1;
                     imgY = 1.9;
                 }
                 $(".tempcanvasforppt-" + v).detach();
             } else {
                 //echarts
                 var chart = pc[v].chart;
                 title = $("#" + v)
                     .parent()
                     .find(".ui.menu .ui.header")
                     .text(); //pc[v].config.title;
   
                 if (title === "") {
                     title = $("#" + v)
                         .parent()
                         .parent()
                         .attr("data-tab-title");
                 }
                 if(typeof(title) === 'undefined') {
                       title = "";
                 }
                 //title = title.replace(/\xA0*\xA0|\s*\s/g," ");
                 if (title.includes("{")) {
                     title = rxds.replace_params(title);
                 }
                 title = title.replace(/\s+/g, " ").trim();
   
                 //imgHeight = chart.getHeight();
                 //imgWidth = chart.getWidth();
                 //var chartType = chart.getOption().series[0].type;
   
                 //Udhay - to fix the issue for wordCloud chart
                 if (rxds.app.app.branch.match("MASTER|QA|UI")) {
                   //Vishnu Priya- To fix the issue for the charts when its length is 0
                   if (!(pc[v].options.series && pc[v].options.series.constructor === Array && pc[v].options.series.length != 0)) {
                           chart.setOption({ animation: false }); // disabling animation so that chart loads immediately
                           chart.resize(); // redrawing chart
                           chart.setOption({ animation: "auto" }); // resetting animation
                      } 
                    else if (!(pc[v].options.series && pc[v].options.series.constructor === Array && pc[v].options.series[0].type === "wordCloud")) {
                         chart.setOption({ animation: false }); // disabling animation so that chart loads immediately
                         chart.resize(); // redrawing chart
                         chart.setOption({ animation: "auto" }); // resetting animation
                     } else {
                         chart.setOption({ animation: false }); // disabling animation so that chart loads immediately
                         chart.resize(); // redrawing chart
                         chart.setOption({ animation: "auto" }); // resetting animation
                     }
                 } else {
                     chart.setOption({ animation: false }); // disabling animation so that chart loads immediately
                     chart.resize(); // redrawing chart
                     chart.setOption({ animation: "auto" }); // resetting animation
                 }
   
                 qid = pc[v].query_id;
                 res = rxds.m.query_tracker[qid].data.result;
                 da = [];
                 if (
                     $("#" + v)
                         .parent()
                         .is(".one,.two,.three,.four,.five,.six")
                 ) {
                     imgHeight = chart.getHeight() / 60;
                     imgWidth = chart.getWidth() / 60;
   
                     //Udhay - To fix the chart resolution issue (especially if the width is less than eight)
                     //if(rxds.app.app.name === "Channel Operations" && rxds.app.page.page.page_title === "Demand Sales Dashboard") {
                     if (rxds.app.app.branch.match("MASTER|UI") && rxds.app.app.name === "Channel Operations") {
                         let height = chart.getHeight();
                         let width = chart.getWidth();
                         let i = 150;
                         while (!(height / (i - 10) > 5.5)) i -= 10;
   
                         imgHeight = height / i;
                         imgWidth = width / i;
                     }
                 } else if (
                     $("#" + v)
                         .parent()
                         .is(".seven,.eight,.nine,.ten,.eleven,.twelve")
                 ) {
                     imgHeight = chart.getHeight() / 80;
                     imgWidth = chart.getWidth() / 80;
                     if (imgHeight > 5.5) {
                         imgHeight = chart.getHeight() / 110;
                         imgWidth = chart.getWidth() / 110;
                     }
   
                     //Udhay - to fix the width issue for eChart (especially - when width is set as twelve) (Ex -ClinOps)
                     if (pc[v].config.cols === "twelve" && imgHeight > 4.5) {
                         imgHeight = chart.getHeight() / 110;
                         imgWidth = chart.getWidth() / 110;
                     }
                 } 
                    if (pc[v].config.cols === "sixteen") {
                            imgHeight = 5; //chart.getHeight()/45;
                            imgWidth = 10.34; //chart.getWidth()/45;
                            //imgX = -0.7;
                    } else {
                     imgHeight = 5; //chart.getHeight()/45;
                     imgWidth = 14.34; //chart.getWidth()/45;
                     imgX = -0.7;
                 }
   
                 if (!isDarkMode) {
                     img = chart.getDataURL({
                         pixelRatio: 2,
                         backgroundColor: "#fff"
                     });
                 } else {
                     /*let canvas = pc[v].dom.getElementsByTagName('canvas')[0];
                       if(canvas){
                         let context = canvas.getContext('2d');
                         var w = canvas.width;
                         var h = canvas.height;
                         var data;
                         data = context.getImageData(0, 0, w, h);
                         var compositeOperation = context.globalCompositeOperation;
                         context.globalCompositeOperation = "destination-over";
                         context.fillStyle = 'rgb(36, 36, 36)';
                         context.fillRect(0,0,w,h);
          
                         img=canvas.toDataURL();
          
                         context.clearRect (0,0,w,h);
                         context.putImageData(data, 0,0);       
                         context.globalCompositeOperation = compositeOperation;     
                       }
                       else{*/
                     img = chart.getDataURL({
                         pixelRatio: 2,
                         backgroundColor: "#444"
                     });
                     /*}*/
                 }
   
                 var no_data;
                 var kdb_res = rxds.m.query_tracker[pc[v].query_id];
                 if (kdb_res && kdb_res.data && (kdb_res.data.result.length === 0))
                     no_data = true;
                 else
                     no_data = pc[v].options.series.length == 0;
   
                 if (!no_data && Array.isArray(pc[v].options.series)) {
                     if (Array.isArray(pc[v].options.series[0].data))
                         no_data = pc[v].options.series[0].data.length === 0;
                     else
                         no_data = !pc[v].options.series[0].data;
                 }
                 //if(pc[v].options.series[0].data.length === 0) {
                 //if(pc[v].options.series.length === 0 ||  pc[v].options.series[0].data.length === 0) {
                 if (no_data) {
                     var canvasEmpty = document.createElement("canvas");
                     canvasEmpty.width = 500;
                     canvasEmpty.height = 100;
                     var ctx = canvasEmpty.getContext("2d");
                     ctx.font = "30px Arial";
                     //ctx.fillStyle = 'rgb(256, 256, 256)';
                     if (!isDarkMode) {
                         //ctx.fillText("No Data to Display",25,60);
                         ctx.fillText(noDataLocMessage, 25, 60);
                     } else {
                         ctx.fillStyle = "rgb(36, 36, 36)";
                         ctx.fillRect(0, 0, 500, 100);
                         ctx.fillStyle = "rgb(256, 256, 256)";
                         //ctx.fillText("No Data to Display",25,60);
                         ctx.fillText(noDataLocMessage, 25, 60);
                     }Display
   
                     img = canvasEmpty.toDataURL();
                     imgHeight = 1.04;
                     imgWidth = 5.21;
                     imgX = 1.1;
                     imgY = 1.9;
                 }
             }
   
             //title = $('#'+v).parent().find('.ui.menu .ui.header').text().trim();
             // ** @nehay: for ClinOps only - adjust notes height and width
             if (rxds.app.app.name === "ClinOps Dashboard" && title.toLowerCase() == 'notes') {
                 imgHeight = 6;
             }
             if (img !== "data:,") {
                 //this line makes sure that image data exists
                 var slide = pptx.addNewSlide("MASTER_SLIDE");
                 slide.addImage({
                     data: img,
                     x: imgX,
                     y: imgY,
                     w: imgWidth,
                     h: imgHeight
                 });
                 slide.addText(title, {
                     fontFace: "Calibri(Body)",
                     fontSize: 38,
                     color: "ffffff",
                     isTextBox: true,
                     shape: pptx.shapes.RECTANGLE,
                     align: "l",
                     x: 0.4,
                     y: 0.5,
                     w: 12.5,
                     h: 1.2,
                     fill: "1A3C65"
                 });
                 slide.addText("", {
                     shape: pptx.shapes.RIGHT_TRIANGLE,
                     x: 11.05,
                     y: 0.9,
                     w: 1,
                     h: 0.8,
                     fill: "00B0F0",
                     line: "FFFFFF",
                     flipH: true
                 });
             }
   
             if(rxds.app.app.name === "ClinOps Dashboard" && (v == 'region470002619' || v == 'region470004244' 
             || v == 'region470004224' || v=='region470004285' || v == 'region470004357')){ //to add data Clock Milestone and others as datatable in slide.
                 if(v =='region470004244')  {
                    let data_val=rxds.m.query_tracker['470006749'].data.result;

                    let datacopy=[...data_val];
                    let new_dataval = datacopy.filter((v) => {
                       v['Significant Risks / Issues']=v['Significant Risks / Issues'].replaceAll('<li>','• ').replaceAll('</li>','\n').replaceAll('<ul>','').replaceAll('</ul>','');
                       v['Root Cause']=v['Root Cause'].replaceAll('<li>','• ').replaceAll('</li>','\n').replaceAll('<ul>','').replaceAll('</ul>','');
                       v['Mitigations /Corrective & Preventative Actions']=v['Mitigations /Corrective & Preventative Actions'].replaceAll('<li>','• ').replaceAll('</li>','\n').replaceAll('<ul>','').replaceAll('</ul>','');

                       return v;
                    });
                   res = new_dataval;
                   pc[v].config.flip_report = "Y";
                   da = []; 

                 }else if(v == 'region470004285') {
                     let data_val=rxds.m.query_tracker['470006820'].data.result;
                     let datacopy=[...data_val];
                     let new_dataval = datacopy.filter((v) => {
                         v['Notes']=v['Notes'].replaceAll('<li>','• ').replaceAll('</li>','\n').replaceAll('<ul>','').replaceAll('</ul>','').replaceAll('<ol>','').replaceAll('</ol>','').
                             replace(/<\/?span[^>]*>/g,"").replaceAll('</span>','\n');
      

                         return v;
                      });
                     res = new_dataval;
                     pc[v].config.flip_report = "Y";
                     da = []; 
                   } else {
                   res = rxds.m.query_tracker[pc[v].query_id].data.result;
                   pc[v].config.flip_report = "Y";
                   da = [];
                 }
                 
               }
     
   
             if (
                 include_data &&
                 res &&
                 res.length > 0 &&
                 pc[v].config.flip_report &&
                 pc[v].config.flip_report == "Y"
             ) {
                
                 var cols = Object.keys(res[0]);
                 var slidedata = pptx.addNewSlide("MASTER_SLIDE");
                  if(rxds.app.app.name === "ClinOps Dashboard" && title ==="Risk Management") {
                   slidedata.addText(title, {
                       fontFace: "Calibri(Body)",
                       fontSize: 38,
                       color: "ffffff",
                       isTextBox: true,
                       shape: pptx.shapes.RECTANGLE,
                       align: "l",
                       x: 0.4,
                       y: 0.5,
                       w: 12.5,
                       h: 0.9,
                       fill: "1A3C65"
                   });
                   }else {
                      slidedata.addText(title, {
                       fontFace: "Calibri(Body)",
                       fontSize: 38,
                       color: "ffffff",
                       isTextBox: true,
                       shape: pptx.shapes.RECTANGLE,
                       align: "l",
                       x: 0.4,
                       y: 0.5,
                       w: 12.5,
                       h: 1.2,
                       fill: "1A3C65"
                   });
                   }
                 var cols_format = cols.map((v) => v.replace(/_/g, " "));
                 if(rxds.app.app.name !== "ClinOps Dashboard") {
                 da.push(cols_format);
                 }
                 res.forEach((v) => {
                     var r = [];
                     cols.forEach((s) => {
                         let value;
                         if (rxds.app.app.branch.match("MASTER|QA|UI")) {
                             value = (v[s] || v[s] == 0) ? v[s].toLocaleString() : v[s];   //Udhay - to fix the zero not showing issue
                         } else {
                             value = v[s] ? v[s].toLocaleString() : v[s];
                         }
                         r.push(value);
                     });
                     da.push(r);
                 });
                 if(rxds.app.app.name === "ClinOps Dashboard") {
                 if (rxds.app.app.name === "ClinOps Dashboard" && ( v == 'region470004244' ) ) {
                    var tabOpts = {
                         x: 0.5,
                         y: 2.0,
                         fill: "F7F7F7",
                         color: "6f9fc9",
                         fontSize: 9//Vishnu Priya-To fix the table alignment issue in slides
                         
                     };
                   var tabOpts1 = {
                         x: 0.5,
                         y: 1.6,
                         //w: 9.0,
                         fill: "F7F7F7",
                         bold:true,
                         //fontSize: 18,
                         fontSize: 9,//Vishnu Priya-To fix the table alignment issue in slides
                         color: "000000"
                     };
                 }else if(rxds.app.app.name === "ClinOps Dashboard" && (v == 'region470002638')) {
                   var tabOpts = {
                         x: 0.5,
                         y: 2.6,
                         //w: 9.0,
                         fill: "F7F7F7",
                         //fontSize: 18,
                         fontSize: 10,//Vishnu Priya-To fix the table alignment issue in slides
                         color: "6f9fc9"
                     };
                     var tabOpts1 = {
                         x: 0.5,
                         y: 2.0,
                         bold:true,
                         //w: 9.0,
                         fill: "F7F7F7",
                         //fontSize: 18,
                         fontSize: 10,//Vishnu Priya-To fix the table alignment issue in slides
                          color: "000000"
                     };
                 }else {
                   var tabOpts = {
                         x: 0.5,
                         y: 2.2,
                         //w: 9.0,
                         fill: "F7F7F7",
                         //fontSize: 18,
                         fontSize: 10,//Vishnu Priya-To fix the table alignment issue in slides
                         color: "6f9fc9"
                     };
                      var tabOpts1 = {
                         x: 0.5,
                         y: 2.0,
                         bold:true,
                         //w: 9.0,
                         fill: "F7F7F7",
                         //fontSize: 18,
                         fontSize: 10,//Vishnu Priya-To fix the table alignment issue in slides
                          color: "000000"
                     };
                 }
                  slidedata.addTable(da, tabOpts);
                  slidedata.addTable(cols_format, tabOpts1);
                 }
                 else {
   	              var tabOpts = {
                       x: 0.5,
                       y: 2.0,
                       w: 9.0,
                       fill: "F7F7F7",
                       //fontSize: 18,
                       fontSize: 10,//Vishnu Priya-To fix the table alignment issue in slides
                       color: "6f9fc9"
                   };
                   slidedata.addTable(da, tabOpts);
                 }
             }
             // }
             // catch (err) {
             //     console.log("\n\nError!!! \n Something went wrong while processing this region: " + pc[v].config.title + " (" + v + ")");
             //     console.log(err);
             // }
         });
   
         //console.log('PPT SAVING---');
         //Vishnu Priya - To download the filter name as file name in ppt
         if (rxds.app.app.name === "ClinOps Dashboard" && rxds.app.page.page.page_title === "Study Summary") {
             let var_name = rxds.m.get_param('CLINOPS_PROGRAM_NAME') + "_" + rxds.m.get_param('PROTOCOL_NUMBER');
             $('#region470004373').parents('.row.no-padding.mt-1').show();
             $('#region470004244').parents('.ui.segments.raised.no-border-top').show();
             $('#region470004285').show();
             $('#region470004357').show();
             $('#region470004285').show();
             $('#region470004224').show();
             $('#region470002638').show();
             $('#region470002619').show();
             pptx.save(var_name + '.pptx');
         } else {
             pptx.save(rxds.app.app.name+" "+rxds.app.page.config.title+'_Presentation.pptx');
         }
   
         //hiding the charts again
         Object.keys(pc)
             .filter((v) => pc[v].control_type === "Tabs Container")
             .forEach((v) => {
                 $("#" + v + " .ui.bottom.attached.tab.segment.active").removeClass(
                     "active"
                 );
                 $("#" + v + " .ui.bottom.attached.tab.segment.keep-me-visible")
                     .addClass("active")
                     .removeClass("keep-me-visible");
             });
     }
   
     //array of all the config objects for which we need to covert html2canvas.
     var htm2CanvasArr;
     /*htm2CanvasArr = Object.keys(pc).filter(
       (v) =>
         (pc[v].control_type === "Report" && pc[v].config.include_in_ppt === "Y") ||
         (pc[v].control_type === "Report" && pc[v].config.include_in_ppt === "N" && include_data) ||
         (pc[v].control_type === "Plugin") ||
         (pc[v].control_type === "Form" && pc[v].config.include_in_ppt === "Y")
     );*/
   
     //if(rxds.app.app.branch.match("MASTER|QA|UI")) { //Udhay - to restrict the plugin region if include_in_ppt is "N"
     htm2CanvasArr = Object.keys(pc).filter(
         (v) => (
             (pc[v].control_type === "Report" && pc[v].config.include_in_ppt === "Y") ||
             (pc[v].control_type === "Report" && pc[v].config.include_in_ppt === "N" && include_data) ||
             (pc[v].control_type === "AG Grid" && pc[v].config.include_in_ppt === "Y") ||
             (pc[v].control_type === "AG Grid" && pc[v].config.include_in_ppt === "N" && include_data) ||
             (pc[v].control_type === "Plugin" && pc[v].config.include_in_ppt !== "N") ||
             (pc[v].control_type === "Form" && pc[v].config.include_in_ppt === "Y")
         )
     );
     //}
   
     // // ** @nehay: for ClinOps only - to show Clock
     if (rxds.app.app.name === "ClinOps Dashboard") {
         // debugger;
         // $('#toggleIcon_region470002619').trigger('click');
         //if($('#region470002619').parents('.content').css('display') == 'none'){
          //   $('#region470002619').parents('.content').show();
           //  pc['region470002619'].table.columns.adjust().draw();
         //}
         $('#region470004373').parents('.row.no-padding.mt-1').hide();
         $('#region470004244').parents('.ui.segments.raised.no-border-top').hide();
         $('#region470004285').hide();
         $('#region470004357').hide();
         $('#region470004285').hide();
         $('#region470004224').hide();
         $('#region470002638').hide();
         $('#region470002619').hide();
     }
     // //end       
     if (htm2CanvasArr.length === 0) {
         createPPT();
         return;
     } else {
         //render html widgets as canvas components
         //select only 'Plugin' widgets or widgets that have 'Include in PPT' selected Yes in AB.
         var convertcnt = 0;
         htm2CanvasArr.forEach((v, itm, arrr) => {
             html2canvas(document.querySelector("[id='" + v + "']")).then((canvas) => {
                 canvas.className = "tempcanvasforppt-" + v;
                 document.body.appendChild(canvas);
                 convertcnt++;
                 if (convertcnt === arrr.length) {
                     createPPT();
                 }
             });
         });
     }
  } //generate_ppt

        
  function validate_form() {
    var v=$('.rxds_form').form('validate form');
    if (Array.isArray(v)) {
        v=v.filter(v=> v===false).length==0;
    }
    if (v===false) return false; else return true;
  }

  async function conditional_regions() {
    //await Promise.all(Object.keys(promise_arr).filter(v=>v.match(/^item/)).map(v=>promise_arr[v]));
    conditional_regions_wrap();
  }

  function conditional_regions_wrap() {
    const eval2=eval;
    if (!rxds.hidden_controls) rxds.hidden_controls = {};
    const hc=rxds.hidden_controls;
    const h_keys= Object.keys(hc);
    const pc=rxds.page_controls;
    const pc_keys = Object.keys(pc).filter(v=>{return  pc[v].region&&pc[v].region.conditional_display});
    if ((pc_keys.length == 0)&&(h_keys.length==0)) return;

    Object.keys(pc).forEach(v=>{let i=pc[v];
            if (i.ac) {i.children=i.ac.slice(0);} else if (i.children && i.children.length) {i.ac= i.children.slice(0);}
            if (i.acr) {i.child_regions=i.acr.slice(0);} else if (i.child_regions && i.child_regions.length) {i.acr= i.child_regions.slice(0);}
            if (i.id) {i.dependent_items=i.id.slice(0);} else if (i.dependent_items && i.dependent_items.length) {i.id= i.dependent_items.slice(0);}
            if (i.idr) {i.dependent_regions=i.idr.slice(0);} else if (i.dependent_regions && i.dependent_regions.length) {i.idr= i.dependent_regions.slice(0);}
     });
    

    h_keys.forEach(v=>{
       let cond=hc[v].region.conditional_display; let show=true;
       cond=cond.replace(/{{([^}]*)}}/g, function (match, p1,offset, string) {return rxds.m.get_param(p1)});
       try {show=eval2(cond);} catch(e){console.log("Unable to evaluate " + cond); console.log(e);}
       if (show) {
            rxds.page_controls[v]=rxds.hidden_controls[v];
            let i=rxds.page_controls[v];
            delete rxds.hidden_controls[v];
            $('.rxds_region[data-region="'+v+'"]').show();
            $('.rxds_region_help[data-region="'+v+'"]').show();
            $('.rxds_tab_menu[item-tab-region=' + v + ']').show();  //Udhay - to show the tabs inside the tab container 
            $('.rxds_region[data-region="'+v+'"]').parent(".row").show();   //Udhay - to show the row div when there is regions to show inside that
       }
    });

    pc_keys.forEach(v=>{
       let cond=pc[v].region.conditional_display; let show=true;
       cond=cond.replace(/{{([^}]*)}}/g, function (match, p1,offset, string) {return rxds.m.get_param(p1)});
       try {show=eval2(cond);} catch(e){console.log("Unable to evaluate " + cond); console.log(e);}
       if (!show) {
            rxds.hidden_controls[v]=rxds.page_controls[v];
            delete rxds.page_controls[v];
            $('.rxds_region[data-region="'+v+'"]').hide();
            $('.rxds_region_help[data-region="'+v+'"]').hide();
            Object.keys(rxds.page_controls).forEach(w=>{let i=pc[w];
                    if (i.children) {i.children=removeElem(i.children,v);}
                    if (i.child_regions) i.child_regions=removeElem(i.child_regions,v);
                    if (i.dependent_items) i.dependent_items=removeElem(i.dependent_items,v);
                    if (i.dependent_regions) i.dependent_regions=removeElem(i.dependent_regions,v);
                });
                
            //Added by udhay - to hide the tabs inside the tab container 
            let tabItems = $('.rxds_tab_menu[item-tab-region=' + v + ']');
            if(tabItems.length) {
                let otherTabs = tabItems.siblings();
                //check and change tab if the tab is active
                if(tabItems.attr("class").includes("active") && otherTabs.length)   $(otherTabs[0]).click();
                tabItems.hide();
            }
            
            //Udhay - to hide the empty row div when there are no regions inside
            if(rxds.hidden_controls[v].region.group_count === "one"){
              $('.rxds_region[data-region="'+v+'"]').parent(".row").hide();
            } else {
              let grp = rxds.hidden_controls[v].region.group;
              let grouped_regions = Object.keys(rxds.page_controls).filter(v1 => rxds.page_controls[v1].region && rxds.page_controls[v1].region.group === grp);
              if(!grouped_regions.length)
                $('.rxds_region[data-region="'+v+'"]').parent(".row").hide();
            }   //End - Udhay - to hide the empty row div when there are no regions inside
       }
    });
    
  } //conditional_regions

  async function load_regions() { /* Called from button action to reload page regions */
    if (!validate_form()) return;
    await conditional_regions();
    rxds.stats.start_time=new Date();             
    const pc=rxds.page_controls;
    const pc_keys = Object.keys(pc);
    const region_keys = R.filter(i => {return pc[i].region && pc[i].query_id > 0}, pc_keys);
    var param={};
    var p = region_keys.map(
        (k) => {promise_arr[k] = manager.load(k);return promise_arr[k];}
    );
    await Promise.all(p);
    rxds.stats.end_time = new Date();
    rxds.stats.elapsed = rxds.stats.end_time - rxds.stats.start_time;
    manager.postPageView();
    //Replace title
    $(".bindItem").each(function(){
        $(this).html( rxds.m.get_param($(this).data("item")).replaceAll("_"," ")  );
    });

  }

  function add_grand_children(pc,children) {
    try {
     var added=false;
     const ilist=children.filter(v=>{return v.match(/^item/)});
     ilist.forEach(v=>{
       //console.log(pc[v].children);
       pc[v].children.forEach(w=>{
         const exists = children.find(x=>{return x==w});
         if (!exists) {children.push(w);added=true;}
       });
     });
     if (added) {
      //console.log(children);
       add_grand_children(pc,children);
     }
    } catch(e) {
      console.log(e);
    }
  }

  async function load_children(children,recheck,k1) { /* Called in reactive pages to refresh dependent regions */
      if (!rxds.load_completed || !validate_form()) return;
      rxds.stats.start_time=new Date();             
      const pc=rxds.page_controls;
      const pc_keys=children;
      pc_keys.forEach(k => {if (pc[k]) {pc[k].loaded=false; pc[k].fired = false;delete promise_arr[k];}});
      rxds.load_completed=false;
      
      //rxds.conditional_regions=false;
      await conditional_regions();
      if (recheck) children=pc[k1].children;
      add_grand_children(pc,children);
      dependent_load(children);
      const parents = R.reject(i => {return pc[i] && pc[i].children.length == 0}, pc_keys);
      await new Promise(r => setTimeout(r, 2000));
      parents.forEach( (k) => manager.dependent_handler(k,pc[k]) );

  }

  async function load$d() {
     
       getDBnameURL();
      
    rxds.load_completed = false;
    rxds.conditional_regions = false;
    $.fn.dropdown.settings.delimiter = '|';
    $.fn.dropdown.settings.fullTextSearch = true;
    if(rxds.app.app.name === "Global Training Tracker") {
      //Udhay & Sriman to change the search behaviour in GTT application
      $.fn.dropdown.settings.fullTextSearch = "exact";
    }
    
    const pc=rxds.page_controls;
    const pc_keys = Object.keys(pc);
    //initialize page controls
    pc_keys.forEach(
        (k) => {pc[k].children=[]; pc[k].fired = false;}
    );
    
    if (rxds.cache_dataset_id) {
         rxds.recache_ts =  await manager.fetchAsync("cache"+rxds.cache_dataset_id,"Cache TS", rxds.cache_dataset_id,{cache:'N'});
         if (rxds.recache_ts.result && rxds.recache_ts.result.length==1) rxds.recache_ts = rxds.recache_ts.result[0];
         else rxds.recache_ts= '1900-01-01T00:00:00';
    }

    //Find objects with and without dependents
    const no_depend = R.filter(i => {return pc[i].dependent_items.length == 0}, pc_keys);
    const depend = R.reject(i => {return pc[i].dependent_items.length == 0}, pc_keys);
    
  //Fire away and store promises if no dependents
    no_depend.forEach(
        (k) => {pc[k].fired=true; promise_arr[k] = manager.load(k);}
    );
    //debugger;
    //Append to the children array for the parent elements to support refresh
    depend.forEach(
        (k) => {
            pc[k].dependent_items.forEach(i=>{pc[i].children.push(k);});
    });

    dependent_load(depend);
  } //load


  //dhinesh - syneos dbname based client logo
  async function getDBnameURL(){
        if(rxds.app.config.theme.toUpperCase()=="SYNEOS")
      {
        
        let dbname="";
        
      let app_url = window.location.href;
     
      var app_dbname = app_url.includes('DBNAME');
     
      if(app_dbname == true){
       var url = new URL(app_url);
      dbname = url.searchParams.get("DBNAME");
      }else if(app_url.indexOf('DB_') > 0){
        let url_dbname = app_url.split('/')[4];
         dbname =  url_dbname.replace('DB_','');
       
      }else{
        $(".pusher").find(".center.menu.margin-center").show(); 
        }
     
        
        if(dbname!="")
        {
          let logourl="";
          let url="https://rxdsdev-apex.syneoshealth.com/ords/rxds/dl/data_browser_client_logos/"+dbname;
          let response= await fetch(url);
          let data = await response.text();
          if(data)
          {
          data = JSON.parse(data);
          data=JSON.parse(data["json"]);
            if(Object.keys(data).filter(v=>v==dbname).length==1)
            {
              if(data[dbname].LOGO_URL)
              {
                logourl=data[dbname].LOGO_URL;
              }
            }
          }
          
          if(logourl!="")
          {
            $(".pusher").find(".item.logo.vertically.fitted img").attr("src",logourl);
            $(".pusher").find(".center.menu.margin-center").show();
          }
        }
      }

    }
    
  //Vishnu Priya- To download and save PDF to rxds path for Clinops dashboard
  function createPDF() {
      
      let prgm = rxds.m.query_tracker['470003748'].data.result;
      let arr1=[],arr2=[];
      let count=0;
      let var_name ="";
      let name="";
      var pc = rxds.page_controls;
                  Object.keys(pc)
                  .filter((v) => pc[v].control_type === "Tabs Container")
                  .forEach((v) => {
                   $("#" + v + " .ui.bottom.attached.tab.segment.active").addClass(
                     "keep-me-visible"
                   );
                   $("#" + v + " .ui.bottom.attached.tab.segment")
                   .addClass("active")
                   .each(function () {
                       let currTabArea = $(this).data("id");
                       if ((rxds.page_controls[currTabArea] && rxds.page_controls[currTabArea].control_type === "Report")) {
                           window.dispatchEvent(new Event("resize"));
                           rxds.page_controls[currTabArea].table.columns.adjust().draw();
                       }
                   });
           });
           $('.ui.top.fixed.menu').css('width','180%');
           $("#region470002627").parents(".row.no-padding.mt-1").css({position: 'relative'});
           $("#region470004283").parents(".row.no-padding.mt-1").css({
                  "margin-top":"10px"
           });
           $("#item470001318").css({"background-color": "#2185d0", "color":"#fff"});
           $("#item470002399").css({"background-color": "#2185d0", "color":"#fff"});
           $("#region470002619").show();
           $("#region470004224").show();
           $("#region470004285").show();
           $("#region470004357").show();
           $("#region470004244").show();
           $("#GRID470004244_wrapper .ui.celled.table.no-footer.dataTable").parents(".dataTables_scrollHeadInner").css('width','100%');
           $("#GRID470004244_wrapper .ui.celled.table.no-footer.dataTable").css('width','100%');
           $("#GRID470004357_wrapper .ui.celled.table.no-footer.dataTable").parents(".dataTables_scrollHeadInner").css('width','100%');
           $("#GRID470004357_wrapper .ui.celled.table.no-footer.dataTable").css('width','100%');
           $("#GRID470004224_wrapper .ui.celled.table.no-footer.dataTable").parents(".dataTables_scrollHeadInner").css('width','100%');
           $("#GRID470004224_wrapper .ui.celled.table.no-footer.dataTable").css('width','100%');
      //const myInterval = setInterval(myTimer, 5000);
      const myTimeout = setTimeout(myTimer, 5000);
      const myTimeout1 = setInterval(myTimer1, 45000);

      function myTimer() {
      
          if(!rxds.page_init) {
              //$("#region470004244").show();
              $("#GRID470004244_wrapper .ui.celled.table.no-footer.dataTable").parents(".dataTables_scrollHeadInner").css('width','100%');
              $("#GRID470004244_wrapper .ui.celled.table.no-footer.dataTable").css('width','100%');
              $("#GRID470004357_wrapper .ui.celled.table.no-footer.dataTable").parents(".dataTables_scrollHeadInner").css('width','100%');
              $("#GRID470004357_wrapper .ui.celled.table.no-footer.dataTable").css('width','100%');
              $("#GRID470004224_wrapper .ui.celled.table.no-footer.dataTable").parents(".dataTables_scrollHeadInner").css('width','100%');
              $("#GRID470004224_wrapper .ui.celled.table.no-footer.dataTable").css('width','100%');
              //$("#GRID470004244_wrapper .ui.celled.table.dataTable.no-footer thead tr th").css("cssText","background-color:#164777;color:#fff;");
              console.log("done");
              for (let i = 0; i < prgm.length; i++) {
                     setTimeout( () =>{
         
                  rxds.m.set_param("CLINOPS_PROGRAM_NAME",String(prgm[i].value)); 
                  console.log(prgm[i]);
                   name=prgm[i].name;
                   console.log("name",name);
            
                  }, i * 100000);
           
              }
          }
      }
      function myTimer1() {
          let prgm_name= rxds.m.get_param("CLINOPS_PROGRAM_NAME");
          let param = rxds.m.get_param("PROTOCOL_NUMBER");
          let study = rxds.m.query_tracker['470003749'].data.result;
          if(name === prgm_name)
              for (let j = 0; j < study.length; j++) {
               console.log("names check",name,prgm_name);
               setTimeout( () =>{
           console.log("study",prgm,study[j]); 
           rxds.m.set_param("PROTOCOL_NUMBER",'' +study[j].value);
           var_name=prgm_name+"_"+study[j].value;
                   count+=1;
              console.log("count",count,j,study.length);
               
             var element = document.getElementById('body');
             console.log("element",body);
             //element.style.width = '1000px';
             //element.style.height = '2000px';
             setTimeout( ()=>{ html2pdf()
      .set({
          margin:0,
                  filename: var_name+'.pdf',
                  image: { type: 'jpeg', quality: 1 },
                  html2canvas: {scale:2 },
                  jsPDF: { unit: 'in', format: 'A2', orientation: 'landscape' },
                  pagebreak: { mode: 'avoid-all', after: '.avoidThisRow' }
          // other options...
      })
      .from(element)
      .toPdf()
      .output('datauristring')
      .then(function(pdfBase64) {
          const file = new File(
              [pdfBase64],
              var_name+'.pdf',
              {type: 'application/pdf'}
          ); 
  console.log("file",file);
          const formData = new FormData();        
          formData.append("file", file);
          console.log("formdata",formData);
           fetch('https://cdn2.rxdatascience.com/pdf/', {
            method: 'POST',
            body: formData,
           
          })
          .then(response =>{
              if (!response.ok) {
                  return response.text().then(result => Promise.reject(new Error(result)));
      }
              return response.json()
          })
          .then(result => {
            console.log('Success:', result);
          })
          .catch(error => {
            console.error('Error:', error);
          });
      });
                             },5000);    
               
             console.log("downloading...");
              
              }, j * 10000);
            
          }
      console.log("study done");
      count=0;
      name="";
         if(param === "ALN-XDH-001"){
          
              clearInterval(myTimeout1);
              console.log("cleared interval");
              $('.ui.top.fixed.menu').css('width','100%');
           $("#region470002619").hide();
           $("#region470004224").hide();
           $("#region470004285").hide();
           $("#region470004357").hide();
           $("#region470004244").hide();
           $("#region470002627").parents(".row.no-padding.mt-1").css({
                  "position": "fixed",
                  "z-index": 1,
                   "margin-top":"10px"
              });
              $("#region470004283").parents(".row.no-padding.mt-1").css({
               "margin-top":"185px"
              });
              
         }
      }
           
           
           
  }




  //Udhay - find and update the parameter values from the given text/title
  function replace_params(title) {
  	let title_txt = title.replace(/{{([^}]*)}}/g, function (match, p1,offset, string) {return rxds.m.get_param(p1)});
  	/*let avail_params = title_txt.match(/{{[^}}]+}}/g);
  	if(avail_params) {
  	    avail_params.forEach(v => {
  	        let param_value = rxds.m.get_param(v.replace(/{|}/g,""));
  	        if(param_value) title_txt = title_txt.replace(v," " + param_value + " ").replace(/&nbsp;/g,"");
  	    });
  	}*/
  	title_txt = $("<span>" + title_txt + "</span>").text().replace(/\s+/g," ").trim();
  	return title_txt;
  }

  //Added for dark UI
  $('#darkModeToggle').change(async function(){
    
      if($(this).prop("checked")) {
        $("#darkModeLabel").html("Light Mode");
        body.className = "dark-mode pushable";
        rxds.theme_mode = "dark";
        localStorage.setItem("mode","dark");
        
        /* FOR AG GRID THEME */
        if(rxds.hasAGGrid){
          $("body").find("[class^=ag-theme]").attr("class",$("body").find("[class^=ag-theme]").attr("class").replace("ag-theme-balham","ag-theme-balham-dark"));
        }
        
        if( rxds.app.config.theme == 'alnylam') {
          var alnylamSrc = $(".item.logo.vertically.fitted > img").attr("src");
          $(".item.logo.vertically.fitted > img").attr("src",alnylamSrc.replace("alnylam-50px.png","alnylam-50px-white.png"));
          var copyrightSrc = $("#copyright > img").attr("src");
          $("#copyright > img").attr("src",copyrightSrc.replace("RXDSLogoOnWhite-SVG.svg","RXDSLogoOnWhite-SVG-White.svg"));
        }
        else if( rxds.app.config.theme.match(/demo|springWorks/)) {
          var logoSrc = $(".item.logo.vertically.fitted > img").attr("src");
          if(rxds.app.config.theme == 'demo')
            $(".item.logo.vertically.fitted > img").attr("src",logoSrc.replace("RXDSLogoOnWhite-SVG.svg","RXDSLogoOnWhite-SVG-White.svg"));
          else if(rxds.app.config.theme == 'springWorks')
            $(".item.logo.vertically.fitted > img").attr("src",logoSrc.replace("Logo","LogoWhite"));
          var copyrightSrc = $("#copyright > img").attr("src");
          $("#copyright > img").attr("src",copyrightSrc.replace("RXDSLogoOnWhite-SVG.svg","RXDSLogoOnWhite-SVG-White.svg"));
        }
        
        rxds.app.config.echart_theme = "dark";
        await rxds.load_regions();
        rxds.load_fn(rxds, false);
      }
      
      else {
        $("#darkModeLabel").html("Dark Mode");
        body.className = "light-mode pushable";
        rxds.theme_mode = "light";
        localStorage.setItem("mode","light");
        
        /* FOR AG GRID THEME */
        if(rxds.hasAGGrid){
          $("body").find("[class^=ag-theme]").attr("class",$("body").find("[class^=ag-theme]").attr("class").replace("ag-theme-balham-dark","ag-theme-balham"));
        }
        
        if( rxds.app.config.theme == 'alnylam') {
          var alnylamSrc = $(".item.logo.vertically.fitted > img").attr("src");
          $(".item.logo.vertically.fitted > img").attr("src",alnylamSrc.replace("alnylam-50px-white.png","alnylam-50px.png"));
          var copyrightSrc = $("#copyright > img").attr("src");
          $("#copyright > img").attr("src",copyrightSrc.replace("RXDSLogoOnWhite-SVG-White.svg","RXDSLogoOnWhite-SVG.svg"));
        }
        else if( rxds.app.config.theme.match(/demo|springWorks/)) {
          var logoSrc = $(".item.logo.vertically.fitted > img").attr("src");
          if(rxds.app.config.theme == 'demo')
            $(".item.logo.vertically.fitted > img").attr("src",logoSrc.replace("RXDSLogoOnWhite-SVG-White.svg","RXDSLogoOnWhite-SVG.svg"));
          else if(rxds.app.config.theme == 'springWorks')
            $(".item.logo.vertically.fitted > img").attr("src",logoSrc.replace("LogoWhite","Logo"));
          var copyrightSrc = $("#copyright > img").attr("src");
          $("#copyright > img").attr("src",copyrightSrc.replace("RXDSLogoOnWhite-SVG-White.svg","RXDSLogoOnWhite-SVG.svg"));
        }
        
        rxds.app.config.echart_theme = "macarons";
        await rxds.load_regions();
        rxds.load_fn(rxds, false);
      }
      
  });
  /*-------------------------------------------------------------------*/

  exports.user = user;
  exports.gDebug = gDebug;
  exports.env = env;
  exports.m = m;
  exports.launch_tour = launch_tour;
  exports.load_feedback = load_feedback;
  exports.ready = ready;
  exports.load_app = load_app;
  exports.load_complete = load_complete;
  exports.hide_header_footer = hide_header_footer;
  exports.generate_ppt = generate_ppt;
  exports.conditional_regions = conditional_regions;
  exports.conditional_regions_wrap = conditional_regions_wrap;
  exports.load_regions = load_regions;
  exports.load_children = load_children;
  exports.load = load$d;
  exports.createPDF = createPDF;
  exports.replace_params = replace_params;

  return exports;

}({}));
/* Copyright © 2018, RxDataScience,Inc. All rights reserved. */


