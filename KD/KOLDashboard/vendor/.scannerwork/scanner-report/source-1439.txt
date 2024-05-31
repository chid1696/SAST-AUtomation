	/*var for making a line*/
    var lin1;

	/*making a var to store all the values*/
    chartsHor=[];
	  stocks1=[];
    param=[[]];

function drawGraph(stocks,param){
  
     for (var i = 0; i < stocks.length; i++) {
            stocks1[i]=stocks[i].stock;
            param[i]=stocks[i].values;
    }
        
    d3.select('#graph').selectAll('.horizon')
        .data(stocks)
        .enter()
        .append('div')
        .attr('class', 'horizon')
        .attr("width", 1920)
        .attr("height", 1080)
        .each(function(d) {
            tmpchart=     d3.horizonChart();
            tmpchart.title(d.stock)
                .call(this, d.values);
            chartsHor.push(tmpchart);
      });

        svgContainer2 = d3.select("#linetest").append("svg")
            .attr(  "width", 2000)
            .attr("height", 2000);

}

rect=new Array(stocks1.length);
    //drawGraph(stocks,param);


$( "#linetest" ).mousemove(function( event ) {

//Getting coordinates
        var coords=[event.pageX,event.pageY];

        console.log(coords)

        if(lin1!=null)
            lin1.remove();

        index=new Array(stocks1.length);


        for (var i = 0 ; i < stocks1.length; i++) {
            if (rect[i]!=null)
                rect[i].remove();
            wth=chartsHor[i].indexExtent()[1];
            index = Math.round((coords[0]/wth)*param[i].length);
           // console.log(chartsHor[i].indexExtent()[1]);
            //console.log(d.value);
        }

        //Drawing a line on given coordinates
        lin1= svgContainer2.append("line")
            .attr("x1", coords[0])  //<<== change your code here
            .attr("y1", 0)
            .attr("x2", coords[0])  //<<== and here
            .attr("y2", stocks1.length*30+(stocks1.length + 1))
            .style("stroke-width", 1)
            .style("stroke", "black")
            .style("fill", "red");



        //Showing data in text box with line
        for (var i = 0 ; i < stocks1.length; i++) {

            rect[i] = svgContainer2.append("text")
                .attr("x", coords[0])
                .attr("y",  30*(i+1)+(i+1))
                .text(param[i][index])
                .attr("font-family", "sans-serif")
                .attr( "font-size", "20px")
                .attr("fill", "black");
            //      console.log(valuesAll[stocknames[i]][index]);
        }


});

