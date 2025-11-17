/* script.js - FINALIZED CODE FOR ALL SCENARIOS AND SCORING */

const medicalBox = document.getElementById('medical-box');
const equipmentItems = document.querySelectorAll('.equipment-item');
const message = document.getElementById('message');
const scenarioText = document.getElementById('scenario-text');
const nextButton = document.getElementById('next-button');
const scoreDisplay = document.getElementById('score-display');

// --- Game State Variables ---
let currentDisaster = 'earthquake'; 
let currentPlayerIndex = 0;
let playerScores = []; // Stores scores for each turn/player

// All 6 disaster scenarios
const disasters = [
    { name: 'Earthquake (Trauma, bleeding, broken bones)', type: 'earthquake' },
    { name: 'Flash Flood (Water contamination, hypothermia, drowning risk)', type: 'flood' },
    { name: 'Wildfire (Burn injuries, smoke inhalation, evacuation)', type: 'fire' },
    { name: 'Tornado (Structural collapse, debris injuries)', type: 'tornado' },
    { name: 'Tsunami (Water survival, large-scale trauma)', type: 'tsunami' },
    { name: 'Chemical Spill (Airborne toxins, exposure)', type: 'chemical' }
];

// --- Scoring Constants ---
const POINTS_CORRECT = 10;
const POINTS_INCORRECT_PENALTY = -5;
const POINTS_MISSED_PENALTY = -3;

// --- Drag and Drop Functions ---

equipmentItems.forEach(item => {
    item.addEventListener('dragstart', (e) => {
        if (item.classList.contains('dropped')) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('text/disaster', item.dataset.disaster);
        e.dataTransfer.setData('text/name', item.dataset.name);
        e.currentTarget.classList.add('dragging');
    });

    item.addEventListener('dragend', (e) => {
        e.currentTarget.classList.remove('dragging');
    });
});

medicalBox.addEventListener('dragover', (e) => {
    e.preventDefault();
});

medicalBox.addEventListener('dragenter', (e) => {
    e.preventDefault();
    medicalBox.classList.add('hover');
});

medicalBox.addEventListener('dragleave', () => {
    medicalBox.classList.remove('hover');
});

medicalBox.addEventListener('drop', (e) => {
    e.preventDefault();
    medicalBox.classList.remove('hover');

    const itemDisaster = e.dataTransfer.getData('text/disaster');
    const itemName = e.dataTransfer.getData('text/name'); 
    
    const draggedElement = document.querySelector(`.equipment-item[data-name="${itemName}"]:not(.dropped)`);

    if (!draggedElement || draggedElement.classList.contains('dropped')) return; 

    // An item is essential if it is a general item OR it matches the current disaster type.
    const isEssential = itemDisaster === currentDisaster || itemDisaster === 'general';
    const isIrrelevant = itemDisaster === 'none';

    if (isEssential) {
        message.textContent = `${itemName} is a CORRECT match for ${currentDisaster.toUpperCase()}! (+${POINTS_CORRECT} pts)`;
        draggedElement.classList.add('correct', 'dropped', 'essential-correct');
    } else if (isIrrelevant) {
        message.textContent = `${itemName} is NOT a medical essential. Penalty! (${POINTS_INCORRECT_PENALTY} pts)`;
        draggedElement.classList.add('incorrect', 'dropped', 'irrelevant-incorrect');
    } else {
        message.textContent = `${itemName} is NOT the top priority for ${currentDisaster.toUpperCase()}. Penalty! (${POINTS_INCORRECT_PENALTY} pts)`;
        draggedElement.classList.add('incorrect', 'dropped', 'wrong-scenario-incorrect');
    }
    
    draggedElement.draggable = false;
    medicalBox.appendChild(draggedElement);
    checkTurnEnd();
});


// --- Game Logic and Scoring Functions ---

function getEssentialItemsCount(disasterType) {
    let count = 0;
    equipmentItems.forEach(item => {
        // Essential items are those that match the specific disaster OR are general items
        if (item.dataset.disaster === disasterType || item.dataset.disaster === 'general') {
            count++;
        }
    });
    return count;
}

