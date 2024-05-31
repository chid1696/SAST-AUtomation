// Add a reference2 to rxds global
rxds.app.dimcharts = [];
rxds.app.dimchart_obj = {};
rxds.app.dcData = [];
rxds.app.dimload = 0;
rxds.app.log_scales = {};
var rxdsdimchart = (function() {

var colors=["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];


var filters={"x_fil_state":""};
var rxds_widgets=[];
//var dc;
var numberFormat = d3.format(".2f");
rxds.app.rxds_widgets = rxds_widgets;

function rebuildFilters() {
   filters = _.object(_.map(rxds.app.dimcharts, function(chart) {
                    return [chart.anchorName(), chart.filters()]
                    }));
  rxds_widgets.forEach(function (i) {          
    if ((i.filter !== undefined) && (i.filter !== "")) {
      filters[i.name] = i.filter;
    }
  });
  
  rxdsdimchart.beforeFilters(filters);                  
}

function beforeFilters(filters) {}

function rescaleLog() {
  $.each( rxds.app.log_scales, function( key, obj ) {
  n=obj.chart.anchorName();
  d=rxds.app.dcData[n];
  var max = R.reduce(function(x,y){return (x.value<y.value)?y:x}, {"value":0}, d).value; 
  if (obj.type === "rowChart") {
      obj.chart.x(obj.axis_type.clamp(true).domain([1,max]));
  }
  else if (obj.type === "barChart")  {
       obj.chart.y(obj.axis_type.clamp(true).domain([1,max]));

  }
});
}
function promisePost() {
  var div = $( ".dimChartReg" );
  return new Promise(function(resolve, reject) {
    if (rxds.app.dimload===2) {resolve(this.responseText);return;}  
    if (rxds.app.dimload===1){rxds.app.dimload=2;}
    var config = $(div).data("config");
//    rxds.fngetJSON("","","ussr", 'select from state', function(qJSON){
      qJSON = rxds.getReqJSON(div);
      rebuildFilters();
      eval(config.beforequery); // Run any requested changes to qJSON
      for (t in filters) {
        qJSON[t] = filters[t];
      }
     qJSON.query_id = $(div).data("query_id");
//      rxds.parseQSql("",qJSON, function(qJSON){
        rxds.postReq({
//            url : rxds.fnGetURL(div)+'/',
            body: qJSON,
            done: function(data){
                    // Check for error
                    if(data.qerr !== undefined){
                      rxds.fnShowError($(".dimChartReg")[0],data);
                      return;
                    }
                    eval(config.beforepaintchart); // Run any requested changes to data returned by KDB
                    rxds.app.dcData = data.result;
                    rescaleLog();
                    resolve(this.responseText);
                  },// End done cb
            fail: function(err){
                    div.innerText = "Error" + err.responseText;
                    reject;
                  }
        });// End rxds.postReq
        
//      }); //parseQSql 
      
//    }); //fngetJSON 
  }); // Promise definition
} //promisePost

    function resetChart(p_anchor) {
      if (rxds.app.dimchart_obj[p_anchor] === undefined) {
        
      }
      else {
         rxds.app.dimchart_obj[p_anchor].filterAll().redrawGroup();
      }
    }
    function setUpChart() {
          rxds.app.dimcharts = dc.chartRegistry.list();
             rxds.app.dimchart_obj = _.object(_.map(rxds.app.dimcharts, function(chart) {
                    return [chart.anchorName(), chart]
                    }));
    }
    function rxds_widget_handler(widget_config){
       if (widget_config.filter === undefined) {widget_config.filter=[]};
       if (widget_config.widget_type == "datatable") {
         console.log("here we will draw a datatable");
         console.log(rxds.app.dcData[widget_config.anchor.substring(1)]);
         console.log("functionality not developed");
       }
       else if (widget_config.widget_type == "sankey") {
         var sankeyData=rxds.app.dcData[widget_config.anchor.substring(1)];
         try {paintSankey(widget_config, sankeyData);} catch(e){console.log(e);}
       }
    }
     function commitHandler(redraw, drawCallback) {
            var promise = promisePost();
            
            promise.then(function(data) {
              /* data has returned from back-end - handle rxds widgets */
             console.log(rxds_widgets.length);  
            _.map(rxds_widgets,rxds_widget_handler);
            
          var groups = _.object(_.map(rxds.app.dimcharts, function(chart) {
              return [chart.anchorName(), chart.group()];
          }));
          
          //the magic: trick dc.js into thinking it's dealing with a crossfilter group but actually
          //the backend has full control over each chart's group data so it can now render aggregates directly.
          _.forEach(groups, function(group, chartAnchor) {
            if (chartAnchor == "datatable") {
             group = function (d) {return d.value;}
            } else {
              //group = function (obj) {return obj.key};
              group.all = function() { return rxds.app.dcData[chartAnchor]; };
              group.top = function() { return rxds.app.dcData[chartAnchor]; };
            }
          });

                drawCallback && drawCallback();  
            });
            return promise;
        }

    function rxdsDataTable(p_anchor, p_width, p_height, p_grp_name, p_columns, p_sortby, p_order) {
      rxds_widgets.push({widget_type:"datatable",anchor:p_anchor,width:p_width,name:p_anchor.substring(1)});
    }
    function rxdsSankey(p_anchor, p_width, p_height) {
      rxds_widgets.push({widget_type:"sankey",anchor:p_anchor,width:p_width,height:p_height,name:p_anchor.substring(1)});
    }

    function paintSankey(widget_config, data) {
      data.links.forEach(function (d, i) {
       data.links[i].source = R.find(R.propEq("name",data.links[i].source),data.nodes);
       data.links[i].target = R.find(R.propEq("name",data.links[i].target),data.nodes);
     });
     
     var units = "Count";

    var margin = {top: 10, right: 10, bottom: 10, left: 10},
        width = widget_config.width - margin.left - margin.right,
        height = widget_config.height - margin.top - margin.bottom;
    
    var formatNumber = d3.format(",.0f"),    // zero decimal places
        format = function(d) { return formatNumber(d) + " " + units; },
        color = d3.scale.category20();
    
    // append the svg canvas to the page
    d3.select(widget_config.anchor).selectAll("svg").remove();
    var svg = d3.select(widget_config.anchor).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", 
              "translate(" + margin.left + "," + margin.top + ")");
    
    // Set the sankey diagram properties
    var sankey = d3.sankey()
        .nodeWidth(36)
        //.nodePadding(40)
        .size([widget_config.width, widget_config.height]);

    function straightLine(d) {
      var pts = [
        [d.source.x + d.source.dx, d.source.y + d.sy],
        [d.target.x, d.target.y + d.ty],
        [d.target.x, d.target.y + d.ty + d.dy],
        [d.source.x + d.source.dx, d.source.y + d.sy + d.dy]
      ];
      var pa = pts.map(function (d) { return d.join(",") });
      return "M" + pa.join("L");
    }

    sankey.link = straightLine;
    var path = sankey.link;
    
    var graph = data;
    sankey
      .nodes(graph.nodes)
      .links(graph.links)
      .layout(32);

    // add in the links
    var link = svg.append("g").selectAll(".link")
      .data(graph.links)
    .enter().append("path")
      .attr("class", "link")
      .attr("d", path)
      //.style("stroke-width", function(d) { return Math.max(1, d.dy); })
      .style("fill", "#ccc")
      .style("stroke", "none")
      .style("opacity", 0.4)
      .sort(function(a, b) { return b.dy - a.dy; })
      .on("click", function(d){
        widget_config.filter.push(d.source.name + ";" + d.target.name);
      });

// add the link titles
  link.append("title")
        .text(function(d) {
    		return d.source.name + " → " + 
                d.target.name + "\n" + format(d.value); });

function nozoom() {
  d3.event.preventDefault();
}
// add in the nodes
  var node = svg
      .on("touchstart", nozoom)
      .on("touchmove", nozoom)
      .append("g").selectAll(".node")
      .data(graph.nodes)
    .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { 
		  return "translate(" + d.x + "," + d.y + ")"; })
		  .on("click", function(d,i){
		    if (d3.event.defaultPrevented) return; // dragged
		    var index = widget_config.filter.indexOf(d.name);
		    if (index === -1) {
            widget_config.filter.push(d.name);
		    } else
		    {
		      widget_config.filter.splice(index, 1);
		    }
        var filters=R.reduce(function(x,y){ return (x+y+"; ");},"",widget_config.filter).slice(0, -1);
        $(widget_config.anchor).find(".filter").html(filters);
        $(widget_config.anchor).find(".reset").css("visibility", "visible");
               rxdsdimchart.commitHandler().then(function() {
                dc.renderAll(); 
          });
      })
/*    .call(d3.behavior.drag()
      .origin(function(d) { return d; })
      .on("dragstart", function() { 
		  this.parentNode.appendChild(this); })
      .on("drag", dragmove)) */
;


//class="selected"
// add the rectangles for the nodes
  node.append("rect")
      .attr("height", function(d) { return d.dy; })
      .attr("width", sankey.nodeWidth())
      .style("fill", function(d) { 
      if ( (widget_config.filter.indexOf(d.name) === -1) && (widget_config.filter.length > 0) ) {
        d.color = color(d.name.replace(/ .*/, ""));
        return d.color = "#ccc";
      } else {
		  return d.color = color(d.name.replace(/ .*/, ""));} })
      .style("stroke", function(d) { 
		  return d3.rgb(d.color).darker(2); })
		 .attr("class", function(d) { if ( (widget_config.filter.indexOf(d.name) === -1) && (widget_config.filter.length > 0) ) {return "selected" + d.name };})
    .append("title")
      .text(function(d) { 
		  return d.name + "\n" + format(d.value); });

// add in the title for the nodes
  node.append("text")
      .attr("x", -6)
      .attr("y", function(d) { return d.dy / 2; })
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", null)
      .text(function(d) { return d.name; })
    .filter(function(d) { return d.x < width / 2; })
      .attr("x", 6 + sankey.nodeWidth())
      .attr("text-anchor", "start");

// the function for moving the nodes
  function dragmove(d) {
    d3.select(this).attr("transform", 
        "translate(" + d.x + "," + (
                d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
            ) + ")");
    sankey.relayout();
    link.attr("d", path);
  }         
     
 
 
      
    }
      function paintMap(geoJSON,chart,p_width, p_height) {
          var projection = d3.geo.mercator();
             var path = d3.geo.path().projection(projection);
             
             //set up scale and translate
             var bounds, scale, offset;
             projection.scale(1).translate([0,0]);
             var bounds = path.bounds(geoJSON);
             var scale = .90 / Math.max((bounds[1][0] - bounds[0][0]) / p_width, 
                                        (bounds[1][1] - bounds[0][1]) / p_height);
             var offset = [(p_width - scale * (bounds[1][0] + bounds[0][0])) /2, 
                           (p_height - scale * (bounds[1][1] + bounds[0][1])) /2 ]; 
             projection.scale(scale).translate(offset);

            chart.width(p_width).height(p_height)
                   .dimension({}).group({}).commitHandler(commitHandler)
                    .colors(d3.scale.quantize().range(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"]))
                    .colorDomain([0, 40000])
  //                  .projection(projection)
  //                        .scale(scale)
  //                        .translate([p_width / 2, p_height / 2]))
  //                  .colorCalculator(function (d) { return d ? chart.colors()(d) : '#ccc'; })
                    .turnOnControls(true).controlsUseVisibility(true)
                   .overlayGeoJson(geoJSON.features, "state", function (d) {
                        if (d.properties.name === undefined) {return d.properties.geography;}
                        else {return d.properties.name;}
                        
                    })
                    .on("preRender", function(chart) {
                       chart.colorDomain(d3.extent(chart.data(), chart.valueAccessor()));
                     })
                    .on("preRedraw", function(chart) {
                        chart.colorDomain(d3.extent(chart.data(), chart.valueAccessor()));
                     })
                    .title(function (d) {
                        return "State: " + d.key + "  " + d3.format(".0f")(d.value ? d.value : 0);
                    });
         } //paintMap
      
      function geoChoroplethChart(p_anchor, p_width, p_height,p_json) {
         var chart  = dc.geoChoroplethChart(p_anchor);
         d3.json(p_json, function (statesJson) {
           paintMap(statesJson,chart,p_width, p_height)
           });
        } //geoChoroplethChart

      function geoChoroplethqJSON(p_anchor, p_width, p_height,q_json) {
         var chart  = dc.geoChoroplethChart(p_anchor);
           paintMap(rxds.app.dcData[q_json],chart,p_width, p_height)
        } //geoChoroplethChart
     
    function pieChart(p_anchor, p_width, p_height, p_radius) {
      var chart = dc.pieChart(p_anchor);
      chart.width(p_width).height(p_height).slicesCap(10).innerRadius(p_radius)
           .dimension({}).group({}).commitHandler(commitHandler)
           .label(function(d) {  return d.key; })
         .ordinalColors(colors)
 //                   .colors(d3.scale.quantize().range(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"]))
           .turnOnControls(true)
           .controlsUseVisibility(true);
    }
    
    function rowChart(p_anchor, p_width, p_height, p_yscale, p_domain, p_range) {
      var chart = dc.rowChart(p_anchor);
      var axis_type; var elasticX;
      if (p_yscale == "log") {
        axis = d3.scale.log();
        axis_type = axis.domain(p_domain).range([0,p_width]).nice();
        rxds.app.log_scales[p_anchor] = {"domain":p_domain,"range":[0,p_width],"axis_type":axis,"chart":chart,"type":"rowChart"};
        elasticX = false;
      }
      else {
        axis_type = d3.scale.linear().domain(p_domain);
        elasticX = true;
      }
        chart.width(p_width).height(p_height)
        .useViewBoxResizing(true)
        .margins({top: 5, left: 5, right: 5, bottom: 20})
       .dimension({}).group({}).commitHandler(commitHandler)
        .ordinalColors(colors)
        .label(function (d) {
            return d.key;
        })
        // Title sets the row text
        .title(function (d) {
            return d.value;
        })
        .elasticX(elasticX)
        .x(axis_type)
//           .turnOnControls(true)
//           .controlsUseVisibility(true)
        
        chart.xAxis().scale(chart.x())
          .ticks(8, ",.0f");
    } //rowChart
    
    function dataTable(p_anchor, p_width, p_height, p_grp_name, p_columns, p_sortby, p_order) {
      var chart = dc.dataTable(p_anchor);
      chart.width(p_width).height(p_height)
        .dimension({})
        .group(function(d) {
            return p_grp_name;
        })
      .commitHandler(commitHandler)
      .columns(p_columns)
      .sortBy(p_sortby)
      .order(p_order)
      ;
     chart.dimension().top = function() { return rxds.app.dcData["datatable"]; };
     chart.dimension().bottom = function() { return rxds.app.dcData["datatable"]; };
    }
    
    function lineAreaChart(p_anchor, p_width, p_height, p_xscale, p_domain, p_area_flag) {
            var chart = dc.lineChart(p_anchor);
         //Specify an area chart by using a line chart with `.renderArea(true)`.
    // [Line Chart](https://github.com/dc-js/dc.js/blob/master/web/docs/api-latest.md#line-chart)
    chart /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
        .renderArea(p_area_flag)
        .width(p_width).height(p_height)
            .dimension({}).group({}).commitHandler(commitHandler)
        .transitionDuration(1000)
        .margins({top: 30, right: 50, bottom: 25, left: 40})
        .mouseZoomable(true)
    // Specify a "range chart" to link its brush extent with the zoom of the current "focus chart".
    //    .rangeChart(volumeChart)
    //d3.time.scale().domain([new Date(1985, 0, 1), new Date(2012, 11, 31)])
        .x(d3.scale.linear().domain(p_xscale))
        .round(d3.time.month.round)
        .xUnits(d3.time.months)
        .elasticY(true)
        .renderHorizontalGridLines(true)
        // Position the legend relative to the chart origin and specify items' height and separation.
    //    .legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
        .brushOn(false)
        // Add the base layer of the stack with group. The second parameter specifies a series name for use in the
        // legend.
        // The `.valueAccessor` will be used for the base layer
//        .valueAccessor(function (d) {
//            return d.value.avg;
//        })
        // Stack additional layers with `.stack`. The first paramenter is a new group.
        // The second parameter is the series name. The third is a value accessor.
//        .stack(monthlyMoveGroup, 'Monthly Index Move', function (d) {
//            return d.value;
//        })
        // Title can be called by any stack layer.
//        .title(function (d) {
//            var value = d.value.avg ? d.value.avg : d.value;
//            if (isNaN(value)) {
//                value = 0;
//            }
//            return dateFormat(d.key) + '\n' + numberFormat(value);
//        });
         ;
    } //lineAreaChart 
    function barChart(p_anchor, p_width, p_height, p_yscale, p_domain) {
      var chart = dc.barChart(p_anchor);
      var log_type; var elasticY;
      if (p_yscale == "log") {
        axis = d3.scale.log();
        log_type = axis.clamp(true).domain(p_domain);
        rxds.app.log_scales[p_anchor] = {"domain":p_domain,"range":[0,p_width],"axis_type":axis,"chart":chart,"type":"barChart"};
        elasticY = false;
      }
      else {
        log_type = d3.scale.linear().domain(p_domain);
        elasticY = true;
      }
      chart = chart.width(p_width).height(p_height)
            .dimension({}).group({}).commitHandler(commitHandler)
            .transitionDuration(1500)
            .centerBar(false)    
            .x(d3.scale.ordinal())
            .xUnits(dc.units.ordinal)
            .yAxisLabel(" ")
            .brushOn(true)
            .y(log_type)
//            .ordering(function(d) { return parseInt(d.key); })
            .elasticY(elasticY)
           .turnOnControls(true)
           .controlsUseVisibility(true);
    
       chart.xAxis().tickFormat(function(v) {return v;});
       chart.yAxis().ticks(5,",.0f");
    }
    return {
        beforeFilters: beforeFilters,
        numberFormat: numberFormat,
        pieChart: pieChart,
        barChart: barChart,
        rowChart: rowChart,
        rxdsSankey:rxdsSankey,
        lineAreaChart: lineAreaChart,
        dataTable: dataTable,
        rxdsDataTable:rxdsDataTable,
        setUpChart:setUpChart,
        resetChart: resetChart,
        promisePost:promisePost,
        geoChoroplethChart: geoChoroplethChart,
        geoChoroplethqJSON:geoChoroplethqJSON,
        commitHandler: commitHandler
    };
})();

var datatable;
//var chart = dc.pieChart("#test");
var superscript = "⁰¹²³⁴⁵⁶⁷⁸⁹",
    formatPower = function(d) { return (d + "").split("").map(function(c) { return superscript[c]; }).join(""); };

//Attaching refresh event to Dim Chart
$( ".dimChartReg" ).on( "refresh", function( event, ajaxReq ) {
    var obj = this,
      sel = $(this),
       config = $(this).data("config");
       if (rxds.app.dimload==0) {
         dc.chartRegistry.clear();
         eval(config.beforechart.replace(/\`\`/g,"'"));
         rxds.app.dimload=1;
       }
       else {
          rxds.app.dimload=1;
       }
       rxdsdimchart.setUpChart();
       rxdsdimchart.promisePost().then(function() {
               rxdsdimchart.commitHandler().then(function() {
                dc.renderAll(); 
          });
          rxds.app.dimload=3; 
         
       });
}); // On Refresh Dimension Chart Region

