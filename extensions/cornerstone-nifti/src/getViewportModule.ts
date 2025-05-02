import * as cornerstone from '@cornerstonejs/core';
import { setVolumesForViewports, utilities as csUtils } from '@cornerstonejs/core';
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
    // Custom onElementEnabled callback to load the NIfTI volume
    onElementEnabled: async ({ element, viewportId, renderingEngineId }) => {
      // Call the original onElementEnabled if it exists
      if (props.onElementEnabled) {
        props.onElementEnabled({ element, viewportId, renderingEngineId });
      }

      // Get the viewport
      const renderingEngine = cornerstone.getRenderingEngine(renderingEngineId);
      const viewport = renderingEngine?.getViewport(viewportId);

      if (!viewport) {
        console.error('Viewport not found:', viewportId);
        return;
      }

      try {
        // Get imageIds from the display set using nifti-volume-loader
        const imageIds = await createNiftiImageIdsAndCacheMetadata({
          url: niftiURL,
        });

        if (!imageIds || !imageIds.length) {
          console.error('No image IDs were created from the NIfTI file');
          return;
        }

        // Define a volume ID
        const volumeId = `niftiVolume-${displaySet.displaySetInstanceUID}`;

        // Load the NIfTI volume
        const volume = await cornerstone.volumeLoader.createAndCacheVolume(volumeId, { imageIds });

        await volume.load();

        // Get the orientation from props or default to AXIAL
        const orientation = props.viewportOptions?.orientation || 'axial';

        if (viewport.type === cornerstone.Enums.ViewportType.STACK) {
          // For STACK viewport, just set the first image
          const imageId = imageIds[0];
          await viewport.setStack([imageId]);
        } else {
          // For VOLUME_3D viewport
          // Assign the volume to the viewport
          await setVolumesForViewports(renderingEngine, [{ volumeId }], [viewportId]);

          // Set the orientation
          const orientationMap = {
            axial: csUtils.getOrientationStringLPS(
              csUtils.orientations.axial.sliceNormal,
              csUtils.orientations.axial.viewUp
            ),
            sagittal: csUtils.getOrientationStringLPS(
              csUtils.orientations.sagittal.sliceNormal,
              csUtils.orientations.sagittal.viewUp
            ),
            coronal: csUtils.getOrientationStringLPS(
              csUtils.orientations.coronal.sliceNormal,
              csUtils.orientations.coronal.viewUp
            ),
          };

          const orientationString =
            orientationMap[orientation.toLowerCase()] || orientationMap.axial;

          await viewport.setOrientation(orientationString);
          await viewport.setVolumeOpacity(volumeId, 1);
        }

        viewport.render();
      } catch (error) {
        console.error('Error loading NIfTI volume:', error);
      }
    },
  };

  // Render the cornerstone viewport with modified props
  return CornerstoneViewport(modifiedProps);
};

/**
 * Viewport Module definition for NIfTI viewport
 */
function getViewportModule({ servicesManager, extensionManager }) {
  const ExtendedCornerstoneViewport = props => {
    // Get the cornerstone viewport from the extension
    const CornerstoneViewport = extensionManager.getModuleEntry(
      '@ohif/extension-cornerstone.viewportModule.cornerstone'
    );

    // Pass the get enabled element function
    const getEnabledElement = () => CornerstoneViewport;

    return OHIFCornerstoneNiftiViewport({
      ...props,
      getEnabledElement,
    });
  };

  return [
    {
      name: 'nifti',
      component: ExtendedCornerstoneViewport,
    },
  ];
}

export default getViewportModule;
