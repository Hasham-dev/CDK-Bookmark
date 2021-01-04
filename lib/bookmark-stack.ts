import * as cdk from '@aws-cdk/core';
import * as appsync from '@aws-cdk/aws-appsync';
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from "@aws-cdk/aws-s3";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as s3Deployment from "@aws-cdk/aws-s3-deployment";
import * as cloudfront from "@aws-cdk/aws-cloudfront";

export class BookmarkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const bucket = new s3.Bucket(this, "Bookmarks3", {
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
    });
    //s3 bucket deployment and specifying that where is the content
    new s3Deployment.BucketDeployment(this, "buketbookmark", {
      sources: [s3Deployment.Source.asset("./client/public")],
      destinationBucket: bucket,
    });
    //cloudfront (aws cdn)
    new cloudfront.Distribution(this, "BookmarkCF", {
      defaultBehavior: { origin: new origins.S3Origin(bucket) },
    });
    // Creates the AppSync API
    const api = new appsync.GraphqlApi(this, 'Api', {
      name: 'cdk-notes-appsync-api',
      schema: appsync.Schema.fromAsset('graphql/schema.gql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          // apiKeyConfig: {
          //   expires: cdk.Expiration.after(cdk.Duration.days(365))
          // }
        },
      },
      xrayEnabled: true,
    });

    // Prints out the AppSync GraphQL endpoint to the terminal
    new cdk.CfnOutput(this, "GraphQLAPIURL", {
      value: api.graphqlUrl
    });

    // Prints out the AppSync GraphQL API key to the terminal
    new cdk.CfnOutput(this, "GraphQLAPIKey", {
      value: api.apiKey || ''
    });
    // Prints out the stack region to the terminal
    new cdk.CfnOutput(this, "Stack Region", {
      value: this.region
    });
    // lib/appsync-cdk-app-stack.ts
    const notesLambda = new lambda.Function(this, 'AppSyncNotesHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'main.handler',
      code: lambda.Code.fromAsset('lambda-fns'),
      memorySize: 1024
    });

    // Set the new Lambda function as a data source for the AppSync API
    const lambdaDs = api.addLambdaDataSource('lambdaDatasource', notesLambda);

    // lib/appsync-cdk-app-stack.ts

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "listBookmark"
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "createBookmark"
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "deleteBookmark"
    });

    

    // create DynamoDB table
    const notesTable = new ddb.Table(this, 'CDKNotesTable', {
      partitionKey: {
        name: 'id',
        type: ddb.AttributeType.STRING,
      },
    });

    // enable the Lambda function to access the DynamoDB table (using IAM)
    notesTable.grantFullAccess(notesLambda)
    
    notesLambda.addEnvironment('NOTES_TABLE', notesTable.tableName);
  }
}