function checkTurnEnd() {
    nextButton.style.display = 'block';
    nextButton.textContent = `End ${disasters[currentPlayerIndex].type} Turn and Show Score`;
}

function calculateScore() {
    let score = 0;
    
    const correctDropped = medicalBox.querySelectorAll('.essential-correct').length;
    score += correctDropped * POINTS_CORRECT;

    const incorrectDropped = medicalBox.querySelectorAll('.irrelevant-incorrect, .wrong-scenario-incorrect').length;
    score += incorrectDropped * POINTS_INCORRECT_PENALTY;

    const totalEssentials = getEssentialItemsCount(currentDisaster);
    const missedEssentials = totalEssentials - correctDropped;
    
    score += missedEssentials * POINTS_MISSED_PENALTY;

    playerScores[currentPlayerIndex] = {
        disaster: disasters[currentPlayerIndex].type,
        score: score,
        correct: correctDropped,
        incorrect: incorrectDropped,
        missed: missedEssentials
    };

    displayScore(score);
    
    nextButton.textContent = (currentPlayerIndex < disasters.length - 1) ? "Next Disaster Scenario" : "View Final Results";
}

function displayScore(score) {
    const currentScoreData = playerScores[currentPlayerIndex];
    scoreDisplay.innerHTML = `
        <p>🚨 **${currentScoreData.disaster.toUpperCase()} SCORE:** ${score} points 🚨</p>
        <p>✅ Correct Items Selected: ${currentScoreData.correct} (+${currentScoreData.correct * POINTS_CORRECT} pts)</p>
        <p>❌ Wrong/Non-Essential Items Added: ${currentScoreData.incorrect} (${currentScoreData.incorrect * POINTS_INCORRECT_PENALTY} pts)</p>
        <p>⚠️ Essential Items Missed: ${currentScoreData.missed} (${currentScoreData.missed * POINTS_MISSED_PENALTY} pts)</p>
    `;
}

function nextPlayer() {
    // If the score hasn't been calculated for the current turn, do it now
    if (!playerScores[currentPlayerIndex] || !scoreDisplay.innerHTML) {
        calculateScore();
        return;
    }

    currentPlayerIndex++;

    if (currentPlayerIndex < disasters.length) {
        // Move to the next scenario
        currentDisaster = disasters[currentPlayerIndex].type;
        scenarioText.textContent = disasters[currentPlayerIndex].name;
        message.textContent = `Player ${currentPlayerIndex + 1}'s turn. NEW Scenario: ${disasters[currentPlayerIndex].type.toUpperCase()}!`;
        scoreDisplay.innerHTML = '';
        
        resetEquipment();
    } else {
        // Game Over - Display final results
        displayFinalResults();
    }
}

function displayFinalResults() {
    let finalHTML = "<h2>FINAL GAME RESULTS 🏆</h2>";
    let totalScore = 0;
    
    playerScores.forEach((data, index) => {
        finalHTML += `<p>Disaster: **${data.disaster.toUpperCase()}** - Score: **${data.score}** points</p>`;
        totalScore += data.score;
    });

    finalHTML += `<hr><h3>TOTAL CUMULATIVE SCORE: ${totalScore} points</h3>`;
    message.textContent = "All scenarios complete! Total Score:";
    scoreDisplay.innerHTML = finalHTML;
    
    nextButton.textContent = "Restart Game";
    nextButton.onclick = () => window.location.reload();
}

function resetEquipment() {
    const equipmentArea = document.getElementById('equipment-area');
    const allEquipment = document.querySelectorAll('.equipment-item');

    // Move all items back to the equipment area
    allEquipment.forEach(item => {
        equipmentArea.appendChild(item);
        item.classList.remove('correct', 'dropped', 'essential-correct', 'irrelevant-incorrect', 'wrong-scenario-incorrect', 'incorrect');
        item.draggable = true;
    });

    nextButton.style.display = 'none';
    nextButton.onclick = nextPlayer;
}

// Initial setup
resetEquipment();
scoreDisplay.innerHTML = '';
// Set the very first scenario prompt
scenarioText.textContent = disasters[currentPlayerIndex].name;