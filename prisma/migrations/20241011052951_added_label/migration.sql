-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "resetPasswordOTP" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "uniqueId" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT,
    "speechRecognition" BOOLEAN,
    "languageSupport" TEXT,
    "ttsEngine" TEXT,
    "ttsVoices" TEXT,
    "sttEngine" TEXT,
    "realTimeSTT" BOOLEAN,
    "voiceCallSupported" BOOLEAN,
    "voiceCallProvider" TEXT,
    "welcomeMessage" TEXT,
    "agentPrompt" TEXT,
    "llmModel" TEXT,
    "llmVersion" TEXT,
    "tokenLimit" INTEGER,
    "temperature" DOUBLE PRECISION,
    "transcriptionEngine" TEXT,
    "transcriptionVersion" TEXT,
    "keywords" TEXT,
    "bufferSize" INTEGER,
    "linearDelay" INTEGER,
    "endpointing" INTEGER,
    "ambientNoise" TEXT,
    "onlineCheckMessage" TEXT,
    "invokeAfterSeconds" INTEGER,
    "callProvider" TEXT,
    "callHangupLogic" TEXT,
    "callTerminationTime" INTEGER,
    "functionName" TEXT,
    "taskSummarization" BOOLEAN,
    "extractionEnabled" BOOLEAN,
    "webhookURL" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwilioNumber" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "phoneNumberLabel" TEXT NOT NULL,
    "accountSid" TEXT NOT NULL,
    "authToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "label" TEXT,

    CONSTRAINT "TwilioNumber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_uniqueId_key" ON "Agent"("uniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "TwilioNumber_phoneNumber_key" ON "TwilioNumber"("phoneNumber");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwilioNumber" ADD CONSTRAINT "TwilioNumber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
