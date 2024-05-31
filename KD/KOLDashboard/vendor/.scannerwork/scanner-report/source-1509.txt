// Adding replaceAll to String object
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
String.prototype.initCap = function () {
   return this.replace(/_/g, ' ').toLowerCase().replace(/(?:^|\s)[a-z]/g, function (m) {
      return m.toUpperCase();
   });
};

String.prototype.toDate = function() {
  var parts =this.substr(0,10).split('-');
  return new Date(parts[0], parts[1] - 1, parts[2]); 
}


/**
 * Number.prototype.format(n, x)
 * @param integer n: length of decimal
 * @param integer x: length of sections
 * 1234..format();           // "1,234"
 * 12345..format(2);         // "12,345.00"
 * 123456.7.format(3, 2);    // "12,34,56.700"
 * 123456.789.format(2, 4);  // "12,3456.79"
 */
Number.prototype.precisionRound = function (precision) {
  var factor = Math.pow(10, precision);
  return Math.round(this * factor) / factor;
} 
Number.prototype.roundUp = function() {
  var e=Math.pow(10,(''+this).length-1);
  return Math.ceil(this/e)*e;
}
Number.prototype.roundDown = function() {
  var e=Math.pow(10,(''+ this).length-1);
  return Math.floor(this/e)*e;
}
Number.prototype.percentFormat = function(p) {
  return (f * 100).toFixed(p>=0?p:2) + '%';
}
Number.prototype.format = function(n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
};

Number.prototype.formatCur = function(cur,round){
  if(typeof cur == "undefined"){cur = ""}else{cur = cur + " "}
  if(typeof round == "undefined"){round = 2}
  if(this > 1e9 || this < -1e9){
    return cur + (this/1e9).format(round) + " B";
  }else if(this > 1e6 || this < -1e6){
    return cur + (this/1e6).format(round) + " M";
  }else if(this > 1e3 || this < -1e3){
    round = 0;// Skip the decimal for > 1000
    return cur + (this/1e3).format(round) + " K";
  }else{
    return cur + this.format(round);
  }
};

// Function to filter OUT just one element from an Array
Array.prototype.except = function(ele){
  var arr = this.slice();
  arr.splice(arr.indexOf(ele),1);
  return arr;
}

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

// Date format functions

Date.prototype.shortDate = function(){
    var dt = this;
    return (dt.getMonth() + 1) + "/" + dt.getDate() + "/" + dt.getFullYear();
};
Date.prototype.getMonthName = function(){
    const months    = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dt = this;
    return months[dt.getMonth()];
};
