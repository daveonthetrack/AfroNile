-- Bring the database created by the initial migration in line with the
-- production commerce schema. Every ALTER is additive so environments that
-- were previously updated with prisma db push remain deployable.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_stripe_customer_id_key"
  ON "users"("stripe_customer_id");

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "order_number" TEXT,
  ADD COLUMN IF NOT EXISTS "tax_cents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "discount_cents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "shipping_cents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "stripe_session_id" TEXT,
  ADD COLUMN IF NOT EXISTS "receipt_url" TEXT,
  ADD COLUMN IF NOT EXISTS "refund_status" TEXT,
  ADD COLUMN IF NOT EXISTS "fulfillment_status" TEXT NOT NULL DEFAULT 'PENDING';

CREATE UNIQUE INDEX IF NOT EXISTS "orders_order_number_key"
  ON "orders"("order_number");
CREATE UNIQUE INDEX IF NOT EXISTS "orders_stripe_session_id_key"
  ON "orders"("stripe_session_id");

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" UUID NOT NULL,
  "user_id" UUID,
  "action" TEXT NOT NULL,
  "details" TEXT NOT NULL,
  "ip_address" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");

CREATE TABLE IF NOT EXISTS "payments" (
  "id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "stripe_payment_intent_id" TEXT,
  "amount_cents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "status" TEXT NOT NULL,
  "receipt_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "payments_order_id_idx" ON "payments"("order_id");
CREATE UNIQUE INDEX IF NOT EXISTS "payments_stripe_payment_intent_id_key"
  ON "payments"("stripe_payment_intent_id") WHERE "stripe_payment_intent_id" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "transactions" (
  "id" UUID NOT NULL,
  "order_id" UUID,
  "type" TEXT NOT NULL,
  "amount_cents" INTEGER NOT NULL,
  "stripe_session_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "transactions_order_id_idx" ON "transactions"("order_id");

CREATE TABLE IF NOT EXISTS "downloads" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "download_token" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "downloads_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "downloads_download_token_key" ON "downloads"("download_token");
CREATE INDEX IF NOT EXISTS "downloads_user_id_idx" ON "downloads"("user_id");
CREATE INDEX IF NOT EXISTS "downloads_product_id_idx" ON "downloads"("product_id");

CREATE TABLE IF NOT EXISTS "revenue_reports" (
  "id" UUID NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "gross_revenue_cents" INTEGER NOT NULL,
  "net_revenue_cents" INTEGER NOT NULL,
  "sales_cents" INTEGER NOT NULL,
  "donations_cents" INTEGER NOT NULL,
  "refunds_cents" INTEGER NOT NULL,
  "order_count" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "revenue_reports_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "revenue_reports_date_key" ON "revenue_reports"("date");

CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id" UUID NOT NULL,
  "event_type" TEXT NOT NULL,
  "details" TEXT,
  "user_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "analytics_events_event_type_idx" ON "analytics_events"("event_type");
CREATE INDEX IF NOT EXISTS "analytics_events_user_id_idx" ON "analytics_events"("user_id");

CREATE TABLE IF NOT EXISTS "processed_stripe_events" (
  "id" UUID NOT NULL,
  "event_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "processed_stripe_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "processed_stripe_events_event_id_key"
  ON "processed_stripe_events"("event_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_user_id_fkey') THEN
    ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_order_id_fkey') THEN
    ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey"
      FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_order_id_fkey') THEN
    ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_fkey"
      FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'downloads_user_id_fkey') THEN
    ALTER TABLE "downloads" ADD CONSTRAINT "downloads_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'downloads_product_id_fkey') THEN
    ALTER TABLE "downloads" ADD CONSTRAINT "downloads_product_id_fkey"
      FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
