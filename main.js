import * as localforage from "https://cdn.jsdelivr.net/npm/localforage/+esm";
import * as pako from "https://cdn.jsdelivr.net/npm/pako/+esm";
import * as Papa from "https://cdn.jsdelivr.net/npm/papaparse/+esm";
// import * as Plotly from "./scripts/dependencies/plotly.js";
//import Plotly as an es6 module
import * as Plotly from "https://cdn.jsdelivr.net/npm/plotly.js-dist/+esm";

const mSigSDK = (function () {
  // #region Miscellaneous Functions
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
  // #endregion

  //#region Mutational Signatures

  async function getMutationalSignaturesOptions(
    genomeDataType = "WGS",
    mutationType = "SBS",
    numberOfResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/mutational_signature_options?
    source=Reference_signatures&strategy=${genomeDataType}&profile=${mutationType}&limit=${numberOfResults}&offset=0`;
    const cacheName = "getMutationalSignaturesOptions";
    return await (await fetchURLAndCache(cacheName, url)).json();
  }

  async function getMutationalSignaturesData(
    genomeDataType = "WGS",
    signatureSetName = "COSMIC_v3_Signatures_GRCh37_SBS96",
    mutationType = "SBS",
    numberofResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/mutational_signature?
    source=Reference_signatures&strategy=${genomeDataType}&profile=${mutationType}&matrix=96&signatureSetName=${signatureSetName}&limit=${numberofResults}&offset=0`;
    const cacheName = "getMutationalSignaturesData";
    return await (await fetchURLAndCache(cacheName, url)).json();
  }

  async function getMutationalSignaturesSummary(
    numberofResults = 10,
    signatureSetName = "COSMIC_v3.3_Signatures"
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/mutational_signature_summary?signatureSetName=${signatureSetName}&limit=${numberofResults}&offset=0`;
    const cacheName = "getMutationalSignaturesSummary";
    return await (await fetchURLAndCache(cacheName, url)).json();
  }
  //#endregion

  //#region Mutational Spectrum

  async function getMutationalSpectrumOptions(
    study = "PCAWG",
    genomeDataType = "WGS",
    cancerType = "Lung-AdenoCA",
    numberOfResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/mutational_spectrum_options?study=${study}&cancer=${cancerType}&strategy=${genomeDataType}&offset=0&limit=${numberOfResults}`;
    const cacheName = "getMutationalSpectrumOptions";
    return await (await fetchURLAndCache(cacheName, url)).json();
  }

  async function getMutationalSpectrumData(
    study = "PCAWG",
    sample = "SP50263",
    genomeDataType = "WGS",
    cancerType = "Lung-AdenoCA",
    mutationType = "SBS",
    matrixSize = 96
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/mutational_spectrum?study=${study}&sample=${sample}&cancer=${cancerType}&strategy=${genomeDataType}&profile=${mutationType}&matrix=${matrixSize}&offset=0`;
    const cacheName = "getMutationalSpectrumData";
    return await (await fetchURLAndCache(cacheName, url)).json();
  }

  async function getMutationalSpectrumSummary(
    study = "PCAWG",
    genomeDataType = "WGS",
    cancerType = "Lung-AdenoCA",
    numberOfResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/mutational_spectrum_summary?study=${study}&cancer=${cancerType}&strategy=${genomeDataType}&limit=${numberOfResults}&offset=0`;
    const cacheName = "getMutationalSpectrumSummary";
    return await (await fetchURLAndCache(cacheName, url)).json();
  }

  //#endregion

  //#region Mutational Signature Association
  async function getMutationalSignatureAssociationOptions(
    study = "PCAWG",
    genomeDataType = "WGS",
    numberOfResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/signature_association_options?study=${study}&strategy=${genomeDataType}&limit=${numberOfResults}&offset=0`;
    const cacheName = "getMutationalSignatureAssociationOptions";
    return await (await fetchURLAndCache(cacheName, url)).json();
  }

  async function getMutationalSignatureAssociationData(
    study = "PCAWG",
    genomeDataType = "WGS",
    cancerType = "Biliary-AdenoCA",
    numberOfResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/signature_association?study=${study}&strategy=${genomeDataType}&cancer=${cancerType}&limit=${numberOfResults}&offset=0`;
    const cacheName = "getMutationalSignatureAssociationData";
    return await (await fetchURLAndCache(cacheName, url)).json();
  }

  //#endregion

  //#region Mutational Signature Activity

  async function getMutationalSignatureActivityOptions(
    study = "PCAWG",
    genomeDataType = "WGS",
    numberOfResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/signature_activity_options?study=${study}&strategy=${genomeDataType}&limit=${numberOfResults}&offset=0`;
    const cacheName = "getMutationalSignatureActivityOptions";
    return await (await fetchURLAndCache(cacheName, url)).json();
  }

  async function getMutationalSignatureActivityData(
    study = "PCAWG",
    genomeDataType = "WGS",
    signatureSetName = "COSMIC_v3_Signatures_GRCh37_SBS96",
    cancerType = "",
    numberOfResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/signature_activity?study=${study}&strategy=${genomeDataType}&signatureSetName=${signatureSetName}&limit=${numberOfResults}&cancer=${cancerType}&offset=0`;
    const cacheName = "getMutationalSignatureActivityData";
    return await (await fetchURLAndCache(cacheName, url)).json();
  }

  async function getMutationalSignatureLandscapeData(
    study = "PCAWG",
    genomeDataType = "WGS",
    cancerType = "",
    signatureSetName = "COSMIC_v3_Signatures_GRCh37_SBS96",
    numberOfResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/signature_activity?study=${study}&strategy=${genomeDataType}&signatureSetName=${signatureSetName}&cancer=${cancerType}&limit=${numberOfResults}&offset=0`;
    const cacheName = "getMutationalSignatureLandscapeData";
    return await (await fetchURLAndCache(cacheName, url)).json();
  }

  //#endregion

  //#region Mutational Signature Etiology

  async function getMutationalSignatureEtiologyOptions(
    study = "PCAWG",
    genomeDataType = "WGS",
    signatureName = "SBS3",
    cancerType = "",
    numberOfResults = 10
  ) {
    const url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/signature_etiology_options?study=${study}&strategy=${genomeDataType}&signatureName=${signatureName}&cancer=${cancerType}&limit=${numberOfResults}&offset=0`;
    const cacheName = "getMutationalSignatureEtiologyOptions";
    return await (await fetchURLAndCache(cacheName, url)).json();
  }

  async function getMutationalSignatureEtiologyData(
    study = "PCAWG",
    genomeDataType = "WGS",
    signatureName = "SBS3",
    cancerType = "",
    numberOfResults = 10
  ) {
    url = `https://analysistools-dev.cancer.gov/mutational-signatures/api/signature_etiology?study=${study}&strategy=${genomeDataType}&signatureName=${signatureName}&cancer=${cancerType}&limit=${numberOfResults}&offset=0`;
    const cacheName = "getMutationalSignatureEtiologyData";
    return await (await fetchURLAndCache(cacheName, url)).json();
  }

  //#endregion

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

  function getMAFColumnByValue(key) {
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
    return selectedColumns.indexOf(key);
  }

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
        return Object.values(groupAndSortData(data, indices));
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

  async function convertMatrix(data) {
    const mutationalSpectra = [];

    for (let patient of data) {
      var mutationalSpectrum = init_sbs_mutational_spectra();

      for (let i = 0; i < patient.length; i++) {
        var chromosomeNumber = patient[i]["chromosome"];
        var referenceAllele = patient[i]["reference_genome_allele"];
        var mutatedTo = patient[i]["mutated_to_allele"];
        var position = patient[i]["chromosome_start"];
        var variantType = patient[i]["mutation_type"];

        try {
          var sequence = await getMutationalContext(
            chromosomeNumber,
            parseInt(position)
          );
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
        } catch (error) {
          console.error(error);
        }
      }
      mutationalSpectra.push(mutationalSpectrum);
    }

    return mutationalSpectra;
  }

  const getMutationalContext = async (chromosomeNumber, startPosition) => {
    const chrName = String(chromosomeNumber);
    const startByte = startPosition - 2;
    const endByte = startPosition + 2;

    const response = await fetch(
      `https://storage.googleapis.com/storage/v1/b/chaos-game-representation-grch37/o/chr${chrName}%2Fsequence.bin?alt=media`,
      {
        headers: {
          Range: `bytes=${startByte}-${endByte}`,
        },
      }
    );
    const view = new DataView(await response.arrayBuffer());

    if (view.byteLength < 5) {
      throw new Error("Invalid range");
    }

    let seq = "";
    for (let i = 0; i < view.byteLength; i++) {
      seq += String.fromCharCode(view.getUint8(i));
    }

    return seq;
  };

  //#endregion

  //#region Convert WGS MAF file to Panel MAF file

  // Create a function that filters the nested array based on its mutation type being single base substitution
  function filterWGSArray(WGSArray) {
    return WGSArray.filter((row) => row[7] === "single base substitution");
  }

  function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  function downsampleWGSArray(WGSArray, panelArray) {
    const includedRows = [];

    for (var i = 0; i < WGSArray.length - 1; i++) {
      let row = WGSArray[i];

      let filteredRow;
      if (isNumeric(row[getMAFColumnByValue("chromosome")])) {
        filteredRow = panelArray.filter(
          (panelRow) =>
            parseInt(panelRow["Chromosome"]) ===
              parseInt(row[getMAFColumnByValue("chromosome")]) &&
            parseInt(panelRow["Start_Position"]) <=
              parseInt(row[getMAFColumnByValue("chromosome_start")]) &&
            parseInt(panelRow["End_Position"]) >=
              parseInt(row[getMAFColumnByValue("chromosome_end")])
        );
      } else {
        filteredRow = panelArray.filter(
          (panelRow) =>
            panelRow["Chromosome"] === row[getMAFColumnByValue("chromosome")] &&
            parseInt(panelRow["Start_Position"]) <=
              parseInt(row[getMAFColumnByValue("chromosome_start")]) &&
            parseInt(panelRow["End_Position"]) >=
              parseInt(row[getMAFColumnByValue("chromosome_end")])
        );
      }

      if (filteredRow.length > 0) {
        let MAFColumns = [
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
        includedRows.push(combineKeysAndValues(MAFColumns, row));
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
  //#endregion

  //#region Plot the summary of a dataset

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

  //#endregion

  //#region Plot a patient's mutational spectra

  // This function plots the mutational spectrum for the given parameters.
  async function plotPatientMutationalSpectrum(
    studyName = "PCAWG",
    sample = "SP50263",
    genomeDataType = "WGS",
    cancerType = "Lung-AdenoCA",
    mutationType = "SBS",
    matrixSize = 96,
    divID = "mutationalSpectrumMatrix"
  ) {
    let data = await getMutationalSpectrumData(
      studyName,
      sample,
      genomeDataType,
      cancerType,
      mutationType,
      matrixSize
    );

    let plotlyData = await formatMutationalSpectraData(
      data,
      matrixSize,
      sample
    );

    if (data.length == 0) {
      $(`#${divID}`).html(
        `<p style="color:red">Error: no data available for the selected parameters.</p>`
      );
    } else {
      let layout = {
        title: `${studyName} ${genomeDataType} Mutational Spectrum for Sample: ${sample}`,
        xaxis: {
          title: "Mutation Type",
          type: "category",
        },
        yaxis: {
          title: "Number of Single Base Substitutions",
        },
        barmode: "group",
      };
      Plotly.default.newPlot(divID, plotlyData, layout);
    }
  }

  // This converts the mutational spectra data to a format that can be used to create a plotly chart
  // It takes in the mutational spectra data, the matrix size, and the sample
  // It returns the data in a format that can be used to create a plotly chart
  // The data is an array of objects. Each object has a name, x, y, and type property.
  // The name property is the name of the mutation type
  // The x property is an array of the mutation names
  // The y property is an array of the mutation frequencies
  // The type property is the type of substitution that takes place

  async function formatMutationalSpectraData(
    mutationalSpectra,
    matrixSize,
  ) {
    if (matrixSize == 96) {
      let mutationalSpectrum = init_sbs_mutational_spectra();

      for (let i = 0; i < mutationalSpectra.length; i++) {
        let mutationType = mutationalSpectra[i]["mutationType"];
        mutationalSpectrum[mutationType] = mutationalSpectra[i]["mutations"];
      }

      const substitutionTypes = ["C>A", "C>G", "C>T", "T>A", "T>C", "T>G"];

      const data = substitutionTypes.map((substitutionType) => {
        return { name: substitutionType, x: [], y: [], type: "bar" };
      });

      substitutionTypes.forEach((substitutionType) => {
        Object.keys(mutationalSpectrum)
          .filter((key) => {
            return key.includes(substitutionType);
          })
          .forEach((key) => {
            data.find((e) => e.name === substitutionType).x.push(key);
            data
              .find((e) => e.name === substitutionType)
              .y.push(mutationalSpectrum[key]);
          });
      });

      return data;
    } else if (matrixSize == 192) {
      console.error("Not supported yet");
    } else if (matrixSize == 1536) {
      console.error("Not supported yet");
    } else {
      console.error("Invalid Matrix Size");
    }
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
  };
  const mSigPortalPlots = {
    plotProfilerSummary,
    plotPatientMutationalSpectrum,
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

  //#endregion

  // Public members
  return {
    mSigPortal,
    ICGC,
  };
})();

export { mSigSDK };
