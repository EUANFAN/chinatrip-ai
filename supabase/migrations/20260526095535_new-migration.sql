-- Initial MVP schema from Prisma migration
-- CreateEnum
CREATE TYPE "Language" AS ENUM ('en', 'zh');

-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('active', 'archived', 'deleted');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('pending', 'complete', 'failed');

-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('mock', 'doubao', 'deepseek');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "avatar_url" TEXT,
    "locale" "Language" NOT NULL DEFAULT 'en',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anonymous_sessions" (
    "id" UUID NOT NULL,
    "anonymous_id" TEXT NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anonymous_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" UUID NOT NULL,
    "profile_id" UUID,
    "anonymous_session_id" UUID,
    "title" TEXT NOT NULL,
    "language" "Language" NOT NULL DEFAULT 'en',
    "status" "ChatStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "chat_id" UUID NOT NULL,
    "role" "MessageRole" NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'complete',
    "sequence" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "error_code" TEXT,
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_answers" (
    "id" UUID NOT NULL,
    "chat_id" UUID NOT NULL,
    "user_message_id" UUID NOT NULL,
    "assistant_message_id" UUID NOT NULL,
    "profile_id" UUID,
    "anonymous_session_id" UUID,
    "share_slug" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "shared_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_logs" (
    "id" UUID NOT NULL,
    "chat_id" UUID NOT NULL,
    "message_id" UUID,
    "provider" "AiProvider" NOT NULL,
    "model" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL DEFAULT 'v1',
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "cost_estimate" DECIMAL(12,6),
    "latency_ms" INTEGER,
    "success" BOOLEAN NOT NULL,
    "fallback_used" BOOLEAN NOT NULL DEFAULT false,
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_sessions_anonymous_id_key" ON "anonymous_sessions"("anonymous_id");

-- CreateIndex
CREATE INDEX "chats_profile_id_last_message_at_idx" ON "chats"("profile_id", "last_message_at");

-- CreateIndex
CREATE INDEX "chats_anonymous_session_id_last_message_at_idx" ON "chats"("anonymous_session_id", "last_message_at");

-- CreateIndex
CREATE INDEX "messages_chat_id_created_at_idx" ON "messages"("chat_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "messages_chat_id_sequence_key" ON "messages"("chat_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "shared_answers_share_slug_key" ON "shared_answers"("share_slug");

-- CreateIndex
CREATE INDEX "shared_answers_assistant_message_id_idx" ON "shared_answers"("assistant_message_id");

-- CreateIndex
CREATE INDEX "shared_answers_profile_id_created_at_idx" ON "shared_answers"("profile_id", "created_at");

-- CreateIndex
CREATE INDEX "shared_answers_anonymous_session_id_created_at_idx" ON "shared_answers"("anonymous_session_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_usage_logs_chat_id_created_at_idx" ON "ai_usage_logs"("chat_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_usage_logs_message_id_idx" ON "ai_usage_logs"("message_id");

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_anonymous_session_id_fkey" FOREIGN KEY ("anonymous_session_id") REFERENCES "anonymous_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_answers" ADD CONSTRAINT "shared_answers_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_answers" ADD CONSTRAINT "shared_answers_user_message_id_fkey" FOREIGN KEY ("user_message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_answers" ADD CONSTRAINT "shared_answers_assistant_message_id_fkey" FOREIGN KEY ("assistant_message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_answers" ADD CONSTRAINT "shared_answers_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_answers" ADD CONSTRAINT "shared_answers_anonymous_session_id_fkey" FOREIGN KEY ("anonymous_session_id") REFERENCES "anonymous_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Convert timestamp fields to timestamptz
ALTER TABLE "profiles"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';

ALTER TABLE "anonymous_sessions"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "last_active_at" TYPE TIMESTAMPTZ(3) USING "last_active_at" AT TIME ZONE 'UTC';

ALTER TABLE "chats"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "last_message_at" TYPE TIMESTAMPTZ(3) USING "last_message_at" AT TIME ZONE 'UTC';

ALTER TABLE "messages"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';

ALTER TABLE "shared_answers"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';

ALTER TABLE "ai_usage_logs"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';
