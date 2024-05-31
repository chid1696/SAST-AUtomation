var script = document.createElement('script');
script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';

/* var semanticScript = document.createElement('script');
semanticScript.src = 'https://cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.js';

var semanticLink = document.createElement('script');
semanticLink.rel = 'stylesheet';
semanticLink.href = 'https://cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.css' */

document.head.appendChild(script);
/*  document.head.appendChild(semanticScript); 
document.head.appendChild(semanticLink); */

async function captureimage(elements) {
  const backgroundColor = "#ffffff"; // white background color
  const scale = 2; // scaling factor for higher resolution

  return await new Promise((resolve, reject) => {
    try {
      document.body.scrollTop = document.documentElement.scrollTop = 0;
      const element = document.querySelector(`[id='${elements}']`);
      
      if (!element) {
        throw new Error("Element not found");
      }

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      // Set canvas dimensions to match the element's dimensions
      const bounds = element.getBoundingClientRect();
      canvas.width = bounds.width * scale;
      canvas.height = bounds.height * scale;

      // Fill canvas with white background
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Wait for 500 milliseconds to let the element fully load and be visible
				// setTimeout(() => {
				html2canvas(element, { canvas, scale, backgroundColor }).then(async (canvas) => {
					const dataURL = canvas.toDataURL("image/png", 1); // highest quality
					resolve(dataURL);
				}).catch((error) => {
					reject(error);
				});
				// }, 5000);
     

    } catch (error) {
      reject(error);

    }
  });
}

async function getechart(data, excluderegion) {
  var promises = [];
  var elements = $('*[id*=echartregion]');

  for (var i = 0; i < elements.length; i++) {
    var element = elements[i];
    var chart = echarts.getInstanceByDom(document.getElementById(element.id));
    var id = eval('rxds.page_controls.' + element.id.replace('echart', ''));
    console.log('check id---', id)
    var region = {
      rxdsid: element.id.replace('echart', ''),
      rxdstitle: null,
      rxdshtml: null,
      rxdscolor: null,
      rxdsdata: null,
      rxdsimage: null,
    };

    try{
      region.rxdstitle = id.config.title;
    }
    catch{
      region.rxdstitle = "N/A"
    }

    try {
      region.rxdshtml = JSON.stringify(chart.getOption());
    } catch {
      region.rxdshtml = null;
    }

    try {
      region.rxdscolor = Object.entries(chart._chartsMap)[0][1]._data._itemVisuals;
    } catch {
      region.rxdscolor = null;
      
    }

    if (region.rxdscolor==null)
    {
        try 
        {
            region.rxdscolor= await chart.getOption().color.map((color) => {
                return { color: color }});
        }

        catch
        {
            region.rxdscolor=null;
        }

    }
    try {
      region.rxdsdata = JSON.stringify(rxds.m.query_tracker[id.query_id].data.result);
    } catch {
      region.rxdsdata = null;
    }

    try
    {
      region.rxdsseq = id.region.region_seq;
    }
    catch
    {
      region.rxdsseq = null;
    }
    
    try {
      region.rxdsimage = await chart.getDataURL({
        pixelRatio: 2
      });
     if (region.rxdsimage.length < 10 )
     {
        try
        {
        await $('.menu .item').tab('change tab', element.id.replace('echart', ''))
        await echarttab(element.id.replace('echart', ''), element.id).then(dataURL => {region.rxdsimage =  dataURL});       
        }
        
        catch
        {
            region.rxdsimage = null;
        }
     }
      console.log('echart work')
    } catch {
      console.log('echart not work')
      region.rxdsimage = null;
    }

    
    async function echarttab(tabId, chartId) {
        return new Promise((resolve, reject) => {
          $('.menu .item').tab('change tab', tabId);
          setTimeout(() => {
            const chart = echarts.getInstanceByDom(document.getElementById(chartId));
            if (chart) {
              chart.resize();
              console.log('dataURL-->', chart)
              console.log('getdataURL-->', chart.getDataURL({ pixelRatio: 4 }))
              let dataURL;
              setTimeout(dataURL = chart.getDataURL({ pixelRatio: 4 }),2000)
              dataURL = chart.getDataURL({ pixelRatio: 4 })
              console.log('final url', dataURL)
              resolve(dataURL);
            } else {
              console.log('error dataURL')
              reject(new Error(`Chart with ID ${chartId} not found.`));
            }
          }, 5000);
        });
      }
      
      // check if the series type is 'map'
         
        
        try
        {
         
          region.rxdsgeojson =chart.getOption().series[0].map+"rxdssplit"+ JSON.stringify(echarts.getMap(chart.getOption().series[chart.getOption().series.findIndex(series => series.type === 'map')].map).geoJson);

        }
        catch
        {
           region.rxdsgeojson = null;
        }
       
        try{region.rxdsgeojsonspecialareas= JSON.stringify(echarts.getMap(chart.getOption().series[chart.getOption().series.findIndex(series => series.type === 'map')].map).specialAreas)}catch{region.rxdsgeojsonspecialareas=null}

      

    excluderegion.push(region.rxdsid.toString());
    if (region.rxdsimage == null && region.rxdshtml == null) {
      continue;
    }
    if(region.rxdsdata !== undefined && region.rxdstitle !== null){
      promises.push(Promise.resolve(region));
    console.log('promises---', promises)
    }
    
  }

  return Promise.all(promises).then((regions) => {
    data.push(...regions);
    return data;
  });
}

