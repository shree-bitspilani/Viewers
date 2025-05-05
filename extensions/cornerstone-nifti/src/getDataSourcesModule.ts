import { createNiftiImageIdsAndCacheMetadata } from '@cornerstonejs/nifti-volume-loader';
import React, { useState } from 'react';
import { NiftiUploadDialog } from './components';
import { Types } from '@ohif/core';

type StudyMetadata = {
  StudyInstanceUID: string;
  SeriesInstanceUID: string;
  SOPInstanceUID: string;
  PatientID: string;
  PatientName: string;
  SeriesNumber: string;
  SeriesDescription: string;
  Modality: string;
  niftiURL: string;
};

type DisplaySet = {
  displaysetInstanceUID: string;
  SeriesInstanceUID: string;
  StudyInstanceUID: string;
  SOPInstanceUID: string;
  PatientID: string;
  PatientName: string;
  SeriesNumber: string;
  SeriesDescription: string;
  Modality: string;
  niftiURL: string;
  isNifti: boolean;
  plugin: string;
  isDerivedDisplaySet: boolean;
  isLoaded: boolean;
  loadError: boolean;
  viewportOptions?: {
    orientation?: string;
    viewportType?: string;
  }[];
};

function createNiftiMockStudy(niftiURL: string, seriesInstanceUID: string): StudyMetadata {
  // Create a mock study for the NIfTI file
  const studyInstanceUID = `nifti-study-${Date.now()}`;
  const patientID = 'NIfTI-Patient';
  const patientName = 'NIfTI^Patient';
  const seriesNumber = '1';
  const seriesDescription = 'NIfTI Series';
  const SOPInstanceUID = `nifti-instance-${Date.now()}`;
  const modality = 'OT'; // OT = Other

  return {
    StudyInstanceUID: studyInstanceUID,
    SeriesInstanceUID: seriesInstanceUID,
    SOPInstanceUID,
    PatientID: patientID,
    PatientName: patientName,
    SeriesNumber: seriesNumber,
    SeriesDescription: seriesDescription,
    Modality: modality,
    niftiURL,
  };
}

// Create a derivation of the DICOMWeb data source
const createNiftiDataSource = (api, dicomWebConfig, extensionManager) => {
  const { query, retrieve, store, IdsRetrieve = {}, deleteStudyMetadataPromise } = api;

  return {
    query,
    retrieve,
    store,
    deleteStudyMetadataPromise,
    getImageIdsForDisplaySet: ({ displaySetInstanceUID } = { displaySetInstanceUID: '' }) => {
      const displaySet = extensionManager.getDisplaySetByUID(displaySetInstanceUID);
      // This would be used for the NIfTI display sets
      if (displaySet?.niftiURL) {
        return createNiftiImageIdsAndCacheMetadata({
          url: displaySet.niftiURL,
        });
      }

      return IdsRetrieve.getImageIdsForDisplaySet?.(displaySetInstanceUID);
    },
    findSingleNiftiFile: async (file: File) => {
      if (
        !file ||
        !file.name ||
        (!file.name.toLowerCase().endsWith('.nii') && !file.name.toLowerCase().endsWith('.nii.gz'))
      ) {
        return null;
      }

      // Create a URL for the uploaded file
      const url = URL.createObjectURL(file);
      const seriesInstanceUID = `nifti-series-${Date.now()}`;
      const mockStudy = createNiftiMockStudy(url, seriesInstanceUID);

      // Create multiple display sets for different MPR views
      const baseDisplaySetId = `nifti-displayset-${Date.now()}`;

      const displaySets = [
        // Axial view
        {
          displaysetInstanceUID: `${baseDisplaySetId}-axial`,
          SeriesInstanceUID: seriesInstanceUID,
          StudyInstanceUID: mockStudy.StudyInstanceUID,
          SOPInstanceUID: mockStudy.SOPInstanceUID,
          PatientID: mockStudy.PatientID,
          PatientName: mockStudy.PatientName,
          SeriesNumber: mockStudy.SeriesNumber,
          SeriesDescription: `${mockStudy.SeriesDescription} - Axial`,
          Modality: mockStudy.Modality,
          niftiURL: url,
          isNifti: true,
          plugin: 'nifti',
          isDerivedDisplaySet: true,
          isLoaded: true,
          loadError: false,
          viewportOptions: [
            {
              orientation: 'axial',
              viewportType: 'volume',
            },
          ],
        },
        // Sagittal view
        {
          displaysetInstanceUID: `${baseDisplaySetId}-sagittal`,
          SeriesInstanceUID: seriesInstanceUID,
          StudyInstanceUID: mockStudy.StudyInstanceUID,
          SOPInstanceUID: mockStudy.SOPInstanceUID,
          PatientID: mockStudy.PatientID,
          PatientName: mockStudy.PatientName,
          SeriesNumber: mockStudy.SeriesNumber,
          SeriesDescription: `${mockStudy.SeriesDescription} - Sagittal`,
          Modality: mockStudy.Modality,
          niftiURL: url,
          isNifti: true,
          plugin: 'nifti',
          isDerivedDisplaySet: true,
          isLoaded: true,
          loadError: false,
          viewportOptions: [
            {
              orientation: 'sagittal',
              viewportType: 'volume',
            },
          ],
        },
        // Coronal view
        {
          displaysetInstanceUID: `${baseDisplaySetId}-coronal`,
          SeriesInstanceUID: seriesInstanceUID,
          StudyInstanceUID: mockStudy.StudyInstanceUID,
          SOPInstanceUID: mockStudy.SOPInstanceUID,
          PatientID: mockStudy.PatientID,
          PatientName: mockStudy.PatientName,
          SeriesNumber: mockStudy.SeriesNumber,
          SeriesDescription: `${mockStudy.SeriesDescription} - Coronal`,
          Modality: mockStudy.Modality,
          niftiURL: url,
          isNifti: true,
          plugin: 'nifti',
          isDerivedDisplaySet: true,
          isLoaded: true,
          loadError: false,
          viewportOptions: [
            {
              orientation: 'coronal',
              viewportType: 'volume',
            },
          ],
        },
      ];

      return {
        study: mockStudy,
        displaySets,
      };
    },
  };
};

