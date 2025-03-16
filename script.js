// Define the items with their rarities
const items = {
    common: [
        { name: "Wooden Sword", image: "wooden-sword.png" },
        { name: "Beer", image: "images__2_-removebg-preview.png" }
    ],
    rare: [
        { name: "Sword", image: "92BKHNH_1__07640-removebg-preview.png" },
        { name: "Helmet", image: "images__1_-removebg-preview.png" }
    ],
    epic: [
        { name: "Shield", image: "s-l1200-removebg-preview.png" },
        { name: "Double Sword", image: "51G5FrtyUHL._AC_UF1000_1000_QL80_-removebg-preview.png" },
        { name: "Bomb", image: "8p5fq6br1mub1-removebg-preview.png" }
    ],
    legendary: [
        { name: "Shot Gun", image: "Winchester-SXP-Field-Compact-20-Gauge-26-Barrel-Shotgun-048702004711_image1__23692-removebg-preview.png" },
        { name: "Machine Gun", image: "PEO_M249_Para_ACOG-removebg-preview.png" },
        { name: "Scythe", image: "png-clipart-darksiders-ii-death-scythe-weapon-reaper-weapon-game-weapon-thumbnail-removebg-preview.png" },
        { name: "Bazooka", image: "s-l400-removebg-preview.png" },
        { name: "Sniper Rifle", image: "sniper.webp" },
        { name: "Heineken Pack", image: "10-104218_heineken-beer-bottles-6-pack-330ml-removebg-preview.png" }
    ],
    mythic: [
        { name: "N.U.K.E", image: "NukeIcon.png" },
        { name: "Diablo Sword", image: "2397813522-removebg-preview.png" }
    ]
};

// Define the drop rates for each rarity
const dropRates = {
    common: 0.70,
    rare: 0.50,
    epic: 0.30,
    legendary: 0.10,
    mythic: 0.01
};

// Initialize inventory
let inventory = JSON.parse(localStorage.getItem('lootBoxInventory')) || {};

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
function doesItemDrop(rarity) {
    return Math.random() < dropRates[rarity];
}

// Function to select a random item from a given array
function getRandomItem(itemArray) {
    const randomIndex = Math.floor(Math.random() * itemArray.length);
    return itemArray[randomIndex];
}

// Function to get a random item based on rarity chances
function getRandomLoot() {
    // Check each rarity from highest to lowest
    if (doesItemDrop('mythic')) {
        return { item: getRandomItem(items.mythic), rarity: 'mythic' };
    } else if (doesItemDrop('legendary')) {
        return { item: getRandomItem(items.legendary), rarity: 'legendary' };
    } else if (doesItemDrop('epic')) {
        return { item: getRandomItem(items.epic), rarity: 'epic' };
    } else if (doesItemDrop('rare')) {
        return { item: getRandomItem(items.rare), rarity: 'rare' };
    } else {
        // Default to common if nothing else drops
        return { item: getRandomItem(items.common), rarity: 'common' };
    }
}

// Function to add item to inventory
function addToInventory(itemName, rarity) {
    if (!inventory[itemName]) {
        inventory[itemName] = { count: 0, rarity: rarity };
    }
    inventory[itemName].count++;
    
    // Save to local storage
    localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
    
    // Update the inventory display
    updateInventoryDisplay();
}

// Function to update the inventory display
function updateInventoryDisplay() {
    inventoryList.innerHTML = '';
    
    // Sort items by rarity (mythic first, common last)
    const rarityOrder = { 'mythic': 0, 'legendary': 1, 'epic': 2, 'rare': 3, 'common': 4 };
    
    const sortedItems = Object.entries(inventory).sort((a, b) => {
        // First sort by rarity
        const rarityDiff = rarityOrder[a[1].rarity] - rarityOrder[b[1].rarity];
        if (rarityDiff !== 0) return rarityDiff;
        
        // Then sort alphabetically
        return a[0].localeCompare(b[0]);
    });
    
    sortedItems.forEach(([name, data]) => {
        const li = document.createElement('li');
        li.classList.add(data.rarity);
        
        const itemIcon = document.createElement('div');
        itemIcon.classList.add('item-icon');
        itemIcon.style.backgroundImage = `url('images/${items[data.rarity].find(item => item.name === name)?.image || 'default.png'}')`;
        
        const itemText = document.createElement('span');
        itemText.textContent = `${name} x${data.count}`;
        
        li.appendChild(itemIcon);
        li.appendChild(itemText);
        inventoryList.appendChild(li);
    });
}

// Simple function to directly add items for testing
function addItemDirectly(itemName, rarity, count) {
    for (let i = 0; i < count; i++) {
        addToInventory(itemName, rarity);
    }
    alert(`Added ${count} ${itemName}(s) to your inventory!`);
}

// Function to handle conversions - simplified approach
function handleConversion(itemType, amount) {
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
            localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
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
            localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
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
            localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
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
            localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
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
            localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
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
            localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
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
            localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
            updateInventoryDisplay();
            alert('Conversion successful! You received 1 Machine Gun');
            return;
        }
    }
    
    // If we get here, the conversion failed
    alert('Sorry, you are not rich enough :(');
}

document.addEventListener('DOMContentLoaded', () => {
    // Event listener for conversion items
    const conversionItems = document.querySelectorAll('.conversion-item');
    conversionItems.forEach(item => {
        item.addEventListener('click', () => {
            const itemName = item.getAttribute('data-item');
            const itemAmount = parseInt(item.getAttribute('data-amount'));
            handleConversion(itemName, itemAmount);
        });
    });

    // Event listener for opening the loot box
    openBoxBtn.addEventListener('click', () => {
        // Disable the button during animation
        openBoxBtn.disabled = true;
        
        // Close any previous result
        itemResult.classList.add('hidden');
        
        // Animate the box opening
        lootBox.classList.add('open');
        
        // Play sound effect (optional)
        // const openSound = new Audio('sounds/chest-open.mp3');
        // openSound.play();
        
        // Get random loot
        const loot = getRandomLoot();
        
        // We'll show the epic overlay later if it's an epic item
        
        // Wait for animation to complete
        setTimeout(() => {
            // Display the item
            itemName.textContent = loot.item.name;
            itemRarity.textContent = loot.rarity.charAt(0).toUpperCase() + loot.rarity.slice(1);
            itemRarity.className = loot.rarity;
            itemImage.style.backgroundImage = `url('images/${loot.item.image}')`;            
            
            // Show epic overlay if epic item
            if (loot.rarity === 'epic') {
                epicOverlay.classList.remove('hidden');
            } else if (loot.rarity === 'common') {
                epicOverlay.style.backgroundImage = "url('images/Screenshot_2025-03-16_at_11.02.49_AM-removebg-preview.png')";
                epicOverlay.classList.remove('hidden');
            } else {
                epicOverlay.classList.add('hidden');
            }
            
            // Show the result
            itemResult.classList.remove('hidden');
            
            // Add to inventory
            addToInventory(loot.item.name, loot.rarity);
            
            // Re-enable the button
            openBoxBtn.disabled = false;
            
            // Reset the box after a delay
            setTimeout(() => {
                lootBox.classList.remove('open');
                // Hide epic overlay
                epicOverlay.classList.add('hidden');
            }, 500); // Shortened cooldown duration
        }, 1000);
    });

    // Initialize the inventory display on page load
    updateInventoryDisplay();
});
