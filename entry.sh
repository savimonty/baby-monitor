#!/usr/bin/env bash

set -x

if [[ ! -f users.json ]]; then
    echo "users.json does not exist. Please ensure users.json exists and has valid entries. Exiting"
    exit 1
fi

env | grep "BM_"
npm start
