-- Keep historical data, but stop awarding points for new orders.
drop trigger if exists trg_award_loyalty_points on public.orders;
