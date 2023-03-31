import * as UMAP from 'https://cdn.jsdelivr.net/npm/umap-js/+esm';
import * as Plotly from 'https://cdn.jsdelivr.net/npm/plotly.js-dist/+esm';
import * as am5 from 'https://cdn.jsdelivr.net/npm/@amcharts/amcharts5/+esm';
import * as am5hierarchy from 'https://cdn.jsdelivr.net/npm/@amcharts/amcharts5/hierarchy/+esm';
import * as am5themes_Animated from 'https://cdn.jsdelivr.net/npm/@amcharts/amcharts5@5.3.7/themes/Animated.js/+esm';
import * as localforage from 'https://cdn.jsdelivr.net/npm/localforage/+esm';
import * as pako from 'https://cdn.jsdelivr.net/npm/pako/+esm';
import * as Papa from 'https://cdn.jsdelivr.net/npm/papaparse/+esm';

function groupDataByMutation(
  apiData,
  groupRegex,
  mutationGroupSort = false,
  mutationTypeSort = false
) {
  const groupByMutation = apiData.reduce((acc, e) => {
    const mutation = e.mutationType.match(groupRegex)[1];
    acc[mutation] = acc[mutation] ? [...acc[mutation], e] : [e];
    return acc;
  }, {});

  const groupedData = Object.entries(groupByMutation).map(
    ([mutation, data]) => ({
      mutation,
      data: mutationTypeSort ? data.sort(mutationTypeSort) : data,
    })
  );

  return mutationGroupSort ? groupedData.sort(mutationGroupSort) : groupedData;
}

function getTotalMutations(apiData) {
  return apiData.reduce(
    (total, e) => total + e.mutations || e.contribution || 0,
    0
  );
}

function getMaxMutations(apiData) {
  return Math.max(...apiData.map((e) => e.mutations || e.contribution || 0));
}

function createSampleAnnotation(apiData, text = '', yPos = 0.88) {
  const totalMutations = getTotalMutations(apiData);
  return {
    xref: 'paper',
    yref: 'paper',
    xanchor: 'bottom',
    yanchor: 'bottom',
    x: 0.01,
    y: yPos,
    text:
      apiData[0].sample && parseFloat(totalMutations).toFixed(2) > 1
        ? `<b>${apiData[0].sample}: ${totalMutations.toLocaleString()} ${
            text || apiData[0].profile == 'ID' ? 'Indels' : 'Substitutions'
          }</b>`
        : apiData[0].sample && totalMutations <= 1.1
        ? `<b>${apiData[0].sample}</b>`
        : `<b>${apiData[0].signatureName}</b>`,
    showarrow: false,
    font: {
      size: 24,
      family: 'Arial',
    },
    align: 'center',
  };
}

function createMutationShapes(data, colors) {
  return data.map((group, groupIndex, array) => ({
    type: 'rect',
    xref: 'x',
    yref: 'paper',
    x0: array
      .slice(0, groupIndex)
      .reduce((lastIndex, e) => lastIndex + e.data.length, -0.35),
    x1: array
      .slice(0, groupIndex + 1)
      .reduce((lastIndex, e) => lastIndex + e.data.length, -0.65),
    y0: 1.05,
    y1: 1.01,
    fillcolor: colors[group.mutation],
    line: {
      width: 0,
    },
  }));
}

function createMutationAnnotations(data, appendedText = '') {
  return data.map((group, groupIndex, array) => ({
    xref: 'x',
    yref: 'paper',
    xanchor: 'bottom',
    yanchor: 'bottom',
    x:
      array
        .slice(0, groupIndex)
        .reduce((lastIndex, b) => lastIndex + b.data.length, 0) +
      (group.data.length - 1) * 0.5,
    y: 1.05,
    text: `<b>${group.mutation + appendedText}</b>`,
    showarrow: false,
    font: { size: 18 },
    align: 'center',
  }));
}

const rs32Color = {
  'clustered_del_>10Mb': 'deeppink',
  'non-clustered_del_>10Mb': 'deeppink',
  'clustered_del_1Mb-10Mb': 'hotpink',
  'non-clustered_del_1Mb-10Mb': 'hotpink',
  'clustered_del_10-100Kb': 'lightpink',
  'non-clustered_del_10-100Kb': 'lightpink',
  'clustered_del_100Kb-1Mb': 'palevioletred',
  'non-clustered_del_100Kb-1Mb': 'palevioletred',
  'clustered_del_1-10Kb': 'lavenderblush',
  'non-clustered_del_1-10Kb': 'lavenderblush',
  'clustered_tds_>10Mb': 'saddlebrown',
  'non-clustered_tds_>10Mb': 'saddlebrown',
  'clustered_tds_1Mb-10Mb': 'sienna',
  'non-clustered_tds_1Mb-10Mb': 'sienna',
  'clustered_tds_10-100Kb': 'sandybrown',
  'non-clustered_tds_10-100Kb': 'sandybrown',
  'clustered_tds_100Kb-1Mb': 'peru',
  'non-clustered_tds_100Kb-1Mb': 'peru',
  'clustered_tds_1-10Kb': 'linen',
  'non-clustered_tds_1-10Kb': 'linen',
  'clustered_inv_>10Mb': 'rebeccapurple',
  'non-clustered_inv_>10Mb': 'rebeccapurple',
  'clustered_inv_1Mb-10Mb': 'blueviolet',
  'non-clustered_inv_1Mb-10Mb': 'blueviolet',
  'clustered_inv_10-100Kb': 'plum',
  'non-clustered_inv_10-100Kb': 'plum',
  'clustered_inv_100Kb-1Mb': 'mediumorchid',
  'non-clustered_inv_100Kb-1Mb': 'mediumorchid',
  'clustered_inv_1-10Kb': 'thistle',
  'non-clustered_inv_1-10Kb': 'thistle',
  clustered_trans: 'gray',
  'non-clustered_trans': 'gray',
  del: '#800001',
  tds: '#FF8C00',
  inv: '#6A5ACD',
  tra: '#696969',
};

const sbsColor = {
  'C>A': '#03BCEE',
  'C>G': 'black',
  'C>T': '#E32926',
  'T>A': '#CAC9C9',
  'T>C': '#A1CE63',
  'T>G': '#EBC6C4',
};

const id83Color = {
  '1:Del:C': { shape: '#FBBD6F', text: 'black' },
  '1:Del:T': { shape: '#FE8002', text: 'white' },
  '1:Ins:C': { shape: '#AEDD8A', text: 'black' },
  '1:Ins:T': { shape: '#35A12E', text: 'white' },
  '2:Del:R': { shape: '#FCC9B4', text: 'black' },
  '3:Del:R': { shape: '#FB8969', text: 'black' },
  '4:Del:R': { shape: '#F04432', text: 'black' },
  '5:Del:R': { shape: '#BB1A1A', text: 'white' },
  '2:Ins:R': { shape: '#CFDFF0', text: 'black' },
  '3:Ins:R': { shape: '#93C3DE', text: 'black' },
  '4:Ins:R': { shape: '#4B97C7', text: 'black' },
  '5:Ins:R': { shape: '#1863AA', text: 'white' },
  '2:Del:M': { shape: '#E1E1EE', text: 'blacl' },
  '3:Del:M': { shape: '#B5B5D6', text: 'black' },
  '4:Del:M': { shape: '#8482BC', text: 'black' },
  '5:Del:M': { shape: '#62409A', text: 'white' },
};

const dbs78Color = {
  AC: '#09BCED',
  AT: '#0266CA',
  CC: '#9FCE62',
  CG: '#006501',
  CT: '#FF9898',
  GC: '#E22925',
  TA: '#FEB065',
  TC: '#FD8000',
  TG: '#CB98FD',
  TT: '#4C0299',
};

function SBS96(apiData, title = '') {
  const colors = sbsColor;
  const mutationRegex = /\[(.*)\]/;

  const mutationGroupSort = (a, b) => {
    const order = Object.keys(colors);
    return order.indexOf(a.mutation) - order.indexOf(b.mutation);
  };

  const data = groupDataByMutation(apiData, mutationRegex, mutationGroupSort);
  const maxMutation = getMaxMutations(apiData);
  const totalMutations = getTotalMutations(apiData);
  const mutationTypeNames = data
    .map((group) =>
      group.data.map((e) => ({
        mutation: group.mutation,
        mutationType: e.mutationType,
      }))
    )
    .flat();

  const traces = data.map((group, groupIndex, array) => ({
    name: group.mutation,
    type: 'bar',
    marker: { color: colors[group.mutation] },
    x: [...group.data.keys()].map(
      (e) =>
        e +
        array
          .slice(0, groupIndex)
          .reduce((lastIndex, b) => lastIndex + b.data.length, 0)
    ),
    y: group.data.map((e) => e.mutations || e.contribution),
    hoverinfo: 'x+y',
    showlegend: false,
  }));
  const sampleAnnotation = createSampleAnnotation(apiData);
  const mutationAnnotation = createMutationAnnotations(data);
  const mutationShapes = createMutationShapes(data, colors);

  function formatTickLabel(mutation, mutationType) {
    const color = colors[mutation];
    const regex = /^(.)\[(.).{2}\](.)$/;
    const match = mutationType.match(regex);
    return `${match[1]}<span style="color:${color}"><b>${match[2]}</b></span>${match[3]}`;
  }

  const layout = {
    title: `<b>${title}</b>`,
    hoverlabel: { bgcolor: '#FFF' },
    bargap: 0.3,
    height: 450,
    // width: 1080,
    autosize: true,

    xaxis: {
      showline: true,
      tickangle: -90,
      tickfont: {
        family: 'Courier New, monospace',
        color: '#A0A0A0',
      },
      tickmode: 'array',
      tickvals: mutationTypeNames.map((_, i) => i),
      ticktext: mutationTypeNames.map((e) =>
        formatTickLabel(e.mutation, e.mutationType)
      ),
      linecolor: '#E0E0E0',
      linewidth: 1,
      mirror: 'all',
    },
    yaxis: {
      title: {
        text:
          parseFloat(totalMutations).toFixed(2) > 1
            ? '<b>Number of Single Base Substitutions</b>'
            : '<b>Percentage of Single Base Substitutions</b>',
        font: {
          family: 'Times New Roman',
        },
      },
      autorange: false,
      range: [0, maxMutation * 1.2],
      ticks: 'inside',
      tickcolor: '#D3D3D3',
      linecolor: '#D3D3D3',
      linewidth: 1,
      mirror: 'all',
      tickformat: parseFloat(totalMutations).toFixed(2) > 1 ? '~s' : '.1%',
      showgrid: true,
      gridcolor: '#F5F5F5',
    },

    shapes: mutationShapes,
    annotations: [...mutationAnnotation, sampleAnnotation],
  };

  return { traces, layout };
}

function SBS192(apiData, title = '') {
  const colors = sbsColor;
  const mutationRegex = /\[(.*)\]/;
  const mutationTypeSort = (a, b) => {
    const mutationTypeRegex = /^\w\:(.*)/;
    return a.mutationType
      .match(mutationTypeRegex)[1]
      .localeCompare(b.mutationType.match(mutationTypeRegex)[1]);
  };
  const mutationGroupSort = (a, b) => {
    const order = Object.keys(colors);
    return order.indexOf(a.mutation) - order.indexOf(b.mutation);
  };

  const transcribed = apiData.filter((e) => /^T:/.test(e.mutationType));
  const untranscribed = apiData.filter((e) => /^U:/.test(e.mutationType));

  const transcribedGroups = groupDataByMutation(
    transcribed,
    mutationRegex,
    mutationGroupSort,
    mutationTypeSort
  );
  const untranscribedGroups = groupDataByMutation(
    untranscribed,
    mutationRegex,
    mutationGroupSort,
    mutationTypeSort
  );
  const maxMutation = getMaxMutations(apiData);

  const transcribedTraces = {
    name: 'Transcribed Strand',
    type: 'bar',
    marker: { color: '#004765' },
    x: transcribedGroups
      .map((group, i, array) =>
        [...group.data.keys()].map(
          (e) =>
            e +
            array
              .slice(0, i)
              .reduce((lastIndex, b) => lastIndex + b.data.length, 0)
        )
      )
      .flat(),
    y: transcribedGroups
      .map((group, i) => group.data.map((e) => e.mutations || e.contribution))
      .flat(),
    hovertemplate: '<b>Transcribed Strand</b><br> %{x}, %{y} <extra></extra>',
    showlegend: true,
  };
  const untranscribedTraces = {
    name: 'Untranscribed Strand',
    type: 'bar',
    marker: { color: '#E32925' },
    x: untranscribedGroups
      .map((e, i, array) =>
        [...e.data.keys()].map(
          (e) =>
            e +
            array
              .slice(0, i)
              .reduce((lastIndex, b) => lastIndex + b.data.length, 0)
        )
      )
      .flat(),
    y: untranscribedGroups
      .map((group, i) => group.data.map((e) => e.mutations || e.contribution))
      .flat(),
    hovertemplate: '<b>Untranscribed Strand</b><br> %{x}, %{y} <extra></extra>',
    showlegend: true,
  };

  const sampleAnnotation = createSampleAnnotation(
    apiData,
    'Transcribed Substitutions'
  );
  const mutationAnnotation = createMutationAnnotations(transcribedGroups);
  const mutationShapes = createMutationShapes(transcribedGroups, colors);
  const backgroundShapes = mutationShapes.map((e) => ({
    ...e,
    y0: 1,
    y1: 0,
    opacity: 0.15,
  }));

  const traces = [transcribedTraces, untranscribedTraces];

  function formatTickLabel(mutation, mutationType) {
    const color = colors[mutation];
    const regex = /^\w\:(.)\[(.).{2}\](.)$/;
    const match = mutationType.match(regex);
    return `${match[1]}<span style="color:${color}"><b>${match[2]}</b></span>${match[3]}`;
  }

  const mutationTypeNames = transcribedGroups
    .map((group) =>
      group.data.map((e) => ({
        mutation: group.mutation,
        mutationType: e.mutationType,
      }))
    )
    .flat();

  const layout = {
    title: `<b>${title}</b>`,
    hoverlabel: { bgcolor: '#FFF' },
    showlegend: true,
    height: 450,
    autosize: true,
    legend: {
      x: 1,
      xanchor: 'right',
      y: 1,
      bgcolor: '#FFFFFF',
      bordercolor: '#E1E1E1',
      borderwidth: 1,
    },
    xaxis: {
      showticklabels: true,
      showline: true,
      tickangle: -90,
      tickfont: {
        family: 'Courier New, monospace',
        color: '#A0A0A0',
      },
      tickmode: 'array',
      tickvals: mutationTypeNames.map((_, i) => i),
      ticktext: mutationTypeNames.map((e) =>
        formatTickLabel(e.mutation, e.mutationType)
      ),
      linecolor: '#E0E0E0',
      linewidth: 1,
      mirror: 'all',
    },
    yaxis: {
      title: {
        text: apiData[0].mutations
          ? '<b>Number of Double Base Substitutions</b>'
          : '<b>Percentage of Double Base Substitutions</b>',
        font: {
          family: 'Times New Roman',
        },
      },
      autorange: false,
      range: [0, maxMutation * 1.2],
      linecolor: '#E0E0E0',
      linewidth: 1,
      mirror: 'all',
      tickformat: Number.isInteger(traces[0].y[0]) ? '~s' : '.1%',
    },

    shapes: [...mutationShapes, ...backgroundShapes],
    annotations: [...mutationAnnotation, sampleAnnotation],
  };

  return { traces, layout };
}

function SBS288(data, title = '') {
  const colors = {
    'C>A': '#03BCEE',
    'C>G': 'black',
    'C>T': '#E32926',
    'T>A': '#CAC9C9',
    'T>C': '#A1CE63',
    'T>G': '#EBC6C4',
  };

  const transcribed = data.filter((e) => /^T:/.test(e.mutationType));
  const untranscribed = data.filter((e) => /^U:/.test(e.mutationType));
  const neutral = data.filter((e) => /^N:/.test(e.mutationType));

  // const totalMutations =
  //   transcribed.reduce((total, e) => total + e.mutations, 0) +
  //   untranscribed.reduce((total, e) => total + e.mutations, 0) +
  //   neutral.reduce((total, e) => total + e.mutations, 0);
  const totalMutations = getTotalMutations(data);

  Math.max(
    ...[
      ...transcribed.map((e) => e.mutations),
      ...untranscribed.map((e) => e.mutations),
    ]
  );

  //// ------ bar char left  --------- //

  const groupByMutationWoFirstLetter = data.reduce((groups, e, i) => {
    const mutation = e.mutationType.substring(2, e.mutationType.length);
    const signature = {
      mutationType: e.mutationType,
      contribution: e.mutations,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];
    return groups;
  }, {});

  const totalMutationsGroup = Object.entries(groupByMutationWoFirstLetter).map(
    ([mutation, signatures], groupIndex, array) => ({
      mutationType: mutation,
      signatures: signatures,
      total: signatures.reduce((a, e) => a + e.contribution, 0),
    })
  );

  const groupByTotal = totalMutationsGroup.reduce((groups, e, i) => {
    const mutationRegex = /\[(.*)\]/;
    const mutation = e.mutationType.match(mutationRegex)[1];
    const signature = {
      mutationType: e.mutationType,
      contribution: e.total,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];
    return groups;
  }, {});

  const flatSortedTotal = Object.values(groupByTotal).flat();
  const maxValTotal = Math.max(...flatSortedTotal.map((o) => o.contribution));

  const tracesBarTotal = Object.entries(groupByTotal).map(
    ([mutation, signatures], groupIndex, array) => ({
      name: mutation,
      type: 'bar',
      marker: { color: colors[mutation] },
      //   x: signatures.map((e) => e.mutationType),
      //x: signatures.map((e, i) => groupIndex * signatures.length + i),
      x: signatures.map(
        (e, i) =>
          array
            .slice(0, groupIndex)
            .reduce((x0, [_, sigs]) => x0 + sigs.length, 0) + i
      ),
      y: signatures.map((e) => e.contribution),
      hoverinfo: 'x+y',
      showlegend: false,
    })
  );

  //////------------- bar chart right ---------------//////

  const groupByMutationT = transcribed.reduce((groups, e, i) => {
    const mutationRegex = /\[(.*)\]/;
    const mutation = e.mutationType.match(mutationRegex)[1];
    const signature = {
      mutationType: e.mutationType.substring(2, e.mutationType.length),
      contribution: e.mutations,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];

    return groups;
  }, {});

  const totalMutationsGroupT = Object.entries(groupByMutationT).map(
    ([mutation, signatures], groupIndex, array) => ({
      mutationType: mutation,
      signatures: signatures,
      total: signatures.reduce((a, e) => a + e.contribution, 0),
    })
  );

  const groupByMutationU = untranscribed.reduce((groups, e, i) => {
    const mutationRegex = /\[(.*)\]/;
    const mutation = e.mutationType.match(mutationRegex)[1];
    const signature = {
      mutationType: e.mutationType.substring(2, e.mutationType.length),
      contribution: e.mutations,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];
    return groups;
  }, {});

  const totalMutationsGroupU = Object.entries(groupByMutationU).map(
    ([mutation, signatures], groupIndex, array) => ({
      mutationType: mutation,
      signatures: signatures,
      total: signatures.reduce((a, e) => a + e.contribution, 0),
    })
  );

  const groupByMutationN = neutral.reduce((groups, e, i) => {
    const mutationRegex = /\[(.*)\]/;
    const mutation = e.mutationType.match(mutationRegex)[1];
    const signature = {
      mutationType: e.mutationType.substring(2, e.mutationType.length),
      contribution: e.mutations,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];
    return groups;
  }, {});

  const totalMutationsGroupN = Object.entries(groupByMutationN).map(
    ([mutation, signatures], groupIndex, array) => ({
      mutationType: mutation,
      signatures: signatures,
      total: signatures.reduce((a, e) => a + e.contribution, 0),
    })
  );

  const groupByFirstLetter = data.reduce((groups, e, i) => {
    const mutation = e.mutationType.substring(0, 1);
    const signature = {
      mutationType: e.mutationType,
      contribution: e.mutations,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];

    return groups;
  }, {});

  const totalGroupByFirstLetter = Object.entries(groupByFirstLetter).map(
    ([mutation, signatures], groupIndex, array) => ({
      mutationType: mutation,
      signatures: signatures,
      total: signatures.reduce((a, e) => a + e.contribution, 0),
    })
  );

  const flatSortedT = Object.values(totalMutationsGroupT).flat();
  const flatSortedU = Object.values(totalMutationsGroupU).flat();
  const flatSortedN = Object.values(totalMutationsGroupN).flat();
  const flatSortedFirstLetter = Object.values(totalGroupByFirstLetter).flat();

  const maxValByTotal = Math.max(
    ...[
      ...flatSortedT.map((e) => e.total),
      ...flatSortedU.map((e) => e.total),
      ...flatSortedN.map((e) => e.total),
      ...flatSortedFirstLetter.map((e) => e.total),
    ]
  );

  Object.entries(flatSortedFirstLetter).forEach(
    ([key, value], groupIndex, array) => {
      if (value.mutationType === 'T') {
        value.mutationType = 'All';
        flatSortedT.push(value);
      } else if (value.mutationType === 'U') {
        value.mutationType = 'All';
        flatSortedU.push(value);
      } else {
        value.mutationType = 'All';
        flatSortedN.push(value);
      }
    }
  );

  const transcribedTraces = {
    name: 'Transcrribed',
    type: 'bar',
    marker: { color: '#004765' },

    x: flatSortedT.map((element, index, array) => element.total),
    y: flatSortedT.map(
      (element, index, array) => `<b>${element.mutationType}<b>`
    ),
    xaxis: 'x2',
    yaxis: 'y2',
    //hoverinfo: 'x2+y2',
    hovertemplate: '<b>Transcrribed</b><br>%{y}, %{x} <extra></extra>',
    showlegend: true,
    orientation: 'h',
  };

  const untranscribedTraces = {
    name: 'Untranscribed',
    type: 'bar',
    marker: { color: '#E32925' },
    x: flatSortedU.map((element, index, array) => element.total),
    y: flatSortedU.map(
      (element, index, array) => `<b>${element.mutationType}<b>`
    ),
    xaxis: 'x2',
    yaxis: 'y2',
    //hoverinfo: 'x2+y2',
    hovertemplate: '<b>Untranscribed</b><br>%{y}, %{x} <extra></extra>',
    showlegend: true,
    orientation: 'h',
  };

  const neutralTraces = {
    name: 'Nontranscribed',
    type: 'bar',
    marker: { color: '#008001' },
    x: flatSortedN.map((element, index, array) => element.total),
    y: flatSortedN.map(
      (element, index, array) => `<b>${element.mutationType}<b>`
    ),
    xaxis: 'x2',
    yaxis: 'y2',
    //hoverinfo: 'x2+y2',
    hovertemplate: '<b>Nontranscribed</b><br>%{y}, %{x} <extra></extra>',
    showlegend: true,
    orientation: 'h',
  };

  const traces = [
    ...tracesBarTotal,
    neutralTraces,
    untranscribedTraces,
    transcribedTraces,
  ];

  const annotations = Object.entries(groupByTotal).map(
    ([mutation, signatures], groupIndex, array) => ({
      xref: 'x',
      yref: 'paper',
      xanchor: 'bottom',
      yanchor: 'bottom',
      x:
        array
          .slice(0, groupIndex)
          .reduce((x0, [_, sigs]) => x0 + sigs.length, 0) +
        (signatures.length - 1) * 0.5,
      y: 1.04,
      text: `<b>${mutation}</b>`,
      showarrow: false,
      font: {
        size: 18,
      },
      align: 'center',
    })
  );

  const sampleAnnotation = createSampleAnnotation(data);

  const transformU = Object.entries(groupByMutationU).map(
    ([mutation, data]) => ({
      mutation,
      data,
    })
  );

  const mutationTypeNames = transformU
    .map((group) =>
      group.data.map((e) => ({
        mutation: group.mutation,
        mutationType: e.mutationType,
      }))
    )
    .flat();

  function formatTickLabel(mutation, mutationType) {
    const color = colors[mutation];
    const regex = /^(.)\[(.).{2}\](.)$/;
    const match = mutationType.match(regex);
    return `${match[1]}<span style="color:${color}"><b>${match[2]}</b></span>${match[3]}`;
  }

  const shapes = Object.entries(groupByTotal).map(
    ([mutation, _], groupIndex, array) => ({
      type: 'rect',
      xref: 'x',
      yref: 'paper',
      x0: array
        .slice(0, groupIndex)
        .reduce((x0, [_, sigs]) => x0 + sigs.length, -0.4),
      x1: array
        .slice(0, groupIndex + 1)
        .reduce((x0, [_, sigs]) => x0 + sigs.length, -0.6),
      y0: 1.05,
      y1: 1.01,
      fillcolor: colors[mutation],
      line: {
        width: 0,
      },
      mutation: mutation,
    })
  );

  const layout = {
    title: `<b>${title}</b>`,
    hoverlabel: { bgcolor: '#FFF' },
    bargap: 0.3,
    height: 450,
    //width:1080,
    autosize: true,
    legend: {
      x: 1,
      xanchor: 'right',
      y: 0,
      traceorder: 'reversed',
      bgcolor: '#FFFFFF',
      bordercolor: '#E1E1E1',
      borderwidth: 1,
    },
    grid: {
      rows: 1,
      columns: 2,
      pattern: 'independent',
    },
    xaxis: {
      showticklabels: true,
      showline: true,
      tickangle: -90,
      tickfont: {
        family: 'Courier New, monospace',
        color: '#A0A0A0',
      },
      tickmode: 'array',
      tickvals: mutationTypeNames.map((_, i) => i),
      ticktext: mutationTypeNames.map((e) =>
        formatTickLabel(e.mutation, e.mutationType)
      ),
      linecolor: '#E0E0E0',
      linewidth: 1,
      mirror: 'all',
      domain: [0, 0.75],
    },
    yaxis: {
      title: {
        text:
          totalMutations > 1.1
            ? '<b>Number of Single Base Substitutions</b>'
            : '<b>Percentage of Single Base Substitutions</b>',
        font: {
          family: 'Times New Roman',
        },
      },
      autorange: false,
      range: [0, maxValTotal + maxValTotal * 0.2],
      tickcolor: '#D3D3D3',
      linecolor: '#D3D3D3',
      linewidth: 1,
      tickformat: maxValTotal >= 1000 || totalMutations > 1.1 ? '~s' : '.1%',
      ticks: 'inside',
      showgrid: true,
      gridcolor: '#F5F5F5',
      mirror: 'all',
    },

    xaxis2: {
      showticklabels: true,
      showline: true,
      tickfont: {
        size: 12,
      },
      domain: [0.8, 1],
      tickformat: maxValByTotal >= 1000 ? '~s' : '',
      ticks: 'outside',
      linecolor: '#E0E0E0',
      linewidth: 1,
      showgrid: false,
    },
    yaxis2: {
      showline: true,
      tickangle: 0,
      tickfont: {
        size: 12,
      },
      anchor: 'x2',
      categoryorder: 'category descending',
      tickformat: '~s',
      ticks: 'outside',
      linecolor: '#D3D3D3',
      tickcolor: '#D3D3D3',
      linewidth: 1,
      showgrid: false,
    },

    shapes: shapes,
    annotations: [...annotations, sampleAnnotation],
  };

  return { traces, layout };
}

