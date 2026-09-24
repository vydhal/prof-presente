-- CreateEnum
CREATE TYPE "EventModality" AS ENUM ('PRESENCIAL', 'ONLINE', 'HIBRIDO');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "modality" "EventModality" NOT NULL DEFAULT 'PRESENCIAL';

-- CreateTable
CREATE TABLE "live_checkin_windows" (
    "id" TEXT NOT NULL,
    "live_stream_id" TEXT NOT NULL,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "opened_by_id" TEXT,

    CONSTRAINT "live_checkin_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_checkin_confirmations" (
    "id" TEXT NOT NULL,
    "window_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "confirmed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_checkin_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "live_checkin_windows_live_stream_id_idx" ON "live_checkin_windows"("live_stream_id");

-- CreateIndex
CREATE UNIQUE INDEX "live_checkin_confirmations_window_id_user_id_key" ON "live_checkin_confirmations"("window_id", "user_id");

-- AddForeignKey
ALTER TABLE "live_checkin_windows" ADD CONSTRAINT "live_checkin_windows_live_stream_id_fkey" FOREIGN KEY ("live_stream_id") REFERENCES "live_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_checkin_confirmations" ADD CONSTRAINT "live_checkin_confirmations_window_id_fkey" FOREIGN KEY ("window_id") REFERENCES "live_checkin_windows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_checkin_confirmations" ADD CONSTRAINT "live_checkin_confirmations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

