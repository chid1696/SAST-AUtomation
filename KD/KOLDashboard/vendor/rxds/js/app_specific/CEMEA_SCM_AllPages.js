//Function for downloading power point
function generate_ppt(include_data) {
  debugger;
  var isDarkMode = localStorage.getItem("mode") == "dark" ? true : false;
  var noDataLocMessage = "No data returned for this selection";
  if (rxds.app.config.language === "JP")
    noDataLocMessage = "この選択に対してデータは返されませんでした";

  //showing all charts
  var pc = rxds.page_controls;
  Object.keys(pc)
    .filter((v) => pc[v].control_type === "Tabs Container")
    .forEach((v) => {
      $("#" + v + " .ui.bottom.attached.tab.segment.active").addClass(
        "keep-me-visible"
      );
      $("#" + v + " .ui.bottom.attached.tab.segment")
        .addClass("active")
        .each(function () {
          let currTabArea = $(this).data("id");
          if (rxds.page_controls[currTabArea] && rxds.page_controls[currTabArea].control_type === "Report") {
            window.dispatchEvent(new Event("resize"));
            rxds.page_controls[currTabArea].table.columns.adjust().draw();
          }
        });
    });

  //create actual ppt object
  function createPPT() {
    var pptx = new PptxGenJS();
    pptx.setLayout("LAYOUT_WIDE");
    pptx.defineSlideMaster({
      title: "MASTER_SLIDE",
      bkgd: "FFFFFF",
      objects: [
        {
          text: {
            text: "RxDataScience Inc.   |",
            options: {
              x: 10.8,
              y: 0.1,
              fontFace: "Helvetica",
              fontSize: 14,
              color: "1A3C65"
            }
          }
        },
        {
          text: {
            text:
              "Legal Notice: The material located in this file is highly sensitive. Do not forward.",
            options: {
              x: 3.9,
              y: 7.2,
              fontFace: "Helvetica",
              fontSize: 10,
              color: "1A3C65"
            }
          }
        },
        {
          image: {
            x: 11.2,
            y: 6.9,
            w: 1.83,
            h: 0.45,
            path: rxds.vendor + "/rxds/img/rxdsdark2.png"
          }
        }
      ],
      slideNumber: {
        x: 12.8,
        y: 0.1,
        fontFace: "Helvetica",
        fontSize: 14,
        color: "1A3C65"
      }
    });
    var slide = pptx.addNewSlide("MASTER_SLIDE");
    /*
        slide.addText(rxds.app.app.name + ' ' + rxds.app.page.config.title, { x:2.4, y:3.6, fontSize:34, color:'1A3C65', fontFace:'Calibri(Body)' });
        slide.addText(rxds.app.app.name + ' ' + rxds.app.page.page.parentmenu.trim() + ' ' + rxds.app.page.config.title, { x:2.4, y:3.6, fontSize:34, color:'1A3C65', fontFace:'Calibri(Body)' });
        */

    var app_name = rxds.app.page.config.title.includes(rxds.app.app.name)
      ? ""
      : rxds.app.app.name;
    slide.addText(
      app_name +
        " " +
        rxds.app.page.page.parentmenu.trim() +
        " " +
        rxds.app.page.config.title,
      {
        x: 2.4,
        y: 3.6,
        fontSize: 34,
        color: "1A3C65",
        fontFace: "Calibri(Body)"
      }
    );

    /* 
      @author neha 
      This code is commented to replace it sorting function using region.region_seq object. Please note that not all pages have that available. Please donot push this code to prod without proper QA. 
      In case of issues, uncomment this block.
      
      Object.keys(pc).filter(v=>(pc[v].control_type==="Chart eChart")||(pc[v].control_type==="Chart G2")||(pc[v].control_type==="Plugin")||(pc[v].control_type==="Report" && pc[v].config.include_in_ppt === "Y")||(pc[v].control_type==="Report" && pc[v].config.include_in_ppt === "N" && include_data)||(pc[v].control_type==="Form" && pc[v].config.include_in_ppt === "Y")).forEach(v=>{
        
        */
    /* Sort code */
    var arrListOfRegs = Object.keys(pc).filter(
      (v) =>
        pc[v].control_type === "Chart eChart" ||
        pc[v].control_type === "Chart G2" ||
        ( pc[v].control_type === "Plugin" &&
            pc[v].config.include_in_ppt !== "N" ) ||
        (pc[v].control_type === "Report" &&
          pc[v].config.include_in_ppt === "Y") ||
        (pc[v].control_type === "Report" &&
          pc[v].config.include_in_ppt === "N" &&
          include_data) ||
        (pc[v].control_type === "Form" && pc[v].config.include_in_ppt === "Y")
    );

    function regionSort(listOfReg) {
      var done = false;
      while (!done) {
        done = true;
        for (var i = 1; i < listOfReg.length; i += 1) {
          if (
            pc[listOfReg[i - 1]].region.region_seq >
            pc[listOfReg[i]].region.region_seq
          ) {
            done = false;
            var tmp = listOfReg[i - 1];
            listOfReg[i - 1] = listOfReg[i];
            listOfReg[i] = tmp;
          }
        }
      }

      arrListOfRegs = listOfReg;
    }

    if (pc[arrListOfRegs[0]].region && pc[arrListOfRegs[0]].region.region_seq) {
      regionSort(arrListOfRegs);
    }
    arrListOfRegs.forEach((v) => {
      /* end */
      try {
        var title, imgHeight, imgWidth, img, qid, res, da;
        var imgX = 1.1;
        var imgY = 1.9;
        //to hide scatter echarts with animation
        if (pc[v].options && pc[v].options.baseOption) return;
        if (pc[v].control_type === "Chart G2") {
          title = $("#" + v)
            .parent()
            .find(".ui.menu .ui.header")
            .text(); //pc[v].config.title;
  
          if (title === "") {
            title = $("#" + v)
              .parent()
              .parent()
              .attr("data-tab-title");
              //.attr("data-tab");
          }
          if(!title) {
            title = pc[v].config.title;
          }
          if (title.includes("{")) {
            title = rxds.replace_params(title);
          }
          title = title.replace(/\s+/g, " ").trim();
  
          if (
            $("#" + v)
              .parent()
              .is(".one,.two,.three,.four,.five,.six")
          ) {
            imgHeight = pc[v].chart._attrs.height / 60;
            imgWidth = pc[v].chart._attrs.width / 60;
          } else if (
            $("#" + v)
              .parent()
              .is(".seven,.eight,.nine,.ten,.eleven,.twelve")
          ) {
            imgHeight = pc[v].chart._attrs.height / 80;
            imgWidth = pc[v].chart._attrs.width / 80;
            if (imgHeight > 5.5) {
              imgHeight = pc[v].chart._attrs.height / 110;
              imgWidth = pc[v].chart._attrs.width / 110;
            }
          } else {
            imgHeight = 5; //chart.getHeight()/45;
            imgWidth = 14.34; //chart.getWidth()/45;
            imgX = -0.7;
          }
          if (!isDarkMode) {
            img = pc[v].chart.toDataURL();
          } else {
            let canvas = pc[v].chart._attrs.canvas._cfg.canvasDOM;
            let context = canvas.getContext("2d");
            var w = canvas.width;
            var h = canvas.height;
            var data;
            data = context.getImageData(0, 0, w, h);
            var compositeOperation = context.globalCompositeOperation;
            context.globalCompositeOperation = "destination-over";
            context.fillStyle = "rgb(36, 36, 36)";
            context.fillRect(0, 0, w, h);
  
            img = pc[v].chart.toDataURL();
  
            context.clearRect(0, 0, w, h);
            context.putImageData(data, 0, 0);
            context.globalCompositeOperation = compositeOperation;
          }
          qid = pc[v].query_id;
          res = rxds.m.query_tracker[qid].data.result;
          da = [];
        } else if (pc[v].control_type === "Plugin") {
          title = $("#" + v)
            .parent()
            .find(".ui.menu .ui.header")
            .text();
            //.replace(/\s+/g, " ");
  
          //if (title === "") {
          if (!title) {
            title = $("#" + v)
              .parent()
              .parent()
              .attr("data-tab-title");
              //.attr("data-tab");
              //.replace(/\s+/g, " ");
          }
          if(!title) {
            title = pc[v].config.title;
          }
          if (title.includes("{")) {
            title = rxds.replace_params(title);
          }
          title = title.replace(/\s+/g, " ").trim();
  
          img = $(".tempcanvasforppt-" + v)[0].toDataURL();
          imgX = 0;
          imgWidth = 13.33;
          imgHeight = 2;
          
          ///Udhay - to fix the badge resolution issue (especially if the width is less than eight)
          if(["three","four","five","six","seven","eight"].includes(pc[v].config.cols)) {
              imgWidth = 7;
              imgHeight = 5;
          }
          qid = pc[v].query_id;
          res = rxds.m.query_tracker[qid].data.result;
          da = [];
  
          $(".tempcanvasforppt-" + v).detach();
        } else if (pc[v].control_type === "Form") {
          title = "Filter"; //pc[v].config.title;
          img = $(".tempcanvasforppt-" + v)[0].toDataURL();
          imgX = 0;
          imgWidth = 13.33;
          imgHeight = 0.94;
          $(".tempcanvasforppt-" + v).detach();
        } else if (pc[v].control_type === "Report") {
          title = pc[v].config.title;
          title = rxds.replace_params(title);
          var t1 = $("#" + v)
            .parent()
            .prev()
            .text();
          var t2 = $("#" + v)
            .parent()
            .parent()
            .attr("data-tab-title");
          title = t1 ? t1 : t2 ? t2 : title;
  
          if (title === "") {
            title = $("#" + v)
              .parent()
              .parent()
              .attr("data-tab-title");
          }
          if (title.includes("{")) {
            title = rxds.replace_params(title);
          }
          title = title.replace(/\s+/g, " ").trim();
          if(pc[v].table.data().length) {
            img = $(".tempcanvasforppt-" + v)[0].toDataURL();
            imgX = 0.4;
            imgWidth = 9.25;
            imgHeight = 5.3;
          } else {
              var canvasEmpty = document.createElement("canvas");
              canvasEmpty.width = 500;
              canvasEmpty.height = 100;
              var ctx = canvasEmpty.getContext("2d");
              ctx.font = "30px Arial";
              //ctx.fillStyle = 'rgb(256, 256, 256)';
              if (!isDarkMode) {
                //ctx.fillText("No data returned for this selection",25,60);
                ctx.fillText(noDataLocMessage, 25, 60);
              } else {
                ctx.fillStyle = "rgb(36, 36, 36)";
                ctx.fillRect(0, 0, 500, 100);
                ctx.fillStyle = "rgb(256, 256, 256)";
                //ctx.fillText("No data returned for this selection",25,60);
                ctx.fillText(noDataLocMessage, 25, 60);
              }
    
              img = canvasEmpty.toDataURL();
              imgHeight = 1.04;
              imgWidth = 5.21;
              imgX = 1.1;
              imgY = 1.9;
          }
          $(".tempcanvasforppt-" + v).detach();
        } else {
          //echarts
          var chart = pc[v].chart;
          title = $("#" + v)
            .parent()
            .find(".ui.menu .ui.header")
            .text(); //pc[v].config.title;
  
          if (title === "") {
            title = $("#" + v)
              .parent()
              .parent()
              .attr("data-tab-title");
          }
          //title = title.replace(/\xA0*\xA0|\s*\s/g," ");
          if (title.includes("{")) {
            title = rxds.replace_params(title);
          }
          title = title.replace(/\s+/g, " ").trim();
          
          //imgHeight = chart.getHeight();
          //imgWidth = chart.getWidth();
          //var chartType = chart.getOption().series[0].type;
          
          //Udhay - to fix the issue for wordCloud chart
          if(rxds.app.app.branch.match("MASTER|QA|UI")) {
            if(!(pc[v].options.series && pc[v].options.series.constructor === Array && pc[v].options.series[0].type === "wordCloud")) {
                chart.setOption({ animation: false }); // disabling animation so that chart loads immediately
                chart.resize(); // redrawing chart
                chart.setOption({ animation: "auto" }); // resetting animation
            } else {
              chart.setOption({ animation: false }); // disabling animation so that chart loads immediately
              chart.resize(); // redrawing chart
              chart.setOption({ animation: "auto" }); // resetting animation
            }
          } else {
            chart.setOption({ animation: false }); // disabling animation so that chart loads immediately
            chart.resize(); // redrawing chart
            chart.setOption({ animation: "auto" }); // resetting animation
          }
          
          qid = pc[v].query_id;
          res = rxds.m.query_tracker[qid].data.result;
          da = [];
          if (
            $("#" + v)
              .parent()
              .is(".one,.two,.three,.four,.five,.six")
          ) {
            imgHeight = chart.getHeight() / 60;
            imgWidth = chart.getWidth() / 60;
            
            //Udhay - To fix the chart resolution issue (especially if the width is less than eight)
            //if(rxds.app.app.name === "Channel Operations" && rxds.app.page.page.page_title === "Demand Sales Dashboard") {
            if(rxds.app.app.branch.match("MASTER|UI") && rxds.app.app.name === "Channel Operations") {
              let height = chart.getHeight();
              let width = chart.getWidth();
              let i = 150;
              while(!(height/(i-10) > 5.5)) i -= 10;

              imgHeight =  height / i;
              imgWidth = width / i;
            }
          } else if (
            $("#" + v)
              .parent()
              .is(".seven,.eight,.nine,.ten,.eleven,.twelve")
          ) {
            imgHeight = chart.getHeight() / 80;
            imgWidth = chart.getWidth() / 80;
            if (imgHeight > 5.5) {
              imgHeight = chart.getHeight() / 110;
              imgWidth = chart.getWidth() / 110;
            }
            
            //Udhay - to fix the width issue for eChart (especially - when width is set as twelve) (Ex -ClinOps)
            if (pc[v].config.cols === "twelve" && imgHeight > 4.5) {
              imgHeight = chart.getHeight() / 110;
              imgWidth = chart.getWidth() / 110;
            }
          } else {
            imgHeight = 5; //chart.getHeight()/45;
            imgWidth = 14.34; //chart.getWidth()/45;
            imgX = -0.7;
          }
  
          if (!isDarkMode) {
            img = chart.getDataURL({
              pixelRatio: 2,
              backgroundColor: "#fff"
            });
          } else {
            /*let canvas = pc[v].dom.getElementsByTagName('canvas')[0];
              if(canvas){
                let context = canvas.getContext('2d');
                var w = canvas.width;
                var h = canvas.height;
                var data;
                data = context.getImageData(0, 0, w, h);
                var compositeOperation = context.globalCompositeOperation;
                context.globalCompositeOperation = "destination-over";
                context.fillStyle = 'rgb(36, 36, 36)';
                context.fillRect(0,0,w,h);
  
                img=canvas.toDataURL();
  
                context.clearRect (0,0,w,h);
                context.putImageData(data, 0,0);        
                context.globalCompositeOperation = compositeOperation;      
              }
              else{*/
            img = chart.getDataURL({
              pixelRatio: 2,
              backgroundColor: "#444"
            });
            /*}*/
          }
  
          var no_data;
          var kdb_res = rxds.m.query_tracker[pc[v].query_id];
          if(kdb_res && kdb_res.data && (kdb_res.data.result.length === 0))
            no_data = true;
          else  
            no_data = pc[v].options.series.length == 0;
             
          if (!no_data && Array.isArray(pc[v].options.series)) {
            if(Array.isArray(pc[v].options.series[0].data))
              no_data = pc[v].options.series[0].data.length === 0;
            else
              no_data = !pc[v].options.series[0].data;
          }
          //if(pc[v].options.series[0].data.length === 0) {
          //if(pc[v].options.series.length === 0 ||  pc[v].options.series[0].data.length === 0) {
          if (no_data) {
            var canvasEmpty = document.createElement("canvas");
            canvasEmpty.width = 500;
            canvasEmpty.height = 100;
            var ctx = canvasEmpty.getContext("2d");
            ctx.font = "30px Arial";
            //ctx.fillStyle = 'rgb(256, 256, 256)';
            if (!isDarkMode) {
              //ctx.fillText("No data returned for this selection",25,60);
              ctx.fillText(noDataLocMessage, 25, 60);
            } else {
              ctx.fillStyle = "rgb(36, 36, 36)";
              ctx.fillRect(0, 0, 500, 100);
              ctx.fillStyle = "rgb(256, 256, 256)";
              //ctx.fillText("No data returned for this selection",25,60);
              ctx.fillText(noDataLocMessage, 25, 60);
            }
  
            img = canvasEmpty.toDataURL();
            imgHeight = 1.04;
            imgWidth = 5.21;
            imgX = 1.1;
            imgY = 1.9;
          }
        }
        //title = $('#'+v).parent().find('.ui.menu .ui.header').text().trim();
        if (img !== "data:,") {
          //this line makes sure that image data exists
          var slide = pptx.addNewSlide("MASTER_SLIDE");
          slide.addImage({
            data: img,
            x: imgX,
            y: imgY,
            w: imgWidth,
            h: imgHeight
          });
          slide.addText(title, {
            fontFace: "Calibri(Body)",
            fontSize: 38,
            color: "ffffff",
            isTextBox: true,
            shape: pptx.shapes.RECTANGLE,
            align: "l",
            x: 0.4,
            y: 0.5,
            w: 10,
            h: 1.2,
            fill: "1A3C65"
          });
          slide.addText("", {
            shape: pptx.shapes.RIGHT_TRIANGLE,
            x: 9.39,
            y: 0.9,
            w: 1,
            h: 0.8,
            fill: "00B0F0",
            line: "FFFFFF",
            flipH: true
          });
        }
  
        if (
          include_data &&
          res &&
          res.length > 0 &&
          pc[v].config.flip_report &&
          pc[v].config.flip_report == "Y"
        ) {
          var cols = Object.keys(res[0]);
          var slidedata = pptx.addNewSlide("MASTER_SLIDE");
          slidedata.addText(title, {
            fontFace: "Calibri(Body)",
            fontSize: 38,
            color: "ffffff",
            isTextBox: true,
            shape: pptx.shapes.RECTANGLE,
            align: "l",
            x: 0.4,
            y: 0.5,
            w: 10,
            h: 1.2,
            fill: "1A3C65"
          });
          var cols_format = cols.map((v) => v.replace(/_/g, " "));
          da.push(cols_format);
          res.forEach((v) => {
            var r = [];
            cols.forEach((s) => {
              let value;
              if(s!="Time Period") {
                value = (v[s] || v[s] == 0) ? v[s].toLocaleString() : v[s];   //Udhay - to fix the zero not showing issue
              }
              else
              {
                value = v[s];
              }
              r.push(value);
            });
            da.push(r);
          });
          var tabOpts = {
            x: 0.5,
            y: 2.0,
            w: 9.0,
            fill: "F7F7F7",
            fontSize: 18,
            color: "6f9fc9"
          };
          slidedata.addTable(da, tabOpts);
        }
      }
      catch(err) {
        console.log("\n\nError!!! \n Something went wrong while processing this region: " + pc[v].config.title + " (" +  v + ")");
        console.log(err);
      }
    });

    //console.log('PPT SAVING---');
    pptx.save();

    //hiding the charts again
    Object.keys(pc)
      .filter((v) => pc[v].control_type === "Tabs Container")
      .forEach((v) => {
        $("#" + v + " .ui.bottom.attached.tab.segment.active").removeClass(
          "active"
        );
        $("#" + v + " .ui.bottom.attached.tab.segment.keep-me-visible")
          .addClass("active")
          .removeClass("keep-me-visible");
      });
  }

  //array of all the config objects for which we need to covert html2canvas.
  var htm2CanvasArr;
  /*htm2CanvasArr = Object.keys(pc).filter(
    (v) =>
      (pc[v].control_type === "Report" && pc[v].config.include_in_ppt === "Y") ||
      (pc[v].control_type === "Report" && pc[v].config.include_in_ppt === "N" && include_data) ||
      (pc[v].control_type === "Plugin") ||
      (pc[v].control_type === "Form" && pc[v].config.include_in_ppt === "Y")
  );*/
  
  //if(rxds.app.app.branch.match("MASTER|QA|UI")) { //Udhay - to restrict the plugin region if include_in_ppt is "N"
    htm2CanvasArr = Object.keys(pc).filter(
    	(v) => (
        	(pc[v].control_type === "Report" && pc[v].config.include_in_ppt === "Y") ||
      		(pc[v].control_type === "Report" && pc[v].config.include_in_ppt === "N" && include_data) ||
        	(pc[v].control_type === "Plugin" && pc[v].config.include_in_ppt !== "N") ||
        	(pc[v].control_type === "Form" && pc[v].config.include_in_ppt === "Y")
      )
    );
  //}

  if (htm2CanvasArr.length === 0) {
    createPPT();
    return;
  } else {
    //render html widgets as canvas components
    //select only 'Plugin' widgets or widgets that have 'Include in PPT' selected Yes in AB.
    var convertcnt = 0;
    htm2CanvasArr.forEach((v, itm, arrr) => {
      html2canvas(document.querySelector("[id='" + v + "']")).then((canvas) => {
        canvas.className = "tempcanvasforppt-" + v;
        document.body.appendChild(canvas);
        convertcnt++;
        if (convertcnt === arrr.length) {
          createPPT();
        }
      });
    });
  }
} //generate_ppt