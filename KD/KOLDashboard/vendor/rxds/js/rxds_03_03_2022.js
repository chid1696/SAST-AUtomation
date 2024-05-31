import {manager} from './rxds_manager';
import {util} from './util';


export var user;//Holds the User Object
export var gDebug = true;
export var env="client";
export var gQueryString = {};
export var m=manager;
var promise_arr= {};

async function get_user() {
    /* if(localStorage.getItem("rxds-user") != null){
      rxds.user = JSON.parse(localStorage.getItem("rxds-userg"));
    }else{ */
      let data = await $.get("/whoami");
      if (data && data.email) {
            localStorage.setItem("rxds-user",JSON.stringify(data));
            rxds.user = data;
            if (rxds.user.userAppRoles) {
                rxds.user.appRoles=":"+rxds.user.userAppRoles.split(/\:/).filter(v=>v.match(rxds.app.app.url+",")).map(v=>v.split(/,/)[1]).join(":")+ ":";
            }
      } else {
          console.log("/whoami Exception:" + data);
          rxds.user = {name:"unknown",email:"unavilable",userRoles:"none"};
      }
    //}
    //$("#rxuser").html(rxds.user.name);
    $("#rxuser").html("<i class='user circle icon color-blue'></i><strong>" + rxds.user.name + "</strong>");  //Modified for dark UI
    if (rxds.app.config.develop == "Y" && 
         rxds.user.userRoles.indexOf("AB-Developer") >= 0 ) {
            if (rxds.app.app.branch == "MASTER") {
             $("#dev_bar").show();load_develop_controls();
            } else {
              $("#username").click(function() {$("#dev_bar").show();load_develop_controls();});
            }   
         }
    else if (typeof develop !== "undefined" && develop.style) {develop.style.visibility="hidden";}
}  //get_user


export function launch_tour() {
  if (!rxds.tour) {
    rxds.tour = new Shepherd.Tour({
          defaults: {
            classes: 'shepherd-theme-arrows',
            scrollTo: true
          }
        });
        
    rxds.tour.addStep('first', {
      title: 'Device Info',
      text: 'General device identification data appears on the left ...',
      attachTo: {element: '.item.help', on: 'top left' },
      scrollTo: false
  });

  const t=JSON.parse(rxds.app.page.config.page_tour);
  Object.keys(t).forEach(v=>{
    rxds.tour.addStep('step-'+v, {
        title: 'Device Info', text: t[v],
        attachTo: {element: document.getElementById(v), on: 'top left'}
      });
   });
  }
   rxds.tour.start();
}

