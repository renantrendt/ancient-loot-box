# HIGH STAKES MODE - IMPLEMENTATION PLAN

## **PROJECT OVERVIEW**

### **Feature Requirements**
**Part 1:** Add "High Stakes" button in bottom right corner
- No Auto Clicker functionality
- No Conversions available

**Part 2:** Replace loot box opening animation with spinning line
- Horizontal line across center of screen (middle-middle)
- Items flow left-to-right in random order
- Duration: 5-15 seconds (random)
- Item that stops in center is the reward

**Part 3:** Item selection feedback
- Yellow outline around selected item
- Item goes to High Stakes inventory (separate from normal)

**Part 4:** Inventory management
- 10-item limit in High Stakes mode
- Keep/Delete buttons, for every roll
- When inventory is 100% full, the next rolled item, if Keep, is clicked will delete the 1st item in the item list and add the rolled item in it's place

**Part 5:** High Stakes pricing system
- Completely different prices from normal mode
- Restore normal prices when returning to normal mode

---

## **CURRENT SYSTEM ANALYSIS**

### **Existing Game Structure**
```javascript
// Items Structure (script.js lines 1-32)
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
```

### **Current Loot Box Animation** (script.js lines 506-580)
```javascript
// Current opening mechanism
openBoxBtn.addEventListener('click', () => {
    openBoxBtn.disabled = true;
    itemResult.classList.add('hidden');
    lootBox.classList.add('open'); // Triggers bounce animation
    
    const loot = getRandomLoot();
    
    setTimeout(() => {
        // Display item after 1 second
        itemName.textContent = loot.item.name;
        itemRarity.textContent = loot.rarity.charAt(0).toUpperCase() + loot.rarity.slice(1);
        itemRarity.className = loot.rarity;
        itemImage.style.backgroundImage = `url('images/${loot.item.image}')`;
        
        itemResult.classList.remove('hidden');
        addToInventory(loot.item.name, loot.rarity);
        openBoxBtn.disabled = false;
        
        setTimeout(() => {
            lootBox.classList.remove('open');
            epicOverlay.classList.add('hidden');
        }, 500);
    }, 1000);
});
```

### **Current CSS Animations** (styles.css lines 379-396)
```css
.loot-box.open {
    animation: bounce-left-right 1.5s ease-in-out;
    transform: translateX(0);
    background-image: url('images/Screenshot_2025-03-15_at_8.47.59_PM-removebg-preview.png');
}

@keyframes bounce-left-right {
    0% { transform: translateX(0); }
    15% { transform: translateX(-50px); }
    30% { transform: translateX(40px); }
    45% { transform: translateX(-30px); }
    60% { transform: translateX(20px); }
    75% { transform: translateX(-10px); }
    90% { transform: translateX(5px); }
    100% { transform: translateX(0); }
}
```

### **Auto Clicker System** (script.js lines 470-502)
```javascript
// Auto Clicker functionality
let autoClickerInterval;
let isAutoClickerActive = false;

function toggleAutoClicker() {
    const autoClickerBtn = document.getElementById('auto-clicker-btn');
    
    if (isAutoClickerActive) {
        clearInterval(autoClickerInterval);
        autoClickerBtn.textContent = 'Auto Clicker';
        autoClickerBtn.classList.remove('active');
    } else {
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
```

### **Conversion System** (index.html lines 26-36)
```html
<div class="conversions">
    <h3>Conversions</h3>
    <ul>
        <li class="conversion-item" data-item="helmet" data-amount="10" onclick="handleConversion('helmet', 10)">10 Helmets = 1 Scythe</li>
        <li class="conversion-item" data-item="bomb" data-amount="30" onclick="handleConversion('bomb', 30)">30 Bombs = 1 N.U.K.E</li>
        <li class="conversion-item" data-item="beer" data-amount="24" onclick="handleConversion('beer', 24)">24 Beers = 1 Heineken Pack</li>
        <li class="conversion-item" data-item="sword" data-amount="10" onclick="handleConversion('sword', 10)">10 Swords = 5 Double Swords</li>
        <li class="conversion-item" data-item="double-sword" data-amount="30" onclick="handleConversion('double-sword', 30)">30 Double Swords = 1 Diablo Sword</li>
        <li class="conversion-item" data-item="sniper-rifle" data-amount="4" onclick="handleConversion('sniper-rifle', 4)">4 Sniper Rifles = 1 Bazooka</li>
        <li class="conversion-item" data-item="shotgun" data-amount="2" onclick="handleConversion('shotgun', 2)">2 Shot Guns = 1 Machine Gun</li>
    </ul>
</div>
```

### **Inventory System** (script.js lines 135-159)
```javascript
// Current inventory management
function addToInventory(itemName, rarity, count = 1) {
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
    
    inventory[itemName].count += count;
    localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
    updateInventoryDisplay();
}

// Storage: localStorage + Supabase sync
let inventory = JSON.parse(localStorage.getItem('lootBoxInventory')) || {};
```

