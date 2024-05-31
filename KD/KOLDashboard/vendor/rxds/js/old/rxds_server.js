if (rxds.env == "Server") {

//  require('ramda');
  // This call is made to get the cached tables on the server side. This is not the call for the final request itself
  // In the final request we can send response to the clients as we receive the chunks
  rxds.postReq = function(Req) {
    var str = '';
    var db = JSON.parse(Req.body.db);
    var post_data = encodeURI(JSON.stringify(Req.body)); //encodeURI(JSON.stringify(qJSON)); //Req.body;
    var post_options = {
      host: db.host, port: db.port[0], path: '/', method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded','Content-Length': Buffer.byteLength(post_data)}
    };

    // Set up the request
    var post_req = http.request(post_options, function(res_back) {
        res_back.setEncoding('utf8');
        res_back.on('data', function (chunk) {str += chunk;});
        res_back.on('end', function () {var x= {};
//              console.log('gotback:'); console.log(str);
              try {x= JSON.parse(str);} catch (e) {console.log("Got back:"+str);console.log(e);}
              Req.done(x);}); // Callback with the data we received
    });
    // post the data
    post_req.write(post_data);
    post_req.end();
  }  // Server side PostReq
}
rxds.extend = function(out) {
  out = out || {};

  for (var i = 1; i < arguments.length; i++) {
    if (!arguments[i])
      continue;

    for (var key in arguments[i]) {
      if (arguments[i].hasOwnProperty(key))
        out[key] = arguments[i][key];
    }
  }

  return out;
};

rxds.deepExtend = function(out) {
  out = out || {};

  for (var i = 1; i < arguments.length; i++) {
    var obj = arguments[i];

    if (!obj)
      continue;

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object')
          out[key] = rxds.deepExtend(out[key], obj[key]);
        else
          out[key] = obj[key];
      }
    }
  }

  return out;
};

// Formats mm/dd/yyyy format to yyyy.mm.dd
rxds.qdate = function(mmddyyyy) {
      if(mmddyyyy.indexOf(".")  == 4){ // In yyyy.mm.dd format
        return mmddyyyy;
      }
      var s=mmddyyyy.split('/');
      return s[2] +"." +s[0]+"."+s[1];
    }

