function getDataModule() {
  return {
    getDataSources: () => {
      return [
        {
          friendlyName: 'NIFTI Local',
          namespace: '@ohif/extension-cornerstone-nifti.dataSourcesModule.niftiLocalDataSource',
          sourceName: 'niftiLocal',
          configuration: {
            friendlyName: 'NIFTI Files',
            name: 'niftiLocal',
          },
        },
      ];
    },
    getActiveDataSource: () => 'niftiLocal',
  };
}

export default getDataModule;
