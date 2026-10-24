-- Group browser profiles that run on the same physical device.
ALTER TABLE "AuthSession" ADD COLUMN "deviceKey" TEXT;
ALTER TABLE "AuthSession" ADD COLUMN "hardwareKey" TEXT;
ALTER TABLE "AuthSession" ADD COLUMN "gpuKey" TEXT;
ALTER TABLE "AuthSession" ADD COLUMN "networkKey" TEXT;
UPDATE "AuthSession" SET "deviceKey" = "deviceId" WHERE "deviceKey" IS NULL;
CREATE INDEX "AuthSession_userId_deviceKey_idx" ON "AuthSession"("userId", "deviceKey");
