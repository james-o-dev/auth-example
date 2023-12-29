import { randomUUID } from 'crypto'
import * as cdk from 'aws-cdk-lib'
import { RemovalPolicy } from 'aws-cdk-lib'
import { Cors, EndpointType, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway'
import { AttributeType, BillingMode, ProjectionType, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Runtime, Architecture, Code, LogFormat, Function, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'

const LAMBDA_NODE_MODULE_LAYER_NAME = 'auth-example-lambda-node-module-layer'
const LAMBDA_NAME = 'auth-example-lambda'
const API_NAME = 'auth-example-api'
const USERS_TABLE_NAME = 'auth-example-users'
const AUTH_INDEX_NAME = 'auth-index'
const CORS_ORIGIN = '' // Set this to the domain, depending on where the client is hosted.
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
      code: Code.fromAsset('../../lambda/auth-example-lambda-node-module-layer'), // Replace with the actual path
      compatibleRuntimes: [Runtime.NODEJS_20_X], // Choose the appropriate runtime
    })

    // Create Lambda.
    const lambdaFunction = new Function(this, LAMBDA_NAME, {
      functionName: LAMBDA_NAME,
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      handler: 'index.handler',
      code: Code.fromAsset('../../lambda/auth-example-lambda'),
      timeout: cdk.Duration.seconds(29),
      memorySize: 256,
      retryAttempts: 0,
      logFormat: LogFormat.JSON,
      layers: [lambdaNodeModuleLayer],
      environment: {
        ACCESS_TOKEN_SECRET,
        AUTH_INDEX_NAME,
        CORS_ORIGIN,
        GMAIL_CLIENT_ID,
        GMAIL_CLIENT_SECRET,
        GMAIL_REFRESH_TOKEN,
        GMAIL_USER_EMAIL,
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
        allowOrigins: [CORS_ORIGIN],
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
  }
}