async function changeTab(tabId) {
    await new Promise(resolve => $('.menu .item').tab({
      onVisible: () => resolve()
    }).tab('change tab', tabId));
  }
  
async function gettable(data, excluderegion) {
  const promises = $('*[id*=GRID]')
    .filter((i, el) => !el.id.includes("region") && el.id.includes("_first"))
    .map(async (i, el) => {
      const id = eval(`rxds.page_controls.region${el.id.replace('GRID', '').replace('_first', '')}`);
      const region = {
        rxdsid: `region${el.id.replace('GRID', '').replace('_first', '')}`,
        rxdstitle: eval(`rxds.page_controls.region${el.id.replace('GRID', '').replace('_first', '')}.config.title`),
        rxdshtml: null,
        rxdsdata: null,
        rxdsimage: null
      };

      try {
        region.rxdsdata = JSON.stringify(rxds.m.query_tracker[id.query_id].data.result.res.table || rxds.m.query_tracker[id.query_id].data.result);
      } catch {
        region.rxdsdata = null;
      }

      try {
        region.rxdsimage = await captureimage(el.id);
      } catch {
        region.rxdsimage = null;
      }

      try{
        region.rxdsseq =  eval(`rxds.page_controls.region${el.id.replace('GRID', '').replace('_first', '')}.region.region_seq`);
      }
      catch
      {
        region.rxdsseq = null;
      }

      

      excluderegion.push(region.rxdsid.toString());
      return region;
    }).get();

  const regions = await Promise.all(promises);
  data.push(...regions.filter(r => r !== undefined));
  return excluderegion;
}

async function getregion(data, excluderegion) {
  const promises = [];
  
var excludeId = ["region210005883", "region210005646", "region210004055", "region210005009", "region210004962","region210005040","region210004964", "region210004817", "region210004569", "region210006424", "region210006423", "region210003986","region210004817" ] //Karkey - hidden regions

  $("*[id^=region]").each((i, el) => {
    if (!excluderegion.includes(el.id) && el.id.match(/.*region\d+$/) && !excludeId.includes(el.id)) {
      const region = {
        rxdsid: el.id,
        rxdstitle: null,
        rxdsimage: null,
      };
      
      try {
        const lastRefreshedDate = rxds.m.get_param("DATE");
        let title = eval(`rxds.page_controls.${el.id}.config.title`);
        title = title.replace(/<\/?b>/g, ''); 
        region.rxdstitle = title.replace("{{DATE}}",`${lastRefreshedDate}`);
        console.log("TITLE IS:", region.rxdstitle);
     } catch {
        region.rxdstitle = null;
     }

     /* try {
        const lastRefreshedDate = rxds.m.get_param("DATE");
        region.rxdstitle = eval(
          `rxds.page_controls.${el.id}.config.title`
        ).replace("{{DATE}}", `${lastRefreshedDate}`);
        console.log("TITLE IS:", region.rxdstitle);
      } catch {
        region.rxdstitle = null;
      }*/

      try {
        region.rxdsseq = eval(`rxds.page_controls.${el.id}.region.region_seq`);
      } catch {
        region.rxdsseq = null;
      }
      
      if(rxds.app.page.config.name === "Cohort Reports"){
        console.log("The Page Is Cohort Reports")
        changeTab(el.id);
      }

      const promise = captureimage(el.id)
        .then((image) => {
          region.rxdsimage = image;
        })
        .catch((error) => {
          region.rxdsimage = null;
          console.error(error);
        });

      promises.push(promise);
      data.push(region);
      excluderegion.push(el.id.toString());
    }
  });

  await Promise.all(promises);

  // filter out regions where rxdsimage and rxdsdata are both null
  const filteredData = data.filter(
    (region) =>
      (region.rxdsimage !== null && region.rxdsdata !== null) ||
      region.rxdsimage == "data:,"
  );

  return {
    data: filteredData,
    excluderegion: excluderegion,
  };
}


