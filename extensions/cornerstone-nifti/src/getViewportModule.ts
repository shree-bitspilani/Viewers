import * as cornerstone from '@cornerstonejs/core';
import { setVolumesForViewports } from '@cornerstonejs/core';
import { createNiftiImageIdsAndCacheMetadata } from '@cornerstonejs/nifti-volume-loader';

const OHIFCornerstoneNiftiViewport = props => {
  const { displaySet } = props;
  const { niftiURL } = displaySet;

  // We're wrapping the cornerstone viewport component
  const CornerstoneViewport = props.getEnabledElement();

  // Modified props to pass to the cornerstone viewport
  const modifiedProps = {
    ...props,
    // When the viewport is created, configure it as appropriate (stack or volume)
    viewportOptions: {
      ...props.viewportOptions,
      type:
        props.viewportOptions?.viewportType === 'stack'
          ? cornerstone.Enums.ViewportType.STACK
          : cornerstone.Enums.ViewportType.VOLUME_3D,
    },
    async onElementEnabled(elementEnabledEvt) {
      const { element, viewportId } = elementEnabledEvt.detail;
      const renderingEngine = cornerstone.getRenderingEngine(
        props.viewportOptions.renderingEngineId
      );
      const viewport = renderingEngine.getViewport(viewportId);

      // Determine the URL for the NIFTI file
      let url;
      if (displaySet.isLocalNifti) {
        // For locally uploaded NIFTI files
        url = displaySet.niftiURL;
      } else if (niftiURL) {
        // For standard displaySet with niftiURL
        url = niftiURL;
      } else {
        console.error('No NIFTI URL found in displaySet:', displaySet);
        return;
      }

      if (!url) {
        console.error('No NIFTI URL to load');
        return;
      }

      // Create NIFTI volumeId and imageIds
      try {
        const imageIds = await createNiftiImageIdsAndCacheMetadata({ url });
        const volumeId = `niftiVolume-${Date.now()}`;

        // Create and cache the volume
        await cornerstone.volumeLoader.createAndCacheVolume(volumeId, { imageIds });

        // Set up the appropriate orientation
        if (props.viewportOptions?.viewportType === 'stack') {
          // For STACK viewport - add the volume and first image
          await cornerstone.volumeLoader.loadVolume(volumeId);
          viewport.setStack([imageIds[0]]);
        } else {
          // For VOLUME_3D viewport
          // Assign the volume to the viewport
          await setVolumesForViewports(renderingEngine, [{ volumeId }], [viewportId]);

          // Set the orientation using cornerstone.Enums.OrientationAxis
          const orientationMap = {
            axial: cornerstone.Enums.OrientationAxis.AXIAL,
            sagittal: cornerstone.Enums.OrientationAxis.SAGITTAL,
            coronal: cornerstone.Enums.OrientationAxis.CORONAL,
          };

          const orientationAxis = orientationMap[props.viewportOptions?.orientation || 'axial'];

          // Type cast to VolumeViewport to access setOrientation method
          await (viewport as cornerstone.Types.IVolumeViewport).setOrientation(orientationAxis);
          // Use the correct API to set volume rendering properties
          await (viewport as cornerstone.Types.IVolumeViewport).setProperties({
            voiRange: { lower: -1000, upper: 1000 },
            slabThickness: 0.1,
          });

          // Set the volume color and opacity
          viewport.render();
        }
      } catch (error) {
        console.error('Error loading NIFTI file:', error);
      }

      // Call the original onElementEnabled callback if it exists
      props.onElementEnabled?.(elementEnabledEvt);
    },
  };

  return CornerstoneViewport(modifiedProps);
};

/**
 * This extension's getSopClassHandlerModule returns a function
 * that maps a SOP Class to a ViewportType.
 *
 * @returns {object} The SOPClassHandler module
 */
function getViewportModule({ servicesManager, extensionManager }) {
  /**
   * IMPORTANT: As cornerstone-nifti doesn't have an explicit SOP Class, we need
   * to detect if a displayset is a NIfTI display set and handle it appropriately.
   *
   * This function should return:
   * - ViewportComponent, to render the viewport
   * - getToolbarModule, a function to get toolbar configuration
   * - HangingProtocolService, a service to get hanging protocol configuration
   */
  const ExtendedOHIFCornerstoneViewport = props => {
    const { displaySet } = props;

    // Check if this is a NIFTI dataset
    if (
      displaySet.isNifti ||
      displaySet.SOPClassHandlerId === 'nifti' ||
      displaySet.Modality === 'NIFTI'
    ) {
      return OHIFCornerstoneNiftiViewport(props);
    }

    // If not NIFTI, get the regular cornerstone viewport component
    const CornerstoneViewport = extensionManager.getModuleEntry(
      '@ohif/extension-cornerstone.viewportModule.cornerstone'
    );

    // Return the regular cornerstone viewport
    return CornerstoneViewport(props);
  };

  return [
    {
      name: 'cornerstone-nifti',
      component: ExtendedOHIFCornerstoneViewport,
    },
  ];
}

export default getViewportModule;
