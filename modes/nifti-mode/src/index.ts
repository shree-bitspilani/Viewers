import { hotkeys } from '@ohif/core';
import toolbarButtons from './toolbarButtons';
import { id } from './id';

function modeFactory({ modeConfiguration }) {
  return {
    /**
     * Mode ID, which should be unique among modes used by the viewer
     */
    id,
    displayName: 'NIfTI Viewer',
    /**
     * Function to determine if the mode is valid for the given study.
     */
    isValidMode: function ({ modalities }) {
      // For NIfTI files, this can always be valid since we're uploading them directly
      return {
        valid: true,
        description: 'NIfTI mode for viewing NIfTI files',
      };
    },
    /**
     * Lifecycle hooks
     */
    onModeEnter: ({ servicesManager, extensionManager, commandsManager }) => {
      const { toolbarService, hangingProtocolService, uiNotificationService } =
        servicesManager.services;

      toolbarService.init(extensionManager);
      toolbarService.addButtons(toolbarButtons);
      toolbarService.createButtonSection('primary', [
        'MeasurementTools',
        'Zoom',
        'WindowLevel',
        'Pan',
        'Capture',
        'Layout',
        'MPR',
        'Crosshairs',
        'MoreTools',
      ]);

      // Reset the current protocol if not specified
      if (!hangingProtocolService.getActiveProtocol()) {
        hangingProtocolService.setActiveProtocol('default');
      }
    },
    onModeExit: ({ servicesManager }) => {
      const { toolbarService, hangingProtocolService, uiDialogService, uiModalService } =
        servicesManager.services;

      hangingProtocolService.reset();
      toolbarService.reset();
      uiDialogService.hideAll();
      uiModalService.hide();
    },
    /**
     * Mode Routes
     */
    routes: [
      {
        path: 'viewer',
        layoutTemplate: ({ location, servicesManager }) => {
          return {
            id: 'ohif.layout',
            props: {
              leftPanels: ['ohif.thumbnailList'],
              leftPanelResizable: true,
              rightPanels: ['ohif.measurements'],
              rightPanelResizable: true,
              viewports: [
                {
                  namespace: '@ohif/extension-cornerstone-nifti.viewportModule.nifti',
                  displaySetsToDisplay: ['ohif.sopClassHandler'],
                },
              ],
            },
          };
        },
      },
      {
        path: '',
        layoutTemplate: ({ location, servicesManager }) => {
          return {
            id: 'ohif.layout',
            props: {
              leftPanels: ['ohif.thumbnailList'],
              leftPanelResizable: true,
              rightPanels: ['ohif.measurements'],
              rightPanelResizable: true,
              viewports: [
                {
                  namespace: '@ohif/extension-cornerstone-nifti.viewportModule.nifti',
                  displaySetsToDisplay: ['ohif.sopClassHandler'],
                },
              ],
            },
          };
        },
        onBeforeEnter: ({ servicesManager }) => {
          // Show the upload dialog when entering this route
          setTimeout(() => {
            const { uiModalService } = servicesManager.services;
            if (uiModalService) {
              uiModalService.show({
                content: {
                  title: 'Upload NIfTI File',
                  body: {
                    children: 'dialogContent',
                    component: '@ohif/extension-cornerstone-nifti.components.niftiUploadDialog',
                  },
                },
              });
            }
          }, 0);
        },
      },
    ],
    extensions: {
      '@ohif/extension-default': '^3.0.0',
      '@ohif/extension-cornerstone': '^3.0.0',
      '@ohif/extension-cornerstone-nifti': '^3.0.0',
    },
    hangingProtocol: 'default',
    // Order of the datasources in the datasources selector dropdown
    // This is where the user selects from different datasources like the local drive, monai, etc.
    // Alphabetically and the default datasource is first. Empty by default
    // Default datasource can be overridden by query param ?datasources=local,orthanc,dicomjote
    datasources: [
      {
        namespace: '@ohif/extension-cornerstone-nifti.datasources.nifti',
        sourceName: 'nifti',
        configuration: {
          name: 'nifti',
        },
      },
      {
        namespace: '@ohif/extension-default.datasources.dicomweb',
        sourceName: 'dicomweb',
        configuration: {
          friendlyName: 'DICOMWeb Server',
        },
      },
    ],
    hotkeys: [...hotkeys.defaults.hotkeyBindings],
    // Add modeConfiguration to allow overriding from external sources
    ...modeConfiguration,
  };
}

const mode = {
  id,
  modeFactory,
  extensionDependencies: {
    '@ohif/extension-default': '^3.0.0',
    '@ohif/extension-cornerstone': '^3.0.0',
    '@ohif/extension-cornerstone-nifti': '^3.0.0',
  },
};

export default mode;
