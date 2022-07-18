#!/usr/bin/env bash

# env set up at docker-compose.yml
(
    cd /app

    envsubst < ./turnserver.conf.example > ./turnserver.conf
    
    /usr/bin/turnserver \
                    -c          ./turnserver.conf \
                    --pidfile   ./turnserver.pid \
                    --log-file  ./logs/turnserver.log \
                    --db        ./turndb
)

