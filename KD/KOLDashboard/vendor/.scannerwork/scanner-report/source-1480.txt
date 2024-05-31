import {util} from './util';

export async function load(k, obj, data, full_data) {
      var db = {}, chart_data, config, theme;
      var pconfig = obj.config;
      db=util.data_bind(obj);
      theme=rxds.app.config.echart_theme?rxds.app.config.echart_theme:'macarons';
      config = {}
      chart_data = (data.chartdata === undefined)?data:data.chartdata;

      var chart_data=util.data_transform(obj, chart_data, db, this);

      if (!obj.filters) {obj.filters = [];}
      if (!obj.secondary_filters) {obj.secondary_filters = [];}

      if (!db.theme) db.theme = theme

      $("#echart"+k).height(Number(obj.config.height)*window.innerHeight/100);
      if (obj.chart) obj.chart.dispose();
      

      var myChart = echarts.init(document.getElementById("echart"+k),db.theme);
      obj.chart = myChart;
      obj.dom=document.getElementById("echart"+k);
      var widget_config=util.get_widget_config(obj);
      if (!widget_config) {
        console.log("No configuration for this widget " + obj.config.title); return;
      }
      

    if (Array.isArray(db.resource_url)) {
      db.resource = []; 
      for (var i=0;i<db.resource_url.length;i++) {
        let res = await fetch(resource_url[i]).then(response => response.text());
        db.resource.push(res);
      }
    }else if (typeof db.resource_url  == "string") {
        db.resource = await fetch(db.resource_url).then(response => response.text());
    }
    var config_fn=new Function('data','db','rxds','obj','config','chart', widget_config);
    try {
    config_fn(chart_data,db, this, obj, config,myChart);
    } catch(e) {
      console.log("Error with Config script in chart " + obj.config.title);
      console.log(e);
    }
    obj.options = config;

    if (!widget_config.match(/chart.setOption/)) {
        if (config.height) {$("#echart"+k).height(config.height);myChart.resize();}

        try {myChart.setOption(config);}
        catch(e) {console.log("Error loading chart" + k); console.log(e);console.log(obj);console.log(config);}
        myChart.hideLoading();
        myChart.resize();
     }
      $(window).resize(function() {
        obj.chart.resize();
      });
    
    myChart.on('legendselectchanged', function (params) {
        obj.selectedLegend = params.selected;
        obj.chart.resize();
    });

     if (config.events) { /* Hook up events if specified */
        const e=Object.keys(config.events);
        e.forEach(v=>{
          myChart.on(v,config.events[v]);
        });  
        myChart.on('rendered',function(){
           if (obj.highlight) {
            var d=obj.options.series[0].data;
            //udhay - updated this section to support secondary filters highlighting support
            var highlight_filters = (obj.highlight_secondary_filters ? "secondary_filters" : "filters");
            obj[highlight_filters].forEach(v=>{
               var i =d.findIndex(s=>s.name==v);
               if (i>=0)
                 obj.chart.dispatchAction({
                  type: 'highlight',
                  seriesIndex: 0,
                  dataIndex: i
              });
            });
          }
        });
     }


     if (db.chart_type && db.chart_type.match(/dataset/)){
          myChart.on('updateAxisPointer', function (event) {
            var xAxisInfo = event.axesInfo[0];
            if (xAxisInfo) {
                var dimension = xAxisInfo.value + 1;
                myChart.setOption({
                    series: {
                        id: 'pie',
                        label: {
                            formatter: '{b}: {@[' + dimension + ']} ({d}%)'
                        },
                        encode: {
                            value: dimension,
                            tooltip: dimension
                        }
                    }
                });
            }
        });
    }
    
      // if  empty
      if (data.length <= 0) {
          var no_data_mes = ((rxds.app.config.language === "JP") ? "この選択に対してデータは返されませんでした" : "No Data returned for this Selection");
          console.log("no_data_mes",no_data_mes)
          //$("#echart"+k)[0].innerHTML="<div class='ui center aligned segment'>No Data returned for this Selection</div>";
          $("#echart"+k)[0].innerHTML="<div class='ui center aligned segment'>" + no_data_mes + "</div>";
      }
    
      //if the flip report is set to Y
      
      if(pconfig.flip_report == "Y") {
           util.toggleDT(k,obj, data, full_data);
        } 
        
      if(pconfig.annotate == "Y") {
           util.load_annotation_modal(k,obj);
        } 
  

} // load


