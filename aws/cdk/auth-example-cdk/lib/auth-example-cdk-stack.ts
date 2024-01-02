import * as cdk from 'aws-cdk-lib'
import { RemovalPolicy } from 'aws-cdk-lib'
import { Cors, EndpointType, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway'
import { AttributeType, BillingMode, ProjectionType, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Runtime, Architecture, Code, LogFormat, Function, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'

// Environment variables.
// Read from .env file.
import 'dotenv/config'
const CLIENT_HOST = process.env.CLIENT_HOST || ''
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || ''
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || ''
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || ''
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || ''
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || ''
const GMAIL_USER_EMAIL = process.env.GMAIL_USER_EMAIL || ''
const GOOGLE_SSO_CLIENT_ID = process.env.GOOGLE_SSO_CLIENT_ID || ''
const GOOGLE_SSO_CLIENT_SECRET = process.env.GOOGLE_SSO_CLIENT_SECRET || ''
if (
  !CLIENT_HOST
  || !ACCESS_TOKEN_SECRET
  || !REFRESH_TOKEN_SECRET
  || !GMAIL_CLIENT_ID
  || !GMAIL_CLIENT_SECRET
  || !GMAIL_REFRESH_TOKEN
  || !GMAIL_USER_EMAIL
  || !GOOGLE_SSO_CLIENT_ID
  || !GOOGLE_SSO_CLIENT_SECRET
) throw new Error('Missing environment variables')

// Other settings.
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

export class AuthExampleCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Create Lambda layer/s.
    const authLambdaLayer = this.createLambdaLayer(LAMBDA_NODE_MODULE_LAYER_NAME, LAMBDA_NODE_MODULE_LAYER_NAME)

    // Create Lambda.
    const authLambdaFunction = this.createLambdaFunction({ functionName: LAMBDA_NAME }, {
      description: 'Main authentication example Lambda function.',
      layers: [authLambdaLayer],
      environment: {
        ACCESS_TOKEN_SECRET,
        AUTH_INDEX_NAME,
        GOOGLE_SSO_CLIENT_ID,
        GOOGLE_SSO_CLIENT_SECRET,
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
        'emailVerified',
      ],
    })
    // Grant DB access to the lambda.
    dynamoTable.grantReadWriteData(authLambdaFunction)

    // Create API Gateway.
    // Note: Also automatically deploys the API.
    const api = new RestApi(this, API_NAME, {
      restApiName: API_NAME,
      description: 'Authentication example API.',
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
      },
    })
    api.addUsagePlan('defaultUsage', {
      name: 'defaultUsage',
      throttle: {
        rateLimit: 2,
        burstLimit: 4,
      },
      apiStages: [{ api, stage: api.deploymentStage }],
    })

    const integration = new LambdaIntegration(authLambdaFunction)
    const apiUrl = api.url

    // Output the API Gateway endpoint URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: apiUrl,
      description: 'API Gateway URL',
    })

    // API health resource.
    // `/health`
    this.addApiResource(api.root, 'health', integration, [{ method: 'GET', operationName: 'getHealth' }])

    // Auth root resource.
    // `/auth`
    const authResource = this.addApiResource(api.root, 'auth', integration, [{ method: 'GET', operationName: 'checkAccessToken' }])

    // RefreshToken resource.
    // `/auth/refresh-token`
    this.addApiResource(authResource, 'refresh-token', integration, [{ method: 'GET', operationName: 'refreshAccessToken' }])

    // SignUp resource.
    // `/auth/sign-up`
    this.addApiResource(authResource, 'sign-up', integration, [{ method: 'POST', operationName: 'signUp' }])

    // SignIn resource.
    // `/auth/sign-in`
    this.addApiResource(authResource, 'sign-in', integration, [{ method: 'POST', operationName: 'signIn' }])

    // SignOut resource.
    // `/auth/sign-out`
    this.addApiResource(authResource, 'sign-out', integration, [{ method: 'DELETE', operationName: 'signOut' }])

    // ChangePassword resource.
    // `/auth/change-password`
    this.addApiResource(authResource, 'change-password', integration, [{ method: 'POST', operationName: 'changePassword' }])

    // ResetPassword resource.
    // `/auth/reset-password`
    const resetPassword = this.addApiResource(authResource, 'reset-password', integration)
    // ResetPassword request.
    // `/auth/reset-password/request`
    this.addApiResource(resetPassword, 'request', integration, [{ method: 'POST', operationName: 'resetPasswordRequest' }])
    // ResetPassword confirm.
    // `/auth/reset-password/confirm`
    this.addApiResource(resetPassword, 'confirm', integration, [{ method: 'POST', operationName: 'resetPasswordConfirm' }])

    // VerifyEmail resource.
    // `/auth/verify-email`
    const verifyEmail = this.addApiResource(authResource, 'verify-email', integration, [{ method: 'GET', operationName: 'isEmailVerified' }])
    // VerifyEmail request.
    // `/auth/verify-email/request`
    this.addApiResource(verifyEmail, 'request', integration, [{ method: 'GET', operationName: 'verifyEmailRequest' }])
    // VerifyEmail confirm.
    // `/auth/verify-email/confirm`
    this.addApiResource(verifyEmail, 'confirm', integration, [{ method: 'POST', operationName: 'verifyEmailConfirm' }])

    // TOTP resource.
    // `/auth/totp`
    const totp = this.addApiResource(authResource, 'totp', integration, [{ method: 'GET', operationName: 'hasActiveTotp' }])
    // Add TOTP.
    // `/auth/totp/add`
    this.addApiResource(totp, 'add', integration, [{ method: 'PUT', operationName: 'addTotp' }])
    // Activate TOTP.
    // `/auth/totp/activate`
    this.addApiResource(totp, 'activate', integration, [{ method: 'PUT', operationName: 'activateTotp' }])
    // Remove TOTP.
    // `/auth/totp/remove`
    this.addApiResource(totp, 'remove', integration, [{ method: 'POST', operationName: 'removeTotp' }])

    // SSO resource.
    // `/auth/sso`
    const sso = this.addApiResource(authResource, 'sso', integration)
    // Google SSO.
    // `/auth/sso/google`
    const googleSSO = this.addApiResource(sso, 'google', integration, [{ method: 'GET', operationName: 'getGoogleSSOLink' }])
    // Google SSO callback.
    // `/auth/sso/google/callback`
    this.addApiResource(googleSSO, 'callback', integration, [{ method: 'POST', operationName: 'signInWithGoogleSSO' }])

    // Admin resource.
    const admin = this.addApiResource(api.root, 'admin', integration)
    // Clean up records created by tests.
    // `/admin/cleanup-tests`
    this.addApiResource(admin, 'cleanup-tests', integration, [{ method: 'GET', operationName: 'cleanupTests' }])
    // Test user endpoints.
    // Only applicable for test users.
    // `/admin/test-user`
    this.addApiResource(admin, 'test-user', integration, [
      { method: 'GET', operationName: 'getTestUser' },
      { method: 'PUT', operationName: 'updateTestUser' },
    ])

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
        queue: nodemailerSQSDL,
      },
    })
    // Update the auth lambda with this new SQS.
    authLambdaFunction.addEnvironment('NODEMAILER_SQS', nodemailerSQS.queueUrl)
    nodemailerSQS.grantSendMessages(authLambdaFunction)

    // Create Nodemailer Lambda layer/s.
    const nodemailerLambdaLayer = this.createLambdaLayer(NODEMAILER.LAYER_NAME, NODEMAILER.LAMBDA_NAME)

    // Create Nodemailer Lambda.
    const nodemailerLambda = this.createLambdaFunction({ functionName: NODEMAILER.LAMBDA_NAME }, {
      description: 'Nodemailer async Lambda function, using SQS.',
      timeout: cdk.Duration.seconds(NODEMAILER.SQS_QUEUE.TIMEOUT_SECONDS),
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

  /**
   * Creates a Lambda function.
   */
  createLambdaFunction(
    // Required params.
    { functionName }:
      { functionName: string, },
    // Optional params.
    { layers, environment, description, timeout }:
      { layers?: LayerVersion[], environment?: { [key: string]: string }, description?: string, timeout?: cdk.Duration },
  ) {
    // Create Lambda.
    return new Function(this, functionName, {
      functionName,
      description,
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      handler: 'index.handler',
      code: Code.fromAsset(`../../lambda/${functionName}`),
      timeout: timeout || cdk.Duration.seconds(29),
      memorySize: 256,
      retryAttempts: 0,
      logFormat: LogFormat.JSON,
      layers,
      environment,
    })
  }

  /**
   * Creates a Lambda layer.
   *
   * @param {string} layerVersionName
   * @param {string} lambdaFunctionName
   */
  createLambdaLayer(layerVersionName: string, lambdaFunctionName: string) {
    return new LayerVersion(this, layerVersionName, {
      layerVersionName,
      description: `Layer required for the ${lambdaFunctionName} Lambda function.`,
      code: Code.fromAsset(`../../lambda/${layerVersionName}`), // Replace with the actual path
      compatibleRuntimes: [Runtime.NODEJS_20_X], // Choose the appropriate runtime
    })
  }

  /**
   * Adds an API resource.
   *
   * @param {cdk.aws_apigateway.IResource} api
   * @param {string} path
   * @param {LambdaIntegration} integration
   * @param {{ method: string, operationName?: string }[]} [methods]
   */
  addApiResource(api: cdk.aws_apigateway.IResource, path: string, integration: LambdaIntegration, methods?: { method: string, operationName?: string }[]) {
    const resource = api.addResource(path)
    if (methods?.length) methods.forEach(({ method, operationName }) => resource.addMethod(method, integration, { operationName }))
    return resource
  }
}