export function load_feedback() {
  //const feedback_url="https://feedback.rxdatascience.com/ords/f?p=1300:1:::::P1_HOST,P1_APP_NAME,P1_PAGE_NAME,P1_REPORTED_BY,P1_PATH,P1_ORIGIN,P1_APP_URL,P1_VIEW:";
  const feedback_url="https://feedback.rxdatascience.com/ords/f?p=1300:1:::NO:RIR,RP,1:P1_HOST,P1_APP_NAME,P1_PAGE_NAME,P1_REPORTED_BY,P1_PATH,P1_ORIGIN,P1_APP_URL,P1_VIEW:";
  const variables=location.host+","+rxds.app.app.name + ","+rxds.app.page.page.page_title+","+rxds.user.name.replace(" ","")+","+location.pathname+","+location.origin.replace("https://","")+","+location.href.replace("https://","")+","+(rxds.view?rxds.view.md5_hash:"");
  
//  console.log(feedback_url+variables);
  window.open(feedback_url+variables, "_blank", "")
}
function  removeElem(arr, elem) {
   return arr.filter(v=>{return v!== elem}); 
}
function secure_page() {
    var authRoles=rxds.app.page.auth_roles;
    const userRoles = rxds.user.userAppRoles?rxds.user.userAppRoles.split(/:/):'ALL';
    
    if (authRoles && authRoles  != "" && !authRoles.match(/ALL/) ) {
        const authArr = authRoles.split(/:/).map(v=>rxds.app.app.url+","+v);
        let intersection = authArr.filter(x => userRoles.includes(x));
        if (intersection.length == 0) {
            if (rxds.is_home) { // Home page try to find first open page available
              let p=rxds.app.pages;
              var ind;
              for (ind=1;ind<p.length;ind++) {
                 var pageRole=p[ind].auth_roles;
                 if (!pageRole || pageRole.match(/ALL/)) break;
                 const pauthArr = pageRole.split(/:/).map(v=>rxds.app.app.url+","+v);
                 let pinter = pauthArr.filter(x => userRoles.includes(x));
                 if (pinter.length>0) break;
              }
              if (ind == p.length)
                {document.open();document.write("Not Authorized");document.close();}
              else {window.location.replace(window.location.href+p[ind].page.page_name+"/");}
            } else {
            document.open();document.write("Not Authorized");document.close();
            }
        }
    }

    $(".page_link").each(function( index ) {
        var authRoles=this.dataset.roles;
        if (authRoles&&!authRoles.match(/ALL/)) {
            const authArr = authRoles.split(/:/).map(v=>rxds.app.app.url+","+v)
            let intersection = authArr.filter(x => userRoles.includes(x));
            //console.log(intersection);
            if (intersection.length == 0) {
                $( this ).hide();
                $( this ).addClass("page_link_hidden");
                $( this ).removeClass("page_link");
            }
        }   
      });

    $(".parent_menu").each(function( index ) {
            var child_count=$(this).next(".content").find(".page_link").length;
             if (child_count == 0) {$( this ).hide();}
    });

    $(".app_link").each(function( index ) {
        var appURL=':'+this.dataset.value+':';
        const userApps=':'+rxds.user.userApps+':';
        if (!userApps.match(appURL)) {
            $( this ).hide();
        }
      });

    $(".rxds_region").each(function( index ) {
        var authRoles=this.dataset.roles;
        if (authRoles&&!authRoles.match(/ALL/)) {
            const authArr = authRoles.split(/:/).map(v=>rxds.app.app.url+","+v)
            let intersection = authArr.filter(x => userRoles.includes(x));
            //console.log(intersection);
            if (intersection.length > 0) {
                $( this ).show();
            }
            else { // Region not shown for the current user. Remove
              let r = this.dataset.region;
              $(".rxds_region_help[data-region=" + r + "]").remove();   //to remove the help descriptions for removed regions
              $(".rxds_tab_menu[item-tab-region=" + r + "]").remove();  //to remove the tab-menu from tab container if any
              delete rxds.page_controls[r];
              let pc=rxds.page_controls;
              Object.keys(pc).forEach(v=>{let i=pc[v];
                  if (i.children) i.children=removeElem(i.children,r);
                  if (i.child_regions) i.child_regions=removeElem(i.child_regions,r);
                  if (i.dependent_items) i.dependent_items=removeElem(i.dependent_items,r);
                  if (i.dependent_regions) i.dependent_regions=removeElem(i.dependent_regions,r);
              });
            }
        }   
      });
    $(".rxds_item").each(function( index ) {
        var authRoles=this.dataset.roles;
        if (authRoles&&!authRoles.match(/ALL/)) {
            const authArr = authRoles.split(/:/).map(v=>rxds.app.app.url+","+v)
            let intersection = authArr.filter(x => userRoles.includes(x));
            //console.log(intersection);
            if (intersection.length > 0) {
                $( this ).show();
            }
            else { // Region not shown for the current user. Remove
              let r = this.dataset.item;
              $('.rxds_item_help[data-item="'+r+'"]').hide();   //to hide the help descriptions for hidden items 
              delete rxds.page_controls[r];
              let pc=rxds.page_controls;
              Object.keys(pc).forEach(v=>{let i=pc[v];
                  if (i.children) i.children=removeElem(i.children,r);
                  if (i.dependent_items) i.dependent_items=removeElem(i.dependent_items,r);
              });
            }
        }   
      });
      
} //secure_page

