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
mSigSDK.mSigPortal.mSigPortalPlots.plotPatientMutationalSpectrum();
