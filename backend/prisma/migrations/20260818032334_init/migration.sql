-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'RESEARCHER',
    "company_id" TEXT,
    "researcher_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "stripe_account_id" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "researchers" (
    "id" TEXT NOT NULL,
    "bio" TEXT,
    "avatar_url" TEXT,
    "github_url" TEXT,
    "reputation" INTEGER NOT NULL DEFAULT 0,
    "total_earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "researchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "api_endpoint" TEXT,
    "documentation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bounties" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "max_payout" DOUBLE PRECISION NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "expires_at" TIMESTAMP(3),
    "company_id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bounties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bug_reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reproduction_steps" TEXT NOT NULL,
    "input_example" TEXT,
    "output_example" TEXT,
    "expected_behavior" TEXT NOT NULL,
    "actual_behavior" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "researcher_notes" TEXT,
    "company_notes" TEXT,
    "researcher_id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "bounty_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bug_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrows" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "stripe_payment_intent_id" TEXT,
    "bug_report_id" TEXT NOT NULL,
    "bounty_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_researcher_id_key" ON "users"("researcher_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "companies_stripe_account_id_key" ON "companies"("stripe_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "escrows_stripe_payment_intent_id_key" ON "escrows"("stripe_payment_intent_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_researcher_id_fkey" FOREIGN KEY ("researcher_id") REFERENCES "researchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_models" ADD CONSTRAINT "ai_models_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounties" ADD CONSTRAINT "bounties_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounties" ADD CONSTRAINT "bounties_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "ai_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_researcher_id_fkey" FOREIGN KEY ("researcher_id") REFERENCES "researchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "ai_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_bounty_id_fkey" FOREIGN KEY ("bounty_id") REFERENCES "bounties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrows" ADD CONSTRAINT "escrows_bug_report_id_fkey" FOREIGN KEY ("bug_report_id") REFERENCES "bug_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrows" ADD CONSTRAINT "escrows_bounty_id_fkey" FOREIGN KEY ("bounty_id") REFERENCES "bounties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
