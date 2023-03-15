mSigSDK = await (await import("./main.js")).mSigSDK;

cancerType = "Lung-AdenoCA";
mutationalSignatures = await mSigSDK.mSigPortal.mSigPortalData.getMutationalSignaturesData("WGS", "COSMIC_v3_Signatures_GRCh37_SBS96", "SBS", 10000)
mutationalSignaturesExtracted = await mSigSDK.mSigPortal.mSigPortalData.extractMutationalSpectra(mutationalSignatures, "signatureName")
nnlsInputSignatures = Object.values(mutationalSignaturesExtracted).map(data => {return Object.values(data)})

umapVisualizationData = await mSigSDK.mSigPortal.mSigPortalData.getMutationalSpectrumData(
    "PCAWG",
    null,
    "WGS",
    cancerType,
    "SBS",
    96,
);

patientMutationalSpectra = await mSigSDK.mSigPortal.mSigPortalData.extractMutationalSpectra(umapVisualizationData, "sample")
patientData = Object.values(patientMutationalSpectra).map(data => {return Object.values(data)})
nnlsExposures = mSigSDK.nnls(nnlsInputSignatures, patientData[0])