### **Functions to Reuse**
- `getRandomLoot(isBetting = false)` - Item selection logic
- `addToInventory(itemName, rarity, count)` - Inventory management
- `updateInventoryDisplay()` - UI updates
- `formatPrice(price)` - Price formatting
- `getItemByName(name)` - Item lookup
- `calculateTotalInventoryValue()` - Value calculation

---

## **HIGH STAKES SPECIFICATIONS**

### **New Pricing System**
```javascript
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
```

### **Spinning Line Animation Requirements**
- **Position:** Horizontal line across center of screen
- **Direction:** Items flow left-to-right
- **Duration:** Random between 5-15 seconds
- **Content:** All 15 items in random order
- **Selection:** Item that stops in center gets yellow outline
- **Visual:** Square containers with item images

### **Inventory Management**
- **Limit:** 10 items maximum
- **Keep/Delete:** Buttons appear for every roll below spinning line
- **Keep Logic:** If inventory full, removes 1st item and adds new item; if not full, just adds new item
- **Delete Logic:** Discards the rolled item regardless of inventory status
- **Separation:** Completely separate from normal inventory
- **Restoration:** Normal inventory restored when exiting High Stakes

---

## **IMPLEMENTATION PLAN**

### **Phase 1: Core Infrastructure**
1. **Add High Stakes Button**
   - Position: Bottom right corner
   - Style: Similar to existing buttons
   - Function: Toggle High Stakes mode

2. **Game Mode State Management**
   - Global variable: `isHighStakesMode = false`
   - Mode switching functions
   - UI state management

3. **Separate Inventory System**
   - `highStakesInventory = {}`
   - `normalInventory` backup
   - 10-item limit enforcement

4. **High Stakes Pricing**
   - Price override system
   - Dynamic price switching

### **Phase 2: UI Modifications**
5. **Disable Auto Clicker**
   - Hide button in High Stakes mode
   - Clear existing intervals

6. **Hide Conversions**
   - Hide conversion section
   - Disable conversion handlers

7. **Hide Betting System**
   - Hide bet button in High Stakes mode
   - Disable betting functionality

8. **Spinning Line Structure**
   - HTML container for spinning line
   - Item squares with images
   - Center selection indicator

### **Phase 3: Animation System**
9. **CSS Animations**
   - Horizontal scrolling animation
   - Item flow effects
   - Yellow outline selection

10. **JavaScript Logic**
    - Random item ordering
    - Timing control (5-15 seconds)
    - Selection detection

### **Phase 4: Integration**
11. **Loot Box Handler Modification**
    - Replace chest animation
    - Implement spinning line
    - Item selection logic

12. **Keep/Delete System**
    - Buttons appear for every roll
    - Keep logic: check if inventory full, if so delete 1st item before adding new
    - Delete logic: discard rolled item

13. **Mode Switching**
    - Return to normal mode
    - Inventory restoration
    - UI reset

---

## **TECHNICAL IMPLEMENTATION DETAILS**

### **Game Mode State**
```javascript
// Global state variables
let isHighStakesMode = false;
let highStakesInventory = {};
let normalInventoryBackup = {};
let currentSpinningItems = [];
let spinningAnimation = null;
```

### **HTML Structure for Spinning Line**
```html
<div id="spinning-line-container" class="spinning-line-container hidden">
    <div class="spinning-line">
        <div class="items-track" id="items-track">
            <!-- Items will be dynamically generated here -->
        </div>
        <div class="selection-indicator"></div>
    </div>
    <div class="keep-delete-buttons hidden" id="keep-delete-buttons">
        <button id="keep-btn">Keep</button>
        <button id="delete-btn">Delete</button>
    </div>
</div>
```

### **CSS for Spinning Animation**
```css
.spinning-line-container {
    position: fixed;
    top: 50%;
    left: 0;
    width: 100%;
    height: 100px;
    transform: translateY(-50%);
    z-index: 1000;
}

.spinning-line {
    position: relative;
    width: 100%;
    height: 80px;
    overflow: hidden;
    border: 2px solid #f1c40f;
    border-radius: 10px;
    background-color: rgba(0, 0, 0, 0.8);
}

.items-track {
    display: flex;
    align-items: center;
    height: 100%;
    animation: spin-items linear infinite;
}

@keyframes spin-items {
    from { transform: translateX(100%); }
    to { transform: translateX(-100%); }
}

.item-square {
    width: 60px;
    height: 60px;
    margin: 0 10px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    border: 2px solid transparent;
    border-radius: 8px;
    flex-shrink: 0;
}

.item-square.selected {
    border-color: #f1c40f;
    box-shadow: 0 0 20px #f1c40f;
}

.selection-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 80px;
    height: 80px;
    transform: translate(-50%, -50%);
    border: 3px solid #e74c3c;
    border-radius: 8px;
    pointer-events: none;
}
```

