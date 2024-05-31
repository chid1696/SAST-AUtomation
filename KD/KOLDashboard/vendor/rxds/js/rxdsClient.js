rxdsClient = (function(){

var genValJsonStr = function(pc) {
    //Updated the functions to work for datepicker, date-selectlist and month-selectlist items
	  $.fn.form.settings.rules.isDateLE = function(text,field){
     try {
       var val1,val2;
       if(text.split("-").length == 1) {  //If the value is coming from datepicker
          val1=$(this).parent().parent().calendar('get date');
          val2=rxds.m.get_param(field).toDate();
       }
       else {   //If the value is coming from select list like "YYYY-M-DD" or "YYYY-MM"
          val1=new Date(text);
          val2=new Date(rxds.m.get_param(field));
       }
       return val1<=val2;
     } catch (e) {return false;}
   	};
    $.fn.form.settings.rules.isDateLT = function(text,field){
     try {
       var val1,val2;
       if(text.split("-").length == 1) {
          val1=$(this).parent().parent().calendar('get date');
          val2=rxds.m.get_param(field).toDate();
       }
       else {
          val1=new Date(text);
          val2=new Date(rxds.m.get_param(field));
       }
       return val1<val2;
     } catch (e) {return false;}
   	};

    $.fn.form.settings.rules.isDateGE = function(text,field){
     try {
       var val1,val2;
       if(text.split("-").length == 1) {
          val1=$(this).parent().parent().calendar('get date');
          val2=rxds.m.get_param(field).toDate();         
       }
       else {
          val1=new Date(text);
          val2=new Date(rxds.m.get_param(field));
       }
       
       if(rxds.app.app.branch.match(/MASTER|QA|UI/)) {
         //Udhay - to support custom date
         if(val2 == "Invalid Date" && new Date(field) != "Invalid Date") {
            val2 = new Date(field);
         }
       }
       return val1>=val2;
     } catch (e) {return false;}
   	};
    $.fn.form.settings.rules.isDateGT = function(text,field){
     try {
       var val1,val2;
       if(text.split("-").length == 1) {
          val1=$(this).parent().parent().calendar('get date');
          val2=rxds.m.get_param(field).toDate();
       }
       else {
          val1=new Date(text);
          val2=new Date(rxds.m.get_param(field));
       }
       return val1>val2;
     } catch (e) {return false;}
   	};
   	
   	$.fn.form.settings.rules.isChecked = function(text,field){
     try {
       const val_selected = rxds.m.get_param(field);
       return val_selected ? true : false;
     } catch (e) {return false;}
    };
    
  var pc_keys = R.keys(pc),
      isReqd = i => {return ((pc[i].config.required === 'Y' || pc[i].config.validation != undefined) && pc[i].control_type != undefined && pc[i].control_type !== "hiddenitem")},
      ItemsToValidate = R.filter(isReqd,pc_keys),
      ItemsCond = R.cond([
        [R.equals('textbox'),R.always('empty')],
        [R.equals('textarea'),R.always('empty')],
        [R.equals('datepicker'),R.always('empty')],
        [R.equals('selectlist'),R.always('empty')],
//        [R.equals('hiddenitem'),R.always('')],
        [R.equals('checkbox'),R.always('checked')],
        [R.equals('radiobutton'),R.always('checked')],
        [R.equals('slider'),R.always('checked')],
        [R.equals('switch'),R.always('checked')]
      ]),
      json = {},    
      printVal = x => { 
        var rule={"identifier": pc[x].config.name, rules:[]};
        var isChbxOrRdBtn = (pc[x].control_type.match(/checkbox/) || pc[x].control_type.match(/radiobutton/)); //boolean value which says true if the item is checkbox or radio button
        if(pc[x].config.required === 'Y') {
          if (isChbxOrRdBtn) {
            //json[pc[x].config.name+"[]"] = ItemsCond(pc[x].control_type);     
            //rule.rules.push({"type"  : ItemsCond(pc[x].control_type),"prompt" : 'Please select a value'});
            rule.rules.push({"type"  : "isChecked["+ pc[x].parameter +"]","prompt" : 'Please select a value'});
            //To validate fields after the values are changed
            var chkBoxes = $(".ui.checkbox > input[name=" + pc[x].config.name + "]");
            chkBoxes.on("change",function(){ $('.rxds_form').form("validate field",pc[x].config.name); });
            
            var radioBts = $(".ui.radio > input[name=" + pc[x].config.name + "]");
            radioBts.on("change",function(){ $('.rxds_form').form("validate field",pc[x].config.name); });
          }else{
            //json[pc[x].config.name] = ItemsCond(pc[x].control_type);
            rule.rules.push({"type"  : ItemsCond(pc[x].control_type),"prompt" : 'Value is required'});
          }
        }
        if (pc[x].config.validation != undefined) {
            //rule.rules.push(JSON.parse(pc[x].config.validation));
            eval("var rule_obj=" + pc[x].config.validation);
            if(rule_obj.constructor === Array) {
              rule_obj.forEach(v => {
                if(isChbxOrRdBtn) {   //if the item is checkbox or radio button
            			var field_name = pc[x].config.name + "["+ v.lov + "]";
            			json[field_name] = { identifier: field_name, rules: (v.rules ? v.rules : [v]) };
            			
                  var chkBoxes = $(".ui.checkbox > input[name=" + pc[x].config.name + "]");
                  chkBoxes.on("change",function(){ $('.rxds_form').form("validate field",field_name); });
                  
                  var radioBts = $(".ui.radio > input[name=" + pc[x].config.name + "]");
                  radioBts.on("change",function(){ $('.rxds_form').form("validate field",field_name); });
            		}
            		else
                  rule.rules.push(v);
              });
            }
            else
              rule.rules.push(rule_obj);
        }
        json[pc[x].config.name]= rule;
        return json;
      },
      str = R.forEach(printVal,ItemsToValidate);
      console.log("validation object",json);
      return json;
}
  
  //return functions
  
  return {
    genValJsonStr : genValJsonStr
};

})();
