var markColor = '#3e5c69';

export default {
  background: '#fff',

  arc: { fill: markColor },
  area: { fill: markColor },
  line: { stroke: markColor },
  path: { stroke: markColor },
  rect: { fill: markColor },
  shape: { stroke: markColor },
  mark: {fill: markColor},
  symbol: { fill: markColor },

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