### **JavaScript Implementation**
```javascript
// High Stakes mode initialization
function enterHighStakesMode() {
    isHighStakesMode = true;
    
    // Backup normal inventory
    normalInventoryBackup = JSON.parse(JSON.stringify(inventory));
    
    // Clear current inventory and switch to High Stakes
    inventory = JSON.parse(localStorage.getItem('highStakesInventory')) || {};
    
    // Update UI
    document.getElementById('auto-clicker-container').style.display = 'none';
    document.querySelector('.conversions').style.display = 'none';
    document.querySelector('.bet-section').style.display = 'none';
    document.getElementById('high-stakes-btn').textContent = 'Exit High Stakes';
    
    updateInventoryDisplay();
}

// Spinning line logic
function startSpinningLine() {
    const container = document.getElementById('spinning-line-container');
    const track = document.getElementById('items-track');
    
    // Generate random item sequence
    const allItems = [...items.common, ...items.rare, ...items.epic, ...items.legendary, ...items.mythic];
    currentSpinningItems = [];
    
    // Create multiple cycles of items for smooth animation
    for (let cycle = 0; cycle < 5; cycle++) {
        const shuffled = [...allItems].sort(() => Math.random() - 0.5);
        currentSpinningItems.push(...shuffled);
    }
    
    // Create item squares
    track.innerHTML = '';
    currentSpinningItems.forEach(item => {
        const square = document.createElement('div');
        square.className = 'item-square';
        square.style.backgroundImage = `url('images/${item.image}')`;
        square.dataset.itemName = item.name;
        track.appendChild(square);
    });
    
    // Show container
    container.classList.remove('hidden');
    
    // Random duration between 5-15 seconds
    const duration = Math.random() * 10000 + 5000; // 5000-15000ms
    
    // Stop animation and select item
    setTimeout(() => {
        selectWinningItem();
    }, duration);
}

// Item selection logic
function selectWinningItem() {
    const track = document.getElementById('items-track');
    const squares = track.querySelectorAll('.item-square');
    const container = document.getElementById('spinning-line-container');
    
    // Stop animation
    track.style.animationPlayState = 'paused';
    
    // Find item closest to center
    const containerRect = container.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    
    let closestSquare = null;
    let closestDistance = Infinity;
    
    squares.forEach(square => {
        const rect = square.getBoundingClientRect();
        const squareCenterX = rect.left + rect.width / 2;
        const distance = Math.abs(squareCenterX - centerX);
        
        if (distance < closestDistance) {
            closestDistance = distance;
            closestSquare = square;
        }
    });
    
    // Highlight selected item
    if (closestSquare) {
        closestSquare.classList.add('selected');
        const itemName = closestSquare.dataset.itemName;
        
        // Find item details
        const allItems = [...items.common, ...items.rare, ...items.epic, ...items.legendary, ...items.mythic];
        const selectedItem = allItems.find(item => item.name === itemName);
        
        if (selectedItem) {
            // Get rarity
            let rarity = '';
            for (const [rarityKey, rarityItems] of Object.entries(items)) {
                if (rarityItems.includes(selectedItem)) {
                    rarity = rarityKey;
                    break;
                }
            }
            
            // Handle inventory
            handleHighStakesItem(selectedItem, rarity);
        }
    }
    
    // Hide spinning line after 2 seconds
    setTimeout(() => {
        container.classList.add('hidden');
        track.style.animationPlayState = 'running';
    }, 2000);
}

// High Stakes inventory management
function handleHighStakesItem(item, rarity) {
    // Always show keep/delete buttons for every roll
    document.getElementById('keep-delete-buttons').classList.remove('hidden');
    
    // Store pending item
    window.pendingHighStakesItem = { item, rarity };
}

// Keep/Delete button handlers
document.getElementById('keep-btn').addEventListener('click', () => {
    if (window.pendingHighStakesItem) {
        const inventorySize = Object.keys(inventory).length;
        
        // If inventory is full (10 items), remove the first item
        if (inventorySize >= 10) {
            const inventoryKeys = Object.keys(inventory);
            if (inventoryKeys.length > 0) {
                delete inventory[inventoryKeys[0]];
            }
        }
        
        // Add new item
        addToHighStakesInventory(window.pendingHighStakesItem.item.name, window.pendingHighStakesItem.rarity);
        
        // Clean up
        window.pendingHighStakesItem = null;
        document.getElementById('keep-delete-buttons').classList.add('hidden');
    }
});

document.getElementById('delete-btn').addEventListener('click', () => {
    // Just ignore the new item
    window.pendingHighStakesItem = null;
    document.getElementById('keep-delete-buttons').classList.add('hidden');
});

// High Stakes inventory functions
function addToHighStakesInventory(itemName, rarity) {
    if (!inventory[itemName]) {
        inventory[itemName] = { 
            count: 0, 
            rarity: rarity,
            price: highStakesPrices[itemName] || 0
        };
    }
    
    inventory[itemName].count += 1;
    localStorage.setItem('highStakesInventory', JSON.stringify(inventory));
    updateInventoryDisplay();
}

// Exit High Stakes mode
function exitHighStakesMode() {
    isHighStakesMode = false;
    
    // Save High Stakes inventory
    localStorage.setItem('highStakesInventory', JSON.stringify(inventory));
    
    // Restore normal inventory
    inventory = normalInventoryBackup;
    localStorage.setItem('lootBoxInventory', JSON.stringify(inventory));
    
    // Restore UI
    document.getElementById('auto-clicker-container').style.display = 'block';
    document.querySelector('.conversions').style.display = 'block';
    document.querySelector('.bet-section').style.display = 'block';
    document.getElementById('high-stakes-btn').textContent = 'High Stakes';
    
    updateInventoryDisplay();
}
```

