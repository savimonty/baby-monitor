FROM    ubuntu:impish

RUN     apt-get update && apt-get -y install coturn gettext-base

RUN     mkdir -p /app/logs
WORKDIR /app

COPY    ./turnserver.conf.example   .
COPY    ./entry.sh                  .

RUN     apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

ENTRYPOINT /app/entry.sh
