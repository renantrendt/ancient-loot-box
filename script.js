// Define the items with their rarities and prices
const items = {
    common: [
        { name: "Wooden Sword", image: "wooden-sword.png", price: 30 },
        { name: "Beer", image: "images__2_-removebg-preview.png", price: 5 }
    ],
    rare: [
        { name: "Sword", image: "92BKHNH_1__07640-removebg-preview.png", price: 100 },
        { name: "Helmet", image: "images__1_-removebg-preview.png", price: 250 }
    ],
    epic: [
        { name: "Shield", image: "s-l1200-removebg-preview.png", price: 300 },
        { name: "Double Sword", image: "51G5FrtyUHL._AC_UF1000_1000_QL80_-removebg-preview.png", price: 270 },
        { name: "Bomb", image: "8p5fq6br1mub1-removebg-preview.png", price: 1000 }
    ],
    legendary: [
        { name: "Shot Gun", image: "Winchester-SXP-Field-Compact-20-Gauge-26-Barrel-Shotgun-048702004711_image1__23692-removebg-preview.png", price: 3000 },
        { name: "Machine Gun", image: "PEO_M249_Para_ACOG-removebg-preview.png", price: 7000 },
        { name: "Scythe", image: "scythe-removebg-preview.png", price: 30000 },
        { name: "Bazooka", image: "s-l400-removebg-preview.png", price: 13000 },
        { name: "Sniper Rifle", image: "sniper.webp", price: 30000 },
        { name: "Heineken Pack", image: "10-104218_heineken-beer-bottles-6-pack-330ml-removebg-preview.png", price: 50 }
    ],
    mythic: [
        { name: "N.U.K.E", image: "NukeIcon.png", price: 1000000 },
        { name: "Diablo Sword", image: "2397813522-removebg-preview.png", price: 7000000 }
    ]
};

// High Stakes pricing system
const highStakesPrices = {
    "Diablo Sword": 100000,  // 100K
    "N.U.K.E": 45000,        // 45K
    "Bazooka": 700,          // $700
    "Heineken Pack": 50,     // $50
    "Machine Gun": 578,      // $578
    "Scythe": 1000,          // 1K
    "Shot Gun": 400,         // $400
    "Sniper Rifle": 987,     // $987
    "Bomb": 100,             // $100
    "Double Sword": 200,     // $200
    "Shield": 240,           // $240
    "Helmet": 160,           // $160
    "Sword": 20,             // $20
    "Beer": 5,               // $5
    "Wooden Sword": 2        // $2
};

// Function to get item details by name
function getItemByName(name) {
    for (const rarity in items) {
        const found = items[rarity].find(item => item.name === name);
        if (found) return found;
    }
    return null;
}

// Define the drop rates for each rarity
const dropRates = {
    common: 0.70,
    rare: 0.50,
    epic: 0.30,
    legendary: 0.10,
    mythic: 0.01
};

// Define betting drop rates (half the normal rates)
const bettingDropRates = {
    common: 0.35,
    rare: 0.25,
    epic: 0.15,
    legendary: 0.05,
    mythic: 0.005
};

// High Stakes drop rates - same as normal except for mythic items
const highStakesDropRates = {
    common: 0.70,
    rare: 0.50,
    epic: 0.30,
    legendary: 0.10,
    mythic: 0.01
};

// Special mythic item rates for High Stakes mode
const mythicItemRates = {
    "Diablo Sword": 0.00002,  // 0.002% chance (0.002 / 100)
    "N.U.K.E": 0.00087       // 0.087% chance (0.087 / 100)
};

// Track consecutive losses
let consecutiveLosses = 0;

// Initialize inventory
let inventory = JSON.parse(localStorage.getItem('lootBoxInventory')) || {};

// High Stakes Mode State
let isHighStakesMode = false;
let highStakesInventory = {};
let normalInventoryBackup = {};
// Removed currentSpinningItems - now generating truly random items each time
let spinningAnimation = null;

// Shop System
const shopItems = {
    autoClick: {
        name: "Auto Click",
        price: 1300,
        description: "Automatically opens loot boxes every 8 seconds (after each roll completes)",
        purchased: false
    },
    autoKeep: {
        name: "Auto Keep",
        price: 1600,
        description: "Automatically keeps/deletes items based on your preferences",
        purchased: false
    }
};

// Auto Keep Settings - default all items to false (don't auto keep)
let autoKeepSettings = {};
// Initialize with all items set to false
Object.values(items).flat().forEach(item => {
    autoKeepSettings[item.name] = false;
});

// Shop purchase states
let shopPurchases = JSON.parse(localStorage.getItem('highStakesShopPurchases')) || {};

// Auto clicker for High Stakes mode
let highStakesAutoClickerInterval = null;
let isHighStakesAutoClickerActive = false;

// DOM elements
const lootBox = document.getElementById('loot-box');
const openBoxBtn = document.getElementById('open-box-btn');
const itemResult = document.getElementById('item-result');
const itemName = document.getElementById('item-name');
const itemRarity = document.getElementById('item-rarity');
const itemImage = document.getElementById('item-image');
const inventoryList = document.getElementById('inventory-list');
const epicOverlay = document.getElementById('epic-overlay');

// Function to determine if an item drops based on its rarity
function doesItemDrop(rarity, isBetting = false) {
    const rates = isBetting ? bettingDropRates : dropRates;
    return Math.random() < rates[rarity];
}

// Function to select a random item from a given array
function getRandomItem(itemArray) {
    const randomIndex = Math.floor(Math.random() * itemArray.length);
    return itemArray[randomIndex];
}

// Function to format price with K, M, B, T, Q, etc. for larger denominations - FIXED to handle NaN
function formatPrice(price) {
    // Handle invalid inputs (NaN, undefined, null, etc.)
    if (price == null || typeof price !== 'number' || isNaN(price)) {
        return '0$';
    }
    
    // Handle negative numbers
    if (price < 0) {
        return '0$';
    }
    
    // Define the suffixes for different scales
    const suffixes = ['', 'K', 'M', 'B', 'T', 'Q', 'Qi', 'S', 'Se', 'O', 'N', 'D'];
    
    // If price is less than 1000, just return it with $ sign
    if (price < 1000) {
        return Math.floor(price) + '$';
    }
    
    // Calculate the suffix index based on the number of thousands
    // Math.floor(Math.log10(price) / 3) gives us how many powers of 1000 are in the number
    const suffixIndex = Math.min(Math.floor(Math.log10(Math.abs(price)) / 3), suffixes.length - 1);
    
    // Calculate the scaled value (divided by the appropriate power of 1000)
    const scaledValue = price / Math.pow(1000, suffixIndex);
    
    // Format the number with appropriate precision
    // For very large numbers, we want to avoid showing things like 2777.8B$
    // and instead show 2.8T$
    if (scaledValue >= 1000) {
        // If the scaled value is >= 1000, we should use the next suffix up
        // For example, 2777.8B$ should be 2.8T$
        const nextSuffixIndex = Math.min(suffixIndex + 1, suffixes.length - 1);
        const nextScaledValue = price / Math.pow(1000, nextSuffixIndex);
        const formatted = nextScaledValue.toFixed(1);
        return formatted + suffixes[nextSuffixIndex] + '$';
    }
    
    // Return the formatted string with 1 decimal place and the appropriate suffix
    const formatted = scaledValue.toFixed(1);
    return formatted + suffixes[suffixIndex] + '$';
}

// Function to get a random item based on rarity chances
function getRandomLoot(isBetting = false) {
    // Check each rarity from highest to lowest
    if (doesItemDrop('mythic', isBetting)) {
        return { item: getRandomItem(items.mythic), rarity: 'mythic' };
    } else if (doesItemDrop('legendary', isBetting)) {
        return { item: getRandomItem(items.legendary), rarity: 'legendary' };
    } else if (doesItemDrop('epic', isBetting)) {
        return { item: getRandomItem(items.epic), rarity: 'epic' };
    } else if (doesItemDrop('rare', isBetting)) {
        return { item: getRandomItem(items.rare), rarity: 'rare' };
    } else {
        // Default to common if nothing else drops
        return { item: getRandomItem(items.common), rarity: 'common' };
    }
}

// High Stakes loot generation with special mythic rates (for weighted spinning line)
function getHighStakesWeightedItem() {
    // First check if we hit the special mythic item rates
    const rand = Math.random();
    
    if (rand < mythicItemRates["Diablo Sword"]) {
        return items.mythic.find(item => item.name === "Diablo Sword");
    } else if (rand < mythicItemRates["Diablo Sword"] + mythicItemRates["N.U.K.E"]) {
        return items.mythic.find(item => item.name === "N.U.K.E");
    }
    
    // Use the regular weighted item generation for visual consistency
    return getWeightedRandomItem();
}

// Function to add item to inventory
async function addToInventory(itemName, rarity, count = 1) {
    console.log(`addToInventory called with count: ${count}`);
    // Ensure count is a number
    count = parseInt(count, 10);
    if (isNaN(count) || count < 1) count = 1;
    
    if (!inventory[itemName]) {
        const itemDetails = getItemByName(itemName);
        // Use High Stakes pricing if in High Stakes mode
        const price = isHighStakesMode ? 
            (highStakesPrices[itemName] || 0) : 
            (itemDetails ? itemDetails.price : 0);
        
        inventory[itemName] = { 
            count: 0, 
            rarity: rarity,
            price: price
        };
    }
    
    // Add the items
    inventory[itemName].count += count;
    console.log(`Inventory count for ${itemName} is now: ${inventory[itemName].count}`);
    
    // Save to local storage
    if (isHighStakesMode) {
        localStorage.setItem('highStakesInventory', JSON.stringify(inventory));
    } else {
        localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
    }
    
    // Save to Supabase if user is logged in
    if (window.currentUser) {
        try {
            if (isHighStakesMode) {
                await window.saveHighStakesInventoryToSupabase(window.currentUser.id, inventory);
                console.log('High Stakes inventory saved to Supabase');
            } else {
                await window.saveInventoryToSupabase(window.currentUser.id, inventory);
                console.log('Regular inventory saved to Supabase');
            }
        } catch (error) {
            console.error('Error saving inventory to Supabase:', error);
        }
    }
    
    // Update the inventory display
    updateInventoryDisplay();
}

// Function to calculate total inventory value - fixed to prevent doubling AND handle NaN values
function calculateTotalInventoryValue() {
    // Reset the total value
    let totalValue = 0;
    
    // Loop through each item in the inventory only once
    for (const [name, data] of Object.entries(inventory)) {
        // Skip items with invalid data (NaN counts, etc.)
        if (!data || typeof data.count !== 'number' || isNaN(data.count) || data.count < 0) {
            console.warn(`Skipping invalid inventory item: ${name}`, data);
            continue;
        }
        
        // Get the item details and price based on mode
        const itemDetails = getItemByName(name);
        if (!itemDetails) {
            console.warn(`Item not found in game data: ${name}`);
            continue;
        }
        
        // Use High Stakes pricing if in High Stakes mode
        const itemPrice = isHighStakesMode ? 
            (highStakesPrices[name] || 0) : 
            itemDetails.price;
        
        // Make sure price is a valid number
        const validPrice = (typeof itemPrice === 'number' && !isNaN(itemPrice)) ? itemPrice : 0;
        
        // Add the item's value to the total (price × count)
        const itemTotalValue = validPrice * data.count;
        
        // Only add if the result is a valid number
        if (typeof itemTotalValue === 'number' && !isNaN(itemTotalValue)) {
            totalValue += itemTotalValue;
        }
    }
    
    // Return 0 if somehow totalValue became NaN
    return (typeof totalValue === 'number' && !isNaN(totalValue)) ? totalValue : 0;
}

