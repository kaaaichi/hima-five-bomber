# Lambda Container Image for Five Bomber Backend
# Multi-stage build for optimized image size

# Stage 1: Build
FROM public.ecr.aws/lambda/nodejs:22 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Runtime
FROM public.ecr.aws/lambda/nodejs:22

WORKDIR ${LAMBDA_TASK_ROOT}

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Copy any additional runtime files if needed
# COPY src/config ./config

# Lambda handler configuration
# The handler path format: {directory}/{file}.{export}
# Since we have dist/index.js with exports, we can use various handlers
# This can be overridden in terraform or environment variables
CMD [ "dist/handlers/rest/rooms.handler" ]

# Note: Actual handler will be specified in Terraform per Lambda function
# This is just a placeholder for the base image
