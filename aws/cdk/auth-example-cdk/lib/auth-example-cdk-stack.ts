import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Cors, EndpointType, IResource, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway'
import { AttributeType, BillingMode, ProjectionType, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Runtime, Architecture, Code, LogFormat, Function, LayerVersion, FunctionUrlAuthType, FunctionUrlCorsOptions, HttpMethod } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3'
import { CloudFrontWebDistribution, OriginAccessIdentity, PriceClass, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront'
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam'

// Environment variables.
// Read from .env file.
import 'dotenv/config'
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || ''
const DEV_CLIENT_HOST = process.env.DEV_CLIENT_HOST || ''
const ENABLE_API_GATEWAY = JSON.parse(process.env.ENABLE_API_GATEWAY || 'false')
const ENABLE_S3_CLOUDFRONT = JSON.parse(process.env.ENABLE_S3_CLOUDFRONT || 'false')
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || ''
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || ''
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || ''
const GMAIL_USER_EMAIL = process.env.GMAIL_USER_EMAIL || ''
const GOOGLE_SSO_CLIENT_ID = process.env.GOOGLE_SSO_CLIENT_ID || ''
const GOOGLE_SSO_CLIENT_SECRET = process.env.GOOGLE_SSO_CLIENT_SECRET || ''
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || ''
const SSO_TOKEN_SECRET = process.env.SSO_TOKEN_SECRET || ''
if (
  !ACCESS_TOKEN_SECRET
  || !DEV_CLIENT_HOST
  || !GMAIL_CLIENT_ID
  || !GMAIL_CLIENT_SECRET
  || !GMAIL_REFRESH_TOKEN
  || !GMAIL_USER_EMAIL
  || !GOOGLE_SSO_CLIENT_ID
  || !GOOGLE_SSO_CLIENT_SECRET
  || !REFRESH_TOKEN_SECRET
  || !SSO_TOKEN_SECRET
) throw new Error('Missing environment variables')

// Ensure token secrets are not shared.
const checkSecretsAreShared = [
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  SSO_TOKEN_SECRET,
]
const checkSecretsAreSharedSet = new Set(checkSecretsAreShared)
if (checkSecretsAreSharedSet.size !== checkSecretsAreShared.length) throw new Error('Some secrets are being shared!')

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
const CLIENT_S3_BUCKET = 'auth-example-client-s3'
const CLIENT_CLOUDFRONT_DISTRIBUTION = 'auth-example-client-cloudfront'

export class AuthExampleCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    let prodClientHost = ''

    // Create S3 and CloudFront, in order to remotely host the client.
    // Do this first in order to get the CloudFront domain host to use in Lambda and API Gateway settings.
    if (ENABLE_S3_CLOUDFRONT) {

      // Create an S3 bucket
      const bucket = new Bucket(this, CLIENT_S3_BUCKET, {
        bucketName: CLIENT_S3_BUCKET,
        removalPolicy: RemovalPolicy.DESTROY, // Only for testing purposes
        websiteIndexDocument: 'index.html',
        websiteErrorDocument: 'index.html',
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        autoDeleteObjects: true,
      })

      const cloudFrontOAI = new OriginAccessIdentity(this, CLIENT_CLOUDFRONT_DISTRIBUTION + 'OAI')

      const cloudFrontDistribution = new CloudFrontWebDistribution(this, CLIENT_CLOUDFRONT_DISTRIBUTION, {
        enabled: true,
        defaultRootObject: 'index.html',
        originConfigs: [{
          s3OriginSource: {
            s3BucketSource: bucket,
            originAccessIdentity: cloudFrontOAI,
            // originPath: '/index.html',
          },
          behaviors: [{
            isDefaultBehavior: true,
            defaultTtl: Duration.seconds(3600), // Set TTL to one hour (adjust as needed)
            minTtl: Duration.seconds(300), // Set minimum TTL
            maxTtl: Duration.seconds(86400), // Set maximum TTL
            compress: true, // Enable compression
          }],
        }],
        errorConfigurations: [
          {
            errorCode: 403,
            errorCachingMinTtl: 0,
            responseCode: 200,
            responsePagePath: '/index.html',
          },
          {
            errorCode: 404,
            errorCachingMinTtl: 0,
            responseCode: 200,
            responsePagePath: '/index.html',
          },
        ],
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        // enableLogging: true, // Enable access logs
        // logBucket: myLogBucket, // Specify the S3 bucket for access logs
        comment: CLIENT_CLOUDFRONT_DISTRIBUTION,
        priceClass: PriceClass.PRICE_CLASS_100, // Use the lowest price class
      })

      bucket.grantRead(cloudFrontOAI.grantPrincipal)

      prodClientHost = `https://${cloudFrontDistribution.distributionDomainName}`

      // Output CloudFront URL
      new CfnOutput(this, 'CloudFrontURL', {
        value: prodClientHost,
        description: 'CloudFront Distribution URL',
      })

      // Output CloudFront ID
      new CfnOutput(this, 'CloudFrontDistributionId', {
        value: cloudFrontDistribution.distributionId,
        description: 'CloudFront Distribution ID',
      })
    }

    // Define the allowed origins for the API.
    const allowedOrigins = [DEV_CLIENT_HOST]
    if (prodClientHost) allowedOrigins.push(prodClientHost)

    // CORS settings for Lambda functionUrls.
    const functionUrlCors: FunctionUrlCorsOptions = {
      allowedOrigins,
      allowedMethods: [HttpMethod.ALL],
      allowedHeaders: ['*'],
      maxAge: Duration.seconds(86400),
      allowCredentials: true,
      exposedHeaders: ['*'],
    }

    // Create Lambda layer/s.
    const authLambdaLayer = this.createLambdaLayer(LAMBDA_NODE_MODULE_LAYER_NAME, LAMBDA_NODE_MODULE_LAYER_NAME)

    // Create Lambda.
    const authLambdaFunction = this.createLambdaFunction({ functionName: LAMBDA_NAME, isPublic: true }, {
      description: 'Main authentication example Lambda function.',
      layers: [authLambdaLayer],
      environment: {
        ACCESS_TOKEN_SECRET,
        API_GATEWAY_ENABLED: ENABLE_API_GATEWAY.toString(),
        AUTH_INDEX_NAME,
        DEV_CLIENT_HOST,
        GOOGLE_SSO_CLIENT_ID,
        GOOGLE_SSO_CLIENT_SECRET,
        PROD_CLIENT_HOST: prodClientHost,
        REFRESH_TOKEN_SECRET,
        SSO_TOKEN_SECRET,
        USERS_TABLE_NAME,
      },
      functionUrlCors,
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
    if (ENABLE_API_GATEWAY) {

      const api = new RestApi(this, API_NAME, {
        restApiName: API_NAME,
        description: 'Authentication example API.',
        deploy: true,
        deployOptions: {
          stageName: 'prod',
          // description: '',
          throttlingRateLimit: 2,
          throttlingBurstLimit: 4,
        },
        endpointTypes: [EndpointType.REGIONAL],
        defaultCorsPreflightOptions: {
          allowOrigins: allowedOrigins,
          allowCredentials: true,
          allowHeaders: Cors.DEFAULT_HEADERS,
          allowMethods: Cors.ALL_METHODS,
        },
      })

      const integration = new LambdaIntegration(authLambdaFunction)
      const apiUrl = api.url

      // Output the API Gateway endpoint URL
      new CfnOutput(this, 'ApiGatewayUrl', {
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
    }

    // Now handle the SQS + Lambda for nodemailer.

    // Create SQS queues.
    const nodemailerSQSDL = new Queue(this, NODEMAILER.SQS_QUEUE.DEAD_LETTER, {
      queueName: NODEMAILER.SQS_QUEUE.DEAD_LETTER,
      retentionPeriod: Duration.days(14),
    })
    const nodemailerSQS = new Queue(this, NODEMAILER.SQS_QUEUE.MAIN, {
      queueName: NODEMAILER.SQS_QUEUE.MAIN,
      visibilityTimeout: Duration.seconds(NODEMAILER.SQS_QUEUE.TIMEOUT_SECONDS), // Set this to the same as the lambda timeout.
      retentionPeriod: Duration.days(14),
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
    const nodemailerLambda = this.createLambdaFunction({ functionName: NODEMAILER.LAMBDA_NAME, isPublic: false }, {
      description: 'Nodemailer async Lambda function, using SQS.',
      timeout: Duration.seconds(NODEMAILER.SQS_QUEUE.TIMEOUT_SECONDS),
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
    { functionName, isPublic }:
      { functionName: string, isPublic: boolean },
    // Optional params.
    { layers, environment, description, timeout, functionUrlCors }:
      { layers?: LayerVersion[], environment?: { [key: string]: string }, description?: string, timeout?: Duration, functionUrlCors?: FunctionUrlCorsOptions },
  ) {
    // Create Lambda.
    const lambda = new Function(this, functionName, {
      functionName,
      description,
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      handler: 'index.handler',
      code: Code.fromAsset(`../../lambda/${functionName}`),
      timeout: timeout || Duration.seconds(29),
      memorySize: 256,
      retryAttempts: 0,
      logFormat: LogFormat.JSON,
      layers,
      environment,
    })

    if (isPublic) {
      // If not using API Gateway, it must use Lambda function Url.
      if (!ENABLE_API_GATEWAY) {
        const lambdaUrl = lambda.addFunctionUrl({
          authType: FunctionUrlAuthType.NONE,
          cors: functionUrlCors,
        })
        new CfnOutput(this, functionName + 'Url', { value: lambdaUrl.url })
      } else {
        // IMPORTANT: Lambda grant invoke to APIGateway.
        // https://stackoverflow.com/a/62474072
        lambda.grantInvoke(new ServicePrincipal('apigateway.amazonaws.com'))
      }
    }

    return lambda
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
   * @param {IResource} api
   * @param {string} path
   * @param {LambdaIntegration} integration
   * @param {{ method: string, operationName?: string }[]} [methods]
   */
  addApiResource(api: IResource, path: string, integration: LambdaIntegration, methods?: { method: string, operationName?: string }[]) {
    const resource = api.addResource(path)
    if (methods?.length) methods.forEach(({ method, operationName }) => resource.addMethod(method, integration, { operationName }))
    return resource
  }
}
