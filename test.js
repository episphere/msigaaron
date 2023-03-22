mSigSDK = await (await import("../main.js")).mSigSDK;
visualizationData = await mSigSDK.mSigPortal.mSigPortalData.getMutationalSpectrumData(
    "PCAWG",
    null,
    "WGS",
    cancerType,
    "SBS",
    96,
);
extractedData = mSigSDK.mSigPortal.mSigPortalData.extractMutationalSpectra(visualizationData)

cosSimilarity = mSigSDK.mSigPortal.mSigPortalPlots.plotCosineSimilarityHeatMap(extractedData, "PCAWG", "WGS", "Lung-AdenoCA", "cosineSimilarityHeatMap");