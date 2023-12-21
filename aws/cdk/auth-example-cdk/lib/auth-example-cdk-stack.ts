import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime, Architecture, Code, LogFormat, Function } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

const lambdaName = 'auth-example-lambda'
const tableName = 'auth-example-users'
const apiName = 'auth-example-api'

export class AuthExampleCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Lambda.
    const lambdaFunction = new Function(this, lambdaName, {
      functionName: lambdaName,
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      handler: 'index.handler',
      code: Code.fromAsset('../../../lambda/auth-example-lambda'),
      timeout: cdk.Duration.seconds(29),
      memorySize: 128,
      retryAttempts: 0,
      logFormat: LogFormat.JSON,
      environment: {

      },
    })

    // Create DynamoDB.
    const dynamoTable = new Table(this, tableName, {
      tableName: tableName,
      partitionKey: { name: 'email', type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY, // WARNING: This will delete the table and its data on stack deletion
    })
    dynamoTable.grantReadWriteData(lambdaFunction)

    // Create API Gateway.
    // Note: Deploy manually after creation.
    const api = new RestApi(this, apiName, { restApiName: apiName, deploy: false, })
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
