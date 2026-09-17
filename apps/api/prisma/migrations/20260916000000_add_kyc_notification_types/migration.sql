-- Add missing KYC notification types to NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE 'KYC_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'KYC_REJECTED';
