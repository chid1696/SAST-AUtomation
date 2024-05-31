var markColor = '#1890FF';

export default {
      background: '#fff',

      mark: {fill: markColor},

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
