(function() {

//debugger;
// Create the connector object
var myConnector = tableau.makeConnector();

// Define the schema
myConnector.getSchema = function(schemaCallback) {
    var cols = [{
        id: "Recipient_Type",
        alias: "Recipient Type",
        dataType: tableau.dataTypeEnum.string
    }, {
        id: "Total_Amount",
        alias: "Total Amount",
        dataType: tableau.dataTypeEnum.float
    }, {
        id: "Number_Of_Payments",
        alias: "Number Of Payments",
        dataType: tableau.dataTypeEnum.float
    }, {
        id: "Entity_Count",
        alias: "Entity Count",
        dataType: tableau.dataTypeEnum.float
    }, {
        id: "Avg_Amount",
        alias: "Avg Amount",
        dataType: tableau.dataTypeEnum.float
    }];

    var tableSchema = {
        id: "earthquakeFeed",
        alias: "Earthquakes with magnitude greater than 4.5 in the last seven days",
        columns: cols
    };

    schemaCallback([tableSchema]);
};

// Download the data
myConnector.getData = function(table, doneCallback) {
  console.log("Inside getData")
    $.getJSON("/kdb/cms/.jxo?{string get` sv CACHE,x}`e8103ee5de2882e062f8c2ef8674f76a", function(resp) {
      console.log("json output" + resp[0].Recipient_Type );
            tableData = [];

        // Iterate over the JSON object
        for (var i = 0, len = resp.length; i < len; i++) {
            tableData.push({
                "Recipient_Type": resp[i].Recipient_Type,
                "Total_Amount": resp[i].Total_Amount,
                "Number_Of_Payments": resp[i].Number_Of_Payments,
                "Entity_Count": resp[i].Entity_Count,
                "Avg_Amount": resp[i].Avg_Amount
            });
        }

        table.appendRows(tableData);
        doneCallback();
    });
};

tableau.registerConnector(myConnector);
// Create event listeners for when the user submits the form
var gQueryID;
$("table").on("click",".expTableau",function(){
    gQueryID = $(this).data("queryid");
    console.log("Exporting Cache ID " + gQueryID + " to Tableau")
    tableau.connectionName = "RXDS Data Import"; // This will be the data source name in Tableau
    tableau.submit(); // This sends the connector object to Tableau
});


})()