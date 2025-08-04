-- Create the missing High Stakes Shop Purchases table
-- Run this in your Supabase SQL Editor to fix the shop purchase crashes

CREATE TABLE IF NOT EXISTS high_stakes_shop_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL CHECK (item_id IN ('autoClick', 'autoKeep', 'luckPotion', 'speedPotion')),
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, item_id)
);

-- Enable Row Level Security
ALTER TABLE high_stakes_shop_purchases ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can view their own shop purchases" ON high_stakes_shop_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shop purchases" ON high_stakes_shop_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shop purchases" ON high_stakes_shop_purchases
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shop purchases" ON high_stakes_shop_purchases
    FOR DELETE USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_shop_purchases_user_id ON high_stakes_shop_purchases(user_id); 