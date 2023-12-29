# Authentication Example

## Purpose

This project aims to explore and demonstrate authentication in REST APIs using JSON Web Tokens (JWT). The implementation leverages various AWS services and a React TypeScript front-end client.

## Technologies Used

- **AWS API Gateway**: For creating and managing the REST API.
- **AWS Lambda (NodeJS)**: For serverless execution of backend logic.
- **AWS DynamoDB**: A NoSQL database used for storing user data.
- **AWS CDK (Infrastructure as Code)**: To define and provision the necessary AWS resources.
- **React TypeScript**: A basic front-end client for testing and interacting with the REST API.

## Notable Dependencies

- **jsonwebtoken and react-jwt**: For generating and handling JWT tokens.
- **bcrypt**: Used for password hashing.
- **nodemailer and googleapis**: For sending email notifications.

## Prerequisites

- **NodeJS v20+**: Ensure NodeJS is installed on your machine.
- **AWS Account**: You need an AWS account with sufficient permissions to create and destroy the required AWS resources.

## Project Structure

```
- aws: Contains Lambda functions and CDK infrastructure code.
  - lambda: AWS Lambda functions.
  - cdk: AWS CDK code for infrastructure.
- client: Contains the React TypeScript front-end.
  - auth-example-client: React TypeScript client.
```

## Getting Started

### AWS

Once this repo is cloned, you can begin these steps:

1. Update settings in `aws/lambda/auth-example-lambda/index.mjs`.
2. Update settings in `aws/cdk/auth-example-cdk/lib/auth-example-cdk-stack.ts`.
3. Update `aws/cdk/auth-example-cdk/cdk.json`: Change the `profile` to match your AWS CLI profile.
4. Open a terminal and navigate to `aws/cdk/auth-example-cdk`.
5. Run `npm run build`.
6. Run `npm run synth` to check the CloudFormation stack.
7. Deploy the stack with `npm run cdk:deploy`.

### React Client

Once AWS resources have been set up, you may proceed with the below:

1. Update settings in `client/auth-example-client/src/services/apiService.ts`.
2. Open a terminal and navigate to `client/auth-example-client`.
3. Run `npm run dev` to start the React development server.
4. Open the React client in your browser

Feel free to explore the code in each directory for detailed implementation.

## License

This project is licensed under the [Apache 2.0 License](LICENSE).