function SBS384(data, title = '') {
  const colors = sbsColor;

  const groupByMutation = data.reduce((groups, e, i) => {
    const mutation = e.mutationType.substring(2, e.mutationType.length);
    const signature = {
      mutationType: e.mutationType,
      contribution: e.mutations,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];
    return groups;
  }, {});
  const flatSorted = Object.values(groupByMutation).flat();

  //group data by 1st letter

  const dataT = [];
  const dataU = [];

  Object.entries(flatSorted).forEach(([key, value], groupIndex, array) => {
    if (value.mutationType.substring(0, 1) === 'T') {
      dataT.push(value);
    } else if (value.mutationType.substring(0, 1) === 'U') {
      dataU.push(value);
    }
  });

  [...dataT, ...dataU].reduce(
    (a, e) => a + parseInt(e.contribution),
    0
  );

  const dataUT = [...dataT, ...dataU];
  const maxVal = Math.max(...dataUT.map((o) => o.contribution));

  const groupByMutationU = dataU.reduce((groups, e, i) => {
    const mutationRegex = /\[(.*)\]/;
    const mutation = e.mutationType.match(mutationRegex)[1];
    const signature = {
      mutationType: e.mutationType.substring(2, e.mutationType.length),
      contribution: e.contribution,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];
    return groups;
  }, {});

  const flatSortedU = Object.values(groupByMutationU)
    .flat()
    .sort((a, b) =>
      a.mutationType
        .substring(0, 5)
        .localeCompare(b.mutationType.substring(0, 5))
    )
    .sort((a, b) =>
      a.mutationType
        .substring(2, 5)
        .localeCompare(b.mutationType.substring(2, 5))
    );

  const groupByMutationT = dataT.reduce((groups, e, i) => {
    const mutationRegex = /\[(.*)\]/;
    const mutation = e.mutationType.match(mutationRegex)[1];
    const signature = {
      mutationType: e.mutationType.substring(2, e.mutationType.length),
      contribution: e.contribution,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];
    return groups;
  }, {});

  const flatSortedT = Object.values(groupByMutationT)
    .flat()
    .sort((a, b) =>
      a.mutationType
        .substring(0, 5)
        .localeCompare(b.mutationType.substring(0, 5))
    )
    .sort((a, b) =>
      a.mutationType
        .substring(2, a.mutationType.length)
        .localeCompare(b.mutationType.substring(2, a.mutationType.length))
    )
    .sort((a, b) =>
      a.mutationType
        .substring(0, 5)
        .localeCompare(b.mutationType.substring(0, 5))
    )
    .sort((a, b) =>
      a.mutationType
        .substring(2, 5)
        .localeCompare(b.mutationType.substring(2, 5))
    );

  const tracesT = {
    name: 'Transcrribed Strand',
    type: 'bar',
    marker: { color: '#004765' },
    x: flatSortedT.map((element, index, array) => index),
    y: flatSortedT.map((element, index, array) => element.contribution),
    hovertemplate: '<b>Transcrribed</b><br>%{x}, %{y} <extra></extra>',
    //hoverinfo: 'x+y',
    showlegend: true,
  };

  const tracesU = {
    name: 'Untranscribed Strand',
    type: 'bar',
    marker: { color: '#E32925' },
    x: flatSortedU.map((element, index, array) => index),
    y: flatSortedU.map((element, index, array) => element.contribution),
    hovertemplate: '<b>Untranscribed Strand</b><br>%{x}, %{y} <extra></extra>',
    //hoverinfo: 'x+y',
    showlegend: true,
  };

  const traces = [tracesT, tracesU];

  const annotations = Object.entries(groupByMutationT).map(
    ([mutation, signatures], groupIndex, array) => ({
      xref: 'x',
      yref: 'paper',
      xanchor: 'bottom',
      yanchor: 'bottom',
      x:
        array
          .slice(0, groupIndex)
          .reduce((x0, [_, sigs]) => x0 + sigs.length, 0) +
        (signatures.length - 1) * 0.5,
      y: 1.04,
      text: `<b>${mutation}</b>`,
      showarrow: false,
      font: {
        size: 18,
      },
      align: 'center',
    })
  );

  const sampleAnnotation = createSampleAnnotation(data);

  const shapes1 = Object.entries(groupByMutationT).map(
    ([mutation, _], groupIndex, array) => ({
      type: 'rect',
      xref: 'x',
      yref: 'paper',
      x0: array
        .slice(0, groupIndex)
        .reduce((x0, [_, sigs]) => x0 + sigs.length, -0.4),
      x1: array
        .slice(0, groupIndex + 1)
        .reduce((x0, [_, sigs]) => x0 + sigs.length, -0.6),
      y0: 1.05,
      y1: 1.01,
      fillcolor: colors[mutation],
      line: {
        width: 0,
      },
      mutation: mutation,
    })
  );
  const shapes2 = Object.entries(groupByMutationT).map(
    ([mutation, signatures], groupIndex, array) => ({
      type: 'rect',
      xref: 'x',
      yref: 'paper',
      y0: 1,
      x0: array
        .slice(0, groupIndex)
        .reduce((x0, [_, sigs]) => x0 + sigs.length, -0.4),
      x1: array
        .slice(0, groupIndex + 1)
        .reduce((x0, [_, sigs]) => x0 + sigs.length, -0.6),
      y1: 0,
      fillcolor: colors[mutation],
      line: {
        width: 0,
      },
      opacity: 0.15,
    })
  );

  const transformU = Object.entries(groupByMutationU).map(
    ([mutation, data]) => ({
      mutation,
      data,
    })
  );

  const mutationTypeNames = transformU
    .map((group) =>
      group.data.map((e) => ({
        mutation: group.mutation,
        mutationType: e.mutationType,
      }))
    )
    .flat();

  function formatTickLabel(mutation, mutationType) {
    const color = colors[mutation];
    const regex = /^(.)\[(.).{2}\](.)$/;
    const match = mutationType.match(regex);
    return `${match[1]}<span style="color:${color}"><b>${match[2]}</b></span>${match[3]}`;
  }

  const layout = {
    title: `<b>${title}</b>`,
    hoverlabel: { bgcolor: '#FFF' },
    bargap: 0.3,
    height: 450,
    //width:1080,
    autosize: true,
    legend: {
      x: 1,
      xanchor: 'right',
      y: 1,
      bgcolor: '#FFFFFF',
      bordercolor: '#E1E1E1',
      borderwidth: 1,
    },

    xaxis: {
      showticklabels: true,
      showline: true,
      tickangle: -90,
      tickfont: {
        family: 'Courier New, monospace',
        color: '#A0A0A0',
      },
      tickmode: 'array',
      tickvals: mutationTypeNames.map((_, i) => i),
      ticktext: mutationTypeNames.map((e) =>
        formatTickLabel(e.mutation, e.mutationType)
      ),
      linecolor: '#E0E0E0',
      linewidth: 1,
      mirror: 'all',
    },
    yaxis: {
      title: {
        text: '<b>Number of Single Base Substitutions</b>',
        font: {
          family: 'Times New Roman',
        },
      },
      autorange: false,
      range: [0, maxVal + maxVal * 0.2],
      tickcolor: '#D3D3D3',
      linewidth: 1,
      mirror: 'all',
      categoryorder: 'category descending',
    },
    shapes: [...shapes1, ...shapes2],
    annotations: [...annotations, sampleAnnotation],
  };

  return { traces, layout };
}

function SBS1536(data, title = '') {
  const colors = sbsColor;

  const heatmapColorscale = [
    [0, 'rgb(56,56,156'],
    [0.2, 'rgb(56,56,156'],
    [0.2, 'rgb(106,106,128'],
    [0.4, 'rgb(106,106,128'],
    [0.4, 'rgb(155,146,98'],
    [0.6, 'rgb(155,146,98'],
    [0.6, 'rgb(205,186,69'],
    [0.8, 'rgb(205,186,69'],
    [0.8, 'rgb(255,255,39)'],
    [1, 'rgb(255,255,39)'],
  ];

  const totalMutations = data.reduce((a, e) => a + parseInt(e.mutations), 0);
  const chunks = (a, size) =>
    Array.from(new Array(Math.ceil(a.length / size)), (_, i) =>
      a.slice(i * size, i * size + size)
    );

  // const maxValMutation = Math.max(...data.map((o) => o.mutations));
  // console.log("maxValMutation:---");
  // console.log(maxValMutation);

  const groupByMutationInner = data.reduce((groups, e, i) => {
    const mutation = e.mutationType.substring(1, 8);
    const signature = {
      mutationType: e.mutationType,
      contribution: e.mutations,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];
    return groups;
  }, {});

  const groupByMutationOuter = data.reduce((groups, e, i) => {
    const mutation =
      e.mutationType[0] + e.mutationType[e.mutationType.length - 1];
    const signature = {
      mutationType: e.mutationType,
      contribution: e.mutations,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];
    return groups;
  }, {});

  /////---------------- Bar Chart ---------------------------------////

  const totalMutationsGroup = Object.entries(groupByMutationInner).map(
    ([mutation, signatures], groupIndex, array) => ({
      mutationType: mutation,
      signatures: signatures,
      total: signatures.reduce((a, e) => a + parseInt(e.contribution), 0),
    })
  );

  const groupByTotal = totalMutationsGroup.reduce((groups, e, i) => {
    const mutationRegex = /\[(.*)\]/;
    const mutation = e.mutationType.match(mutationRegex)[1];
    const signature = {
      mutationType: e.mutationType,
      contribution: e.total,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];
    return groups;
  }, {});

  const flatSorted = Object.values(groupByTotal).flat();
  //const mutationTitle = Object.keys(groupByTotal).flat();

  const maxVal = Math.max(...flatSorted.map((o) => o.contribution));

  const tracesBar = Object.entries(groupByTotal).map(
    ([mutation, signatures], groupIndex, array) => ({
      name: mutation,
      type: 'bar',
      marker: { color: colors[mutation] },
      //   x: signatures.map((e) => e.mutationType),
      //x: signatures.map((e, i) => groupIndex * signatures.length + i),
      x: signatures.map(
        (e, i) =>
          array
            .slice(0, groupIndex)
            .reduce((x0, [_, sigs]) => x0 + sigs.length, 0) + i
      ),
      y: signatures.map((e) => e.contribution),
      hoverinfo: 'x+y',
      showlegend: false,
    })
  );

  ////// ------- Heat Map 1 -----////
  const heatmapY2 = [];
  const heatmapZ2 = [];
  const heatmapX2 = [];

  const groupByMutationFront = data.reduce((groups, e, i) => {
    const mutation = e.mutationType.substring(0, e.mutationType.length - 1);
    const signature = {
      mutationType: e.mutationType,
      contribution: e.mutations,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];
    return groups;
  }, {});

  const mutationSumFront = Object.entries(groupByMutationFront).map(
    ([key, value]) => ({
      mutationType: key,
      contribution: value.reduce((a, e) => a + parseInt(e.contribution), 0),
    })
  );

  const arrayMutationSumFront = Object.values(mutationSumFront).flat();
  const groupByMutation2 = arrayMutationSumFront.reduce((groups, e, i) => {
    const mutationRegex = /\[(.*)\]/;
    const mutation = e.mutationType.match(mutationRegex)[1];
    const signature = {
      mutationType: e.mutationType,
      contribution: e.contribution,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];
    return groups;
  }, {});

  Object.entries(groupByMutation2).forEach(
    ([key, value], groupIndex, array) => {
      heatmapY2.push(Object.entries(value).map(([k, v]) => v.mutationType));
      heatmapZ2.push(
        Object.entries(value).map(([k, v]) => v.contribution / totalMutations)
      );
      heatmapX2.push(
        value.map(
          (e, i) =>
            array
              .slice(0, groupIndex)
              .reduce((x0, [_, sigs]) => x0 + sigs.length, 0) + i
        )
      );
    }
  );

  let heatmapY2_c = [
    heatmapY2[0][0].charAt(0) + '--N',
    heatmapY2[0][16].charAt(0) + '--N',
    heatmapY2[0][32].charAt(0) + '--N',
    heatmapY2[0][48].charAt(0) + '--N',
  ];

  let heatMapZ2_0 = chunks(heatmapZ2[0], 16);
  let heatMapZ2_1 = chunks(heatmapZ2[1], 16);
  let heatMapZ2_2 = chunks(heatmapZ2[2], 16);
  let heatMapZ2_3 = chunks(heatmapZ2[3], 16);
  let heatMapZ2_4 = chunks(heatmapZ2[4], 16);
  let heatMapZ2_5 = chunks(heatmapZ2[5], 16);

  const heatMapZFinal2 = [
    heatMapZ2_0,
    heatMapZ2_1,
    heatMapZ2_2,
    heatMapZ2_3,
    heatMapZ2_4,
    heatMapZ2_5,
  ];
  const maxZ2 = Math.max(...heatMapZFinal2.flat(Infinity));
  const traceHeatMap2 = heatMapZFinal2.map((num, index, array) => ({
    colorbar: { len: 0.2, y: 0.625 },
    colorscale: heatmapColorscale,
    zmin: 0,
    zmax: maxZ2 + maxZ2 * 0.1,
    z: num,
    y: heatmapY2_c,
    type: 'heatmap',
    hoverongaps: false,
    xaxis: 'x',
    yaxis: 'y2',
    x: num.map(
      (e, i) =>
        array.slice(0, index).reduce((x0, [_, sigs]) => x0 + sigs.length, 0) + i
    ),
    xgap: 0.1,
    ygap: 0.1,
    hovertemplate: 'x: %{x}<br>y: %{y}<br>Value: %{z}<extra></extra>',
  }));

  ////// ------------------- Heat Map 2 --------------------------------////

  const heatmapY3 = [];
  const heatmapZ3 = [];
  const heatmapX3 = [];
  const groupByMutationBack = data.reduce((groups, e, i) => {
    const mutation = e.mutationType.substring(1, e.mutationType.length);
    const signature = {
      mutationType: e.mutationType,
      contribution: e.mutations,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];
    return groups;
  }, {});

  // console.log("groupByMutationBack:---");
  // console.log(groupByMutationBack);

  const mutationSumBack = Object.entries(groupByMutationBack).map(
    ([key, value]) => ({
      mutationType: key,
      contribution: value.reduce((a, e) => a + parseInt(e.contribution), 0),
    })
  );

  // console.log("mutationsumBack:---");
  // console.log(mutationsumBack);

  // sort by the last letter
  mutationSumBack.sort((a, b) =>
    a.mutationType.substring(a.mutationType.length - 1, a.mutationType.length) <
    b.mutationType.substring(b.mutationType.length - 1, b.mutationType.length)
      ? -1
      : b.mutationType.substring(
          b.mutationType.length - 1,
          b.mutationType.length
        ) <
        a.mutationType.substring(
          a.mutationType.length - 1,
          a.mutationType.length
        )
      ? 1
      : 0
  );

  const arrayMutationSumBack = Object.values(mutationSumBack).flat();

  const groupByMutation3 = arrayMutationSumBack.reduce((groups, e, i) => {
    const mutationRegex = /\[(.*)\]/;
    const mutation = e.mutationType.match(mutationRegex)[1];
    const signature = {
      mutationType: e.mutationType,
      contribution: e.contribution,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];
    return groups;
  }, {});

  Object.entries(groupByMutation3).forEach(
    ([key, value], groupIndex, array) => {
      heatmapY3.push(Object.entries(value).map(([k, v]) => v.mutationType));
      heatmapZ3.push(
        Object.entries(value).map(([k, v]) => v.contribution / totalMutations)
      );
      heatmapX3.push(
        value.map(
          (e, i) =>
            array
              .slice(0, groupIndex)
              .reduce((x0, [_, sigs]) => x0 + sigs.length, 0) + i
        )
      );
    }
  );

  let heatmapY3_c = [
    'N--' + heatmapY3[0][0].charAt(heatmapY3[0][0].length - 1),
    'N--' + heatmapY3[0][16].charAt(heatmapY3[0][16].length - 1),
    'N--' + heatmapY3[0][32].charAt(heatmapY3[0][32].length - 1),
    'N--' + heatmapY3[0][48].charAt(heatmapY3[0][48].length - 1),
  ];

  let heatMapZ3_0 = chunks(heatmapZ3[0], 16);
  let heatMapZ3_1 = chunks(heatmapZ3[1], 16);
  let heatMapZ3_2 = chunks(heatmapZ3[2], 16);
  let heatMapZ3_3 = chunks(heatmapZ3[3], 16);
  let heatMapZ3_4 = chunks(heatmapZ3[4], 16);
  let heatMapZ3_5 = chunks(heatmapZ3[5], 16);

  const heatMapZFinal3 = [
    heatMapZ3_0,
    heatMapZ3_1,
    heatMapZ3_2,
    heatMapZ3_3,
    heatMapZ3_4,
    heatMapZ3_5,
  ];

  const maxZ3 = Math.max(...heatMapZFinal2.flat(Infinity));
  const traceHeatMap3 = heatMapZFinal3.map((num, index, array) => ({
    colorbar: { len: 0.2, y: 0.44 },
    colorscale: heatmapColorscale,
    zmin: 0,
    zmax: maxZ3 + maxZ3 * 0.1,
    z: num,
    y: heatmapY3_c,
    type: 'heatmap',
    hoverongaps: false,
    xaxis: 'x',
    yaxis: 'y3',
    x: num.map(
      (e, i) =>
        array.slice(0, index).reduce((x0, [_, sigs]) => x0 + sigs.length, 0) + i
    ),
    xgap: 0.1,
    ygap: 0.1,
    hovertemplate: 'x: %{x}<br>y: %{y}<br>Value: %{z}<extra></extra>',
  }));
  ////--------------------- Heat Map Total --------------------------//
  const heatmapY = [];
  const heatmapZ = [];
  const heatmapX = [];

  let heatMapZ0 = [];
  let heatMapZ1 = [];
  let heatMapZ2 = [];
  let heatMapZ3 = [];
  let heatMapZ4 = [];
  let heatMapZ5 = [];

  Object.entries(groupByMutationOuter).forEach(
    ([key, value], groupIndex, array) => {
      value.sort((a, b) =>
        a.mutationType.substring(3, 6) < b.mutationType.substring(3, 6)
          ? -1
          : b.mutationType.substring(3, 6) < a.mutationType.substring(3, 6)
          ? 1
          : 0
      );
      //console.log(value);
      heatmapY.push(key.charAt(0) + '--' + key.charAt(key.length - 1));

      //console.log(totalMutations);
      //console.log(value);
      //console.log(Object.entries(value).map(([k, v]) => v.contribution));
      heatmapZ.push(
        Object.entries(value).map(([k, v]) => v.contribution / totalMutations)
      );
      heatmapX.push(
        value.map(
          (e, i) =>
            array
              .slice(0, groupIndex)
              .reduce((x0, [_, sigs]) => x0 + sigs.length, 0) + i
        )
      );
    }
  );

  heatmapZ.forEach((item, index) => {
    heatMapZ0.push(item.slice().splice(0, 16));
    heatMapZ1.push(item.slice().splice(16, 16));
    heatMapZ2.push(item.slice().splice(32, 16));
    heatMapZ3.push(item.slice().splice(48, 16));
    heatMapZ4.push(item.slice().splice(64, 16));
    heatMapZ5.push(item.slice().splice(80, 16));
  });

  const heatMapZFinal = [
    heatMapZ0,
    heatMapZ1,
    heatMapZ2,
    heatMapZ3,
    heatMapZ4,
    heatMapZ5,
  ];

  const maxZ = Math.max(...heatMapZFinal.flat(Infinity));
  const traceHeatMap = heatMapZFinal.map((num, index, array) => ({
    colorbar: { len: 0.38, y: 0.17 },
    colorscale: heatmapColorscale,
    zmin: 0,
    zmax: maxZ + maxZ * 0.1,
    z: num,
    y: heatmapY,

    type: 'heatmap',
    hoverongaps: false,
    xaxis: 'x',
    yaxis: 'y4',
    x: num.map(
      (e, i) =>
        array.slice(0, index).reduce((x0, [_, sigs]) => x0 + sigs.length, 0) + i
    ),
    test: heatmapY.map((a) => a.replace('--', `%{x}`)),
    array: array,
    num: num,
    xgap: 0.1,
    ygap: 0.1,
    hovertemplate: 'x: %{x}<br>y: %{y}<br>Value: %{z}<extra></extra>',
  }));

  const traces = [
    ...tracesBar,
    ...traceHeatMap,
    ...traceHeatMap2,
    ...traceHeatMap3,
  ];

  //console.log('traces:');
  //console.log(traces);
  const annotations = Object.entries(groupByTotal).map(
    ([mutation, signatures], groupIndex, array) => ({
      xref: 'x',
      yref: 'paper',
      xanchor: 'bottom',
      yanchor: 'bottom',
      x:
        array
          .slice(0, groupIndex)
          .reduce((x0, [_, sigs]) => x0 + sigs.length, 0) +
        (signatures.length - 1) * 0.5,
      y: 1.04,
      text: `<b>${mutation}</b>`,
      showarrow: false,
      font: {
        size: 18,
      },
      align: 'center',
    })
  );

  const sampleAnnotation = createSampleAnnotation(data, false, 0.95);

  const shapes = Object.entries(groupByTotal).map(
    ([mutation, _], groupIndex, array) => ({
      type: 'rect',
      xref: 'x',
      yref: 'paper',
      x0: array
        .slice(0, groupIndex)
        .reduce((x0, [_, sigs]) => x0 + sigs.length, -0.4),
      x1: array
        .slice(0, groupIndex + 1)
        .reduce((x0, [_, sigs]) => x0 + sigs.length, -0.6),
      y0: 1.04,
      y1: 1.01,
      fillcolor: colors[mutation],
      line: {
        width: 0,
      },
    })
  );

  const xannotations = flatSorted.map((num, index) => ({
    xref: 'x',
    yref: 'paper',
    xanchor: 'bottom',
    yanchor: 'bottom',
    x: index,
    y: -0.04,
    text: num.mutationType.replace(/\[(.*)\]/, '-'),
    showarrow: false,
    font: {
      size: 7.5,
      family: 'Courier New, monospace',
    },
    align: 'center',
    num: num,
    index: index,
    textangle: -90,
  }));

  const yLabelAnnotation = {
    xref: 'paper',
    yref: 'paper',
    xanchor: 'top',
    yanchor: 'top',
    x: -0.045,
    y: 1.02,
    text: '<b>Number of Single Base Substitutions</b>',
    showarrow: false,
    font: {
      size: 10,
      family: 'Times New Roman',
    },
    align: 'center',
    textangle: -90,
  };

  const layout = {
    title: `<b>${title}</b>`,
    hoverlabel: { bgcolor: '#FFF' },
    height: 800,
    width: 1080,
    grid: {
      rows: 4,
      columns: 1,
    },
    xaxis: {
      showticklabels: false,
      showline: true,
      tickangle: -90,
      tickfont: {
        family: 'Courier New, monospace',
        size: 8,
      },
      tickmode: 'array',
      tickvals: flatSorted.map((_, i) => i),
      ticktext: flatSorted.map((e) => e.mutationType),
      linecolor: '#D3D3D3',
      linewidth: 1,
      mirror: 'all',
      tickformat: maxVal > 1000 ? '~s' : '',
      ticks: '',
    },
    yaxis: {
      //title: 'Number of Single Base Substitutions',
      autorange: false,
      range: [0, maxVal + maxVal * 0.2],
      linecolor: '#D3D3D3',
      linewidth: 1,
      mirror: 'all',
      domain: [0.72, 1],
      tickformat: maxVal > 1000 ? '~s' : '',
      tickfont: {
        family: 'Courier New, monospace',
        size: 8,
      },
      showgrid: true,
      gridcolor: '#F5F5F5',
    },
    yaxis2: {
      autorange: true,
      linecolor: '#D3D3D3',
      linewidth: 1,
      ticks: '',
      mirror: 'all',
      anchor: 'x',
      domain: [0.54, 0.715],
      tickfont: {
        family: 'Courier New, monospace',
        size: 8,
      },
    },
    yaxis3: {
      autorange: true,
      linecolor: '#D3D3D3',
      linewidth: 1,
      ticks: '',
      mirror: 'all',
      anchor: 'x',
      tickfont: {
        family: 'Courier New, monospace',
        size: 8,
      },
      domain: [0.36, 0.535],
    },
    yaxis4: {
      autorange: true,
      linecolor: '#D3D3D3',
      linewidth: 1,
      ticks: '',
      mirror: 'all',
      anchor: 'x',
      //dtick: 1,
      tickfont: {
        family: 'Courier New, monospace',
        size: 8,
      },
      domain: [0, 0.35],
    },

    // autosize: false,
    shapes: shapes,
    annotations: [
      ...annotations,
      sampleAnnotation,
      ...xannotations,
      yLabelAnnotation,
    ],
  };
  // console.log("layout");
  //console.log(layout);

  return { traces, layout };
}