export function ready(page_id) {
  
  //Added for dark UI
  rxds.hasDarkTheme = true;   //Flag to identify the existance of dark mode
  rxds.theme_mode = "light";  //Flag to identify the current app theme mode (dark or light)
  
  // Added for AG Grid Dark-Light Mode Toggle
  
  if ($("body").find("[class^=ag-theme]").length > 0){
    rxds.hasAGGrid = true;
  } else {
    rxds.hasAGGrid = false;
  }

  if(localStorage.getItem("mode")=="light"){
    $("#darkModeLabel").html("Dark Mode");
    $("#darkModeToggle").prop("checked",false);
    body.className = "light-mode pushable";
    rxds.theme_mode = "light";
    
    /* FOR AG GRID THEME */
    
    if (rxds.hasAGGrid){
      if($("body").find("[class^=ag-theme]").attr("class") == 'ag-theme-balham'){
        $("body").find("[class^=ag-theme]").attr("class",$("body").find("[class^=ag-theme]").attr("class").replace("ag-theme-balham","ag-theme-balham"));  
      }
      else if($("body").find("[class^=ag-theme]").attr("class") == 'ag-theme-balham-dark'){
        $("body").find("[class^=ag-theme]").attr("class",$("body").find("[class^=ag-theme]").attr("class").replace("ag-theme-balham-dark","ag-theme-balham"));
      }
    }
    
    if( rxds.app.config.theme == 'alnylam' ) {
      var alnylamSrc = $(".item.logo.vertically.fitted > img").attr("src");
      $(".item.logo.vertically.fitted > img").attr("src",alnylamSrc.replace("alnylam-50px.png","alnylam-50px.png"));
      
      var copyrightSrc = $("#copyright > img").attr("src");
      $("#copyright > img").attr("src",copyrightSrc.replace("RXDSLogoOnWhite-SVG.svg","RXDSLogoOnWhite-SVG.svg"));
    }
    else if( rxds.app.config.theme.match(/demo|springWorks/)) {
        var logoSrc = $(".item.logo.vertically.fitted > img").attr("src");
        if(rxds.app.config.theme == 'demo')
          $(".item.logo.vertically.fitted > img").attr("src",logoSrc.replace("RXDSLogoOnWhite-SVG-White.svg","RXDSLogoOnWhite-SVG.svg"));
        else if(rxds.app.config.theme == 'springWorks')
          $(".item.logo.vertically.fitted > img").attr("src",logoSrc.replace("LogoWhite","Logo"));
        var copyrightSrc = $("#copyright > img").attr("src");
        $("#copyright > img").attr("src",copyrightSrc.replace("RXDSLogoOnWhite-SVG-White.svg","RXDSLogoOnWhite-SVG.svg"));
      }
    
    rxds.app.config.echart_theme = "macarons";
  }
  
  else if(localStorage.getItem("mode")=="dark"){
    $("#darkModeLabel").html("Light Mode");
    $("#darkModeToggle").prop("checked",true);
    body.className = "dark-mode pushable";
    rxds.theme_mode = "dark";
    
    /* FOR AG GRID THEME */
    /* var agGridTheme = $("body").find("[class^=ag-theme]").attr("class"); */
    
    if(rxds.hasAGGrid){
      if($("body").find("[class^=ag-theme]").attr("class") == 'ag-theme-balham'){
        $("body").find("[class^=ag-theme]").attr("class",$("body").find("[class^=ag-theme]").attr("class").replace("ag-theme-balham","ag-theme-balham-dark"));  
      }
      else if($("body").find("[class^=ag-theme]").attr("class") == 'ag-theme-balham-dark'){
        $("body").find("[class^=ag-theme]").attr("class",$("body").find("[class^=ag-theme]").attr("class").replace("ag-theme-balham-dark","ag-theme-balham-dark"));
      }
    }
    
    
    if( rxds.app.config.theme == 'alnylam') {
      var alnylamSrc = $(".item.logo.vertically.fitted > img").attr("src");
      $(".item.logo.vertically.fitted > img").attr("src",alnylamSrc.replace("alnylam-50px.png","alnylam-50px-white.png"));
      
      var copyrightSrc = $("#copyright > img").attr("src");
      $("#copyright > img").attr("src",copyrightSrc.replace("RXDSLogoOnWhite-SVG.svg","RXDSLogoOnWhite-SVG-White.svg"));
    }
    else if( rxds.app.config.theme.match(/demo|springWorks/)) {
        var logoSrc = $(".item.logo.vertically.fitted > img").attr("src");
        if(rxds.app.config.theme == 'demo')
          $(".item.logo.vertically.fitted > img").attr("src",logoSrc.replace("RXDSLogoOnWhite-SVG.svg","RXDSLogoOnWhite-SVG-White.svg"));
        else if(rxds.app.config.theme == 'springWorks')
          $(".item.logo.vertically.fitted > img").attr("src",logoSrc.replace("Logo","LogoWhite"));
        var copyrightSrc = $("#copyright > img").attr("src");
        $("#copyright > img").attr("src",copyrightSrc.replace("RXDSLogoOnWhite-SVG.svg","RXDSLogoOnWhite-SVG-White.svg"));
      }
    
    rxds.app.config.echart_theme = "dark";
  }
  /*-------------------------------------------------------------------*/
  
  rxds.stats = {page_load:new Date(),start_time:new Date()};             
  rxds.app.page = R.filter(function(i){return i.page.page_id===page_id})(rxds.app.pages)[0];
  rxds.reqID = decodeURIComponent(document.cookie.replace(/(?:(?:^|.*;\s*)reqID\s*\=\s*([^;]*).*$)|^.*$/, "$1"));

  //rxds.is_home = window.location.pathname.split('/').length===4;
  rxds.is_home = rxds.app.pages[0].page.page_id == rxds.app.page.page.page_id;
  
  ////Added for dark UI
  // Change Alnylam Logo Based on rxds.is_home
  var homePageIconURL,vendorDir; 
  
  if ( rxds.is_home ) {
    homePageIconURL = "./vendor/semantic/themes/bootswatch/";
    vendorDir = "./vendor/";
  }
  else {
    homePageIconURL = "../vendor/semantic/themes/bootswatch/";
    vendorDir = "../vendor/";
  }
  
  if ( rxds.app.config.theme == 'alnylam') {
    $("a.item.logo>i").css('background-image',"url('"+homePageIconURL+"alnylam-50px.png')");
  }
  else if(rxds.app.config.theme == 'springWorks'){
    $("a.item.logo>i").css('background-image',"url('"+vendorDir+"rxds/img/"+"springWorks-Logo.png')");
  }
  else {
    $("a.item.logo>i").css('background-image',"url('"+homePageIconURL+"RXDSLogoOnWhite-SVG.svg')");
  }
  /*-------------------------------------------------------------------*/
  
  rxds.db_path = rxds.is_home ? "db/":"../db/";
  rxds.vendor = rxds.is_home ? "vendor/":"../vendor/";
  rxds.load_completed=false;
  rxds.page_init=true;
  rxds.cache_dataset_id = rxds.app.page.config.cache_dataset_id?rxds.app.page.config.cache_dataset_id:rxds.app.config.cache_dataset_id;
  // Build Query String Array
  get_user().then(s=>{
    var search = location.search.substring(1);
    secure_page();
    gQueryString = search?JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}',
                 function(key, value) { return key===""?value:decodeURIComponent(value) }):{};
    $(".item.help").click(v=>{$('.ui.modal.help').modal('show');});
    $(".item_help").on("click", function() {    //Udhay - to open help popup when click on the item help icons
      $('.ui.modal.help').modal('show');
      $("#help_" + $(this).parents("form").attr("id").replace("region",""))[0].scrollIntoView()
    });
    $(".region_help").click(v=>{$('.ui.modal.help').modal('show');document.getElementById("help_"+ v.target.dataset.region_id).scrollIntoView();});
    $(".menu .tour").click(v=>{launch_tour();});
    $(".menu .views").click(v=>m.load_views());
    $('.ui.item.powerpoint.dropdown').dropdown();
    $('.ui.item.switch_app.dropdown').dropdown();
    $(".item .app_link").click(v=>rxds.load_app(v));
    $("#pptdata").click(v=>rxds.generate_ppt(true));
    $("#pptnodata").click(v=>rxds.generate_ppt(false));
    $(".menu .feedback").click(v=>rxds.load_feedback());
    if (rxds.gQueryString.view)
       m.load_view().then(v=>load());
    else load();             
  });
             
} // ready

