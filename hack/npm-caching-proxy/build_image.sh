#!/bin/bash -xe

#
# Build the project's container image using the npm caching proxy that
# has been setup with run.sh
#

# cd to project root
[[ -e Dockerfile ]] || cd ../..

# TODO: Grab the current project config and replace after the run
npm config set registry "http://host.containers.internal:4873" --location=project
  # --env "npm_config_registry=http://host.containers.internal:4873" \

podman build \
  --pull \
  -t localhost/tackle2-ui:image1 \
  .

npm config delete registry --location=project
