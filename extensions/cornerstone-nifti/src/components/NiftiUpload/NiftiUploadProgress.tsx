import React, { useCallback, useEffect, useRef, useState, ReactElement } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@ohif/ui';
import { Icons } from '@ohif/ui-next';
import NiftiFileUploader, {
  EVENTS,
  UploadStatus,
  NiftiFileUploaderProgressEvent,
  UploadRejection,
} from '../../utils/NiftiFileUploader';
import NiftiUploadProgressItem from './NiftiUploadProgressItem';
import classNames from 'classnames';

type NiftiUploadProgressProps = {
  niftiFileUploaderArr: NiftiFileUploader[];
  onComplete: () => void;
};

function NiftiUploadProgress({
  niftiFileUploaderArr,
  onComplete,
}: NiftiUploadProgressProps): ReactElement {
  const [uploadItemsStatuses, setUploadItemsStatuses] = useState([]);
  const [selectionActive, setSelectionActive] = useState(false);
  const [displayedUploads, setDisplayedUploads] = useState([]);
  const progressRef = useRef<HTMLDivElement>(null);
  const fileListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (niftiFileUploaderArr.length) {
      // Initialize upload item statuses
      setUploadItemsStatuses(
        niftiFileUploaderArr.map(() => ({
          selected: false,
          uploadStatus: UploadStatus.NotStarted,
        }))
      );

      // Initialize displayed uploads from the uploader array
      setDisplayedUploads(
        niftiFileUploaderArr.map(niftiFileUploader => ({
          fileUploader: niftiFileUploader,
          fileName: niftiFileUploader.file.name,
        }))
      );
    }
  }, [niftiFileUploaderArr]);

  const getNumberOfFinishedUploads = useCallback(() => {
    let count = 0;
    for (let i = 0; i < uploadItemsStatuses.length; i++) {
      const status = uploadItemsStatuses[i].uploadStatus;
      if (
        status === UploadStatus.Success ||
        status === UploadStatus.Failed ||
        status === UploadStatus.Cancelled
      ) {
        count++;
      }
    }
    return count;
  }, [uploadItemsStatuses]);

  const getNumberOfSuccessfulUploads = useCallback(() => {
    let count = 0;
    for (let i = 0; i < uploadItemsStatuses.length; i++) {
      if (uploadItemsStatuses[i].uploadStatus === UploadStatus.Success) {
        count++;
      }
    }
    return count;
  }, [uploadItemsStatuses]);

  const getProgressText = useCallback(() => {
    return `Uploaded ${getNumberOfSuccessfulUploads()} of ${
      uploadItemsStatuses.length
    } NIFTI files`;
  }, [getNumberOfSuccessfulUploads, uploadItemsStatuses]);

  const getProgressValue = useCallback(() => {
    return (getNumberOfFinishedUploads() / niftiFileUploaderArr.length) * 100;
  }, [getNumberOfFinishedUploads, niftiFileUploaderArr]);

  useEffect(() => {
    // Check if all uploads have completed
    if (
      uploadItemsStatuses.length > 0 &&
      getNumberOfFinishedUploads() === niftiFileUploaderArr.length
    ) {
      onComplete();
    }
  }, [uploadItemsStatuses, getNumberOfFinishedUploads, niftiFileUploaderArr, onComplete]);

  // Cancel selected uploads
  const handleCancel = useCallback(() => {
    const updatedStatuses = [...uploadItemsStatuses];
    for (let i = 0; i < updatedStatuses.length; i++) {
      if (updatedStatuses[i].selected) {
        niftiFileUploaderArr[i].cancel();
        updatedStatuses[i].uploadStatus = UploadStatus.Cancelled;
      }
    }
    setUploadItemsStatuses(updatedStatuses);
    setSelectionActive(false);
  }, [uploadItemsStatuses, niftiFileUploaderArr]);

  // Toggle selection state of all items
  const handleToggleSelectAll = useCallback(() => {
    const updatedStatuses = uploadItemsStatuses.map(status => {
      return {
        ...status,
        selected: !selectionActive,
      };
    });
    setUploadItemsStatuses(updatedStatuses);
    setSelectionActive(!selectionActive);
  }, [uploadItemsStatuses, selectionActive]);

  // Update for individual file's selection state
  const updateFileSelection = useCallback(
    (index, selected) => {
      const updatedStatuses = [...uploadItemsStatuses];
      updatedStatuses[index].selected = selected;

      // Check if any files are selected
      const hasSelections = updatedStatuses.some(status => status.selected);
      setSelectionActive(hasSelections);
      setUploadItemsStatuses(updatedStatuses);
    },
    [uploadItemsStatuses]
  );

  // Update for individual file's upload status
  const updateFileUploadStatus = useCallback(
    (index, status) => {
      const updatedStatuses = [...uploadItemsStatuses];
      updatedStatuses[index].uploadStatus = status;
      setUploadItemsStatuses(updatedStatuses);
    },
    [uploadItemsStatuses]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[72px] flex-row border-b-2 border-black p-4">
        <div className="mr-4 flex h-[40px] w-[40px] items-center justify-center">
          <input
            className="h-[18px] w-[18px]"
            type="checkbox"
            checked={selectionActive}
            onChange={handleToggleSelectAll}
          />
        </div>
        <div className="flex flex-1 flex-col justify-center">
          {selectionActive ? (
            <div className="text-primary-active">{`${
              uploadItemsStatuses.filter(status => status.selected).length
            } files selected`}</div>
          ) : (
            <>
              <div className="bg-customgray-100 relative h-2 w-full rounded-full">
                <div
                  className={classNames(
                    'h-2 rounded-full',
                    getNumberOfSuccessfulUploads() === niftiFileUploaderArr.length
                      ? 'bg-green-300'
                      : 'bg-primary-light'
                  )}
                  style={{ width: `${getProgressValue()}%` }}
                />
              </div>
              <div
                className={classNames(
                  'mt-1',
                  getNumberOfSuccessfulUploads() === niftiFileUploaderArr.length
                    ? 'text-green-300'
                    : 'text-white'
                )}
              >
                {getProgressText()}
              </div>
            </>
          )}
        </div>
        {selectionActive && (
          <div className="ml-4 flex flex-row items-center gap-2">
            <Button
              onClick={handleCancel}
              type="button"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
      <div
        ref={fileListRef}
        className="custom-scrollbar bg-primary-dark flex-1 overflow-y-auto"
      >
        {displayedUploads.map((displayedUpload, index) => (
          <NiftiUploadProgressItem
            key={`upload-item-${displayedUpload.fileUploader.fileId}`}
            niftiFileUploader={displayedUpload.fileUploader}
            selected={uploadItemsStatuses[index]?.selected ?? false}
            onSelectChange={selected => updateFileSelection(index, selected)}
            onStatusChange={status => updateFileUploadStatus(index, status)}
          />
        ))}
      </div>
    </div>
  );
}

NiftiUploadProgress.propTypes = {
  niftiFileUploaderArr: PropTypes.arrayOf(PropTypes.instanceOf(NiftiFileUploader)).isRequired,
  onComplete: PropTypes.func.isRequired,
};

export default NiftiUploadProgress;