// Interface for the NiftiDataSourceComponent props
interface NiftiDataSourceComponentProps {
  service: {
    getActiveDataSource: (name: string) => Array<{
      findSingleNiftiFile: (
        file: File
      ) => Promise<{ study: StudyMetadata; displaySets: DisplaySet[] } | null>;
    }>;
    createStudyMetadata: (study: StudyMetadata, displaySets: DisplaySet[]) => void;
  };
  servicesManager: {
    services: {
      uiNotificationService?: {
        show: (props: { title: string; message: string; type: string }) => void;
      };
      hangingProtocolService?: {
        setActiveProtocol: (protocolId: string) => void;
      };
      layoutService?: {
        setLayout: (layoutConfig: { numCols: number; numRows: number }) => void;
      };
      uiModalService?: {
        hide: () => void;
      };
    };
  };
}

// The NiftiDataSourceComponent handles file upload dialog
const NiftiDataSourceComponent: React.FC<NiftiDataSourceComponentProps> = ({
  service,
  servicesManager,
}) => {
  const [showUploadDialog, setShowUploadDialog] = useState(true);

  const handleClose = () => {
    setShowUploadDialog(false);
  };

  const handleUpload = async (file: File) => {
    try {
      const dataSource = service.getActiveDataSource('nifti')[0];
      if (!dataSource) {
        console.error('NIfTI datasource is not available');
        return;
      }

      const results = await dataSource.findSingleNiftiFile(file);
      if (results) {
        const { study, displaySets } = results;

        // Add study to data source
        service.createStudyMetadata(study, displaySets);

        // Navigate to the viewer
        const { uiNotificationService, hangingProtocolService, layoutService, uiModalService } =
          servicesManager.services;

        // Set up a 2x2 layout if layout service is available
        if (layoutService) {
          layoutService.setLayout({ numCols: 2, numRows: 2 });
        }

        // Set the active hanging protocol
        if (hangingProtocolService) {
          hangingProtocolService.setActiveProtocol('default');
        }

        // Hide any open modals
        if (uiModalService) {
          uiModalService.hide();
        }

        if (uiNotificationService) {
          uiNotificationService.show({
            title: 'NIfTI File Loaded',
            message: `Successfully loaded: ${file.name}`,
            type: 'success',
          });
        }
      } else {
        console.error('Failed to process NIfTI file');
        if (servicesManager.services.uiNotificationService) {
          servicesManager.services.uiNotificationService.show({
            title: 'Error',
            message: 'Failed to process NIfTI file',
            type: 'error',
          });
        }
      }
    } catch (error) {
      console.error('Error loading NIfTI file:', error);
      if (servicesManager.services.uiNotificationService) {
        servicesManager.services.uiNotificationService.show({
          title: 'Error',
          message: 'Error loading NIfTI file',
          type: 'error',
        });
      }
    }
  };

  return React.createElement(NiftiUploadDialog, {
    isOpen: showUploadDialog,
    onClose: handleClose,
    onUpload: handleUpload,
  });
};

