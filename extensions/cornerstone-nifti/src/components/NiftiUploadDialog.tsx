import React, { useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@ohif/ui-next';
import { Button, Icon } from '@ohif/ui';

export interface NiftiUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
}

const NiftiUploadDialog: React.FC<NiftiUploadDialogProps> = ({ isOpen, onClose, onUpload }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  }, []);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUpload = useCallback(() => {
    if (selectedFile) {
      setLoading(true);
      onUpload(selectedFile);
      onClose();
    }
  }, [selectedFile, onUpload, onClose]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload NIfTI File</DialogTitle>
          <DialogDescription>
            Select a NIfTI file (.nii or .nii.gz) to upload and view in OHIF
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <div
            className={`flex h-32 flex-col items-center justify-center rounded-md border-2 border-dashed p-4 ${
              dragOver ? 'border-primary-light bg-primary-dark/10' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Icon
              name="launch-info"
              className="text-primary-light h-8 w-8"
            />
            <p className="mt-2 text-sm">
              Drag and drop a NIfTI file here, or{' '}
              <span
                className="text-primary-light cursor-pointer hover:underline"
                onClick={handleButtonClick}
              >
                click to browse
              </span>
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".nii,.nii.gz"
              className="hidden"
            />
          </div>

          {selectedFile && (
            <div className="mt-4 flex items-center justify-between rounded bg-black/5 p-2">
              <div className="flex items-center space-x-2">
                <Icon
                  name="link"
                  className="h-5 w-5"
                />
                <span className="max-w-xs truncate text-sm">{selectedFile.name}</span>
                <span className="text-xs text-gray-500">
                  ({Math.round(selectedFile.size / 1024)} KB)
                </span>
              </div>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSelectedFile(null)}
              >
                <Icon
                  name="close"
                  className="h-4 w-4"
                />
              </Button>
            </div>
          )}

          <div className="mt-4 flex justify-end space-x-2">
            <Button
              variant="outlined"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedFile || loading}
              onClick={handleUpload}
            >
              {loading ? 'Uploading...' : 'Upload and View'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NiftiUploadDialog;
