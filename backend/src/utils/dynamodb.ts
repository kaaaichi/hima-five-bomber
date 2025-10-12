/**
 * DynamoDB client utilities
 * Provides configured DynamoDB DocumentClient for use across the application
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * Create DynamoDB client with proper configuration
 * Using global scope for Lambda container reuse
 */
const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
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
