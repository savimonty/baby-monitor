#!/usr/bin/env bash

# env set up at docker-compose.yml

envsubst < ./turnserver.conf.example > turnserver.conf

/usr/bin/turnserver -c /app/turnserver.conf \
                    --pidfile   /app/turnserver.pid \
                    --log-file  /app/logs/turnserver.log \
                    --db        /app/turndb
