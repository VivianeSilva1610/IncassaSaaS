-- Phase 1: swap the fixed-email RLS policies for real per-tenant isolation
-- by owner_id, now that every del_* table has one (0018). No visible
-- behavior change for Viviane: her existing rows' owner_id is already her
-- own auth.uid(), so this is a logical no-op for the single tenant that
-- exists today.

drop policy "del_owner_only" on del_ingredients;
create policy "del_owner_only" on del_ingredients for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy "del_owner_only" on del_products;
create policy "del_owner_only" on del_products for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy "del_owner_only" on del_orders;
create policy "del_owner_only" on del_orders for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy "del_owner_only" on del_stock_movements;
create policy "del_owner_only" on del_stock_movements for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy "del_owner_only" on del_order_items;
create policy "del_owner_only" on del_order_items for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy "del_owner_only" on del_product_ingredients;
create policy "del_owner_only" on del_product_ingredients for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy "del_owner_only" on del_daily_menu;
create policy "del_owner_only" on del_daily_menu for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy "del_owner_only" on del_fixed_costs;
create policy "del_owner_only" on del_fixed_costs for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- del_pricing_config and del_caixa_movimentos are handled separately:
-- pricing_config is still a fixed-id singleton (restructured in 0020),
-- and caixa_movimentos is schema-only/unused so converting it now would be
-- speculative — do it when that feature is actually built.
