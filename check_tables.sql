-- Check the structure of the items table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'items';

-- Check the structure of the inventories table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'inventories';
