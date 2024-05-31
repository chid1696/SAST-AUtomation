rxdsClient = (function(){
  function nvl(a,b){return a=='N'?'N':b}
  
  //parameters -- {"slManufacturer":"MANUFACTURER" }
  async function fetchAsync (queryID, param,dataType) {
     var data;
     var  reqJSON = 
       {"x_page_name":rxds.app.page.page.page_name,"x_app_name":rxds.app.app.name,
        "cache":nvl(nvl(rxds.app.app.cache,rxds.app.page.page.cache),'Y'),
        "limitRows":1000,"x_fn":"ussr","query_id":queryID
       },
      rxdsPostInit = { method: 'POST',mode: 'cors',credentials: 'same-origin',body: ""};
      
      if (!R.isEmpty(param)) {
              console.log(param);
//              reqJSON["MANUFACTURER"] = "AstraZeneca Pharmaceuticals LP";
//              reqJSON["MARKET"] = "ONCOLOGY";
              var addParam = (value, key) => reqJSON[key] = value;
              R.forEachObjIndexed(addParam, param);
      }

      rxdsPostInit.body = encodeURI(JSON.stringify(reqJSON));
      //console.log('Request ready to sent');
      console.log(reqJSON);
      
      // await response of fetch call
      let response = await fetch("../db/", rxdsPostInit);
      // only proceed once promise is resolved
      if ( (typeof dataType == "undefined") || (dataType === "json")) {
           data = await response.json();
           data = data.result;
      } 
      else {
          data = await response;
      }
      // only proceed once second promise is resolved
      return data;
  }

  function httpPostReq(reqURL,reqBody,on_success,on_fail){
      $.ajax({
           url: reqURL,
           type: 'post',
           contentType: false,  
           data:encodeURI(reqBody),
           processData: false,
           crossDomain: true,
           xhrFields: {withCredentials: true}
       })
       .done(function( data ) {
         on_success(data);
       })
       .fail(function( xhr, status, errorThrown ) {
         console.log( "Error: " + errorThrown );
         console.log( "Status: " + status );
         console.dir( xhr );
         on_fail(xhr, status, errorThrown);
       })
       // Code to run regardless of success or failure;
       .always(function( xhr, status ) {
         console.log( "The request " + reqURL + " is complete!" );
       });
  
  }// httpPostReq
   
   //post messages to server
  function sendReq(queryID){
     var  reqJSON = {"x_page_name":rxds.app.page,
                      "x_app_name":rxds.app.name,
                      "cache":"N",
                      "limitRows":1000,
                      "x_fn":"ussr",
                      "query_id":queryID
      },
    
          rxdsPostInit = { method: 'POST',
                           mode: 'cors',
                           credentials: 'same-origin',
                           body: ""
      };
  
      rxdsPostInit.body = encodeURI(JSON.stringify(reqJSON));
      console.log('Request ready to sent');
      console.log(reqJSON);
      
  
      if (self.fetch) {
        // run my fetch request here
        fetch("../db/", rxdsPostInit)
        .then(function(response) {
            if(response.ok) {
              return response.json();
            }
              throw new Error('Network response was not ok.');
            }).then(function(data) { 
                  console.log(data.result);
                  return data.result;
            }).catch(function(error) {
                  console.log('There has been a problem with your fetch operation: ', error.message);
        });
              
      } else {
          // if fetch is not supported run with XMLHttpRequest
          httpPostReq("../db/",JSON.stringify(reqJSON)
          ,function(data){
              console.log(data);
          }
          ,function(xhr, status, errorThrown){
              var whoami = "https://apps20.rxdatascience.com/whoami";
              $("#divRes").append("Please login to <a href='" +  whoami + "' target='_login'>" + whoami + "</a> and try again.");
          })
      }

      return false;
  }
  
var genValJsonStr = function(pc) {
  var pc_keys = R.keys(pc),
      isReqd = i => {return pc[i].config.required === 'Y' && pc[i].control_type != undefined},
      ItemsToValidate = R.filter(isReqd,pc_keys),
      ItemsCond = R.cond([
      [R.equals('textbox'),R.always('empty')],
      [R.equals('textarea'),R.always('empty')],
      [R.equals('datepicker'),R.always('empty')],
      [R.equals('checkbox'),R.always('checked')],
      [R.equals('radiobutton'),R.always('checked')],
      [R.equals('slider'),R.always('checked')],
      [R.equals('switch'),R.always('checked')],
      [R.equals('selectlist'),R.always('empty')],
      [R.equals('hiddenitem'),R.always('empty')]
      ]),
      json = {},    
      printVal = x => { 
         json[pc[x].config.name] = ItemsCond(pc[x].control_type);
         return json;
      },
      str = R.forEach(printVal,ItemsToValidate);
      console.log("validation",json);
      return json;
}
  
  //return functions
  
  return {
    sendReq      : sendReq
    ,fetchAsync  : fetchAsync
    ,genValJsonStr : genValJsonStr
};

})();


