import {util} from './util';
export var vendor;

export async function load(k, obj, data, full_data) {
    var chart, theme, first_load;
    vendor = rxds.vendor;
    G2.track ( false );
    first_load = false;

    theme=rxds.app.config.g2_theme?rxds.app.config.g2_theme:'default';
    
    G2.Global.setTheme(theme);
    
    if (!obj.chart) {
       $("#g2"+k)[0].innerHTML="<div></div>";
       chart = new G2.Chart({
        container: "g2" + k,
        forceFit : true ,
        height: Number(obj.config.height)*window.innerHeight/100 ,
        padding : [ 20 , 20 , 95 , 80 ]
      });
      obj.chart = chart;
      first_load = true;
    } else {
        chart = obj.chart;
        chart.clear();
    }
    if (!obj.filters) obj.filters = [];

    var data_binding = util.data_bind(obj);
    var chart_data=util.data_transform(obj, data, data_binding, this);
    var widget_config=util.get_widget_config(obj);

    if (!widget_config) {
      console.log("No configuration for this widget " + obj.config.title); return;
    }
    if (!widget_config.match(/chart.source/))
         chart.source(chart_data);
    var config_fn=new Function('chart','data','db','rxds', 'obj', widget_config);
    config_fn(chart,chart_data,data_binding, this, obj);

    chart.render();
    // if  empty
    if (data.length <= 0) {
        $("#g2"+k)[0].innerHTML="<div class='ui center aligned segment'>No Data returned for this Selection</div>";
        obj.chart = null;
    }

  //code to add download btn for G2 charts. This code takes a snapshot of the chart and starts the download.
  if (first_load && data.length) {
      //$("#g2" + k).prepend('<a style="position: relative;float: right;margin-right: 10px;z-index: 1;" class="g2-download-icon" href="javascript:void();"><i class="download icon"></i></a>');
      $("#g2" + k).prepend('<a style="position: relative;float: right;margin-right: 10px;z-index: 1;" class="g2-download-icon"><i class="download icon"></i></a>');
      $("#g2" + k +' .g2-download-icon').on('click', function(){
         //this.href= $("#g2" + k +' canvas')[0].toDataURL();
         //this.download = "download.png";
	      //rxds.page_controls[k].chart.downloadImage();
		this.href = "javascript:void(0);"; //reset image dataurl
		let isDarkMode = (localStorage.getItem('mode') == 'dark')? true : false; //set dark/light mode status

		let canvas = rxds.page_controls[k].chart._attrs.canvas._cfg.canvasDOM;
		let context = canvas.getContext('2d');
		let w = canvas.width;
		let h = canvas.height;
		let data;
		data = context.getImageData(0, 0, w, h);
		var compositeOperation = context.globalCompositeOperation;
		context.globalCompositeOperation = "destination-over";
		if(!isDarkMode){
		  context.fillStyle = 'rgb(255, 255, 255)'; //set white bg 
		}
		else{
		  context.fillStyle = 'rgb(36, 36, 36)'; //set dark bg            
		}
		context.fillRect(0,0,w,h);
		this.href= $("#g2" + k +' canvas')[0].toDataURL(); //set href imagedataurl
		var downloadName = $(this).parents(".ui.segments.raised").find(".item-header h5 span").text().trim();
		this.download = downloadName+".png"; //download image
		context.clearRect (0,0,w,h); //reset bg
		context.putImageData(data, 0,0); //put original image back 
		context.globalCompositeOperation = compositeOperation; 
      });
      //end
      
      //code to add a tooltip on the above created download btn. Tooltip gets created on mouseover and destroyed on mouseout.
      $("#g2" + k +' .g2-download-icon').on('mouseenter', function(e){
          var top = ($(this).position().top + 25) + 'px';
          var left = ($(this).position().left - 25) + 'px';
          $("#g2" + k).append('<span class="g2-download-tooltip" style="text-align: center;font-size: 12px;color: #0099dc;position:absolute;top:'+top+';left:'+left+'">Download\nImage</span>');
      });
      $("#g2" + k +' .g2-download-icon').on('mouseleave', function(){
         $('.g2-download-tooltip').remove();
      });
      //end

  }    
    if(obj.config.flip_report == "Y")  util.toggleDT(k,obj, data, full_data);
    
      
    if(obj.config.annotate == "Y") util.load_annotation_modal(k,obj);
         

}

