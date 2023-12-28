import { randomUUID } from 'crypto'
import * as cdk from 'aws-cdk-lib'
import { RemovalPolicy } from 'aws-cdk-lib'
import { Cors, EndpointType, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway'
import { AttributeType, BillingMode, ProjectionType, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Runtime, Architecture, Code, LogFormat, Function, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'

const lambdaNodeModuleLayerName = 'auth-example-lambda-node-module-layer'
const lambdaName = 'auth-example-lambda'
const tableName = 'auth-example-users'
const tableAuthIndexName = 'auth-index'
const apiName = 'auth-example-api'
const corsOrigin = '' // Set this to the domain, depending on where the client is hosted.
const jwtSecret = '' || randomUUID() // Set the JWT secret here, to avoid invalidating existing tokens upon update; If empty, generate one.

const nodemailerAuth = JSON.stringify({
  CLIENT_ID: '', // Set this.
  CLIENT_SECRET: '', // Set this.
  REFRESH_TOKEN: '', // Set this.
  USER_EMAIL: '', // Set this.
})

export class AuthExampleCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Create Lambda layer/s.
    const lambdaNodeModuleLayer = new LayerVersion(this, lambdaNodeModuleLayerName, {
      layerVersionName: lambdaNodeModuleLayerName,
      code: Code.fromAsset('../../lambda/auth-example-lambda-node-module-layer'), // Replace with the actual path
      compatibleRuntimes: [Runtime.NODEJS_20_X], // Choose the appropriate runtime
    })

    // Create Lambda.
    const lambdaFunction = new Function(this, lambdaName, {
      functionName: lambdaName,
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      handler: 'index.handler',
      code: Code.fromAsset('../../lambda/auth-example-lambda'),
      timeout: cdk.Duration.seconds(29),
      memorySize: 128,
      retryAttempts: 0,
      logFormat: LogFormat.JSON,
      layers: [lambdaNodeModuleLayer],
      environment: {
        AUTH_INDEX_NAME: tableAuthIndexName,
        CORS_ORIGIN: corsOrigin,
        NODEMAILER_AUTH: nodemailerAuth,
        USERS_TABLE_NAME: tableName,
        JWT_SECRET: jwtSecret,
      },
    })

    // Create DynamoDB.
    const dynamoTable = new Table(this, tableName, {
      tableName: tableName,
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'userId', type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY, // WARNING: This will delete the table and its data on stack deletion
    })
    // Add global indexes.
    dynamoTable.addGlobalSecondaryIndex({
      indexName: tableAuthIndexName,
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
    // Note: Deploy manually after creation.
    const api = new RestApi(this, apiName, {
      restApiName: apiName,
      deploy: false,
      endpointTypes: [EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: [corsOrigin],
        allowCredentials: true,
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowMethods: Cors.ALL_METHODS,
      }
    })
    const integration = new LambdaIntegration(lambdaFunction)

    // Health resource.
    const healthResource = api.root.addResource('health')
    healthResource.addMethod('GET', integration)

    // Auth resource.
    const authResource = api.root.addResource('auth')
    authResource.addMethod('GET', integration)

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
  }
}
