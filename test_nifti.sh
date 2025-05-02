#!/bin/bash

# Folder for sample data
NIFTI_SAMPLES="./nifti_samples"

# Create folder for NIFTI samples if it doesn't exist
mkdir -p $NIFTI_SAMPLES

# Download sample NIFTI data if not already there
if [ ! -f "$NIFTI_SAMPLES/sample.nii" ]; then
  echo "Downloading sample NIFTI file..."
  wget -O "$NIFTI_SAMPLES/sample.nii" https://github.com/rii-mango/Papaya/raw/master/tests/data/sample.nii
fi

# Start OHIF with NIFTI configuration
cd platform/app
APP_CONFIG=config/nifti.js yarn start
