-- AlterEnum
ALTER TYPE "ContractType" ADD VALUE 'EXTERNO';

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "isHighlighted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "event_staff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_staff_userId_idx" ON "event_staff"("userId");

-- CreateIndex
CREATE INDEX "event_staff_eventId_idx" ON "event_staff"("eventId");

-- CreateIndex
CREATE INDEX "event_staff_role_idx" ON "event_staff"("role");

-- CreateIndex
CREATE UNIQUE INDEX "event_staff_userId_eventId_key" ON "event_staff"("userId", "eventId");

-- AddForeignKey
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
