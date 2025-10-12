/**
 * S3 client utilities
 * Provides configured S3 client for use across the application
 */

import { S3Client } from '@aws-sdk/client-s3';

/**
 * Create S3 client with proper configuration
 * Using global scope for Lambda container reuse
 */
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
});
