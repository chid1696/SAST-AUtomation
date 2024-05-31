var query,ajaxReq;
var d2 = new Date,
    d1 = new Date("12/31/2008"),
    datediff = parseInt((d2.getTime()-d1.getTime())/(24*3600*1000));
    
var context = cubism.context()
    .serverDelay(Date.now() - new Date(2008, 12, 31) )
    .step(8 * 60 * 60 * 1000)
    .size(1240)
    .stop();


//Attaching refresh event to Horizontal Chart region
//$( ".horReg" ).on( "refresh", function( event, ajaxReq ) {
function drawHorizon(config,data) {

    query=config.query;

    $(".pluginReg").find("#graph")[0].innerHTML = "";
    d3.select("#graph").selectAll(".axis")
        .data(["top", "bottom"])
      .enter().append("div")
        .attr("class", function(d) { return d + " axis"; })
        .each(function(d) { d3.select(this).call(context.axis().ticks(12).orient(d)); });

    d3.select("#graph").append("div")
        .attr("class", "rule")
        .call(context.rule());

    d3.select("#graph").selectAll(".horizon")
        .data(["DIABETES","HYPERLIPIDEMIA","HEARTFAILURE","ATHEROSCELEROSIS","HYPERTENSION","ZATEANPN","CLONIDINE"].map(step))
        .enter().insert("div", ".bottom")
        .attr("class", "horizon")
        .call(context.horizon()
        .height(75)
        .format(d3.format("+,.2")));

    context.on("focus", function(i) {
      d3.selectAll(".value").style("right",
        i == null
          ? null
          : context.size() - i + "px");
      d3.selectAll(".value").style("font-weight","bolder");
      d3.selectAll(".value").style("color","red");

    });



} // On Refresh Horizontal chart Region

function step(name) {
  var format = d3.time.format("%Y-%m-%d");
  //var format = d3.time.format("%d-%b-%y");
  return context.metric(function(start, stop, step, callback) {
  qJSON = rxds.fngetJSON("","","ussr", query, function(qJSON){
    qJSON.x_fil_step = name;
    rxds.postReq({
          ajaxReq:ajaxReq,
          body: qJSON,
          done: function(rows){
                  var values = [],
                      lookup = {},
                      i = start.getTime();

                  rows.result.forEach(function(d) {
                    d.Metric = +d.Metric;
                    lookup[d.Date] = d;
                  });

                  while ((i += step) < stop) {
                    var key = format(new Date(i));
                    var value = key in lookup ? lookup[key].Metric: null;
                    values.push(value);
                  }

                  callback(null, values);

                },// End done cb
          fail: function(err){
                  div.innerText = "Error" + err.responseText;
                }
      });// End rxds.postReq
  }); //fngetJSON

  }, name);
}