// Use the correct module type from Types.Extensions
function getDataSourcesModule({ servicesManager, extensionManager }) {
  console.log('NIfTI Extension: getDataSourcesModule called');

  // Return an array of data source configurations
  return [
    {
      name: 'nifti',
      type: 'nifti',
      description: 'NIfTI data loader',
      singleFile: true,
      component: NiftiDataSourceComponent,
      createDataSource: (configuration = {}, servicesManager, extensionManager) => {
        console.log('NIfTI Extension: createDataSource called');

        // Only proceed if servicesManager is available
        if (!servicesManager || !servicesManager.services) {
          console.error('NIfTI Extension: servicesManager or services is undefined');
          return null;
        }

        const dataSourcesService = servicesManager.services.dataSourcesService;
        console.log('NIfTI Extension: dataSourcesService retrieved', !!dataSourcesService);

        // Check if dataSourcesService is available and has the getActiveDataSource method
        if (!dataSourcesService || typeof dataSourcesService.getActiveDataSource !== 'function') {
          console.error('NIfTI Extension: dataSourcesService or getActiveDataSource is undefined');
          return null;
        }

        // Get the default data source from OHIF
        const activeSources = dataSourcesService.getActiveDataSource();
        console.log('NIfTI Extension: activeSources', !!activeSources, activeSources?.length || 0);

        if (!activeSources || !activeSources.length) {
          console.error('NIfTI Extension: No active data sources found');
          return null;
        }

        const defaultDataSource = activeSources[0];
        console.log('NIfTI Extension: defaultDataSource retrieved', !!defaultDataSource);

        // Create our NIfTI data source
        const niftiDataSource = createNiftiDataSource(
          defaultDataSource.api,
          configuration,
          extensionManager
        );
        console.log('NIfTI Extension: niftiDataSource created');

        return niftiDataSource;
      },
    },
    {
      name: 'niftiLocalDataSource',
      type: 'localApi',
      createDataSource: (configuration = {}) => {
        const niftiLocalDataSource = {
          initialize: async () => {},
          query: {
            studies: {
              search: async filters => {
                // Get stored NIFTI studies from localStorage
                const niftiStudies = JSON.parse(localStorage.getItem('ohif-nifti-studies') || '[]');

                // Return the studies formatted for OHIF
                return {
                  studies: niftiStudies.map(study => ({
                    studyInstanceUid: study.studyInstanceUID,
                    date: study.studyDate,
                    time: study.studyTime,
                    patientId: study.patientId,
                    patientName: study.patientName,
                    accessionNumber: study.accessionNumber,
                    modalities: study.modality,
                    description: study.description,
                    instances: study.seriesList.reduce((sum, series) => sum + series.instances, 0),
                  })),
                };
              },
            },
            series: {
              search: async studyInstanceUID => {
                // Get stored NIFTI studies from localStorage
                const niftiStudies = JSON.parse(localStorage.getItem('ohif-nifti-studies') || '[]');
                const study = niftiStudies.find(
                  study => study.studyInstanceUID === studyInstanceUID
                );

                if (!study) {
                  return { seriesList: [] };
                }

                // Return the series formatted for OHIF
                return {
                  seriesList: study.seriesList.map(series => ({
                    seriesInstanceUid: series.seriesInstanceUID,
                    seriesNumber: series.seriesNumber,
                    seriesDescription: series.seriesDescription,
                    modality: 'NIFTI',
                    instances: series.instances,
                    niftiURL: series.niftiURL,
                  })),
                };
              },
            },
            instances: {
              search: async filters => {
                // Return an empty array as we don't need instance-level data for NIFTI files
                return [];
              },
            },
          },
          retrieve: {
            series: {
              metadata: async (studyInstanceUID, seriesInstanceUID) => {
                // Get the NIFTI series metadata from localStorage
                const niftiStudies = JSON.parse(localStorage.getItem('ohif-nifti-studies') || '[]');
                const study = niftiStudies.find(
                  study => study.studyInstanceUID === studyInstanceUID
                );

                if (!study) {
                  return [];
                }

                const series = study.seriesList.find(
                  series => series.seriesInstanceUID === seriesInstanceUID
                );

                if (!series) {
                  return [];
                }

                // Create a simple metadata object for the NIFTI file
                return [
                  {
                    StudyInstanceUID: studyInstanceUID,
                    SeriesInstanceUID: seriesInstanceUID,
                    SOPInstanceUID: `nifti-instance-${Date.now()}`,
                    Modality: 'NIFTI',
                    SeriesDescription: series.seriesDescription,
                    SeriesNumber: series.seriesNumber,
                    StudyDescription: study.description,
                    PatientName: study.patientName,
                    PatientID: study.patientId,
                    niftiURL: series.niftiURL,
                    Rows: 256,
                    Columns: 256,
                    NumberOfFrames: 1,
                    isNifti: true,
                  },
                ];
              },
            },
          },
          store: {
            dicom: () => {
              throw new Error('Not implemented');
            },
          },
          getConfig: () => configuration,
        };

        return niftiLocalDataSource;
      },
    },
  ];
}

export default getDataSourcesModule;