// Function to update the inventory display
function updateInventoryDisplay() {
    inventoryList.innerHTML = '';
    
    // Clean up any invalid inventory items before displaying
    for (const [name, data] of Object.entries(inventory)) {
        if (!data || typeof data.count !== 'number' || isNaN(data.count) || data.count <= 0) {
            console.warn(`Removing invalid inventory item: ${name}`, data);
            delete inventory[name];
        }
    }
    
    // Sort items by rarity (mythic first, common last)
    const rarityOrder = { 'mythic': 0, 'legendary': 1, 'epic': 2, 'rare': 3, 'common': 4 };
    
    const sortedItems = Object.entries(inventory).sort((a, b) => {
        // First sort by rarity
        const rarityDiff = rarityOrder[a[1].rarity] - rarityOrder[b[1].rarity];
        if (rarityDiff !== 0) return rarityDiff;
        
        // Then sort alphabetically
        return a[0].localeCompare(b[0]);
    });
    
    // Get the total inventory value once
    const totalValue = calculateTotalInventoryValue();
    
    sortedItems.forEach(([name, data]) => {
        const li = document.createElement('li');
        
        // Make sure mythic items get the proper CSS class
        const validRarity = data.rarity || 'common';
        li.classList.add(validRarity);
        
        const itemIcon = document.createElement('div');
        itemIcon.classList.add('item-icon');
        
        // Fix for undefined rarity - safely access the items array
        let imageUrl = 'default.png';
        try {
            // First try to get the item from its declared rarity
            if (items[validRarity] && Array.isArray(items[validRarity])) {
                const foundItem = items[validRarity].find(item => item.name === name);
                if (foundItem && foundItem.image) {
                    imageUrl = foundItem.image;
                }
            }
            
            // If that fails, search through all rarities
            if (imageUrl === 'default.png') {
                for (const rarity in items) {
                    if (Array.isArray(items[rarity])) {
                        const foundItem = items[rarity].find(item => item.name === name);
                        if (foundItem && foundItem.image) {
                            imageUrl = foundItem.image;
                            // Update the item's rarity if it was wrong
                            if (data.rarity !== rarity) {
                                console.log(`Fixed rarity for ${name}: ${data.rarity} -> ${rarity}`);
                                data.rarity = rarity;
                                li.classList.remove(validRarity);
                                li.classList.add(rarity);
                            }
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error finding item image:', error);
            // Fall back to default image
        }
        
        // Check if the image path needs 'images/' prefix
        if (!imageUrl.startsWith('images/') && !imageUrl.includes('/')) {
            imageUrl = 'images/' + imageUrl;
        }
        
        itemIcon.style.backgroundImage = `url('${imageUrl}')`;
        
        // Get item price - use High Stakes pricing if in High Stakes mode
        const itemDetails = getItemByName(name);
        const itemPrice = isHighStakesMode ? 
            (highStakesPrices[name] || 0) : 
            (itemDetails ? itemDetails.price : 0);
        
        // Create item details container
        const itemDetailsDiv = document.createElement('div');
        itemDetailsDiv.classList.add('item-details');
        
        // Create item name element
        const itemName = document.createElement('span');
        itemName.classList.add('item-name');
        itemName.textContent = `${name} x${data.count}`;
        
        // Create item price element
        const itemPriceElement = document.createElement('span');
        itemPriceElement.classList.add('item-price');
        
        // Calculate total price safely
        const totalItemPrice = (typeof itemPrice === 'number' && !isNaN(itemPrice)) ? itemPrice * data.count : 0;
        
        itemPriceElement.textContent = `${formatPrice(itemPrice)} ${data.count > 1 ? `(Total: ${formatPrice(totalItemPrice)})` : ''}`;
        
        // Append elements
        itemDetailsDiv.appendChild(itemName);
        itemDetailsDiv.appendChild(itemPriceElement);
        
        li.appendChild(itemIcon);
        li.appendChild(itemDetailsDiv);
        inventoryList.appendChild(li);
    });
    
    // Add total inventory value at the top
    if (sortedItems.length > 0) {
        const totalValueElement = document.createElement('div');
        totalValueElement.className = 'total-value';
        totalValueElement.innerHTML = `Total Inventory Value: <span>${formatPrice(totalValue)}</span>`;
        inventoryList.insertBefore(totalValueElement, inventoryList.firstChild);
    }
}

// Simple function to directly add items for testing
async function addItemDirectly(itemName, rarity, count) {
    console.log(`addItemDirectly called with count: ${count}`);
    // Ensure count is a number
    count = parseInt(count, 10);
    if (isNaN(count) || count < 1) count = 1;
    
    // Add items directly with the count parameter
    await addToInventory(itemName, rarity, count);
    console.log(`Added ${count} ${itemName}(s) to your inventory!`);
}

// Function to remove items from inventory
async function removeItem(itemName, count = 1) {
    // Check if the item exists in inventory
    if (!inventory[itemName]) {
        console.log(`Error: ${itemName} not found in inventory`);
        return false;
    }
    
    // Check if we have enough of the item
    if (inventory[itemName].count < count) {
        console.log(`Error: Not enough ${itemName} in inventory. You have ${inventory[itemName].count} but tried to remove ${count}`);
        return false;
    }
    
    // Remove the items
    inventory[itemName].count -= count;
    
    // If count reaches 0, remove the item entirely
    if (inventory[itemName].count <= 0) {
        delete inventory[itemName];
    }
    
    // Save to local storage
    if (isHighStakesMode) {
        localStorage.setItem('highStakesInventory', JSON.stringify(inventory));
    } else {
        localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
    }
    
    // Save to Supabase if user is logged in
    if (window.currentUser) {
        try {
            if (isHighStakesMode) {
                await window.saveHighStakesInventoryToSupabase(window.currentUser.id, inventory);
                console.log('High Stakes inventory saved to Supabase after removal');
            } else {
                await window.saveInventoryToSupabase(window.currentUser.id, inventory);
                console.log('Regular inventory saved to Supabase after removal');
            }
        } catch (error) {
            console.error('Error saving inventory to Supabase after removal:', error);
        }
    }
    
    // Update the inventory display
    updateInventoryDisplay();
    
    console.log(`Successfully removed ${count} ${itemName}(s) from your inventory`);
    return true;
}

// Make functions available in the global scope for console use
window.removeItem = removeItem;

// Create a FIXED global console object that actually fucking works
window.lootBoxConsole = {
    // Fixed removeItem - takes itemName and count (no rarity needed for removal)
    removeItem: async function(itemName, count = 1) {
        // Convert count to number and validate
        count = parseInt(count, 10);
        if (isNaN(count) || count < 1) {
            console.log(`Error: Invalid count '${count}' - must be a positive number`);
            return false;
        }
        
        // Check if the item exists in inventory
        if (!inventory[itemName]) {
            console.log(`Error: ${itemName} not found in inventory`);
            return false;
        }
        
        // Check if we have enough of the item
        if (inventory[itemName].count < count) {
            console.log(`Error: Not enough ${itemName} in inventory. You have ${inventory[itemName].count} but tried to remove ${count}`);
            return false;
        }
        
        // Remove the items
        inventory[itemName].count -= count;
        
        // If count reaches 0, remove the item entirely
        if (inventory[itemName].count <= 0) {
            delete inventory[itemName];
        }
        
        // Save to appropriate storage
        if (isHighStakesMode) {
            localStorage.setItem('highStakesInventory', JSON.stringify(inventory));
        } else {
            localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
        }
        
        // 🔥 ALSO SAVE TO SUPABASE if user is logged in
        if (window.currentUser) {
            try {
                if (isHighStakesMode) {
                    await window.saveHighStakesInventoryToSupabase(window.currentUser.id, inventory);
                    console.log('💾 Console removal saved to Supabase (High Stakes)');
                } else {
                    await window.saveInventoryToSupabase(window.currentUser.id, inventory);
                    console.log('💾 Console removal saved to Supabase (Normal)');
                }
            } catch (error) {
                console.error('❌ Error saving console removal to Supabase:', error);
            }
        }
        
        // Update the inventory display
        updateInventoryDisplay();
        
        console.log(`✅ Successfully removed ${count} ${itemName}(s) from your inventory`);
        return true;
    },
    
    // Fixed addItem - properly adds items with correct count and rarity
    addItem: async function(itemName, rarity, count = 1) {
        // Convert count to number and validate
        count = parseInt(count, 10);
        if (isNaN(count) || count < 1) {
            console.log(`Error: Invalid count '${count}' - must be a positive number`);
            return false;
        }
        
        // Validate rarity
        const validRarities = ['common', 'rare', 'epic', 'legendary', 'mythic'];
        if (!validRarities.includes(rarity)) {
            console.log(`Error: Invalid rarity '${rarity}' - must be one of: ${validRarities.join(', ')}`);
            return false;
        }
        
        // Check if item exists in game data
        const itemDetails = getItemByName(itemName);
        if (!itemDetails) {
            console.log(`Error: Item '${itemName}' not found in game data`);
            return false;
        }
        
        // Add to inventory - create new entry if doesn't exist
        if (!inventory[itemName]) {
            // Use High Stakes pricing if in High Stakes mode
            const price = isHighStakesMode ? 
                (highStakesPrices[itemName] || 0) : 
                itemDetails.price;
            
            inventory[itemName] = { 
                count: 0, 
                rarity: rarity,
                price: price
            };
        }
        
        // Add the items
        inventory[itemName].count += count;
        
        // Save to appropriate storage
        if (isHighStakesMode) {
            localStorage.setItem('highStakesInventory', JSON.stringify(inventory));
        } else {
            localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
        }
        
        // 🔥 ALSO SAVE TO SUPABASE if user is logged in
        if (window.currentUser) {
            try {
                if (isHighStakesMode) {
                    await window.saveHighStakesInventoryToSupabase(window.currentUser.id, inventory);
                    console.log('💾 Console addition saved to Supabase (High Stakes)');
                } else {
                    await window.saveInventoryToSupabase(window.currentUser.id, inventory);
                    console.log('💾 Console addition saved to Supabase (Normal)');
                }
            } catch (error) {
                console.error('❌ Error saving console addition to Supabase:', error);
            }
        }
        
        // Update the inventory display
        updateInventoryDisplay();
        
        console.log(`✅ Successfully added ${count} ${itemName}(s) to your inventory`);
        return true;
    },
    
    // Fixed clearInventory
    clearInventory: async function() {
        inventory = {};
        
        if (isHighStakesMode) {
            localStorage.setItem('highStakesInventory', JSON.stringify(inventory));
        } else {
            localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
        }
        
        // 🔥 ALSO SAVE TO SUPABASE if user is logged in
        if (window.currentUser) {
            try {
                if (isHighStakesMode) {
                    await window.saveHighStakesInventoryToSupabase(window.currentUser.id, inventory);
                    console.log('💾 Console inventory clear saved to Supabase (High Stakes)');
                } else {
                    await window.saveInventoryToSupabase(window.currentUser.id, inventory);
                    console.log('💾 Console inventory clear saved to Supabase (Normal)');
                }
            } catch (error) {
                console.error('❌ Error saving console clear to Supabase:', error);
            }
        }
        
        updateInventoryDisplay();
        console.log('✅ Inventory cleared');
        return true;
    },
    
    // Bonus: Add a debug function to show inventory info
    debug: function() {
        console.log('🔍 INVENTORY DEBUG INFO:');
        console.log('High Stakes Mode:', isHighStakesMode);
        console.log('Current User:', window.currentUser ? window.currentUser.email : 'Not logged in');
        console.log('Current Inventory:', inventory);
        console.log('Item Count:', Object.keys(inventory).length);
        
        // Show inventory value
        const totalValue = calculateTotalInventoryValue();
        console.log('Total Value:', formatPrice(totalValue));
        
        // Show each item
        Object.entries(inventory).forEach(([name, data]) => {
            console.log(`- ${name}: ${data.count}x (${data.rarity}) - ${formatPrice((isHighStakesMode ? highStakesPrices[name] : getItemByName(name)?.price) || 0)}`);
        });
        
        return true;
    },
    
    // NEW: Debug function to test Supabase shop purchases
    testShopSync: async function() {
        console.log('🛒 [TEST] Testing Supabase shop purchases...');
        
        if (!window.currentUser) {
            console.log('🛒 [TEST] ❌ No user logged in - cannot test Supabase');
            return false;
        }
        
        console.log(`🛒 [TEST] Testing with user: ${window.currentUser.email}`);
        
        try {
            // Test loading shop purchases
            console.log('🛒 [TEST] Testing loadShopPurchasesFromSupabase...');
            const purchases = await window.loadShopPurchasesFromSupabase(window.currentUser.id);
            console.log('🛒 [TEST] ✅ Load successful:', purchases);
            
            // Test checking specific item
            console.log('🛒 [TEST] Testing checkShopPurchaseFromSupabase for autoClick...');
            const hasAutoClick = await window.checkShopPurchaseFromSupabase(window.currentUser.id, 'autoClick');
            console.log('🛒 [TEST] ✅ Check successful - has autoClick:', hasAutoClick);
            
            console.log('🛒 [TEST] ✅ All Supabase shop functions working!');
            return true;
            
        } catch (error) {
            console.error('🛒 [TEST] ❌ Supabase shop purchases BROKEN:', error);
            console.error('🛒 [TEST] Error details:', {
                message: error.message,
                code: error.code,
                details: error.details
            });
            
            // Check if it's a table missing error
            if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
                console.error('🛒 [TEST] 💥 TABLE MISSING: high_stakes_shop_purchases table does not exist!');
                console.error('🛒 [TEST] 💡 You need to run the SQL to create the table in Supabase');
            }
            
            return false;
        }
    },
    
    // NEW: Force sync local purchases to Supabase
    fixShopSync: async function() {
        console.log('🛒 [SYNC] Starting manual shop purchase sync...');
        
        if (!window.currentUser) {
            console.log('🛒 [SYNC] ❌ No user logged in - cannot sync to Supabase');
            return false;
        }
        
        const localPurchases = JSON.parse(localStorage.getItem('highStakesShopPurchases')) || {};
        console.log('🛒 [SYNC] Local purchases to sync:', Object.keys(localPurchases));
        
        if (Object.keys(localPurchases).length === 0) {
            console.log('🛒 [SYNC] No local purchases to sync');
            return true;
        }
        
        let syncSuccess = true;
        
        for (const [itemId, purchased] of Object.entries(localPurchases)) {
            if (purchased) {
                try {
                    console.log(`🛒 [SYNC] Syncing ${itemId} to Supabase...`);
                    await window.saveShopPurchaseToSupabase(window.currentUser.id, itemId);
                    console.log(`🛒 [SYNC] ✅ ${itemId} synced successfully`);
                } catch (error) {
                    console.error(`🛒 [SYNC] ❌ Failed to sync ${itemId}:`, error);
                    syncSuccess = false;
                }
            }
        }
        
        if (syncSuccess) {
            console.log('🛒 [SYNC] ✅ All purchases synced successfully!');
        } else {
            console.log('🛒 [SYNC] ⚠️ Some purchases failed to sync');
        }
        
        return syncSuccess;
    },
    
    // NEW: Debug button functionality
    debugButtons: function() {
        console.log('🔧 [BUTTON DEBUG] Checking button states...');
        
        // Check auto clicker
        console.log('🔄 Auto Clicker Active:', isAutoClickerActive);
        console.log('🔄 Auto Clicker Interval:', autoClickerInterval);
        console.log('🔄 High Stakes Auto Active:', isHighStakesAutoClickerActive); 
        console.log('🔄 High Stakes Auto Interval:', highStakesAutoClickerInterval);
        
        // Check button elements
        const autoBtn = document.getElementById('auto-clicker-btn');
        const highStakesBtn = document.getElementById('high-stakes-btn');
        const loginBtn = document.getElementById('login-button');
        const logoutBtn = document.getElementById('logout-button');
        
        console.log('🔧 Auto Clicker Button:', autoBtn ? 'EXISTS' : 'MISSING');
        console.log('🔧 High Stakes Button:', highStakesBtn ? 'EXISTS' : 'MISSING');
        console.log('🔧 Login Button:', loginBtn ? 'EXISTS' : 'MISSING');
        console.log('🔧 Logout Button:', logoutBtn ? 'EXISTS' : 'MISSING');
        
        // Try to refresh listeners
        console.log('🔧 Refreshing button listeners...');
        if (window.setupButtonListeners) {
            window.setupButtonListeners();
            console.log('✅ Button listeners refreshed');
        } else {
            console.log('❌ setupButtonListeners not available');
        }
        
        return true;
    }
};

// Create a simpler global variable for console use
window.removeItems = async function(itemName, count = 1) {
    return await window.lootBoxConsole.removeItem(itemName, count);
};

window.addItems = async function(itemName, rarity, count = 1) {
    return await window.lootBoxConsole.addItem(itemName, rarity, count);
};

window.clearItems = async function() {
    return await window.lootBoxConsole.clearInventory();
};

// Simple clear() command
window.clear = async function() {
    return await window.lootBoxConsole.clearInventory();
};

// Create FIXED lootBoxItem object with proper rmItem method
window.lootBoxItem = {
    rmItem: async function(itemName, rarity, amount = 1) {
        // NOTE: rarity parameter is ignored for removal (only needed for adding)
        return await window.lootBoxConsole.removeItem(itemName, amount);
    }
};

// Debounce mechanism to prevent duplicate calls
let isConversionInProgress = false;

// Function to handle conversions - simplified approach
async function handleConversion(itemType, amount) {
    // Prevent duplicate calls
    if (isConversionInProgress) {
        console.log('Conversion already in progress, ignoring duplicate call');
        return;
    }
    
    // Set flag to prevent duplicate calls
    isConversionInProgress = true;
    
    // Reset the flag after a short delay
    setTimeout(() => {
        isConversionInProgress = false;
    }, 500);
    
    // Simple direct conversions
    if (itemType === 'helmet') {
        // Check if we have enough helmets
        if (inventory['Helmet'] && inventory['Helmet'].count >= 10) {
            // Remove helmets
            inventory['Helmet'].count -= 10;
            
            // Add scythe
            if (!inventory['Scythe']) {
                inventory['Scythe'] = { count: 0, rarity: 'epic' };
            }
            inventory['Scythe'].count += 1;
            
            // Save and update
            if (isHighStakesMode) {
                localStorage.setItem('highStakesInventory', JSON.stringify(inventory));
            } else {
                localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
            }
            
            // Save to Supabase if user is logged in
            if (window.currentUser) {
                try {
                    if (isHighStakesMode) {
                        await window.saveHighStakesInventoryToSupabase(window.currentUser.id, inventory);
                    } else {
                        await window.saveInventoryToSupabase(window.currentUser.id, inventory);
                    }
                    console.log('Conversion inventory saved to Supabase');
                } catch (error) {
                    console.error('Error saving conversion inventory to Supabase:', error);
                }
            }
            
            updateInventoryDisplay();
            alert('Conversion successful! You received 1 Scythe');
            return;
        }
    } 
    else if (itemType === 'bomb') {
        if (inventory['Bomb'] && inventory['Bomb'].count >= 30) {
            inventory['Bomb'].count -= 30;
            if (!inventory['N.U.K.E']) {
                inventory['N.U.K.E'] = { count: 0, rarity: 'mythic' };
            }
            inventory['N.U.K.E'].count += 1;
            if (isHighStakesMode) {
                localStorage.setItem('highStakesInventory', JSON.stringify(inventory));
            } else {
                localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
            }
            
            if (window.currentUser) {
                try {
                    if (isHighStakesMode) {
                        await window.saveHighStakesInventoryToSupabase(window.currentUser.id, inventory);
                    } else {
                        await window.saveInventoryToSupabase(window.currentUser.id, inventory);
                    }
                } catch (error) {
                    console.error('Error saving conversion inventory to Supabase:', error);
                }
            }
            
            updateInventoryDisplay();
            alert('Conversion successful! You received 1 N.U.K.E');
            return;
        }
    }
    else if (itemType === 'beer') {
        if (inventory['Beer'] && inventory['Beer'].count >= 24) {
            inventory['Beer'].count -= 24;
            if (!inventory['Heineken Pack']) {
                inventory['Heineken Pack'] = { count: 0, rarity: 'legendary' };
            }
            inventory['Heineken Pack'].count += 1;
            if (isHighStakesMode) {
                localStorage.setItem('highStakesInventory', JSON.stringify(inventory));
            } else {
                localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
            }
            
            if (window.currentUser) {
                try {
                    if (isHighStakesMode) {
                        await window.saveHighStakesInventoryToSupabase(window.currentUser.id, inventory);
                    } else {
                        await window.saveInventoryToSupabase(window.currentUser.id, inventory);
                    }
                } catch (error) {
                    console.error('Error saving conversion inventory to Supabase:', error);
                }
            }
            
            updateInventoryDisplay();
            alert('Conversion successful! You received 1 Heineken Pack');
            return;
        }
    }
    else if (itemType === 'sword') {
        if (inventory['Sword'] && inventory['Sword'].count >= 10) {
            inventory['Sword'].count -= 10;
            if (!inventory['Double Sword']) {
                inventory['Double Sword'] = { count: 0, rarity: 'epic' };
            }
            inventory['Double Sword'].count += 5;
            if (isHighStakesMode) {
                localStorage.setItem('highStakesInventory', JSON.stringify(inventory));
            } else {
                localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
            }
            
            if (window.currentUser) {
                try {
                    if (isHighStakesMode) {
                        await window.saveHighStakesInventoryToSupabase(window.currentUser.id, inventory);
                    } else {
                        await window.saveInventoryToSupabase(window.currentUser.id, inventory);
                    }
                } catch (error) {
                    console.error('Error saving conversion inventory to Supabase:', error);
                }
            }
            
            updateInventoryDisplay();
            alert('Conversion successful! You received 5 Double Swords');
            return;
        }
    }
    else if (itemType === 'double-sword') {
        if (inventory['Double Sword'] && inventory['Double Sword'].count >= 30) {
            inventory['Double Sword'].count -= 30;
            if (!inventory['Diablo Sword']) {
                inventory['Diablo Sword'] = { count: 0, rarity: 'mythic' };
            }
            inventory['Diablo Sword'].count += 1;
            if (isHighStakesMode) {
                localStorage.setItem('highStakesInventory', JSON.stringify(inventory));
            } else {
                localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
            }
            
            if (window.currentUser) {
                try {
                    if (isHighStakesMode) {
                        await window.saveHighStakesInventoryToSupabase(window.currentUser.id, inventory);
                    } else {
                        await window.saveInventoryToSupabase(window.currentUser.id, inventory);
                    }
                } catch (error) {
                    console.error('Error saving conversion inventory to Supabase:', error);
                }
            }
            
            updateInventoryDisplay();
            alert('Conversion successful! You received 1 Diablo Sword');
            return;
        }
    }
    else if (itemType === 'sniper-rifle') {
        if (inventory['Sniper Rifle'] && inventory['Sniper Rifle'].count >= 4) {
            inventory['Sniper Rifle'].count -= 4;
            if (!inventory['Bazooka']) {
                inventory['Bazooka'] = { count: 0, rarity: 'legendary' };
            }
            inventory['Bazooka'].count += 1;
            if (isHighStakesMode) {
                localStorage.setItem('highStakesInventory', JSON.stringify(inventory));
            } else {
                localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
            }
            
            if (window.currentUser) {
                try {
                    if (isHighStakesMode) {
                        await window.saveHighStakesInventoryToSupabase(window.currentUser.id, inventory);
                    } else {
                        await window.saveInventoryToSupabase(window.currentUser.id, inventory);
                    }
                } catch (error) {
                    console.error('Error saving conversion inventory to Supabase:', error);
                }
            }
            
            updateInventoryDisplay();
            alert('Conversion successful! You received 1 Bazooka');
            return;
        }
    }
    else if (itemType === 'shotgun') {
        if (inventory['Shot Gun'] && inventory['Shot Gun'].count >= 2) {
            inventory['Shot Gun'].count -= 2;
            if (!inventory['Machine Gun']) {
                inventory['Machine Gun'] = { count: 0, rarity: 'legendary' };
            }
            inventory['Machine Gun'].count += 1;
            if (isHighStakesMode) {
                localStorage.setItem('highStakesInventory', JSON.stringify(inventory));
            } else {
                localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
            }
            
            if (window.currentUser) {
                try {
                    if (isHighStakesMode) {
                        await window.saveHighStakesInventoryToSupabase(window.currentUser.id, inventory);
                    } else {
                        await window.saveInventoryToSupabase(window.currentUser.id, inventory);
                    }
                } catch (error) {
                    console.error('Error saving conversion inventory to Supabase:', error);
                }
            }
            
            updateInventoryDisplay();
            alert('Conversion successful! You received 1 Machine Gun');
            return;
        }
    }
    
    // If we get here, the conversion failed
    alert('Sorry, you are not rich enough :(');
}

// Auto Clicker functionality with better interval management
let autoClickerInterval = null;
let isAutoClickerActive = false;

function toggleAutoClicker() {
    const autoClickerBtn = document.getElementById('auto-clicker-btn');
    
    console.log('🔄 [AUTO CLICKER] Toggle called, current state:', isAutoClickerActive);
    
    if (isAutoClickerActive) {
        // Stop auto clicker
        if (autoClickerInterval) {
            clearInterval(autoClickerInterval);
            autoClickerInterval = null;
            console.log('🔄 [AUTO CLICKER] Interval cleared');
        }
        
        if (autoClickerBtn) {
            autoClickerBtn.textContent = 'Auto Clicker';
            autoClickerBtn.classList.remove('active');
        }
        
        isAutoClickerActive = false;
        console.log('🔄 [AUTO CLICKER] Stopped');
    } else {
        // Start auto clicker - open a loot box every 2.5 seconds in normal mode
        autoClickerInterval = setInterval(() => {
            console.log('🔄 [AUTO CLICKER] Tick - attempting click');
            const openBoxBtn = document.getElementById('open-box-btn');
            if (openBoxBtn && !openBoxBtn.disabled && !isHighStakesMode) {
                console.log('🔄 [AUTO CLICKER] Clicking open box button');
                openBoxBtn.click();
            } else {
                console.log('🔄 [AUTO CLICKER] Cannot click - button disabled or High Stakes mode');
            }
        }, 2500);
        
        if (autoClickerBtn) {
            autoClickerBtn.textContent = 'Stop Auto Clicker';
            autoClickerBtn.classList.add('active');
        }
        
        isAutoClickerActive = true;
        console.log('🔄 [AUTO CLICKER] Started with interval ID:', autoClickerInterval);
    }
}

// High Stakes Mode Functions
function toggleHighStakesMode() {
    console.log('toggleHighStakesMode called, isHighStakesMode:', isHighStakesMode);
    if (isHighStakesMode) {
        exitHighStakesMode();
    } else {
        enterHighStakesMode();
    }
}

async function enterHighStakesMode() {
    console.log('🎰 ENTERING HIGH STAKES MODE 🎰');
    console.log('Current inventory before switch:', Object.keys(inventory).length, 'items');
    
    isHighStakesMode = true;
    
    // Backup normal inventory
    normalInventoryBackup = JSON.parse(JSON.stringify(inventory));
    window.normalInventoryBackup = normalInventoryBackup;
    console.log('✅ Normal inventory backed up:', Object.keys(normalInventoryBackup).length, 'items');
    
    // Load High Stakes inventory from Supabase if user is logged in
    if (window.currentUser) {
        try {
            console.log('🔄 Loading High Stakes inventory from Supabase...');
            const supabaseInventory = await window.loadHighStakesInventoryFromSupabase(window.currentUser.id);
            console.log('📦 Supabase returned:', supabaseInventory);
            
            if (supabaseInventory && Object.keys(supabaseInventory).length > 0) {
                // User has existing High Stakes inventory
                highStakesInventory = supabaseInventory;
                inventory = highStakesInventory;
                console.log('✅ Loaded existing High Stakes inventory:', Object.keys(inventory).length, 'items');
            } else {
                // User has no High Stakes inventory yet - start with empty inventory
                highStakesInventory = {};
                inventory = highStakesInventory;
                console.log('📪 No High Stakes inventory found - starting with empty inventory');
                
                // Show user-friendly message for first-time High Stakes users
                setTimeout(() => {
                    alert('💀 Welcome to High Stakes Mode! 💀\n\nYou start with an empty inventory in High Stakes mode.\nYour normal inventory is safely backed up and will be restored when you exit High Stakes mode.\n\nGood luck!');
                }, 500);
            }
            
            // Save mode state to Supabase
            console.log('💾 Saving High Stakes mode state to Supabase...');
            await window.saveHighStakesModeStateToSupabase(window.currentUser.id, true, window.normalInventoryBackup);
            console.log('✅ High Stakes mode state saved to Supabase');
        } catch (error) {
            console.error('❌ Error loading High Stakes inventory from Supabase:', error);
            // Fallback to localStorage
            console.log('🔄 Falling back to localStorage...');
            highStakesInventory = JSON.parse(localStorage.getItem('highStakesInventory')) || {};
            inventory = highStakesInventory;
            console.log('💾 Loaded from localStorage:', Object.keys(inventory).length, 'items');
            
            // Show first-time message if starting with empty inventory
            if (Object.keys(inventory).length === 0) {
                setTimeout(() => {
                    alert('💀 Welcome to High Stakes Mode! 💀\n\nYou start with an empty inventory in High Stakes mode.\nYour normal inventory is safely backed up and will be restored when you exit High Stakes mode.\n\nGood luck!');
                }, 500);
            }
        }
    } else {
        // Load from localStorage if not logged in
        console.log('👤 No user logged in - loading from localStorage');
        highStakesInventory = JSON.parse(localStorage.getItem('highStakesInventory')) || {};
        inventory = highStakesInventory;
        console.log('💾 Loaded from localStorage:', Object.keys(inventory).length, 'items');
        
        // Show first-time message if starting with empty inventory
        if (Object.keys(inventory).length === 0) {
            setTimeout(() => {
                alert('💀 Welcome to High Stakes Mode! 💀\n\nYou start with an empty inventory in High Stakes mode.\nYour normal inventory is safely backed up and will be restored when you exit High Stakes mode.\n\nGood luck!');
            }, 500);
        }
    }
    
    // Update UI
    document.querySelector('.conversions').style.display = 'none';
    document.querySelector('.bet-section').style.display = 'none';
    
    // Load and merge shop purchases from localStorage and Supabase
    const localPurchases = JSON.parse(localStorage.getItem('highStakesShopPurchases')) || {};
    let finalPurchases = localPurchases;
    
    if (window.currentUser) {
        try {
            console.log('🛒 Loading shop purchases from Supabase...');
            const supabasePurchases = await window.loadShopPurchasesFromSupabase(window.currentUser.id);
            
            // Merge localStorage and Supabase purchases (Supabase takes priority)
            finalPurchases = { ...localPurchases, ...supabasePurchases };
            
            // Update localStorage with the merged result
            localStorage.setItem('highStakesShopPurchases', JSON.stringify(finalPurchases));
            
            console.log('🛒 ✅ Shop purchases loaded and merged:', Object.keys(finalPurchases));
        } catch (error) {
            console.error('🛒 ❌ Error loading shop purchases from Supabase:', error);
            console.log('🛒 Using localStorage purchases only');
        }
    }
    
    // Apply shop purchase effects
    if (finalPurchases.autoClick) {
        // Show auto clicker if purchased
        document.getElementById('auto-clicker-container').style.display = 'block';
        console.log('🔄 Auto Clicker is available (purchased)');
    } else {
        // Hide auto clicker if not purchased
        document.getElementById('auto-clicker-container').style.display = 'none';
        console.log('🔄 Auto Clicker hidden (not purchased)');
    }
    
    // Show shop button in High Stakes mode
    document.getElementById('shop-container').classList.remove('hidden');
    
    // Update button
    const highStakesBtn = document.getElementById('high-stakes-btn');
    highStakesBtn.textContent = 'Exit High Stakes';
    highStakesBtn.classList.add('active');
    
    // Stop auto-clicker if running
    if (isAutoClickerActive) {
        toggleAutoClicker();
    }
    
    updateInventoryDisplay();
    
    // Refresh button listeners after mode switch
    if (typeof setupButtonListeners === 'function') {
        setTimeout(() => setupButtonListeners(), 100);
    }
    
    console.log('🎰 ✅ HIGH STAKES MODE ENTERED SUCCESSFULLY 🎰');
    console.log('Final inventory after switch:', Object.keys(inventory).length, 'items');
}

async function exitHighStakesMode() {
    isHighStakesMode = false;
    
    // Save High Stakes inventory to Supabase and localStorage
    localStorage.setItem('highStakesInventory', JSON.stringify(inventory));
    
    if (window.currentUser) {
        try {
            await window.saveHighStakesInventoryToSupabase(window.currentUser.id, inventory);
            // Clear mode state from Supabase
            await window.saveHighStakesModeStateToSupabase(window.currentUser.id, false, null);
        } catch (error) {
            console.error('Error saving High Stakes inventory to Supabase:', error);
        }
    }
    
    // Restore normal inventory
    inventory = window.normalInventoryBackup;
    localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
    
    // Save normal inventory to Supabase
    if (window.currentUser) {
        try {
            await window.saveInventoryToSupabase(window.currentUser.id, inventory);
        } catch (error) {
            console.error('Error saving normal inventory to Supabase:', error);
        }
    }
    
    // Restore UI
    document.getElementById('auto-clicker-container').style.display = 'block';
    document.querySelector('.conversions').style.display = 'block';
    document.querySelector('.bet-section').style.display = 'block';
    
    // Hide shop button when exiting High Stakes mode
    document.getElementById('shop-container').classList.add('hidden');
    
    // Stop High Stakes auto clicker if running and reset button
    if (isHighStakesAutoClickerActive) {
        toggleHighStakesAutoClicker();
    }
    
    // Reset auto clicker button text for normal mode
    const autoClickerBtn = document.getElementById('auto-clicker-btn');
    if (autoClickerBtn) {
        if (isAutoClickerActive) {
            autoClickerBtn.textContent = 'Stop Auto Clicker';
            autoClickerBtn.classList.add('active');
        } else {
            autoClickerBtn.textContent = 'Auto Clicker';
            autoClickerBtn.classList.remove('active');
        }
    }
    
    // Update button
    const highStakesBtn = document.getElementById('high-stakes-btn');
    highStakesBtn.textContent = 'High Stakes';
    highStakesBtn.classList.remove('active');
    
    updateInventoryDisplay();
    
    // Refresh button listeners after mode switch
    if (typeof setupButtonListeners === 'function') {
        setTimeout(() => setupButtonListeners(), 100);
    }
    
    console.log('Exited High Stakes Mode');
}

// High Stakes spinning line functions
function cleanupSpinningLine() {
    console.log('🧹 Starting spinning line cleanup...');
    
    // Hide everything immediately
    document.getElementById('keep-delete-buttons').classList.add('hidden');
    document.getElementById('spinning-line-container').classList.add('hidden');
    
    // NUCLEAR CLEANUP - Force everything to reset
    const track = document.getElementById('items-track');
    
    // Clear all selected items
    const selectedItems = track.querySelectorAll('.item-square.selected');
    selectedItems.forEach(item => {
        item.classList.remove('selected');
        console.log('🟡 Removed yellow highlight from item');
    });
    
    // Reset track
    track.classList.remove('spinning');
    track.style.cssText = ''; // Clear ALL inline styles
    track.innerHTML = '';
    
    // Force reflow to ensure cleanup takes effect
    track.offsetHeight;
    
    // Clear pending item
    if (window.pendingHighStakesItem) {
        console.log(`🗑️ Clearing pending item: ${window.pendingHighStakesItem.name}`);
        window.pendingHighStakesItem = null;
    }
    
    console.log('✅ Spinning line NUKED and cleaned up');
}

function startSpinningLine() {
    const container = document.getElementById('spinning-line-container');
    const track = document.getElementById('items-track');
    
    console.log('🎰 Starting spinning line...');
    
    // Hide Keep/Delete buttons and clear any pending items at start
    document.getElementById('keep-delete-buttons').classList.add('hidden');
    window.pendingHighStakesItem = null;
    
    // NUCLEAR RESET - Force complete reset
    track.classList.remove('spinning');
    track.style.cssText = ''; // Clear all inline styles
    track.innerHTML = '';
    
    // Force a reflow to ensure reset takes effect
    track.offsetHeight;
    
    // Generate enough items to fill screen width multiple times to eliminate gaps
    const screenWidth = window.innerWidth;
    const itemWidth = 70; // 60px + 10px margin  
    const itemsPerScreen = Math.ceil(screenWidth / itemWidth);
    const totalItemsNeeded = itemsPerScreen * 12; // 12 screens worth to eliminate any possible gaps
    
    console.log(`Generating ${totalItemsNeeded} items for seamless spinning (${itemsPerScreen} items per screen)`);
    
    // Create truly random items - each one is independently generated
    for (let i = 0; i < totalItemsNeeded; i++) {
        const randomItem = getWeightedRandomItem(); // Each item is completely random
        
        const square = document.createElement('div');
        square.className = 'item-square';
        square.style.backgroundImage = `url('images/${randomItem.image}')`;
        square.dataset.itemName = randomItem.name;
        square.dataset.itemRarity = getItemRarity(randomItem.name);
        
        track.appendChild(square);
    }
    
    console.log(`Generated ${totalItemsNeeded} completely random items for spinning`);
    
    // Show container first
    container.classList.remove('hidden');
    
    // Force another reflow after adding content
    track.offsetHeight;
    
    // Start spinning with proper reset
    setTimeout(() => {
        console.log('Starting fresh animation with randomized items');
        track.classList.add('spinning');
    }, 100);
    
    // Random duration between 5-8 seconds (under 8s animation duration)
    const duration = Math.random() * 3000 + 5000;
    
    // Stop animation and select item
    setTimeout(() => {
        console.log('Stopping animation and selecting item');
        selectWinningItem();
    }, duration);
}

// Function to get weighted random item based on rarity percentages
function getWeightedRandomItem() {
    const rand = Math.random() * 100;
    
    if (rand < 55) {
        // Common: 55%
        return getRandomItem(items.common);
    } else if (rand < 80) {
        // Rare: 25% (55 + 25 = 80)
        return getRandomItem(items.rare);
    } else if (rand < 92) {
        // Epic: 12% (80 + 12 = 92)
        return getRandomItem(items.epic);
    } else if (rand < 98) {
        // Legendary: 6% (92 + 6 = 98)
        return getRandomItem(items.legendary);
    } else {
        // Mythic: 2% (98 + 2 = 100)
        // Use special High Stakes mythic rates occasionally for the special items
        const mythicRand = Math.random();
        if (mythicRand < 0.02) { // 2% chance for Diablo Sword within mythic category
            return items.mythic.find(item => item.name === "Diablo Sword");
        } else if (mythicRand < 0.09) { // 7% chance for N.U.K.E within mythic category  
            return items.mythic.find(item => item.name === "N.U.K.E");
        } else {
            return getRandomItem(items.mythic);
        }
    }
}

function getItemRarity(itemName) {
    for (const [rarity, rarityItems] of Object.entries(items)) {
        if (rarityItems.some(item => item.name === itemName)) {
            return rarity;
        }
    }
    return 'common';
}

function selectWinningItem() {
    const track = document.getElementById('items-track');
    const squares = track.querySelectorAll('.item-square');
    const container = document.getElementById('spinning-line-container');
    
    console.log('🛑 Starting item selection process...');
    
    // FORCE STOP animation completely with multiple methods
    track.classList.remove('spinning');
    track.style.animation = 'none !important';
    track.style.animationPlayState = 'paused !important';
    track.style.webkitAnimation = 'none !important';
    track.style.webkitAnimationPlayState = 'paused !important';
    
    // Force multiple reflows to ensure animation stops
    track.offsetHeight;
    track.offsetWidth;
    
    console.log('🛑 Animation forcefully stopped');
    
    // Wait longer for animation to completely stop, then find center item
    setTimeout(() => {
        // Find the item closest to the center (where the red indicator is)
        const containerRect = container.getBoundingClientRect();
        const centerX = containerRect.left + containerRect.width / 2;
        
        console.log(`🎯 Looking for center item at X position: ${centerX}`);
        console.log(`📊 Total squares found: ${squares.length}`);
        
        let winningSquare = null;
        let closestDistance = Infinity;
        let visibleSquares = 0;
        
        // Only consider visible squares (those currently on screen)
        squares.forEach((square, index) => {
            const rect = square.getBoundingClientRect();
            
            // Only consider squares that are currently visible in the container
            if (rect.left < containerRect.right && rect.right > containerRect.left) {
                visibleSquares++;
                const squareCenterX = rect.left + rect.width / 2;
                const distance = Math.abs(squareCenterX - centerX);
                
                console.log(`🔍 Square ${index}: name="${square.dataset.itemName}", distance=${distance.toFixed(1)}px`);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    winningSquare = square;
                }
            }
        });
        
        console.log(`👁️ Visible squares: ${visibleSquares}, Closest distance: ${closestDistance.toFixed(1)}px`);
        
        // Highlight selected item ONLY if one was found
        if (winningSquare) {
            // Validate that we have the required data
            const selectedItemName = winningSquare.dataset.itemName;
            const selectedItemRarity = winningSquare.dataset.itemRarity;
            
            if (selectedItemName && selectedItemRarity) {
                // Clear any previous selection first
                document.querySelectorAll('.item-square.selected').forEach(sq => sq.classList.remove('selected'));
                
                // Add the yellow highlight (selected class)
                winningSquare.classList.add('selected');
                
                console.log(`✅ Selected item in center: ${selectedItemName} (${selectedItemRarity})`);
                
                // Store the selected item IMMEDIATELY
                window.pendingHighStakesItem = { 
                    name: selectedItemName, 
                    rarity: selectedItemRarity,
                    element: winningSquare // Store reference to the element
                };
                
                // Check if Auto Keep should handle this automatically
                if (handleAutoKeep(selectedItemName, selectedItemRarity)) {
                    console.log(`🤖 Auto Keep handled ${selectedItemName} automatically`);
                    return; // Auto Keep handled it, don't show manual buttons
                }
                
                // Wait for the visual effect (yellow highlight), then show Keep/Delete buttons
                setTimeout(() => {
                    // Triple-check everything is still valid
                    const stillSelected = winningSquare.classList.contains('selected');
                    const stillPending = window.pendingHighStakesItem && window.pendingHighStakesItem.name === selectedItemName;
                    const elementStillExists = document.contains(winningSquare);
                    
                    console.log(`🔍 Final validation - Selected: ${stillSelected}, Pending: ${stillPending}, Exists: ${elementStillExists}`);
                    
                    if (stillSelected && stillPending && elementStillExists) {
                        document.getElementById('keep-delete-buttons').classList.remove('hidden');
                        console.log(`🎮 ✅ Keep/Delete buttons NOW VISIBLE for: ${selectedItemName} (${selectedItemRarity})`);
                        console.log(`🎮 💡 YOU CAN NOW CLICK KEEP OR DELETE!`);
                    } else {
                        console.log(`❌ Final validation failed - buttons will NOT appear`);
                        console.log(`   - Still selected: ${stillSelected}`);
                        console.log(`   - Still pending: ${stillPending}`);
                        console.log(`   - Element exists: ${elementStillExists}`);
                        window.pendingHighStakesItem = null;
                    }
                }, 1500); // Longer delay to ensure everything is stable
            } else {
                console.log(`❌ Selected item missing data - name: ${selectedItemName}, rarity: ${selectedItemRarity}`);
                window.pendingHighStakesItem = null;
            }
        } else {
            console.log(`❌ No item found in center position - keep/delete buttons will NOT appear`);
            // Clear any pending item
            window.pendingHighStakesItem = null;
        }
    }, 500); // Even longer delay to ensure animation is completely stopped
}

async function addToHighStakesInventory(itemName, rarity) {
    console.log(`[HIGH STAKES] Attempting to add ${itemName} (${rarity})`);
    
    if (!inventory[itemName]) {
        inventory[itemName] = { 
            count: 0, 
            rarity: rarity,
            price: highStakesPrices[itemName] || 0
        };
    }
    
    // Check if adding this item would exceed the max limit of 5 PER ITEM TYPE
    if (inventory[itemName].count >= 5) {
        console.log(`[HIGH STAKES] Cannot add ${itemName} - already at maximum limit of 5 per item type`);
        alert(`You can't keep more than 5 items of the same type! You already have 5 ${itemName}s.`);
        return false; // Don't add the item and return false to indicate failure
    }
    
    inventory[itemName].count += 1;
    
    localStorage.setItem('highStakesInventory', JSON.stringify(inventory));
    
    // Save to Supabase if user is logged in
    if (window.currentUser) {
        try {
            await window.saveHighStakesInventoryToSupabase(window.currentUser.id, inventory);
            console.log(`[HIGH STAKES] Successfully saved to Supabase`);
        } catch (error) {
            console.error('Error saving High Stakes inventory to Supabase:', error);
        }
    } else {
        console.log(`[HIGH STAKES] User not logged in, skipping Supabase save`);
    }
    
    updateInventoryDisplay();
    console.log(`[HIGH STAKES] Added ${itemName} - now have ${inventory[itemName].count}/5 of this item type`);
    return true; // Successfully added the item
}

// Shop System Functions
function calculateHighStakesInventoryValue() {
    let totalValue = 0;
    for (const [name, data] of Object.entries(inventory)) {
        const price = highStakesPrices[name] || 0;
        totalValue += price * data.count;
    }
    return totalValue;
}

function findOptimalPaymentCombination(targetAmount) {
    // Create array of all items with their individual values
    const availableItems = [];
    for (const [name, data] of Object.entries(inventory)) {
        const price = highStakesPrices[name] || 0;
        for (let i = 0; i < data.count; i++) {
            availableItems.push({ name, price, index: i });
        }
    }
    
    // Sort by price (ascending) to try smaller items first
    availableItems.sort((a, b) => a.price - b.price);
    
    let bestCombination = null;
    let bestOverpay = Infinity;
    
    // Try different combinations to find the one with minimal overpay
    function findCombination(items, currentSum, currentItems, startIndex) {
        if (currentSum >= targetAmount) {
            const overpay = currentSum - targetAmount;
            if (overpay < bestOverpay) {
                bestOverpay = overpay;
                bestCombination = [...currentItems];
            }
            return;
        }
        
        for (let i = startIndex; i < items.length; i++) {
            const item = items[i];
            currentItems.push(item);
            findCombination(items, currentSum + item.price, currentItems, i + 1);
            currentItems.pop();
            
            // Early exit if we already have a perfect match
            if (bestOverpay === 0) return;
        }
    }
    
    findCombination(availableItems, 0, [], 0);
    
    return bestCombination;
}

function canAffordItem(price) {
    return calculateHighStakesInventoryValue() >= price;
}

async function showShopModal() {
    console.log(`🛒 [MODAL] Starting showShopModal`);
    
    const modal = document.getElementById('shop-modal');
    const itemsList = document.getElementById('shop-items-list');
    
    // Load and merge saved purchases from localStorage and Supabase
    const localPurchases = JSON.parse(localStorage.getItem('highStakesShopPurchases')) || {};
    let savedPurchases = localPurchases;
    
    console.log(`🛒 [MODAL] Local purchases:`, Object.keys(localPurchases));
    
    if (window.currentUser) {
        try {
            console.log(`🛒 [MODAL] Loading shop purchases from Supabase for user: ${window.currentUser.email}`);
            
            // Add timeout protection for Supabase loading
            const supabasePromise = window.loadShopPurchasesFromSupabase(window.currentUser.id);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Supabase load timeout')), 5000)
            );
            
            const supabasePurchases = await Promise.race([supabasePromise, timeoutPromise]);
            
            console.log(`🛒 [MODAL] Supabase purchases:`, Object.keys(supabasePurchases));
            
            // Merge localStorage and Supabase purchases (Supabase takes priority)
            savedPurchases = { ...localPurchases, ...supabasePurchases };
            
            // Update localStorage with the merged result
            localStorage.setItem('highStakesShopPurchases', JSON.stringify(savedPurchases));
            
            console.log(`🛒 [MODAL] ✅ Shop purchases loaded and merged:`, Object.keys(savedPurchases));
        } catch (error) {
            console.error('🛒 [MODAL] ❌ Error loading shop purchases from Supabase:', error);
            console.log('🛒 [MODAL] Using localStorage purchases only');
            // Continue with local purchases only
        }
    } else {
        console.log(`🛒 [MODAL] No user logged in, using localStorage only`);
    }
    
    console.log(`🛒 [MODAL] Building shop items list...`);
    itemsList.innerHTML = '';
    
    for (const [itemId, itemData] of Object.entries(shopItems)) {
        const isPurchased = savedPurchases[itemId] || false;
        
        console.log(`🛒 [MODAL] Item ${itemId}: purchased=${isPurchased}`);
        
        const itemDiv = document.createElement('div');
        itemDiv.className = `shop-item ${isPurchased ? 'purchased' : ''}`;
        
        const canAfford = canAffordItem(itemData.price);
        
        itemDiv.innerHTML = `
            <div class="shop-item-info">
                <div class="shop-item-name">${itemData.name}</div>
                <div class="shop-item-description">${itemData.description}</div>
                <div class="shop-item-price">${formatPrice(itemData.price)}</div>
            </div>
            <div class="shop-item-actions">
                ${isPurchased 
                    ? `<span class="purchased-label">Purchased</span>
                       ${itemId === 'autoKeep' ? '<button class="shop-item-btn settings-btn" onclick="showAutoKeepSettings()">⚙️</button>' : ''}`
                    : `<button class="shop-item-btn buy-btn" ${!canAfford ? 'disabled' : ''} onclick="attemptPurchase('${itemId}')">
                        ${canAfford ? 'Buy' : 'Too Poor'}
                       </button>`
                }
            </div>
        `;
        
        itemsList.appendChild(itemDiv);
    }
    
    console.log(`🛒 [MODAL] Showing shop modal`);
    modal.style.display = 'flex';
    console.log(`🛒 [MODAL] ✅ showShopModal completed successfully`);
}

function hideShopModal() {
    document.getElementById('shop-modal').style.display = 'none';
}

// Purchase in progress flag to prevent multiple simultaneous purchases
let purchaseInProgress = false;

async function attemptPurchase(itemId) {
    console.log(`🛒 [PURCHASE] Starting purchase attempt for: ${itemId}`);
    
    // Prevent multiple simultaneous purchases
    if (purchaseInProgress) {
        console.log(`🛒 [PURCHASE] Purchase already in progress, ignoring duplicate click`);
        return;
    }
    
    // Check if item is already purchased (protection against double-purchase bug)
    const currentPurchases = JSON.parse(localStorage.getItem('highStakesShopPurchases')) || {};
    if (currentPurchases[itemId]) {
        console.log(`🛒 [PURCHASE] ❌ Item ${itemId} already purchased, aborting`);
        alert(`You already own ${shopItems[itemId].name}! If this is wrong, try refreshing the page.`);
        return;
    }
    
    // If user is logged in, double-check with Supabase to prevent conflicts
    if (window.currentUser) {
        try {
            console.log(`🛒 [PURCHASE] Double-checking purchase status with Supabase...`);
            const supabaseOwned = await window.checkShopPurchaseFromSupabase(window.currentUser.id, itemId);
            if (supabaseOwned) {
                console.log(`🛒 [PURCHASE] ❌ Supabase says item ${itemId} already purchased, aborting`);
                
                // Update localStorage to match Supabase
                currentPurchases[itemId] = true;
                localStorage.setItem('highStakesShopPurchases', JSON.stringify(currentPurchases));
                
                alert(`You already own ${shopItems[itemId].name}! (Fixed sync issue - try refreshing)`);
                
                // Refresh the shop modal to show correct state
                await showShopModal();
                return;
            }
        } catch (error) {
            console.error(`🛒 [PURCHASE] ❌ Error checking Supabase purchase status:`, error);
            console.log(`🛒 [PURCHASE] Continuing with purchase despite Supabase check failure`);
        }
    }
    
    purchaseInProgress = true;
    
    // Disable all buy buttons during purchase
    const buyButtons = document.querySelectorAll('.buy-btn');
    buyButtons.forEach(btn => {
        btn.disabled = true;
        btn.textContent = 'Processing...';
    });
    
    // Add global timeout for entire purchase process (30 seconds)
    const purchaseTimeout = setTimeout(() => {
        console.error('🚨 [PURCHASE] Purchase process timed out after 30 seconds - force resetting');
        purchaseInProgress = false;
        
        // Force re-enable buttons
        const buyButtons = document.querySelectorAll('.buy-btn');
        buyButtons.forEach(btn => {
            btn.disabled = false;
            btn.textContent = 'Buy';
        });
        
        alert('Purchase timed out. Please try again.');
    }, 30000);
    
    try {
        const itemData = shopItems[itemId];
        const totalValue = calculateHighStakesInventoryValue();
        
        console.log(`🛒 [PURCHASE] Item: ${itemData.name}, Price: ${itemData.price}, Total Value: ${totalValue}`);
        
        if (totalValue < itemData.price) {
            alert('Too poor, go gamble some more');
            return;
        }
        
        const optimalCombination = findOptimalPaymentCombination(itemData.price);
        const totalCost = optimalCombination.reduce((sum, item) => sum + item.price, 0);
        const overpay = totalCost - itemData.price;
        
        console.log(`🛒 [PURCHASE] Optimal combination found, total cost: ${totalCost}, overpay: ${overpay}`);
        
        // Check if overpay is significant (more than 10% of purchase price)
        const overpayThreshold = itemData.price * 0.1;
        
        if (overpay > overpayThreshold) {
            // Find the most expensive item in the combination
            const expensiveItems = optimalCombination
                .filter(item => item.price > itemData.price * 0.5)
                .map(item => item.name);
            
            if (expensiveItems.length > 0) {
                console.log(`🛒 [PURCHASE] Showing confirmation dialog due to overpay`);
                showPurchaseConfirmation(itemId, optimalCombination, expensiveItems[0]);
                return;
            }
        }
        
        // Direct purchase without warning
        console.log(`🛒 [PURCHASE] Proceeding with direct purchase`);
        await completePurchase(itemId, optimalCombination);
        
    } catch (error) {
        console.error(`🛒 [PURCHASE] ❌ Error in attemptPurchase:`, error);
        alert('An error occurred during purchase. Please try again.');
    } finally {
        // Clear the timeout since purchase completed (successfully or with error)
        clearTimeout(purchaseTimeout);
        
        purchaseInProgress = false;
        
        // Re-enable buy buttons and refresh modal to show correct state
        try {
            await showShopModal();
        } catch (modalError) {
            console.error(`🛒 [PURCHASE] Error refreshing modal in finally:`, modalError);
            // Fallback: just re-enable buttons manually
            const buyButtons = document.querySelectorAll('.buy-btn');
            buyButtons.forEach(btn => {
                btn.disabled = false;
                btn.textContent = 'Buy';
            });
        }
        
        console.log(`🛒 [PURCHASE] Purchase attempt completed, flag reset`);
    }
}

function showPurchaseConfirmation(itemId, itemsToRemove, expensiveItemName) {
    const modal = document.getElementById('purchase-confirm-modal');
    const title = document.getElementById('confirm-title');
    const message = document.getElementById('confirm-message');
    
    title.textContent = 'Confirm Purchase';
    message.innerHTML = `
        <div class="warning-message">
            ⚠️ This purchase will remove a item with greater value (${expensiveItemName}) are you sure you want to do this? ⚠️
        </div>
        <p>This will cost you ${formatPrice(itemsToRemove.reduce((sum, item) => sum + item.price, 0))} worth of items.</p>
    `;
    
    // Store the purchase data for confirmation
    window.pendingPurchase = { itemId, itemsToRemove };
    
    modal.style.display = 'flex';
}

async function completePurchase(itemId, itemsToRemove) {
    console.log(`🛒 [COMPLETE] Starting completePurchase for: ${itemId}`);
    console.log(`🛒 [COMPLETE] Items to remove:`, itemsToRemove.map(item => `${item.name}(${item.price})`));
    
    // Remove items from inventory
    const itemsRemoved = {};
    itemsToRemove.forEach(item => {
        if (!itemsRemoved[item.name]) {
            itemsRemoved[item.name] = 0;
        }
        itemsRemoved[item.name]++;
        
        inventory[item.name].count--;
        if (inventory[item.name].count <= 0) {
            delete inventory[item.name];
        }
    });
    
    console.log(`🛒 [COMPLETE] Items removed from inventory:`, itemsRemoved);
    
    // Save purchase state to localStorage
    const savedPurchases = JSON.parse(localStorage.getItem('highStakesShopPurchases')) || {};
    savedPurchases[itemId] = true;
    localStorage.setItem('highStakesShopPurchases', JSON.stringify(savedPurchases));
    
    console.log(`🛒 [COMPLETE] Purchase saved to localStorage`);
    
    // Save purchase to Supabase if user is logged in (with timeout)
    if (window.currentUser) {
        console.log(`🛒 [COMPLETE] Saving to Supabase for user: ${window.currentUser.email}`);
        
        // Use Promise.race to add timeout protection
        const savePromise = window.saveShopPurchaseToSupabase(window.currentUser.id, itemId);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Supabase save timeout')), 5000)
        );
        
        try {
            await Promise.race([savePromise, timeoutPromise]);
            console.log(`🛒 [COMPLETE] ✅ Shop purchase ${itemId} saved to Supabase`);
        } catch (error) {
            console.error(`🛒 [COMPLETE] ❌ Error saving shop purchase to Supabase:`, error);
            // Continue anyway - don't let Supabase errors block the purchase
        }
    }
    
    // Show relevant UI elements after purchase
    if (itemId === 'autoClick') {
        // Show auto clicker button immediately after purchase
        document.getElementById('auto-clicker-container').style.display = 'block';
        console.log('🔄 Auto Clicker button is now visible in High Stakes mode');
    }
    
    console.log(`🛒 [COMPLETE] Updating inventory display...`);
    // Update inventory display
    updateInventoryDisplay();
    
    console.log(`🛒 [COMPLETE] Refreshing shop modal...`);
    // Refresh shop modal to show purchase status (WITH TIMEOUT)
    try {
        const modalPromise = showShopModal();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('showShopModal timeout')), 5000)
        );
        
        await Promise.race([modalPromise, timeoutPromise]);
        console.log(`🛒 [COMPLETE] ✅ Shop modal refreshed successfully`);
    } catch (error) {
        console.error('🛒 [COMPLETE] ❌ Error refreshing shop modal:', error);
        // Continue anyway - don't let modal refresh errors block the purchase
    }
    
    document.getElementById('purchase-confirm-modal').style.display = 'none';
    
    // Show success message
    const removedText = Object.entries(itemsRemoved)
        .map(([name, count]) => `${count} ${name}${count > 1 ? 's' : ''}`)
        .join(', ');
    
    console.log(`🛒 [COMPLETE] Showing success message`);
    alert(`✅ Successfully purchased ${shopItems[itemId].name}!\nRemoved: ${removedText}`);
    
    console.log(`🛒 [COMPLETE] ✅ Purchase complete: ${shopItems[itemId].name}`);
}

