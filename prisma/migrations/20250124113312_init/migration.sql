-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "available_dates" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "available_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allowed_voters" (
    "name" TEXT NOT NULL,
    "has_voted" BOOLEAN NOT NULL DEFAULT false,
    "voted_at" TIMESTAMP(3),

    CONSTRAINT "allowed_voters_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "admins" (
    "name" TEXT NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "site_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "header_text" TEXT NOT NULL,

    CONSTRAINT "site_config_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_name_fkey" FOREIGN KEY ("name") REFERENCES "allowed_voters"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "available_dates" ADD CONSTRAINT "available_dates_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
