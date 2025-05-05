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
          // Type cast to StackViewport to access setStack method
          await (viewport as cornerstone.Types.IStackViewport).setStack([imageId]);
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

          const orientationAxis = orientationMap[orientation.toLowerCase()] || orientationMap.axial;

          // Type cast to VolumeViewport to access setOrientation method
          await (viewport as cornerstone.Types.IVolumeViewport).setOrientation(orientationAxis);
          // Use the correct API to set volume rendering properties
          await (viewport as cornerstone.Types.IVolumeViewport).setProperties({
            voiRange: { lower: -1000, upper: 1000 },
            slabThickness: 0.1,
          });
        }

        // Set the volume color and opacity
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