// Auto Click functionality for High Stakes mode with better interval management
function toggleHighStakesAutoClicker() {
    // Note: Shop purchases are already merged from Supabase in enterHighStakesMode()
    // so we can safely read from localStorage which contains the merged data
    const savedPurchases = JSON.parse(localStorage.getItem('highStakesShopPurchases')) || {};
    
    if (!savedPurchases.autoClick) {
        alert('You need to purchase Auto Click from the shop first!');
        console.log('🔄 ❌ Auto Click not purchased - shop purchase required');
        return;
    }
    
    const autoClickerBtn = document.getElementById('auto-clicker-btn');
    
    console.log('🔄 [HIGH STAKES AUTO] Toggle called, current state:', isHighStakesAutoClickerActive);
    
    if (isHighStakesAutoClickerActive) {
        // Stop auto clicker
        if (highStakesAutoClickerInterval) {
            clearInterval(highStakesAutoClickerInterval);
            highStakesAutoClickerInterval = null;
            console.log('🔄 [HIGH STAKES AUTO] Interval cleared');
        }
        
        if (autoClickerBtn) {
            autoClickerBtn.textContent = 'Auto Clicker';
            autoClickerBtn.classList.remove('active');
        }
        
        isHighStakesAutoClickerActive = false;
        console.log('🔄 [HIGH STAKES AUTO] Stopped');
    } else {
        // Start auto clicker - open a loot box every 8.5 seconds in High Stakes mode
        highStakesAutoClickerInterval = setInterval(() => {
            console.log('🔄 [HIGH STAKES AUTO] Tick - attempting click');
            const openBoxBtn = document.getElementById('open-box-btn');
            if (openBoxBtn && isHighStakesMode && !openBoxBtn.disabled) {
                console.log('🔄 [HIGH STAKES AUTO] Clicking open box button');
                openBoxBtn.click();
            } else {
                console.log('🔄 [HIGH STAKES AUTO] Cannot click - button disabled or not in High Stakes mode');
            }
        }, 8500);
        
        if (autoClickerBtn) {
            autoClickerBtn.textContent = 'Stop Auto Clicker';
            autoClickerBtn.classList.add('active');
        }
        
        isHighStakesAutoClickerActive = true;
        console.log('🔄 [HIGH STAKES AUTO] Started with interval ID:', highStakesAutoClickerInterval);
    }
}

