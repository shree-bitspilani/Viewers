// Register NiftiUploadService in customization for the worklist page
({ servicesManager, commandsManager }) => {
  return {
    default: [
      {
        id: 'niftiUploadComponent',
        component: servicesManager.services.extensionManager.getModuleEntry(
          '@ohif/extension-cornerstone-nifti.niftiUploadDialog'
        ),
      },
    ],
  };
};