function dependent_load(depend_list,p_all_fired) {
    if (!rxds.load_completed &&  !rxds.conditional_regions) {
      const dlist=depend_list.filter(v=>{return v.match(/^item/)});
      if (dlist.length == 0) {
        Promise.all(Object.values(promise_arr))
             .then( (v) => {conditional_regions();rxds.conditional_regions=true;dependent_load(depend_list);});
        return;
        };
    }
    var pc=rxds.page_controls;
    depend_list=depend_list.filter(v=>{return pc[v]});
    var toFire = R.reject(i=>pc[i].fired,depend_list);
    var promise_keys = Object.keys(promise_arr);
    var isReadyToFire = i => R.intersection(pc[i].dependent_items,promise_keys).length == pc[i].dependent_items.length;
    var readyToFire = R.filter(isReadyToFire,toFire);
    var all_fired;
//    if ((typeof p_all_fired == "undefined") || (p_all_fired==true)) {
    var item_list = Object.keys(rxds.page_controls).filter(v=>v.match(/^item/)&&rxds.page_controls[v].loaded == undefined);

        if ((item_list.length == 0) && (toFire.length == 0) && (!rxds.load_completed)) {
          rxds.load_completed = true;
          Promise.all(Object.values(promise_arr))
                 .then( (v) => load_complete(v));
                 
        }
       all_fired=toFire.length==readyToFire.length;
//    } else all_fired = false;    
    
    //Fire after resolving dependent promises
    readyToFire.forEach(
        (k) => {
            var prom = R.map(i=>promise_arr[i],pc[k].dependent_items);
            pc[k].fired=true; 
            Promise.all(prom)
                        .then( (values) => { 
                                if (pc[k]) {
                                  promise_arr[k] = manager.load(k);
                                  dependent_load(pc[k].children,all_fired);
                                }  
                        })
                        .catch(  (reason) => {console.log(reason)} );
            }
    );
}

