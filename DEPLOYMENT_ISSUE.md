# Lambda Container Image Deployment Issue

## Summary

Lambda Container Imageのデプロイ時に`Runtime.InvalidEntrypoint`エラーが発生し、新しいコード変更をAWS Lambdaにデプロイできない問題が発生しています。

## Timeline

### 2025-11-14 06:00 - Initial Deployment Success
- バックエンドコードをDocker Container ImageとしてビルドしECRにプッシュ
- Lambda関数にデプロイし、POST /rooms APIが正常動作確認
- Image Tag: `latest`
- Base Image: `public.ecr.aws/lambda/nodejs:22` (35 hours old)

### 2025-11-14 14:00 - Code Updates
- 統合ハンドラー(`handler()`)を追加
- GET /rooms/:roomId エンドポイント用の`getRoomHandler()`を追加
- `RoomService.getRoom()`メソッドを追加
- Commit: 78bb3bb

### 2025-11-14 14:30 - Deployment Failure
- 新しいコードで Docker Image をビルド（Tag: `20251113-125534`）
- ECRにプッシュしLambda関数を更新
- **Error**: `Runtime.InvalidEntrypoint` - ProcessSpawnFailed

## Root Cause Analysis

### Docker Base Image Version Issue

**Working Image** (`:latest`):
- Base Image: `public.ecr.aws/lambda/nodejs:22` (pulled 35 hours ago)
- Digest: `sha256:8b9bcf4b54e30260e80dbe19919371969b086c4683d3a78423eb2c67dd37399d`
- Status: ✅ Working

**Failing Images** (`20251113-125534`, `20251114-145500`, `20251114-updated`):
- Base Image: `public.ecr.aws/lambda/nodejs:22` (pulled 8 hours ago / recently)
- Status: ❌ Runtime.InvalidEntrypoint

### Investigation Steps

1. **Verified Dockerfile CMD**:
   ```dockerfile
   CMD [ "dist/handlers/rest/rooms.handler" ]
   ```

2. **Verified Lambda ImageConfig**:
   - Cleared manually set ImageConfig
   - Lambda uses Dockerfile CMD
   - Still fails with newer base image

3. **Verified Handler Export**:
   - Confirmed `export async function handler()` exists in rooms.ts
   - Compiled dist/handlers/rest/rooms.js contains handler export
   - Same code works with older base image

4. **Attempted Solutions**:
   - ✅ Full rebuild with new base image → Failed
   - ✅ Copy dist directory to working base image → Failed
   - ✅ Revert to `:latest` image → Works (but old code)

### Hypothesis

AWS Lambda Node.js 22 base imageの最近のバージョンに、entrypoint handlerの解決ロジックに変更があり、`dist/handlers/rest/rooms.handler`形式のパスを正しく解決できない可能性があります。

## Current Status

### Deployed and Working
- ✅ Frontend: CloudFront + S3 (latest code)
- ✅ Backend Lambda: Using `:latest` image (old code)
  - POST /rooms - ルーム作成 ✅
  - POST /rooms/:roomId/join - ルーム参加 ✅
  - DELETE /rooms/:roomId/leave - ルーム退出 ✅

### Implemented but Not Deployed
- ⏳ Unified handler routing
- ⏳ GET /rooms/:roomId - ルーム取得
- ⏳ RoomService.getRoom() method

### Code Status
- ✅ All changes committed (Commit: 78bb3bb)
- ✅ All tests passing (33 tests)
- ⏳ Deployment blocked by Docker base image issue

## Recommended Solutions

### Short-term (Task 3.7 Completion)
1. **Document current limitation**: Mark Task 3.7 as partially complete
2. **Test existing endpoints**: Verify POST /rooms and JOIN/LEAVE work on AWS
3. **Defer new endpoint testing**: GET /rooms/:roomId testing pending deployment

### Medium-term (CI/CD Pipeline - Task 2)
1. **GitHub Actions build**: Build Docker images in CI environment to avoid local issues
2. **Base image pinning**: Pin to specific working base image SHA256
3. **Automated testing**: E2E tests to catch deployment issues early

### Long-term (Alternative Approaches)
1. **Lambda Layers**: Consider using Lambda Layers instead of Container Images
2. **Buildx**: Use Docker buildx for multi-platform builds
3. **ECR Image Scanning**: Implement image vulnerability scanning

## Workaround for Immediate Deployment

**Option A**: Use CI/CD Pipeline (Recommended)
- GitHub Actions builds Docker image in clean environment
- Avoids local Docker cache and version issues
- Already implemented in Task 2.3

**Option B**: Manual Handler Path Investigation
- Test different handler path formats
- Verify Lambda Runtime Interface Emulator locally
- Debug with CloudWatch Logs

**Option C**: Revert to .zip Deployment
- Build backend as .zip bundle
- Deploy via S3 + Lambda update-function-code
- Simpler deployment model

## Action Items

- [x] Document deployment issue
- [ ] Complete Task 3.7 integration testing with existing endpoints
- [ ] Investigate GitHub Actions CI/CD for automatic builds
- [ ] Test alternative handler path formats
- [ ] Research AWS Lambda Container Image recent changes

## References

- Commit with new handlers: 78bb3bb
- Working image: `245705159423.dkr.ecr.ap-northeast-1.amazonaws.com/hima-five-bomber-prd-lambda:latest`
- Failed images: `20251113-125534`, `20251114-145500`, `20251114-updated`
- Lambda function: `hima-five-bomber-prd-rooms-handler`
- AWS Region: ap-northeast-1

---

**Last Updated**: 2025-11-14 15:00
**Status**: Under Investigation
