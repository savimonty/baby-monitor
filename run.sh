#!/usr/bin/env bash

export ENV="prod"
export DOCKER_REPO_URL_PREFIX="savimonty"

docker-compose up -d
