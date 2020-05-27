FROM tiangolo/node-frontend:10 as front-builder

WORKDIR /app

COPY package*.json /app/

RUN npm install

ADD . .

RUN npm run build

FROM golang:alpine as server-builder

ENV GO111MODULE on
ENV APPDIR /go/src/github.com/ilovelili/blockchain-facial-recognizer

RUN apk update && apk add --no-cache --update openssh-client git ca-certificates
WORKDIR $APPDIR

ADD . .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o server ./src/server

FROM alpine

ENV FRONT_BUILDER_DIR=/app
ENV SERVER_BUILDER_DIR=/go/src/github.com/ilovelili/blockchain-facial-recognizer

COPY --from=server-builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=server-builder /etc/passwd /etc/passwd
COPY --from=server-builder $SERVER_BUILDER_DIR/server .

COPY --from=front-builder $FRONT_BUILDER_DIR/build ./build

ENTRYPOINT ["./server"]