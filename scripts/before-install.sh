#!/bin/bash

#download node and npm

if node -v; then
  echo "Node installed..."
else
  echo "Node not installed !!!"
  echo "Installing node js..."


  sudo apt-get update
  sudo apt-get install -y ca-certificates curl gnupg
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs
fi