/*let loader = document.createElement('div')
$(loader).addClass('ui icon message myPopUp')
$(loader).html(' <i class="notched circle loading icon"></i><div class="content"><div class="header">Preparing Your Presentation</div><p>Please wait, we are currently compiling and organizing your content for optimal viewing.</p></div>')
$('.ui.icon.message.myPopUp').attr('id', 'myPopUp')

function showPopUp(){
  $(loader).css('margin-top','60px')
   $('body').prepend(loader)
}
function hidePopUp(){
 
  let dispatch = document.getElementsByClassName('myPopUp')
      $(dispatch).remove()
} */

export async function pptrun() {
 /* showPopUp()  */
  console.log('PPT running')
    try {
      const data = [];
      const excluderegion = [];
      
      $('#overlayer, .preloader.svg-loader, .preloader.p-txt').show(); //karkey loader mask
			$('#overlayer').text("Please wait, we are currently compiling and organizing your content for optimal viewing.");
			$('#overlayer').css({
				'display': 'flex',
				'align-items': 'center',
				'justify-content': 'center',
				'height': '100vh',
				'font-size': '18px',
				'color': '#fff'
			});
			
      await getechart(data, excluderegion);
      await gettable(data, excluderegion);
      await getregion(data, excluderegion);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const excludeData = ["region520006593", "region210006423","region210006424", "region210004817", "region210006423", "region210006424"];
      const newdata = data.filter(item => !excludeData.includes(item.rxdsid));
      
      newdata.sort(function(a,b){return a.rxdsseq - b.rxdsseq})
      console.log('newData--', newdata);
      JSON.stringify(newdata)
      await senddata(newdata, excluderegion);   

     
    } catch (error) {
      console.error(error);
    }
}

 async function senddata(data) {
    try {
      const sanitizedData = JSON.stringify(data);
  
      const form = new FormData();
      form.append("html", "{region:" + sanitizedData + "}");
      
      $('#overlayer, .preloader.svg-loader, .preloader.p-txt').show(); //karkey for loader mask
			$('#overlayer').text("Please wait, we are currently compiling and organizing your content for optimal viewing.");
			$('#overlayer').css({
				'display': 'flex',
				'align-items': 'center',
				'justify-content': 'center',
				'height': '100vh',
				'font-size': '18px',
				'color': '#fff'
			});
  
      // showing the progress for the ppt download Karthik
     /* var progressBar = $('#progressBar .bar');
      var progressText = $('#progressBar .progress-text');
      var maxProgress = 100; // Maximum progress percentage
      var progress = 0;
      var intervals;
      var interval = setInterval(function() {
        progress += 4;
        if (progress <= maxProgress) {
            progressBar.css('width', progress + '%');
            progressText.text(progress + '%')
        } else {
            clearInterval(interval);
            progressText.text(''); // Clear the percentage text
        }
      }, 1000);  */
    
      const response = await fetch("https://apollodev-kdb.syneoshealth.com/pptgen/Createpowerpoint/Uploadfile", {
         method: "POST",
         body: form,
      });
      
      if (response.ok) {
        $('#overlayer, .preloader.svg-loader, .preloader.p-txt').hide(); //karkey
				$('#overlayer').text(""); 
				
       /*  progress = 100;
        progressBar.css('width', progress + '%');
        $('#progressBar .message').text('Download completed!');
        clearInterval(interval); */
      } 
  
      const blob = await response.blob();
      
     /* if (blob && typeof(blob) === "object") {
        $('#downloadModal').modal('hide');
        hidePopUp()
      } */
      
      console.log("1234 BLOB IS : ", blob);
      const url = URL.createObjectURL(blob);
  
      const a = document.createElement("a");
      a.href = url;
      a.download = rxds.app.app.name + ".pptx";
      document.body.append(a);
      a.click();
      a.remove();
  
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    }
}



//Open the modal by the pptbeta button click

/* $(document).ready(function() {
  $('#pptbeta').click(function() {
    $('#downloadModal').modal('show'); // Show the modal
    resetProgressBar();
  });
  
   $('#modalClose').click(function() {
      $('#downloadModal').modal('hide'); // Hide the modal
      resetProgressBar();
   });
});


function resetProgressBar() {
    $('#progressBar .bar').css('width', '0');
    $('#progressBar .progress-text').text('0%');
} */












  


  
    
      
      