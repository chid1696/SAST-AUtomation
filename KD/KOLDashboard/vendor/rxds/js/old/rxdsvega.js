// Add a reference to rxds global
rxds.app.vega = [];
var rxdsvega = (function() {
    // Public API
    
    
    function fnChart(elem, data, pconfig) {
        var legend = [];
        var config;
        var actions = (pconfig.debug === "Y");
        console.log(pconfig);
        
        if (data.qerr !== undefined) {
          // There is an error running the query
          console.log("Error running chart code - Error: '" + data.qerr + "; See submitted values below");
          console.log(data.submitted);
          return;
        }
        var qout=R.clone(data.result);
        var vlSpec = JSON.parse(pconfig.vega_spec);
        if (vlSpec.data.length > 0) {
          vlSpec.data[0].values = qout;
        } else {
          vlSpec.data =  {"values":qout};
        }
        vlSpec.autoResize= true;
        vlSpec.width= pconfig.width;
        vlSpec.height= pconfig.height-40;
        var opt = {actions: actions};
        if ((pconfig.spectype == undefined) || (pconfig.spectype == "VegaLite")) {
          vlSpec["$schema"] = "https://vega.github.io/schema/vega-lite/v2.0.0-beta.15.json";
           opt.mode= "vega-lite";
        }else{
          vlSpec["$schema"] = "https://vega.github.io/schema/vega/v3.0.json";
             opt.mode= "vega";
        }
        if (pconfig.beforechart !== undefined){
          eval(pconfig.beforechart);
        }

        // Embed the visualization in the container with id `vis`
        vega.embed(elem, vlSpec,opt)
        .then(function(result) {
          // result.view is the Vega View, vlSpec is the original Vega-Lite specification
         vegaTooltip.vegaLite(result.view, vlSpec);
     // Add the Chart to the global
        rxds.app.vega[rxds.app.vega.length] = result;
        });
        // Adding the Click Handler
        if(pconfig.on_click != undefined){
          myChart.on("click",function(params){
            eval(pconfig.on_click);
          })
        }
      
      
    }
    return {
        fnChart: fnChart
    };
})();