export function load_app(evt) {
  let obj=evt.currentTarget;
  let app=obj.dataset.value;
  if (rxds.is_home)
      window.location.href="../"+app+"/";
  else     
      window.location.href="../../"+app+"/";
}

export function load_complete() {
  var pc=rxds.page_controls;
  var pc_keys = Object.keys(pc);
  var parents = R.reject(i => {return pc[i].children.length == 0}, pc_keys);
  parents.forEach( (k) => manager.dependent_handler(k,pc[k]) );

  //Replace title
  $(".bindItem").each(function(){
      const v=rxds.m.get_param($(this).data("item"));
      if (v) $(this).html( v.replaceAll("_"," ")  );
  });
  rxds.stats.end_time = new Date();
  rxds.stats.elapsed = rxds.stats.end_time - rxds.stats.start_time;

  manager.postPageView();
  if (rxds.page_init) {
    //form validation
    $('.rxds_form').form({
       on: 'change',
       fields:rxdsClient.genValJsonStr(rxds.page_controls),
       inline: true
    }); // end of form validation
  
    try{
      if (rxds.app.page.config.page_onload) {
        rxds.load_fn=new Function('rxds', 'first_load', rxds.app.page.config.page_onload);
        rxds.load_fn(rxds, true);        
      }
    }catch(e){}
    rxds.page_init=false;
    
  }
  else {
      if (rxds.app.page.config.page_onload) {
        rxds.load_fn(rxds,false);
      }  
  }
  console.log("Triggering timestamp");
  console.timeStamp('Page Loaded'); //Help with chromium to trigger screenshot
}


function del_div(sel)  {
    var elements = document.querySelectorAll(sel);
    for(var i=0; i< elements.length; i++){
        elements[i].parentNode.removeChild(elements[i]);
    }
};

export function hide_header_footer() {
let div_selector_to_remove= ".ui.top.fixed.menu";
del_div(div_selector_to_remove);
develop.style.visibility="hidden";
}


