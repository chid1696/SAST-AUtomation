/****************************************************************
 *  Contains the init functions..
 *  This is called at the end of the page.. Not through SingApp
 ****************************************************************/
rxds.stopPageProcess = false;
rxds.startRegionRefresh = false;
rxds.loadDataTable  =  function (div, config, data, stTime, parentData) {
            //div.innerText = data;
                  var cols=[],fils=[],i=0;
                  var tabid = ($(div).data("id")?$(div).data("id"):div.id);
                  tabid = tabid.replace("rep","reg"); // Special handling for echart region
                  var d= data;
                  var network = (new Date()).getTime() - stTime;
                  var click_function = function ()  {};
                  var new_function = function ()  {};
                  var set_primary_key = function ()  {};
                  stTime = (new Date()).getTime();

                  if($("#"+tabid)[0].tagName != "TABLE"){ // Inject a table
                    tabid = "Err_" + $(div).attr("id");
                    $(div).html('<table id="' + tabid + '"  data-id="' + tabid + '" class="display" cellspacing="0" width="100%"></table>');
                    div = $("#" + tabid)[0];
                  }

                  $("#"+tabid)[0].innerHTML = "<thead></thead>";

                 if (rxds.app.master_config === undefined) {rxds.app.master_config={};}
                 if (rxds.app.master_config.headers === undefined) {rxds.app.master_config.headers=[];}
                  
                var cols_cust=false;
                  for(var t in d[0]) {
                    var title;
                    //Is there a config for this column?
                    var colSet=R.find(R.propEq('Column', t))(rxds.app.master_config.headers);
                    if (colSet !== undefined) {
                      title=colSet.Label;
                      cols_cust=true;
                      if (colSet.Render==="Number"){
                          cols.push({"title":title, "data":t, className: "dt-body-right", render: $.fn.dataTable.render.number( ',', '.', 0 ) });
                        }
                      else if (colSet.Render==="Percentage"){
                          cols.push({"title":title, "data":t, className: "dt-body-right", render: $.fn.dataTable.render.number(',', '.', 0, '', '%') });
                        }
                        
                      else{
                        cols.push({"title":title, "data":t});
                      }
                    }
                    else { //No settings for this column
                      if (config.initcapHeading == "N") {
                        title = t.replaceAll('_',' ');
                      }else {
                        title= t.initCap().replaceAll(' Id',' ID');
                      }
                      if ((typeof d[0][t] == "number") && (!/Year|_ID$|Zip/i.test(t))){
                          cols.push({"title":title, "data":t, className: "dt-body-right", render: $.fn.dataTable.render.number( ',', '.', 0 ) });
                      } else {cols.push({"title":title, "data":t});}
                    }  
                    fils.push({column_number: i,filter_type: "text",filter_delay: 500});
                    i++;
                  }


                if ( $.fn.dataTable.isDataTable( "#"+tabid ) ) {
                    table = $("#"+tabid).DataTable();
                    table.clear().draw();
                    table.destroy();
                    $('#' + tabid).empty();
                }
 
                 if (config.beforereport !== undefined) {
                  eval(config.beforereport.replaceAll('``',"'")); // Run any requested changes cols
                 }
                 var opts = {};
                 if (!cols_cust) {
                  opts = {
                      "data"   : rxds.sanitizeData(d),
                      "columns": rxds.sanitizeColumns(cols),
                      "scrollX": true,
                      "destroy": true,
                      "aaSorting": [], //disable default sorting, but keeps the column sortable
                      "order"  : [],
                      "deferRender": true,
                      "language": {
                      "loadingRecords": "Please wait - loading..."
                      }
                  };
                 } else {
                   opts = {
                      "data"   : d,
                      "columns": cols,
                      "scrollX": true,
                      "destroy": true,
                      "aaSorting": [], //disable default sorting, but keeps the column sortable
                      "order"  : [],
                      "deferRender": true,
                      "language": {
                      "loadingRecords": "Please wait - loading..."
                      }
                   };
                 }
                 // Pagination size
                 if(config.pagination_size != undefined && config.pagination_size != ""){
                   opts.pageLength = parseInt(config.pagination_size);
                 }
                 
                  if (config.chart_type !== undefined) {
                   opts.scrollY = (config.height == undefined)?400:config.height-150;
                   opts.scrollCollapse =  true;
                  }
                  var table = $("#"+tabid).DataTable(opts);

                  //yadcf.init(table,fils);
                
                  if (config.editregion_id !== undefined) {
                     //Grab data in row pick the primary key for query and trigger loading of the modal edit window
                      click_function = function () {
                          var row_data = table.row(this).data();
                          qJSON = {};
                          set_primary_key(row_data, qJSON);
                          $('#'+config.editregion_id).trigger('loadmodal', [qJSON, set_function, div.id, "Edit"]);
                      };
                      
                      $(div).siblings( "#AddRow" ).on("click",function(){
                        $('#'+config.editregion_id).trigger('loadmodal', [{}, new_function, div.id, "Add"]);
                      });

                  }


                  $('#' + tabid + ' tbody').on('click', 'tr', click_function);
                  

                  //table.destroy();

                if (parentData !== undefined) {
                    var regCache = true;
                    if(rxds.app.config.disable_cache === "Y" || rxds.app.page.config.disable_cache === "Y" || ($(div).data("config") && $(div).data("config").disable_cache === "Y") ){
                        regCache = false;  
                    }
                    if(parentData.cachehit || regCache){
                        // Adding CSV Export button
                        $(div).siblings(".kdbRepRegHeader")
                          .html('<a href="/' + rxds.app.config.url_path + '/download_file?cache_id=' + parentData.disk + '">Export to CSV</a> '
                              + parentData.rowcount + ' record(s)');
                    }else{
                        $(div).siblings(".kdbRepRegHeader").html('Export to CSV not available');   
                    } 
                    
                    $(div).siblings(".kdbRepRegFooter")
                      .html( 'Size:' + parentData.bytecount + ' bytes;'
                           + ' Network time:' + network + ' ms;'
                           + ' Rendering time:' + ((new Date()).getTime() - stTime) + ' ms;'
                           + ' cachehit:' + (regCache?parentData.cachehit:"Cache Disabled")  );
                }

    } //loadDataTable


