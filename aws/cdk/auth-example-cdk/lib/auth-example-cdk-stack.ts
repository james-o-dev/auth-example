import { randomUUID } from 'crypto'
import * as cdk from 'aws-cdk-lib'
import { RemovalPolicy } from 'aws-cdk-lib'
import { Cors, EndpointType, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway'
import { AttributeType, BillingMode, ProjectionType, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Runtime, Architecture, Code, LogFormat, Function, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'

const LAMBDA_NODE_MODULE_LAYER_NAME = 'auth-example-lambda-layer'
const LAMBDA_NAME = 'auth-example-lambda'
const API_NAME = 'auth-example-api'
const USERS_TABLE_NAME = 'auth-example-users'
const AUTH_INDEX_NAME = 'auth-index'
const NODEMAILER = {
  SQS_QUEUE: {
    MAIN: 'nodemailer-lambda-sqs',
    DEAD_LETTER: 'nodemailer-lambda-sqs-dl',
    TIMEOUT_SECONDS: 60,
  },
  LAMBDA_NAME: 'nodemailer-lambda',
  LAYER_NAME: 'nodemailer-lambda-layer',
}
const CLIENT_HOST = '' // Set this to the domain, depending on where the client is hosted.
const ACCESS_TOKEN_SECRET = '' || randomUUID() // Set the JWT secret here, to avoid invalidating existing tokens upon update; If empty, generate one.
const REFRESH_TOKEN_SECRET = '' || randomUUID() // Set the JWT secret here, to avoid invalidating existing tokens upon update; If empty, generate one.
const GMAIL_CLIENT_ID = '' // Set this.
const GMAIL_CLIENT_SECRET = '' // Set this.
const GMAIL_REFRESH_TOKEN = '' // Set this.
const GMAIL_USER_EMAIL = '' // Set this.

export class AuthExampleCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Create Lambda layer/s.
    const lambdaNodeModuleLayer = new LayerVersion(this, LAMBDA_NODE_MODULE_LAYER_NAME, {
      layerVersionName: LAMBDA_NODE_MODULE_LAYER_NAME,
      code: Code.fromAsset(`../../lambda/${LAMBDA_NODE_MODULE_LAYER_NAME}`), // Replace with the actual path
      compatibleRuntimes: [Runtime.NODEJS_20_X], // Choose the appropriate runtime
    })

    // Create Lambda.
    const lambdaFunction = new Function(this, LAMBDA_NAME, {
      functionName: LAMBDA_NAME,
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      handler: 'index.handler',
      code: Code.fromAsset(`../../lambda/${LAMBDA_NAME}`),
      timeout: cdk.Duration.seconds(29),
      memorySize: 256,
      retryAttempts: 0,
      logFormat: LogFormat.JSON,
      layers: [lambdaNodeModuleLayer],
      environment: {
        ACCESS_TOKEN_SECRET,
        AUTH_INDEX_NAME,
        CLIENT_HOST,
        REFRESH_TOKEN_SECRET,
        USERS_TABLE_NAME,
      },
    })

    // Create DynamoDB.
    const dynamoTable = new Table(this, USERS_TABLE_NAME, {
      tableName: USERS_TABLE_NAME,
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'userId', type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY, // WARNING: This will delete the table and its data on stack deletion
    })
    // Add global indexes.
    dynamoTable.addGlobalSecondaryIndex({
      indexName: AUTH_INDEX_NAME,
      partitionKey: {
        name: 'email', type: AttributeType.STRING,
      },
      projectionType: ProjectionType.INCLUDE,
      // projectionType: ProjectionType.ALL,
      nonKeyAttributes: [
        // Add other attributes.
        'hashedPassword',
        'userId',
        'totp',
      ]
    })
    // Grant DB access to the lambda.
    dynamoTable.grantReadWriteData(lambdaFunction)

    // Create API Gateway.
    // Note: Also automatically deploys the API.
    const api = new RestApi(this, API_NAME, {
      restApiName: API_NAME,
      deploy: true,
      deployOptions: {
        stageName: 'dev',
      },
      endpointTypes: [EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: [CLIENT_HOST],
        allowCredentials: true,
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowMethods: Cors.ALL_METHODS,
      }
    })
    const integration = new LambdaIntegration(lambdaFunction)
    const apiUrl = api.url

    // Output the API Gateway endpoint URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: apiUrl,
      description: 'API Gateway URL',
    })

    // Health resource.
    const healthResource = api.root.addResource('health')
    healthResource.addMethod('GET', integration)

    // Auth resource.
    const authResource = api.root.addResource('auth')
    authResource.addMethod('GET', integration)

    // RefreshToken resource.
    const refreshTokenResource = authResource.addResource('refresh-token')
    refreshTokenResource.addMethod('GET', integration)

    // SignUp resource.
    const signUpResource = authResource.addResource('sign-up')
    signUpResource.addMethod('POST', integration)

    // SignIn resource.
    const signInResource = authResource.addResource('sign-in')
    signInResource.addMethod('POST', integration)

    // SignOut resource.
    const signOutResource = authResource.addResource('sign-out')
    signOutResource.addMethod('DELETE', integration)

    // ChangePassword resource.
    const changePassword = authResource.addResource('change-password')
    changePassword.addMethod('POST', integration)

    // ResetPassword resource.
    const resetPassword = authResource.addResource('reset-password')
    resetPassword.addMethod('POST', integration)

    // VerifyEmail resource
    const verifyEmail = authResource.addResource('verify-email')
    verifyEmail.addMethod('GET', integration)

    // VerifyEmailRequest resource
    const verifyEmailRequest = verifyEmail.addResource('request')
    verifyEmailRequest.addMethod('GET', integration)

    // VerifyEmailConfirm resource
    const verifyEmailConfirm = verifyEmail.addResource('confirm')
    verifyEmailConfirm.addMethod('POST', integration)

    // TOTP resource
    const totp = authResource.addResource('totp')
    totp.addMethod('GET', integration)

    const addTotp = totp.addResource('add')
    addTotp.addMethod('PUT', integration)

    const removeTotp = totp.addResource('remove')
    removeTotp.addMethod('DELETE', integration)

    // Now handle the SQS + Lambda for nodemailer.

    // Create SQS queues.
    const nodemailerSQSDL = new Queue(this, NODEMAILER.SQS_QUEUE.DEAD_LETTER, {
      queueName: NODEMAILER.SQS_QUEUE.DEAD_LETTER,
      retentionPeriod: cdk.Duration.days(14),
    })
    const nodemailerSQS = new Queue(this, NODEMAILER.SQS_QUEUE.MAIN, {
      queueName: NODEMAILER.SQS_QUEUE.MAIN,
      visibilityTimeout: cdk.Duration.seconds(NODEMAILER.SQS_QUEUE.TIMEOUT_SECONDS), // Set this to the same as the lambda timeout.
      retentionPeriod: cdk.Duration.days(14),
      deadLetterQueue: {
        maxReceiveCount: 10,
        queue: nodemailerSQSDL
      }
    })
    // Update the auth lambda with this new SQS.
    lambdaFunction.addEnvironment('NODEMAILER_SQS', nodemailerSQS.queueUrl)
    nodemailerSQS.grantSendMessages(lambdaFunction)

    // Create Lambda layer/s.
    const nodemailerLambdaLayer = new LayerVersion(this, NODEMAILER.LAYER_NAME, {
      layerVersionName: NODEMAILER.LAYER_NAME,
      code: Code.fromAsset(`../../lambda/${NODEMAILER.LAYER_NAME}`), // Replace with the actual path
      compatibleRuntimes: [Runtime.NODEJS_20_X], // Choose the appropriate runtime
    })

    // Create Lambda.
    const nodemailerLambda = new Function(this, NODEMAILER.LAMBDA_NAME, {
      functionName: NODEMAILER.LAMBDA_NAME,
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      handler: 'index.handler',
      code: Code.fromAsset(`../../lambda/${NODEMAILER.LAMBDA_NAME}`),
      timeout: cdk.Duration.seconds(NODEMAILER.SQS_QUEUE.TIMEOUT_SECONDS),
      memorySize: 256,
      retryAttempts: 0,
      logFormat: LogFormat.JSON,
      layers: [nodemailerLambdaLayer],
      environment: {
        GMAIL_CLIENT_ID,
        GMAIL_CLIENT_SECRET,
        GMAIL_REFRESH_TOKEN,
        GMAIL_USER_EMAIL,
        NODEMAILER_SQS: nodemailerSQS.queueUrl,
      },
    })
    nodemailerSQS.grantConsumeMessages(nodemailerLambda)

    // Add queue trigger to lambda.
    nodemailerLambda.addEventSource(new SqsEventSource(nodemailerSQS, {
      batchSize: 10, // Default.
    }))
  }
}