//Function for downloading power point
export function generate_ppt(include_data) {
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
              if(rxds.app.app.branch.match("MASTER|QA|UI")) {
                value = (v[s] || v[s] == 0) ? v[s].toLocaleString() : v[s];   //Udhay - to fix the zero not showing issue
              } else {
                value = v[s] ? v[s].toLocaleString() : v[s];
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

      
function validate_form() {
  var v=$('.rxds_form').form('validate form');
  if (Array.isArray(v)) {
      v=v.filter(v=> v===false).length==0;
  }
  if (v===false) return false; else return true;
}

export async function conditional_regions() {
  //await Promise.all(Object.keys(promise_arr).filter(v=>v.match(/^item/)).map(v=>promise_arr[v]));
  conditional_regions_wrap();
}

export function conditional_regions_wrap() {
  const eval2=eval;
  if (!rxds.hidden_controls) rxds.hidden_controls = {};
  const hc=rxds.hidden_controls;
  const h_keys= Object.keys(hc);
  const pc=rxds.page_controls;
  const pc_keys = Object.keys(pc).filter(v=>{return  pc[v].region&&pc[v].region.conditional_display});
  if ((pc_keys.length == 0)&&(h_keys.length==0)) return;

  Object.keys(pc).forEach(v=>{let i=pc[v];
          if (i.ac) {i.children=i.ac.slice(0);} else if (i.children && i.children.length) {i.ac= i.children.slice(0);}
          if (i.acr) {i.child_regions=i.acr.slice(0);} else if (i.child_regions && i.child_regions.length) {i.acr= i.child_regions.slice(0);}
          if (i.id) {i.dependent_items=i.id.slice(0);} else if (i.dependent_items && i.dependent_items.length) {i.id= i.dependent_items.slice(0);}
          if (i.idr) {i.dependent_regions=i.idr.slice(0);} else if (i.dependent_regions && i.dependent_regions.length) {i.idr= i.dependent_regions.slice(0);}
   });
  

  h_keys.forEach(v=>{
     let cond=hc[v].region.conditional_display; let show=true;
     cond=cond.replace(/{{([^}]*)}}/g, function (match, p1,offset, string) {return rxds.m.get_param(p1)});
     try {show=eval2(cond)} catch(e){console.log("Unable to evaluate " + cond); console.log(e);}
     if (show) {
          rxds.page_controls[v]=rxds.hidden_controls[v];
          let i=rxds.page_controls[v];
          delete rxds.hidden_controls[v];
          $('.rxds_region[data-region="'+v+'"]').show();
          $('.rxds_region_help[data-region="'+v+'"]').show();
          $('.rxds_tab_menu[item-tab-region=' + v + ']').show();  //Udhay - to show the tabs inside the tab container 
          $('.rxds_region[data-region="'+v+'"]').parent(".row").show();   //Udhay - to show the row div when there is regions to show inside that
     }
  });

  pc_keys.forEach(v=>{
     let cond=pc[v].region.conditional_display; let show=true;
     cond=cond.replace(/{{([^}]*)}}/g, function (match, p1,offset, string) {return rxds.m.get_param(p1)});
     try {show=eval2(cond)} catch(e){console.log("Unable to evaluate " + cond); console.log(e);}
     if (!show) {
          rxds.hidden_controls[v]=rxds.page_controls[v];
          delete rxds.page_controls[v];
          $('.rxds_region[data-region="'+v+'"]').hide();
          $('.rxds_region_help[data-region="'+v+'"]').hide();
          Object.keys(rxds.page_controls).forEach(w=>{let i=pc[w];
                  if (i.children) {i.children=removeElem(i.children,v)};
                  if (i.child_regions) i.child_regions=removeElem(i.child_regions,v);
                  if (i.dependent_items) i.dependent_items=removeElem(i.dependent_items,v);
                  if (i.dependent_regions) i.dependent_regions=removeElem(i.dependent_regions,v);
              });
              
          //Added by udhay - to hide the tabs inside the tab container 
          let tabItems = $('.rxds_tab_menu[item-tab-region=' + v + ']');
          if(tabItems.length) {
              let otherTabs = tabItems.siblings();
              //check and change tab if the tab is active
              if(tabItems.attr("class").includes("active") && otherTabs.length)   $(otherTabs[0]).click();
              tabItems.hide();
          }
          
          //Udhay - to hide the empty row div when there are no regions inside
          if(rxds.hidden_controls[v].region.group_count === "one"){
            $('.rxds_region[data-region="'+v+'"]').parent(".row").hide();
          } else {
            let grp = rxds.hidden_controls[v].region.group;
            let grouped_regions = Object.keys(rxds.page_controls).filter(v1 => rxds.page_controls[v1].region && rxds.page_controls[v1].region.group === grp);
            if(!grouped_regions.length)
              $('.rxds_region[data-region="'+v+'"]').parent(".row").hide();
          }   //End - Udhay - to hide the empty row div when there are no regions inside
     }
  });
  
} //conditional_regions

export async function load_regions() { /* Called from button action to reload page regions */
  if (!validate_form()) return;
  await conditional_regions();
  rxds.stats.start_time=new Date();             
  const pc=rxds.page_controls;
  const pc_keys = Object.keys(pc);
  const region_keys = R.filter(i => {return pc[i].region && pc[i].query_id > 0}, pc_keys);
  var param={};
  var p = region_keys.map(
      (k) => {promise_arr[k] = manager.load(k);return promise_arr[k];}
  );
  await Promise.all(p);
  rxds.stats.end_time = new Date();
  rxds.stats.elapsed = rxds.stats.end_time - rxds.stats.start_time;
  manager.postPageView();
  //Replace title
  $(".bindItem").each(function(){
      $(this).html( rxds.m.get_param($(this).data("item")).replaceAll("_"," ")  );
  });

}

function add_grand_children(pc,children) {
  try {
   var added=false;
   const ilist=children.filter(v=>{return v.match(/^item/)});
   ilist.forEach(v=>{
     //console.log(pc[v].children);
     pc[v].children.forEach(w=>{
       const exists = children.find(x=>{return x==w});
       if (!exists) {children.push(w);added=true}
     })
   });
   if (added) {
    //console.log(children);
     add_grand_children(pc,children);
   }
  } catch(e) {
    console.log(e);
  }
}