function DBS78(apiData, title = '') {
  const colors = dbs78Color;
  const mutationRegex = /^(.{2})/;

  const mutationGroupSort = (a, b) => {
    const order = Object.keys(colors);
    return order.indexOf(a.mutation) - order.indexOf(b.mutation);
  };

  const data = groupDataByMutation(apiData, mutationRegex, mutationGroupSort);
  const maxMutation = getMaxMutations(apiData);
  const totalMutations = getTotalMutations(apiData);
  const mutationTypeNames = data
    .map((group) => group.data.map((e) => e.mutationType.slice(-2)))
    .flat();

  const traces = data.map((group, groupIndex, array) => ({
    name: group.mutation,
    type: 'bar',
    marker: { color: colors[group.mutation] },
    x: [...group.data.keys()].map(
      (e) =>
        e +
        array
          .slice(0, groupIndex)
          .reduce((lastIndex, b) => lastIndex + b.data.length, 0)
    ),
    y: group.data.map((e) => e.mutations || e.contribution),
    hoverinfo: 'x+y',
    showlegend: false,
  }));

  const sampleAnnotation = createSampleAnnotation(apiData);
  const mutationAnnotation = createMutationAnnotations(data, '>NN');
  const mutationShapes = createMutationShapes(data, colors);

  const layout = {
    title: `<b>${title}</b>`,
    hoverlabel: { bgcolor: '#FFF' },
    height: 450,
    //width:1080,
    autosize: true,
    xaxis: {
      showline: true,
      tickangle: -90,
      tickfont: {
        family: 'Courier New, monospace',
        size: 14,
      },
      tickmode: 'array',
      tickvals: mutationTypeNames.map((_, i) => i),
      ticktext: mutationTypeNames.map((e) => e),
      linecolor: 'black',
      linewidth: 1,
      mirror: 'all',
    },
    yaxis: {
      title: {
        text:
          parseFloat(totalMutations).toFixed(2) > 1
            ? '<b>Number of Double Base Substitutions</b>'
            : '<b>Percentage of Double Base Substitutions</b>',
        font: {
          family: 'Times New Roman',
        },
      },
      autorange: false,
      range: [0, maxMutation * 1.2],
      linecolor: 'black',
      linewidth: 1,
      tickformat: parseFloat(totalMutations).toFixed(2) > 1 ? '~s' : '.1%',
      ticks: 'inside',
      tickcolor: '#D3D3D3',
      showgrid: true,
      mirror: 'all',
      gridcolor: '#F5F5F5',
    },

    shapes: mutationShapes,
    annotations: [...mutationAnnotation, sampleAnnotation],
  };

  return { traces, layout };
}

function DBS186(data, title = '') {
  const colors = {
    'CC>': '#09BCEE',
    'CT>': '#A0CE63',
    'TC>': '#FE9898',
    'TT>': '#FE8002',
  };

  const arrayDataT = [];
  const arrayDataU = [];

  Object.values(data).forEach((group) => {
    if (group.mutationType.substring(0, 1) === 'T') {
      arrayDataT.push(group);
    } else if (group.mutationType.substring(0, 1) === 'U') {
      arrayDataU.push(group);
    }
  });

  [...arrayDataT, ...arrayDataU].reduce(
    (a, e) => a + parseInt(e.mutations),
    0
  );
  const dataUT = [...arrayDataT, ...arrayDataU];

  const maxVal = Math.max(...dataUT.map((o) => o.mutations));

  // group data by dominant mutation
  const T_groupByMutation = arrayDataT.reduce((groups, e, i) => {
    const mutation = e.mutationType.substring(2, 4);
    const signature = {
      mutationType: e.mutationType,
      contribution: e.mutations,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];
    return groups;
  }, {});

  const T_flatSorted = Object.values(T_groupByMutation).flat();

  const tracesT = {
    name: 'Transcrribed Strand',
    type: 'bar',
    marker: { color: '#004765' },
    x: T_flatSorted.map((element, index, array) => index),
    y: T_flatSorted.map((element, index, array) => element.contribution),
    hovertemplate: '<b>Transcribed Strand</b><br>%{x}, %{y}<extra></extra>',
    //hoverinfo: 'x+y',
    showlegend: true,
  };

  const U_groupByMutation = arrayDataU.reduce((groups, e, i) => {
    const mutation = e.mutationType.substring(2, 4);
    const signature = {
      mutationType: e.mutationType,
      contribution: e.mutations,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];
    return groups;
  }, {});

  const U_flatSorted = Object.values(U_groupByMutation).flat();

  const tracesU = {
    name: 'Untranscribed Strand',
    type: 'bar',
    marker: { color: '#E32925' },
    x: U_flatSorted.map((element, index, array) => index),
    y: U_flatSorted.map((element, index, array) => element.contribution),
    hovertemplate: '<b>Untranscribed Strand</b><br>%{x}, %{y}<extra></extra>',
    //hoverinfo: 'x+y',
    showlegend: true,
  };

  const traces = [tracesT, tracesU];

  const annotations = Object.entries(T_groupByMutation).map(
    ([mutation, signatures], groupIndex, array) => ({
      xref: 'x',
      yref: 'paper',
      xanchor: 'bottom',
      yanchor: 'bottom',
      x:
        array
          .slice(0, groupIndex)
          .reduce((x0, [_, sigs]) => x0 + sigs.length, 0) +
        (signatures.length - 1) * 0.5,
      y: 1.04,
      text: `<b>${mutation}>NN</b>`,
      showarrow: false,
      font: {
        size: 18,
      },
      align: 'center',
    })
  );

  const shapes1 = Object.entries(T_groupByMutation).map(
    ([mutation, signatures], groupIndex, array) => ({
      type: 'rect',
      xref: 'x',
      yref: 'paper',
      x0: array
        .slice(0, groupIndex)
        .reduce((x0, [_, signatures]) => x0 + signatures.length, -0.4),
      // x0: groupIndex * 16 - 0.4,
      x1: array
        .slice(0, groupIndex + 1)
        .reduce((x0, [_, signatures]) => x0 + signatures.length, -0.6),
      // x1: groupIndex * 16 + signatures.length - 0.6,
      y0: 1.05,
      y1: 1.01,
      fillcolor:
        colors[
          signatures[0].mutationType.substring(
            2,
            signatures[0].mutationType.length - 2
          )
        ],
      line: {
        width: 0,
      },
    })
  );
  const shapes2 = Object.entries(T_groupByMutation).map(
    ([mutation, signatures], groupIndex, array) => ({
      type: 'rect',
      xref: 'x',
      yref: 'paper',
      y0: 1,
      x0: array
        .slice(0, groupIndex)
        .reduce((x0, [_, sigs]) => x0 + sigs.length, -0.4),
      x1: array
        .slice(0, groupIndex + 1)
        .reduce((x0, [_, sigs]) => x0 + sigs.length, -0.6),
      y1: 0,
      fillcolor:
        colors[
          signatures[0].mutationType.substring(
            2,
            signatures[0].mutationType.length - 2
          )
        ],
      line: {
        width: 0,
      },
      opacity: 0.15,
    })
  );

  const sampleAnnotation = createSampleAnnotation(data);

  const layout = {
    title: `<b>${title}</b>`,
    hoverlabel: { bgcolor: '#FFF' },
    showlegend: true,
    height: 600,
    //width:1080,
    autosize: true,
    legend: {
      x: 1,
      xanchor: 'right',
      y: 1,
      bgcolor: '#FFFFFF',
      bordercolor: '#E1E1E1',
      borderwidth: 1,
    },
    xaxis: {
      showticklabels: true,
      showline: true,
      tickangle: -90,
      tickfont: {
        family: 'Courier New, monospace',
        size: 22,
      },
      tickmode: 'array',
      tickvals: T_flatSorted.map((_, i) => i),
      ticktext: T_flatSorted.map((e) =>
        e.mutationType.substring(
          e.mutationType.length - 2,
          e.mutationType.length
        )
      ),
      linecolor: '#E0E0E0',
      linewidth: 1,
      mirror: 'all',
    },
    yaxis: {
      title: {
        text: '<b>Number of Double Base Substitutions</b>',
        font: {
          family: 'Times New Roman',
          size: 22,
        },
      },
      autorange: false,
      range: [0, maxVal + maxVal * 5],
      ticks: 'inside',
      linecolor: '#E0E0E0',
      tickcolor: '#D3D3D3',
      linewidth: 1,
      mirror: 'all',
      tickfont: {
        size: 16,
      },
      showgrid: true,
      gridcolor: '#F5F5F5',
    },

    shapes: [...shapes1, ...shapes2],
    annotations: [...annotations, sampleAnnotation],
  };

  return { traces, layout };
}

function ID28(data, title = '') {
  const colors = {
    '1:Del:C': '#FBBD6F',
    '1:Del:T': '#FE8002',
    '1:Ins:C': '#AEDD8A',
    '1:Ins:T': '#35A12E',
    'o:': '#1764AA',
  };
  const annotationColors = {
    '1:Del:C': 'black',
    '1:Del:T': 'white',
    '1:Ins:C': 'black',
    '1:Ins:T': 'white',
    'o:': '#1764AA',
  };
  const arrayIDAnnXTop = ['1bp Deletion', '1bp Insertion', '>1bp'],
    arrayIDAnnXBot = ['Homopolymer Length', 'Homopolymer Length', 'Type'],
    arrayIDAnnXLabel = [5, 17, 25],
    arrayIDAnnotationTop = [],
    arrayIDAnnotationBot = [];

  data.reduce((a, e) => a + parseInt(e.mutations), 0);

  const maxVal = Math.max(...data.map((o) => o.mutations));

  const data1 = data.slice(0, data.length - 4);
  const data2 = data.slice(-4);
  //data2.push(data2.shift());

  // group data by dominant mutation
  const groupByMutation = data1.reduce((groups, e, i) => {
    const mutationRegex = /^.{0,7}/;
    const mutation = e.mutationType.match(mutationRegex)[0];

    const signature = {
      mutationType: e.mutationType,
      contribution: e.mutations,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];
    return groups;
  }, {});

  //console.log(groupByMutation);

  const groupByFirstGroup = Object.fromEntries(
    Object.entries(groupByMutation).slice(0, 4)
  );

  const arrayID1 = Object.keys(groupByFirstGroup).map(function (key) {
    return groupByFirstGroup[key];
  });

  const arrayID2_Mod = data2.map((element) => ({
    mutationType: 'o:' + element.mutationType,
    contribution: element.mutations,
  }));

  const groupO = arrayID2_Mod.reduce((r, a) => {
    let m;
    m = a.mutationType.match(a.mutationType.substr(0, 1));
    const s = {
      mutationType: a.mutationType,
      contribution: a.contribution,
    };
    r[m] = r[m] ? [...r[m], a] : [s];
    return r;
  }, {});

  const arrayID2 = Object.keys(groupO).map(function (key) {
    return groupO[key];
  });
  const arrayID = [...arrayID1, ...arrayID2];
  const flatSorted = Object.values(arrayID).flat();

  Object.values(arrayID).forEach((group) => {
    if (group.length > 1) {
      arrayIDAnnotationTop.push(
        group[Math.floor(group.length / 2)].mutationType
      );
    } else {
      arrayIDAnnotationTop.push(group[0].mutationType);
    }
    group.forEach((e) => {
      //arrayIDAnnotationBot.push(e.mutationType);
      let lastNum = e.mutationType.substring(
        e.mutationType.length - 1,
        e.mutationType.length
      );
      let newNum;
      if (e.mutationType.substring(0, 1) === 'o') {
        newNum = e.mutationType;
      } else {
        if (e.mutationType.substring(2, 5) === 'Del') {
          lastNum = +lastNum + 1;
        }

        if ((e.mutationType.substring(2, 5) === 'Del') & (+lastNum > 5)) {
          newNum = lastNum + '+';
        } else if (
          (e.mutationType.substring(2, 5) !== 'Del') &
          (+lastNum > 4)
        ) {
          newNum = lastNum + '+';
        } else {
          newNum = lastNum + '';
        }
      }

      arrayIDAnnotationBot.push(newNum);
    });
  });

  const traces = Object.entries(arrayID).map(
    ([mutation, signatures], groupIndex, array) => ({
      name: mutation,
      signature: signatures,
      type: 'bar',
      marker: {
        color:
          signatures[0].mutationType.substring(0, 1) === 'o'
            ? '#1764AA'
            : colors[
                signatures[0].mutationType.substring(
                  0,
                  signatures[0].mutationType.length - 2
                )
              ],
      },
      x: signatures.map(
        (e, i) =>
          array
            .slice(0, groupIndex)
            .reduce((x0, [_, sigs]) => x0 + sigs.length, 0) + i
      ),
      y: signatures.map((e) => e.contribution),
      customdata: signatures.map((e) => ({
        mutationType:
          e.mutationType.substring(2, 5) === 'Del' ? 'Deletion' : 'Insertion',
        xval:
          e.mutationType.substring(2, 5) === 'Del'
            ? +e.mutationType.slice(-1) + 1
            : e.mutationType.slice(-1),
      })),
      hovertemplate: '%{y} indels<extra></extra>',
      //hoverinfo: 'x+y',
      showlegend: false,
    })
  );

  const annotations1 = Object.entries(arrayID).map(
    ([mutation, signatures], groupIndex, array) => ({
      xref: 'x',
      yref: 'paper',
      xanchor: 'bottom',
      yanchor: 'bottom',
      x:
        array
          .slice(0, groupIndex)
          .reduce((x0, [_, sigs]) => x0 + sigs.length, 0) +
        (signatures.length - 1) * 0.5,
      y: 1.01,
      text:
        groupIndex < 4
          ? `<b>${signatures[0].mutationType.substring(
              signatures[0].mutationType.length - 3,
              signatures[0].mutationType.length - 2
            )}</b>`
          : `<b>${signatures[0].mutationType.substring(0, 1)}</b>`,
      showarrow: false,
      font: {
        size: 14,
        color:
          signatures[0].mutationType.substring(0, 1) === 'o'
            ? '#1764AA'
            : annotationColors[
                signatures[0].mutationType.substring(
                  0,
                  signatures[0].mutationType.length - 2
                )
              ],
      },
      align: 'center',
      signatures: signatures,
      mutation: mutation,
      groupIndex: groupIndex,
    })
  );
  const annotations2 = arrayIDAnnotationBot.map((num, index) => ({
    xref: 'x',
    yref: 'paper',
    xanchor: 'bottom',
    yanchor: 'bottom',
    x: index,
    y: num.substring(0, 1) === 'o' ? -0.12 : -0.1,
    xnum: parseInt(num.substring(num.length - 1, num.length)),
    text:
      num.substring(0, 1) === 'o'
        ? num === 'o:complex'
          ? '<b>comp</b>'
          : num === 'o:MH'
          ? '<b>MH</b>'
          : '<b>' + num.substring(num.length - 3, num.length) + '</b>'
        : '<b>' + num + '</b>',
    showarrow: false,
    font: {
      size: num.substring(0, 1) === 'o' ? 11 : 14,
    },
    textangle: num.substring(0, 1) === 'o' ? -90 : 0,
    align: 'center',
    num: num,
    index: index,
  }));

  const annotationsIDTopLabel = arrayIDAnnXLabel.map((num, index) => ({
    xref: 'x',
    yref: 'paper',
    x: num,
    xanchor: 'bottom',
    y: 1.07,
    yanchor: 'bottom',
    text: '<b>' + arrayIDAnnXTop[index] + '</b>',
    showarrow: false,
    font: {
      size: 14,
    },
    align: 'center',
  }));

  const annotationsIDBotLabel = arrayIDAnnXLabel.map((num, index) => ({
    xref: 'x',
    yref: 'paper',
    x: num,
    xanchor: 'bottom',
    y: -0.16,
    yanchor: 'bottom',
    text: '<b>' + arrayIDAnnXBot[index] + '</b>',
    showarrow: false,
    font: {
      size: 16,
      family: 'Times New Roman',
    },
    align: 'center',
  }));

  const sampleAnnotation = createSampleAnnotation(data);

  const shapes1 = Object.entries(arrayID).map(
    ([mutation, signatures], groupIndex, array) => ({
      type: 'rect',
      xref: 'x',
      yref: 'paper',
      x0: array
        .slice(0, groupIndex)
        .reduce((x0, [_, sigs]) => x0 + sigs.length, -0.4),
      x1: array
        .slice(0, groupIndex + 1)
        .reduce((x0, [_, sigs]) => x0 + sigs.length, -0.6),
      y0: 1.07,
      y1: 1.01,
      fillcolor:
        signatures[0].mutationType.substring(0, 1) === 'o'
          ? '#1764AA'
          : colors[
              signatures[0].mutationType.substring(
                0,
                signatures[0].mutationType.length - 2
              )
            ],
      line: {
        width: 0,
      },
      mutation: mutation,
      signature: signatures[0].mutationType.substring(
        0,
        signatures[0].mutationType.length - 2
      ),
    })
  );

  const shapes2 = Object.entries(arrayID).map(
    ([mutation, signatures], groupIndex, array) => ({
      type: 'rect',
      xref: 'x',
      yref: 'paper',
      x0: array
        .slice(0, groupIndex)
        .reduce((x0, [_, sigs]) => x0 + sigs.length, -0.4),
      x1: array
        .slice(0, groupIndex + 1)
        .reduce((x0, [_, sigs]) => x0 + sigs.length, -0.6),
      y0: -0.01,
      y1: -0.05,
      fillcolor:
        signatures[0].mutationType.substring(0, 1) === 'o'
          ? '#1764AA'
          : colors[
              signatures[0].mutationType.substring(
                0,
                signatures[0].mutationType.length - 2
              )
            ],
      line: {
        width: 0,
      },
      mutation: mutation,
      signature: signatures[0].mutationType.substring(
        0,
        signatures[0].mutationType.length - 2
      ),
    })
  );

  const layout = {
    title: `<b>${title}</b>`,
    hoverlabel: { bgcolor: '#FFF' },
    height: 600,
    width: 750,
    xaxis: {
      showticklabels: false,
      showline: true,
      tickangle: -90,
      tickfont: {
        size: 10,
      },
      tickmode: 'array',
      tickvals: flatSorted.map((_, i) => i),
      ticktext: flatSorted.map((e) => e.mutationType),
      linecolor: 'black',
      linewidth: 1,
      mirror: true,
    },
    yaxis: {
      title: {
        text: '<b>Number of Indels</b>',
        font: {
          family: 'Times New Roman',
          size: 20,
        },
      },
      autorange: false,
      range: [0, maxVal + maxVal * 0.25],
      linecolor: 'black',
      linewidth: 1,
      mirror: true,
    },

    shapes: [...shapes1, ...shapes2],
    annotations: [
      ...annotations1,
      ...annotations2,
      ...annotationsIDTopLabel,
      ...annotationsIDBotLabel,
      sampleAnnotation,
    ],
  };

  return { traces, layout };
}

