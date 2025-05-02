import { id } from './id';

const SOPClassHandlerId = `${id}.sopClassHandlerModule.NiftiSopClassHandler`;

function getNiftiSopClassHandler({ servicesManager, extensionManager }) {
  const getDisplaySetsFromSeries = ({ instances, series, study, dicomWebClient }) => {
    // This handler should only be called for NIfTI display sets, but just to be safe
    if (!instances || !instances.length || !instances[0].isNifti) {
      return [];
    }

    const instance = instances[0];

    // Create a display set for the NIfTI data
    const displaySet = {
      plugin: 'nifti',
      Modality: instance.Modality,
      displaySetInstanceUID: instance.displaysetInstanceUID || `nifti-displayset-${Date.now()}`,
      SeriesDate: instance.SeriesDate,
      SeriesTime: instance.SeriesTime,
      SeriesInstanceUID: instance.SeriesInstanceUID,
      SeriesNumber: instance.SeriesNumber,
      SeriesDescription: instance.SeriesDescription,
      SOPInstanceUID: instance.SOPInstanceUID,
      SOPClassHandlerId,
      StudyInstanceUID: instance.StudyInstanceUID,
      SOPClassUID: '1.2.3.4.5.6.7.8.9', // Made-up UID for NIfTI
      isNifti: true,
      isDerivedDisplaySet: true,
      isLoaded: true,
      instance,
      metadata: {
        SeriesInstanceUID: instance.SeriesInstanceUID,
        StudyInstanceUID: instance.StudyInstanceUID,
        isNifti: true,
      },
      niftiURL: instance.niftiURL,
      numImageFrames: 0, // Will be determined when loading
      numInstances: 1, // Single NIfTI file
    };

    return [displaySet];
  };

  return {
    name: 'NiftiSopClassHandler',
    sopClassUids: ['nifti'],
    getDisplaySetsFromSeries,
  };
}

function getSopClassHandlerModule({ servicesManager, extensionManager }) {
  return [getNiftiSopClassHandler({ servicesManager, extensionManager })];
}

export default getSopClassHandlerModule;
