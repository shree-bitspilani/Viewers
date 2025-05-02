import { Enums } from '@cornerstonejs/core';
import { id } from './id';

const commandsModule = ({ servicesManager }) => {
  const { UINotificationService, viewportService } = servicesManager.services;

  const actions = {
    getNiftiInfo: ({ niftiUrl }) => {
      if (!niftiUrl) {
        UINotificationService.show({
          title: 'NIfTI Information',
          message: 'No NIfTI URL provided',
          type: 'error',
        });
        return;
      }

      UINotificationService.show({
        title: 'NIfTI Information',
        message: `NIfTI URL: ${niftiUrl}`,
        type: 'info',
      });
    },

    /**
     * Set the viewport orientation to axial
     */
    setVolumePlaneToAxial: ({ viewportId }) => {
      const viewport = viewportService.getViewport(viewportId);
      if (viewport && viewport.setOrientation) {
        viewport.setOrientation(Enums.OrientationAxis.AXIAL);
        viewport.render();
      }
    },

    /**
     * Set the viewport orientation to sagittal
     */
    setVolumePlaneToSagittal: ({ viewportId }) => {
      const viewport = viewportService.getViewport(viewportId);
      if (viewport && viewport.setOrientation) {
        viewport.setOrientation(Enums.OrientationAxis.SAGITTAL);
        viewport.render();
      }
    },

    /**
     * Set the viewport orientation to coronal
     */
    setVolumePlaneToCoronal: ({ viewportId }) => {
      const viewport = viewportService.getViewport(viewportId);
      if (viewport && viewport.setOrientation) {
        viewport.setOrientation(Enums.OrientationAxis.CORONAL);
        viewport.render();
      }
    },
  };

  const definitions = {
    getNiftiInfo: {
      commandFn: actions.getNiftiInfo,
      options: {},
      context: 'VIEWER',
    },
    setVolumePlaneToAxial: {
      commandFn: actions.setVolumePlaneToAxial,
      storeContexts: [],
      options: {},
    },
    setVolumePlaneToSagittal: {
      commandFn: actions.setVolumePlaneToSagittal,
      storeContexts: [],
      options: {},
    },
    setVolumePlaneToCoronal: {
      commandFn: actions.setVolumePlaneToCoronal,
      storeContexts: [],
      options: {},
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'CORNERSTONE',
  };
};

export default commandsModule;
