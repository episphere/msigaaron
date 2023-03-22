function euclideanDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
  }
  
  function upgma(matrix) {
    const clusters = matrix.map((_, i) => [i]);
    const distances = [];
  
    for (let i = 0; i < matrix.length; i++) {
      distances.push([]);
      for (let j = 0; j < i; j++) {
        distances[i].push(euclideanDistance(matrix[i], matrix[j]));
      }
    }
  
    while (clusters.length > 1) {
      const { minI, minJ } = findMinIndex(distances);
      const newCluster = clusters[minI].concat(clusters[minJ]);
  
      const newDistances = [];
      for (let i = 0; i < distances.length; i++) {
        if (i !== minI && i !== minJ) {
          const di = distances[Math.max(minI, i)][Math.min(minI, i)];
          const dj = distances[Math.max(minJ, i)][Math.min(minJ, i)];
          const dNew = (di * clusters[minI].length + dj * clusters[minJ].length) / newCluster.length;
          newDistances.push(dNew);
        }
      }
      distances[minI] = newDistances;
      distances.splice(minJ, 1);
  
      clusters[minI] = newCluster;
      clusters.splice(minJ, 1);
    }
  
    return clusters[0];
  }
  
  function findMinIndex(matrix) {
    let min = Infinity;
    let minI = -1;
    let minJ = -1;
  
    for (let i = 1; i < matrix.length; i++) {
      for (let j = 0; j < i; j++) {
        if (matrix[i][j] < min) {
          min = matrix[i][j];
          minI = i;
          minJ = j;
        }
      }
    }
  
    return { minI, minJ };
  }
  
 export function doubleClustering(matrix, rowNames, colNames) {
    const rowOrder = upgma(matrix);
    const transposedMatrix = matrix[0].map((_, i) => matrix.map(row => row[i]));
    const colOrder = upgma(transposedMatrix);
  
    const sortedMatrix = rowOrder.map(i => colOrder.map(j => matrix[i][j]));
    const sortedRowNames = rowOrder.map(i => rowNames[i]);
    const sortedColNames = colOrder.map(i => colNames[i]);
  
    return { 'matrix': sortedMatrix, 'rowNames':sortedRowNames, 'colNames':sortedColNames };
  }
