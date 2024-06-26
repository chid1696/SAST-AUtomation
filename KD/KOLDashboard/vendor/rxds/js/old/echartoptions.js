rxdsechart.options = (function() {
    var eChartOptions = {};

    var setOptions = function() {
      eChartOptions["Line"] = {
            legend: legendBottomLeft,  //grid : {x:"80",y:"80", x2:"90", y2: "120"},
            tooltip : tooltipAxis, calculable : true, datazoom: datazoom1,
            xAxis: AxisCategoryNoGap, yAxis: AxisValueLeft,
            toolbox: toolboxLine, series:[]
      }; // line
      eChartOptions["Area"]         = $.extend({},eChartOptions["Line"]);
      eChartOptions["Spline"]       = $.extend({},eChartOptions["Line"]);
      eChartOptions["Areaspline"]   = $.extend({},eChartOptions["Line"]);

      eChartOptions["Column"]       = $.extend({},eChartOptions["Line"]);
      eChartOptions["Bar"]          = $.extend({},eChartOptions["Line"]);

      eChartOptions["Bar"].yAxis    = AxisCategoryGap; // Bar chart swaps the X and Y axes
      eChartOptions["Bar"].xAxis    = AxisValueLeft;
      eChartOptions["Column"].xAxis = AxisCategoryGap;

     eChartOptions["Treemap"] = {};

     eChartOptions["Trellis"] = {
                grid:[],xAxis:[],yAxis:[],series: [],title:[],
                grid_def:{"show":true,"borderWidth":0,"backgroundColor":"#fff","shadowColor":"rgba(0, 0, 0, 0.3)","shadowBlur":2},
                xAxis_def:AxisCategoryNoGap[0],
                yAxis_def:AxisValueLeft[0],
                titles_def: {"textAlign":"center","textStyle":{"fontSize":12,"fontWeight":"normal"}},
                series_def: {"type":"line","showSymbol":false,"animationEasing":"linear","animationDuration":1000},
                tooltip:tooltipAxis
     };// Trellis

     eChartOptions["Boxplot"] = {
            title: topTitle,
            color : ['#c23531','#008080','#000080','#2f4554', '#61a0a8', '#d48265', '#91c7ae','#749f83',  '#ca8622', '#bda29a','#6e7074', '#546570', '#c4ccd3'],
            legend: {
                y: '10%',
                data: []
            },
            tooltip: {
                trigger: 'item',
                axisPointer: {
                    type: 'shadow'
                }
            },
            roam: false,
            xAxis: {
                type: 'category',
                data: [],
                boundaryGap: true,
                nameGap: 30,
                splitArea: {
                    show: true
                },
               splitLine: {
                    show: false
                },
                nameTextStyle: {fontWeight:"bold",fontSize:14},
              axisLabel: {
                rotate:25,
                textStyle:{fontWeight:"bold"}
              }
            },
            yAxis: [AxisValueLeft],
            dataZoom: [
                {
                    type: 'inside',
                    start: 0,
                    end: 20
                },
                {
                    show: true,
                    height: 20,
                    type: 'slider',
                    top: '90%',
                    xAxisIndex: [0],
                    start: 0,
                    end: 20
                }
            ],
            series: []
      }; //boxplot


     eChartOptions["Punchcard"] = {
                tooltip: {
                    position: 'top'
                },
                title: [],
                singleAxis: [],
                series: []
     }; // Punchcard


     eChartOptions["Punchcardgrid"] = {
        tooltip: {
            position: 'top'
        },
        animation: true,
        grid: {
            height: '50%',
            y: '10%'
        },
        xAxis: {
            type: 'category',
            data: [], //hours
            splitArea: {
                show: true
            }
        },
        yAxis: {
            type: 'category',
            data: [], //days
            splitArea: {
                show: true
            }
        },
        visualMap: {
            min: 0,
            max: 10,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '15%'
        },
        series: [{
            name: 'Payments Card',
            type: 'heatmap',
            data: [], //data
            label: {
                normal: {
                    show: true
                }
            },
            itemStyle: {
                emphasis: {
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }]
}; // Punchcardgrid

    // Schema:
    var schema = [
        {name: 'Amount Paid', index: 0, text: 'Total Amount Paid: ', unit: ''},
        {name: 'Number of Payments', index: 1, text: 'Number of Payments', unit: ''},
        {name: 'Phyiscians', index: 2, text: 'Number of Physicians', unit: ''},
        {name: 'Manufacturers', index: 3, text: 'Manufacturer', unit: ''}
    ];


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

    eChartOptions["Timeline"] = {

          baseOption: {
            timeline: {
                axisType: 'category',
                orient: 'vertical',
                autoPlay: false,
                inverse: true,
                playInterval: 1000,
                left: null,
                right: 0,
                top: 20,
                bottom: 20,
                width: 55,
                height: null,
                label: {
                    normal: {
                        textStyle: {
                            color: '#999'
                        }
                    },
                    emphasis: {
                        textStyle: {
                            color: '#fff'
                        }
                    }
                },
                symbol: 'none',
                lineStyle: {
                    color: '#555'
                },
                checkpointStyle: {
                    color: '#bbb',
                    borderColor: '#777',
                    borderWidth: 2
                },
                controlStyle: {
                    showNextBtn: false,
                    showPrevBtn: false,
                    normal: {
                        color: '#666',
                        borderColor: '#666'
                    },
                    emphasis: {
                        color: '#aaa',
                        borderColor: '#aaa'
                    }
                },
                data: []
            },
            backgroundColor: '#404a59',
            title: [{
                text: [], //data.timeline[0]
                textAlign: 'center',
                left: '83%',
                top: '65%',
                textStyle: {
                    fontSize: 50,
                    color: 'rgba(255, 255, 255, 0.7)'
                }
            }],
            tooltip: {
                padding: 5,
                backgroundColor: '#222',
                borderColor: '#777',
                borderWidth: 1,
                formatter: function (obj) {
                    var value = obj.value;
                    return schema[3].text + '：' + value[3] + '<br>'
                            + schema[1].text + '：' + value[1] + schema[1].unit + '<br>'
                            + schema[0].text + '：' + value[0] + schema[0].unit + '<br>'
                            + schema[2].text + '：' + value[2] + '<br>';
                }
            },
            grid: {
                left: '12%',
                right: '110'
            },
            xAxis: {
                type: 'log',
                name: 'Amount Paid',
                max: 10000000,
                min: 100000,
                nameGap: 25,
                nameLocation: 'middle',
                nameTextStyle: {
                    fontSize: 18
                },
                splitLine: {
                    show: false
                },
                axisLine: {
                    lineStyle: {

                        color: '#ccc'
                    }
                },
                axisLabel: {
                    formatter: '{value} $'
                }
            },
            yAxis: {
                type: 'value',
                name: 'Number of Payments',
                max: 200000,
                nameTextStyle: {
                    color: '#ccc',
                    fontSize: 18
                },
                axisLine: {
                    lineStyle: {
                        color: '#ccc'
                    }
                },
                splitLine: {
                    show: false
                },
                axisLabel: {
                    formatter: '{value}'
                }
            },
            visualMap: [
                {
                    show: false,
                    dimension: 3,
                    categories: [],//data.counties
                    calculable: true,
                    precision: 0.1,
                    textGap: 30,
                    textStyle: {
                        color: '#ccc'
                    },
                    inRange: {
                        color: (function () {
                            var colors = ['#bcd3bb', '#e88f70', '#edc1a5', '#9dc5c8', '#e1e8c8', '#7b7c68', '#e5b5b5', '#f0b489', '#928ea8', '#bda29a'];
                            return colors.concat(colors);
                        })()
                    }
                }
            ],
            series: [
                {
                    type: 'scatter',
                    itemStyle: itemStyle,
                    data: [],//data.series[0]
                    symbolSize: function(val) {
                       // return sizeFunction(val[2]);
                       return val[2]/300;
                    }
                }
            ],
            animationDurationUpdate: 1000,
            animationEasingUpdate: 'quinticInOut'
        },
        options: []

    };  //timeline

     eChartOptions["Scatter"] = {
            tooltip: tooltipScatter, toolbox: toolboxBasic, legend: legendBottomLeft,
            visualMap: visualMap1, xAxis : AxisValue, yAxis : AxisValueLeft,
            animation: true, series : []
        }; // scatter

      eChartOptions["Sankey"] = {
            title: topTitle, tooltip: tooltipItem,
            series: [{
                type: 'sankey',layout: 'none',
                data: [],links: [],
                itemStyle: {normal: {borderWidth: 1,borderColor: '#aaa'}},
                lineStyle: {normal: {color: 'source',curveness: 0.5}}
            }]
       }; // sankey
      eChartOptions["Network"] = {
          title: bottomTitle,
          tooltop: {},
          legend: [{data:[]}],
        //animationDuration: 1500, animationEasingUpdate: 'quinticInOut',
          series : [{
                name: 'Network', type: 'graph', layout: 'force',
                data: [],edges: [],categories: [],
                draggable: true, animation: false, // roam: true,
                force: {
                    //initLayout: 'circular',gravity: 0,
                    edgeLength: 300,
                    repulsion: 90
                },
                label: {normal: {position: 'right',formatter: '{b}'}},
                lineStyle1: {normal: {color: 'source',curveness: 0.3}}
            }] // series
      }; //Network
      eChartOptions["Pie"] = {
          title: topTitle,tooltip: tooltipPie, calculable : true,
          legend: legendVerticalLeft,toolbox: toolboxPie,
          series: { name:'', type:'pie', radius : '65%', center: ['50%', '50%'], data:[]}
      }; //pie
      eChartOptions["Donut"] = {
          title: topTitle,tooltip: tooltipPie,legend: legendVerticalLeft,toolbox: toolboxPie,
          series: { name:'', type:'pie', radius : ["40%","55%"], center: ['70%', '50%'], data:[]}
      }; //Donut
      eChartOptions["Funnel"] = {
          title: topTitle,tooltip: tooltipFunnel,legend: legendVerticalLeft,toolbox: toolboxPie,
          series: { name: '', type:'funnel', left: '10%',top: 60,bottom: 60,width: '80%',
                            // height: {totalHeight} - y - y2,
                            //min: 0,max: 100,
                    minSize: '0%', maxSize: '100%',
                    sort: 'descending', gap: 2,
                    label: {normal: {show: true,position: 'inside'},
                            emphasis: {textStyle: {fontSize: 20}}
                    },//label
                    labelLine: {normal: {length: 10,lineStyle: {width: 1,type: 'solid'} } },
                    itemStyle: {normal: {borderColor: '#fff',borderWidth: 1}},
         data:[]}
      }; // Funnel
      eChartOptions["Map"] = {
          title: topTitle,
          tooltip: tooltipItem,
          visualMap: visualMap2,
          series: [{
                name: '',
                type: 'map',
                map: 'USA',
                roam: true,
                top: 60,
                width: '80%',
                itemStyle: {
                        normal:{
                            borderWidth: 0.5,
                            borderColor: 'black'
                        },
                        emphasis:{label:{show:true}}
                    },
                data:[
                    {name : 'CT', value : 1},
                    {name : 'NY', value : 2}
                ]
            }]
      }; //Map
      eChartOptions["Scatter Map"] = {
          toolbox: toolboxBasic
      };//Scatter Map
      eChartOptions["Scatter Map with Bar"] = {
          toolbox: toolboxBasic
      };//Scatter Map with Bar
      
      eChartOptions["Parallel Coordinates"] = ec_config_pcoord();
      
      eChartOptions["Clustering"] = {

          timeline: {
              top: 'center',
              right: 35,
              height: 300,
              width: 10,
              inverse: true,
              playInterval: 2500,
              symbol: 'none',
              orient: 'vertical',
              axisType: 'category',
              autoPlay: true,
              label: {
                  normal: {
                      show: false
                  }
              },
              data: []
          },
          baseOption: {
              title: {
                  text: 'Process of Clustering',
                  subtext: 'By ecStat.hierarchicalKMeans',
                  sublink: 'https://github.com/ecomfe/echarts-stat',
                  left: 'center'
              },
              xAxis: {
                  type: 'value'
              },
              yAxis: {
                  type: 'value'
              },
              series: [{
                  type: 'scatter'
              }]
          },
          options: []

        
      };//Process of Clustering
      
    } //setOptions


    var topTitle = {text: ' ', subtext: '', x:'center'};
    var bottomTitle = {text: ' ', top: 'bottom',left: 'right'};

    var tooltipItem = {trigger: 'item'};
    var tooltipAxis =  {trigger: 'axis'};
    var tooltipPie = {trigger: 'item',formatter: "{a} <br/>{b} : {c} ({d}%)",position: [20,320]};
    var tooltipFunnel = {trigger: 'item',formatter: "{a} <br/>{b} : {c} ",position: [20,320]};

    var tooltipScatter = {trigger: 'item',formatter:function (obj) {
            var value = obj.value;
            return '<div style="border-bottom: 1px solid rgba(255,255,255,.3); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                + obj.seriesName + ' ' + value[3]
                + '</div>'
                + value[0] + '<br>'
                + value[1] + '<br>'
                + value[2] + '<br>';
        }
    };

    var legendBottomLeft = {x: 'left',y:'bottom',data:[]};
    var legendVerticalLeft = {orient : 'vertical',x : 'left',data:[] };

    var AxisValue         = [{type : 'value',scale : true}];
    var AxisCategoryNoGap = [{type : 'category',boundaryGap : false,data : []}];
    var AxisCategoryGap   = [{type : 'category',boundaryGap : true, data : []}];

    var AxisValueLeft = [{type : 'value',position:'left',scale : true}];

    var  datazoom1 =  {show : false,realtime : true};

    var lineStyle = {normal: {width: 1, opacity: 0.5}};

    var visualMap2 = {
            //min: 0,
            //max: 1000000,
            text:['High','Low'],
            realtime: true,
            calculable : true,
            color: ['orangered','yellow','lightskyblue']
        };

    var visualMap1 = [{
                    left: 'right',
                    top: '10%',
                    dimension: 2,
                    itemWidth: 30,
                    itemHeight: 120,
                    calculable: true,
                    precision: 0.1,
                    min: 0,
                    max: 1000,
                    text: ['Size'],
                    textGap: 30,
                    textStyle: {
                        color: '#000'
                    },
                    inRange: {
                        symbolSize: [10, 70]
                    },
                    outOfRange: {
                        symbolSize: [10, 70],
                        color: ['rgba(255,255,255,.2)']
                    },
                    controller: {
                        inRange: {
                            color: ['#c23531']
                        },
                        outOfRange: {
                            color: ['#444']
                        }
                    }
                }];

    var tableDataView = {
                show : true,
                title : 'Data View',
                readOnly: true,
                lang : ['Data', 'Close', 'Open'],
                optionToContent: function(opt) {
                    var axisData = opt.xAxis[0].data;
					if (axisData == undefined) {
						axisData = opt.yAxis[0].data;
					}
                    var series = opt.series;
                    var table = '<table style="width:100%;text-align:center"><tbody><tr>'
                                 + '<td>&nbsp;</td>';
                    for (var j = 0; j < series.length; j++) {
                                 table += '<td>' + series[j].name + '</td>'
                    }
		           table += '</tr>';
                    for (var i = 0, l = axisData.length; i < l; i++) {
                        table += '<tr>'
                                 + '<td>' + axisData[i] + '</td>';
			         for (var j = 0; j < series.length; j++) {
					 table += '<td>' + series[j].data[i] + '</td>'
			         }
			    table += '</tr>';
                    }
                    table += '</tbody></table>';

						//alert('k');
					setTimeout(function () {
						$('.t-Region-bodyWrap button').on('click',function (e) {
							//alert('d');
							e.preventDefault();
						});
					}, 500)
                    return table;
                }
            }; //tabledataView
    var pieDataView = {
					title : 'Data View',
					show: true,
					readOnly: true,
					lang : ['Data', 'Close', 'Open'],
					 optionToContent: function(opt) {
						var data = opt.series[0].data;
						var content = [];
						for (var i = 0; i < data.length ;i++) {
							content[i] = ' ' + data[i].name + ': ' + data[i].value;
						}
						setTimeout(function () {
							$('.t-Region-bodyWrap button').on('click',function (e) {
							   e.preventDefault();
							});
						}, 500);
						return opt.series[0].name + ": <br/>" + content.toString();
					}
				};
    var toolboxBasic =  {
        show : true,
        orient: 'horizontal',     // 'horizontal' ¦ 'vertical'
        x: 'right',                // 'center' ¦ 'left' ¦ 'right'
        y: 'top',                  // 'top' ¦ 'bottom' ¦ 'center'
        color : ['#1e90ff','#22bb22','#4b0082','#d2691e'],
        backgroundColor: 'rgba(0,0,0,0)', // Toolbox background color
        borderColor: '#ccc',       // Toolbox border color
        borderWidth: 0,            // Toolbox border line width, units px, defaults to 0 (no border)
        padding: 5,                // Toolbox margins, units px, parties inward default margins to 5,
        showTitle: true,
        feature: {
            mark: {
                show: false,
                title: {mark: 'Mark',markUndo: 'Undo',markClear: 'Clear'},
                lineStyle: {width: 1,color: '#1e90ff',type: 'dashed'}
            }, // mark
            dataZoom: {show: true,title: {dataZoom: 'Zoom',dataZoomReset: 'Reset'}}, //dataZoom
            dataView : tableDataView,
            restore: {show: true,title: 'Restore'},
            saveAsImage: {show: true,title: 'SaveAs',type: 'png',lang: ['Save']}
         } // feature
       }; // toolboxBasic

       var toolboxLine = toolboxBasic;
       toolboxLine.magicType = {
                show: true,
                title: {line: 'line',bar: 'bar',stack: 'stack',tiled: 'tiled',
                    force: 'force',chord: 'chord',pie: 'pie',funnel: 'funnel'},
                type: ['line','bar','stack','tiled']
        }; // magicType

       var toolboxPie = toolboxBasic;
       toolboxPie.dataView = pieDataView;
       toolboxPie.magicType = {
                show: true,
                type: ['pie', 'funnel'],
                option: {
                    funnel: {
                        x: '25%',
                        width: '50%',
                        funnelAlign: 'center',
                        max: 40757
                    }
                }
            };


ec_config_pcoord = function () {
  return {
    backgroundColor: '#333',
    legend: {
        bottom: 30,
        data: [],
        itemGap: 20,
        textStyle: {
            color: '#fff',
            fontSize: 14
        }
    },
    tooltip: {
        padding: 10,
        backgroundColor: '#222',
        borderColor: '#777',
        borderWidth: 1,
        formatter: function (obj) {
            var value = obj[0].value;
            return '<div style="border-bottom: 1px solid rgba(255,255,255,.3); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                + obj[0].seriesName + ' ' + value[0] + 'date：'
                + value[7]
                + '</div>';
        }
    },
    // dataZoom: {
    //     show: true,
    //     orient: 'vertical',
    //     parallelAxisIndex: [0]
    // },
    parallelAxis: [
//        {dim: 0, name: schema[0].text, inverse: true, max: 31, nameLocation: 'start'},
//        {dim: 1, name: schema[1].text},
//        {dim: 2, name: schema[2].text},
//        {dim: 3, name: schema[3].text},
//        {dim: 4, name: schema[4].text},
//        {dim: 5, name: schema[5].text},
//        {dim: 6, name: schema[6].text},
//        {dim: 7, name: schema[7].text,
//        type: 'category', data: ['Excellent', 'good', 'light pollution', 'moderately polluted', 'severe pollution', 'heavily contaminated']}
    ],
    visualMap: {
        show: true,
        min: 0,
        max: 150,
        dimension: 2,
        inRange: {
            color: ['#d94e5d','#eac736','#50a3ba'].reverse(),
            // colorAlpha: [0, 1]
        }
    },
    parallel: {
        left: '5%',
        right: '18%',
        bottom: 100,
        parallelAxisDefault: {
            type: 'value',
            name: 'AQIindex',
            nameLocation: 'end',
            nameGap: 20,
            nameTextStyle: {
                color: '#fff',
                fontSize: 12
            },
            axisLine: {
                lineStyle: {
                    color: '#aaa'
                }
            },
            axisTick: {
                lineStyle: {
                    color: '#777'
                }
            },
            splitLine: {
                show: false
            },
            axisLabel: {
                textStyle: {
                    color: '#fff'
                }
            }
        }
    },
    series: [],
    series_def: {
            name: 'SeriesName',
            type: 'parallel',
            lineStyle: lineStyle,
            data: []
        }
    };
}

    setOptions();
    return {
        eChartOptions: eChartOptions,
        setOptions: setOptions
    };
})();
