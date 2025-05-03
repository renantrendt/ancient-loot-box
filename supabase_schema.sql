-- SQL code for Supabase schema setup

-- Delete existing rows if needed (careful with this in production)
DELETE FROM inventories;
DELETE FROM items;

-- Create the items table if it doesn't exist
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name TEXT NOT NULL UNIQUE,
    item_image TEXT,
    price INTEGER NOT NULL,
    rarity TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the inventories table if it doesn't exist
CREATE TABLE IF NOT EXISTS inventories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    rarity TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_name)
);

-- Insert sample items data based on the items in script.js
INSERT INTO items (item_name, item_image, price, rarity) VALUES
-- Common items
('Wooden Sword', 'wooden-sword.png', 30, 'common'),
('Beer', 'images__2_-removebg-preview.png', 5, 'common'),

-- Rare items
('Sword', '92BKHNH_1__07640-removebg-preview.png', 100, 'rare'),
('Helmet', 'images__1_-removebg-preview.png', 250, 'rare'),

-- Epic items
('Shield', 's-l1200-removebg-preview.png', 300, 'epic'),
('Double Sword', '51G5FrtyUHL._AC_UF1000_1000_QL80_-removebg-preview.png', 270, 'epic'),
('Bomb', '8p5fq6br1mub1-removebg-preview.png', 1000, 'epic'),

-- Legendary items
('Shot Gun', 'Winchester-SXP-Field-Compact-20-Gauge-26-Barrel-Shotgun-048702004711_image1__23692-removebg-preview.png', 3000, 'legendary'),
('Machine Gun', 'PEO_M249_Para_ACOG-removebg-preview.png', 7000, 'legendary'),
('Scythe', 'scythe-removebg-preview.png', 30000, 'legendary'),
('Bazooka', 's-l400-removebg-preview.png', 13000, 'legendary'),
('Sniper Rifle', 'sniper.webp', 30000, 'legendary'),
('Heineken Pack', '10-104218_heineken-beer-bottles-6-pack-330ml-removebg-preview.png', 50, 'legendary'),

-- Mythic items
('N.U.K.E', 'NukeIcon.png', 1000000, 'mythic'),
('Diablo Sword', '2397813522-removebg-preview.png', 7000000, 'mythic');

-- Create RLS (Row Level Security) policies for the inventories table
-- This ensures users can only access their own inventory data
ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own inventory" ON inventories;
CREATE POLICY "Users can view their own inventory"
    ON inventories
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own inventory" ON inventories;
CREATE POLICY "Users can insert their own inventory"
    ON inventories
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own inventory" ON inventories;
CREATE POLICY "Users can update their own inventory"
    ON inventories
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own inventory" ON inventories;
CREATE POLICY "Users can delete their own inventory"
    ON inventories
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS for the items table (public read-only access)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view items" ON items;
CREATE POLICY "Anyone can view items"
    ON items
    FOR SELECT
    USING (true);