function ID29(apiData, title = '') {
  const colors = {
    '[+C]': '#0072b2',
    '[+T]': '#d55e00',
    '[+>1]': '#cc79a7',
    '[-C]': '#56b4e9',
    '[-T]': '#e69f00',
    '[->1]': '#009e73',
    '[-]': '#911eb4',
  };
  const mutationTypeSort = (a, b) => {
    const mutationTypeOrder = [
      'A',
      'G',
      'C',
      'T',
      'CC',
      'TT',
      'LR',
      'NonR',
      'Rep',
      'MH',
    ];
    const mutationRegex = /\[.*\](.*)/;

    return (
      mutationTypeOrder.indexOf(a.mutationType.match(mutationRegex)[1]) -
      mutationTypeOrder.indexOf(b.mutationType.match(mutationRegex)[1])
    );
  };
  const groupRegex = /(\[.*\])/;

  const mutationGroupSort = (a, b) => {
    const order = Object.keys(colors);
    return order.indexOf(a.mutation) - order.indexOf(b.mutation);
  };

  const data = groupDataByMutation(
    apiData,
    groupRegex,
    mutationGroupSort,
    mutationTypeSort
  );
  const maxMutation = getMaxMutations(apiData);

  const mutationTypeNames = data
    .map((group) =>
      group.data.map((e) => ({
        mutation: group.mutation,
        mutationType: e.mutationType,
      }))
    )
    .flat();

  const traces = data.map((group, i, array) => ({
    name: group.mutation,
    type: 'bar',
    marker: { color: colors[group.mutation] },
    x: [...group.data.keys()].map(
      (e) =>
        e +
        array.slice(0, i).reduce((lastIndex, b) => lastIndex + b.data.length, 0)
    ),
    y: group.data.map((e) => e.mutations || e.contribution),
    hoverinfo: 'x+y',
    showlegend: false,
  }));

  const sampleAnnotation = createSampleAnnotation(apiData);
  const mutationAnnotation = createMutationAnnotations(data);
  const mutationShapes = createMutationShapes(data, colors);

  const layout = {
    title: `<b>${title}</b>`,
    hoverlabel: { bgcolor: '#FFF' },
    bargap: 0.3,
    height: 450,
    // width: 1080,
    autosize: true,

    xaxis: {
      showline: true,
      tickangle: 45,
      tickfont: {
        family: 'Courier New, monospace',
        // color: '#A0A0A0',
      },
      tickmode: 'array',
      tickvals: mutationTypeNames.map((_, i) => i),
      ticktext: mutationTypeNames.map((e) => `<b>${e.mutationType}</b>`),
      linecolor: '#E0E0E0',
      linewidth: 1,
      mirror: 'all',
    },
    yaxis: {
      title: {
        text: '<b>Mutation Probability</b>',
        font: {
          family: 'Times New Roman',
        },
      },
      autorange: false,
      range: [0, maxMutation * 1.2],
      ticks: 'inside',
      tickcolor: '#D3D3D3',
      linecolor: '#D3D3D3',
      linewidth: 1,
      mirror: 'all',
      tickformat: Number.isInteger(traces[0].y[0]) ? '~s' : '.1%',
      showgrid: true,
      gridcolor: '#F5F5F5',
    },

    shapes: mutationShapes,
    annotations: [...mutationAnnotation, sampleAnnotation],
  };

  return { traces, layout };
}

function ID83(apiData, title = '') {
  const colors = id83Color;

  const indelRegex = /^(.{7})/;
  const mutationGroupSort = (a, b) => {
    const order = Object.keys(colors);
    return order.indexOf(a.mutation) - order.indexOf(b.mutation);
  };

  const data = groupDataByMutation(apiData, indelRegex, mutationGroupSort);

  const arrayIDAnnXTop = [
      '1bp Deletion',
      '1bp Insertion',
      '>1bp Deletion at Repeats<br>(Deletion Length)',
      '>1bp Insertions at Repeats<br> (Insertion Length)',
      'Microhomology<br>(Deletion Length)',
    ],
    arrayIDAnnXBot = [
      'Homopolymer Length',
      'Homopolymer Length',
      'Number of Repeat Units',
      'Number of Repeat Units',
      'Microhomology Length',
    ],
    arrayIDAnnXLabel = [5, 18.5, 35, 60, 76];

  const totalMutations = getTotalMutations(apiData);
  const maxMutation = getMaxMutations(apiData);

  const indelNames = data
    .map((group) =>
      group.data.map((e) => ({
        indel: group.mutation,
        index:
          group.mutation.includes('Del') && group.mutation.slice(-1) != 'M'
            ? +e.mutationType.slice(-1) + 1
            : e.mutationType.slice(-1),
      }))
    )
    .flat();

  const traces = data.map((group, groupIndex, array) => ({
    name: group.mutation,
    type: 'bar',
    marker: { color: colors[group.mutation].shape },
    x: [...group.data.keys()].map(
      (e) =>
        e +
        array
          .slice(0, groupIndex)
          .reduce((lastIndex, b) => lastIndex + b.data.length, 0)
    ),
    y: group.data.map((e) => e.mutations || e.contribution),
    groupdata: group.data,
    //customdata: group.data.map((e) => ({ mutationType: e.mutationType })),
    customdata: group.data.map((e) => ({
      mutationOrder: e.mutationType.substring(0, 1),
      mutationType:
        e.mutationType.substring(2, 5) === 'Del' ? 'Deletion' : 'Insertion',
      extraValue: e.mutationType.substring(6, 7),
      xval:
        e.mutationType.substring(2, 5) === 'Del'
          ? +e.mutationType.slice(-1) + 1
          : e.mutationType.slice(-1),
    })),
    hovertemplate:
      '<b>%{customdata.mutationOrder} bp %{customdata.mutationType}, %{customdata.extraValue}, %{customdata.xval}</b><br>' +
      '%{y} indels<extra></extra>',
    showlegend: false,
  }));
  const shapeAnnotations = data.map((group, groupIndex, array) => ({
    xref: 'x',
    yref: 'paper',
    xanchor: 'bottom',
    yanchor: 'bottom',
    x:
      array
        .slice(0, groupIndex)
        .reduce((lastIndex, b) => lastIndex + b.data.length, 0) +
      (group.data.length - 1) * 0.5,
    y: 1.01,
    text: `<b>${
      group.mutation[0] == '1' ? group.mutation.slice(-1) : group.mutation[0]
    }</b>`,
    showarrow: false,
    font: {
      size: 14,
      color: colors[group.mutation].text,
    },
    align: 'center',
  }));

  const xLabelAnnotation = indelNames.map((indel, index) => ({
    xref: 'x',
    yref: 'paper',
    xanchor: 'bottom',
    yanchor: 'bottom',
    x: index,
    y: -0.1,
    text: '<b>' + indel.index + '</b>',
    showarrow: false,
    font: {
      size: 12,
    },
    align: 'center',
  }));

  const annotationsIDTopLabel = arrayIDAnnXLabel.map((num, index) => ({
    xref: 'x',
    yref: 'paper',
    x: num,
    xanchor: 'bottom',
    y: 1.07,
    yanchor: 'bottom',
    text: '<b>' + arrayIDAnnXTop[index] + '</b>',
    showarrow: false,
    font: {
      size: 16,
      family: 'Times New Roman',
    },
    align: 'center',
  }));

  const annotationsIDBotLabel = arrayIDAnnXLabel.map((num, index) => ({
    xref: 'x',
    yref: 'paper',
    x: num,
    xanchor: 'bottom',
    y: -0.15,
    yanchor: 'bottom',
    text: '<b>' + arrayIDAnnXBot[index] + '</b>',
    showarrow: false,
    font: {
      size: 15,
      family: 'Times New Roman',
    },
    align: 'center',
  }));
  const sampleAnnotation = createSampleAnnotation(apiData);

  const topShapes = data.map((group, groupIndex, array) => ({
    type: 'rect',
    xref: 'x',
    yref: 'paper',
    x0: array
      .slice(0, groupIndex)
      .reduce((lastIndex, e) => lastIndex + e.data.length, -0.4),
    x1: array
      .slice(0, groupIndex + 1)
      .reduce((lastIndex, e) => lastIndex + e.data.length, -0.6),
    y0: 1.07,
    y1: 1.01,
    fillcolor: colors[group.mutation].shape,
    line: {
      width: 0,
    },
  }));

  const bottomShapes = data.map((group, groupIndex, array) => ({
    type: 'rect',
    xref: 'x',
    yref: 'paper',
    x0: array
      .slice(0, groupIndex)
      .reduce((lastIndex, e) => lastIndex + e.data.length, -0.4),
    x1: array
      .slice(0, groupIndex + 1)
      .reduce((lastIndex, e) => lastIndex + e.data.length, -0.6),
    y0: -0.01,
    y1: -0.05,
    fillcolor: colors[group.mutation].shape,
    line: {
      width: 0,
    },
  }));

  const layout = {
    title: `<b>${title}</b>`,
    hoverlabel: { bgcolor: '#FFF' },
    height: 500,
    //width:1080,
    autosize: true,
    xaxis: {
      showticklabels: false,
      showline: true,
      tickfont: { size: 11 },
      tickmode: 'array',
      tickvals: indelNames.map((_, i) => i),
      ticktext: indelNames.map((e) => e.index),
      linecolor: 'black',
      linewidth: 1,
      mirror: 'all',
    },
    yaxis: {
      title: {
        text:
          parseFloat(totalMutations).toFixed(2) > 1
            ? '<b>Number of Indels</b>'
            : '<b>Percent of Indels</b>',
        font: {
          family: 'Times New Roman',
          size: 18,
        },
      },
      autorange: false,
      range: [0, maxMutation * 1.2],
      linecolor: 'black',
      linewidth: 1,
      mirror: true,
      tickformat: parseFloat(totalMutations).toFixed(2) > 1 ? '~s' : '.1%',
    },

    shapes: [...topShapes, ...bottomShapes],
    annotations: [
      ...shapeAnnotations,
      ...xLabelAnnotation,
      ...annotationsIDTopLabel,
      ...annotationsIDBotLabel,
      sampleAnnotation,
    ],
  };

  return { traces, layout };
}

function ID415(data, title = '') {
  const colors = {
    '1:Del:C': '#FBBD6F',
    '1:Del:T': '#FE8002',
    '1:Ins:C': '#AEDD8A',
    '1:Ins:T': '#35A12E',
    '2:Del:R': '#FCC9B4',
    '3:Del:R': '#FB8969',
    '4:Del:R': '#F04432',
    '5:Del:R': '#BB1A1A',
    '2:Ins:R': '#CFDFF0',
    '3:Ins:R': '#93C3DE',
    '4:Ins:R': '#4B97C7',
    '5:Ins:R': '#1863AA',
    '2:Del:M': '#E1E1EE',
    '3:Del:M': '#B5B5D6',
    '4:Del:M': '#8482BC',
    '5:Del:M': '#62409A',
  };
  const annotationColors = {
    '1:Del:C': 'black',
    '1:Del:T': 'white',
    '1:Ins:C': 'black',
    '1:Ins:T': 'white',
    '2:Del:R': 'black',
    '3:Del:R': 'black',
    '4:Del:R': 'black',
    '5:Del:R': 'white',
    '2:Ins:R': 'black',
    '3:Ins:R': 'black',
    '4:Ins:R': 'black',
    '5:Ins:R': 'white',
    '2:Del:M': 'blacl',
    '3:Del:M': 'black',
    '4:Del:M': 'black',
    '5:Del:M': 'white',
  };

  const arrayIDAnnXTop = [
      '1bp Deletion',
      '1bp Insertion',
      '>1bp Deletion at Repeats<br>(Deletion Length)',
      '>1bp Insertions at Repeats<br> (Insertion Length)',
      'Microhomology<br>(Deletion Length)',
    ],
    arrayIDAnnXBot = [
      'Homopolymer Length',
      'Homopolymer Length',
      'Number of Repeat Units',
      'Number of Repeat Units',
      'Microhimology Length',
    ],
    arrayIDAnnXLabel = [5, 18.5, 35, 60, 76],
    arrayIDAnnotationTop = [],
    arrayIDAnnotationBot = [];

  const transcribed = data.filter((e) => /^T:/.test(e.mutationType));
  const untranscribed = data.filter((e) => /^U:/.test(e.mutationType));

  transcribed.reduce((total, e) => total + e.mutations, 0) +
    untranscribed.reduce((total, e) => total + e.mutations, 0);

  const maxMutation = Math.max(
    ...[
      ...transcribed.map((e) => e.mutations),
      ...untranscribed.map((e) => e.mutations),
    ]
  );

  ///// --------- T Group ------------///////
  const T_groupByMutation = transcribed.reduce((groups, e, i) => {
    const mutationRegex = /^.{2,9}/;
    const mutation = e.mutationType.match(mutationRegex)[0];
    const signature = {
      mutationType: e.mutationType,
      contribution: e.mutations,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];
    return groups;
  }, {});

  const T_groupByFirstGroup = Object.fromEntries(
    Object.entries(T_groupByMutation).slice(0, 4)
  );

  const T_groupByMutationID = transcribed.reduce((groups, e) => {
    let mutationID;
    mutationID = e.mutationType.match(
      e.mutationType.substring(
        e.mutationType.length - 3,
        e.mutationType.length - 2
      )
    );
    const signature = {
      mutationType: e.mutationType,
      contribution: e.mutations,
    };
    groups[mutationID] = groups[mutationID]
      ? [...groups[mutationID], signature]
      : [signature];
    return groups;
  }, {});

  const T_groupR = T_groupByMutationID['R'].reduce((r, a) => {
    let m;
    m = a.mutationType.match(a.mutationType.substr(4, 3));
    const s = {
      mutationType: a.mutationType,
      contribution: a.contribution,
    };
    r[m] = r[m] ? [...r[m], a] : [s];
    return r;
  }, {});

  const T_groupRDel = T_groupR['Del'].reduce((r, a) => {
    let m;
    m = a.mutationType.match(a.mutationType.substr(0, 7));
    const s = {
      mutationType: a.mutationType,
      contribution: a.contribution,
    };
    r[m] = r[m] ? [...r[m], a] : [s];
    return r;
  }, {});

  const T_groupRIns = T_groupR['Ins'].reduce((r, a) => {
    let m;
    m = a.mutationType.match(a.mutationType.substr(0, 7));
    const s = {
      mutationType: a.mutationType,
      contribution: a.contribution,
    };
    r[m] = r[m] ? [...r[m], a] : [s];
    return r;
  }, {});

  const T_groupM = T_groupByMutationID['M'].reduce((r, a) => {
    let m;
    m = a.mutationType.match(a.mutationType.substr(0, 7));
    const s = {
      mutationType: a.mutationType,
      contribution: a.contribution,
    };
    r[m] = r[m] ? [...r[m], a] : [s];
    return r;
  }, {});
  const T_arrayID1 = Object.keys(T_groupByFirstGroup).map(function (key) {
    return T_groupByFirstGroup[key];
  });
  const T_arrayID2 = Object.keys(T_groupRDel).map(function (key) {
    return T_groupRDel[key];
  });
  const T_arrayID3 = Object.keys(T_groupRIns).map(function (key) {
    return T_groupRIns[key];
  });
  const T_arrayID4 = Object.keys(T_groupM).map(function (key) {
    return T_groupM[key];
  });

  const T_arrayID = [
    ...T_arrayID1,
    ...T_arrayID2,
    ...T_arrayID3,
    ...T_arrayID4,
  ];

  const T_flatSorted = Object.values(T_arrayID).flat();

  ///// --------- U Group ------------///////
  const U_groupByMutation = untranscribed.reduce((groups, e, i) => {
    const mutationRegex = /^.{2,9}/;
    const mutation = e.mutationType.match(mutationRegex)[0];
    const signature = {
      mutationType: e.mutationType,
      contribution: e.mutations,
    };
    groups[mutation] = groups[mutation]
      ? [...groups[mutation], signature]
      : [signature];
    return groups;
  }, {});

  const U_groupByFirstGroup = Object.fromEntries(
    Object.entries(U_groupByMutation).slice(0, 4)
  );

  const U_groupByMutationID = untranscribed.reduce((groups, e) => {
    let mutationID;
    mutationID = e.mutationType.match(
      e.mutationType.substring(
        e.mutationType.length - 3,
        e.mutationType.length - 2
      )
    );
    const signature = {
      mutationType: e.mutationType,
      contribution: e.mutations,
    };
    groups[mutationID] = groups[mutationID]
      ? [...groups[mutationID], signature]
      : [signature];
    return groups;
  }, {});

  const U_groupR = U_groupByMutationID['R'].reduce((r, a) => {
    let m;
    m = a.mutationType.match(a.mutationType.substr(4, 3));
    const s = {
      mutationType: a.mutationType,
      contribution: a.contribution,
    };
    r[m] = r[m] ? [...r[m], a] : [s];
    return r;
  }, {});

  const U_groupRDel = U_groupR['Del'].reduce((r, a) => {
    let m;
    m = a.mutationType.match(a.mutationType.substr(0, 7));
    const s = {
      mutationType: a.mutationType,
      contribution: a.contribution,
    };
    r[m] = r[m] ? [...r[m], a] : [s];
    return r;
  }, {});

  const U_groupRIns = U_groupR['Ins'].reduce((r, a) => {
    let m;
    m = a.mutationType.match(a.mutationType.substr(0, 7));
    const s = {
      mutationType: a.mutationType,
      contribution: a.contribution,
    };
    r[m] = r[m] ? [...r[m], a] : [s];
    return r;
  }, {});

  const U_groupM = U_groupByMutationID['M'].reduce((r, a) => {
    let m;
    m = a.mutationType.match(a.mutationType.substr(0, 7));
    const s = {
      mutationType: a.mutationType,
      contribution: a.contribution,
    };
    r[m] = r[m] ? [...r[m], a] : [s];
    return r;
  }, {});

  const U_arrayID1 = Object.keys(U_groupByFirstGroup).map(function (key) {
    return U_groupByFirstGroup[key];
  });
  const U_arrayID2 = Object.keys(U_groupRDel).map(function (key) {
    return U_groupRDel[key];
  });
  const U_arrayID3 = Object.keys(U_groupRIns).map(function (key) {
    return U_groupRIns[key];
  });
  const U_arrayID4 = Object.keys(U_groupM).map(function (key) {
    return U_groupM[key];
  });

  const U_arrayID = [
    ...U_arrayID1,
    ...U_arrayID2,
    ...U_arrayID3,
    ...U_arrayID4,
  ];
  const U_flatSorted = Object.values(U_arrayID).flat();

  //// ----------- plot ------------------//
  const tracesT = {
    name: 'Transcrribed Strand',
    type: 'bar',
    marker: { color: '#004765' },
    customedata: T_flatSorted.map((e, i, a) => ({
      mutationOrder: e.mutationType.substring(0, 1),
      mutationType:
        e.mutationType.substring(2, 5) === 'Del' ? 'Deletion' : 'Insertion',
      extraValue: e.mutationType.substring(6, 7),
      xval:
        e.mutationType.substring(2, 5) === 'Del'
          ? +e.mutationType.slice(-1) + 1
          : e.mutationType.slice(-1),
    })),
    x: T_flatSorted.map((element, index, array) => index),
    y: T_flatSorted.map((element, index, array) => element.contribution),
    hovertemplate: '<b>Transcrribed Strand</b><br>%{y} indels <extra></extra>',
    //hoverinfo: 'x+y',
    showlegend: true,
  };

  const tracesU = {
    name: 'Untranscribed Strand',
    type: 'bar',
    marker: { color: '#E32925' },
    x: U_flatSorted.map((element, index, array) => index),
    y: U_flatSorted.map((element, index, array) => element.contribution),
    hovertemplate: '<b>Untranscribed Strand</b><br>%{y} indels <extra></extra>',
    //hoverinfo: 'x+y',
    showlegend: true,
  };

  Object.values(T_arrayID).forEach((group) => {
    if (group.length > 1) {
      arrayIDAnnotationTop.push(
        group[Math.floor(group.length / 2)].mutationType
      );
    } else {
      arrayIDAnnotationTop.push(group[0].mutationType);
    }
    group.forEach((e) => {
      let lastNum = e.mutationType.substring(
        e.mutationType.length - 1,
        e.mutationType.length
      );
      let newNum;
      if (
        e.mutationType.substring(4, 9) === 'Del:C' ||
        e.mutationType.substring(4, 9) === 'Del:T' ||
        e.mutationType.substring(4, 9) === 'Del:R'
      ) {
        lastNum = +lastNum + 1;
      }
      if (
        (e.mutationType.substring(4, 9) === 'Del:C' ||
          e.mutationType.substring(4, 9) === 'Del:T' ||
          e.mutationType.substring(4, 9) === 'Del:R') &
        (+lastNum > 5)
      ) {
        newNum = lastNum + '+';
      } else if (
        e.mutationType.substring(4, 9) !== 'Del:C' &&
        e.mutationType.substring(4, 9) !== 'Del:T' &&
        e.mutationType.substring(4, 9) !== 'Del:R' &&
        +lastNum > 4
      ) {
        newNum = lastNum + '+';
      } else {
        newNum = lastNum;
      }
      arrayIDAnnotationBot.push(newNum);
    });
  });

  const traces = [tracesT, tracesU];

  const annotations1 = Object.entries(T_arrayID).map(
    ([mutation, signatures], groupIndex, array) => ({
      xref: 'x',
      yref: 'paper',
      xanchor: 'bottom',
      yanchor: 'bottom',
      x:
        array
          .slice(0, groupIndex)
          .reduce((x0, [_, sigs]) => x0 + sigs.length, 0) +
        (signatures.length - 1) * 0.5,
      y: 1.01,
      text:
        groupIndex < 4
          ? `<b>${signatures[0].mutationType.substring(
              signatures[0].mutationType.length - 3,
              signatures[0].mutationType.length - 2
            )}</b>`
          : `<b>${signatures[0].mutationType.substring(2, 3)}</b>`,
      showarrow: false,
      font: {
        size: 14,
        color:
          annotationColors[
            signatures[0].mutationType.substring(
              2,
              signatures[0].mutationType.length - 2
            )
          ],
      },
      align: 'center',
    })
  );

  const annotations2 = arrayIDAnnotationBot.map((num, index) => ({
    xref: 'x',
    yref: 'paper',
    xanchor: 'bottom',
    yanchor: 'bottom',
    x: index,
    y: -0.1,
    text: '<b>' + num + '</b>',
    showarrow: false,
    font: {
      size: 12,
      family: 'Times New Roman',
    },
    align: 'center',
  }));

  const annotationsIDTopLabel = arrayIDAnnXLabel.map((num, index) => ({
    xref: 'x',
    yref: 'paper',
    x: num,
    xanchor: 'bottom',
    y: 1.07,
    yanchor: 'bottom',
    text: '<b>' + arrayIDAnnXTop[index] + '</b>',
    showarrow: false,
    font: {
      size: 16,
      family: 'Times New Roman',
    },
    align: 'center',
  }));

  const annotationsIDBotLabel = arrayIDAnnXLabel.map((num, index) => ({
    xref: 'x',
    yref: 'paper',
    x: num,
    xanchor: 'bottom',
    y: -0.15,
    yanchor: 'bottom',
    text: '<b>' + arrayIDAnnXBot[index] + '</b>',
    showarrow: false,
    font: {
      size: 15,
      family: 'Times New Roman',
    },
    align: 'center',
  }));

  const sampleAnnotation = createSampleAnnotation(data);

  const shapes1 = Object.entries(T_arrayID).map(
    ([mutation, signatures], groupIndex, array) => ({
      type: 'rect',
      xref: 'x',
      yref: 'paper',
      x0: array
        .slice(0, groupIndex)
        .reduce((x0, [_, sigs]) => x0 + sigs.length, -0.4),
      x1: array
        .slice(0, groupIndex + 1)
        .reduce((x0, [_, sigs]) => x0 + sigs.length, -0.6),
      y0: 1.07,
      y1: 1.01,
      fillcolor:
        colors[
          signatures[0].mutationType.substring(
            2,
            signatures[0].mutationType.length - 2
          )
        ],
      line: {
        width: 0,
      },
    })
  );

  const shapes2 = Object.entries(T_arrayID).map(
    ([mutation, signatures], groupIndex, array) => ({
      type: 'rect',
      xref: 'x',
      yref: 'paper',
      x0: array
        .slice(0, groupIndex)
        .reduce((x0, [_, sigs]) => x0 + sigs.length, -0.4),
      x1: array
        .slice(0, groupIndex + 1)
        .reduce((x0, [_, sigs]) => x0 + sigs.length, -0.6),
      y0: -0.01,
      y1: -0.05,
      fillcolor:
        colors[
          signatures[0].mutationType.substring(
            2,
            signatures[0].mutationType.length - 2
          )
        ],
      line: {
        width: 0,
      },
    })
  );

  const layout = {
    title: `<b>${title}</b>`,
    hoverlabel: { bgcolor: '#FFF' },
    height: 500,
    width: 1100,
    autosize: false,
    legend: {
      x: 1,
      xanchor: 'right',
      y: 1,
      bgcolor: '#FFFFFF',
      bordercolor: '#E1E1E1',
      borderwidth: 1,
    },
    xaxis: {
      showticklabels: false,
      showline: true,
      tickangle: -90,
      tickfont: {
        size: 10,
      },
      tickmode: 'array',
      tickvals: T_flatSorted.map((_, i) => i),
      ticktext: T_flatSorted.map((e) => e.mutationType),
      linecolor: 'black',
      linewidth: 1,
      mirror: true,
    },
    yaxis: {
      title: {
        text: '<b>Number of Indels</b>',
        font: {
          family: 'Times New Roman',
          size: 18,
        },
      },
      autorange: false,
      range: [0, maxMutation + maxMutation * 0.2],
      linecolor: 'black',
      linewidth: 1,
      mirror: true,
    },

    shapes: [...shapes1, ...shapes2],
    annotations: [
      ...annotations1,
      ...annotations2,
      ...annotationsIDTopLabel,
      ...annotationsIDBotLabel,
      sampleAnnotation,
    ],
  };

  return { traces, layout };
}