export async function load_children(children,recheck,k1) { /* Called in reactive pages to refresh dependent regions */
    if (!rxds.load_completed || !validate_form()) return;
    rxds.stats.start_time=new Date();             
    const pc=rxds.page_controls;
    const pc_keys=children;
    pc_keys.forEach(k => {if (pc[k]) {pc[k].loaded=false; pc[k].fired = false;delete promise_arr[k]}});
    rxds.load_completed=false;
    
    //rxds.conditional_regions=false;
    await conditional_regions();
    if (recheck) children=pc[k1].children;
    add_grand_children(pc,children);
    dependent_load(children);
    const parents = R.reject(i => {return pc[i] && pc[i].children.length == 0}, pc_keys);
    await new Promise(r => setTimeout(r, 2000));
    parents.forEach( (k) => manager.dependent_handler(k,pc[k]) );

}

export async function load() {
   
     getDBnameURL();
    
  rxds.load_completed = false;
  rxds.conditional_regions = false;
  $.fn.dropdown.settings.delimiter = '|';
  $.fn.dropdown.settings.fullTextSearch = true;
  if(rxds.app.app.name === "Global Training Tracker") {
    //Udhay & Sriman to change the search behaviour in GTT application
    $.fn.dropdown.settings.fullTextSearch = "exact";
  }
  
  const pc=rxds.page_controls;
  const pc_keys = Object.keys(pc);
  //initialize page controls
  pc_keys.forEach(
      (k) => {pc[k].children=[]; pc[k].fired = false;}
  );
  
  if (rxds.cache_dataset_id) {
       rxds.recache_ts =  await manager.fetchAsync("cache"+rxds.cache_dataset_id,"Cache TS", rxds.cache_dataset_id,{cache:'N'});
       if (rxds.recache_ts.result && rxds.recache_ts.result.length==1) rxds.recache_ts = rxds.recache_ts.result[0];
       else rxds.recache_ts= '1900-01-01T00:00:00'
  }

  //Find objects with and without dependents
  const no_depend = R.filter(i => {return pc[i].dependent_items.length == 0}, pc_keys);
  const depend = R.reject(i => {return pc[i].dependent_items.length == 0}, pc_keys);
  
//Fire away and store promises if no dependents
  no_depend.forEach(
      (k) => {pc[k].fired=true; promise_arr[k] = manager.load(k);}
  );
  //debugger;
  //Append to the children array for the parent elements to support refresh
  depend.forEach(
      (k) => {
          pc[k].dependent_items.forEach(i=>{pc[i].children.push(k)});
  });

  dependent_load(depend);
} //load


//dhinesh - syneos dbname based client logo
async function getDBnameURL(){
      if(rxds.app.config.theme.toUpperCase()=="SYNEOS")
    {
      
      let dbname="";
      
    let app_url = window.location.href;
   
    var app_dbname = app_url.includes('DBNAME');
   
    if(app_dbname == true){
     var url = new URL(app_url);
    dbname = url.searchParams.get("DBNAME");
    }else if(app_url.indexOf('DB_') > 0){
      let url_dbname = app_url.split('/')[4];
       dbname =  url_dbname.replace('DB_','');
     
    }else{
      $(".pusher").find(".center.menu.margin-center").show(); 
      }
   
      
      if(dbname!="")
      {
        let logourl="";
        let url="https://rxdsdev-apex.syneoshealth.com/ords/rxds/dl/data_browser_client_logos/"+dbname;
        let response= await fetch(url);
        let data = await response.text();
        if(data)
        {
        data = JSON.parse(data);
        data=JSON.parse(data["json"]);
          if(Object.keys(data).filter(v=>v==dbname).length==1)
          {
            if(data[dbname].LOGO_URL)
            {
              logourl=data[dbname].LOGO_URL;
            }
          }
        }
        
        if(logourl!="")
        {
          $(".pusher").find(".item.logo.vertically.fitted img").attr("src",logourl);
          $(".pusher").find(".center.menu.margin-center").show();
        }
      }
    }

  }


