# Lambda Container Image for Five Bomber Backend
# Multi-stage build for optimized image size

# Stage 1: Build
FROM public.ecr.aws/lambda/nodejs:22 AS builder

WORKDIR /app

# Copy shared package first (dependency)
COPY shared/package*.json ./shared/
COPY shared/tsconfig.json ./shared/
COPY shared/index.ts ./shared/
COPY shared/types ./shared/types

# Build shared package
WORKDIR /app/shared
RUN npm ci && npm run build

# Copy backend package files
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/tsconfig.json ./

# Install dependencies (including dev dependencies for build)
# This will use the local shared package from ../shared
RUN npm ci

# Copy backend source code
COPY backend/src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Runtime
FROM public.ecr.aws/lambda/nodejs:22

WORKDIR ${LAMBDA_TASK_ROOT}

# Copy shared package (built)
COPY --from=builder /app/shared/package*.json ./shared/
COPY --from=builder /app/shared/dist ./shared/dist

# Copy backend package files
COPY --from=builder /app/backend/package*.json ./

# Install production dependencies only
# This will reference the local shared package
RUN npm ci --omit=dev

# Copy compiled backend code from builder
COPY --from=builder /app/backend/dist ./dist

# Copy any additional runtime files if needed
# COPY src/config ./config

# Lambda handler configuration
# The handler path format: {directory}/{file}.{export}
# Since we have dist/index.js with exports, we can use various handlers
# This can be overridden in terraform or environment variables
CMD [ "dist/handlers/rest/rooms.handler" ]

# Note: Actual handler will be specified in Terraform per Lambda function
# This is just a placeholder for the base image