function RS32(apiData, title = '') {
  const colors = rs32Color;

  const maxMutation = Math.max(...apiData.map((indel) => indel.contribution));

  var sortOrder = ['1-10Kb', '10-100Kb', '100Kb-1Mb', '1Mb-10Mb', '>10Mb']; // Declare a array that defines the order of the elements to be sorted.

  const clusterd = [];
  const nonClustered = [];
  apiData.map((e) => {
    if (e.mutationType.substring(0, 3) === 'non') {
      nonClustered.push(e);
    } else {
      clusterd.push(e);
    }
  });

  const groupByIndelCluster = clusterd.reduce((acc, e, i) => {
    const indel = e.mutationType.substring(0, 13);

    acc[indel] = acc[indel] ? [...acc[indel], e] : [e];
    return acc;
  }, {});

  const groupByIndelNonCluster = nonClustered.reduce((acc, e, i) => {
    const indel = e.mutationType.substring(0, 17);

    acc[indel] = acc[indel] ? [...acc[indel], e] : [e];
    return acc;
  }, {});
  const clusterGroup = Object.entries(groupByIndelCluster).map(
    ([indel, data]) => ({
      indel: indel,
      data: data,
    })
  );

  const nonClusterGroup = Object.entries(groupByIndelNonCluster).map(
    ([indel, data]) => ({
      indel: indel,
      data: data,
    })
  );

  const data = [...clusterGroup, ...nonClusterGroup];

  const sortGroup1 = clusterGroup.map((element, index, array) => ({
    mutation: element.mutation,
    data: element.data.sort(function (a, b) {
      return (
        sortOrder.indexOf(a.mutationType.split('_')[2]) -
        sortOrder.indexOf(b.mutationType.split('_')[2])
      );
    }),
  }));

  const sortedData1 = sortGroup1
    .map((indel) => indel.data.map((e) => e))
    .flat();

  const sortGroup2 = nonClusterGroup.map((element, index, array) => ({
    mutation: element.mutation,
    data: element.data.sort(function (a, b) {
      return (
        sortOrder.indexOf(a.mutationType.split('_')[2]) -
        sortOrder.indexOf(b.mutationType.split('_')[2])
      );
    }),
  }));

  const sortedData2 = sortGroup2
    .map((indel) => indel.data.map((e) => e))
    .flat();

  const sortData = [...sortedData1, ...sortedData2];
  const mutationTypeNames = sortData.map((group, i) => ({
    mutationType: !group.mutationType.split('_')[2]
      ? group.mutationType.split('_')[1]
      : group.mutationType.split('_')[2],
    index: i,
  }));

  const traces = sortData.map((group, groupIndex, array) => ({
    group: group,
    name: group.indel,
    type: 'bar',
    marker: {
      color: colors[group.mutationType],
      line: {
        color: 'black',
        width: 1,
      },
    },
    x: [group.mutationType],
    y: [group.contribution],
    customdata: {
      mutationType: group.mutationType,
      contribution: group.contribution,
    },
    hoverinfo: 'x+y',
    showlegend: false,
  }));

  const topShapes = data.map((group, groupIndex, array) => ({
    group: group,
    name: group.indel,
    type: 'rect',
    xref: 'x',
    yref: 'paper',
    marker: {
      color:
        colors[
          group.indel.substring(group.indel.length - 3, group.indel.length)
        ],
    },
    x0: array
      .slice(0, groupIndex)
      .reduce((lastIndex, e) => lastIndex + e.data.length, -0.4),
    x1: array
      .slice(0, groupIndex + 1)
      .reduce((lastIndex, e) => lastIndex + e.data.length, -0.6),
    y0: 1.07,
    y1: 1.01,
    fillcolor:
      colors[group.indel.substring(group.indel.length - 3, group.indel.length)],
    line: {
      width: 0,
    },
    showlegend: false,
  }));

  const topShapeAnnitations = data.map((group, groupIndex, array) => ({
    xref: 'x',
    yref: 'paper',
    xanchor: 'bottom',
    yanchor: 'bottom',
    x:
      array
        .slice(0, groupIndex)
        .reduce((lastIndex, b) => lastIndex + b.data.length, 0) +
      (group.data.length - 1) * 0.5,
    y: 1.01,
    text:
      group.indel.substring(group.indel.length - 3, group.indel.length) !==
      'tra'
        ? group.indel
            .substring(group.indel.length - 3, group.indel.length)
            .charAt(0)
            .toUpperCase() +
          group.indel
            .substring(group.indel.length - 3, group.indel.length)
            .slice(1)
        : 'T',
    showarrow: false,
    font: {
      size: 14,
      color: 'white',
    },
    align: 'center',
  }));
  const topShapeCluster = {
    type: 'rect',
    xref: 'x',
    yref: 'paper',
    x0: -0.4,
    x1: 15.4,
    y0: 1.14,
    y1: 1.08,
    fillcolor: '#808080',
    line: {
      width: 0,
    },
  };
  const topShapeClusterAnnotation = {
    xref: 'x',
    yref: 'paper',
    xanchor: 'bottom',
    yanchor: 'bottom',
    x: 7.5,
    y: 1.08,
    text: `Clustered`,
    showarrow: false,
    font: {
      size: 14,
      color: 'white',
    },
    align: 'center',
  };
  const topShapeNonluster = {
    type: 'rect',
    xref: 'x',
    yref: 'paper',
    x0: 15.6,
    x1: 31.4,
    y0: 1.14,
    y1: 1.08,
    fillcolor: '#000000',
    line: {
      width: 0,
    },
  };
  const topShapeNonClusterAnnotation = {
    xref: 'x',
    yref: 'paper',
    xanchor: 'bottom',
    yanchor: 'bottom',
    x: 23.5,
    y: 1.08,
    text: `Non-Clustered`,
    showarrow: false,
    font: {
      size: 14,
      color: 'white',
    },
    align: 'center',
  };
  const separateLine = {
    type: 'line',
    xref: 'x',
    yref: 'paper',
    x0: 15.5,
    x1: 15.5,
    y0: 0,
    y1: 1,
    line: {
      color: '#808080',
      width: 1,
    },
  };
  const sampleAnnotation = createSampleAnnotation(apiData);
  const layout = {
    title: `<b>${title}</b>`,
    hoverlabel: { bgcolor: '#FFF' },
    height: 500,
    autosize: true,
    xaxis: {
      showticklabels: true,
      showline: true,
      tickangle: -90,
      tickfont: { size: 11 },
      tickmode: 'array',

      linecolor: 'black',
      linewidth: 1,
      mirror: 'all',
      tickvals: mutationTypeNames.map((_, i) => i),
      ticktext: mutationTypeNames.map((e) => e.mutationType),
    },
    yaxis: {
      title: {
        text: '<b>Percentage(%)</b>',
        font: {
          family: 'Times New Roman',
          size: 18,
        },
      },
      autorange: false,
      range: [0, maxMutation * 1.25],
      tickformat: ',.1%',
      linecolor: 'black',
      linewidth: 1,
      mirror: true,
    },

    shapes: [...topShapes, topShapeCluster, topShapeNonluster, separateLine],
    annotations: [
      ...topShapeAnnitations,
      topShapeClusterAnnotation,
      topShapeNonClusterAnnotation,
      sampleAnnotation,
    ],
  };

  return { traces, layout };
}

