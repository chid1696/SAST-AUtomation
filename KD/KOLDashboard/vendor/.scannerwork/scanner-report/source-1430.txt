
var baseurl = "/cohort";
rxds.cohort = {};
rxds.cohort.filters = [
        { id: "gender",    label: "Gender", type: "string", input: "radio", values: { "M": "Male", "F": "Female", "U": "Unknown" }, operators: ["equal"] },
        { id: "age_group", label: "Age Group", type: "integer", validation: { min: 0, max: 120, step: 1 } },
        { id: "diag_icd9", label: "Diagnosis ICD9", type: "string" },
        { id: "proc_icd9", label: "Procedure ICD9", type: "string" },
        { id: "diag_after", label: "After Diagnosis", type: "integer", validation: { min: 0, max: 180, step: 5 } },
        { id: "LDL", label: "LDL", type: "double", validation: { min: 0, step: 1 } },
        { id: "HDL", label: "HDL", type: "double", validation: { min: 0, step: 1 } }
    ];
    


$("#builder-basic").queryBuilder({
    plugins: ["bt-tooltip-errors"],
    filters: rxds.cohort.filters,
    rules: rules_basic
});

$("#btn-reset").on("click", function() {
    $("#builder-basic").queryBuilder("reset");
});

$("#btn-set").on("click", function() {
    $("#builder-basic").queryBuilder("setRules", rules_basic);
});

$("#btn-get").on("click", function() {
    var result = $("#builder-basic").queryBuilder("getRules");

    if (!$.isEmptyObject(result)) {
        bootbox.alert({
        title: $(this).text(),
        message: "<pre class='code-popup'>" + format4popup(result) + "</pre>"
        });
    }
});
function format4popup(object) {
  return JSON.stringify(object, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')
}