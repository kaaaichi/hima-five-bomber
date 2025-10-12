"use strict";
/**
 * S3 client utilities
 * Provides configured S3 client for use across the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
/**
 * Create S3 client with proper configuration
 * Using global scope for Lambda container reuse
 */
exports.s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || 'ap-northeast-1',
});
//# sourceMappingURL=s3.js.map