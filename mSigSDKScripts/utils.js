function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
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

  async function fetchURLAndCache(cacheName, url, ICGC = null) {
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
    data.children = data.children.map((child) =>
      limitDepth(child, maxDepth - 1)
    );

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
  function createDistanceMatrix(mutationalSpectra) {
    let distanceMatrix = [];
    for (let i = 0; i < mutationalSpectra.length; i++) {
      let row = [];
      for (let j = 0; j < mutationalSpectra.length; j++) {
        let distance =
          1 - cosineSimilarity(mutationalSpectra[i], mutationalSpectra[j]);
        row.push(distance);
      }
      distanceMatrix.push(row);
    }
    return distanceMatrix;
  }

  function hierarchicalClustering(distanceMatrix, sampleNames) {
    // Create an array to store the clusters
    let clusters = [];

    // Initialize each sample as its own cluster
    for (let i = 0; i < distanceMatrix.length; i++) {
      clusters.push([i]);
    }

    // Loop until we have a single cluster left
    while (clusters.length > 1) {
      // Find the two closest clusters
      let minDistance = Infinity;
      let closestClusters = [];

      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          // Calculate the distance between clusters i and j
          let distance = calculateDistance(
            clusters[i],
            clusters[j],
            distanceMatrix
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestClusters = [i, j];
          }
        }
      }

      // Merge the two closest clusters
      let mergedCluster = clusters[closestClusters[0]].concat(
        clusters[closestClusters[1]]
      );
      clusters.splice(closestClusters[1], 1);
      clusters.splice(closestClusters[0], 1, mergedCluster);
    }

    // Return the final clustering result as a tree
    return buildTree(clusters[0], distanceMatrix, sampleNames);
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
          const dNew =
            (di * clusters[minI].length + dj * clusters[minJ].length) /
            newCluster.length;
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
  
  function doubleClustering(matrix, rowNames, colNames) {
    const rowOrder = upgma(matrix);
    const transposedMatrix = matrix[0].map((_, i) => matrix.map((row) => row[i]));
    const colOrder = upgma(transposedMatrix);
  
    const sortedMatrix = rowOrder.map((i) => colOrder.map((j) => matrix[i][j]));
    const sortedRowNames = rowOrder.map((i) => rowNames[i]);
    const sortedColNames = colOrder.map((i) => colNames[i]);
  
    return {
      matrix: sortedMatrix,
      rowNames: sortedRowNames,
      colNames: sortedColNames,
    };
  }

  
// export all the functions defined in this file

export {
    cosineSimilarity,
    linspace,
    deepCopy,
    nnls,
    fetchURLAndCache,
    limitDepth,
    formatHierarchicalClustersToAM5Format,
    groupBy,
    createDistanceMatrix,
    calculateDistance,
    hierarchicalClustering,
    buildTree,
    isNumeric,
    doubleClustering
  };
  