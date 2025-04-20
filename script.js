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
        { name: "Scythe", image: "png-clipart-darksiders-ii-death-scythe-weapon-reaper-weapon-game-weapon-thumbnail-removebg-preview.png", price: 30000 },
        { name: "Bazooka", image: "s-l400-removebg-preview.png", price: 13000 },
        { name: "Sniper Rifle", image: "sniper.webp", price: 30000 },
        { name: "Heineken Pack", image: "10-104218_heineken-beer-bottles-6-pack-330ml-removebg-preview.png", price: 50 }
    ],
    mythic: [
        { name: "N.U.K.E", image: "NukeIcon.png", price: 1000000 },
        { name: "Diablo Sword", image: "2397813522-removebg-preview.png", price: 7000000 }
    ]
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

// Track consecutive losses
let consecutiveLosses = 0;

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
function doesItemDrop(rarity, isBetting = false) {
    const rates = isBetting ? bettingDropRates : dropRates;
    return Math.random() < rates[rarity];
}

// Function to select a random item from a given array
function getRandomItem(itemArray) {
    const randomIndex = Math.floor(Math.random() * itemArray.length);
    return itemArray[randomIndex];
}

// Function to format price with K, M, B, T, Q, etc. for larger denominations
function formatPrice(price) {
    // Define the suffixes for different scales
    const suffixes = ['', 'K', 'M', 'B', 'T', 'Q', 'Qi', 'S', 'Se', 'O', 'N', 'D'];
    
    // If price is less than 1000, just return it with $ sign
    if (price < 1000) {
        return price + '$';
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
        return nextScaledValue.toFixed(1) + suffixes[nextSuffixIndex] + '$';
    }
    
    // Return the formatted string with 1 decimal place and the appropriate suffix
    return scaledValue.toFixed(1) + suffixes[suffixIndex] + '$';
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

// Function to add item to inventory
function addToInventory(itemName, rarity, count = 1) {
    console.log(`addToInventory called with count: ${count}`);
    // Ensure count is a number
    count = parseInt(count, 10);
    if (isNaN(count) || count < 1) count = 1;
    
    if (!inventory[itemName]) {
        const itemDetails = getItemByName(itemName);
        inventory[itemName] = { 
            count: 0, 
            rarity: rarity,
            price: itemDetails ? itemDetails.price : 0
        };
    }
    
    // Add the items
    inventory[itemName].count += count;
    console.log(`Inventory count for ${itemName} is now: ${inventory[itemName].count}`);
    
    // Save to local storage
    localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
    
    // Update the inventory display
    updateInventoryDisplay();
}

// Function to calculate total inventory value - fixed to prevent doubling
function calculateTotalInventoryValue() {
    // Reset the total value
    let totalValue = 0;
    
    // Loop through each item in the inventory only once
    for (const [name, data] of Object.entries(inventory)) {
        // Get the item details
        const itemDetails = getItemByName(name);
        if (!itemDetails) continue;
        
        // Add the item's value to the total (price × count)
        totalValue += itemDetails.price * data.count;
    }
    
    return totalValue;
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
    
    // Get the total inventory value once
    const totalValue = calculateTotalInventoryValue();
    
    sortedItems.forEach(([name, data]) => {
        const li = document.createElement('li');
        li.classList.add(data.rarity);
        
        const itemIcon = document.createElement('div');
        itemIcon.classList.add('item-icon');
        
        // Fix for undefined rarity - safely access the items array
        let imageUrl = 'default.png';
        try {
            // First try to get the item from its declared rarity
            if (items[data.rarity] && Array.isArray(items[data.rarity])) {
                const foundItem = items[data.rarity].find(item => item.name === name);
                if (foundItem && foundItem.image) {
                    imageUrl = foundItem.image;
                }
            } else {
                // If that fails, search through all rarities
                for (const rarity in items) {
                    if (Array.isArray(items[rarity])) {
                        const foundItem = items[rarity].find(item => item.name === name);
                        if (foundItem && foundItem.image) {
                            imageUrl = foundItem.image;
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
        
        // Get item price
        const itemDetails = getItemByName(name);
        const itemPrice = itemDetails ? itemDetails.price : 0;
        
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
        itemPriceElement.textContent = `${formatPrice(itemPrice)} ${data.count > 1 ? `(Total: ${formatPrice(itemPrice * data.count)})` : ''}`;
        
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
function addItemDirectly(itemName, rarity, count) {
    console.log(`addItemDirectly called with count: ${count}`);
    // Ensure count is a number
    count = parseInt(count, 10);
    if (isNaN(count) || count < 1) count = 1;
    
    // Add items directly with the count parameter
    addToInventory(itemName, rarity, count);
    console.log(`Added ${count} ${itemName}(s) to your inventory!`);
}

// Function to remove items from inventory
function removeItem(itemName, count = 1) {
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
    localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
    
    // Update the inventory display
    updateInventoryDisplay();
    
    console.log(`Successfully removed ${count} ${itemName}(s) from your inventory`);
    return true;
}

// Make functions available in the global scope for console use
window.removeItem = removeItem;

// Create a global object for console commands
window.lootBoxCommands = {
    removeItem: removeItem,
    addItem: function(itemName, rarity, count = 1) {
        addItemDirectly(itemName, rarity, count);
    },
    clearInventory: function() {
        inventory = {};
        localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
        updateInventoryDisplay();
        console.log('Inventory cleared');
    }
};

// Create a simpler global variable for console use
window.removeItems = function(itemName, count = 1) {
    return removeItem(itemName, count);
};

window.addItems = function(itemName, rarity, count = 1) {
    console.log(`addItems called with count: ${count}`);
    // Convert count to a number to ensure it's not being treated as a string
    count = parseInt(count, 10);
    if (isNaN(count) || count < 1) count = 1;
    addItemDirectly(itemName, rarity, count);
    return true;
};

window.clearItems = function() {
    inventory = {};
    localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
    updateInventoryDisplay();
    console.log('Inventory cleared');
    return true;
};

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

// Auto Clicker functionality
let autoClickerInterval;
let isAutoClickerActive = false;

function toggleAutoClicker() {
    const autoClickerBtn = document.getElementById('auto-clicker-btn');
    
    if (isAutoClickerActive) {
        // Stop auto clicker
        clearInterval(autoClickerInterval);
        autoClickerBtn.textContent = 'Auto Clicker';
        autoClickerBtn.classList.remove('active');
    } else {
        // Start auto clicker - open a loot box every 2 seconds
        autoClickerInterval = setInterval(() => {
            const openBoxBtn = document.getElementById('open-box-btn');
            if (openBoxBtn) {
                openBoxBtn.click();
            }
        }, 2000);
        autoClickerBtn.textContent = 'Stop Auto Clicker';
        autoClickerBtn.classList.add('active');
    }
    
    isAutoClickerActive = !isAutoClickerActive;
}

document.addEventListener('DOMContentLoaded', () => {
    // Auto Clicker button event listener
    const autoClickerBtn = document.getElementById('auto-clicker-btn');
    if (autoClickerBtn) {
        autoClickerBtn.addEventListener('click', toggleAutoClicker);
    }
    
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
