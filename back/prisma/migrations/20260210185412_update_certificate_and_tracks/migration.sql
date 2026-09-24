-- AlterTable
ALTER TABLE "CertificateLog" ADD COLUMN     "trackId" TEXT,
ALTER COLUMN "eventId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "learning_tracks" ADD COLUMN     "certificate_template_config" JSONB,
ADD COLUMN     "certificate_template_url" TEXT;

-- CreateIndex
CREATE INDEX "CertificateLog_trackId_idx" ON "CertificateLog"("trackId");

-- AddForeignKey
ALTER TABLE "CertificateLog" ADD CONSTRAINT "CertificateLog_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "learning_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