//Udhay - find and update the parameter values from the given text/title
export function replace_params(title) {
	let title_txt = title.replace(/{{([^}]*)}}/g, function (match, p1,offset, string) {return rxds.m.get_param(p1)});
	/*let avail_params = title_txt.match(/{{[^}}]+}}/g);
	if(avail_params) {
	    avail_params.forEach(v => {
	        let param_value = rxds.m.get_param(v.replace(/{|}/g,""));
	        if(param_value) title_txt = title_txt.replace(v," " + param_value + " ").replace(/&nbsp;/g,"");
	    });
	}*/
	title_txt = $("<span>" + title_txt + "</span>").text().replace(/\s+/g," ").trim();
	return title_txt;
}

//Added for dark UI
$('#darkModeToggle').change(async function(){
  
    if($(this).prop("checked")) {
      $("#darkModeLabel").html("Light Mode");
      body.className = "dark-mode pushable";
      rxds.theme_mode = "dark";
      localStorage.setItem("mode","dark");
      
      /* FOR AG GRID THEME */
      if(rxds.hasAGGrid){
        $("body").find("[class^=ag-theme]").attr("class",$("body").find("[class^=ag-theme]").attr("class").replace("ag-theme-balham","ag-theme-balham-dark"));
      }
      
      if( rxds.app.config.theme == 'alnylam') {
        var alnylamSrc = $(".item.logo.vertically.fitted > img").attr("src");
        $(".item.logo.vertically.fitted > img").attr("src",alnylamSrc.replace("alnylam-50px.png","alnylam-50px-white.png"));
        var copyrightSrc = $("#copyright > img").attr("src");
        $("#copyright > img").attr("src",copyrightSrc.replace("RXDSLogoOnWhite-SVG.svg","RXDSLogoOnWhite-SVG-White.svg"));
      }
      else if( rxds.app.config.theme.match(/demo|springWorks/)) {
        var logoSrc = $(".item.logo.vertically.fitted > img").attr("src");
        if(rxds.app.config.theme == 'demo')
          $(".item.logo.vertically.fitted > img").attr("src",logoSrc.replace("RXDSLogoOnWhite-SVG.svg","RXDSLogoOnWhite-SVG-White.svg"));
        else if(rxds.app.config.theme == 'springWorks')
          $(".item.logo.vertically.fitted > img").attr("src",logoSrc.replace("Logo","LogoWhite"));
        var copyrightSrc = $("#copyright > img").attr("src");
        $("#copyright > img").attr("src",copyrightSrc.replace("RXDSLogoOnWhite-SVG.svg","RXDSLogoOnWhite-SVG-White.svg"));
      }
      
      rxds.app.config.echart_theme = "dark";
      await rxds.load_regions();
      rxds.load_fn(rxds, false);
    }
    
    else {
      $("#darkModeLabel").html("Dark Mode");
      body.className = "light-mode pushable";
      rxds.theme_mode = "light";
      localStorage.setItem("mode","light");
      
      /* FOR AG GRID THEME */
      if(rxds.hasAGGrid){
        $("body").find("[class^=ag-theme]").attr("class",$("body").find("[class^=ag-theme]").attr("class").replace("ag-theme-balham-dark","ag-theme-balham"));
      }
      
      if( rxds.app.config.theme == 'alnylam') {
        var alnylamSrc = $(".item.logo.vertically.fitted > img").attr("src");
        $(".item.logo.vertically.fitted > img").attr("src",alnylamSrc.replace("alnylam-50px-white.png","alnylam-50px.png"));
        var copyrightSrc = $("#copyright > img").attr("src");
        $("#copyright > img").attr("src",copyrightSrc.replace("RXDSLogoOnWhite-SVG-White.svg","RXDSLogoOnWhite-SVG.svg"));
      }
      else if( rxds.app.config.theme.match(/demo|springWorks/)) {
        var logoSrc = $(".item.logo.vertically.fitted > img").attr("src");
        if(rxds.app.config.theme == 'demo')
          $(".item.logo.vertically.fitted > img").attr("src",logoSrc.replace("RXDSLogoOnWhite-SVG-White.svg","RXDSLogoOnWhite-SVG.svg"));
        else if(rxds.app.config.theme == 'springWorks')
          $(".item.logo.vertically.fitted > img").attr("src",logoSrc.replace("LogoWhite","Logo"));
        var copyrightSrc = $("#copyright > img").attr("src");
        $("#copyright > img").attr("src",copyrightSrc.replace("RXDSLogoOnWhite-SVG-White.svg","RXDSLogoOnWhite-SVG.svg"));
      }
      
      rxds.app.config.echart_theme = "macarons";
      await rxds.load_regions();
      rxds.load_fn(rxds, false);
    }
    
});
/*-------------------------------------------------------------------*/
