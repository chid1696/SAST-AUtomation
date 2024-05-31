// Add a reference to rxds global
rxds.app.echart = [];
var rxdsechart = (function() {
    // Public API
    
    //Used for storing the Scatter Map Data points for showing the Bar through renderBrush function
    //  * This is set inside "Scatter Map with Bar" chart
    var gScatterMapData;
    var gScatterMapBars = 20;// Number of Top values to be shown at the right
    
    function fneChart(elem, data, pconfig) {
        var legend = [];
        var config;

        var myChart = echarts.init(elem, pconfig.theme);
    		myChart.showLoading({text: 'Fetching data. Please wait...  '});//loading text

        console.log(pconfig);
        console.log($(elem).data("charttype"));
        var charttype = $(elem).data("charttype");
        var stacked = $(elem).data("stacked");
        var clusterNumber = $(elem).data("clusternumber");

        config = $.extend({},rxdsechart.options.eChartOptions[charttype]);
        
        if (data.qerr !== undefined) {
          // There is an error running the query
          console.log("Error running chart code - Error: '" + data.qerr + "; See submitted values below");
          console.log(data.submitted);
          return;
        }
        var qout = data.result;
        var chartdata;
        chartdata = (data.result.chartdata === undefined)?data.result:data.result.chartdata;

        if (['Column','Bar','Area','Spline','Line','Areaspline'].indexOf(charttype) > -1) {
            var result = chartdata;
            // Fix the missing "0"s in the JSON like [,,,123,456,,,,]
            //   as well as replacing single quote with double quote for states .. 'CT' with "CT"
            var hdata, hcharts;
            if (result[0] != undefined){
                hcharts = result[0].hcharts;
                hcharts = hcharts.replaceAll("\\[,","[0,").replaceAll(",\\]",",0]");
                hcharts = hcharts.replaceAll(",,",",0,").replaceAll(",,",",0,").replaceAll("'","\"");
                hdata = JSON.parse(hcharts);
            }else{
                hdata = chartdata;
            }
            var seriesData = hdata.series;
            var categories = hdata.categories;
            var l = hdata.series.length;
            if(seriesData.length == 1){
              config.legend.show = false;
            }else{
              config.legend.show = true;
            }
		        config.legend.data = legend;
		        if (charttype == "Bar") {
		          config.yAxis[0].data = categories;
		        }else{// column or other chart type
		          config.xAxis[0].data = categories;

		        }
		        config.series=seriesData;
		        charttype = charttype.toLowerCase();
		        if (charttype === "column") {charttype="bar"}

		        $.map(seriesData, function(obj,i){
        			 obj.type= charttype;
			         if (charttype === "area") {
          				 obj.type= "line";
          				 obj.itemStyle= {normal: {areaStyle: {type: 'default'}}};
			         } else if (charttype === "spline") {
          				 obj.type= "line";
          				 obj.smooth= true;
		           } else if (charttype === "areaspline") {
          				 obj.type= "line";
          				 obj.itemStyle= {normal: {areaStyle: {type: 'default'}}};
          				 obj.smooth= true;
		           }
        			 if (stacked === "Y") {
        			   obj.stack="Default";
        			 }
        			 legend[i]=obj.name;
		        });

        }else if (charttype === "Scatter") {
            series=chartdata.series;
            var l = series.length;
            var legend = [];
            for (var i = 0; i < l ; i++) {
                        legend[i]=series[i].name;
                        series[i].type="scatter";
                        series[i].label= {emphasis: {show: true,
                             formatter: function (param) {return param.data[3];},
                         position: 'top'
                       }};
            }
		    config.legend.data = legend;
            config.series=series;
        }else if (charttype === "Punchcard") {

//          console.log("Seting up Punchcard" + JSON.stringify(chartdata));
          days=chartdata.days;
          data=chartdata.series;
          hours=chartdata.hours;

          echarts.util.each(days, function (day, idx) {
                config.title.push({
                    textBaseline: 'middle',
                    top: (idx + 0.5) * 100 / 7 + '%',
                    text: day
                });
                config.singleAxis.push({
                    left: 150,
                    type: 'category',
                    boundaryGap: false,
                    data: hours,
                    top: (idx * 100 / 7 + 5) + '%',
                    height: (100 / 7 - 10) + '%',
                    axisLabel: {
                        interval: 0
                    }
                });
                config.series.push({
                    singleAxisIndex: idx,
                    coordinateSystem: 'singleAxis',
                    type: 'scatter',
                    data: [],
                    symbolSize: null
                });
            });

            echarts.util.each(data, function (dataItem) {
                config.series[dataItem[0]].data.push([dataItem[1], dataItem[2], dataItem[3]]);
                config.series[dataItem[0]].symbolSize=function (dataItem) {return dataItem[2];}
            });

          //debugger;
          
        }else if (charttype === "Punchcardgrid") {

 //         console.log("Seting up Punchcard" + JSON.stringify(chartdata));
          days=chartdata.days;
          data=chartdata.series;
          hours=chartdata.hours;
          
          data = data.map(function (item) {
              return [item[1], item[0], item[2] || '-'];
            });
            
          config.series[0].data=data;
          config.yAxis.data=days;
          config.xAxis.data=hours;

        } else if (charttype === "Boxplot") {
 //           console.log("Setting up Box Plot" + JSON.stringify(chartdata));

            series=chartdata.series;
            var l = series.length;
            var legend = [];
            for (var i = 0; i < l ; i++) {
                        series[i].type = "boxplot";
                        series[i].itemStyle = {normal:{borderWidth:3}};// Default 1
                        series[i].tooltip = {formatter: function (param) {
                                                return [
                                                     param.name,
                                                    'paid for ' + param.seriesName,
                                                    'maximum: '   + param.data[6],
                                                    'upper(95): ' + param.data[0],
                                                    'Q1: ' + param.data[1],
                                                    'median: ' + param.data[2],
                                                    'Q3: ' + param.data[3],
                                                    'lower(10): ' + param.data[4],
                                                    'lower: ' + param.data[5]
                                                ].join('<br/>')
                                                }
                                            }
            }
		        config.legend.data = chartdata.legendData;
            config.xAxis.data = chartdata.axisData;
            config.series=series;
        } else if (charttype === "Timeline"){
  //          console.log("Setting up Timeline" + JSON.stringify(chartdata));
                var itemStyle = {
                            normal: {
                                opacity: 0.8,
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowOffsetY: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        };
                    var sizeFunction = function (x) {
                      var y = Math.sqrt(x / 5e8) + 0.1;
                      return y * 80;
                    };

            data=chartdata;
            for (var n = 0; n < data.timeline.length; n++) {
                 config.baseOption.timeline.data.push(data.timeline[n]);
                  config.options.push({
                      title: {
                          show: true,
                          'text': data.timeline[n] + ''
                      },
                      series: {
                          name: data.timeline[n],
                          type: 'scatter',
                          itemStyle: itemStyle,
                          data: data.series[n],
                          symbolSize: function(val) {
                              //return sizeFunction(val[2]);
                              return val[2]/300;
                          }
                      }
                  });
          }

          config.baseOption.visualMap[0].categories=data.counties;
          config.baseOption.title[0].text=data.timeline[0];
          config.baseOption.series[0].data=data.series[0];
          //debugger;
        }else if (charttype === "Clustering") {
            data=chartdata;
          //  var clusterNumber = 6;
            // See https://github.com/ecomfe/echarts-stat
            var step = ecStat.clustering.hierarchicalKMeans(data, clusterNumber, true);
            var result;
            for (var i = 0; !(result = step.next()).isEnd; i++) {

                    config.options.push(getClusteringOption(result, clusterNumber));
                    config.timeline.data.push(i + '');
                
                }
                
        }else if (charttype === "Parallel Coordinates") {
            chartdata.series.forEach(function(elem){
              $.extend(elem,elem,config.series_def);
            });
            var c =  chartdata.parallelAxis.length;
            var parallelAxis = [];
            for (var i=0; i<c; i++) {
              parallelAxis[i] = {dim: i, name: chartdata.parallelAxis[i]};
            }
            config.parallelAxis = parallelAxis;
            config.series = chartdata.series;
        }else if (charttype === "Network") {
            graph=chartdata;
            graph.nodes.forEach(function (node) {
                node.itemStyle = null;
                node.value = node.metric;
                node.symbolSize /= 1.5;
                node.attributes = {modularity_class:node.category};
                node.label = {
                    normal: {
                        show: node.symbolSize > 30
                    }
                };
            });

            var seriescat=[];
            graph.categories.forEach(function (cat) {
                seriescat.push({"name":cat});
            });
            config.series[0].data = graph.nodes;
            config.series[0].edges = graph.links;
            config.series[0].categories = seriescat;
            config.legend[0].data = graph.categories;

        }else if (charttype === "Sankey") {
            graph=chartdata;
            graph.links.forEach(function (node) {
                node.value = node.metric;
            });

            config.series[0].data = graph.nodes;
            config.series[0].links = graph.links;
        }else if (['Pie','Donut','Funnel'].indexOf(charttype) > -1)  { // Pie chart
             var hdata;
             try {
                 var hcharts = chartdata[0].hcharts;
             } catch (e) {}
            // Fix the missing "0"s in the JSON like [,,,123,456,,,,]
            //   as well as replacing single quote with double quote for states .. 'CT' with "CT"
            if(hcharts != undefined){
                hcharts = hcharts.replaceAll("\\[,","[0,").replaceAll(",\\]",",0]");
                hcharts = hcharts.replaceAll(",,",",0,").replaceAll(",,",",0,").replaceAll("'","\"");
                hdata = JSON.parse(hcharts);
            }else{
                hdata = chartdata;
            }
            var seriesData = hdata.series;
		        var l = seriesData.length;
            var categories = hdata.categories;
            var legend = {};
            var pieSeries={};
            var data=[];
            if (categories == undefined)  {
               data =  seriesData;
            }
            else {
              for (var j = 0; j< seriesData[0].data.length; j++) {
                  data[j] = {value:seriesData[0].data[j], name:categories[j]};
              }
            }
            config.series.data = data;
            config.legend.data = legend;
        }else if (charttype === "Trellis") {

            var count = chartdata.series.length;
            //debugger;
              //config.xAxis[0]  = $.extend({},config.xAxis_def,{"gridIndex":0,"data":chartdata.category});
            for(var i=0;i<count;i++){
              config.grid[i]   = $.extend({},config.grid_def);
              //debugger;
              config.xAxis[i]  = $.extend({},config.xAxis_def,{"show":false,"gridIndex":i,"data":chartdata.categories});
              config.yAxis[i]  = $.extend({},config.yAxis_def,{"show":false,"gridIndex":i});
              // Default Min Max itself looks good
              //config.yAxis[i]  = $.extend({},"min":chartdata.series[i].min.roundDown(),"max":chartdata.series[i].max.roundUp()});
              config.title[i]  = $.extend({},config.titles_def,{"text":chartdata.series[i].name});
              config.series[i] = $.extend({},config.series_def,{"name":chartdata.series[i].name,"xAxisIndex":i,"yAxisIndex":i,
                                                "data":chartdata.series[i].data});
            }// End of for

            var rowNumber = Math.ceil(Math.sqrt(count));
            echarts.util.each(config.grid, function (grid, idx) {
                grid.left = ((idx % rowNumber) / rowNumber * 100 + 0.5) + '%';
                grid.top = (Math.floor(idx / rowNumber) / rowNumber * 100 + 0.5) + '%';
                grid.width = (1 / rowNumber * 100 - 1) + '%';
                grid.height = (1 / rowNumber * 100 - 1) + '%';

                config.title[idx].left = parseFloat(grid.left) + parseFloat(grid.width) / 2 + '%';
                config.title[idx].top = parseFloat(grid.top) + '%';
            });
        }else if (charttype === "Treemap") {
           config = {
                    title: {text: 'Disk Usage',left: 'center'},
                    tooltip: {
                        formatter: function (info) {
                            var value = info.value;
                            var treePathInfo = info.treePathInfo;
                            var treePath = [];
                            for (var i = 1; i < treePathInfo.length; i++) {
                                treePath.push(treePathInfo[i].name);
                            }
                            return ['<div class="tooltip-title">' + echarts.format.encodeHTML(treePath.join('/')) + '</div>',
                                    qout.chartmetric + ': '+ echarts.format.addCommas(value)].join('');
                        }
                    },
                    series: [{name:qout.chartmetric,
                              type:'treemap',
                              visibleMin: 300,
                              label: {show: true,formatter: '{b}'},
                              itemStyle: {normal: {borderColor: '#fff'}},
                              levels: [{"itemStyle":{"normal":{"borderWidth":0,"gapWidth":5}}},
                                        {"itemStyle":{"normal":{"gapWidth":1}}},
                                        {"colorSaturation":[0.35,0.5],"itemStyle":{"normal":{"gapWidth":1,"borderColorSaturation":0.6}}}],
                              data: chartdata}]
            };// End of config

        } else if (charttype === "Map") {
            map_data = chartdata;
            map_data.forEach(function (node) {
                node.itemStyle = null;
                node.value = node.metric;
            });
            config.series[0].data = map_data;
        }else if (charttype === "Scatter Map") {


            var data2 = [{"name":"Connecticut",    "value":[ -72.674561, 41.759260,  99]},
                        {"name":"Newyork",      "value":[ -73.986053, 40.757904,  80]},
                        {"name":"Pittsburgh",   "value":[ -79.996948, 40.424196,  70]},
                        {"name":"Orlando",      "value":[ -81.362000, 28.529601, 140]},
                        {"name":"Seatle",       "value":[-122.327271, 47.600824, 120]},
                        {"name":"San Francisco","value":[-122.404175, 37.784758, 150]},
                        {"name":"Denver",       "value":[-104.978485, 39.732786,  50]}];

            data2 = [];
            for(var i=0;i<chartdata.length;i++){
              data2[i] = {"name":chartdata[i].First_Name 
                                //+ " " + chartdata[i].Last_Name + "<br>" 
                                //+ chartdata[i].City + " " + chartdata[i].State_Code + "-" + chartdata[i].Zip
                          ,"value":[ chartdata[i].Longitude, chartdata[i].Latitude,  chartdata[i].metric]}
            };

            config = {
                title: {
                    text: 'Hello World',
                    subtext: 'data from PM25.in',
                    left: 'center'
                },
                tooltip : {
                    trigger: 'item'
                },
                geo: {
                  map: 'USA',
                  roam : true
                },
                bmap: {
                    center: [-80, 40.550339],
                    zoom: 5,
                    roam: true
                },
                series : [
                    {
                        name: 'pm2.5',
                        type: 'scatter',
                        coordinateSystem: 'geo',
                        map: 'USA',
                        data: data2,
                        symbolSize: function (val) {return getBubSize(qout.minmax[0].minval,qout.minmax[0].maxval,val[2])},
                        label: {
                            normal: {
                                formatter: '{b}',
                                position: 'right',
                                show: false
                            },
                            emphasis: {
                                show: true
                            }
                        },
                        itemStyle: {
                            normal: {
                                color: 'purple'
                            }
                        }
                    }
                ]
            };









        }else if (charttype === "Scatter Map with Bar") {
//  ======================================= *** ===========================================

            var data2 = [{"name":"Connecticut",    "value":[ -72.674561, 41.759260,  99]},
                        {"name":"Newyork",      "value":[ -73.986053, 40.757904,  80]},
                        {"name":"Pittsburgh",   "value":[ -79.996948, 40.424196,  70]},
                        {"name":"Orlando",      "value":[ -81.362000, 28.529601, 140]},
                        {"name":"Seatle",       "value":[-122.327271, 47.600824, 120]},
                        {"name":"San Francisco","value":[-122.404175, 37.784758, 150]},
                        {"name":"Denver",       "value":[-104.978485, 39.732786,  50]}];

            data2 = [];
            for(var i=0;i<chartdata.length;i++){
              data2[i] = {//"name":chartdata[i].First_Name //+ " " + chartdata[i].Last_Name + "<br>" 
                                //+ chartdata[i].City + " " + chartdata[i].State_Code + "-" + chartdata[i].Zip
                          "name":chartdata[i].City + ", " + chartdata[i].State
                          ,"value":[ chartdata[i].Longitude, chartdata[i].Latitude,  chartdata[i].metric]}
            };

            //config = {
            config = $.extend(config,{
                backgroundColor: '#ffffff',
                animation: true,
                animationDuration: 1000,
                animationEasing: 'cubicInOut',
                animationDurationUpdate: 1000,
                animationEasingUpdate: 'cubicInOut',
                //toolbox: toolboxBasic,
                title: [
                    {   text: 'Scatter Map with Bar',
                        subtext: 'Top City',
                        sublink: 'http://www.rxdatascience.com',
                        left: 'center',
                        textStyle: {color: '#fff'}
                    },
                    {  id: 'statistic',
                        text:'',
                        right: 120,
                        top: 40,
                        width: 100,
                        textStyle: {color: '#fff',fontSize: 16}
                    }
                ],
                toolbox: {
                    iconStyle: {
                        normal: {borderColor: '#9999cc'},
                        emphasis: {borderColor: 'purple'}
                    },
                    feature:{
                        brush:{title:{rect:'Rectangle',polygon:'Polygon',lineX:'Line X',lineY:'Line Y',keep:'Keep',clear:'Clear'}}
                    }
                },
                brush: {
                    outOfBrush: {color: '#666666'},
                    brushStyle: {borderWidth: 2,color: 'rgba(0,0,0,0.2)',borderColor: 'rgba(0,0,0,0.5)'},
                    seriesIndex: [0, 1],
                    throttleType: 'debounce',
                    throttleDelay: 300,
                    geoIndex: 0
                },
                geo: {
                    map: 'USA',
                    left: '10',
                    right: '30%',
                    center: [-95,35],//[-95,38],[-80, 40.550339], //[117.98561551896913, 31.205000490896193],
                    zoom: 1.05,
                    label: {emphasis: {show: false}},
                    roam: false,
                    itemStyle: {
                        normal: {areaColor: '#f3f3f3',borderColor: '#111'},
                        emphasis: {areaColor: '#2a333d'}
                    }
                },
                tooltip : {trigger: 'item'},
                grid: {
                    right: 50,
                    top: 75,
                    bottom: 20,
                    width: '20%'
                },
                xAxis: {
                    type: 'value',
                    scale: true,
                    position: 'top',
                    boundaryGap: false,
                    splitLine: {show: false},
                    axisLine: {show: false},
                    axisTick: {show: false},
                    axisLabel: {margin: 2, textStyle: {color: 'purple'}, rotate:-45},
                },
                yAxis: {
                    type: 'category',
                    //name: 'TOP 20', // Bar Chart Title
                    nameGap: 16,
                    axisLine: {show: false, lineStyle: {color: 'purple'}},
                    axisTick: {show: false, lineStyle: {color: 'purple'}},
                    axisLabel: {interval: 0, textStyle: {color: 'purple'}},
                    data: []
                },
                series : [
                    {
                        name: 'Prescriber Metric',
                        type: 'scatter',
                        coordinateSystem: 'geo',
                        data: data2,
                        symbolSize: function (val) {return getBubSize(qout.minmax[0].minval,qout.minmax[0].maxval,val[2])},
                        label: {
                            normal: {
                                formatter: '{b}',
                                position: 'right',
                                show: false
                            },
                            emphasis: {show: true}
                        },
                        itemStyle: {normal: {color: 'purple'}}
                    },
                    {
                        name: 'Top ' + gScatterMapBars,
                        type: 'effectScatter',
                        coordinateSystem: 'geo',
                        data: data2.slice(0,gScatterMapBars + 1),
                        symbolSize: function (val) {return getBubSize(qout.minmax[0].minval,qout.minmax[0].maxval,val[2])},
                        showEffectOn: 'emphasis',
                        rippleEffect: {brushType: 'stroke'},
                        hoverAnimation: true,
                        label: {
                            normal: {formatter: '{b}',position: 'right',show: true}
                        },
                        itemStyle: {
                            normal: {color: 'purple',shadowBlur: 10,shadowColor: '#333'}
                        },
                        zlevel: 1
                    },
                    {
                        id: 'bar',
                        zlevel: 2,
                        type: 'bar',
                        symbol: 'none',
                        itemStyle: {normal: {color: 'purple'}},
                        data: []
                    }
                ]
            });// End of config extend

//  ======================================= *** ===========================================




        }//Chart Condition Check

        if (charttype != "Trellis"){
            if ((qout.minmax != undefined) && (config.visualMap != undefined)) {
                //config.visualMap.max=qout.minmax[0].maxval.roundUp();
                config.visualMap.max=qout.minmax[0].maxval;
                config.visualMap.min=qout.minmax[0].minval.roundDown();
            }
            if ((pconfig.chart_title !== undefined) && (pconfig.chart_title !== "")) {
                config.title={text:pconfig.chart_title,subtext:'',x:'center'};
            }
            if (pconfig.yaxis_title !== "") {
                try {
                config.yAxis[0].name=pconfig.yaxis_title;} catch(e) {}
            }
            if (pconfig.xaxis_title !== "") {
                try {
                config.xAxis[0].name=pconfig.xaxis_title;} catch(e) {}
            }
        }
         if (typeof pconfig.beforechart != "undefined" && pconfig.beforechart != "") {
           
            eval(pconfig.beforechart.replace(/\`\`/g,"'"));
         }
        console.log(config);

        if (charttype === "Map" || charttype == "Scatter Map" || charttype == "Scatter Map with Bar") {
            //$.get('/' + rxds.app.config.url_path + '/vendor/echarts/map/USA.json', function (usaJson) {
            $.get('/' + window.location.pathname.split("/")[1] + '/vendor/echarts/map/USA.json', function (usaJson) {
                echarts.registerMap('USA', usaJson, {
                       AK: { left: -131,top: 25,width: 15},
                       HI: {left: -110,top: 28,width: 5},
                       PR: {left: -76,top: 26,width: 2}
                });
                //debugger;
                myChart.setOption(config);
                myChart.hideLoading();
                
                if(charttype == "Scatter Map with Bar"){
                    gScatterMapData = data2;// For use inside the renderBrushed
                    myChart.on('brushselected', renderBrushed);
                    setTimeout(function () {
                        myChart.dispatchAction({
                            type: 'brush',
                            areas: [{geoIndex: 0,brushType: 'polygon'
                                    //,coordRange: [ [100,35],[125,35],[125,27],[100,27]  ]
                                    ,coordRange: [  [-65,50],[-85,50],[-85,35],[-65,35]  ] 
                                   }]
                        });
                    }, 0);
                }
                
            });// End of get
        }else{
          myChart.setOption(config);
          myChart.hideLoading();
      }
      
      // Adding the Click Handler
      if(pconfig.on_click != undefined){
        myChart.on("click",function(params){
          eval(pconfig.on_click);
        })
      }
      
      
      // Add the Chart to the global
        rxds.app.echart[rxds.app.echart.length] = myChart;
    }

    /////////////////////// ******* ////////////////////////////
    // Scatter map - Bar Chart Update function
    /////////////////////// ******* ////////////////////////////
    function renderBrushed(params) {
        var mainSeries = params.batch[0].selected[0];
    
        var selectedItems = [];
        var categoryData = [];
        var barData = [];
        var maxBar = gScatterMapBars;
        var sum = 0;
        var count = 0;
    
        for (var i = 0; i < mainSeries.dataIndex.length; i++) {
            var rawIndex = mainSeries.dataIndex[i];
            var dataItem = gScatterMapData[rawIndex];
            var pmValue = dataItem.value[2];
    
            sum += pmValue;
            count++;
    
            selectedItems.push(dataItem);
        }
    
        // data is presorted, hence skip
        /*
        selectedItems.sort(function (a, b) {
            return a.value[2] - b.value[2];
        });
        */
    
        // Balaji Fix. To show the Max value at the Top. Populate the array in reverse
        //for (var i = 0; i < Math.min(selectedItems.length, maxBar); i++) {
        for (var i = Math.min(selectedItems.length, maxBar)-1; i >=0; i--) {
            categoryData.push(selectedItems[i].name);
            barData.push(selectedItems[i].value[2]);
        }
    
        this.setOption({
            yAxis: {
                data: categoryData
            },
            xAxis: {
                axisLabel: {show: !!count}
            },
            title: {
                id: 'statistic',
                //text: count ? '平均: ' + (sum / count).toFixed(4) : ''
            },
            series: {
                id: 'bar',
                data: barData
            }
        });
    };    
    
    // Bubble Size Calculation based on min, max & metric value
    function getBubSize(min,max,val){
      return Math.round(5 + (val-min)/(max-min)*20);
    }
    
    /////////////////////// ******* ////////////////////////////
    //Clustering EChart Options
    /////////////////////// ******* ////////////////////////////
    
      function getClusteringOption(result, k) {
        var clusterAssment = result.clusterAssment;
        var centroids = result.centroids;
        var ptsInCluster = result.pointsInCluster;
        var color = ['#c23531', '#2f4554', '#61a0a8', '#d48265', '#91c7ae', '#749f83', '#ca8622', '#bda29a', '#6e7074', '#546570', '#c4ccd3'];
        var series = [];
        for (i = 0; i < k; i++) {
            series.push({
                name: 'scatter' + i,
                type: 'scatter',
                animation: false,
                data: ptsInCluster[i],
                markPoint: {
                    symbolSize: 29,
                    label: {
                        normal: {
                            show: false
                        },
                        emphasis: {
                            show: true,
                            position: 'top',
                            formatter: function (params) {
                                return Math.round(params.data.coord[0] * 100) / 100 + '  ' +
                                    Math.round(params.data.coord[1] * 100) / 100 + ' ';
                            },
                            textStyle: {
                                color: '#000'
                            }
                        }
                    },
                    itemStyle: {
                        normal: {
                            opacity: 0.7
                        }
                    },
                    data: [{
                        coord: centroids[i]
                    }]
                }
            });
        }
    
        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                }
            },
            series: series,
            color: color
        };
    }


    return {
        fneChart: fneChart
    };
})();