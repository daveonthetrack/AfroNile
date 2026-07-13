ALTER TABLE "downloads"
  ADD COLUMN IF NOT EXISTS "order_id" UUID;

CREATE INDEX IF NOT EXISTS "downloads_order_id_idx" ON "downloads"("order_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'downloads_order_id_fkey') THEN
    ALTER TABLE "downloads" ADD CONSTRAINT "downloads_order_id_fkey"
      FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