//#region Retrieving SSM Files from ICGC Data Portal and Converting to MAF File

  
  async function getDownloadId(
    pqlQuery,
    dataType = "ssm",
    outputFormat = "TSV"
  ) {
    const info = `[{"key":"${dataType}", "value":"${outputFormat}"}]`;
    const url = `https://dcc.icgc.org/api/v1/download/submitPQL?pql=${pqlQuery}&info=${info}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`GET ${url} resulted in status code ${response.status}`);
    }

    const json = await response.json();
    if (!json.downloadId) {
      throw new Error(`GET ${url} did not return a download ID`);
    }
    return await json.downloadId;
  }
  function findInArr(arr, seg) {
    const matches = []; // initialize array
    let i = 0; // initialize i
    while (i < arr.length - seg.length) {
      const s = arr.slice(i, i + seg.length); // create segment
      if (s.every((d, i) => s[i] == seg[i])) {
        // if matches, push to matches
        matches.push(i);
      }
      i++; // increment i
    }
    return matches;
  }

  // This function parses the TSV data into rows
  // and returns an array of cells

  function tsvParseRows(tsvData) {
    // Split the TSV data into rows
    const rows = tsvData.trim().split("\n");

    // Map each row to an array of cells
    const cells = rows.map((row) => row.split("\t"));

    // Return the cells
    return cells;
  }

  async function retrieveData(download_id, project, dataset, analysis_type) {
    // Create the URL that we will use to fetch the data
    const url = `https://dcc.icgc.org/api/v1/download/${download_id}`;

    // Create a cache name that we will use for the data
    const cacheName = "ICGC";

    // Fetch the data, caching the result
    return await fetchURLAndCache(
      cacheName,
      url,
      project + "_" + dataset + "_" + analysis_type
    )
      // Convert the response to an ArrayBuffer
      .then((response) => response.arrayBuffer())

      // Convert the ArrayBuffer to an array of bytes
      .then((arrayBuffer) => {
        const uArr = new Uint8Array(arrayBuffer);

        // Find the locations of the GZIP headers in the data
        let headerLocs = findInArr(uArr, [31, 139, 8, 0, 0]);

        // Create an array to hold the chunks of the data
        const chunks = [];

        // Loop through the locations of the headers
        for (let i = 0; i < headerLocs.length - 1; i++) {
          // Create a block of data from the header to the next header
          const block = uArr.slice(headerLocs[i], headerLocs[i + 1]);

          // Inflate the block using the pako library
          chunks.push(pako.default.inflate(block));
        }

        // Create a block of data from the last header to the end of the data
        const block = uArr.slice(
          headerLocs[headerLocs.length - 1],
          uArr.length
        );

        // Inflate the block using the pako library
        chunks.push(pako.default.inflate(block));

        // Create a new TextDecoder
        const decoder = new TextDecoder();

        // Decode the chunks into strings
        let decodedChunks = chunks.map((d) => decoder.decode(d));

        // Create an array to hold the parsed chunks
        const parsedChunks = [];

        // Loop through the chunks
        for (let chunk of decodedChunks) {
          // Parse the TSV rows and push them to the parsed chunks array using Papa Parse
          parsedChunks.push(tsvParseRows(chunk));
        }

        // Return the parsed chunks
        return [].concat(...parsedChunks);
      })

      // Return the parsed rows
      .then((data) => {
        return data;
      })

      // Catch any errors and return a rejected promise
      .catch((err) => {
        console.error(err);
        return Promise.reject(err);
      });
  }

  async function retrieveICGCDatasets(
    projects = ["BRCA-US"],
    datatype = "ssm",
    analysis_type = "WGS",
    output_format = "TSV"
  ) {
    const supportedFormats = ["TSV", "json"];

    if (!supportedFormats.includes(output_format)) {
      throw new Error(
        `Output format ${output_format} isn't supported. Supported formats: ${supportedFormats}.`
      );
    }
    let files = [];
    for (let project of projects) {
      const pql_query = `select(*),in(donor.projectId,'${project}'),in(donor.availableDataTypes,'${datatype}'),in(donor.analysisTypes,'${analysis_type}')`;
      const download_id = await getDownloadId(
        pql_query,
        datatype,
        output_format
      );

      files.push(
        await retrieveData(download_id, project, datatype, analysis_type)
      );
    }

    return [].concat(...(await files));
  }

  // Create a function that will find the positions of a set of values in an array and output the indices of the values within the array that match the values in the set
  function findIndicesOfValuesInArray(array, values) {
    let indices = [];
    for (let i = 0; i < array.length; i++) {
      if (values.includes(array[i])) {
        indices.push(i);
      }
    }
    return indices;
  }

  // Create a function that will take in the nested array and return a nested array with only the columns we want to keep

  function returnDesiredColumns(nestedArray, selectColumns) {
    let output = [];
    for (let row of nestedArray.slice(1)) {
      let newRow = [];
      for (let column of selectColumns) {
        newRow.push(row[column]);
      }
      output.push(newRow);
    }
    return output;
  }

  function groupAndSortData(data) {
    // Create an object to hold the grouped data
    const groupedData = {};

    // Loop through the input data and group it by donor ID
    data.forEach((row) => {
      const donorID = row[1];
      const chromosome = row[3];
      const position = row[4];

      // If this donor ID hasn't been seen yet, create an empty array for it
      if (!groupedData[donorID]) {
        groupedData[donorID] = [];
      }

      // Check to see if the array already contains a row with the same chromosome and position as the current row and if not, add it
      if (
        !groupedData[donorID].some(
          (r) => r[3] === chromosome && r[4] === position
        )
      ) {
        groupedData[donorID].push(row);
      }
    });

    // Loop through the grouped data and sort each array by chromosome and position
    Object.values(groupedData).forEach((rows) => {
      rows.sort((a, b) => {
        const chrA = a[1];
        const chrB = b[1];
        const posA = a[2];
        const posB = b[2];

        if (chrA !== chrB) {
          // Sort by chromosome first
          return chrA.localeCompare(chrB);
        } else {
          // If chromosomes are the same, sort by position
          return posA - posB;
        }
      });
    });

    // Return the grouped and sorted data
    return groupedData;
  }

  function combineKeysAndValues(keys, values) {
    const dictionary = {};
    for (let i = 0; i < keys.length; i++) {
      dictionary[keys[i]] = values[i];
    }
    return dictionary;
  }
  /**

@function obtainICGCDataMAF
@async
@memberof ICGC
@description A function that retrieves ICGC (International Cancer Genome Consortium) mutation data in MAF (Mutation Annotation Format) format from local cache or external source.
@param {string[]} [projects=["BRCA-US"]] An array of project codes to retrieve data from. Defaults to ["BRCA-US"].
@param {string} [datatype="ssm"] The type of mutation data to retrieve. Defaults to "ssm".
@param {string} [analysis_type="WGS"] The type of analysis to retrieve data from. Defaults to "WGS".
@param {string} [output_format="TSV"] The format of the output file. Defaults to "TSV".
@returns {Promise<Array<Object>>} A promise that resolves to an array of objects containing mutation data.
@throws {Error} If any error occurs during the process of retrieving or caching the data.
*/
  const obtainICGCDataMAF = async (
    projects = ["BRCA-US"],
    datatype = "ssm",
    analysis_type = "WGS",
    output_format = "TSV"
  ) => {
    const cacheName = "ICGC";
    const fileName =
      cacheName +
      "_" +
      projects +
      "_" +
      datatype +
      "_" +
      analysis_type +
      "_" +
      output_format;

    const ICGCDataset = await localforage.default
      .getItem(fileName)
      .then(function (value) {
        return value;
      });

    if (ICGCDataset !== null) {
      console.log("Data found within local forage. Returning data now...");
      return ICGCDataset;
    } else {
      console.log("Data not found within local forage. Procuring data now...");
      const ICGCMAF = retrieveICGCDatasets(
        (projects = projects),
        (datatype = datatype),
        (analysis_type = analysis_type),
        (output_format = output_format)
      ).then((nestedArray) => {
        let selectedColumns = [
          "icgc_mutation_id",
          "project_code",
          "icgc_donor_id",
          "chromosome",
          "chromosome_start",
          "chromosome_end",
          "assembly_version",
          "mutation_type",
          "reference_genome_allele",
          "mutated_to_allele",
        ];

        const indices = findIndicesOfValuesInArray(
          nestedArray[0],
          selectedColumns
        );

        const data = returnDesiredColumns(nestedArray, indices);
        return Object.values(groupAndSortData(data)).map(
          (patients) => {
            return patients.map((mutations) => {
              return combineKeysAndValues(selectedColumns, mutations);
            });
          }
        );
      });

      localforage.default.setItem(fileName, await ICGCMAF);
      return await ICGCMAF;
    }
  };

  //#endregion

  //#region Convert MAF to Mutational Spectrum Matrix

  // This function returns a list of all possible single base substitution trinucleotide
  // contexts, which are defined as the 5' base, the base substitution, and the 3' base.
  // For example, the trinucleotide context of the single base substitution C>A at position
  // 100 of the reference genome would be "N[C>A]N", where N is the base at position 99 and
  // position 101 of the reference genome.

  function get_sbs_trinucleotide_contexts() {
    const nucleotide_bases = ["A", "C", "G", "T"];
    const substitution_types = ["C>A", "C>G", "C>T", "T>A", "T>C", "T>G"];
    let sbs_trinucleotide_contexts = [];

    for (let base_5 of nucleotide_bases) {
      for (let substitution of substitution_types) {
        for (let base_3 of nucleotide_bases) {
          sbs_trinucleotide_contexts.push(
            `${base_5}[${substitution}]${base_3}`
          );
        }
      }
    }

    return sbs_trinucleotide_contexts;
  }

  function standardize_substitution(ref_allele, mut_allele) {
    /*
COSMIC signatures define mutations from a pyrimidine allele (C, T) to any
other base (C>A, C>G, C>T, T>A, T>C, T>G). If a mutation in the MAF file
is defined from a reference purine allele (A, G), then we infer the substituted
base in the complementary sequence, which would be from a pyrimidine
allele due to purines and pyrimidines complementing each other in a
double-stranded DNA.
 :param ref_allele: base in the reference genome.
:param mut_allele: base in the mutated genome
:return: substitution string from pyrimidine to any other base.
*/
    var complement_seq, purines;
    complement_seq = {
      A: "T",
      C: "G",
      T: "A",
      G: "C",
    };
    purines = ["A", "G"];

    if (purines.some((v) => ref_allele.includes(v))) {
      return `${complement_seq[ref_allele]}>${complement_seq[mut_allele]}`;
    } else {
      return `${ref_allele}>${mut_allele}`;
    }
  }

  function init_sbs_mutational_spectra(n_records) {
    /*
Initilizes an ordered dictionary with SBS trinucleotide context as keys and
a list of counts, one for each sample.
 :param n_records: number of samples to record in the mutational spectra matrix.
:return: a dictionary of trinucleotide context and a list of counts
initialized to zeros.
*/

    let tri_nuc_context = get_sbs_trinucleotide_contexts();

    let sbs_mutational_spectra = {};

    for (var i = 0; i < tri_nuc_context.length; i++) {
      let context = tri_nuc_context[i];
      sbs_mutational_spectra[context] = 0;
    }

    return sbs_mutational_spectra;
  }

  function standardize_trinucleotide(trinucleotide_ref) {
    // COSMIC signatures define mutations from a pyrimidine allele (C, T) to any
    // other base (C>A, C>G, C>T, T>A, T>C, T>G). If a mutation in the MAF file
    // is defined from a purine allele (A, G), then we infer the trinucleotide
    // context in the complementary sequence, which would be from a pyrimidine
    // allele due to purines and pyrimidines complementing each other in a
    // double-stranded DNA.

    // :param trinucleotide_ref: trinucleotide sequence seen in the reference genome.
    // :return: a pyrimidine-centric trinucleotide sequence.

    let complement_seq = {
      A: "T",
      C: "G",
      T: "A",
      G: "C",
    };
    let purines = "AG";
    if (purines.includes(trinucleotide_ref[1])) {
      return `${complement_seq[trinucleotide_ref[2]]}${
        complement_seq[trinucleotide_ref[1]]
      }${complement_seq[trinucleotide_ref[0]]}`;
    } else {
      return trinucleotide_ref;
    }
  }

  /**

Converts patient mutation data into mutational spectra.
@async
@function convertMatrix
@memberof ICGC
@param {Array} data - The patient mutation data to be converted.
@param {number} [batch_size=100] - The number of mutations to process in each batch.
@returns {Object} - The mutational spectra of each patient in an object.
@throws {Error} - If there is an error in processing the mutation data.
*/

  async function convertMatrix(data, batch_size = 100) {
    const mutationalSpectra = {};

    for (let patient of data) {
      var mutationalSpectrum = init_sbs_mutational_spectra();
      var promises = [];

      for (let i = 0; i < patient.length; i++) {
        var chromosomeNumber = patient[i]["chromosome"];
        var referenceAllele = patient[i]["reference_genome_allele"];
        var mutatedTo = patient[i]["mutated_to_allele"];
        var position = patient[i]["chromosome_start"];
        var variantType = patient[i]["mutation_type"];

        var promise = getMutationalContext(chromosomeNumber, parseInt(position))
          .then((sequence) => {
            sequence = standardize_trinucleotide(sequence);
            let fivePrime = sequence[0];
            let threePrime = sequence[2];
            let mutationType = String(
              `${fivePrime}[${standardize_substitution(
                referenceAllele,
                mutatedTo
              )}]${threePrime}`
            ).toUpperCase();

            if (
              (variantType == "SNP" ||
                variantType == "single base substitution") &&
              !mutationType.includes("N") &&
              !mutationType.includes("U")
            ) {
              mutationalSpectrum[mutationType] =
                Number(mutationalSpectrum[mutationType]) + Number(1);
            }
          })
          .catch((error) => {
            console.error(error);
          });
        promises.push(promise);

        if (i % batch_size === 0 || i === patient.length - 1) {
          await Promise.all(promises);
          promises = [];
        }
      }
      mutationalSpectra[[patient[0]["project_code"]]] = mutationalSpectrum;
    }

    return mutationalSpectra;
  }

  async function getMutationalContext(chromosomeNumber, startPosition) {
    const chrName = String(chromosomeNumber);
    const startByte = startPosition - 2;
    const endByte = startPosition;

    const alternative = await (
      await fetch(
        `https://api.genome.ucsc.edu/getData/sequence?genome=hg19;chrom=chr${chrName};start=${startByte};end=${
          endByte + 1
        }`
      )
    ).json();

    const sequence = alternative.dna;
    return sequence;
  }

  //#endregion

  //#region Convert WGS MAF file to Panel MAF file

  function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
  /**

Converts whole-genome variant frequencies (WgMAFs) to panel variant frequencies.
@async
@function convertWGStoPanel
@memberof ICGC
@param {Array<Array<number>>} WgMAFs - An array of arrays containing WgMAFs.
@param {Array<Array<number>>|string} panelDf - An array of arrays or a string representing the file path of the panel variant frequencies.
@returns {Promise<Array<Array<number>>>} An array of arrays containing panel variant frequencies.
  */
  function downsampleWGSArray(WGSArray, panelArray) {
    const includedRows = [];

    for (var i = 0; i < WGSArray.length - 1; i++) {
      let row = WGSArray[i];

      let filteredRow;
      if (isNumeric(row["chromosome"])) {
        filteredRow = panelArray.filter(
          (panelRow) =>
            parseInt(panelRow["Chromosome"]) === parseInt(row["chromosome"]) &&
            parseInt(panelRow["Start_Position"]) <=
              parseInt(row["chromosome_start"]) &&
            parseInt(panelRow["End_Position"]) >=
              parseInt(row["chromosome_end"])
        );
      } else {
        filteredRow = panelArray.filter(
          (panelRow) =>
            panelRow["Chromosome"] === row["chromosome"] &&
            parseInt(panelRow["Start_Position"]) <=
              parseInt(row["chromosome_start"]) &&
            parseInt(panelRow["End_Position"]) >=
              parseInt(row["chromosome_end"])
        );
      }

      if (filteredRow.length > 0) {
        includedRows.push(row);
      }
    }

    return includedRows;
  }

  // Create a function that reads a csv file and returns a nested array of the data
  async function readCSV(csvFile) {
    return new Promise((resolve, reject) => {
      Papa.default.parse(csvFile, {
        download: true,
        header: true,
        complete: function (results) {
          resolve(results.data);
        },
      });
    });
  }

  async function convertWGStoPanel(WgMAFs, panelDf) {
    // Check if the panel file is an array of arrays or a file path. If it is a file path, read the file and convert it to an array of arrays
    let bed_file;
    if (typeof panelDf === "string") {
      bed_file = await readCSV(panelDf);
    } else {
      bed_file = panelDf;
    }

    const panelMAFs = [];
    for (let WgMAF of WgMAFs) {
      const downsampledWGSMAF = downsampleWGSArray(WgMAF, bed_file);
      panelMAFs.push(downsampledWGSMAF);
    }
    return panelMAFs;
  }

function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  return dotProduct / (magnitudeA * magnitudeB);
}

function linspace(a, b, n) {
  return Array.from({ length: n }, (_, i) => a + (i * (b - a)) / (n - 1));
}

// Deep copy an object
function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Solve argmin_x || Ax - b ||_2 for x>=0. A is a matrix, b is a vector.
// Output is a vector x with the same length as b. The rnrom is the residual || Ax - b ||^2.
async function nnls(A, b, maxiter = 3 * A[0].length) {
  const transpose = (matrix) =>
    matrix[0].map((_, i) => matrix.map((row) => row[i]));
  A = transpose(A);
  const dot = (a, b) => {
    if (a[0].length === undefined) {
      // Vector-vector multiplication
      return a.map((_, i) => a[i] * b[i]).reduce((sum, x) => sum + x);
    } else {
      // Matrix-vector multiplication
      return a.map((row) => row.reduce((sum, x, i) => sum + x * b[i], 0));
    }
  };
  const matrixMultiply = (A, B) => {
    if (B[0].length === undefined) {
      // Matrix-vector multiplication
      return dot(A, B);
    } else {
      // Matrix-matrix multiplication
      return A.map((row) =>
        B[0].map((_, j) =>
          dot(
            row,
            B.map((col) => col[j])
          )
        )
      );
    }
  };
  const vectorSubtraction = (a, b) => a.map((x, i) => x - b[i]);
  const vectorAddition = (a, b) => a.map((x, i) => x + b[i]);
  const vectorScale = (a, scalar) => a.map((x) => x * scalar);
  const vectorNorm = (a) => Math.sqrt(dot(a, a));

  const At = transpose(A);
  const AtA = matrixMultiply(At, A);
  const Atb = matrixMultiply(At, b);

  let x = Array(A[0].length).fill(0);
  let gradient;
  let rnorm;

  for (let iter = 0; iter < maxiter; iter++) {
    gradient = vectorSubtraction(matrixMultiply(AtA, x), Atb);
    let negativeGradient = gradient.map((x) => -x);

    let alpha = 1;
    let new_x = vectorAddition(x, vectorScale(negativeGradient, alpha));

    while (new_x.some((val) => val < 0)) {
      alpha /= 2;
      new_x = vectorAddition(x, vectorScale(negativeGradient, alpha));
    }

    x = new_x;

    if (vectorNorm(gradient) <= 1e-8) {
      break;
    }
  }

  rnorm = Math.sqrt(
    dot(
      vectorSubtraction(matrixMultiply(A, x), b),
      vectorSubtraction(matrixMultiply(A, x), b)
    )
  );

  return { x, rnorm };
}

async function fetchURLAndCache$1(cacheName, url, ICGC = null) {
  const isCacheSupported = "caches" in window;
  let matchedURL;

  if (!isCacheSupported) {
    return await fetch(url);
  } else {
    // Retrieve data from the cache

    if (ICGC != null) {
      matchedURL = ICGC;
    } else {
      matchedURL = url;
    }

    return await caches.open(cacheName).then((cache) => {
      return cache.match(matchedURL).then(function (response) {
        // Check if the data was found in the cache
        if (response) {
          // Use the cached data
          console.log("Data found in cache:", response);
          return response;
        } else {
          // Fetch the data from the server
          console.log("Data not found in cache, fetching from server...");
          return fetch(url)
            .then(function (response) {
              // Use the fetched data

              const responseClone = response.clone();
              caches.open(cacheName).then(function (cache) {
                // Add the response to the cache
                cache.put(matchedURL, responseClone);
              });

              console.log("Data fetched from server:", response);

              return response;
            })
            .catch(function (error) {
              throw new Error("Error fetching data:", error);
            });
        }
      });
    });
  }
}

// limit the depth of the forceDirectedTree
function limitDepth(data, maxDepth) {
  if (maxDepth === 0 || !Array.isArray(data.children)) {
    // Base case: If max depth is reached or there are no more children, return data
    return data;
  }

  // Recursively limit the depth of each child
  data.children = data.children.map((child) => limitDepth(child, maxDepth - 1));

  if (maxDepth === 1) {
    // If we've reached the maximum depth, merge all children and return the result
    const mergedChildren = data.children.reduce((acc, curr) => {
      if (Array.isArray(curr.children)) {
        return [...acc, ...curr.children];
      } else {
        return [...acc, curr];
      }
    }, []);
    return { ...data, children: mergedChildren };
  } else {
    // Otherwise, return the data with its children intact
    return data;
  }
}

// Write a function that converts the json data from ./now.json to the format in ./structure.json

function formatHierarchicalClustersToAM5Format(
  firstFileStructure,
  studyName,
  genomeType,
  cancerType,
  studySize,
  originalData
) {
  const result = {
    name: `${studyName} ${cancerType}\n${genomeType} Dataset (n=${studySize})`,
    totalMutationCount: Object.values(originalData)
      .map((array) => {
        return Object.values(array);
      })
      .reduce((a, b) => {
        return a.concat(b);
      }) // flatten array
      .reduce((a, b) => {
        return a + b;
      }),
    children: [],
  };
  function traverse(node, parent) {
    const children = {
      name: 1 - node.distance,
      // value: 1 - node.distance,
      children: [],
      totalMutationCount: 0,
    };
    if (node.left) traverse(node.left, children);
    if (node.right) traverse(node.right, children);
    if (node.name) children.name = node.name;
    // if (node.name) children.value = 1;
    if (node.name) children.mutations = originalData[node.name];
    if (node.name)
      children.totalMutationCount = Object.values(
        originalData[node.name]
      ).reduce((a, b) => a + b, 0);
    if (!node.name)
      children.totalMutationCount = children.children.reduce(
        (a, b) => a + b.totalMutationCount,
        0
      );
    if (!parent) result.children.push(children);
    else parent.children.push(children);
  }
  traverse(firstFileStructure);
  return result;
}

// Takes in an array of objects and a key and returns an object that groups the objects by the key

function groupBy(array, key) {
  return array.reduce((result, currentValue) => {
    (result[currentValue[key]] = result[currentValue[key]] || []).push(
      currentValue
    );
    return result;
  }, {});
}

// This function creates a distance matrix based on 1 - the cosine similarity of a list of mutational spectra vectors
// The input is a list of mutational spectra vectors (each vector is a list of mutation frequencies)
// The output is a distance matrix (a list of lists of distances)
function createDistanceMatrix(matrix, metric, similarity) {
  let distanceMatrix = [];
  for (let i = 0; i < matrix.length; i++) {
    let row = [];
    for (let j = 0; j < matrix.length; j++) {
      let distance;
      if (similarity) {
        distance = 1 - metric(matrix[i], matrix[j]);
      } else {
        distance = metric(matrix[i], matrix[j]);
      }

      row.push(distance);
    }
    distanceMatrix.push(row);
  }
  return distanceMatrix;
}

function hierarchicalClustering(distanceMatrix, sampleNames) {

  let order = flatten(upgma(distanceMatrix).slice(-1)).slice(0, upgma(distanceMatrix).length+1);
  
  // Return the final clustering result as a tree
  return buildTree(order, distanceMatrix, sampleNames);
}

// This function calculates the average distance between two clusters. It takes in two clusters and a distance matrix as its parameters. The clusters are arrays of indices of the samples in the distance matrix. It finds the average distance between the two clusters and returns the average distance.

function calculateDistance(cluster1, cluster2, distanceMatrix) {
  // Calculate the average distance between samples in the two clusters
  let distanceSum = 0;
  let numPairs = 0;

  for (let i = 0; i < cluster1.length; i++) {
    for (let j = 0; j < cluster2.length; j++) {
      distanceSum += distanceMatrix[cluster1[i]][cluster2[j]];
      numPairs++;
    }
  }

  return distanceSum / numPairs;
}

function buildTree(cluster, distanceMatrix, sampleNames) {
  // Recursively build the tree using nested objects
  if (cluster.length == 1) {
    // If the cluster contains only one sample, return it as a leaf node
    return { name: sampleNames[cluster[0]] };
  } else {
    // Otherwise, recursively build the tree for each sub-cluster
    let leftCluster = cluster.slice(0, Math.floor(cluster.length / 2));
    let rightCluster = cluster.slice(Math.floor(cluster.length / 2));

    return {
      left: buildTree(leftCluster, distanceMatrix, sampleNames),
      right: buildTree(rightCluster, distanceMatrix, sampleNames),
      distance: calculateDistance(leftCluster, rightCluster, distanceMatrix),
    };
  }
}

function flatten(array) {
  return array.reduce(function(memo, el) {
    var items = Array.isArray(el) ? flatten(el) : [el];
    return memo.concat(items);
  }, []);
}

function copyNestedArray(arr) {
  let copy = arr.slice();
  for (let i = 0; i < copy.length; i++) {
    if (Array.isArray(copy[i])) {
      copy[i] = copyNestedArray(copy[i]);
    }
  }
  return copy;
}

function upgma(distanceMatrix) {
  distanceMatrix = copyNestedArray(distanceMatrix);

  const clusters = distanceMatrix.map((_, index) => [index]);
  const result = [];

  while (clusters.length > 1) {
    const [minI, minJ] = findMinIndices(distanceMatrix);
    const minDist = distanceMatrix[minI][minJ];

    result.push([clusters[minI], clusters[minJ], minDist / 2]);

    const newCluster = clusters[minI].concat(clusters[minJ]);
    clusters[minI] = newCluster;
    clusters.splice(minJ, 1);

    updateDistanceMatrix(distanceMatrix, minI, minJ);
  }

  return result;
}

function findMinIndices(matrix) {
  let minI = 0;
  let minJ = 1;
  let minDist = matrix[minI][minJ];

  for (let i = 0; i < matrix.length; i++) {
    for (let j = i + 1; j < matrix[i].length; j++) {
      if (matrix[i][j] < minDist) {
        minDist = matrix[i][j];
        minI = i;
        minJ = j;
      }
    }
  }
  return [minI, minJ];
}

function updateDistanceMatrix(matrix, minI, minJ) {
  for (let k = 0; k < matrix.length; k++) {
    if (k === minI || k === minJ) continue;
    const newDist =
      (matrix[minI][k] * matrix[minI].length +
        matrix[minJ][k] * matrix[minJ].length) /
      (matrix[minI].length + matrix[minJ].length);
    matrix[minI][k] = newDist;
    matrix[k][minI] = newDist;
  }

  matrix.splice(minJ, 1);
  matrix.forEach((row) => row.splice(minJ, 1));
}

function euclideanDistance(pointA, pointB) {
  var sum = 0;
  for (var i = 0; i < pointA.length; i++) {
    var difference = pointA[i] - pointB[i];
    sum += difference * difference;
  }
  return Math.sqrt(sum);
}

function doubleClustering(
  matrix,
  rowNames,
  colNames,
  metric = euclideanDistance
) {
  const distanceMatrix = createDistanceMatrix(matrix, metric, false);
  let rowOrder = flatten(upgma(distanceMatrix).slice(-1)).slice(
    0,
    upgma(distanceMatrix).length + 1
  );

  const transposedMatrix = matrix[0].map((_, i) => matrix.map((row) => row[i]));
  const distanceMatrixTransposed = createDistanceMatrix(
    transposedMatrix,
    metric,
    false
  );
  let colOrder = flatten(upgma(distanceMatrixTransposed).slice(-1)).slice(
    0,
    upgma(distanceMatrixTransposed).length + 1
  );

  const sortedMatrix = rowOrder.map((i) => colOrder.map((j) => matrix[i][j]));
  const sortedRowNames = rowOrder.map((i) => rowNames[i]);
  const sortedColNames = colOrder.map((i) => colNames[i]);

  return {
    matrix: sortedMatrix,
    rowNames: sortedRowNames,
    colNames: sortedColNames,
  };
}

// import * as mSigPortalPlotting from "./index.js";

