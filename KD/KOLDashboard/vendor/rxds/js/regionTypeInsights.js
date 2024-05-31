import {util} from './util';

export async function load(k, obj, data) {

  var data = await util.load_annotation(k, obj);

//hide and show New or Edit option    

    if (Array.isArray(data) && data.length) {
      data = data[0];
      
      $("#modalNew"+k).hide();
      $("#modalEdit"+k).show();
      if (!obj.annotateVue)
         obj.annotateVue = new Vue({
              el: "#insights"+k,
              data: {data:data}
           });
      else
          obj.annotateVue.data=data;
          $("#insights"+k).show();
      if(data.headline === "Enter the headline here") {
            $("#insights"+k).find(".ui.header").hide();
      }
    }else{
      $("#modalEdit"+k).hide();
      $("#modalNew"+k).show();
      $("#insights"+k).hide(); 
    }
    
    refresh_modal(k,obj);
} // load

export async function refresh_modal(k,obj){
// check annotate role Global or App specific
    $.each(rxds.user.userRoles.split(":"),function(index,value){ 
       if ((value.match(rxds.app.app.url + " Annotate Role") !== null) || (value.match("Annotate Role") !== null)) {
            $("#"+k).find('.right.menu .pointing.dropdown').show();
      }
    });

    $("#"+k).find('.right.menu .pointing.dropdown').dropdown({
      action: 'activate',
      onChange: async function(value, text, $selectedItem) {
       // debugger;
 
        var k = value;
        var obj = rxds.page_controls["region"+k];
        var data = await util.load_annotation("region"+k, obj);
        if (!(Array.isArray(data) && data.length)) {
          data = {headline:"Enter the headline here",description:"Enter the description here"};
        }
        else data=data[0];

        data.region = "region"+k;
        if (rxds.vm_annotation) {
            rxds.vm_annotation.data = data;
        } else {
               rxds.vm_annotation = new Vue({
                  el: "#annotateModal",
                  data: {data:data},
                  methods: {
                      save: function (message,evt) {
                     //   debugger;
                        if (event) {
                          util.save_annotation(evt.target.dataset.region);
                          if (text.match(/New/)) {
                             $("#modalNew"+k).hide();
                          }
                          $('.ui.fullscreen.modal').modal('hide');
                        }
                      },
                      cancel: function (evt) {
                        $('.ui.fullscreen.modal').modal('hide');
                      }
                    }

            });
        }
        
        //Udhay - hide annotate header section if Region Header is set to "hidden"
        if(obj.config.title_bg === "hidden")   $('.ui.fullscreen.modal .field.annotate-header').hide();
        else    $('.ui.fullscreen.modal .field.annotate-header').show();
        
        $('.ui.fullscreen.modal')
          .modal('show')
        ;  
      }
    });

}

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

export function  get_param(p) {
  return rxds.m.get_param(p);
}

export function get_nmd(mkd) {
  return rxds.m.util.nmd(mkd);
}