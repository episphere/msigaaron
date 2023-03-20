mSigSDK = await (await import("../main.js")).mSigSDK;
getMutationalSignatureEtiologyOptions = mSigSDK.mSigPortal.mSigPortalData.getMutationalSignatureEtiologyOptions()

cancerType = "Lung-AdenoCA";
mutationalSignatures = await mSigSDK.mSigPortal.mSigPortalData.getMutationalSignaturesData("WGS", "COSMIC_v3_Signatures_GRCh37_SBS96", "SBS", 10000)
mutationalSignaturesExtracted = await mSigSDK.mSigPortal.mSigPortalData.extractMutationalSpectra(mutationalSignatures, "signatureName")

umapVisualizationData = await mSigSDK.mSigPortal.mSigPortalData.getMutationalSpectrumData(
    "PCAWG",
    null,
    "WGS",
    cancerType,
    "SBS",
    96,
);

patientMutationalSpectra = await mSigSDK.mSigPortal.mSigPortalData.extractMutationalSpectra(umapVisualizationData, "sample")
nnlsExposures = await mSigSDK.fitMutationalSpectraToSignatures(mutationalSignaturesExtracted, patientMutationalSpectra)

mSigSDK.plotMutationalSignatureExposure(nnlsExposures["SP50263"], "exposureGraph", "SP50263")