import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const clientConfig: DynamoDBClientConfig = {
  region: process.env.AWS_REGION || 'ap-northeast-1',
};

if (process.env.DYNAMODB_ENDPOINT) {
  clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
  clientConfig.credentials = {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy',
  };
}

console.log('--- DynamoDB Client Init Debug ---');
console.log('process.env.AWS_REGION:', process.env.AWS_REGION);
console.log('process.env.DYNAMODB_ENDPOINT:', process.env.DYNAMODB_ENDPOINT);
console.log('clientConfig.region:', clientConfig.region);
console.log('clientConfig.endpoint:', clientConfig.endpoint);
console.log('clientConfig.credentials (if set directly):', clientConfig.credentials);

const dynamoDBClient = new DynamoDBClient(clientConfig);

dynamoDBClient.config.credentials().then(creds => {
  console.log('Resolved Credentials:', creds);
}).catch(err => {
  console.error('Error resolving credentials:', err);
});

/**
 * DynamoDB DocumentClient with marshalling/unmarshalling support
 * This provides high-level API for working with DynamoDB
 */
export const docClient = DynamoDBDocumentClient.from(dynamoDBClient, {
  marshallOptions: {
    // Convert empty strings to null (DynamoDB doesn't support empty strings)
    convertEmptyValues: true,
    // Remove undefined values
    removeUndefinedValues: true,
  },
  unmarshallOptions: {
    // When reading, convert DynamoDB NULL to undefined
    wrapNumbers: false,
  },
});
