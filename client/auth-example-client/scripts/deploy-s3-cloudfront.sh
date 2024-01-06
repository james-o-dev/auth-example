#!/bin/bash

# Set your AWS S3 bucket name
S3_BUCKET_NAME="auth-example-client-s3"

# Set the local directory path containing the files to sync
LOCAL_DIR_PATH="./dist"

# Get the absolute path to the .env file
ENV_FILE="$(dirname "$(realpath "$0")")/../.env"

# Load variables from .env file using the absolute path
source ./.env

# Sync files to S3 bucket
aws s3 sync $LOCAL_DIR_PATH s3://$S3_BUCKET_NAME --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"

echo "Sync and cache invalidation completed."