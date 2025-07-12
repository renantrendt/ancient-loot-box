-- High Stakes Inventory Table for Supabase
-- This table stores separate inventory for High Stakes mode

CREATE TABLE IF NOT EXISTS high_stakes_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    item_count INTEGER DEFAULT 0,
    item_rarity TEXT NOT NULL CHECK (item_rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
    item_price INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, item_name)
);

-- High Stakes Mode State Table
-- This tracks if user is currently in High Stakes mode (for browser refresh persistence)
CREATE TABLE IF NOT EXISTS high_stakes_mode_state (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    is_high_stakes_mode BOOLEAN DEFAULT FALSE,
    normal_inventory_backup JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Row Level Security Policies
ALTER TABLE high_stakes_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE high_stakes_mode_state ENABLE ROW LEVEL SECURITY;

-- High Stakes Inventory Policies
CREATE POLICY "Users can view their own high stakes inventory" ON high_stakes_inventory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own high stakes inventory" ON high_stakes_inventory
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own high stakes inventory" ON high_stakes_inventory
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own high stakes inventory" ON high_stakes_inventory
    FOR DELETE USING (auth.uid() = user_id);

-- High Stakes Mode State Policies
CREATE POLICY "Users can view their own high stakes mode state" ON high_stakes_mode_state
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own high stakes mode state" ON high_stakes_mode_state
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own high stakes mode state" ON high_stakes_mode_state
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own high stakes mode state" ON high_stakes_mode_state
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_high_stakes_inventory_user_id ON high_stakes_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_high_stakes_inventory_item_name ON high_stakes_inventory(item_name);
CREATE INDEX IF NOT EXISTS idx_high_stakes_mode_state_user_id ON high_stakes_mode_state(user_id);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_high_stakes_inventory_updated_at BEFORE UPDATE ON high_stakes_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_high_stakes_mode_state_updated_at BEFORE UPDATE ON high_stakes_mode_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample queries for JavaScript integration:

-- Get user's high stakes inventory:
-- SELECT * FROM high_stakes_inventory WHERE user_id = $1 ORDER BY created_at DESC;

-- Upsert high stakes inventory item:
-- INSERT INTO high_stakes_inventory (user_id, item_name, item_count, item_rarity, item_price)
-- VALUES ($1, $2, $3, $4, $5)
-- ON CONFLICT (user_id, item_name) 
-- DO UPDATE SET item_count = $3, updated_at = NOW();

-- Get high stakes mode state:
-- SELECT * FROM high_stakes_mode_state WHERE user_id = $1;

-- Upsert high stakes mode state:
-- INSERT INTO high_stakes_mode_state (user_id, is_high_stakes_mode, normal_inventory_backup)
-- VALUES ($1, $2, $3)
-- ON CONFLICT (user_id) 
-- DO UPDATE SET is_high_stakes_mode = $2, normal_inventory_backup = $3, updated_at = NOW();

-- Clear high stakes inventory (when deleting items):
-- DELETE FROM high_stakes_inventory WHERE user_id = $1 AND item_name = $2;

-- Get inventory count for 10-item limit:
-- SELECT COUNT(*) as total_items FROM high_stakes_inventory WHERE user_id = $1 AND item_count > 0;

-- Get first item for deletion (evil mode):
-- SELECT item_name FROM high_stakes_inventory WHERE user_id = $1 AND item_count > 0 ORDER BY created_at ASC LIMIT 1; 