// Auto Keep Settings
function showAutoKeepSettings() {
    const modal = document.getElementById('auto-keep-settings-modal');
    const itemsList = document.getElementById('auto-keep-items-list');
    
    // Load saved settings
    const savedSettings = JSON.parse(localStorage.getItem('autoKeepSettings')) || {};
    
    itemsList.innerHTML = '';
    
    // Get all items and sort by rarity
    const allItems = Object.values(items).flat();
    const rarityOrder = { 'mythic': 0, 'legendary': 1, 'epic': 2, 'rare': 3, 'common': 4 };
    allItems.sort((a, b) => {
        const rarityA = Object.keys(items).find(rarity => items[rarity].includes(a));
        const rarityB = Object.keys(items).find(rarity => items[rarity].includes(b));
        const rarityDiff = rarityOrder[rarityA] - rarityOrder[rarityB];
        if (rarityDiff !== 0) return rarityDiff;
        return a.name.localeCompare(b.name);
    });
    
    allItems.forEach(item => {
        const isEnabled = savedSettings[item.name] || false;
        const rarity = Object.keys(items).find(r => items[r].includes(item));
        
        const itemDiv = document.createElement('div');
        itemDiv.className = `auto-keep-item ${rarity}`;
        
        itemDiv.innerHTML = `
            <div class="auto-keep-item-name">${item.name}</div>
            <div class="toggle-switch ${isEnabled ? 'active' : ''}" onclick="toggleAutoKeepItem('${item.name}')">
                <div class="toggle-slider"></div>
            </div>
        `;
        
        itemsList.appendChild(itemDiv);
    });
    
    modal.style.display = 'flex';
}

