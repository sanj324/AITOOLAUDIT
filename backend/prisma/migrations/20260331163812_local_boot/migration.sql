-- CreateTable
CREATE TABLE "role_master" (
    "id" SERIAL NOT NULL,
    "role_code" VARCHAR(50) NOT NULL,
    "role_name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_master" (
    "id" SERIAL NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role_id" INTEGER NOT NULL,
    "department" VARCHAR(100),
    "designation" VARCHAR(100),
    "last_login_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_master" (
    "id" SERIAL NOT NULL,
    "tool_name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(500),
    "risk_level" VARCHAR(30) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_master" (
    "id" SERIAL NOT NULL,
    "parameter_name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(500),
    "tool_id" INTEGER NOT NULL,
    "severity" VARCHAR(30) NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "evidence_required" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_master" (
    "id" SERIAL NOT NULL,
    "audit_name" VARCHAR(200) NOT NULL,
    "audit_type" VARCHAR(100) NOT NULL,
    "team" VARCHAR(150) NOT NULL,
    "tool_id" INTEGER NOT NULL,
    "auditor_id" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_response" (
    "id" SERIAL NOT NULL,
    "audit_id" INTEGER NOT NULL,
    "checklist_id" INTEGER NOT NULL,
    "response_status" VARCHAR(30) NOT NULL,
    "comments" VARCHAR(1000),
    "evidence_file_name" VARCHAR(255),
    "evidence_file_path" VARCHAR(500),
    "evidence_file_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_observation" (
    "id" SERIAL NOT NULL,
    "audit_id" INTEGER NOT NULL,
    "checklist_id" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "severity" VARCHAR(30) NOT NULL,
    "recommendation" VARCHAR(1000),
    "status" VARCHAR(30) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_trail_log" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action" VARCHAR(150) NOT NULL,
    "entity" VARCHAR(150) NOT NULL,
    "entity_id" INTEGER,
    "description" VARCHAR(1000),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_trail_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_master_role_code_key" ON "role_master"("role_code");

-- CreateIndex
CREATE UNIQUE INDEX "role_master_role_name_key" ON "role_master"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "user_master_email_key" ON "user_master"("email");

-- CreateIndex
CREATE INDEX "user_master_role_id_idx" ON "user_master"("role_id");

-- CreateIndex
CREATE INDEX "user_master_email_is_deleted_idx" ON "user_master"("email", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "tool_master_tool_name_key" ON "tool_master"("tool_name");

-- CreateIndex
CREATE INDEX "tool_master_tool_name_is_deleted_idx" ON "tool_master"("tool_name", "is_deleted");

-- CreateIndex
CREATE INDEX "checklist_master_tool_id_idx" ON "checklist_master"("tool_id");

-- CreateIndex
CREATE INDEX "checklist_master_parameter_name_is_deleted_idx" ON "checklist_master"("parameter_name", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_master_parameter_name_tool_id_key" ON "checklist_master"("parameter_name", "tool_id");

-- CreateIndex
CREATE INDEX "audit_master_tool_id_idx" ON "audit_master"("tool_id");

-- CreateIndex
CREATE INDEX "audit_master_auditor_id_idx" ON "audit_master"("auditor_id");

-- CreateIndex
CREATE INDEX "audit_master_status_is_deleted_idx" ON "audit_master"("status", "is_deleted");

-- CreateIndex
CREATE INDEX "audit_response_audit_id_idx" ON "audit_response"("audit_id");

-- CreateIndex
CREATE INDEX "audit_response_checklist_id_idx" ON "audit_response"("checklist_id");

-- CreateIndex
CREATE UNIQUE INDEX "audit_response_audit_id_checklist_id_key" ON "audit_response"("audit_id", "checklist_id");

-- CreateIndex
CREATE INDEX "audit_observation_audit_id_idx" ON "audit_observation"("audit_id");

-- CreateIndex
CREATE INDEX "audit_observation_checklist_id_idx" ON "audit_observation"("checklist_id");

-- CreateIndex
CREATE INDEX "audit_observation_status_is_deleted_idx" ON "audit_observation"("status", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "audit_observation_audit_id_checklist_id_key" ON "audit_observation"("audit_id", "checklist_id");

-- CreateIndex
CREATE INDEX "audit_trail_log_user_id_idx" ON "audit_trail_log"("user_id");

-- CreateIndex
CREATE INDEX "audit_trail_log_entity_created_at_idx" ON "audit_trail_log"("entity", "created_at");

-- CreateIndex
CREATE INDEX "audit_trail_log_action_created_at_idx" ON "audit_trail_log"("action", "created_at");

-- AddForeignKey
ALTER TABLE "user_master" ADD CONSTRAINT "user_master_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_master" ADD CONSTRAINT "checklist_master_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tool_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_master" ADD CONSTRAINT "audit_master_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tool_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_master" ADD CONSTRAINT "audit_master_auditor_id_fkey" FOREIGN KEY ("auditor_id") REFERENCES "user_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_response" ADD CONSTRAINT "audit_response_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audit_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_response" ADD CONSTRAINT "audit_response_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "checklist_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_observation" ADD CONSTRAINT "audit_observation_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audit_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_observation" ADD CONSTRAINT "audit_observation_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "checklist_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_trail_log" ADD CONSTRAINT "audit_trail_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;
