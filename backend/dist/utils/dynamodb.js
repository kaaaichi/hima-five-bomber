"use strict";
/**
 * DynamoDB client utilities
 * Provides configured DynamoDB DocumentClient for use across the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.docClient = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
/**
 * Create DynamoDB client with proper configuration
 * Using global scope for Lambda container reuse
 */
const dynamoDBClient = new client_dynamodb_1.DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-northeast-1',
});
/**
 * DynamoDB DocumentClient with marshalling/unmarshalling support
 * This provides high-level API for working with DynamoDB
 */
exports.docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoDBClient, {
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
//# sourceMappingURL=dynamodb.js.map