function toggleAutoKeepItem(itemName) {
    const savedSettings = JSON.parse(localStorage.getItem('autoKeepSettings')) || {};
    savedSettings[itemName] = !savedSettings[itemName];
    localStorage.setItem('autoKeepSettings', JSON.stringify(savedSettings));
    
    // Update the toggle visually
    const toggles = document.querySelectorAll('.toggle-switch');
    toggles.forEach(toggle => {
        const itemDiv = toggle.closest('.auto-keep-item');
        const nameDiv = itemDiv.querySelector('.auto-keep-item-name');
        if (nameDiv.textContent === itemName) {
            toggle.classList.toggle('active', savedSettings[itemName]);
        }
    });
    
    console.log(`🔧 Auto Keep for ${itemName}: ${savedSettings[itemName] ? 'ON' : 'OFF'}`);
}

// Auto Keep functionality
function handleAutoKeep(itemName, rarity) {
    // Note: Shop purchases are already merged from Supabase in enterHighStakesMode()
    // so we can safely read from localStorage which contains the merged data
    const savedPurchases = JSON.parse(localStorage.getItem('highStakesShopPurchases')) || {};
    
    if (!savedPurchases.autoKeep) {
        console.log(`🤖 Auto Keep not purchased for ${itemName} - manual decision required`);
        return false; // Auto Keep not purchased
    }
    
    const savedSettings = JSON.parse(localStorage.getItem('autoKeepSettings')) || {};
    const shouldKeep = savedSettings[itemName] || false;
    
    console.log(`🤖 Auto Keep checking ${itemName}: ${shouldKeep ? 'KEEP' : 'DELETE'}`);
    
    // Check if we already have 5 of this item
    if (inventory[itemName] && inventory[itemName].count >= 5) {
        console.log(`🤖 Auto Keep: Already have 5 ${itemName}, auto deleting`);
        cleanupSpinningLine();
        return true;
    }
    
    const inventorySize = Object.keys(inventory).length;
    
    if (inventorySize >= 10) {
        if (shouldKeep) {
            console.log(`🤖 Auto Keep: Inventory full, keeping ${itemName} (will delete first item)`);
            // Same logic as manual keep - remove first item
            const rarityOrder = { 'mythic': 0, 'legendary': 1, 'epic': 2, 'rare': 3, 'common': 4 };
            const sortedItems = Object.entries(inventory).sort((a, b) => {
                const rarityDiff = rarityOrder[a[1].rarity] - rarityOrder[b[1].rarity];
                if (rarityDiff !== 0) return rarityDiff;
                return a[0].localeCompare(b[0]);
            });
            
            if (sortedItems.length > 0) {
                const firstItemName = sortedItems[0][0];
                delete inventory[firstItemName];
                console.log(`🤖 Auto Keep: Deleted ${firstItemName} to make room`);
            }
            
            addToHighStakesInventory(itemName, rarity);
        } else {
            console.log(`🤖 Auto Keep: Inventory full, deleting ${itemName} (not in keep list)`);
        }
    } else {
        if (shouldKeep) {
            console.log(`🤖 Auto Keep: Keeping ${itemName}`);
            addToHighStakesInventory(itemName, rarity);
        } else {
            console.log(`🤖 Auto Keep: Deleting ${itemName} (not in keep list)`);
        }
    }
    
    cleanupSpinningLine();
    return true;
}

