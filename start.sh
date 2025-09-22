#!/bin/sh

# inicia Redis em background
redis-server --daemonize yes

# opcional: aguarda 2 segundos para o Redis subir
sleep 2

# inicia Node
node dist/index.js
