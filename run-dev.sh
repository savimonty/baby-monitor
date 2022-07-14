#!/usr/bin/env bash

set -x

export ENV="dev"
export DOCKER_REPO_URL_PREFIX="savimonty"

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


# mkdir -p certs
# cp openssl.conf.example ./certs/openssl.conf
# (
#     cd certs
#     openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout privkey.pem -out fullchain.pem -config openssl.conf -sha256
# )

mkdir -p logs

npm run watch
