FROM golang:alpine as builder

ENV GO111MODULE on
ENV APPDIR /go/src/github.com/ilovelili/blockchain-facial-recognizer

RUN apk update && apk add --no-cache --update openssh-client git ca-certificates
WORKDIR $APPDIR

ADD . .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o facial-recognizer ./src/client

FROM alpine

ENV BUILDER_DIR=/go/src/github.com/ilovelili/blockchain-facial-recognizer

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /etc/passwd /etc/passwd

COPY --from=builder $BUILDER_DIR/facial-recognizer .
# COPY --from=builder $BUILDER_DIR/src/client/assets ./assets

ENTRYPOINT ["./facial-recognizer"]