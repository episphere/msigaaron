// Test all functionalities of ICGC module
mSigSDK = await (await import("./main.js")).mSigSDK;

data =await  mSigSDK.ICGC.obtainICGCDataMAF(
projects = ["BRCA-US"],
datatype = "ssm",
analysis_type = "WGS",
output_format = "TSV")

results = await mSigSDK.ICGC.convertWGStoPanel(data.slice(10,11), "./MSK-IMPACT410.bed")

mutSpec = await mSigSDK.ICGC.convertMatrix(results)

// Testing mSigPortal Plots

mSigSDK = await (await import("./main.js")).mSigSDK;

// mSigSDK.mSigPortal.mSigPortalPlots.plotProfilerSummary();
// mSigSDK.mSigPortal.mSigPortalPlots.plotPatientMutationalSpectrum();

// mSigSDK.mSigPortal.mSigPortalPlots.plotForceDirectedTree();
// mSigSDK.mSigPortal.mSigPortalPlots.plotCosineSimilarityHeatMap();

mutationalSpectrumData1 = await mSigSDK.mSigSDK.mSigPortal.mSigPortalData.getMutationalSpectrumData(
    "PCAWG",
    "SP50263",
    "WGS",
    "Lung-AdenoCA",
    "SBS",
    96,
);

mutationalSpectrumData2 = await mSigSDK.mSigSDK.mSigPortal.mSigPortalData.getMutationalSpectrumData(
    "PCAWG",
    "SP51446",
    "WGS",
    "Lung-AdenoCA",
    "SBS",
    96,
);

formattedMutationalSpectrumData = await mSigSDK.mSigSDK.mSigPortal.mSigPortalData.extractMutationalSpectra(mutationalSpectrumData1.concat(mutationalSpectrumData2))

mSigSDK.mSigSDK.mSigPortal.mSigPortalPlots.plotPatientMutationalSpectrum(formattedMutationalSpectrumData, ["SP50263", "SP51446"],96,"mutationalSpectrumMatrix");
