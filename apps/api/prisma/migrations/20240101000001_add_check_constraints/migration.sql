-- CHECK constraints for data integrity

-- Payments: amounts must be non-negative
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_check" CHECK ("amount" >= 0);
ALTER TABLE "payments" ADD CONSTRAINT "payments_commission_check" CHECK ("commission" >= 0);
ALTER TABLE "payments" ADD CONSTRAINT "payments_professional_amount_check" CHECK ("professionalAmount" >= 0);
ALTER TABLE "payments" ADD CONSTRAINT "payments_commission_rate_check" CHECK ("commissionRate" >= 0 AND "commissionRate" <= 1);

-- Payment transactions: amount must be non-negative
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_amount_check" CHECK ("amount" >= 0);

-- Reviews: rating between 1 and 5
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_check" CHECK ("overallRating" >= 1 AND "overallRating" <= 5);

-- Ledger: amount must be positive
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_amount_check" CHECK ("amount" > 0);

-- Commission config: rate between 0 and 1
ALTER TABLE "commission_configs" ADD CONSTRAINT "commission_configs_rate_check" CHECK ("rate" >= 0 AND "rate" <= 1);

-- Professional stats: non-negative values
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_rating_check" CHECK ("averageRating" >= 0 AND "averageRating" <= 5);
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_experience_check" CHECK ("experienceYears" >= 0);

-- Bookings: total amount non-negative
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_total_amount_check" CHECK ("totalAmount" >= 0);

-- Quotes: costs non-negative
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_labor_cost_check" CHECK ("laborCost" >= 0);
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_total_amount_check" CHECK ("totalAmount" >= 0);
