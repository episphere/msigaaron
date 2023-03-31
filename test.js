mSigSDK = await (await import("../main.js")).mSigSDK;
mutationalSpectrumData = await mSigSDK.mSigPortal.mSigPortalData.getMutationalSpectrumData(
    "PCAWG",
    ["SP99181", "SP98955"],
    "WGS",
    "Liver-HCC",
    "ID",
    83,
);
mSigSDK.mSigPortal.mSigPortalPlots.plotPatientMutationalSpectrum(mutationalSpectrumData, "mutationalSpectrumMatrix");