// Building Page Items
$(":input").each(function(index){
  var id = $(this).attr("id");
  var pi = $(this).data("parent_items");
  var udst_items = (typeof $(this).data("config") =="undefined")?"":$(this).data("config").udst_items;
  if(typeof pi != "undefined" && pi != ""){
    pi = (";" + pi + ";").replaceAll(" ","");
  }else{ pi =""}
  // Merging UDST_Items to parent_items
  if(typeof udst_items != "undefined" && udst_items != ""){
    udst_items = udst_items.replaceAll(",",";").replaceAll(" ","");
    pi = (pi =="" ?";":pi) + udst_items + ";recache_ts;"
  }
  if(typeof id != "undefined" && id != ""){
      rxds.gPageItems[id] = {id:id, obj:this, parent_items:pi}
  }//if id not null check
})

// Add .kdbSelParent or .kdbSelChild class
$(".kdbMulSel").each(function(index){
  var parent = this;
  $(this).addClass("kdbSelParent");// Always assume everything as parent
  $.each(rxds.gPageItems,function(key,obj){
    if( obj.parent_items.indexOf(";"+ parent.id+";" ) > -1 )// Child element parent_items contains reference to Parent element
      $("#"+obj.id).addClass("kdbSelChild");// Add Child element Class
  })
})
// Remove parent class from the Childs
$(".kdbSelChild").removeClass("kdbSelParent");

//Closure function to pass code
function addChangeHandler(elem, code) {
        elem.on("change", function(e){eval(code);});
} //addChangeHandler

