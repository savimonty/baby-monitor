FROM node:lts-buster-slim

WORKDIR /app

RUN     apt-get update && apt-get install -y jq

COPY    src                 ./src
COPY    public              ./public

COPY    package.json        .
COPY    server.js           .
COPY    entry.sh            .

RUN     chmod +x            ./entry.sh
RUN     mkdir -p            ./logs

# installing deps
RUN     npm install

# building react app
RUN     npm run build

ENTRYPOINT [ "./entry.sh" ]