// Make High Stakes functions and variables globally accessible for HTML script
window.enterHighStakesMode = enterHighStakesMode;
window.exitHighStakesMode = exitHighStakesMode;
window.normalInventoryBackup = normalInventoryBackup;

// Make shop functions globally accessible for HTML onclick attributes
window.showShopModal = showShopModal;
window.hideShopModal = hideShopModal;
window.attemptPurchase = attemptPurchase;
window.showAutoKeepSettings = showAutoKeepSettings;
window.toggleAutoKeepItem = toggleAutoKeepItem;
window.toggleHighStakesAutoClicker = toggleHighStakesAutoClicker;

// Make button setup function globally accessible
window.setupButtonListeners = setupButtonListeners;

// Function to setup button listeners with proper cleanup
function setupButtonListeners() {
    console.log('🔧 Setting up button listeners...');
    
    // Auto Clicker button event listener with cleanup
    const autoClickerBtn = document.getElementById('auto-clicker-btn');
    if (autoClickerBtn) {
        // Remove existing listener by replacing the element
        autoClickerBtn.replaceWith(autoClickerBtn.cloneNode(true));
        const newAutoClickerBtn = document.getElementById('auto-clicker-btn');
        
        newAutoClickerBtn.addEventListener('click', () => {
            console.log('🔄 Auto Clicker button clicked');
            try {
                if (isHighStakesMode) {
                    toggleHighStakesAutoClicker();
                } else {
                    toggleAutoClicker();
                }
            } catch (error) {
                console.error('Error toggling auto clicker:', error);
            }
        });
        console.log('🔄 Auto Clicker listener attached');
    }
    
    // High Stakes button event listener with cleanup
    const highStakesBtn = document.getElementById('high-stakes-btn');
    console.log('🎰 High Stakes button found:', highStakesBtn);
    if (highStakesBtn) {
        // Remove existing listener by replacing the element
        highStakesBtn.replaceWith(highStakesBtn.cloneNode(true));
        const newHighStakesBtn = document.getElementById('high-stakes-btn');
        
        console.log('🎰 Adding click listener to High Stakes button');
        newHighStakesBtn.addEventListener('click', () => {
            console.log('🎰 High Stakes button clicked');
            try {
                toggleHighStakesMode();
            } catch (error) {
                console.error('Error toggling High Stakes mode:', error);
            }
        });
        console.log('🎰 High Stakes listener attached');
    } else {
        console.error('🎰 High Stakes button not found!');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM Content Loaded - initializing buttons...');
    setupButtonListeners();
    
    // Shop button event listener
    const shopBtn = document.getElementById('shop-btn');
    if (shopBtn) {
        shopBtn.addEventListener('click', async () => {
            try {
                await showShopModal();
            } catch (error) {
                console.error('Error showing shop modal:', error);
            }
        });
    }
    
    // Shop modal close button
    const closeShopBtn = document.getElementById('close-shop-btn');
    if (closeShopBtn) {
        closeShopBtn.addEventListener('click', hideShopModal);
    }
    
    // Auto Keep settings modal close button
    const closeAutoKeepBtn = document.getElementById('close-auto-keep-settings-btn');
    if (closeAutoKeepBtn) {
        closeAutoKeepBtn.addEventListener('click', () => {
            document.getElementById('auto-keep-settings-modal').style.display = 'none';
        });
    }
    
    // Purchase confirmation modal buttons
    const confirmYesBtn = document.getElementById('confirm-yes-btn');
    const confirmNoBtn = document.getElementById('confirm-no-btn');
    
    if (confirmYesBtn) {
        confirmYesBtn.addEventListener('click', async () => {
            if (window.pendingPurchase) {
                try {
                    await completePurchase(window.pendingPurchase.itemId, window.pendingPurchase.itemsToRemove);
                } catch (error) {
                    console.error('Error completing purchase:', error);
                }
                window.pendingPurchase = null;
            }
        });
    }
    
    if (confirmNoBtn) {
        confirmNoBtn.addEventListener('click', () => {
            document.getElementById('purchase-confirm-modal').style.display = 'none';
            window.pendingPurchase = null;
        });
    }
    
    // Close modals when clicking outside
    document.getElementById('shop-modal').addEventListener('click', (e) => {
        if (e.target.id === 'shop-modal') {
            hideShopModal();
        }
    });
    
    document.getElementById('auto-keep-settings-modal').addEventListener('click', (e) => {
        if (e.target.id === 'auto-keep-settings-modal') {
            document.getElementById('auto-keep-settings-modal').style.display = 'none';
        }
    });
    
    document.getElementById('purchase-confirm-modal').addEventListener('click', (e) => {
        if (e.target.id === 'purchase-confirm-modal') {
            document.getElementById('purchase-confirm-modal').style.display = 'none';
            window.pendingPurchase = null;
        }
    });
    
    // Keep/Delete button event listeners
    const keepBtn = document.getElementById('keep-btn');
    const deleteBtn = document.getElementById('delete-btn');
    
    // Flag to prevent duplicate keep actions
    let keepActionInProgress = false;
    
    if (keepBtn) {
        keepBtn.addEventListener('click', async () => {
            console.log(`[KEEP BUTTON] 🎮 Keep button clicked!`);
            
            // Prevent duplicate executions
            if (keepActionInProgress) {
                console.log(`[KEEP BUTTON] Keep action already in progress, ignoring click`);
                return;
            }
            keepActionInProgress = true;
            
            try {
                // Validate that we have a valid selected item
                if (!window.pendingHighStakesItem || !window.pendingHighStakesItem.name || !window.pendingHighStakesItem.rarity) {
                    console.log(`[KEEP BUTTON] ❌ No valid pending item to keep! Current pendingItem:`, window.pendingHighStakesItem);
                    alert('No item selected! Please wait for an item to be highlighted in yellow before clicking Keep.');
                    return;
                }
                
                console.log(`[KEEP BUTTON] ✅ Starting Keep process for ${window.pendingHighStakesItem.name} (${window.pendingHighStakesItem.rarity})`);
                
                const inventorySize = Object.keys(inventory).length;
                console.log(`[KEEP BUTTON] Current inventory size: ${inventorySize} items`);
                
                // If inventory is full (10 different item types), remove the first item FROM THE DISPLAY ORDER
                if (inventorySize >= 10) {
                    console.log(`[KEEP BUTTON] Inventory is full (${inventorySize} items), need to delete one`);
                    
                    // Sort items exactly like the display to find the FIRST item (top of list)
                    const rarityOrder = { 'mythic': 0, 'legendary': 1, 'epic': 2, 'rare': 3, 'common': 4 };
                    
                    const sortedItems = Object.entries(inventory).sort((a, b) => {
                        // First sort by rarity (mythic first)
                        const rarityDiff = rarityOrder[a[1].rarity] - rarityOrder[b[1].rarity];
                        if (rarityDiff !== 0) return rarityDiff;
                        
                        // Then sort alphabetically
                        return a[0].localeCompare(b[0]);
                    });
                    
                    console.log(`[KEEP BUTTON] Sorted items:`, sortedItems.map(([name, data]) => `${name} (${data.rarity})`));
                    
                    // Delete the FIRST item from the sorted list (top of display)
                    if (sortedItems.length > 0) {
                        const firstItemName = sortedItems[0][0];
                        const firstItemCount = sortedItems[0][1].count;
                        console.log(`[KEEP BUTTON] Deleting ${firstItemName} (had ${firstItemCount} of them)`);
                        delete inventory[firstItemName];
                        console.log(`[KEEP BUTTON] Deleted ${firstItemName} (first item from display) to make room (evil mode 😈)`);
                    }
                } else {
                    console.log(`[KEEP BUTTON] Inventory not full (${inventorySize} items), no need to delete`);
                }
                
                // Add new item (will go to its correct position based on rarity/name)
                console.log(`[KEEP BUTTON] Now adding new item: ${window.pendingHighStakesItem.name}`);
                const addResult = await addToHighStakesInventory(window.pendingHighStakesItem.name, window.pendingHighStakesItem.rarity);
                
                if (addResult === false) {
                    console.log(`[KEEP BUTTON] ❌ Failed to add item (5-item limit hit)`);
                    // The error message was already shown by addToHighStakesInventory
                } else {
                    console.log(`[KEEP BUTTON] ✅ Successfully added item to inventory`);
                }
                
                const finalInventorySize = Object.keys(inventory).length;
                console.log(`[KEEP BUTTON] Final inventory size: ${finalInventorySize} items`);
                
                // Clean up regardless of success or failure (continue the game)
                cleanupSpinningLine();
                
            } catch (error) {
                console.error(`[KEEP BUTTON] ❌ Error during keep process:`, error);
                alert('An error occurred while keeping the item. Please try again.');
            } finally {
                // Always reset the flag
                keepActionInProgress = false;
            }
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            console.log(`[DELETE BUTTON] 🗑️ Delete button clicked!`);
            
            // Validate that we have a valid selected item
            if (!window.pendingHighStakesItem || !window.pendingHighStakesItem.name || !window.pendingHighStakesItem.rarity) {
                console.log(`[DELETE BUTTON] ❌ No valid pending item to delete! Current pendingItem:`, window.pendingHighStakesItem);
                alert('No item selected! Please wait for an item to be highlighted in yellow before clicking Delete.');
                return;
            }
            
            console.log(`🗑️ Successfully discarded ${window.pendingHighStakesItem.name} (${window.pendingHighStakesItem.rarity})`);
            
            // Clean up
            cleanupSpinningLine();
        });
    }
    
    // NOTE: Conversion items use inline onclick attributes in HTML
    // No need for additional event listeners here which would cause double triggering

    // Event listener for opening the loot box
    openBoxBtn.addEventListener('click', async () => {
        // Disable the button during animation
        openBoxBtn.disabled = true;
        
        // Close any previous result
        itemResult.classList.add('hidden');
        
        // Check if we're in High Stakes mode
        if (isHighStakesMode) {
            // Use spinning line animation
            startSpinningLine();
            
            // Re-enable button after a short delay
            setTimeout(() => {
                openBoxBtn.disabled = false;
            }, 1000);
        } else {
            // Use normal chest animation
            lootBox.classList.add('open');
            
            // Play sound effect (optional)
            // const openSound = new Audio('sounds/chest-open.mp3');
            // openSound.play();
            
            // Get random loot
            const loot = getRandomLoot();
            
            // We'll show the epic overlay later if it's an epic item
            
            // Wait for animation to complete
            setTimeout(async () => {
                // Display the item
                itemName.textContent = loot.item.name;
                itemRarity.textContent = loot.rarity.charAt(0).toUpperCase() + loot.rarity.slice(1);
                itemRarity.className = loot.rarity;
                itemImage.style.backgroundImage = `url('images/${loot.item.image}')`;            
                
                // Show appropriate overlay based on rarity
                epicOverlay.classList.add('hidden'); // First hide for all cases
                
                // Only show for specific rarities
                if (loot.rarity === 'rare') {
                    epicOverlay.style.backgroundImage = "url('images/smaller-image.png')";
                    epicOverlay.classList.remove('hidden');
                }
                // Epic and common items will have no background image
                
                // Show the result
                itemResult.classList.remove('hidden');
                
                // Add to inventory
                await addToInventory(loot.item.name, loot.rarity);
                
                // Re-enable the button
                openBoxBtn.disabled = false;
                
                // Reset the box after a delay
                setTimeout(() => {
                    lootBox.classList.remove('open');
                    // Hide epic overlay
                    epicOverlay.classList.add('hidden');
                }, 500); // Shortened cooldown duration
            }, 1000);
        }
    });

    // Initialize the inventory display on page load
    updateInventoryDisplay();
    
    // Bet button functionality
    const betBtn = document.getElementById('bet-btn');
    const betPopup = document.getElementById('bet-popup');
    const cancelBetBtn = document.getElementById('cancel-bet');
    const confirmBetBtn = document.getElementById('confirm-bet');
    const clearSignatureBtn = document.getElementById('clear-signature');
    const signatureCanvas = document.getElementById('signature-canvas');
    
    // Initialize signature pad
    let ctx = signatureCanvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    // Set canvas size properly
    function resizeCanvas() {
        const container = signatureCanvas.parentElement;
        signatureCanvas.width = container.clientWidth;
        signatureCanvas.height = 150;
        
        // Set canvas background to white
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    }
    
    // Clear signature
    function clearSignature() {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
        hasSignature = false;
    }
    
    // Check if the signature pad has been drawn on
    function isSignatureEmpty() {
        const imageData = ctx.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height).data;
        for (let i = 0; i < imageData.length; i += 4) {
            // Check if any pixel is not white
            if (imageData[i] !== 255 || imageData[i+1] !== 255 || imageData[i+2] !== 255) {
                return false;
            }
        }
        return true;
    }
    
    // Track if signature has been drawn
    let hasSignature = false;
    
    // Drawing functions
    function startDrawing(e) {
        isDrawing = true;
        [lastX, lastY] = getMousePos(signatureCanvas, e);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        const [currentX, currentY] = getMousePos(signatureCanvas, e);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        
        [lastX, lastY] = [currentX, currentY];
        
        // Mark that signature has been drawn
        hasSignature = true;
    }
    
    function stopDrawing() {
        isDrawing = false;
    }
    
    // Get mouse position relative to canvas
    function getMousePos(canvas, e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        let clientX, clientY;
        
        // Handle both mouse and touch events
        if (e.type.includes('touch')) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        return [
            (clientX - rect.left) * scaleX,
            (clientY - rect.top) * scaleY
        ];
    }
    
    // Event listeners for signature pad
    signatureCanvas.addEventListener('mousedown', startDrawing);
    signatureCanvas.addEventListener('mousemove', draw);
    signatureCanvas.addEventListener('mouseup', stopDrawing);
    signatureCanvas.addEventListener('mouseout', stopDrawing);
    
    // Touch support
    signatureCanvas.addEventListener('touchstart', startDrawing);
    signatureCanvas.addEventListener('touchmove', draw);
    signatureCanvas.addEventListener('touchend', stopDrawing);
    
    // Show bet popup
    betBtn.addEventListener('click', () => {
        betPopup.style.display = 'flex';
        resizeCanvas();
    });
    
    // Cancel bet
    cancelBetBtn.addEventListener('click', function() {
        betPopup.style.display = 'none';
    });
    
    // Also close popup when clicking outside
    betPopup.addEventListener('click', function(e) {
        if (e.target === betPopup) {
            betPopup.style.display = 'none';
        }
    });
    
    // Clear signature
    clearSignatureBtn.addEventListener('click', clearSignature);
    
    // Result popup elements
    const resultPopup = document.getElementById('result-popup');
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const tryAgainBtn = document.getElementById('try-again-btn');
    const continueBtn = document.getElementById('continue-btn');
    const gameOverScreen = document.getElementById('game-over');
    const countdown = document.getElementById('countdown');
    
    // Confirm bet
    confirmBetBtn.addEventListener('click', () => {
        const betAmount = parseInt(document.getElementById('bet-amount').value);
        const betItem = document.getElementById('bet-item').value.toLowerCase();
        
        if (!betAmount || !betItem) {
            alert('Please fill in all fields');
            return;
        }

        // Check if player has enough value in their inventory
        const totalInventoryValue = calculateTotalInventoryValue();
        if (betAmount > totalInventoryValue) {
            alert('Sorry ur too poor, try loot boxing more.');
            return;
        }
        
        // Check if signature is empty
        if (isSignatureEmpty()) {
            alert("Sorry, I'm not taking the blame if you die. Put your signature to go ahead.");
            return;
        }
        
        // Hide bet popup
        betPopup.style.display = 'none';
        
        // Get a random item with reduced chances (betting mode)
        const loot = getRandomLoot(true);
        
        // Check if the player won (exact item name match)
        const allItems = [...items.common, ...items.rare, ...items.epic, ...items.legendary, ...items.mythic];
        const betItemExists = allItems.some(item => item.name.toLowerCase() === betItem);
        
        let won = false;
        if (betItemExists) {
            // Check if they got the exact item they bet on
            won = loot.item.name.toLowerCase() === betItem;
        } else {
            // If they entered a rarity instead of an item name
            const rarities = ['common', 'rare', 'epic', 'legendary', 'mythic'];
            if (rarities.includes(betItem)) {
                won = loot.rarity === betItem;
            }
        }
        
        if (won) {
            // Player won
            resultTitle.textContent = 'You Won!';
            resultTitle.style.color = '#2ecc71';
            resultMessage.innerHTML = `Congratulations! You got a ${loot.item.name} (${loot.rarity}).<br>Your soul is safe... for now.`;
            continueBtn.style.display = 'block';
            tryAgainBtn.style.display = 'block';
            consecutiveLosses = 0; // Reset consecutive losses
        } else {
            // Player lost
            consecutiveLosses++;
            
            if (consecutiveLosses >= 2) {
                // Game over after 2 consecutive losses
                gameOverScreen.style.display = 'flex';
                resultPopup.style.display = 'none';
                
                // Countdown to close the window
                let secondsLeft = 5;
                const countdownInterval = setInterval(() => {
                    secondsLeft--;
                    countdown.textContent = secondsLeft;
                    
                    if (secondsLeft <= 0) {
                        clearInterval(countdownInterval);
                        // Try multiple methods to close the tab
                        window.close();
                        window.location.href = 'about:blank';
                        window.open('', '_self').close();
                        // If all close attempts fail, show game over screen
                        document.body.innerHTML = '<div style="height:100vh;display:flex;justify-content:center;align-items:center;background:#000;color:#e74c3c;font-size:48px;">Your soul is mine...</div>';
                    }
                }, 1000);
                
                return;
            }
            
            resultTitle.textContent = 'You Lost!';
            resultTitle.style.color = '#e74c3c';
            resultMessage.innerHTML = `You got a ${loot.item.name} (${loot.rarity}).<br>You lost your soul... Want to try betting again?<br>If you lose again, I will take your soul forever.`;
            continueBtn.style.display = 'none';
            tryAgainBtn.style.display = 'block';
        }
        
        // Show result popup
        resultPopup.style.display = 'flex';
    });
    
    // Try again button
    tryAgainBtn.addEventListener('click', () => {
        resultPopup.style.display = 'none';
        betPopup.style.display = 'flex';
        resizeCanvas();
    });
    
    // Continue playing button
    continueBtn.addEventListener('click', () => {
        resultPopup.style.display = 'none';
    });
});

// Global error handlers to prevent page crashes
window.addEventListener('unhandledrejection', event => {
    console.error('🚨 [GLOBAL] Unhandled promise rejection:', event.reason);
    console.error('🚨 [GLOBAL] Promise that rejected:', event.promise);
    
    // Prevent the default behavior (page crash)
    event.preventDefault();
    
    // Reset purchase flag if it was related to purchase
    if (typeof purchaseInProgress !== 'undefined') {
        purchaseInProgress = false;
        console.log('🚨 [GLOBAL] Reset purchaseInProgress flag due to unhandled rejection');
    }
});

window.addEventListener('error', event => {
    console.error('🚨 [GLOBAL] Uncaught error:', event.error);
    console.error('🚨 [GLOBAL] Error message:', event.message);
    console.error('🚨 [GLOBAL] Error source:', event.filename, 'line', event.lineno);
});
