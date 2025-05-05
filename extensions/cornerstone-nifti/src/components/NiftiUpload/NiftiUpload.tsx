import React, { useCallback, useState } from 'react';
import { ReactElement } from 'react';
import Dropzone from 'react-dropzone';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import NiftiFileUploader from '../../utils/NiftiFileUploader';
import NiftiUploadProgress from './NiftiUploadProgress';
import { Button, ButtonEnums } from '@ohif/ui';
import './NiftiUpload.css';

type NiftiUploadProps = {
  onComplete: () => void;
  onStarted: () => void;
};

function NiftiUpload({ onComplete, onStarted }: NiftiUploadProps): ReactElement {
  const baseClassNames = 'min-h-[480px] flex flex-col bg-black select-none';
  const [niftiFileUploaderArr, setNiftiFileUploaderArr] = useState([]);

  const onDrop = useCallback(async acceptedFiles => {
    onStarted();
    setNiftiFileUploaderArr(acceptedFiles.map(file => new NiftiFileUploader(file, null)));
  }, []);

  const getDropZoneComponent = (): ReactElement => {
    return (
      <Dropzone
        onDrop={acceptedFiles => {
          onDrop(acceptedFiles);
        }}
        noClick
      >
        {({ getRootProps }) => (
          <div
            {...getRootProps()}
            className="nifti-upload-drop-area-border-dash m-5 flex h-full flex-col items-center justify-center"
          >
            <div className="flex gap-3">
              <Dropzone
                onDrop={onDrop}
                noDrag
              >
                {({ getRootProps, getInputProps }) => (
                  <div {...getRootProps()}>
                    <Button
                      disabled={false}
                      onClick={() => {}}
                    >
                      {'Add files'}
                      <input {...getInputProps()} />
                    </Button>
                  </div>
                )}
              </Dropzone>
              <Dropzone
                onDrop={onDrop}
                noDrag
              >
                {({ getRootProps, getInputProps }) => (
                  <div {...getRootProps()}>
                    <Button
                      type={ButtonEnums.type.secondary}
                      disabled={false}
                      onClick={() => {}}
                    >
                      {'Add folder'}
                      <input
                        {...getInputProps()}
                        webkitdirectory="true"
                        mozdirectory="true"
                      />
                    </Button>
                  </div>
                )}
              </Dropzone>
            </div>
            <div className="pt-5">or drag images or folders here</div>
            <div className="text-aqua-pale pt-3 text-lg">(NIFTI files supported)</div>
          </div>
        )}
      </Dropzone>
    );
  };

  return (
    <>
      {niftiFileUploaderArr.length ? (
        <div className={classNames('h-[calc(100vh-300px)]', baseClassNames)}>
          <NiftiUploadProgress
            niftiFileUploaderArr={Array.from(niftiFileUploaderArr)}
            onComplete={onComplete}
          />
        </div>
      ) : (
        <div className={classNames('h-[480px]', baseClassNames)}>{getDropZoneComponent()}</div>
      )}
    </>
  );
}

NiftiUpload.propTypes = {
  onComplete: PropTypes.func.isRequired,
  onStarted: PropTypes.func.isRequired,
};

export default NiftiUpload;
