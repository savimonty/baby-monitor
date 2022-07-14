#!/usr/bin/env bash

export ENV="dev"
export DOCKER_REPO_URL_PREFIX="savimonty"

if [[ ! -d logs ]]; then
    mkdir -p ./logs
fi

if [[ ! -f users.json ]]; then
    echo "users.json does not exist. Please ensure users.json exists and has valid entries. Exiting"
    exit 1
else
    u=$(jq '.users' users.json)
    if [[ "${u}" == "{}" ]]; then
        echo "No users defined in users.json. Exiting."
        exit 1
    fi

    cu=$(jq '.captureUser' users.json)
    if [[ "${cu}" == "{}" ]]; then
        echo "No captureUser defined in users.json. Exiting."
        exit 1
    fi
fi

docker-compose build