rxds.pivot_include = function(qin) {
      if (typeof qin.x_piv != "undefined" && qin.x_piv != ""){
        var pre = ""; var grp = ""; var post=";:t";
        if (qin.x_grp !== undefined) {
            grp=qin.x_grp.split(/;/).map(function(e){return '`'+e.replace(/"/g,'')}).join("");
        } else {pre=";t:update a:1 from t"; grp="`a";post=";delete a from t"}
        var met=qin.x_met.split(/;/).map(function(e){return '`'+e.replace(/"/g,'')}).join("");
        var piv=qin.x_piv.split(/;/).map(function(e){return '`'+e.replace(/"/g,'')}).join("");
        return pre+";t:npiv[t;"+grp+";"+piv+";"+met+";fp;gp]"+post;
      } else {return ";:t";}
} // pivot_include

rxds.lookup_table = function (ltable,lkey,lcolumns) {
      rxds.lookup[ltable]={"key":lkey,"columns":lcolumns};
      rxds.lookup_key[lkey]={"c":lcolumns.split(/;/).map(function(v){return '"'+v+'"';}),"t":ltable};
      return "";
} //lookup_table



rxds.set_filter = function (fil_name,col_name,data_type,filter_val) {
        if ((data_type == undefined) || (data_type == "symbol") || (data_type == "" )) {
            if(filter_val == undefined){
                //rxds.filter[fil_name] = col_name + " in `$({{"+fil_name+"}})";
                rxds.filter[fil_name] = ' any ' + col_name + ' like/:1_("";{{' +fil_name+ '}})'; // any product like/:("DMARD";"BIOLOGICS")
            }else{
                rxds.filter[fil_name] = col_name + " in `$("+filter_val+")";
            }
        }
        else if (data_type == "number") {
            if(filter_val == undefined){
                rxds.filter[fil_name] = col_name + " in ({{"+fil_name+"}})";
            }else{
                rxds.filter[fil_name] = col_name + " in ("+filter_val+")";
            }
        }
        else if ((data_type == "custom") &&(filter_val !== undefined)) {
            rxds.filter[fil_name] = filter_val;
        }
} //set_filter

rxds.multi_filter =  function(qin, filters, need_where) {
    var sep=",";
     if (need_where != undefined) {
       sep=" where ";
     }
     var arr = R.filter(
             function(v,i){
               return (qin[v] != "" && qin[v]!=undefined)},filters)
               .map(function(elem) {return rxds.filter[elem]});
     return (arr.length > 0)? sep+arr.join(','):'';
} // set_filter

rxds.set_dictionary =  function(qin, items, types) {
//    console.log("Set Dict123" + items + ' ' + types);
    items_arr = R.split(';', items);
    var arr = items_arr.filter(
             function(v,i){
               return (qin[v] !== "" && qin[v]!==undefined)});
    var type_arr = R.split(';', types).filter(
             function(v,i){ 
               return (qin[items_arr[i]] !== "" && qin[items_arr[i]]!==undefined)});
    var dict1,dict2;
//    console.log(JSON.stringify(type_arr));
    if (arr.length == 1) {
       dict1 = arr.map(function(elem){ return "(enlist`"+elem+")"} ).join('');
       dict2 = arr.map(function(e,i){
           if (type_arr[i] === "list") {
              return 'enlist ('+(qin[e].match(/;/)?qin[e]:"enlist "+qin[e])+")";
           }
           else if (type_arr[i] === "addquote") {
              return  'enlist "'+qin[e] +'"';
           }
           else {return 'enlist '+qin[e];}
           }).join(';');
//       dict2 = arr.map(function(elem){ return 'enlist "'+qin[elem].replace(/\"/g,"")+'"'}).join(';');
    }else if (arr.length > 1) {
       dict1 = arr.map(function(elem){ return "`"+elem} ).join('');
       dict2 = arr.map(function(e,i){ 
           if (type_arr[i] === "list") {
              return '('+(qin[e].match(/;/)?qin[e]:"enlist "+qin[e])+")";
           }
           else if (type_arr[i] === "addquote") {
              return '"'+qin[e]+'"';
           }
           else {
              return qin[e];
           }
           }).join(';');
//       dict2 = arr.map(function(elem){ return '"'+qin[elem].replace(/\"/g,"")+'"'}).join(';');
    }else{
       dict1='(enlist`a)';
       dict2='enlist "not set"';
    }
//    console.log(dict1);
//    console.log(dict2);
    console.log(".rxds.qin_dict:"+ dict1+"!("+dict2+");");
     return ".rxds.qin_dict:"+ dict1+"!("+dict2+");";
} // set_filter

rxds.sanitize_edit = function(qcode) {
    return qcode.replace(/\\/g,'\\\\').replace(/\"/g,'\\"');
}

rxds.filter_include =   function(qin,fil_name,col_name,tab_name,data_type,code) {
       var sep="";
       if (tab_name !=undefined && tab_name != ""){
         if (qin[tab_name+"_filter"]!=undefined) {
           sep=",";
         } else if(qin[fil_name] != "" && qin[fil_name]!=undefined) {
           qin[tab_name+"_filter"]="yes";sep=" where ";
         }
       } else {sep=","}
       if (qin[fil_name] != "" && qin[fil_name]!=undefined) {
          // Special handling for {{bind}} just for the IMS app
          //if(window.location.pathname.indexOf("/IMSDataPrep") == 0){
          if (data_type == undefined || data_type == "symbol" || data_type == "" ) {
            return sep+ col_name + " in `$({{"+fil_name+"}})";
            //return sep + ' any ' + col_name + ' like/: 1_("";{{' +fil_name+ '}})'; // This creates problem with single char symbol
          }else if (data_type == "number" || data_type == "short" || data_type == "real") {
            return sep+ col_name + " in  ({{"+fil_name+"}})";
          }else if (data_type == "string"){
            return sep + ' any ' + col_name + ' like/: 1_("";{{' +fil_name+ '}})';
          }else if (data_type == "custom"){
            return sep + code;
          }  
        }else{return "";}

} // filter_include

rxds.join_include = function (){return "t:select "}

rxds.boilerPlate = function (pstype) {
      var lsPlate;
      if (pstype === "series_charts") {
        lsPlate =
        "series_list:exec distinct series from chart_data; \
axis:asc exec distinct x_axis_value from chart_data; \
\
chart_step1:{[table;axis;series] \
   data:{[table;series;x_axis_value] \
      0^table[(series;x_axis_value)][`metric] \
   }[table;series;] each axis; \
  `name`data`min`max!(series;data;min data;max data) \
}[chart_data;axis;] each series_list; \
chart_step2:`series`categories`legend!(chart_step1;axis;series_list); \
\
(`chartdata`reportdata)!(chart_step2;report_data) ";
      }
      else {lsPlate = 'No boiler plate yet for ' + pstype;}
      return lsPlate;

} // boilerPlate

// Search_Fields to see if user is looking for a set of fields
rxds.search_fields = function (fields, qin) {
      var x=qin.x_met+";"+qin.x_grp+";"+qin.x_piv;
      return R.filter(function(v){return v!==""&&fields.match(eval(v));},x.split(/;/)).length > 0;
}

// Search filters to see if user is filtering one of the selected fields
rxds.search_filters = function (fields, qin) {
      return R.filter(function(v){return qin[v] !==undefined && qin[v]!=="";},fields.split(/;/)).length > 0;
}

// Search_Include Utility
rxds.search_include = function (query, qin, prefix, unwind_flag) {
      prefix = typeof prefix !== 'undefined' ? prefix : "";
      var selection=qin.x_met+";"+qin.x_grp+";"+qin.x_piv;
      var s=R.uniq(
             R.filter(
             function(v,i){
               v=v.indexOf(":")>0?v.split(/:/)[0]:v;
               if ((rxds.lookup_key[v] !== undefined)&&(unwind_flag !== "N")) {
                if (R.filter(function(n){return R.filter(function(p){return n===p;},selection.split(/;/)).length>0}, rxds.lookup_key[v].c).length>0) {
//                if ($(rxds.lookup_key[v].c).filter(selection.split(/;/)).length>0) {
                   qin[rxds.lookup_key[v].t+"_join"]="yes";
                   return true;
                } else {return selection.indexOf('"'+v.indexOf(":")>0?v.split(/:/)[0]:v+'"')>0;}
               } else {
               return selection.indexOf('"'+v.indexOf(":")>0?v.split(/:/)[0]:v+'"')>0;

               }
             }
             ,query.split(/[;]/))
             ).join(",");
        return (s!=="")?prefix+s:s;
} // search_include

// mapreduce util function
rxds.mapreduce =   function (arr,separator,enclose){
      if(typeof arr != "object") return arr;
      if(arr == null || arr.length == 0) return "";
      if(typeof separator == "undefined") separator = ",";
      if(typeof enclose == "undefined") enclose = "";
      var arr2 = arr.map(function(elem) {return enclose + elem + enclose}); // Creates new array with values enclosed inside double quote
      return arr2.reduce(function(prevVal, elem) {return prevVal + separator + elem}); // Converges array to string as ";" separated
    } // mapreduce


rxds.get_cache_post =   function (qJSON, app_cache, idx, cbk) {
        console.log('Posting for Cache' + qJSON.qsql);
        rxds.postReq({
              body: qJSON,
              done: function(data){
                    //Grab Cache ID and set on the global
                    if (data.disk == undefined) {
                      console.log('Cache Error');
                      console.log(data);
                    }
                    app_cache[idx].cache = data.disk;
                    app_cache[idx].qsql = app_cache[idx].qtable_name + ': get ` sv CACHE,`' + data.disk + ';';

                    //Call back to trigger the next one
                    if (app_cache.length === idx + 1) {
                            //Last one - Trigger final callback
                        var cache_sql=R.map(function(n){return n.qsql}, app_cache).join("");
                        var orig_sql = qJSON.orig_sql;
                        if (/^\s*\{/.test(orig_sql)) {
                            orig_sql=orig_sql.replace(/^\s*\{/,'');
                            orig_sql = '{'+cache_sql+orig_sql;
                        }
                        else {
                          orig_sql = '{'+cache_sql+orig_sql+'}[]';
                        }
                        qJSON.qsql = orig_sql;
                        qJSON.limitRows = qJSON.origLimit;
                        cbk(qJSON, app_cache);
                    }
                    else {
                        rxds.get_cache(app_cache, idx+1, qJSON, cbk);
                    }
                  }
             });// End rxds.postReq call
    } // get_cache_post
rxds.get_cache_recurse =    function (body, idx, cbk, app_cache) {
        rxds.parseQSql(body, function(qJSON, app_cache1){
           qJSON.limitRows = 0;
           if (app_cache.length === idx + 1) {
             qJSON.orig_sql = body.orig_sql;
           }
           //Construct properly - Rowcount 0
           rxds.get_cache_post(qJSON, app_cache, idx, cbk);
        }, app_cache); //parseQSql -- Passing app_cache as original cache
    } // get_cache_recurse

rxds.get_cache =    function (app_cache, idx, qJSON, cbk) {

        var body = rxds.extend({},qJSON);

        if (qJSON.orig_sql == undefined) {
          body.origLimit = qJSON.limitRows;
        }

       if (0 === idx) {
          body.orig_sql = qJSON.qsql;
       }
       body.orig_sql = body.orig_sql.replaceAll("{{"+app_cache[idx].qtable_name+"}}",
                           app_cache[idx].qtable_name);
        body.qsql = app_cache[idx].config.query;
        //Need to stop infinite loops
        rxds.get_cache_recurse(body, idx, cbk, app_cache);
    } // get_cache


    // Parsing the QSql with substitution variables
    //Run through template  ==> https://github.com/blueimp/JavaScript-Templates
    ///            ([\s'\\])(?!(?:[^{]|\{(?!%))*%\})|(?:\{%(=|#)([\s\S]+?)%\})|(\{%)|(%\})/g
    //tmpl.regexp = /([\s'\\])(?!(?:[^<]|\<(?!%))*%\>)|(?:\<%(=|#)([\s\S]+?)%\>)|(\<%)|(%\>)/g;
    //tmpl.arg = "qin";
rxds.parseQSql  =  function (qJSON, cbk, original_cache){
      var qsql = qJSON.qsql;
      //front-matter support
      var f=qsql.split(/---/m);
      if (f.length===3) {
         var front = {};
         try {eval("front="+f[1]);} catch (e) {console.log('Error parsing front-matter as JSON:' + f[1]);console.log(e);}
        qsql=f[2];
        R.forEachObjIndexed(function(i,v){qsql=qsql.replaceAll(v,i);},front);
      } // If there is front-matter

      //Replace double back-tick withe single quote
      qsql = qsql.replace(/\`\`/g,"'");
      //Replace Query comments
      qsql = qsql.replace(/\/\/.*(\r\n|\n|\r)/g,'');
      if(qsql.indexOf("<%") >= 0 ){// If not bye pass template parsing
          rxds.lookup={}; rxds.lookup_key={}; rxds.filter={};//Reset before tmpl() call
          var x;
          try {x = tmpl("<h1>"+qsql+"</h1>", qJSON);} 
              catch (e) {x="     Javascript parse error "+ e.message + "     ";}
          rxds.lookup={}; rxds.lookup_key={}; rxds.filter={};//Reset after tmpl() call
          qsql = x.substr(4,x.length-9);
      }
      var app_cache = [];
      if (rxds.app.app_cache !== undefined) {
        app_cache=R.filter(function(obj) {return qsql.indexOf('{{'+obj.qtable_name+'}}') !== -1;}, rxds.app.app_cache);
       }
      //Replace Newlines
      qsql=qsql.replace(/(\r\n|\n|\r)/gm," ");
      qJSON.qsql = qsql;
      if (app_cache.length > 0 ){
        // Do some replacement of qsql
        rxds.get_cache(app_cache, 0, qJSON, cbk);
      } else {
        //Callback with qSQL
        if (original_cache == undefined) {
            cbk(qJSON, app_cache);
        }
        else {
            cbk(qJSON, original_cache);
        }
      }
} //parseQSql



