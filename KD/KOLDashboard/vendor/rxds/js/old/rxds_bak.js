// rxds Object definition
var rxds = (function() {
    var app = {};
    var user;//Holds the User Object
    var ajaxCallback  = []; // Holds the array of ajax Callbacks
    var gPageItems    = {};// Contains all page Input items {id,qsql}
    var gQueryString  = {};// Query String Item:Val Array
    var gQueryID_JSON = {};// Item JSON for the passed Query ID
    var gDebug = true;
    var env="client";

    // setItemVal -> Sets Value for the given item id or item name or the item itself
    function setItemVal(item,val){
        if(typeof val == "undefined") return;
        var type = $(item).attr("type") || item.nodeName;
        var key = $(item).attr("data-name") || $(item).attr("name") || $(item).attr("id") || "";
        var data_type = "";
        try{
            data_type = $(item).data("config").data_type;
        }catch(e){}
if(key == "x_fil_age_group") debugger;
//console.log("Setting "+type + ">>" +  key + ":" + val)
        if(type == "text" && $(item).hasClass("date") ){
            // Special handling for date
              val = val.replace(/\./g,"/").replaceAll("-","/");
            if(val.indexOf(".") == 4 || val.indexOf("-") == 4 || val.indexOf("/") == 4 ){
              // In yyyy.mm.dd format
              var v = val.split("/");// 0:yyyy 1:mm 2:dd
              val = v[1] + "/" + v[2] + "/" + v[0];
            }
            $(item).val(val);
        }else if(type == "text" || type == "textbox"){
            $(item).val(val);
        }else if(type == "radio"){
            if($(item).val() == val){
              $(item).prop("checked",true).trigger("click");
            }
        }else{

            // Special handling for date
            if(type == "date" || key.indexOf("date") > -1 || key.indexOf("year") > -1 )
                val = val.replace(/\./g,"-");

            // Special handling for select item values enclosed with double quotes
            if(type == "SELECT"){
                val = val.replaceAll('";"',';');// KDB Uses ;
                if(val.substring(0,1) == '"')
                  val = eval(val);
                //Special handling for short and real suffied with "h" and "e" by kdb
                if(data_type == "short") val = val.replace("h","");
                if(data_type == "real")  val = val.replace("e","");
                
            }

            var config = $(item).data("config");
            config.def = val; // Set or Override the Default value
            $(item).data("config",config);

            if($(item).hasClass("select2")){//Select2 list box. Manually set the default
                $(item).val(val.split(";")).trigger("change");
            }
        }// attr type check

    }

    // Based on Item types gets the Item Value and returns it
    // Handles multiple Item Types like Checkbox, Radio, Select 2 etc
    function getItemVal(item){
        var refItem, val="";
        if(typeof item == "string" && document.getElementsByName(item).length >0){
          refItem = document.getElementsByName(item)[0]; // Item has no id like Checkbox or Radio button. Grab the first one
        }else if(typeof item == "string" && item.substring(0,1) != "#"){
          refItem = "#" + item;// Append # if missing
        }else{
          refItem = item;
        };
        var type = $(refItem).attr("type") || $(refItem)[0].nodeName;
        //var key =  $(refItem).attr("name") || $(refItem).attr("id");

        if(type == "SELECT"){
            val = $(refItem).val();// Select2 V 4.0 uses the default val()
            if(typeof val == "undefined"){
              val = "";
            }else if(typeof val == "object"){
              // Object is Multiselect
              val = rxds.mapreduce(val,';');
            }
        }else if(type == "radio" || type == "checkbox"){
            if(typeof item == "object"){
              if(item.checked){
                val =  $(item).val();
              }
            }else{
              // Iterate through the name array
              document.getElementsByName(item).forEach(function(radio){
                if(radio.checked){val += ";" + $(radio).val();}
              });
              val = val.substr(1);
            }
        }else{
          val = $(refItem).val();
        }
        return val;//encodeURIComponent(val);
    }

    // Format's theItem Value in KDB friendly format
    function getItemValJSON(item){
      try{
        var refItem;
        if(typeof item == "string" && document.getElementsByName(item).length >0){
          refItem = document.getElementsByName(item)[0];// Item has no id like Checkbox or Radio button. Grab the first one
        }else if(typeof item == "string" && item.substring(0,1) != "#"){
          refItem = "#" + item;
        }else{
          refItem = item;
        };
        var type = $(refItem).attr("type") || $(refItem)[0].nodeName;
        var key =  $(refItem).attr("name") || $(refItem).attr("id");
        if(type == "A"){return ""};

        // Determine the data_type for the item
        var data_type = "";
        try{ data_type = (typeof $(refItem).data("config").data_type == "undefined")?"":$(refItem).data("config").data_type;}catch(e){}

        var val = getItemVal(item);

        
        if (type == "text" && $(refItem).hasClass("date") ){
            // Special handling for Date
            val = rxds.qdate(val);
        }else if (type == "text" || type == "hidden" || type === "textbox" || type === "TEXTAREA" || key == "x_metric" || val == ""){
            // Do nothing
        }else if(data_type == "number" || data_type == "symbol"){
            // Do nothing
        }else if(data_type == "short"){
            val = val.replaceAll(";","h;") + "h";
        }else if(data_type == "real"){
            val = val.replaceAll(";","e;") + "e";
        }else if(type =="date" || key.indexOf("date") >= 0 || key.indexOf("year") >= 0){// Special handling for date items
            val = val.replaceAll("-",".");
        }else{
            val = '"' + val.replaceAll(';','";"') + '"';
        }

        return val;
      }catch(e){
        throw "Unable to find getItemValJSON for item >>" + item + "<< Exception:" + e;
      }
    }
    
    // Updates the browser URL without loading it
    function updateURL(){
      var url = "";
      $(":input").each(function(index){

        var key = $(this).attr("data-name") || $(this).attr("name") || $(this).attr("id");
        if( key != undefined && key.indexOf("GRID") == 0)
          return;// Skip the loop

        var val = getItemVal(this);
        // If val != "" or val != default add it to URL
        if(val != "") url += "&" + key + "=" + val;

      });// $(":input")

      if(url != ""){
          url = "?" + url.substring(1);
          //console.log("Url Changed to " + url);
          window.history.pushState(null,null,url);
      }
    }

    // Updating drill down links

    function updateDDLinks(){

      var href = "";
      $(":input").each(function(){
          var key  = $(this).attr("name") || $(this).attr("id");
          var type = $(this).attr("type") || this.nodeName;
          var val  = "";

          if(typeof key == "undefined" || key == "" || key.indexOf("GRID") ==0 || type == "HIDDEN")
            return; // Skip this Item

          val = getItemVal(this);

          if(val != undefined && val != ""){
              href += "&" + key + "=" + val;
          }

      });// end :input

      $(".drillDown").each(function(){
        var baseHref = $(this).data("href");
        if(baseHref.indexOf("?") > 0){
          $(this).attr("href",baseHref + href);
        }else{
          // Add "/?" at the end.. remove "&" from href and append
          $(this).attr("href", (baseHref + "/?").replaceAll("//","/") + href.substr(1)  );
        }
      });// End .drillDown

    }// End of updateDDLinks

    function qsql_parm() {
    var log="";var query="";
    rxds.fngetJSON("","","ussr", query, function(qJSON){
          for (t in qJSON){
            var val= qJSON[t];
            val = (typeof val == "string") ?  val.replace(/\"/g,'\\"') : val;
             log = log + "localStorage['val" + t + "']='" + val + "'; \n";}
        });
    console.log(log);
    } //qsql_parm


    // Eventually this will replace fngetJSON()
    // p_reqObj can be an Item or Region. (Can be object or item name with or without #)
    // Returns the JSON object for the parent Items referenced..
    // Empty object if there are no items referenced
    // If p_selector is passed, all the items matches that criteria gets returned
    function getReqJSON(p_reqObj,p_selector){
      var reqJSON = {};
      // Append # if missing
      if(typeof p_reqObj == "string" && p_reqObj.substring(0,1) != "#"){p_reqObj = "#" + p_reqObj};
      
      var PI = $(p_reqObj).data("parent_items");
      if( typeof PI != "undefined" && PI != ""){
          PI.split(";").forEach(function(item) {
            item = item.trim();
            reqJSON[item] = getItemValJSON(item);
          });
      }
      var UI = $(p_reqObj).data("config").udst_items;
      if( typeof UI != "undefined" && UI != ""){
          var recache_ts = $("#recache_ts").val();
          if(typeof recache_ts == "undefined" || recache_ts == "")
            throw "UDST Items in use, however recache_ts is empty or not defined";
          reqJSON.recache_ts = recache_ts;
          UI = UI.replaceAll(",",";").replaceAll(" ","");
          UI.split(";").forEach(function(item) {
            item = item.trim();
            reqJSON[item] = getItemValJSON(item);
          });
      }
      var RI = $(p_reqObj).data("config").region_items;
      if( typeof RI != "undefined" && RI != ""){
          RI = RI.replaceAll(",",";").replaceAll(" ","");
          RI.split(";").forEach(function(item) {
            item = item.trim();
            reqJSON[item] = getItemValJSON(item);
          });
      }

      // Adding x_query_name for DataPrep .kdbRepReg
      if($(p_reqObj).hasClass("kdbRepReg")  && $("#x_query_name").length == 1 && $("#x_query_name").val() != "") reqJSON.x_query_name = $("#x_query_name").val();
      
      // Adding page Name
      reqJSON.x_page_name = rxds.app.page.page_name;

      // Check disable cache enabled
      if(rxds.app.config.disable_cache === "Y" || rxds.app.page.config.disable_cache === "Y" || ($(p_reqObj).data("config") && $(p_reqObj).data("config").disable_cache === "Y") ){
          reqJSON.cache = "N";  
      }

      // Checking for qdb
      if(($(p_reqObj).data("config") && typeof $(p_reqObj).data("config").qdb != "undefined" && $(p_reqObj).data("config").qdb != "")  ){
        reqJSON.qdb = $(p_reqObj).data("config").qdb;
      }
      
      return reqJSON;
    }

    function getAllJSON(p_reg_items){
        var reqJSON = {};
    
      p_reg_items.split(";").forEach(function(item) {
        item = item.trim();
        reqJSON[item] = getItemValJSON(item);
      });
      return reqJSON;
     }    

    function addGrpPivMet(reqJSON){
        var x_grp = "";
        var x_piv = "";
        var x_met = "";
        
        $(":input").each(function(index){
          var key = $(this).attr("data-name") || $(this).attr("name") || $(this).attr("id");
          if(typeof key != "undefined" && key != ""){
            if(key.indexOf("x_grp") == 0 && x_grp.indexOf(key) == -1 && getItemValJSON(this) != ""){x_grp += ";" + getItemValJSON(this)};
            if(key.indexOf("x_piv") == 0 && x_piv.indexOf(key) == -1 && getItemValJSON(this) != ""){x_piv += ";" + getItemValJSON(this)};
            if(key.indexOf("x_met") == 0 && x_met.indexOf(key) == -1 && getItemValJSON(this) != ""){x_met += ";" + getItemValJSON(this)};
          }//if key not null check
        })
        reqJSON.x_grp = x_grp.substr(1);
        reqJSON.x_piv = x_piv.substr(1);
        reqJSON.x_met = x_met.substr(1);
    }

    // Returns the JSON representation of the entire page items as string..
    function fngetJSON(p_region,p_selector,x_fn,qsql,cbk){
        if(p_selector == undefined || p_selector == ""){
          p_selector = ":input";
        }
        if(p_region == undefined || p_region == ""){
          objArr = $(p_selector);
        }else{
         objArr = $(p_region).filter(p_selector);
        }

        var chkName = "";
        var qJSON = {x_user:rxds.user.email,x_app_name:rxds.app.name
                     ,x_app_id:String(rxds.app.app_id)
                     ,x_page_name:rxds.app.page.page_name
                     ,limitRows:10000
                     ,x_page_id:String(rxds.app.page.page_id)
        };
        if (rxds.app.name == "App Builder") {
           $.extend(qJSON,editor.getValue());
        }
        var x_grp="",x_piv="",x_met="";

        if(x_fn == undefined || x_fn == ""){
          x_fn = "execdict";
        }
        qJSON.x_fn = x_fn;

        // Balaji Implementation
        if (rxds.app.name !== "App Builder") {
          objArr.each(function(index){
            var blnSkip = false;
            var key, val = "";
            if(qsql != ""){ // Skip the data-name and use name or id
              key = $(this).attr("name") || $(this).attr("id");
            }else{// Preparing Data Prep Query.. Use data-name if available
              key = $(this).attr("data-name") || $(this).attr("name") || $(this).attr("id");
            }
            var val = "";
            var type = $(this).attr("type") || this.nodeName;
  
            if(typeof key === "undefined" || key=="" || key=="x_user" || type == "button" || type == "submit" || type == "search" || key.search("s2id") == 0){
                //console.log("Skipping index " + index + ":" + this.outerHTML)
                blnSkip = true;
            }else if (( type == "text" || type == "hidden" || type === "textbox")
                        && !$(this).hasClass("kdbMulSel")){
                val =  $(this).val();
            }else if( type == "date" ){ // added by krish
                val = $(this).val().replaceAll("-",".");
            }else if(type =="radio" ){
                if(this.checked){
                  val = $(this).val();
                }else{
                  blnSkip = true;
                }
            }else if(type =="checkbox" ){
                if(key != chkName){
                  chkName = key;
                  val = $( "input[name='" + key + "']").filter("input:checked").map(function(){return this.value }).get();
                  val=rxds.mapreduce(val,';','"');
                }else{
                  blnSkip = true;
                }
            }else if (type == "SELECT") {
              val =  $(this).val();// Select2 V 4.0 uses the default val()
              if(typeof val == "undefined"){
                val = "";
              }else if(typeof val == "object"){
                // Object is Multiselect
                if ((key.indexOf("date") == -1) && ( key !== "x_metric")  ){
                    val = rxds.mapreduce(val,';','"');
                } else {
                    val = rxds.mapreduce(val,';','');
                }
              }else if(key.indexOf("date") == -1 && key.indexOf("year") == -1 && val != "" && key !== "x_metric"){
                val = '"'+val+'"'; // Enclose the value in "", except date
              }
  
              if (x_fn == "ussr") {
                if (val.search(/\`/) > -1) {
                    //If there is a symbol in the field remove commas
                    val=val.replace(/\,/g,'');
                }
                else if (key.indexOf("date") > -1) {
                    val=val.replace(/\,/g,';').replace(/-/g,'.');
                }
              }// end of ussr
            }else if(type == "TEXTAREA"){
              val = $(this).val();
            }else if(type == "list"){
              val = $(this).val();
            }else{
                //console.log("Skipping index " + index + ":" + type + ">>" + this.outerHTML );
                blnSkip = true;
            }
  
            if(!blnSkip){
  
              // Including Pivot & Group by, always add so that it can be restored
              qJSON[key] = val;
  
              if(key.indexOf("x_grp") == 0){
                if (val !== "") {x_grp += ";" + val.replace(/,/g,';')};
              }else if(key.indexOf("x_piv") == 0){
                if (val !== "") {x_piv += ";" + val.replace(/,/g,';')};
              }else if(key.indexOf("x_met") == 0){
                if (val !== "") {x_met += ";" + val.replace(/,/g,';')};
  //            }else if(key.indexOf("x_fil") == 0){
  //              x_fil += "," + val;
              }else if(key.indexOf("date") >= 0) {
                qJSON[key] = val.replace(/-/g,'.');
              //}else{
              //  qJSON[key] = val;
              }
            }
  
          });// End of $(p_selector) objArr each
        } // If not app Builder

        if(x_grp != undefined && x_grp != ""){
            qJSON.x_grp = x_grp.substring(1);
        }
        if(x_piv != undefined && x_piv != ""){
            qJSON.x_piv = x_piv.substring(1);
        }
        if(x_met != undefined && x_met != ""){
            qJSON.x_met = x_met.substring(1);
        }

        if(qsql != undefined && qsql != ""){
           rxds.parseQSql(qsql,qJSON,cbk);
        }
        else {
          cbk(qJSON);
//        return qJSON;
        }

    }// End of fngetJSON

    // Populating the selectbox from KDB
    // For future Use
    function fnLoadSel(p_Sel,p_url){
        $(p_Sel).select2({
            allowClear: true,
            placeholder: "",
            theme:"classic",
            ajax: {
                url: p_url,
                processResults: function (json) {
                    var data = $.map(eval(json), function (obj) {
                        obj.id   = obj.PROPRIETARYNAME;
                        obj.text =  obj.PROPRIETARYNAME;
                        return obj;
                    });
                    console.log(data);
                    return {
                        results: data
                    };
                }
            }
        });
    }

  // Refresh Functions
  /*********************************************************************
   * Global Refresh function which triggeres refresh on matched elements
   * p_sel => jQuery Selector, This is required
   * callback => Call Back function (optional)
   *    Passes ajaxReq to the Call Back function which contains the reference
   *      to the ajax Req array element
   * If the selector matches no element, it calls the CallBack immediately
   *********************************************************************/
  function refresh(p_sel,callback){
    if(typeof p_sel == "undefined" || p_sel == ""){
      throw "rxds.refresh called without selector";
    }
    if(typeof callback == "undefined"){ callback = function(){void(0)}}
    if($(p_sel).length == 0){
      console.log(p_sel + " didn't match any element. Calling callback()..");
      callback()
    }else{

        // Attach Global ajaxReq array to the callback
        // Example: arrAjaxReq = [{status:"Pending"},{status:"Complete"},{status:"error"}];
        var arrAjaxReq = []; // Will have reference to ajax requests added by postReq before making requests

        //Called by postReq.done() or .error() event
        // Array index, Element, Start Time & Error message gets passed back
        var ajaxComplete = function(ajaxReq){
          ajaxReq.timeTaken = ((new Date()).getTime() - ajaxReq.stTime);
          for(var i=0; i<arrAjaxReq.length;i++){
            if(arrAjaxReq[i].status == "Pending"){
              return; // Requests are still in flight. Break the Loop & Exit the Function.
            }
          }
          // All the ajax request is Complete. Call the Callback
          console.log(arrAjaxReq.length + " AJAX Calls completed for selector => " + p_sel);
          ajaxCallback[ajaxCallback.length] = arrAjaxReq;
          callback();
        }//function ajaxComplete

        // Trigger the refresh and track the ajax request
        $(p_sel).each(function(index){
          var ajaxReq ={};
          ajaxReq.id = index;
          ajaxReq.status = "Pending";
          ajaxReq.stTime = (new Date()).getTime();
          ajaxReq.callback = ajaxComplete
          arrAjaxReq[index] = ajaxReq;
          $(this).trigger("refresh",ajaxReq);
        });
    }
  }// End of function refresh

    // Onload Events
    // AJAX POST implementation for Dropdowns
    //rxds.postReq("https://kdb.balajict.com/rxm/",'{"x_fn":"getMkt[]"}').done(function(data){console.log("done==>" + data)});
    //rxds.postReq("https://kdb.balajict.com/rxm/",'{"x_fn":"select from PH where i<3"}').done(function(data){console.log("done==>" + data)});
    //rxds.postReq("https://kdb.balajict.com/rxm/",'{"plan":"38344AK0610002","x_fn":"select from PL where PLAN_ID_STANDARD_COMPONENT like X`plan"}').done(function(data){console.log("done==>" + data)});
    //rxds.postReq("https://kdb.balajict.com/rxm/",'{"PL:PLAN_ID_STANDARD_COMPONENT:plan":"38344AK0610002","query":"select from PL where PLAN_ID_STANDARD_COMPONENT like X`plan"}').done(function(data){console.log("done==>" + data)});
    //rxds.postReq("https://kdb.balajict.com/cms/",'{"x_fn":"series[X`query;1]","query":"select metric,category,series from (select metric:sum(Total_Amount_of_Payment_USDollars) by category:Recipient_State, series:Covered_Recipient_Type from GNRL)"}').done(function(data){console.log("done==>" + data)});




    function postReq(Req){//Req object may contain ajaxReq, url,body,done,fail,always
        //return $.post("https://kdb.balajict.com/rxm/jxo?",encodeURIComponent(body))
        //var body = '@[execdict;"' + JSON.stringify(json).replaceAll('"','\\"') + '";ermsgt]';

        if(typeof Req.url == "undefined" || Req.url == ""){
          Req.url = fnGetURL() + "/";
        }
        if (typeof Req.body === "object") {
          if(typeof Req.body.qsql != "undefined" &&  Req.body.qsql != ""){
            Req.body.qsql =  Req.body.qsql.replace(/(\r\n|\n|\r)/gm," ");
          }
          delete Req.body.datatable;// Delete the datatable
          Req.body = JSON.stringify(Req.body);
        }

//        console.log("Firing POST request to " + Req.url + " with the body");
//        console.log(Req.body);
        if(typeof JSON.parse(Req.body).query_id == "undefined" || JSON.parse(Req.body).query_id.substr(0,4) != "item")
            try{console.log(JSON.parse(Req.body));}catch(e){}

        // Add this Ajax to the tracker
        var ajaxReq = Req.ajaxReq;
        if(typeof Req.ajaxReq != "undefined"){
          ajaxReq.status = "Pending";
          ajaxReq.url = Req.url;
          ajaxReq.body = Req.body;
        }

        $.ajax({
            url: Req.url,
            type: 'POST',
            contentType: false,
            //data: Req.body, //serialize(Req.body),
            data:encodeURI(Req.body),
            processData: false,
            crossDomain: true,
            xhrFields: {withCredentials: true}
        })
        .done(function(data){
            //console.log("done==>" + data);
            if(typeof Req.done != "undefined"){
              try{
                Req.done(JSON.parse(data));
              }catch(e){
                Req.done({"error":"Request failed with error:" + e});
              }
            }
            if(typeof ajaxReq != "undefined"){
              ajaxReq.status = "Completed";
              ajaxReq.callback(ajaxReq);
            }
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            //alert( "error" );
            console.log(Req.body);
            console.log(jqXHR.responseText);
            if(typeof ajaxReq != "undefined"){
              ajaxReq.status = "Error";
              ajaxReq.callback(ajaxReq);
            }
        })
        .always(function() {
          //alert( "complete" );
        });

    }

    // Converts an Array to select2 json
    function fnJson2Select2(data){
        //if(data.indexOf("children") >=0)// Hierarchial JSON
          //  return eval( data.result);
        // Check if it is a simple array
        //json = JSON.parse(data);
        if (data.result == undefined) {
          json = data;
        } else {
        json=data.result;
        }
        if (json.length == 0){return json;}
        else if (typeof json[0].id != "undefined") {return json;}
        var obj = [];
        for(var i=0; i < json.length; i++){
            obj[i] = {'id': json[i],'text': json[i]}
        }
        return obj;

    }
    function show_hide_items(full_items, search_items) 
    {
       var i=full_items.split(/;/)
       $(i).each(function( index ) {
          var item=$("#"+this);
          if (search_items.indexOf(this)>= 0) {
              item.parents(".rxdsitem").show();
          }
          else {
              item.parents(".rxdsitem").hide();
          }
     });
    }
    function fnGetURL(ele){
      // Will deal with custom URL later
      if (window.location.origin.match(/customer/) || window.location.origin.match(/appsdev/)) {
          return "/" + window.location.pathname.split("/")[1] + "/" + window.location.pathname.split("/")[2] + "/db";
      }
      else {
          return window.location.pathname.substr(0, window.location.pathname.indexOf("/",1)) + "/db";
      }
    }
  //function for cleansing the data values for datatables

    function sanitizeData(jsonArray) {
        var newKey;
        jsonArray.forEach(function(item) {
            for (key in item) {
                newKey = key.replace(/\s/g, '').replace(/\./g, '');
                if (key != newKey) {
                    item[newKey]=item[key];
                    delete item[key];
                }
            }
        })
        return jsonArray;
    }
    //remove whitespace and dots from data : <propName> references
    function sanitizeColumns(jsonArray) {
        var dataProp;
        jsonArray.forEach(function(item) {
            dataProp = item['data'].replace(/\s/g, '').replace(/\./g, '');
            item['data'] = dataProp;
        })
        return jsonArray;
    }

    function fnDeleteQuery(Query_ID){
        rxds.postReq({
            body: {"cache":"N", qsql:"APP_QUERY_delete[`" + Query_ID + "]", region_item:"Delete_Query"},
            done: function(data){
              if(data.result.status == "success"){
                alert("Query Deleted.");
                window.location.reload();
              }else{
                alert("Deleting Saved Query Failed");
                console.log(data);
              }
            },// .done()
            fail: function(xhr,status,error){
                  alert("Deleting Saved Query failed with error:\n" + error);
                    console.log("Retriving local Cache ID fnDeleteQuery[`" + Query_ID + "] Failed:>>" + status + ">>" + error);
            }
        }); // End rxds.postReq
      
    }
    // Prints the qSql error in a Data Table
    function fnShowError(div,data){
      var reportdata = [{"Error":data.qerr, "qsql": "<a name='copyQSql' href='javascript:void(0)' onclick='rxds.copyToClipboard(this)'>Copy to Clipboard</a><p>" + data.submitted.qsql + "</p>"
                    ,"Params":function(){delete data.submitted.qsql; return JSON.stringify(data.submitted)}() 
                    }];
      rxds.loadDataTable(div,{},reportdata,(new Date()).getTime(),data);

    }//fnShowError

    function copyToClipboard(anything) {
      var copyText = "";
      if(typeof anything == "string"){
        copyText = anything
      }else if(anything.name == "copyQSql"){
        copyText = anything.nextElementSibling.innerHTML;
        copyText= copyText.replace(/^[\s\t]*(\r\n|\n|\r)/gm,""); // Remove empty lines
        copyText= copyText.replaceAll("&lt;","<").replaceAll("&gt;",">");
      }else{// Then it could be an object
        copyText = anything.innerHTML;
      }
      var textArea = document.createElement("textarea");
      // Place in top-left corner of screen regardless of scroll position.
      textArea.style.position = 'fixed';
      textArea.style.top = 0;
      textArea.style.left = 0;
      // Ensure it has a small width and height. Setting to 1px / 1em
      // doesn't work as this gives a negative w/h on some browsers.
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      // We don't need padding, reducing the size if it does flash render.
      textArea.style.padding = 0;
      // Clean up any borders.
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      // Avoid flash of white box if rendered for any reason.
      textArea.style.background = 'transparent';
      textArea.value = copyText;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Copying text command was ' + msg);
        //alert('Text copied to clipboard');
      } catch (err) {
        console.log('Oops, unable to copy');
      }
      document.body.removeChild(textArea);
    }

  // Public API
  return {
//        getQSql          : getQSql,
        env              : env,
        setItemVal       : setItemVal,
        getItemValJSON   : getItemValJSON,
        getItemVal       : getItemVal,
        updateURL        : updateURL,
        updateDDLinks    : updateDDLinks,
        getReqJSON       : getReqJSON,
        getAllJSON       : getAllJSON,
        addGrpPivMet     : addGrpPivMet,
        fngetJSON        : fngetJSON,
        fnGetURL         : fnGetURL,
        postReq          : postReq,
        fnJson2Select2   : fnJson2Select2,
        refresh          : refresh,
        app              : app,
        user             : user,
        gDebug           : gDebug,
        gPageItems       : gPageItems,
        gQueryString     : gQueryString,
        gQueryID_JSON    : gQueryID_JSON,
        sanitizeData     : sanitizeData,
        sanitizeColumns  : sanitizeColumns,
        ajaxCallback     : ajaxCallback,
        qsql_parm        : qsql_parm,
        fnDeleteQuery    : fnDeleteQuery,
        fnShowError      : fnShowError,
        show_hide_items  : show_hide_items,
        copyToClipboard  : copyToClipboard
    };
})(); // End of rxds object
