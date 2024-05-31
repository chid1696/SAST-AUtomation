function fngetJSON(p_selector){
    
    var strJSON = "";
    var chkName = "";

    // Balaji Implementation
    $(p_selector).each(function(index){ 
        //$( "input[name='planGroup']").filter("input:checked").map(function(){return this.value }).get().join(",");
       var key = $(this).attr("data-name") || $(this).attr("name") || $(this).attr("id");
       var type = $(this).attr("type") || this.nodeName;
       
       if(typeof key === "undefined" || type == "button" || type == "submit"){
           //console.log("index " + index + ":" + this.outerHTML)
       }else if( type == "text" || type == "hidden"){
           if( key.search("s2id") < 0  ){
             strJSON += ',"' + key + '":"' + $(this).val() + '"'
           }
       }else if( type == "date" ){ // added by krish
           strJSON += ',"' + key + '":"' + $(this).val().replace("-",".").slice(0,7) + '"'
           console.log(key + "====>" + $(this).val().replace("-",".").slice(0,7));
       }else if(type =="radio" ){
           if(this.checked)
             strJSON += ',"' + key + '":"' + $(this).val() + '"';
       }else if(type =="checkbox" ){
           if(key != chkName){
               chkName = key;
               if (key==="pivot" || key==="data") {  //added by krish
                   strJSON += ',"' + key + '":"' + $( "input[name='" + key + "']").filter("input:checked").map(function(){return this.value }).get().join("") + '"';
               }else{
                   strJSON += ',"' + key + '":"' + $( "input[name='" + key + "']").filter("input:checked").map(function(){return this.value }).get().join(",") + '"';
               }    
          }
           
       }else if(type == "SELECT"){
            
            strJSON += ',"' + key + '":"' + $(this).select2("val") + '"';
       //}else if(type == "BUTTON"){
            //Ignore
       }else{
           console.log("index " + index + ":" + type + ">>" + this.outerHTML );
       }
       
    });
    strJSON = strJSON.substring(1);//.split(",");
    //console.log("strJSON=====>" + strJSON);
    return strJSON;
}


// Populating the selectbox from KDB
// For fture Use

function fnLoadSel(p_Sel,p_url){
    $(p_Sel).select2({
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


// Onload Events




// AJAX POST implementation for Dropdowns
 
// Adding replaceAll to String object
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};


//fnPostReq("https://kdb.balajict.com/rxm/jxo?",{"fn":"getMkt"}).done(function(data){console.log("done==>" + data)});

function fnPostReq(url,json){
    //return $.post("https://kdb.balajict.com/rxm/jxo?",encodeURIComponent(json))
    var body = '@[execdict;"' + JSON.stringify(json).replaceAll('"','\\"') + '";ermsgt]';
    console.log("Firing POST request to " + url + " with the body");
    console.log(body);
    return $.post(url,encodeURIComponent(body))
    //.done(function(data){console.log("done==>" + data)});
}

// Converts an Array to select2 json
function fnJson2Select2(data){
    if(data.indexOf("children") >=0)// Hierarchial JSON
        return eval( eval(data) );
    var obj = [];
    json = JSON.parse(data);
    for(var i=0; i < json.length; i++){
        obj[i] = {'id': json[i],'text': json[i]}
    }
    return obj;
}

// Populating the KDB Dropdowns
$(".kdbSel, .kdbMulSel").each(function(index){
    var sel = $(this);
    fnPostReq("https://kdb.balajict.com/rxm/jxo?", sel.data("json"))
        .done(function(data){
            sel.select2( { data:fnJson2Select2(data), multiple: sel.hasClass("kdbMulSel") });
        })
});
