// Simple script to ensure buttons work
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded - buttons.js');
    
    // Get button elements
    const openBoxBtn = document.getElementById('open-box-btn');
    const betBtn = document.getElementById('bet-btn');
    
    console.log('Open box button:', openBoxBtn);
    console.log('Bet button:', betBtn);
    
    // Add event listener to Open Loot Box button
    if (openBoxBtn) {
        openBoxBtn.addEventListener('click', function() {
            console.log('Open box button clicked');
            alert('Open Loot Box button clicked!');
        });
    } else {
        console.error('Open box button not found');
    }
    
    // Add event listener to Bet button
    if (betBtn) {
        betBtn.addEventListener('click', function() {
            console.log('Bet button clicked');
            alert('Bet button clicked!');
        });
    } else {
        console.error('Bet button not found');
    }
});