export function get(k,obj) {
   if (obj.filters) 
       return obj.filters.join('|');  
   else 
       return '';
}

export function set(k,obj,v) {
   obj.filters=v.split(/\|/);
}


export async function refresh(k,obj, data){
  var tabid = "table#" + $("#"+k).data("id");     
           console.log("Refresh DT",data);
 //       loadDataTable(tabid,data);
           console.log('Need to load report ' + k);
}

export async function repaint(k,obj, data){
     obj.chart.render();
}

export function reset_filter(k,obj) {
    $("#click"+k).hide();
    repaint(k,obj);
    rxds.load_children(obj.child_regions); 
}

export function toggleSelection(source,obj,db,chart,data) {
  var group = source.data._origin[db.x_axis]
  if (obj.filters.indexOf(group) === -1)
    obj.filters.push(group)
  else 
    obj.filters.splice(obj.filters.indexOf(group),1);
  if (obj.filters.length > 0) {
    const r=obj.region.region_id;
    $("#selectregion"+r).html(obj.filters.join());
    $("#clickregion"+r).show();
  }
  else {
    const r=obj.region.region_id;
    $("#clickregion"+r).hide();
  }
  rxds.load_children(obj.child_regions); 
}



export function registerPoint() {
  const Shape = G2.Shape;
  // 自定义Shape 部分
  Shape.registerShape('point', 'pointer', {
    drawShape(cfg, group) {
      let point = cfg.points[0]; // 获取第一个标记点
      point = this.parsePoint(point);
      const center = this.parsePoint({ // 获取极坐标系下画布中心点
        x: 0,
        y: 0
      });
      // 绘制指针
      group.addShape('line', {
        attrs:  {
          x1: center.x,
          y1: center.y,
          x2: point.x,
          y2: point.y + 15,
          stroke: '#8c8c8c',
          lineWidth: 5,
          lineCap: 'round'
        }
      });
      return group.addShape('circle', {
        attrs: {
          x: center.x,
          y: center.y,
          r: 9.75,
          stroke: '#8c8c8c',
          lineWidth: 4.5,
          fill: '#fff'
        }
      });
    }
  });
} //registerPoint

export function register_boundary() {
  const Shape = G2.Shape;
  const Util = G2.Util;
  Shape.registerShape('polygon', 'boundary-polygon', {
    draw(cfg, container) {
      if (!Util.isEmpty(cfg.points)) {
        const attrs = {
          stroke: '#fff',
          lineWidth: 1,
          fill: cfg.color,
          fillOpacity: cfg.opacity
        };
        const points = cfg.points;
        const path = [
          [ 'M', points[0].x, points[0].y ],
          [ 'L', points[1].x, points[1].y ],
          [ 'L', points[2].x, points[2].y ],
          [ 'L', points[3].x, points[3].y ],
          [ 'Z' ]
        ];
        attrs.path = this.parsePath(path);
        const polygon = container.addShape('path', {
          attrs
        });
        if (cfg.origin._origin.last_week_flag) {
          const linePath = [
            [ 'M', points[2].x, points[2].y ],
            [ 'L', points[3].x, points[3].y ],
          ];
          // 最后一周的多边形添加右侧边框
          container.addShape('path', {
            zIndex: 1,
            attrs: {
              path: this.parsePath(linePath),
              lineWidth: 1,
              stroke: '#404040'
            }
          });
          if (cfg.origin._origin.last_day_flag) {
            container.addShape('path', {
              zIndex: 1,
              attrs: {
                path: this.parsePath([
                  [ 'M', points[1].x, points[1].y ],
                  [ 'L', points[2].x, points[2].y ],
                ]),
                lineWidth: 1,
                stroke: '#404040'
              }
            });
          }
        }
        container.sort();
        return polygon;
      }
    }
  });
}
