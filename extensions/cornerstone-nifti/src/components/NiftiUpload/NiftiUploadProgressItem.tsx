import React, { ReactElement, memo, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import NiftiFileUploader, {
  EVENTS,
  UploadStatus,
  NiftiFileUploaderProgressEvent,
  UploadRejection,
} from '../../utils/NiftiFileUploader';
import { Icons } from '@ohif/ui-next';

type NiftiUploadProgressItemProps = {
  niftiFileUploader: NiftiFileUploader;
  selected: boolean;
  onSelectChange: (selected: boolean) => void;
  onStatusChange: (status: UploadStatus) => void;
};

// eslint-disable-next-line react/display-name
const NiftiUploadProgressItem = memo(
  ({
    niftiFileUploader,
    selected,
    onSelectChange,
    onStatusChange,
  }: NiftiUploadProgressItemProps): ReactElement => {
    const [percentComplete, setPercentComplete] = useState(niftiFileUploader.getPercentComplete());
    const [failedReason, setFailedReason] = useState('');
    const [status, setStatus] = useState(niftiFileUploader.getStatus());

    const isComplete = useCallback(() => {
      return (
        status === UploadStatus.Failed ||
        status === UploadStatus.Cancelled ||
        status === UploadStatus.Success
      );
    }, [status]);

    useEffect(() => {
      const progressSubscription = niftiFileUploader.subscribe(
        EVENTS.PROGRESS,
        (niftiFileUploaderProgressEvent: NiftiFileUploaderProgressEvent) => {
          setPercentComplete(niftiFileUploaderProgressEvent.percentComplete);
        }
      );

      niftiFileUploader
        .load()
        .catch((reason: UploadRejection) => {
          setStatus(reason.status);
          setFailedReason(reason.message ?? '');
        })
        .finally(() => {
          const newStatus = niftiFileUploader.getStatus();
          setStatus(newStatus);
          onStatusChange(newStatus);
        });

      return () => progressSubscription.unsubscribe();
    }, [niftiFileUploader, onStatusChange]);

    const cancelUpload = useCallback(() => {
      niftiFileUploader.cancel();
    }, [niftiFileUploader]);

    const getStatusIcon = (): ReactElement => {
      switch (niftiFileUploader.getStatus()) {
        case UploadStatus.Success:
          return (
            <Icons.ByName
              name="status-tracked"
              className="text-primary-light"
            />
          );
        case UploadStatus.InProgress:
          return <Icons.ByName name="icon-transferring" />;
        case UploadStatus.Failed:
          return <Icons.ByName name="icon-alert-small" />;
        case UploadStatus.Cancelled:
          return <Icons.ByName name="icon-alert-outline" />;
        default:
          return <></>;
      }
    };

    const handleSelectChange = () => {
      onSelectChange(!selected);
    };

    return (
      <div className="border-customgray-100 relative flex h-[60px] flex-row items-center border-b px-4">
        <div className="mr-4 flex h-[40px] w-[40px] items-center justify-center">
          <input
            className="h-[18px] w-[18px]"
            type="checkbox"
            checked={selected}
            onChange={handleSelectChange}
          />
        </div>
        <div className="mr-2 flex-1 overflow-hidden">
          <div className="truncate text-white">{niftiFileUploader.file.name}</div>
          {isComplete() && status === UploadStatus.Failed && (
            <div className="text-red-500">{failedReason}</div>
          )}
          {isComplete() && status === UploadStatus.Cancelled && (
            <div className="text-customgray-200">Cancelled</div>
          )}
          {isComplete() && status === UploadStatus.Success && (
            <div className="text-green-300">Completed</div>
          )}
          {!isComplete() && (
            <div className="bg-customgray-100 relative h-2 w-[50%] rounded-full">
              <div
                className="bg-primary-light h-2 rounded-full"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          )}
        </div>
        <div className="flex h-[40px] w-[40px] items-center justify-center">
          {status === UploadStatus.InProgress ? (
            <div
              onClick={cancelUpload}
              className="cursor-pointer"
            >
              <Icons.Close className="h-4 w-4 text-white" />
            </div>
          ) : (
            getStatusIcon()
          )}
        </div>
      </div>
    );
  }
);

NiftiUploadProgressItem.propTypes = {
  niftiFileUploader: PropTypes.instanceOf(NiftiFileUploader).isRequired,
  selected: PropTypes.bool.isRequired,
  onSelectChange: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
};

export default NiftiUploadProgressItem;
