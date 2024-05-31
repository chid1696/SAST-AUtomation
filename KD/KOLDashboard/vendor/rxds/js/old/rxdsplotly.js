var rxdsplotly = (function() {
    // Public API
    function fnPlotly(elem, data, config,type) {

      var layout;
      console.log(JSON.stringify(data));

      if (type === "scatter") {

         layout = scatterLayout();

      }else if (type === "bar"){
          if (config != "") {
              layout = barLayout();
          }else{
              layout = config;
          }
          
      }else if (type === "bubble"){
          layout = bubbleLayout();
      }
        Plotly.newPlot(elem,data,layout,{staticPlot:false});
    }

    scatterLayout = function(){

       var layout = {
            title: 'Marker Size',
            showlegend: false,
            height: 400,
            width: 480
        };

      return layout;  
    }

    barLayout = function(){

       var layout = {
            title: 'Marker Size',
            showlegend: false,
            height: 400,
            width: 480
        };

      return layout;  
    }

   bubbleLayout = function(){
     var layout = {
        title: 'Bubble Chart Size Scaling',
        showlegend: false,
        height: 600,
        width: 600
      };
    }
   
     return {fnPlotly: fnPlotly};   

})();
