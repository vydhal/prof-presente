-- AlterTable
ALTER TABLE "space_reservations" ADD COLUMN     "event_script_url" TEXT,
ADD COLUMN     "needs_cerimonial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "one_doc_number" TEXT;
