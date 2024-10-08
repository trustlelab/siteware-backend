#!/bin/bash

APP_NAME="sw-backend"
APP_PATH="/home/ubuntu/app"

cd $APP_PATH

# Source the environment variables from the .env file
cp /home/ubuntu/env $APP_PATH/.env

# Check if the app is already running with PM2
if pm2 list | grep -q "$APP_NAME"; then
    echo "Application $APP_NAME is already running. Restarting it..."
    pm2 restart $APP_NAME
else
    echo "Application $APP_NAME is not running. Starting it..."
    pm2 start npm -- start --name "$APP_NAME"
fi
