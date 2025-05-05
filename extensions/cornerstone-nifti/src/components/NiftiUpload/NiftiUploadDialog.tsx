import React from 'react';
import PropTypes from 'prop-types';
import NiftiUpload from './NiftiUpload';

function NiftiUploadDialog({ onComplete, onStarted }) {
  return (
    <div className="flex h-full flex-col">
      <NiftiUpload
        onComplete={onComplete}
        onStarted={onStarted}
      />
    </div>
  );
}

NiftiUploadDialog.propTypes = {
  onComplete: PropTypes.func.isRequired,
  onStarted: PropTypes.func.isRequired,
};

export default NiftiUploadDialog;
