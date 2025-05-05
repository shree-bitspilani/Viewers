import { PubSubService } from '@ohif/core';
import { cornerstoneNiftiImageLoader } from '@cornerstonejs/nifti-volume-loader';

export enum UploadStatus {
  NotStarted = 'not-started',
  InProgress = 'in-progress',
  Success = 'success',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export class UploadRejection {
  status: UploadStatus;
  message: string;

  constructor(status: UploadStatus, message: string) {
    this.status = status;
    this.message = message;
  }
}

export interface NiftiFileUploaderProgressEvent {
  fileId: string;
  file: File;
  percentComplete: number;
}

export const EVENTS = {
  PROGRESS: 'event:nifti-upload-progress',
};

export default class NiftiFileUploader extends PubSubService {
  private _file: File;
  private _fileId: string;
  private _localStorageManager: any;
  private _loadPromise: Promise<void>;
  private _abortController = new AbortController();
  private _status: UploadStatus = UploadStatus.NotStarted;
  private _percentComplete = 0;

  constructor(file: File, localStorageManager: any) {
    super(EVENTS);
    this._file = file;
    this._fileId = `nifti-${file.name}-${Date.now()}`;
    this._localStorageManager = localStorageManager;
  }

  getPercentComplete(): number {
    return this._percentComplete;
  }

  getStatus(): UploadStatus {
    return this._status;
  }

  get fileId(): string {
    return this._fileId;
  }

  get file(): File {
    return this._file;
  }

  cancel(): void {
    this._abortController.abort();
    this._status = UploadStatus.Cancelled;
  }

  private _reject(reject: (reason: UploadRejection) => void, reason: any): void {
    if (reason instanceof UploadRejection) {
      this._status = reason.status;
      reject(reason);
      return;
    }

    this._status = UploadStatus.Failed;
    reject(new UploadRejection(UploadStatus.Failed, reason?.message || 'Unknown error'));
  }

  private _updateProgress(percentComplete: number): void {
    this._percentComplete = percentComplete;
    this._broadcastEvent(EVENTS.PROGRESS, {
      fileId: this._fileId,
      file: this._file,
      percentComplete,
    });
  }

  private async _checkNiftiFile(arrayBuffer: ArrayBuffer): Promise<boolean> {
    try {
      // Basic check for NIFTI file format - checking for "ni1" or "n+1" header
      // More sophisticated validation would use nifti.js library
      const view = new DataView(arrayBuffer);
      const magic = view.getUint32(344, true); // NIFTI-1 magic bytes at offset 344
      return magic === 0x0000696e || magic === 0x002b6e69; // "ni1" or "n+1"
    } catch (error) {
      return false;
    }
  }

  load(): Promise<void> {
    if (this._loadPromise) {
      return this._loadPromise;
    }

    this._status = UploadStatus.InProgress;
    this._updateProgress(0);

    this._loadPromise = new Promise<void>((resolve, reject) => {
      const reader = new FileReader();

      reader.onprogress = event => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          this._updateProgress(percentComplete);
        }
      };

      reader.onloadend = async () => {
        if (this._abortController.signal.aborted) {
          this._reject(reject, new UploadRejection(UploadStatus.Cancelled, 'Cancelled'));
          return;
        }

        if (!reader.result) {
          this._reject(reject, new UploadRejection(UploadStatus.Failed, 'Failed to read file'));
          return;
        }

        const arrayBuffer = reader.result as ArrayBuffer;

        if (!(await this._checkNiftiFile(arrayBuffer))) {
          this._reject(reject, new UploadRejection(UploadStatus.Failed, 'Not a valid NIFTI file.'));
          return;
        }

        try {
          // Store the NIFTI file information in local storage
          const studyInstanceUID = `nifti-study-${Date.now()}`;
          const seriesInstanceUID = `nifti-series-${Date.now()}`;

          const niftiObject = {
            studyInstanceUID,
            seriesInstanceUID,
            fileId: this._fileId,
            fileName: this._file.name,
            fileType: 'nifti',
            fileSize: this._file.size,
            uploadDate: new Date().toISOString(),
            url: URL.createObjectURL(this._file),
          };

          // Store in localStorage
          const existingNiftiFiles = JSON.parse(localStorage.getItem('ohif-nifti-files') || '[]');
          existingNiftiFiles.push(niftiObject);
          localStorage.setItem('ohif-nifti-files', JSON.stringify(existingNiftiFiles));

          // Create a study entry that will appear in the study list
          const studyEntry = {
            studyInstanceUID,
            patientName: this._file.name.split('.')[0] || 'NIFTI Patient',
            patientId: `NIFTI-${Date.now()}`,
            studyDate: new Date().toISOString().split('T')[0].replace(/-/g, ''),
            studyTime: new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, ''),
            modality: 'NIFTI',
            accessionNumber: `NIFTI-${Date.now()}`,
            description: `NIFTI File: ${this._file.name}`,
            seriesList: [
              {
                seriesInstanceUID,
                seriesDescription: this._file.name,
                seriesNumber: '1',
                instances: 1,
                niftiURL: URL.createObjectURL(this._file),
              },
            ],
          };

          // Store the study entry
          const existingNiftiStudies = JSON.parse(
            localStorage.getItem('ohif-nifti-studies') || '[]'
          );
          existingNiftiStudies.push(studyEntry);
          localStorage.setItem('ohif-nifti-studies', JSON.stringify(existingNiftiStudies));

          this._status = UploadStatus.Success;
          this._updateProgress(100);
          resolve();
        } catch (error) {
          this._reject(reject, error);
        }
      };

      reader.onerror = () => {
        this._reject(reject, new UploadRejection(UploadStatus.Failed, 'Error reading file'));
      };

      reader.readAsArrayBuffer(this._file);
    });

    return this._loadPromise;
  }
}
