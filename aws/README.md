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
* [Authorization](#authorization)
  * [Invalidation](#invalidation)
* [Deployment](#deployment)
  * [Teardown](#teardown)
* [Testing](#testing)
* [API Endpoints](#api-endpoints)
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
Used to handle the main authentication API request logic.

### Code Location
Authentication logic Lambda function code is located in [`/lambda/auth-example-lambda`](./lambda/auth-example-lambda).

### Layer
The Lambda layer for this function is located in [`/lambda/auth-example-lambda-layer`](./lambda/auth-example-lambda-layer).

Lambda dependencies are updated here. Once updated, be sure to `npm install` and then re-deploy the CDK stack again to update.

## Email Lambda
Used to handle the asynchronously sending emails to recipients.

Requests to send emails are pushed to an SQS queue, which triggers this Lambda function.

Retries upon errors; Eventually the 'bad' messages gets transferred to a dead-letter SQS queue once a retry limit has been exceeded. These can be manually re-driven at a later time.

### Code Location
Email Lambda function code is located in [`/lambda/nodemailer-lambda`](./lambda/nodemailer-lambda).

### Layer
The Lambda layer for this function is located in [`/lambda/nodemailer-lambda-layer`](./lambda/nodemailer-lambda-layer).

Lambda dependencies are updated here. Once updated, be sure to `npm install` and then re-deploy the CDK stack again to update.

## Google Cloud Platform Integration

### Nodemailer setup
Follow [these instructions](https://rupali.hashnode.dev/send-emails-in-nodejs-using-nodemailer-gmail-oauth2) on how to set up your Google account to be able to be used by Nodemailer.

Particularly the sections:
- 'Set up your project'
- 'Configure oAuth consent screen'
- 'Create credentials for your project'
- 'Get the refresh and access token'

Note down the `client id`, `client secret` and `refresh token` for the [environment configuration](#configuration).

### Google SSO setup
1. Sign into [Google Cloud Console](https://console.cloud.google.com) with your Google account and create new project.
2. Open `APIs and services` > `OAuth consent screen`
3. Choose `External`, follow instructions
4. For `Scopes`, add only the `.../auth/userinfo.email` scope
5. Follow the remaining instructions until the OAuth consent screen is updated.
6. Open `APIs and services` > `Credentials` > `+ Create Credentials` > `OAuth client ID`.
7. Choose the `Web application` type.
8. Add the domains of the hosted clients here; They can be updated later.
9. Add `(domain)/google-sso` for each hosted client here, where (domain) is the hosted client; It can be updated later.

Once done you can submit this and a client id and secret should be available to you.
Note down the `client id` and `client secret` for the [environment configuration](#configuration).

Remember that if more client domains are added, they should also be added in both `Authorised JavaScript origins`(step 8) and `Authorised redirect URIs`(step 9).

## Configuration

### Environment File
A template [`.env.template`](./cdk/auth-example-cdk/.env.template) is provided. Create a copy named `.env` and fill in the required values.

#### Notable values
Update the following based on whether you want to use certain AWS services
```bash
# Set to "true" to use API Gateway. False to use Lambda function URLs.
ENABLE_API_GATEWAY=""
# Set to "true" to include deploying S3 and CloudFront, in order to remotely host the client.
ENABLE_S3_CLOUDFRONT=""
```

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

Generate long and complex password strings for these. Ensure these passwords are unique and not shared between them.
```
ACCESS_TOKEN_SECRET=""
REFRESH_TOKEN_SECRET=""
SSO_TOKEN_SECRET=""
```

Update based on the localhost client used:
```
DEV_CLIENT_HOST=""
```
(Note: Defining the remote host is currently not needed, since it is already set during the CloudFront creation in the CDK.)

### CDK Config
The [`cdk.json`](./cdk/auth-example-cdk/cdk.json) file defines the AWS profile that will be used, defined as the `profile` value.

Please change this to the AWS profile name of your choice.

## Authorization

JWT tokens are to be included in the `Authorization` header of a request. e.g.
```json
{
  "method": "GET",
  "hostname": "xxxx.lambda-url.ap-southeast-2.on.aws",
  "path": "/auth",
  "headers": {
    "Accept": "*/*",
    "Authorization": "Bearer (JWT)"
  }
}
```
This applies to both Refresh and Access JWTs.

Tokens are returned in the body of the response on:
* Sign-up (including SSO): Refresh + Access
* Sign-in (including SSO): Refresh + Access
* Refresh-token: Access

### Invalidation

JWTs can be invalidated by matching the `iat` timestamp of the JWT with the `iat` value in the database against the user.

If the database `iat` is greater than the `iat` of the JWT, the JWT is considered to be expired and no longer valid.

Tokens can be invalidated with the following:
* Sign-out all devices.
* Change password
* Reset password confirm
* TOTP activate

When one of these events happen, the user must sign-in again.

## Deployment

Once the CDK has been bootstrapped and configured, `cd` to the [`cdk/auth-example-cdk`](./cdk//auth-example-cdk) directory and run one of the following:

* `npm run cdk:synth` to do a test run and only generate CloudFormation templates. Useful as a 'dry-run' to catch any CDK configuration or coding issues.
* `npm run cdk:deploy` to deploy the stack.

Once deployed, it will print out the following outputs
* `ApiGatewayUrl` - The host URL of the API Gateway that was deployed. - i.e. the hosted API.
* `CloudFrontURL` - The host URL of the CloudFront distribution - i.e. the hosted client.
* `CloudFrontDistributionId` - CloudFront Distribution ID. Set this in the [`client .env`](../client/auth-example-client)

### Teardown

When the AWS resources are no longer required, run `npm run cdk:destroy` to run the command to destroy the CDK stack.

## Testing

API testing is done via Jest unit testing [here](../tests/api-tests).

The API supports the testing by defining test-only endpoints that are only available during local development.

Furthermore, users that contains specific strings in their email addressess are considered test users.
```javascript
// If the user email contains this, it is determined to be a test user/email.
const TEST_EMAIL_CONTAINS = '+apitest'
```

If attempting to sign-up with an email address that contain the `TEST_EMAIL_CONTAINS` string from anywhere other than local development, a `400` validation email will be returned and the user will not be created.

## API Endpoints

The following endpoints are currently defined:

| Method | Path | Requires Auth JWT | Description & Notes |
| -------- | -------- | -------- | -------- |
| GET | `/health` | None | Check the general health of the API. |
| GET | `/auth` | Access | Verify access token. |
| GET | `/auth/refresh-token` | Refresh | Get new access token via refresh token. |
| POST | `/auth/sign-up` | None | Sign up user. |
| POST | `/auth/sign-in` | None | Sign in user. |
| DELETE | `/auth/sign-out` | Access  | Sign out user, from all devices. |
| POST | `/auth/change-password` | Acess | Change password. Must already be signed-in. |
| POST | `/auth/reset-password/request` | None | Send email to an email address, containing a temporary code used to reset the password with `/auth/reset-password/confirm`.  |
| POST | `/auth/reset-password/confirm` | None | Change the password. Requires the temporary code from `/auth/reset-password/request`.  |
| GET | `/auth/verify-email` | Access | Is the email verified? |
| GET | `/auth/verify-email/request` | Access | Send email to user's email address, containing a temporary code used to reset the password with `/auth/verify-email/confirm`.  |
| POST | `/auth/verify-email/confirm` | Access | Verify email address, with the code received from `/auth/verify-email/request`.  |
| GET | `/auth/totp` | Access | Does the user have an active 2FA TOTP?  |
| PUT | `/auth/totp/add` | Access | Adds TOTP to the account. Note that it does not activate it yet.  |
| PUT | `/auth/totp/activate` | Access | Activates the TOTP. Only once active will it be used for sign-in.  |
| POST | `/auth/totp/remove` | Access | Removes existing TOTP. Requires an existing valid OTP or backup code.  |
| GET | `/auth/sso/google` | None | Returns Google SSO Sign in URL, specific for this app.  |
| POST | `/auth/sso/google/callback` | None | Signs in or signs up user once the user has signed in with Google. Requires TOTP if it is active.  |

Further endpoints that are used for testing, only available during local development.

| Method | Path | Requires Auth JWT | Description & Notes |
| -------- | -------- | -------- | -------- |
| GET | `/admin/cleanup-tests` | None | Delete existing test users from the database. |
| GET | `/admin/test-user` | Access | Get a test user. May only be used on test users. |
| PUT | `/admin/test-user` | Access | Update a test user. May only be used on test users. |

## Links
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [SQS Documentation](https://docs.aws.amazon.com/sqs/)
