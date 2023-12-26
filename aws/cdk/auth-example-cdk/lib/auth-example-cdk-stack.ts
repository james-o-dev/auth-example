import { randomUUID } from 'crypto'
import * as cdk from 'aws-cdk-lib'
import { RemovalPolicy } from 'aws-cdk-lib'
import { EndpointType, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway'
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Runtime, Architecture, Code, LogFormat, Function, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'

const lambdaNodeModuleLayerName = 'auth-example-lambda-node-module-layer'
const lambdaName = 'auth-example-lambda'
const tableName = 'auth-example-users'
const apiName = 'auth-example-api'

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
        USERS_TABLE_NAME: tableName,
        JWT_SECRET: randomUUID(),
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
      indexName: 'auth-index',
      partitionKey: {
        name: 'email', type: AttributeType.STRING,
      },
      sortKey: {
        name: 'hashedPassword', type: AttributeType.STRING,
      },
      // projectionType: ProjectionType.KEYS_ONLY,
    })
    // Grant DB access to the lambda.
    dynamoTable.grantReadWriteData(lambdaFunction)

    // Create API Gateway.
    // Note: Deploy manually after creation.
    const api = new RestApi(this, apiName, { restApiName: apiName, deploy: false, endpointTypes: [EndpointType.REGIONAL], })
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
  }
}