const mSigSDK = (function () {
  /**
   * @namespace mSigPortalData
   */

  /**
   * @namespace mSigPortalPlots
   */

  /**
   * @namespace ICGC
   */

  //#region Mutational Signatures

  /**

Retrieves the mutational signature options from the specified API endpoint.
@async
@function
@memberof mSigPortalData
@name getMutationalSignaturesOptions
@param {string} [genomeDataType="WGS"] - The genome data type to use. Defaults to "WGS".
@param {string} [mutationType="SBS"] - The mutation type to use. Defaults to "SBS".
@returns {Promise} A Promise that resolves to the mutational signature options in JSON format.
@example
const mutationalSignatures = await getMutationalSignaturesOptions("WGS", "SBS");
console.log(mutationalSignatures);
*/
  async function getMutationalSignaturesOptions(
    genomeDataType = "WGS",
    mutationType = "SBS"
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/mutational_signature_options?
    source=Reference_signatures&strategy=${genomeDataType}&profile=${mutationType}&offset=0`;
    const cacheName = "getMutationalSignaturesOptions";
    return await (await fetchURLAndCache$1(cacheName, url)).json();
  }

  /**

Retrieves mutational signatures data from the specified endpoint and returns it as JSON.
@async
@function
@memberof mSigPortalData
@param {string} [genomeDataType="WGS"] - The type of genome data to use. Defaults to "WGS".
@param {string} [signatureSetName="COSMIC_v3_Signatures_GRCh37_SBS96"] - The name of the signature set to use. Defaults to "COSMIC_v3_Signatures_GRCh37_SBS96".
@param {string} [mutationType="SBS"] - The type of mutation to analyze. Defaults to "SBS".
@param {number} [numberofResults=10] - The number of results to retrieve. Defaults to 10.
@returns {Promise<Object>} - A Promise that resolves to the unformatted mutational signatures data as JSON.
*/

  async function getMutationalSignaturesData(
    genomeDataType = "WGS",
    signatureSetName = "COSMIC_v3_Signatures_GRCh37_SBS96",
    mutationType = "SBS",
    numberofResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/mutational_signature?
    source=Reference_signatures&strategy=${genomeDataType}&profile=${mutationType}&matrix=96&signatureSetName=${signatureSetName}&limit=${numberofResults}&offset=0`;
    const cacheName = "getMutationalSignaturesData";
    const unformattedData = await (
      await fetchURLAndCache$1(cacheName, url)
    ).json();
    extractMutationalSpectra(
      unformattedData,
      "signatureName"
    );
    return unformattedData;
  }

  /**

Returns a summary of mutational signatures based on the provided signature set name and number of results.
@async
@function
@memberof mSigPortalData
@param {number} [numberofResults=10] - The number of results to retrieve. Defaults to 10 if not provided.
@param {string} [signatureSetName="COSMIC_v3.3_Signatures"] - The name of the signature set to retrieve. Defaults to "COSMIC_v3.3_Signatures" if not provided.
@returns {Promise<Object>} - A Promise that resolves to an object representing the mutational signature summary.
@throws {Error} - Throws an error if there was an issue fetching the mutational signature summary.
@example
const summary = await getMutationalSignaturesSummary(20, "COSMIC_v3.3_Signatures");
console.log(summary);
*/

  async function getMutationalSignaturesSummary(
    numberofResults = 10,
    signatureSetName = "COSMIC_v3.3_Signatures"
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/mutational_signature_summary?signatureSetName=${signatureSetName}&limit=${numberofResults}&offset=0`;
    const cacheName = "getMutationalSignaturesSummary";
    return await (await fetchURLAndCache$1(cacheName, url)).json();
  }
  //#endregion

  //#region Mutational Spectrum

  /**

Retrieves mutational spectrum options from the mutational signatures API.
@async
@memberof mSigPortalData
@function
@param {string} [study="PCAWG"] - The name of the study to retrieve options for. Defaults to "PCAWG".
@param {string} [genomeDataType="WGS"] - The genome data type to retrieve options for. Defaults to "WGS".
@param {string} [cancerType="Lung-AdenoCA"] - The cancer type to retrieve options for. Defaults to "Lung-AdenoCA".
@param {number} [numberOfResults=10] - The number of results to retrieve. Defaults to 10.
@returns {Promise<Object>} A Promise that resolves to the JSON response from the mutational signatures API.
*/

  async function getMutationalSpectrumOptions(
    study = "PCAWG",
    genomeDataType = "WGS",
    cancerType = "Lung-AdenoCA",
    numberOfResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/mutational_spectrum_options?study=${study}&cancer=${cancerType}&strategy=${genomeDataType}&offset=0&limit=${numberOfResults}`;
    const cacheName = "getMutationalSpectrumOptions";
    return await (await fetchURLAndCache$1(cacheName, url)).json();
  }

  /**

* Fetches mutational spectrum data from the Cancer Genomics Data Server API and returns it in a formatted way.
* @async
* @function getMutationalSpectrumData
* @memberof mSigPortalData
* @param {string} [study="PCAWG"] - The study identifier.
* @param {string[]|null} [samples=null] - The sample identifier(s) to query data for.
* @param {string} [genomeDataType="WGS"] - The genome data type identifier.
* @param {string} [cancerType="Lung-AdenoCA"] - The cancer type identifier.
* @param {string} [mutationType="SBS"] - The mutation type identifier.
* @param {number} [matrixSize=96] - The size of the mutational spectrum matrix.
* @returns {Promise} - A promise that resolves to the formatted mutational spectrum data.
*/
  async function getMutationalSpectrumData(
    study = "PCAWG",
    samples = null,
    genomeDataType = "WGS",
    cancerType = "Lung-AdenoCA",
    mutationType = "SBS",
    matrixSize = 96
  ) {
    const cacheName = "getMutationalSpectrumData";

    const promises = [];
    let urls = [];

    if (cancerType == null) {
      let url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/mutational_spectrum?study=${study}&strategy=${genomeDataType}&profile=${mutationType}&matrix=${matrixSize}&offset=0`;

      let unformattedData = await (
        await fetchURLAndCache$1(cacheName, url)
      ).json();

      return unformattedData;
    }

    if (samples === null) {
      let url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/mutational_spectrum?study=${study}&cancer=${cancerType}&strategy=${genomeDataType}&profile=${mutationType}&matrix=${matrixSize}&offset=0`;

      let unformattedData = await (
        await fetchURLAndCache$1(cacheName, url)
      ).json();
      extractMutationalSpectra(unformattedData, "sample");
      return unformattedData;
    } else {
      samples.forEach((sample) => {
        urls.push(
          `https://analysistools-dev.cancer.gov/mutational-signatures/api/mutational_spectrum?study=${study}&sample=${sample}&cancer=${cancerType}&strategy=${genomeDataType}&profile=${mutationType}&matrix=${matrixSize}&offset=0`
        );
      });
    }

    urls.forEach((url) => {
      promises.push(fetchURLAndCache$1(cacheName, url));
    });

    const results = await Promise.all(promises);

    const data = await Promise.all(
      results.map((result) => {
        return result.json();
      })
    );

    extractMutationalSpectra(data.flat(), "sample");

    return data;
  }

  /**

Fetches the mutational spectrum summary from the mutational signatures API based on the given parameters.
@async
@function
@memberof mSigPortalData
@param {string} [study="PCAWG"] - The name of the cancer genome study. Default is "PCAWG".
@param {string} [genomeDataType="WGS"] - The type of genomic data used. Default is "WGS".
@param {string} [cancerType="Lung-AdenoCA"] - The type of cancer. Default is "Lung-AdenoCA".
@param {number} [numberOfResults=10] - The number of results to be returned. Default is 10.
@returns {Promise} - A Promise that resolves to a JSON object representing the mutational spectrum summary.
@throws {Error} - If the API request fails.
*/

  async function getMutationalSpectrumSummary(
    study = "PCAWG",
    genomeDataType = "WGS",
    cancerType = "Lung-AdenoCA",
    numberOfResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/mutational_spectrum_summary?study=${study}&cancer=${cancerType}&strategy=${genomeDataType}&limit=${numberOfResults}&offset=0`;
    const cacheName = "getMutationalSpectrumSummary";
    return await (await fetchURLAndCache$1(cacheName, url)).json();
  }

  //#endregion

  //#region Mutational Signature Association

  /**

Fetches the mutational signature association options from the API endpoint
@async
@function
@memberof mSigPortalData
@param {string} [study="PCAWG"] - The name of the study. Defaults to "PCAWG".
@param {string} [genomeDataType="WGS"] - The type of genome data. Defaults to "WGS".
@param {number} [numberOfResults=10] - The number of results to return. Defaults to 10.
@returns {Promise<Array>} - A Promise that resolves to an array of mutational signature association options.
@throws {Error} - If an error occurs during the fetching or caching of the data.
*/

  async function getMutationalSignatureAssociationOptions(
    study = "PCAWG",
    genomeDataType = "WGS",
    numberOfResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/signature_association_options?study=${study}&strategy=${genomeDataType}&limit=${numberOfResults}&offset=0`;
    const cacheName = "getMutationalSignatureAssociationOptions";
    return await (await fetchURLAndCache$1(cacheName, url)).json();
  }

  /**

Retrieves mutational signature association data from a specified cancer study using the provided parameters.
@async
@function
@memberof mSigPortalData
@param {string} [study="PCAWG"] - The name of the cancer study. Default is "PCAWG".
@param {string} [genomeDataType="WGS"] - The type of genome data used. Default is "WGS".
@param {string} [cancerType="Biliary-AdenoCA"] - The type of cancer. Default is "Biliary-AdenoCA".
@param {number} [numberOfResults=10] - The maximum number of results to return. Default is 10.
@returns {Promise<object>} - A Promise that resolves to the JSON response containing the mutational signature association data.
*/

  async function getMutationalSignatureAssociationData(
    study = "PCAWG",
    genomeDataType = "WGS",
    cancerType = "Biliary-AdenoCA",
    numberOfResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/signature_association?study=${study}&strategy=${genomeDataType}&cancer=${cancerType}&limit=${numberOfResults}&offset=0`;
    const cacheName = "getMutationalSignatureAssociationData";
    return await (await fetchURLAndCache$1(cacheName, url)).json();
  }

  //#endregion

  //#region Mutational Signature Activity

  /**

Retrieves a list of mutational signature activity options from the mutational signatures API.
@async
@function getMutationalSignatureActivityOptions
@memberof mSigPortalData
@param {string} [study="PCAWG"] - The name of the study to retrieve mutational signature activity options for. Defaults to "PCAWG".
@param {string} [genomeDataType="WGS"] - The genome data type to retrieve mutational signature activity options for. Defaults to "WGS".
@param {number} [numberOfResults=10] - The number of results to retrieve. Defaults to 10.
@returns {Promise<Array>} - A promise that resolves with an array of mutational signature activity options.
*/
  async function getMutationalSignatureActivityOptions(
    study = "PCAWG",
    genomeDataType = "WGS",
    numberOfResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/signature_activity_options?study=${study}&strategy=${genomeDataType}&limit=${numberOfResults}&offset=0`;
    const cacheName = "getMutationalSignatureActivityOptions";
    return await (await fetchURLAndCache$1(cacheName, url)).json();
  }
  /**

Retrieves mutational signature landscape data from the mutational-signatures API.
@async
@function
@memberof mSigPortalData
@param {string} [study="PCAWG"] - The name of the study. Default value is "PCAWG".
@param {string} [genomeDataType="WGS"] - The type of genome data. Default value is "WGS".
@param {string} [cancerType=""] - The name of the cancer type. Default value is an empty string.
@param {string} [signatureSetName="COSMIC_v3_Signatures_GRCh37_SBS96"] - The name of the signature set. Default value is "COSMIC_v3_Signatures_GRCh37_SBS96".
@param {number} [numberOfResults=10] - The maximum number of results to be returned. Default value is 10.
@returns {Promise<Object>} - A Promise that resolves to the JSON data of the mutational signature landscape.
*/

  async function getMutationalSignatureActivityData(
    study = "PCAWG",
    genomeDataType = "WGS",
    signatureSetName = "COSMIC_v3_Signatures_GRCh37_SBS96",
    cancerType = "",
    numberOfResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/signature_activity?study=${study}&strategy=${genomeDataType}&signatureSetName=${signatureSetName}&limit=${numberOfResults}&cancer=${cancerType}&offset=0`;
    const cacheName = "getMutationalSignatureActivityData";
    return await (await fetchURLAndCache$1(cacheName, url)).json();
  }

  /**

Retrieves mutational signature landscape data from an API endpoint.
@async
@function getMutationalSignatureLandscapeData
@param {string} [study="PCAWG"] - The study to retrieve data from.
@param {string} [genomeDataType="WGS"] - The type of genomic data used in the study.
@param {string} [cancerType=""] - The type of cancer to retrieve data for.
@param {string} [signatureSetName="COSMIC_v3_Signatures_GRCh37_SBS96"] - The name of the mutational signature set to retrieve.
@param {number} [numberOfResults=10] - The number of results to retrieve.
@returns {Promise<object>} - A promise that resolves to an object containing the mutational signature landscape data.
*/
  async function getMutationalSignatureLandscapeData(
    study = "PCAWG",
    genomeDataType = "WGS",
    cancerType = "",
    signatureSetName = "COSMIC_v3_Signatures_GRCh37_SBS96",
    numberOfResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/signature_activity?study=${study}&strategy=${genomeDataType}&signatureSetName=${signatureSetName}&cancer=${cancerType}&limit=${numberOfResults}&offset=0`;
    const cacheName = "getMutationalSignatureLandscapeData";
    return await (await fetchURLAndCache$1(cacheName, url)).json();
  }

  //#endregion

  //#region Mutational Signature Etiology

  /**

Retrieves the etiology options for a given mutational signature from the Cancer.gov Mutational Signatures API.
@async
@function
@memberof mSigPortalData
@param {string} [study="PCAWG"] - The name of the study to retrieve etiology options for. Defaults to "PCAWG".
@param {string} [genomeDataType="WGS"] - The type of genome data to retrieve etiology options for. Defaults to "WGS".
@param {string} [signatureName="SBS3"] - The name of the mutational signature to retrieve etiology options for. Defaults to "SBS3".
@param {string} [cancerType=""] - The cancer type to retrieve etiology options for. Defaults to an empty string.
@param {number} [numberOfResults=10] - The maximum number of results to return. Defaults to 10.
@returns {Promise<Object>} A promise that resolves to an object representing the etiology options for the specified mutational signature.
The object will have the following properties:
etiology: An array of strings representing the possible etiologies for the mutational signature.
etiology_display: An array of strings representing the display names for the possible etiologies.
signatureName: The name of the mutational signature.
study: The name of the study.
genome_data_type: The type of genome data.
cancer_type: The cancer type.
*/
  async function getMutationalSignatureEtiologyOptions(
    study = "PCAWG",
    genomeDataType = "WGS",
    signatureName = "SBS3",
    cancerType = "",
    numberOfResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/signature_etiology_options?study=${study}&strategy=${genomeDataType}&signatureName=${signatureName}&cancer=${cancerType}&limit=${numberOfResults}&offset=0`;
    const cacheName = "getMutationalSignatureEtiologyOptions";
    return await (await fetchURLAndCache$1(cacheName, url)).json();
  }

  /**

Retrieves mutational signature etiology data from the Cancer Genomics Research Laboratory (CGR) website.
@async
@function getMutationalSignatureEtiologyData
@memberof mSigPortalData
@param {string} [study="PCAWG"] - The study name. Default is "PCAWG".
@param {string} [genomeDataType="WGS"] - The genome data type. Default is "WGS".
@param {string} [signatureName="SBS3"] - The signature name. Default is "SBS3".
@param {string} [cancerType=""] - The cancer type. Default is an empty string.
@param {number} [numberOfResults=10] - The number of results to return. Default is 10.
@returns {Promise} A promise that resolves to the mutational signature etiology data in JSON format.
*/
  async function getMutationalSignatureEtiologyData(
    study = "PCAWG",
    genomeDataType = "WGS",
    signatureName = "SBS3",
    cancerType = "",
    numberOfResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/signature_etiology?study=${study}&strategy=${genomeDataType}&signatureName=${signatureName}&cancer=${cancerType}&limit=${numberOfResults}&offset=0`;
    const cacheName = "getMutationalSignatureEtiologyData";
    return await (await fetchURLAndCache$1(cacheName, url)).json();
  }

  //#endregion

  //#region Plot the summary of a dataset

  /**

Generates a mutational spectrum summary plot and displays it in a given HTML div element.
@async
@function
@memberof mSigPortalPlots
@param {string} [studyName="PCAWG"] - The name of the cancer genomics study to use. Default is "PCAWG".
@param {string} [genomeDataType="WGS"] - The type of genomic data to use. Default is "WGS".
@param {string} [cancerTypeOrGroup="Lung-AdenoCA"] - The cancer type or group to display. Default is "Lung-AdenoCA".
@param {number} [numberOfResults=50] - The maximum number of results to display. Default is 50.
@param {string} [divID="mutationalSpectrumSummary"] - The ID of the HTML div element where the plot will be displayed. Default is "mutationalSpectrumSummary".
@returns {Promise<void>} A Promise that resolves when the plot is displayed or rejects if there is an error.
@throws {Error} If there is an error retrieving or displaying the plot, this function will throw an Error with a message describing the error.
*/

  // This function plots the mutational spectrum summary for the given parameters.
  // Input:
  // - studyName: Name of the study for which the data is to be fetched
  // - genomeDataType: Type of the genome data to be fetched
  // - cancerTypeOrGroup: Cancer type or group for which the data is to be fetched
  // - numberOfResults: Number of results to be fetched
  // Output: A mutational spectrum summary plot of the given parameters
  async function plotProfilerSummary(
    studyName = "PCAWG",
    genomeDataType = "WGS",
    cancerTypeOrGroup = "Lung-AdenoCA",
    numberOfResults = 50,
    divID = "mutationalSpectrumSummary"
  ) {
    try {
      const summary = await getMutationalSpectrumSummary(
        studyName,
        genomeDataType,
        cancerTypeOrGroup,
        numberOfResults
      );
      let data = await getBarPlotData(summary);
      if (data.length == 0) {
        // $(`#${divID}`).html(
        //   `<p style="color:red">Error: no data available for the selected parameters.</p>`
        // );
      } else {
        let layout = {
          title: `${studyName} ${cancerTypeOrGroup} ${genomeDataType} Mutational Spectrum Summary`,
          xaxis: {
            title: "Sample",
          },
          yaxis: {
            title: "Log (Number of Mutations)",
          },
          barmode: "stack",
        };
        Plotly.default.newPlot(divID, data, layout);
      }
    } catch (err) {
      console.error(err);
      $(`#${divID}`).html(`<p>Error: ${err.message}</p>`);
    }
  }

  async function getBarPlotData(summary) {
    let data = [];
    for (let i = 0; i < summary.length; i++) {
      if (
        !data.some(
          (e) => e.name === summary[i]["profile"] + `: ${summary[i]["matrix"]}`
        )
      ) {
        data.push({
          x: [summary[i]["sample"]],
          y: [summary[i]["logTotalMutations"]],
          text: [parseInt(summary[i]["meanTotalMutations"])],
          type: "bar",
          name: summary[i]["profile"] + `: ${summary[i]["matrix"]}`,
          marker: {
            color: summary[i].color,
          },
        });
      } else {
        let existingData = data.find(
          (e) => e.name === summary[i]["profile"] + `: ${summary[i]["matrix"]}`
        );
        existingData.x.push(summary[i]["sample"]);
        existingData.y.push(summary[i]["logTotalMutations"]);
        existingData.text.push(parseInt(summary[i]["meanTotalMutations"]));
      }
    }
    return data;
  }

  // This function plots the mutational spectrum mutational count as boxplots for each cancer type for the given dataset.

  /**

Plots the mutational burden by cancer type for a given project.
@async
@function plotProjectMutationalBurdenByCancerType
@memberof mSigPortalPlots
@param {Object} project - An object containing mutational data for different cancer types.
@param {string} divID - The ID of the div where the plot should be displayed.
@returns {Promise} - A Promise that resolves when the plot is displayed.
@example
// Example usage:
plotProjectMutationalBurdenByCancerType(projectData, "plotDiv");
*/
  async function plotProjectMutationalBurdenByCancerType(project, divID) {
    project = groupBy(project, "cancer");
    Object.keys(project).forEach(function (key, index) {
      project[key] = groupBy(project[key], "sample");
      Object.keys(project[key]).forEach(function (patient, index) {
        project[key][patient] = Object.values(
          extractMutationalSpectra(project[key][patient], "sample")
        )[0];
      });
    });

    // Loop through all the cancertypes in project and create a trace for each cancer type and add it to the data array

    const cancerTypes = Object.keys(project);

    const data = [];

    const boxColor = {};
    const allColors = linspace(0, 360, cancerTypes.length);
    for (var i = 0; i < cancerTypes.length - 1; i++) {
      var result = "hsl(" + allColors[i] + ",50%" + ",50%)";
      boxColor[cancerTypes[i]] = result;
    }

    for (let cancerType of cancerTypes) {
      const cancerTypeData = Object.values(project[cancerType]);

      const trace = {
        // x: Object.keys(project[cancerType]),
        y: Object.values(cancerTypeData).map((e) =>
          Math.log10(Object.values(e).reduce((a, b) => a + b, 0))
        ),
        type: "box",
        name: cancerType,
        marker: {
          color: boxColor[cancerType],
        },
        boxpoints: "Outliers",
      };

      data.push(trace);
    }

    const layout = {
      title: `Mutational Burden by Cancer Type`,
      xaxis: {
        title: "Cancer Type",
        type: "category",
        automargin: true,
      },
      yaxis: {
        title: "Log (Number of Mutations)",
      },
      barmode: "stack",
      height: 600,
    };

    Plotly.default.newPlot(divID, data, layout);
  }

  //#endregion

  //#region Plot a patient's mutational spectra
  /**

Renders a plot of the mutational spectra for one or more patients in a given div element ID using Plotly.
@async
@function plotPatientMutationalSpectrum
@memberof mSigPortalPlots
@param {Object} mutationalSpectra - An object containing the mutational spectra data for one or more patients.
@param {number} [matrixSize=96] - The size of the plot matrix. Defaults to 96.
@param {string} [divID='mutationalSpectrumMatrix'] - The ID of the div element to render the plot in. Defaults to 'mutationalSpectrumMatrix'.
@returns {Promise<void>} A promise that resolves when the plot has been rendered.
@throws {Error} An error is thrown if no data is available for the selected parameters.
*/

  // This function plots the mutational spectrum for the given parameters.
  async function plotPatientMutationalSpectrum(
    mutationalSpectra,
    divID = "mutationalSpectrumMatrix"
  ) {
    let matrixSize = mutationalSpectra[0].length;
    let mutationType = "SBS";
    const numberOfPatients = Object.keys(mutationalSpectra).length;
    console.log(numberOfPatients, mutationType, matrixSize);
    if (numberOfPatients == 1) {
      mutationType = mutationalSpectra[0][0].profile;
    }

    if (numberOfPatients == 0) {
      $(`#${divID}`).html(
        `<p style="color:red">Error: no data available for the selected parameters.</p>`
      );
    } else if (
      numberOfPatients > 1 &&
      matrixSize == 96 &&
      mutationType == "SBS"
    ) {
      mutationalSpectra = extractMutationalSpectra(mutationalSpectra);
      const layout = {
        title: `Mutational Spectra for ${Object.keys(mutationalSpectra).join(
          ", "
        )}`,
        xaxis: { title: "Mutation Type" },
        yaxis: { title: "Count" },
        barmode: "group",
      };

      const traces = Object.keys(mutationalSpectra).map((patient) => ({
        x: Object.keys(mutationalSpectra[patient]),
        y: Object.values(mutationalSpectra[patient]),
        name: `${patient}`,
        type: "bar",
      }));

      Plotly.default.newPlot(divID, traces, layout);
    } else if (
      numberOfPatients == 1 &&
      matrixSize == 96 &&
      mutationType == "SBS"
    ) {
      let traces = SBS96(mutationalSpectra[0]);
      Plotly.default.newPlot(divID, traces.traces, traces.layout);
      return traces;
    } else if (
      numberOfPatients == 1 &&
      matrixSize == 192 &&
      mutationType == "SBS"
    ) {
      let traces = SBS192(mutationalSpectra[0]);
      Plotly.default.newPlot(divID, traces.traces, traces.layout);
      return traces;
    } else if (
      numberOfPatients == 1 &&
      matrixSize == 288 &&
      mutationType == "SBS"
    ) {
      let traces = SBS288(mutationalSpectra[0]);
      Plotly.default.newPlot(divID, traces.traces, traces.layout);
      return traces;
    } else if (
      numberOfPatients == 1 &&
      matrixSize == 384 &&
      mutationType == "SBS"
    ) {
      let traces = SBS384(mutationalSpectra[0]);
      Plotly.default.newPlot(divID, traces.traces, traces.layout);
      return traces;
    } else if (
      numberOfPatients == 1 &&
      matrixSize == 1536 &&
      mutationType == "SBS"
    ) {
      let traces = SBS1536(mutationalSpectra[0]);
      Plotly.default.newPlot(divID, traces.traces, traces.layout);
      return traces;
    } else if (
      numberOfPatients == 1 &&
      matrixSize == 78 &&
      mutationType == "DBS"
    ) {
      let traces = DBS78(mutationalSpectra[0]);
      Plotly.default.newPlot(divID, traces.traces, traces.layout);
      return traces;
    } else if (
      numberOfPatients == 1 &&
      matrixSize == 186 &&
      mutationType == "DBS"
    ) {
      let traces = DBS186(mutationalSpectra[0]);
      Plotly.default.newPlot(divID, traces.traces, traces.layout);
      return traces;
    } else if (
      numberOfPatients == 1 &&
      matrixSize == 28 &&
      mutationType == "ID"
    ) {
      let traces = ID28(mutationalSpectra[0]);
      Plotly.default.newPlot(divID, traces.traces, traces.layout);
      return traces;
    } else if (
      numberOfPatients == 1 &&
      matrixSize == 29 &&
      mutationType == "ID"
    ) {
      let traces = ID29(mutationalSpectra[0]);
      Plotly.default.newPlot(divID, traces.traces, traces.layout);
      return traces;
    } else if (
      numberOfPatients == 1 &&
      matrixSize == 83 &&
      mutationType == "ID"
    ) {
      let traces = ID83(mutationalSpectra[0]);
      Plotly.default.newPlot(divID, traces.traces, traces.layout);
      return traces;
    } else if (
      numberOfPatients == 1 &&
      matrixSize == 415 &&
      mutationType == "ID"
    ) {
      let traces = ID415(mutationalSpectra[0]);
      Plotly.default.newPlot(divID, traces.traces, traces.layout);
      return traces;
    } else if (
      numberOfPatients == 1 &&
      matrixSize == 32 &&
      mutationType == "RS"
    ) {
      let traces = RS32(mutationalSpectra[0]);
      Plotly.default.newPlot(divID, traces.traces, traces.layout);
      return traces;
    } else {
      let traces = [];

      const layout = {
        title: `Mutational Spectra for ${Object.keys(mutationalSpectra).join(
          ", "
        )}`,
        xaxis: { title: "Mutation Type" },
        yaxis: { title: "Count" },
        barmode: "group",
      };

      for (let i = 0; i < Object.keys(mutationalSpectra).length; i++) {
        let plotlyData = formatMutationalSpectraData(
          mutationalSpectra[Object.keys(mutationalSpectra)[i]],
          Object.keys(mutationalSpectra)[i]
        );

        traces = traces.concat(plotlyData);
      }

      Plotly.default.newPlot(divID, traces, layout);
    }
  }

  // Write a function that plots a list of mutational spectra one on top of the other in a column using Plotly. The input should be the list of mutational spectra.
  // The output should be a plotly plot with the mutational spectra in a column.

  // This converts the mutational spectra data to a format that can be used to create a plotly chart
  // It takes in the mutational spectra data, the matrix size, and the sample
  // It returns the data in a format that can be used to create a plotly chart
  // The data is an array of objects. Each object has a name, x, y, and type property.
  // The name property is the name of the mutation type
  // The x property is an array of the mutation names
  // The y property is an array of the mutation frequencies
  // The type property is the type of substitution that takes place

  function formatMutationalSpectraData(mutationalSpectrum, sample) {
    const matrixSize = Object.keys(mutationalSpectrum).length;
    if (matrixSize === 96) {
      const substitutionTypes = ["C>A", "C>G", "C>T", "T>A", "T>C", "T>G"];

      const data = substitutionTypes.map((substitutionType) => {
        return {
          name: `${substitutionType}  ${sample}`,
          x: [],
          y: [],
          type: "bar",
        };
      });

      substitutionTypes.forEach((substitutionType) => {
        Object.keys(mutationalSpectrum)
          .filter((key) => {
            return key.includes(substitutionType);
          })
          .forEach((key) => {
            data
              .find((e) => e.name === `${substitutionType}  ${sample}`)
              .x.push(key);
            data
              .find((e) => e.name === `${substitutionType}  ${sample}`)
              .y.push(mutationalSpectrum[key]);
          });
      });

      return data;
    } else if (matrixSize === 192) {
      console.error("Not supported yet");
    } else if (matrixSize === 1536) {
      console.error("Not supported yet");
    } else {
      console.error("Invalid Matrix Size");
    }
  }

  //#endregion

  //#region Creates a force directed tree of the patients in the study based on their mutational spectra

  // This function extracts the mutational spectra out of the mSigPortal API call

  function extractMutationalSpectra(data, groupName = "sample") {
    data = data.flat();

    // Group all of the dictionaries in the data array by sample name
    let groupedData = groupBy(data, groupName);

    // Converts the grouped data into mutational spectrum dictionaries that can be used to create a force directed tree.
    Object.keys(groupedData).forEach(function (key) {
      let mutationalSpectrum = init_sbs_mutational_spectra();

      groupedData[key].forEach((mutation) => {
        let mutationType = mutation["mutationType"];
        if (groupName == "sample") {
          mutationalSpectrum[mutationType] = mutation["mutations"];
        } else if (groupName == "signatureName") {
          mutationalSpectrum[mutationType] = mutation["contribution"];
        } else {
          console.error("Invalid group name");
        }
      });

      groupedData[key] = mutationalSpectrum;
    });
    return groupedData;
  }

  /**

This function creates a heatmap using the cosine similarity matrix for the given grouped data.
@async
@function
@memberof mSigPortalPlots
@param {Object} groupedData - An object containing grouped data where each key is a sample name and its value is an object containing sample data.
@param {string} [studyName="PCAWG"] - The name of the study. Default value is "PCAWG".
@param {string} [genomeDataType="WGS"] - The type of genomic data used. Default value is "WGS".
@param {string} [cancerType="Lung-AdenoCA"] - The type of cancer. Default value is "Lung-AdenoCA".
@param {string} [divID="cosineSimilarityHeatMap"] - The ID of the div where the heatmap should be displayed. Default value is "cosineSimilarityHeatMap".
@returns {Array<Array<number>>} - The cosine similarity matrix.
*/

  async function plotCosineSimilarityHeatMap(
    groupedData,
    studyName = "PCAWG",
    genomeDataType = "WGS",
    cancerType = "Lung-AdenoCA",
    divID = "cosineSimilarityHeatMap",
    conductDoubleClustering = true,
    colorscale = "RdBu"
  ) {
    groupedData = extractMutationalSpectra(groupedData);
    let distanceMatrix = await createDistanceMatrix(
      Object.values(groupedData).map((data) => Object.values(data)),
      cosineSimilarity,
      true
    );

    let cosSimilarityMatrix = distanceMatrix.map(function (row) {
      return row.map(function (cell) {
        return 1 - cell;
      });
    });
    let reorderedData;
    if (conductDoubleClustering) {
      reorderedData = doubleClustering(
        cosSimilarityMatrix,
        Object.keys(groupedData),
        Object.keys(groupedData)
      );
    } else {
      reorderedData = {
        matrix: cosSimilarityMatrix,
        rowNames: Object.keys(groupedData),
        colNames: Object.keys(groupedData),
      };
    }

    let plotlyData = [
      {
        z: reorderedData.matrix,
        x: reorderedData.rowNames,
        y: reorderedData.colNames,
        type: "heatmap",
        colorscale: colorscale,
      },
    ];

    let layout = {
      title: `${studyName} ${cancerType} ${genomeDataType} Cosine Similarity Heatmap`,
      height: 800,
      xaxis: {
        title: "Sample",
        type: "category",
        nticks: Object.keys(groupedData).length,
      },
      yaxis: {
        title: "Sample",
        type: "category",
        nticks: Object.keys(groupedData).length,
      },
    };
    Plotly.default.newPlot(divID, plotlyData, layout);
    return cosSimilarityMatrix;
  }

  /**

Plots a force directed tree of the patients in the study based on their mutational spectra.
@async
@function plotForceDirectedTree
@memberof mSigPortalPlots
@param {Object} groupedData - An object containing patient data grouped by mutational spectra.
@param {string} [studyName="PCAWG"] - The name of the study. Defaults to "PCAWG".
@param {string} [genomeDataType="WGS"] - The type of genome data. Defaults to "WGS".
@param {string} [cancerType="Lung-AdenoCA"] - The type of cancer. Defaults to "Lung-AdenoCA".
@param {string} [divID="forceDirectedTree"] - The ID of the HTML element where the force directed tree will be displayed. Defaults to "forceDirectedTree".
@param {number} [maxDepth=0] - The maximum depth of the tree. If set to 0, the entire tree will be displayed. Defaults to 0.
@returns {Object} - An object containing the formatted clusters for the force directed tree.
*/

  // This function plots a force directed tree of the patients in the study based on their mutational spectra
  async function plotForceDirectedTree(
    groupedData,
    studyName = "PCAWG",
    genomeDataType = "WGS",
    cancerType = "Lung-AdenoCA",
    divID = "forceDirectedTree",
    maxDepth = 0
  ) {
    groupedData = extractMutationalSpectra(groupedData);
    let distanceMatrix = await createDistanceMatrix(
      Object.values(groupedData).map((data) => Object.values(data)),
      cosineSimilarity,
      true
    );

    let clusters = await hierarchicalClustering(
      distanceMatrix,
      Object.keys(groupedData)
    );

    let formattedClusters = formatHierarchicalClustersToAM5Format(
      clusters,
      studyName,
      genomeDataType,
      cancerType,
      Object.keys(groupedData).length,
      groupedData
    );

    // $(`#${divID}`).css({"width": "100%", "height": "550px", "max-width": "100%"})
    const element = document.getElementById(divID);
    element.style.width = "100%";
    element.style.height = "600px";
    element.style.maxWidth = "100%";

    if (maxDepth != 0) {
      formattedClusters = limitDepth(formattedClusters, maxDepth);
    }

    generateForceDirectedTree(formattedClusters, divID);

    return formattedClusters;
  }

  // Generates an AMCharts force directed tree based on the given data and parameters
  // https://www.amcharts.com/docs/v5/charts/hierarchy/force-directed/

  async function generateForceDirectedTree(data, divID) {
    // Create root element
    // https://www.amcharts.com/docs/v5/getting-started/#Root_element
    var root = am5.Root.new(divID);

    // Set themes
    // https://www.amcharts.com/docs/v5/concepts/themes/
    root.setThemes([am5themes_Animated.default.new(root)]);

    // Create wrapper container
    var container = root.container.children.push(
      am5.Container.new(root, {
        width: am5.percent(100),
        height: am5.percent(100),
        layout: root.verticalLayout,
      })
    );

    // Create series
    // https://www.amcharts.com/docs/v5/charts/hierarchy/#Adding
    var series = container.children.push(
      am5hierarchy.ForceDirected.new(root, {
        singleBranchOnly: false,
        downDepth: 2,
        initialDepth: 0,
        valueField: "totalMutationCount",
        categoryField: "name",
        childDataField: "children",
        minRadius: 20,
        maxRadius: 80,
        centerStrength: 0.5,
      })
    );

    series.nodes.template._settings.tooltipText =
      "Total Mutations: {totalMutationCount}";
    series.adapters.add("fill", function (fill, target) {
      return fill.lighten(target.dataItem.level * 0.25);
    });

    series.data.setAll([data]);
    series.set("selectedDataItem", series.dataItems[0]);

    series.appear(1000, 100);
  }

  //#endregion

  //#region Visualizes a set of mutational spectra using UMAP.

  /**

Plots a UMAP visualization of the input data.
@async
@function
@memberof mSigPortalPlots
@param {object} data - The input data to visualize.
@param {string} [datasetName="PCAWG"] - The name of the dataset being visualized.
@param {string} divID - The ID of the HTML div element to plot the visualization in.
@param {number} [nComponents=3] - The number of dimensions to project the data into.
@param {number} [minDist=0.1] - The minimum distance between points in the UMAP algorithm.
@param {number} [nNeighbors=15] - The number of neighbors to consider in the UMAP algorithm.
@returns {object[]} An array of plot trace objects, containing the x, y, and z coordinates of the plot, as well as any additional plot options.
@see {@link https://plotly.com/python/3d-mesh/} For more information on the alpha-shape algorithm used in 3D plotting.
@see {@link https://plotly.com/python/line-and-scatter/} For more information on scatter plots.
@see {@link https://umap-learn.readthedocs.io/en/latest/} For more information on the UMAP algorithm.
*/
  async function plotUMAPVisualization(
    data,
    datasetName = "PCAWG",
    divID,
    nComponents = 3,
    minDist = 0.1,
    nNeighbors = 15
  ) {
    data = extractMutationalSpectra(data);
    let umap = new UMAP.default.UMAP({
      nComponents: nComponents,
      minDist: minDist,
      nNeighbors: nNeighbors,
    });
    let embeddings = await umap.fit(
      Object.values(data).map((data) => Object.values(data))
    );
    let plotType = nComponents === 3 ? "scatter3d" : "scatter";
    let axisLabels = nComponents === 3 ? ["X", "Y", "Z"] : ["X", "Y"];

    let trace = [
      {
        x: embeddings.map((d) => d[0]),
        y: embeddings.map((d) => d[1]),
        text: Object.keys(data),
        mode: "markers",
        type: plotType,
        marker: { size: 6 },
      },
    ];

    if (nComponents === 3) {
      trace[0].z = embeddings.map((d) => d[2]);

      trace.push({
        alphahull: 7,
        opacity: 0.1,
        type: "mesh3d",
        x: embeddings.map((d) => d[0]),
        y: embeddings.map((d) => d[1]),
        z: embeddings.map((d) => d[2]),
      });
    }

    let layout = {
      title: `${nComponents} Component UMAP Projection of ${datasetName} Dataset`,
      xaxis: { title: axisLabels[0] },
      yaxis: { title: axisLabels[1] },
    };

    if (nComponents === 3) {
      layout.scene = { zaxis: { title: axisLabels[2] } };
    }

    Plotly.default.newPlot(divID, trace, layout);

    return trace;
  }

  //#endregion

  //#region Signature Fitting

  /**

Fits mutational spectra to mutational signatures using non-negative least squares (NNLS) regression.
@async
@function fitMutationalSpectraToSignatures
@param {Object} mutationalSignatures - An object containing mutational signature data with signature names as keys and nested objects containing signature values as values.
@param {Object} mutationalSpectra - An object containing mutational spectra data with sample names as keys and nested objects containing spectra values as values.
@returns {Promise<Object>} - A Promise that resolves to an object with sample names as keys and nested objects containing signature exposure values as values.
*/

  // This function fits the mutational spectra of a set of samples to a set of mutational signatures

  async function fitMutationalSpectraToSignatures(
    mutationalSignatures,
    mutationalSpectra
  ) {
    let signatures = Object.keys(mutationalSignatures);
    let samples = Object.keys(mutationalSpectra);
    let nnlsInputSignatures = Object.values(mutationalSignatures).map(
      (data) => {
        return Object.values(data);
      }
    );
    let nnlsInputMatrix = Object.values(mutationalSpectra).map((data) => {
      return Object.values(data);
    });

    let results = {};

    for (let i = 0; i < samples.length; i++) {
      let nnlsInput = nnlsInputMatrix[i];
      let nnlsOutput = await nnls(nnlsInputSignatures, nnlsInput);
      const exposureValues = nnlsOutput.x;

      for (let j = 0; j < signatures.length; j++) {
        nnlsOutput[signatures[j]] = exposureValues[j];
      }
      delete nnlsOutput["x"];
      results[samples[i]] = nnlsOutput;
    }
    return results;
  }

  /**

Plots mutational signature exposure data as a pie chart.
@async
@function plotPatientMutationalSignaturesExposure
@param {Object} exposureData - An object containing mutational signature exposure data.
@param {string} divID - The ID of the HTML div element in which to display the plot.
@param {string} sample - The name of the sample being plotted.
@returns {Object} - The data used to create the plot.
*/

  // This function plots the exposure of a set of samples to a set of mutational signatures
  async function plotPatientMutationalSignaturesExposure(
    exposureData,
    divID,
    sample
  ) {
    let dataset = deepCopy(exposureData);

    const rnorm = dataset["rnorm"];
    delete dataset["rnorm"];
    const plotType = "pie";
    const plotTitle = `Mutational Signature Exposure for ${sample} (r-norm = ${rnorm})`;

    let data = {
      labels: Object.keys(dataset),
      values: Object.values(dataset),
      name: `${sample} exposure values`,
      textposition: "inside",
      hole: 0.4,
      hoverinfo: "name + value",
      type: plotType,
    };

    let layout = {
      title: plotTitle,
    };

    Plotly.default.newPlot(divID, [data], layout);

    return data;
  }

  /**

Plot the mutational signature exposure data for the given dataset using Plotly heatmap visualization.
@async
@function
@param {Object} exposureData - An object containing mutational signature exposure data for each sample.
@param {string} divID - The ID of the HTML div element where the heatmap plot should be rendered.
@param {boolean} [relative=true] - A boolean indicating whether to normalize the exposure data by total count for each sample.
@param {string} [datasetName="PCAWG"] - A string indicating the name of the dataset being plotted.
@returns {Object} - An object representing the data plotted in the heatmap.
*/
  async function plotDatasetMutationalSignaturesExposure(
    exposureData,
    divID,
    relative = true,
    datasetName = "PCAWG",
    doubleCluster = true,
    colorscale = "Custom"
  ) {
    let dataset = deepCopy(exposureData);
    // Remove the rnorm values from each sample of the exposure data

    for (let sample in dataset) {
      delete dataset[sample]["rnorm"];
    }

    if (relative) {
      for (let sample in dataset) {
        let total = 0;
        for (let signature in dataset[sample]) {
          total += dataset[sample][signature];
        }
        for (let signature in dataset[sample]) {
          dataset[sample][signature] /= total;
        }
      }
    }
    let reorderedData;
    if (doubleCluster) {
      reorderedData = doubleClustering(
        Object.values(dataset).map((data) => Object.values(data)),
        Object.keys(dataset),
        Object.keys(dataset[Object.keys(dataset)[0]])
      );
    } else {
      console.log("data is not ordered");
      reorderedData = {
        matrix: Object.values(dataset).map((data) => Object.values(data)),
        rowNames: Object.keys(dataset),
        colNames: Object.keys(dataset[Object.keys(dataset)[0]]),
      };
    }
    if (colorscale == "custom") {
      colorscale = [
        ["0.0", "rgb(49,54,149)"],
        ["0.025", "rgb(69,117,180)"],
        ["0.05", "rgb(116,173,209)"],
        ["0.075", "rgb(171,217,233)"],
        ["0.1", "rgb(224,243,248)"],
        ["0.125", "rgb(254,224,144)"],
        ["0.15", "rgb(253,174,97)"],
        ["0.175", "rgb(244,109,67)"],
        ["0.2", "rgb(215,48,39)"],
        ["1.0", "rgb(165,0,38)"],
      ];
    }

    let data = {
      z: reorderedData.matrix,
      x: reorderedData.colNames,
      y: reorderedData.rowNames,
      type: "heatmap",
      colorscale: colorscale,
    };

    let layout = {
      title: `Mutational Signature Exposure for ${datasetName} Dataset`,
      xaxis: {
        title: "Samples",
        nticks: Object.keys(dataset[Object.keys(dataset)[0]]).length,
      },
      yaxis: {
        title: "Mutational Signatures",
        nticks: Object.keys(dataset).length,
      },
      height: 800,
    };

    Plotly.default.newPlot(divID, [data], layout);

    return data;
  }

  //#endregion

  //#region Define the public members of the mSigSDK
  const mSigPortalData = {
    getMutationalSignaturesOptions,
    getMutationalSignaturesData,
    getMutationalSignaturesSummary,
    getMutationalSpectrumOptions,
    getMutationalSpectrumData,
    getMutationalSpectrumSummary,
    getMutationalSignatureAssociationOptions,
    getMutationalSignatureAssociationData,
    getMutationalSignatureActivityOptions,
    getMutationalSignatureActivityData,
    getMutationalSignatureLandscapeData,
    getMutationalSignatureEtiologyOptions,
    getMutationalSignatureEtiologyData,
    extractMutationalSpectra,
  };
  const mSigPortalPlots = {
    plotProfilerSummary,
    plotPatientMutationalSpectrum,
    plotForceDirectedTree,
    plotCosineSimilarityHeatMap,
    plotUMAPVisualization,
    plotProjectMutationalBurdenByCancerType,
  };

  const mSigPortal = {
    mSigPortalData,
    mSigPortalPlots,
  };

  const ICGC = {
    obtainICGCDataMAF,
    convertMatrix,
    convertWGStoPanel,
  };

  const tools = {
    groupBy,
  };

  //#endregion

  // Public members
  return {
    mSigPortal,
    ICGC,
    tools,
    fitMutationalSpectraToSignatures,
    plotPatientMutationalSignaturesExposure,
    plotDatasetMutationalSignaturesExposure,
  };
})();

export { mSigSDK };
