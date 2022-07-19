#!/usr/bin/env bash

set -x

export ENV="dev"
export DOCKER_REPO_URL_PREFIX="savimonty"

mkdir -p logs

npm run watch