// Refresh Events
// Attaching Refresh event to kdbMulSel Item
$( ".kdbMulSel" ).on( "refresh", function( event, ajaxReq ) {
    var obj = this,
        sel = $(this),
        config = $(this).data("config");
 //       multiple = $(this).attr('multiple') === true?true:false;
       var multiple = (config.multiselect == "Y");
    // Send all the queries to ussr and parse the qsql for Template replacement
      var reqJSON = rxds.getReqJSON(this);
      if(config.cache != undefined){
        reqJSON.cache = config.cache;
      }
      reqJSON.query_id = $(obj).data("query_id");
      if (config.dynamic === "Y" /*&& rxds.startRegionRefresh */) { //dynamic searching
        if (ajaxReq !== undefined) {ajaxReq.status = "Complete";}
        sel.select2({
            multiple: multiple,
            minimumInputLength: 3,
            closeOnSelect: false,
            ajax: {
              dataType: 'json',
              delay: 1000,
              data: function (params) {
                return {
                  q: params.term, // search term
                  page: params.page
                };
              },
              transport: function (params, success, failure) { // this function works correctly 
                console.log(params);
                reqJSON.x_q = params.data.q;
                reqJSON.x_page=params.data.page;
                rxds.postReq({ //, params.data
                      //ajaxReq:ajaxReq, No need to track standalone Requests
                      body:reqJSON,
                      done: success,
                      fail: function(xhr,status,error){
                           console.log(".kdbSel, .kdbMulSel Failed:>>" + status + ">>" + error + ">>" + sel);
                           failure();
                           }
                });
                }, // end of transport
              processResults: function (data, params) {
                // parse the results into the format expected by Select2
                // since we are using custom formatting functions we do not need to
                // alter the remote JSON data, except to indicate that infinite
                // scrolling can be used
                params.page = params.page || 1;
          
                return {
                  results: rxds.fnJson2Select2(data),
                  pagination: {
                    more: (params.page * 30) < data.total_count
                  }
                };
              },//end of processResults
              cache: true
            },//end of ajax
            escapeMarkup: function (markup) { return markup; } // let our custom formatter work
            //templateResult: function (item) { return item.name; },
            //templateSelection: function (item) { return item.name; },
            //matcher: function(term, text) { return text.name.toUpperCase().indexOf(term.toUpperCase()) != -1; },
         });

sel.html('<option value="' + config.def + '">' + config.def + '</option>');
sel.val(config.def).trigger("change");
sel.select2('open');
sel.select2('close');

      }
      else {
        rxds.postReq({
          ajaxReq:ajaxReq,
          body:reqJSON,
          done: function(data){
                  // Clear the existing selection
                  sel.html("<option></option>");
                  // Check the data for qerr
                  try{
                    if(typeof data.qerr != "undefined"){
                      console.log("***************** Item \"" + config.label + "\"(" + config.name + ") failed with error >> " + data.qerr  + "  ***************** \n"
                         +  data.submitted.qsql
                         + "\n***************** Submitted ***************** \n" + JSON.stringify( (function(){delete data.submitted.qsql; return data.submitted})())  
                         + "\n********************");
                      data = [{id:"error","text":data.qerr}];
                      config.def = "error";
                      window.setTimeout( function(){$("#select2-" + config.name + "-container").css("color","red")},100);
                    }
                  }catch(e){}
                  sel.data( "source", data );
                  if(multiple){
                    sel.select2( { data:rxds.fnJson2Select2(data), multiple: true});
                  }else{
                    sel.select2( { data:rxds.fnJson2Select2(data)});//, allowClear: true, placeholder:""});
                  }
                  if ((typeof config.def != typeof undefined) && (config.def != "")) {
                    sel.val(config.def.split(";")).trigger("change"); // Multiple options select, pass it as an array
                  }
                },
          fail: function(xhr,status,error){
                  console.log(".kdbSel, .kdbMulSel Failed:>>" + status + ">>" + error + ">>" + sel);
                }
        });// End of rxds.postReq
      } // if not dynamic
      if (config.onchange !== undefined) {
        addChangeHandler(sel, config.onchange);
      }
});

$(".kdbHiddenSel").on( "refresh", function( event, ajaxReq ) {
    var hdn = $(this);
    var reqJSON = rxds.getReqJSON(this);
    reqJSON.query_id = $(this).data("query_id");
    rxds.postReq({
        ajaxReq:ajaxReq,
          body: reqJSON,
          done: function(data){
                  data = data.result;
                  if(typeof $(this).data("config") != "undefined" && $(this).data("config").data_type == "date"){
                    hdn.val( data[0].replaceAll("-",".") );
                  }else{
                    hdn.val( data[0] );
                  }
                }
      });// End rxds.postReq
});


