# AWS Resources

This directory contains code relating to provisioning AWS resource, used to implement the API backend.

## Table of contents

* [AWS CDK](#aws-cdk)
  * [Stack Components](#stack-components)
  * [Setup](#setup)
* [Authentication Logic Lambda](#authentication-logic-lambda)
  * [Code Location](#code-location)
  * [Layer](#layer)
* [Email Lambda](#email-lambda)
  * [Code Location](#code-location)
  * [Layer](#layer)
* [Google Cloud Platform Integration](#google-cloud-platform-integration)
  * [Nodemailer setup](#nodemailer-setup)
  * [Google SSO setup](#google-sso-setup)
* [Configuration](#configuration)
  * [Environment File](#environment-file)
    * [Notable values](#notable-values)
  * [CDK Config](#cdk-config)
* [Deployment](#deployment)
* [Teardown](#teardown)
* [Links](#links)

## AWS CDK

### Stack Components
The AWS CDK code, located in the `/cdk` folder, creates the following stack in AWS:
- DynamoDB: NoSQL database for storing user information.
- Lambda: AWS Lambda functions for authentication logic and email handling.
- API Gateway: Manages the API endpoints for user authentication.
- SQS: Simple Queue Service for handling asynchronous tasks.

The stack is defined in [`./cdk/auth-example-cdk/lib/auth-example-cdk-stack.ts`](./cdk/auth-example-cdk/lib/auth-example-cdk-stack.ts).

### Setup
1. Install the AWS CDK library globally:
   ```bash
   npm install -g aws-cdk
   ```

2. Set up AWS credentials on your machine.
    * See the [AWS docs](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) (particularly the 'Long-term credentials' option).
    * [Managing AWS access keys](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html)

3. Bootstrap the CDK:
   ```bash
   cdk bootstrap
   ```
    * See the [AWS docs](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) for further information.

## Authentication Logic Lambda

### Code Location
Authentication logic Lambda function code is located in [`/lambda/auth-example-lambda`](./lambda/auth-example-lambda).

### Layer
The Lambda layer for this function is located in [`/lambda/auth-example-lambda-layer`](./lambda/auth-example-lambda-layer).

Lambda dependencies are updated here. Once updated, be sure to `npm install` and then re-deploy the CDK stack again to update.

## Email Lambda

### Code Location
Email Lambda function code is located in [`/lambda/nodemailer-lambda`](./lambda/nodemailer-lambda).

### Layer
The Lambda layer for this function is located in [`/lambda/nodemailer-lambda-layer`](./lambda/nodemailer-lambda-layer).

Lambda dependencies are updated here. Once updated, be sure to `npm install` and then re-deploy the CDK stack again to update.

## Google Cloud Platform Integration

### Nodemailer setup
Follow [these instructions](https://rupali.hashnode.dev/send-emails-in-nodejs-using-nodemailer-gmail-oauth2) on how to set up your Google account to be able to be used by Nodemailer.

Note down the `client id`, `client secret` and `refresh token` for the [environment configuration](#configuration).

### Google SSO setup
1. Sign into [Google Cloud Console](https://console.cloud.google.com) with your Google account and create new project.
2. Open `APIs and services` > `OAuth consent screen`
3. Choose `External`, follow instructions
4. For `Scopes`, add only the `.../auth/userinfo.email` scope
5. Follow the remaining instructions until the OAuth consent screen is updated.
6. Open `APIs and services` > `Credentials` > `+ Create Credentials` > `OAuth client ID`.
7. Choose the `Web application` type.
8. Add the localhost of the hosted client here; It can be updated later.
9. Add `(localhost)/google-sso` here, where (localhost) is the hosted client; It can be updated later.

Once done you can submit this and a client id and secret should be available to you.
Note down the `client id` and `client secret` for the [environment configuration](#configuration).

## Configuration

### Environment File
A template [`.env.template`](./cdk/auth-example-cdk/.env.template) is provided. Create a copy named `.env` and fill in the required values.

#### Notable values
Update the following with the [Nodemailer setup](#nodemailer-setup):
```
GMAIL_CLIENT_ID=""
GMAIL_CLIENT_SECRET=""
GMAIL_REFRESH_TOKEN=""
GMAIL_USER_EMAIL=""
```

Update the following with the [Google SSO setup](#google-sso-setup):
```
GOOGLE_SSO_CLIENT_ID=""
GOOGLE_SSO_CLIENT_SECRET=""
```

Generate long and complex password strings for these:
```
ACCESS_TOKEN_SECRET=""
REFRESH_TOKEN_SECRET=""
SSO_TOKEN_SECRET=""
```

Update based on the client host:
```
CLIENT_HOST=""
```

### CDK Config
The [`cdk.json`](./cdk/auth-example-cdk/cdk.json) file defines the AWS profile that will be used, defined as the `profile` value.

Please change this to the AWS profile name of your choice.

## Deployment

Once the CDK has been bootstrapped and configured, `cd` to the [`cdk/auth-example-cdk`](./cdk//auth-example-cdk) directory and run one of the following:

* `npm run cdk:synth` to do a test run and only generate CloudFormation templates. Useful as a 'dry-run' to catch any CDK configuration or coding issues.
* `npm run cdk:deploy` to deploy the stack.

## Teardown

When the AWS resources are no longer required, run `npm run cdk:destroy` to run the command to destroy the CDK stack.

## Links
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [SQS Documentation](https://docs.aws.amazon.com/sqs/)