export function get(k,obj) {
   if (obj.filters) 
       return obj.filters.join('|');  
   else 
       return '';
}

export function reset_filter(k,obj) {
    $("#click"+k).hide();
    obj.chart.resize();
    rxds.load_children(obj.child_regions); 
}

export function get_param(p) {
  return rxds.m.get_param(p);
}

export function toggleSelection(group,obj,db,data,highlight,param) {
  var highlight_type;
  //udhay - updated this section to support secondary filters highlighting support
  var is_there_sec_filter = (param && param.secondary_filters);
  if (obj.filters.indexOf(group) === -1) {
    obj.filters.push(group); 
    if(is_there_sec_filter)  obj.secondary_filters.push(param.name);
  } else { 
    obj.filters.splice(obj.filters.indexOf(group),1);
    if(is_there_sec_filter)   obj.secondary_filters.splice(obj.secondary_filters.indexOf(param.name),1);
  }
  
  if (obj.filters.length > 0) {
    const r=obj.region.region_id;
    $("#selectregion"+r).html(obj.filters.join());
    $("#clickregion"+r).show();
  }
  else {
    const r=obj.region.region_id;
    $("#clickregion"+r).hide();
  }
  
  if (highlight) obj.highlight=true;
  if(is_there_sec_filter)   obj.highlight_secondary_filters= true;
  console.log(obj.filters);
  const opt=obj.chart.getOption();
  obj.chart.clear();
  obj.chart.setOption(opt);
  rxds.load_children(obj.child_regions); 
  //setTimeout(function(){console.log(obj.filters);obj.chart.resize();console.log(obj.chart)}, 3000);
}


export function getSeries(data,db,chart_type){
  var s={}, lo={}, la=[], l={},min,max;
  if (Array.isArray(db.y_axis)) {
    const empty_y=db.y_axis.map(s=>0);
    data.forEach((v)=> {
        var series=db.series?v[db.series]:"series";
        const x=v[db.x_axis];
        const y=db.y_axis.map(s=>v[s]);
        if (!s[series]) {s[series]={}}
        if (!l[x]) {l[x]=true;la.push(x);}
        s[series][x]=y;
    });
    var legend=Object.keys(s);
    var series;
      series=legend.map((v)=>{
          return {name:v,type:chart_type,data:
         la.map((l)=>{return s[v][l]?s[v][l]:empty_y})}});
     return {legend:legend,series:series,categories:la}
  } else if (Array.isArray(db.series)) {
      var series=[];
      db.series.forEach((v,i)=> {
          s={name:v,type:chart_type};
          if (db[v]) $.extend(s,db[v]);
          s.data=data.map(d=>d[v]);
          s.min = Math.min( ...s.data );
          s.max = Math.max( ...s.data );
          if (!l.min) {l.min=s.min;l.max=s.max}
          if(l.min>s.min) l.min=s.min;
          if(l.max<s.min) l.max=s.max;
          series.push(s);
        }); 
    var categories=data.map(d=>d[db.x_axis]);    
    var legend=series.map(v=>v.name);
    return {legend:legend,series:series,categories:categories,limits:l}
  }
  else {
    data.forEach((v)=> {
        const series=db.series?v[db.series]:"series";
        const x=v[db.x_axis],y=v[db.y_axis];
        if (!s[series]) {s[series]={min:y,max:y}}
        if (!l[x]) {l[x]={min:y,max:y};la.push(x);}
        s[series][x]=y;
        if (s[series].min >y) s[series].min = y;
        if (s[series].max < y) s[series].max = y;
        if (l[x].min > y) l[x].min = y;
        if (l[x].max < y) l[x].max = y;
    });
  
    var legend=Object.keys(s);
    var series;
    if (legend.length > 0) {min=s[legend[0]].min;max=s[legend[0]].max;}
    if (chart_type=="radar") {
        series=legend.map((v)=>{return{name:v,min:s[v].min,max:s[v].max,value:
           la.map((l)=>{return s[v][l]?s[v][l]:0})}});
       return {legend:legend,series:series,categories:la,
               limits:la.map(v=>{return {"name":v,"max":l[v].max}})}
    }       
    else {
        series=legend.map((v)=>{
            if (s[v].max>max) max=s[v].max;
            if (s[v].min<max) min=s[v].min;
            return{name:v,type:chart_type,min:s[v].min,max:s[v].max,data:
           la.map((l)=>{return s[v][l]?s[v][l]:0})}});
       return {legend:legend,series:series,categories:la,limits:l,min:min,max:max}
    }
  }
}