//Attaching refresh event to KDB Report Regions
$( ".kdbRepReg" ).on( "refresh", function( event, ajaxReq ) {
    var div = this;
    var id = $(div).attr("id");
    var tabid = $(div).data("id");
    var config = $(this).data("config");
    // If the report region is used by a flipper
    var stTime = (new Date()).getTime();
    var reqJSON = rxds.getReqJSON(this);
    rxds.addGrpPivMet(reqJSON);     // Add the Group/Pivot/Metric Columns
    reqJSON.x_region_id = this.id;  // Add Region ID & Region Type
    reqJSON.x_region_type = this.className; // Nothing but "kdbRepReg"
    reqJSON.query_id = $(this).data("query_id");  // Add Query ID to qJSON

    eval(config.beforequery); // Run any requested changes to qJSON

    if (config.editable !== undefined) {
        reqJSON.cache = 'N';
    }

    // Validate Pivot & Group by
    if(typeof reqJSON.x_met != "undefined" && reqJSON.x_met == "" && (reqJSON.x_grp != "" ||  reqJSON.x_piv != "")  ){
        alert("Pivoting/Group by operation requires atleast one Metrics to be selected.");
        return;
    }
    try{
      if($("select[id^='x_piv']").length > 0 && reqJSON.x_met == "" && reqJSON.x_grp == ""  &&  reqJSON.x_piv == "" ){
          if( !confirm("You are trying to extract raw data without aggregation.\nPlease make sure you have selected appropriate filters.\nDo you want to continue with your selection?") ){
            return;
          }
      }
    }catch(e){}
    
      if ( $.fn.dataTable.isDataTable( "#"+tabid ) ) {
        $(this)[0].innerHTML="<div id='loader'><center><b>Querying Database....</b></center></div>";
        table = $("#"+tabid).DataTable();
        table.clear().draw();
        table.destroy();
        $('#' + tabid).empty();
      }else{
        $(this)[0].innerHTML="<div id='loader'><center><b>Loading data....</b></center></div>";
        $("#"+tabid)[0].innerHTML="";
      }
    rxds.postReq({
        ajaxReq:ajaxReq,
//      url : rxds.fnGetURL(div)+'/',
        body: reqJSON,
        done: function(data){
            var reportdata;
            try{
              // Check if the query errored out
              if(data.qerr !== undefined){
                console.log(data);
                console.log(data.submitted);
                var x={}; x.qsql = data.submitted.qsql;
                console.log(x);
                rxds.fnShowError(div,data);
                return;
              }else{
                reportdata = (data.result.reportdata === undefined)?data.result:data.result.reportdata;
              }
            }catch(e){
              reportdata = [{"Error":"Returned data is not in DataTable format :" + e}]
              console.log(data);
            }
            rxds.loadDataTable(div,config,reportdata,stTime,data);
            try{$("#"+id+" div#loader")[0].innerHTML="";}catch(e){}
        },// .done()
        fail: function(xhr,status,error){
                console.log("Report Region Failed:>>" + status + ">>" + error + ">>" + sel);
        }
    }); // End rxds.postReq
}); // On Refresh of a KDB Report Region

// Attaching Refresh event to eCharts Region
$( ".rxdsechart" ).on( "refresh", function( event, ajaxReq ) {
    var div = this,
        stTime = (new Date()).getTime();
    var config = $(this).data("config");
    var query_id = $(this).data("query_id");

    if(query_id == ""){
      console.log("Skip");
    }else{
          var reqJSON = rxds.getReqJSON(this);
        reqJSON.query_id = query_id;
        eval(config.beforequery); // Run any requested changes to qJSON
        rxds.postReq({
          ajaxReq:ajaxReq,
//          url :rxds.fnGetURL(div)+'/',
          body:reqJSON,
          done: function(data){
                  // Check for error
                  if(data.qerr !== undefined){
                    rxds.fnShowError(div,data);
                    return;
                  }

                  rxdsechart.fneChart(div,data,config);
                  if ((config.include_report == "Y") && (data.qerr === undefined)) {
                     rxds.loadDataTable($("#"+$(div).data("id")), config, data.result.reportdata, stTime);
                  }
                }
          });// rxds.postReq
    }// if else
});// $(".rxdsechart")

// Attaching Refresh event to Vega Region
$( ".rxdsvega" ).on( "refresh", function( event, ajaxReq ) {
    var div = this,
        stTime = (new Date()).getTime();
    var config = $(this).data("config");
    var query_id = $(this).data("query_id");

    if(query_id == ""){
      console.log("Skip");
    }else{
        var reqJSON = rxds.getReqJSON(this);
        reqJSON.query_id = query_id;
        eval(config.beforequery); // Run any requested changes to qJSON
        rxds.postReq({
          ajaxReq:ajaxReq,
          body:reqJSON,
          done: function(data){
                  // Check for error
                  if(data.qerr !== undefined){
                    rxds.fnShowError(div,data);
                    return;
                  }

                  rxdsvega.fnChart(div,data,config);
                  rxds.loadDataTable($("#"+$(div).data("id")), config, data.result, stTime);
                }
          });// rxds.postReq
    }// if else
});// $(".rxdsvega")

