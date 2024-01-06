# Authentication in REST APIs with JWT Tokens

## Table Of Contents
- [Purpose](#purpose)
- [Features & Demonstration](#features-&-demonstration)
- [Technologies & Services Used](#technologies-&-services-used)
- [Notable Dependencies](#notable-dependencies)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started In Summary](#getting-started-in-summary)
- [License](#license)

## Purpose
Explore and demonstrate authentication in REST APIs using JWT tokens.

Practice and apply knowledge of React Typescript and TailwindCSS to create an acompanying front-end client to demonstrate the authentication API.

## Features & Demonstration
- Full-stack web app using AWS Dynamo DB, AWS API Gateway, Lambda, and React Typescript
- Access and refresh JWTs
- Email and password sign-up and sign-in
- Email verification
- Two-factor authentication with Timed One-Time Passwords (TOTP)
- Reset password and change password
- Google Single Sign-On
- Responsive demo client, custom styling with minimal dependencies
- Client dark/light mode toggle
- Included API unit tests
- Detailed documentation

## Technologies & Services Used
- [AWS API Gateway](https://aws.amazon.com/api-gateway/) (REST API)
- [AWS Lambda](https://aws.amazon.com/lambda/) (NodeJS functions)
- [AWS DynamoDB](https://aws.amazon.com/dynamodb/) (NoSQL database)
- [AWS SQS](https://aws.amazon.com/sqs/) (asynchronous queue and messaging)
- [AWS CDK](https://aws.amazon.com/cdk/) (Infrastructure as Code)
- [AWS S3](https://aws.amazon.com/s3/) (File and media storage, for client files)
- [AWS CloudFront](https://aws.amazon.com/cloudfront/) (Managed CDN for client hosting, in conjunction with S3)
- [React TS](https://reactjs.org/) (Demonstration front-end client)
- [Tailwind CSS](https://tailwindcss.com/) (Client styling)
- [Google Cloud](https://cloud.google.com/) (Google SSO, emailing)
- [Jest](https://jestjs.io/) (API testing)

## Notable Dependencies
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) and [react-jwt](https://www.npmjs.com/package/react-jwt)
- [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- [nodemailer](https://nodemailer.com/about/) and [googleapis](https://github.com/googleapis/google-api-nodejs-client)
- [Tailwind CSS](https://tailwindcss.com/)
- [ESLint](https://eslint.org/)
- [time2fa](https://www.npmjs.com/package/time2fa) and [qrcode](https://www.npmjs.com/package/qrcode)

## Project Structure
- [`/aws`](./aws/): Contains Lambda and CDK
- [`/client`](./client/): Contains React TS
- [`/tests`](./tests/): Contains tests

## Prerequisites
- NodeJS v20+
- AWS account with sufficient permissions
  - See [README](/aws/README.md) in `aws` folder.
  - Note: Your AWS account may be charged based on usage (although it should be very small or none, if used conservatively).
- Google Cloud Console set up
  - See [README](/aws/README.md) in `aws` folder.
  - Google app for SSO
  - Google OAuth credentials for Gmail

## Getting Started In Summary

**Run locally**

1. Deploy the AWS CDK stack
   - See [README](/aws/README.md) in `aws` folder.
2. Set the appropriate environment variables in the `.env` file in the client React folder
    - See [README](/client/README.md) in `client` folder.
3. Run the client on your local host
   - See [README](/client/README.md) in `client` folder.
4. Visit the localhost in your browser when the client is running.

**Deploy the client**

1. Deploy the AWS CDK stack
   - See [README](/aws/README.md) in `aws` folder.
2. Set the appropriate environment variables in the `.env` file in the client React folder
    - See [README](/client/README.md) in `client` folder.
3. Run the `npm run build:deploy` npm script in the client directory.

## License
This project is licensed under the [Apache 2.0 License](LICENSE).