---

## **TESTING CHECKLIST**

### **Functionality Tests**
- [ ] High Stakes button toggles mode correctly
- [ ] Auto clicker disappears in High Stakes mode
- [ ] Conversions disappear in High Stakes mode
- [ ] Betting system disappears in High Stakes mode
- [ ] Spinning line appears and animates correctly
- [ ] Items flow left-to-right in random order
- [ ] Animation stops after 5-15 seconds
- [ ] Correct item is selected in center
- [ ] Yellow outline appears on selected item
- [ ] High Stakes prices are applied correctly
- [ ] 10-item inventory limit is enforced
- [ ] Keep/Delete buttons appear for every roll
- [ ] Keep with full inventory removes 1st item and adds new item
- [ ] Keep with non-full inventory just adds new item
- [ ] Delete always discards rolled item regardless of inventory status
- [ ] Exit High Stakes restores normal inventory
- [ ] Exit High Stakes restores normal prices
- [ ] Supabase sync works with separate inventories

### **Edge Cases**
- [ ] Rapid clicking during animation
- [ ] Multiple mode switches
- [ ] Full inventory with different item types
- [ ] Switching modes while spinning (should not be possible)
- [ ] Browser refresh in High Stakes mode (stay at high stake)
- [ ] Network issues during Supabase sync (almost impossible, like 1 in a milion or sm)

---

## **QUESTIONS FOR CLARIFICATION**

1. **Mode Toggle**: Should High Stakes be a toggle or one-way entrance?
toggle
2. **Item Display**: Show actual images or colored squares in spinning line?
Show the images of the items
3. **Animation Direction**: Line moves right-to-left while items flow left-to-right?
No just everything goes left-to-right
4. **Inventory Delete**: User choice or always delete first item?
Allways delete first item, to be evil
5. **Mode Switching**: Visible "Return to Normal" button or automatic?
Vissible
6. **Visual Differences**: Different UI themes for High Stakes mode?
No
7. **Drop Rates**: Same rates as normal mode or different?
Same, but Diablo Sword is 0.002%, and N.U.K.E is 0.087%

### **Updated Drop Rates for High Stakes Mode**
```javascript
// High Stakes drop rates - same as normal except for mythic items
const highStakesDropRates = {
    common: 0.70,
    rare: 0.50,
    epic: 0.30,
    legendary: 0.10,
    mythic: 0.01 // Base mythic rate
};

// Special mythic item rates within mythic category
const mythicItemRates = {
    "Diablo Sword": 0.002,  // 0.002% chance
    "N.U.K.E": 0.087        // 0.087% chance
};
```
8. **Selection Effects**: Special effects for winning item?
No
9. **Data Storage**: Separate localStorage/Supabase for High Stakes?
Supabase, gimme the SQL code
10. **Betting System**: Available in High Stakes mode?
No

---

## **FILES TO MODIFY**

1. **index.html** - Add High Stakes button and spinning line HTML
2. **script.js** - Add High Stakes logic and spinning animation
3. **styles.css** - Add High Stakes styling and animations
4. **js/supabase.js** - Handle separate inventory storage (if needed)

---

## **ESTIMATED DEVELOPMENT TIME**

- **Phase 1**: 2-3 hours (Core infrastructure)
- **Phase 2**: 1-2 hours (UI modifications)
- **Phase 3**: 3-4 hours (Animation system)
- **Phase 4**: 2-3 hours (Integration and testing)

**Total**: 8-12 hours
OMAGAAAAAAA :OOOOOOO

---

*This plan provides a comprehensive roadmap for implementing the High Stakes mode feature while maintaining compatibility with the existing game system.* 