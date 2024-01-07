# React TypeScript Project with Vite

## Table Of Contents

* [Description](#description)
* [Features](#features)
* [Getting Started](#getting-started)
  * [How to Run Locally](#how-to-run-locally)
  * [How to Deploy](#how-to-deploy)

## Description

This project is a React TypeScript application built with Vite.

It is basic front-end client that serves as a demonstration for the auth-example API.

## Features

- **Forms:** Utilizes React forms for user interactions.
- **Routing with Protected Routes:** Implements routing with protection for certain routes to ensure secure access.
- **Styling with Tailwind:** Utilizes Tailwind CSS for styling, providing a flexible design.
- **Responsive:** Ensures a responsive layout for a seamless user experience across different devices.
- **Light and Dark Mode:** Supports both light and dark mode for user preference.

## Getting Started

1. If not done so, the AWS resources must be already be deployed via the [CDK stack](../aws/cdk).
2. Copy the '.env.template' file to '.env' and set the required environment variables.

```bash
# The host domain of the API.
# e.g. "https://xxxxxx.execute-api.ap-southeast-2.amazonaws.com/stage" or "https://xxxxxx.lambda-url.ap-southeast-2.on.aws"
VITE_API_HOST=""
# CloudFront distribution ID, to deploy the client remotely.
CLOUDFRONT_DISTRIBUTION_ID=""
```

### How to Run Locally

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

The application will be accessible at [http://localhost:5173](http://localhost:5173).

### How to Deploy

The project supports deploying the client remotely to AWS S3 / CloudFront.

AWS S3 and CloudFront must be enabled in the [AWS CDK stack](../aws/cdk).

You will require the CloudFront distribution ID. Set this as the `CLOUDFRONT_DISTRIBUTION_ID` in the `.env` file.

Do `npm run dev:build` to build and deploy to CloudFront.