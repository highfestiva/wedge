#!/bin/bash

docker network create wedge_network
docker compose up --build -d
