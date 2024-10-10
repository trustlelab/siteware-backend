#!/bin/bash

sudo chown -R ubuntu:ubuntu /home/ubuntu/app
cd /home/ubuntu/app

# Install dependencies
npm install
# Build application
npm run build
# Generate Prisma Client
npm run generate




