import { Types } from '@ohif/core';
import { id } from './id';
import getDataSourcesModule from './getDataSourcesModule';
import getViewportModule from './getViewportModule';
import getSopClassHandlerModule from './getSopClassHandlerModule';
import getCommandsModule from './getCommandsModule';
import { cornerstoneNiftiImageLoader } from '@cornerstonejs/nifti-volume-loader';
import * as cornerstone from '@cornerstonejs/core';
import { NiftiUploadDialog } from './components';

/**
 * NIfTI Extension for OHIF Viewer
 */
const extension: Types.Extensions.Extension = {
  /**
   * Unique ID of the extension
   */
  id,

  /**
   * Lifecycle hook that initializes the extension
   */
  preRegistration: async ({ servicesManager, configuration = {} }) => {
    console.log('NIfTI Extension preRegistration');
    // Register the NIfTI image loader
    // Cast the function to any to avoid TypeScript errors about interface mismatches
    cornerstone.imageLoader.registerImageLoader('nifti', cornerstoneNiftiImageLoader as any);
  },

  /**
   * Module getters
   */
  getDataSourcesModule,
  getViewportModule,
  getSopClassHandlerModule,
  getCommandsModule,

  /**
   * Components exposed by this extension
   */
  getUIComponentDefinitions: () => ({
    niftiUploadDialog: NiftiUploadDialog,
  }),
};

console.log('NIfTI Extension loaded');
console.log('Extension ID:', id);

export default extension;
