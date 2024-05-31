var vega_themes = (function (exports) {
'use strict';

var markColor = '#4572a7';

var themeExcel = {
  background: '#fff',

  arc: { fill: markColor },
  area: { fill: markColor },
  mark: {fill: markColor},
  line: { stroke: markColor, strokeWidth: 2 },
  path: { stroke: markColor },
  rect: { fill: markColor },
  shape: { stroke: markColor },
  symbol: { fill: markColor, strokeWidth: 1.5, size: 50 },

  axis: {
    bandPosition: 0.5,
    gridDefault: true,
    gridOpacity: 1,
    gridWidth: 0.5,
    gridColor: '#000000',
    tickPadding: 10,
    tickSize: 5,
    tickWidth: 0.5
  },

  axisBand: {
    tickExtra: true,
    gridDefault: false
  },

  legend: {
    labelBaseline: 'middle',
    labelFontSize: 11,
    symbolType: 'square',
    symbolSize: 50
  },

  range: {
    category: [
      '#4572a7',
      '#aa4643',
      '#8aa453',
      '#71598e',
      '#4598ae',
      '#d98445',
      '#94aace',
      '#d09393',
      '#b9cc98',
      '#a99cbc'
    ]
  }
};

var markColor$1 = '#000';

var themeGgplot2 = {
  group: {
    fill: '#e5e5e5'
  },

  arc: { fill: markColor$1 },
  area: { fill: markColor$1 },
  line: { stroke: markColor$1 },
  path: { stroke: markColor$1 },
  rect: { fill: markColor$1 },
  shape: { stroke: markColor$1 },
  mark: {fill: markColor$1},
  symbol: { fill: markColor$1, size: 40 },

  axis: {
    domainDefault: false,
    gridDefault: true,
    gridColor: '#FFFFFF',
    gridOpacity: 1,
    tickColor: '#7F7F7F',
    tickPadding: 4,
    tickSize: 5.67,
    tickLabelColor: '#7F7F7F',
    titleFontSize: 16,
    titleFontWeight: 'normal'
  },

  legend: {
    labelBaseline: 'middle',
    labelFontSize: 11,
    symbolSize: 40
  },

  range: {
    category: [
      '#000000',
      '#7F7F7F',
      '#1A1A1A',
      '#999999',
      '#333333',
      '#B0B0B0',
      '#4D4D4D',
      '#C9C9C9',
      '#666666',
      '#DCDCDC'
    ]
  }
};

var markColor$2 = '#ab5787';
var axisColor = '#979797';

var themeQuartz = {
  background: '#f9f9f9',

  arc: { fill: markColor$2 },
  area: { fill: markColor$2 },
  line: { stroke: markColor$2 },
  path: { stroke: markColor$2 },
  rect: { fill: markColor$2 },
  shape: { stroke: markColor$2 },
  mark: {fill: markColor$2},
  symbol: { fill: markColor$2, size: 30 },

  axis: {
    domainColor: axisColor,
    domainWidth: 0.5,
    gridWidth: 0.2,
    tickColor: axisColor,
    tickWidth: 0.2,
    tickLabelColor: axisColor,
    titleColor: axisColor
  },

  axisBand: {
    gridDefault: false
  },

  axisX: {
    gridDefault: true,
    tickSize: 10
  },

  axisY: {
    domainDefault: false,
    gridDefault: true,
    tickSize: 0
  },

  legend: {
    padding: 1,
    labelFontSize: 11,
    symbolType: 'square',
    symbolSize: 30
  },

  range: {
    category: [
      '#ab5787',
      '#51b2e5',
      '#703c5c',
      '#168dd9',
      '#d190b6',
      '#00609f',
      '#d365ba',
      '#154866',
      '#666666',
      '#c4c4c4'
    ]
  }
};

var markColor$3 = '#3e5c69';

var themeVox = {
  background: '#fff',

  arc: { fill: markColor$3 },
  area: { fill: markColor$3 },
  line: { stroke: markColor$3 },
  path: { stroke: markColor$3 },
  rect: { fill: markColor$3 },
  shape: { stroke: markColor$3 },
  mark: {fill: markColor$3},
  symbol: { fill: markColor$3 },

  axis: {
    domainWidth: 0.5,
    gridDefault: true,
    tickPadding: 2,
    tickWidth: 0.5,
    titleFontWeight: 'normal',
    tickSize: 5
  },

  axisBand: {
    gridDefault: false
  },

  axisX: {
    gridWidth: 0.2
  },

  axisY: {
    gridWidth: 0.4,
    gridDash: [3]
  },

  legend: {
    padding: 1,
    labelFontSize: 11,
    symbolType: 'square'
  },

  range: {
    category: [
      '#3e5c69',
      '#6793a6',
      '#182429',
      '#0570b0',
      '#3690c0',
      '#74a9cf',
      '#a6bddb',
      '#e2ddf2'
    ]
  }
};

var markColor$4 = '#1890FF';

var themeG2 = {
      background: '#fff',

      mark: {fill: markColor$4},

      axis: {
        domainWidth: 0.5,
        gridDefault: true,
        tickPadding: 2,
        tickWidth: 0.5,
        titleFontWeight: 'normal',
        tickSize: 5
      },

      axisBand: {
        gridDefault: false
      },

      axisX: {
        gridWidth: 0.2
      },

      axisY: {
        gridWidth: 0.4,
        gridDash: [3]
      },

      legend: {
        padding: 1,
        labelFontSize: 11,
        symbolType: 'square'
      },

      range: {
        category: [
          '#1890FF',
          '#2FC25B',
          '#FACC14',
          '#223273',
          '#8543E0',
          '#13C2C2',
          '#3436C7',
          '#F04864'
        ]
      }
    };

exports.excel = themeExcel;
exports.ggplot2 = themeGgplot2;
exports.quartz = themeQuartz;
exports.vox = themeVox;
exports.g2 = themeG2;

return exports;

}({}));
