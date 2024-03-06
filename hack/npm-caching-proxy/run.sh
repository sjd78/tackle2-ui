#!/bin/bash -xe

#
# userns=keep-id with the uid and gid settings will have podman map
# the uid and gid of the user who runs the container to those uid and
# gid internally so files created on the host belong to the user who
# started the container!
#
podman run \
  -it \
  --rm \
  --name npm-mirror \
  --userns=keep-id:uid=10001,gid=65533 \
  -p 4873:4873 \
  -v ./config:/verdaccio/conf:Z \
  -v ./storage:/verdaccio/storage:Z,U \
  verdaccio/verdaccio:5 \
  $@