// Attaching Refresh event to Vega Region
$( ".rxdsvegavoyager" ).on( "refresh", function( event, ajaxReq ) {
    var div = this,
        stTime = (new Date()).getTime();
    var config = $(this).data("config");
    var query_id = $(this).data("query_id");

    if(query_id == ""){
      console.log("Skip");
    }else{
        var reqJSON = rxds.getReqJSON(this);
        reqJSON.query_id = query_id;
        eval(config.beforequery); // Run any requested changes to qJSON
        rxds.postReq({
          ajaxReq:ajaxReq,
          body:reqJSON,
          done: function(data){
                  // Check for error
                  if(data.qerr !== undefined){
                    rxds.fnShowError(div,data);
                    return;
                  }

                  //rxdsvega.fnChart(div,data,config);
                  //rxds.loadDataTable($("#"+$(div).data("id")), config, data.result, stTime);
                  const libVoyager = require('voyager');
                  const container = document.getElementById("#"+$(div).data("id"));
                  const voyagerInstance = libVoyager.CreateVoyager(container, undefined, data);
                }
          });// rxds.postReq
    }// if else
});// $(".rxdsvegavoyager")

//Attaching refresh event to Template Report Regions
$( ".tmplReg" ).on( "refresh", function( event, ajaxReq ) {
    var div = this;
    var config = $(this).data("config");
//    var query= " ";
    var query_id = $(this).data("query_id");
    var template= config.template;

    //front-matter support
      var f=template.split(/---/m);
      if (f.length===3) {
         var front = {};
         try {eval("front="+f[1]);} catch (e) {console.log('Error parsing front-matter as JSON:' + f[1]);console.log(e);}
        template=f[2];
        $.each(front,function(v,i){template=template.replaceAll(v,i);});
      } // If there is front-matter

    if ( typeof config.beforechart != "undefined") {

      eval(config.beforechart.replace(/\`\`/g,"'"));
    }

      var reqJSON = rxds.getReqJSON(this);
      reqJSON.query_id = query_id;
      rxds.postReq({
          ajaxReq:ajaxReq,
          //url : rxds.fnGetURL(div)+'/',
          body: reqJSON,
          done: function(data){
                  //div.innerText = data.result;
                  try {


                    if(data.qerr !== undefined){
                      console.log(data);
                      console.log(data.submitted);
                      var x={}; x.qsql = data.submitted.qsql;
                      console.log(x);
                      rxds.fnShowError(div,data);
                      return;
                    }


                    tmpl.arg = "qout";
                    tmpl.regexp = /([\s'\\])(?!(?:[^<]|\<(?!%))*%\>)|(?:\<%(=|#)([\s\S]+?)%\>)|(\<%)|(%\>)/g;
                    $(div).html(tmpl(template, data.result));
                    if (/easypie/.test(config.widget_type)) {
                       $(".tmplReg").trigger("pierefresh");
                    }
                  } catch (e) {
                    div.innerText = "Error applying template: " + e.message;
                  }
                },// End done cb
          fail: function(err){
                  div.innerText = "Error" + err.responseText;
                }
      });// End rxds.postReq
}); // On Refresh KDB Template Region


//Attaching refresh event to Plugin Template Regions
$( ".pluginReg" ).on( "refresh", function( event, ajaxReq ) {
    var div = this;
    var config = $(this).data("config");
//    var query= " ";
    var query_id = $(this).data("query_id");
    var template= config.template;
    var param = config.param;
    var func_call = config.func_call;

    //front-matter support
      var f=template.split(/---/m);
      if (f.length===3) {
         var front = {};
         try {eval("front="+f[1]);} catch (e) {console.log('Error parsing front-matter as JSON:' + f[1]);console.log(e);}
        template=f[2];
        $.each(front,function(v,i){template=template.replaceAll(v,i);});
      } // If there is front-matter

    if ( typeof config.beforechart != "undefined") {

      eval(config.beforechart.replace(/\`\`/g,"'"));
    }

      var reqJSON = rxds.getReqJSON(this);
      reqJSON.query_id = query_id;
 //     reqJSON.x_fil_step = "";
      rxds.postReq({
          ajaxReq:ajaxReq,
          //url : rxds.fnGetURL(div)+'/',
          body: reqJSON,
          done: function(data){
                  //div.innerText = data.result;
                  try {
                    tmpl.arg = "qout";
                    tmpl.regexp = /([\s'\\])(?!(?:[^<]|\<(?!%))*%\>)|(?:\<%(=|#)([\s\S]+?)%\>)|(\<%)|(%\>)/g;
                    $(div).html(template);
                    eval(func_call);
                  } catch (e) {
                    div.innerText = "Error applying template: " + e.message;
                  }
                },// End done cb
          fail: function(err){
                  div.innerText = "Error" + err.responseText;
                }
      });// End rxds.postReq
}); // On Refresh Plugin Template Region


//Attaching refresh event to Plotly Regions
$( ".rxdsplotly" ).on( "refresh", function( event, ajaxReq ) {
    var div = this,
        type = "",
        layout = "",
        traces = [];

     //type = "'"+$(this).data("charttype")+"'";
     type = $(this).data("charttype");
      console.log(type);
      var trace1 = {
        x: ['Apples', 'Bananas', 'Cantoulpe', 'D'],
        y: [10, 11, 12, 13],
        type: type
      };
      var trace2 = {
        x: ['A', 'Beets', 'Carrots', 'D'],
        y: [20, 30, 50, 60],
        type: type
      };

      layout = {barmode: 'group'};
      traces.push(trace1,trace2);

    rxdsplotly.fnPlotly(div,traces,layout);

    //Plotly.newPlot(div,data,layout);

});// $(".rxdsplotly")

//Attaching refresh event to easypie Regions
$( ".tmplReg" ).on( "pierefresh", function( event, ajaxReq ) {
    //easypie

    $('.easypiechart').easyPieChart({
      easing: 'easeOutBounce',
      lineWidth: '6',
      barColor: '#75BCDD',
      onStep: function(from, to, percent) {
        $(this.el).find('.percent').text(Math.round(percent));
      }
    });
    var chart = window.chart = $('.easypiechart').data('easyPieChart');
    $('.js_update').on('click', function() {
      chart.update(Math.random() * 200 - 100);
    });

    //hover and retain popover when on popover content
/*
    var originalLeave = $.fn.popover.Constructor.prototype.leave;
    $.fn.popover.Constructor.prototype.leave = function(obj) {
      var self = obj instanceof this.constructor ?
        obj : $(obj.currentTarget)[this.type](this.getDelegateOptions()).data('bs.' + this.type);
      var container, timeout;

      originalLeave.call(this, obj);

      if (obj.currentTarget) {
        container = $(obj.currentTarget).siblings('.popover');
        timeout = self.timeout;
        container.one('mouseenter', function() {
          //We entered the actual popover – call off the dogs
          clearTimeout(timeout);
          //Let's monitor popover content instead
          container.one('mouseleave', function() {
            $.fn.popover.Constructor.prototype.leave.call(self, self);
          });
        });

      }
    };

    $('body').popover({
      selector: '[data-popover]',
      trigger: 'click hover',
      delay: {
        show: 50,
        hide: 400
      }
    });*/

});// $(".easypiechart")

// Attaching event to Date Toggle radio
$("input[name='x_datetype']").on('date:toggle',function(event,arg1,arg2,arg3,arg4,period){

    var inputstr = "input:radio[name="+arg1+"]:checked";
    var periodstr = "input:radio[name="+period+"]:checked";
    var customdate = $(inputstr).val()
        ,period = $(periodstr).val()
        ,startdate = ""
        ,enddate = ""
        ,maxdate = "";
    maxdate = $(arg4).val();

 //   enddate = moment(maxdate,'YYYY.MM.DD').endOf('month').subtract(1,'months').format('YYYY.MM.DD');

    if (period === "Monthly") {
         enddate = moment(maxdate,'YYYY.MM.DD').endOf('month').format('YYYY.MM.DD');
         startdate = moment(enddate,'YYYY.MM.DD').startOf('month').format('YYYY.MM.DD');
    }else if (period === "Weekly") {
         enddate = moment(maxdate,'YYYY.MM.DD').endOf('week').format('YYYY.MM.DD');
         startdate = moment(enddate,'YYYY.MM.DD').startOf('week').format('YYYY.MM.DD');
    }else{
         enddate = moment(maxdate,'YYYY.MM.DD').endOf('quarter').format('YYYY.MM.DD');
         startdate = moment(enddate,'YYYY.MM.DD').startOf('quarter').format('YYYY.MM.DD');
    }


    $(arg2).attr('readonly','true');
    $(arg3).attr('readonly','true');

    //console.log(arg1+"======"+customdate);
    //console.log(arg4+"+++++++"+maxdate);
    //console.log("Period++++++++"+period);

    if (customdate === "custom") {

        $(arg2).removeAttr('readonly');
        $(arg3).removeAttr('readonly');

      if ((arg3 === null) || (arg3 === "")) {
        enddate = enddate  ;
      }else{
         enddate = $(arg3).val();
      }

      if ((arg2 === null) || (arg2 === "")) {
          startdate = startdate;
      }else{
         startdate = $(arg2).val();
      }


      $(arg2).datetimepicker({
          format: "YYYY.MM.DD",
          useCurrent: false,
          maxDate: moment(enddate,'YYYY.MM.DD') ,
          minDate: moment("1995.12.01", "YYYY.MM.DD")
      });

      $(arg3).datetimepicker({
          format: "YYYY.MM.DD",
          useCurrent: false,
          maxDate: moment(enddate,'YYYY.MM.DD') ,
          minDate: moment("1995.12.01", "YYYY.MM.DD")
      });

  }else{

        if (period === "Monthly") {
           startdate = moment(enddate,'YYYY.MM.DD').startOf('month').subtract(parseInt(customdate.replace("current","")),'month').format('YYYY.MM.DD');
        }else if (period === "Weekly"){
           startdate = moment(enddate,'YYYY.MM.DD').startOf('week').subtract(parseInt(customdate.replace("current","")),'week').format('YYYY.MM.DD');
        }else{
          startdate = moment(enddate,'YYYY.MM.DD').startOf('quarter').subtract(parseInt(customdate.replace("current","")),'quarter').format('YYYY.MM.DD');
        }

    }

    $(arg2).val(startdate);
    $(arg3).val(enddate);

}); //date picker

//Binding Click event to the Query button
$("#query").bind("click", function() {
  window.setTimeout("rxds.updateURL()",200);
  refreshRegion();
});
// Binding Click event to the Submit button (Fires refresh after the validation)
$("#Submit").bind("click", function() {
    if ($('form').parsley().validate()) {
      refreshRegion();
      rxds.updateURL();
    }
});

// Redraw the DataTable on page resize
$(window).on('resize sing-app:content-resize', function() {
  $(".dataTable").each(function(){
    $(this).DataTable().draw("page")
  });
});


function updateRegionTitle(){
  // Substituting values for the Bind Labels
  $(".bindItem").each(function(){
    $(this).html( $("#" + $(this).data("item") ).val().replaceAll("_"," ")  );
  });
}

function rxds_startup() {
    if (/ords/.test(window.location.pathname)) {
      return;
    }

    //Set current page
    var p = $.grep(rxds.app.pages, function(obj) {
       return obj.page_id === $("main").data("pageid");
    });
    if (p.length===1){rxds.app.page=p[0]};
    try{
      eval(rxds.app.page.config.onload);
    }catch(e){}


    // Stop page processing for Special pages like CohortUI
    if(rxds.stopPageProcess){
      return;
    }

    // Build Query String Array
    var url   = window.location.search.substring(1);
    if(url != ""){
      $(url.split('&')).each(function(){
        var pair = this.split('=');
        rxds.gQueryString[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      });
    }

    // Check if query ID is passed
    if(rxds.gQueryString["Query_ID"] != undefined ){
        rxds.postReq({
                body: {"cache":"N", "qsql":"APP_QUERY_select[`" + rxds.gQueryString["Query_ID"] + "]", region_item:"retrive_Query"},
                done: function(data){
                  try{
                    rxds.gQueryID_JSON = JSON.parse(data.result[0].json[0]);//data.result[0];
                  }catch(e){console.log("Restoring Saved Query failed");}
                  // Restore Items Vals() followed by Item Load() followed by Region refresh
                  restoreItemVal();
                },// .done()
                fail: function(xhr,status,error){
                        console.log("Retriving Query_ID:" + rxds.gQueryString["Query_ID"] + " parameters Failed:>>" + status + ">>" + error);
                }
            }); // End rxds.postReq


    }else{
        // Restore Items Vals() followed by Item Load() followed by Region refresh
        restoreItemVal();
    }
}
function restoreItemVal(){

     $(":input").each(function(index){
      var id = $(this).attr("id") || $(this).attr("name");
      var type = $(this).attr("type") || this.nodeName;
      if((typeof id != "undefined" && id != "") || type == "radio"){
          var ItemVal = rxds.gQueryString[id] || rxds.gQueryID_JSON[id];
          if(typeof ItemVal != "undefined" && ItemVal.substr(0,1) == '"'){
              ItemVal = ItemVal.replaceAll("\";\"",";");
              ItemVal = eval(ItemVal);
          }
          if(ItemVal != undefined){
              rxds.setItemVal(this,ItemVal);
          }else if( rxds.gQueryString["Query_ID"] != undefined  && (id.indexOf("x_grp") == 0 || id.indexOf("x_piv") == 0 || id.indexOf("x_met") == 0)   ){
              // Special handling for group by, pivot & metrcis where all items values are combined to one variable x_grp, x_piv and x_met
              //   also values are embeded in double quotes, remove those  x_grp_gen ==> '"a";"b"' ==> 'a;b'
              var ItemVal = rxds.gQueryID_JSON[id.substr(0,5)].replaceAll("\";\"",";");
              ItemVal = (ItemVal == "")?"ZZZZ":eval(ItemVal); // Set non existent val for blank to prevent blank being selected
              //console.log( id + " value set to>>" + ItemVal);
              try{$(this).data("config").def = ""}catch(e){}
              rxds.setItemVal(this,ItemVal);
          }else if(type == "text" && $(this).hasClass("date") && typeof $(this).data("config").def != "undefined" ){
              rxds.setItemVal(this,$(this).data("config").def);
          }else if(type == "radio"){
              rxds.setItemVal(this,$(this).data("config").def);
          }//if ItemVal check

      }//if id not null check
    })
      // Start with Parent Item Refresh
      refreshParentItem();
}// restoreItemVal

