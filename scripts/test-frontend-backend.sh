#!/bin/bash

pushd backend
python -m pytest
if [ $? -ne 0 ]; then
    echo "Backend tests failed"
    exit 1
fi
popd

pushd frontend
npm install
npm test
popd