//.kdbSelParent or .
function refreshParentItem(){

  console.log('Starting Parent Item Loading...');
  $(".form-control.date").datetimepicker({useCurrent:false,format: "MM/DD/YYYY"});
  rxds.refresh(".kdbSelParent,.kdbHiddenSel",refreshChildItem);

} // refreshItem

function refreshChildItem(){
    //Parent Item Refresh Complete. Now attach on Change Event to them
    $( ".kdbSelParent,#x_geo_level").on("change",function(event){
      var parent = this;
      if(rxds.gDebug) console.log(parent.id + " Changed");
      $.each(rxds.gPageItems,function(key,obj){
        //if( obj.qsql.indexOf("{{"+ parent.id+"}}" ) > 0 )// Child element qsql contains reference to Parent element
        if( obj.parent_items.indexOf(parent.id) > 0 )// Child element parent_items contains reference to Parent element
          $("#"+obj.id).trigger("refresh");
      })
    });

  // Refresh All Child Items and call refresh Region
  console.log('Starting Child Item Loading...');
  rxds.refresh(".kdbSelChild",refreshRegion);


}

function refreshRegion(){
  // Some Input parameters Changed.. Update the Drill Down Links
  rxds.updateDDLinks();
  updateRegionTitle();
  console.log('Starting Region Refresh...');
  rxds.startRegionRefresh = true;// Page Items loaded, start the Region Refresh
  $("input[type=radio]").trigger("date:toggle",['x_datetype','#x_startdate','#x_enddate','#x_maxdate','x_period']);
  $(".rxdsechart").trigger("refresh");
  $(".rxdsvega").trigger("refresh");
  $(".kdbRepReg") .trigger("refresh");
  $(".tmplReg")   .trigger("refresh");
  $(".rxdsplotly").trigger("refresh");
  $(".dimChartReg").trigger("refresh");
  $(".vennReg").trigger("refresh");
  $(".tableditReg").trigger("refresh");
  $(".horReg").trigger("refresh");
  $(".pluginReg").trigger("refresh");
}


$(function() { // This is called through jQuery onload so that it gets called at the end of other jQuery on load functions

      if (/apex/.test(window.location.href)) {
      return;
    }

    // Set the App User
    if(localStorage.getItem("rxds-user") != null){
      rxds.user = JSON.parse(localStorage.getItem("rxds-user"));
      $("#li_user").html("<b>" + rxds.user.name + "</b>");
      rxds_startup();
    }else{
      $.get("/whoami",function(data){
        try{
          if(typeof data.email != "undefined"){
            localStorage.setItem("rxds-user",JSON.stringify(data));
            rxds.user = data;
            rxds_startup();
          }
        }catch(e){
          console.log("/whoami Exception:" + e);
          rxds.user = {name:"unknown",email:"unavilable"};
        }//try
        $("#li_user").html("<b>" +rxds.user.name + "</b>")
      });//$.get()
    }//else


});// jQuery Onload


$("input[name='x_datetype']").change(function(){

  $(this).trigger("date:toggle",['x_datetype','#x_startdate','#x_enddate','#x_maxdate','x_period']);
  console.log("fired period on change event")
  return false;
})

