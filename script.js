// Screen elements
const homeScreen = document.getElementById('homeScreen');
const importScreen = document.getElementById('importScreen');
const endScreen = document.getElementById('endScreen');
const jsonTextArea = document.getElementById('jsonData');
const flashcardScreen = document.getElementById('flashcardScreen');
const flashcard = document.getElementById('flashcard');
const themeSelect = document.getElementById('themeSelect');

const nextDiv = document.getElementById('nextDiv');
const wrongButton = document.getElementById('wrongButton');
const mehButton = document.getElementById('mehButton');
const rightButton = document.getElementById('rightButton');

let score = {
    right: 0,
    wrong: 0,
    meh: 0
};

const sampleData = {
    "theme": "European Capitals",
    "questions": [
        {
            "question": "What is the capital of France?",
            "answer": "Paris"
        },
        {
            "question": "What is the capital of Germany?",
            "answer": "Berlin"
        },
        {
            "question": "What is the capital of Spain?",
            "answer": "Madrid"
        }
    ]
};
const sampleJson = JSON.stringify(sampleData, null, 2);

let currentFlashcards = [];
let currentCardIndex = 0;

for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    const flashcards = JSON.parse(value);
    currentFlashcards.push(flashcards);
    AddThemeToStartMenu(flashcards);
}

// Function to switch screens
function showScreen(screen) {
    homeScreen.style.display = 'none';
    importScreen.style.display = 'none';
    flashcardScreen.style.display = 'none';
    endScreen.style.display = 'none';
    screen.style.display = 'block';
}

function AddThemeToStartMenu(flashcards) {
    const option = new Option(flashcards.theme, flashcards.theme);
    themeSelect.add(option);
}

// Show homescreen initially
showScreen(homeScreen);

// Event listeners
document.getElementById('navigateToImportScreenButton').addEventListener('click', () => {
    showScreen(importScreen);
    jsonTextArea.value = sampleJson;
});

document.getElementById('importButton').addEventListener('click', () => {
    const jsonData = document.getElementById('jsonData').value;

    try {
        const flashcards = JSON.parse(jsonData);
        localStorage.setItem(flashcards.theme, jsonData); // Save to local storage
        // Add theme to select dropdown
        AddThemeToStartMenu(flashcards);
        showScreen(homeScreen);
    } catch (e) {
        alert('Invalid JSON');
    }
});

// Event listener for theme selection
document.getElementById('newButton').addEventListener('click', (event) => {
    nextDiv.style.visibility = 'hidden';
    currentFlashcards = loadFlashcards(themeSelect.value);
    currentCardIndex = 0;
    showScreen(flashcardScreen);
    showFlashcard();
    initScore();
});

document.getElementById('restartButton').addEventListener('click', (event) => {
    currentCardIndex = 0;
    showFlashcard();
    initScore();
});

document.getElementById('homeButton').addEventListener('click', (event) => {
    showScreen(homeScreen);
});

// Flip card functionality
flashcard.addEventListener('click', () => {
    flashcard.classList.toggle('flip');
    nextDiv.style.visibility = 'visible';
});

// Next card functionality
wrongButton.addEventListener('click', () => {
    score.wrong++;
    nextCard();
});

mehButton.addEventListener('click', () => {
    score.meh++;
    nextCard();
});

rightButton.addEventListener('click', () => {
    score.right++;
    nextCard();
});

function initScore() {
    let score = {
        right: 0,
        wrong: 0,
        meh: 0
    };
}

function nextCard() {
    nextDiv.style.visibility = 'hidden';
    if (currentCardIndex < currentFlashcards.length - 1) {
        currentCardIndex = (currentCardIndex + 1) % currentFlashcards.length;
        showFlashcard();
    }
    else {
        showEndScreen();
    }
}

// Logic for the flashcard screen (loading questions, flipping cards, etc.) will go here
function loadFlashcards(theme) {
    const flashcards = JSON.parse(localStorage.getItem(theme));
    return flashcards.questions;
}

// Function to display a flashcard
function showFlashcard() {
    if (currentFlashcards.length === 0) {
        alert("No flashcards available in this theme.");
        showScreen(homeScreen);
        return;
    }

    const card = currentFlashcards[currentCardIndex];
    const flashcardDiv = document.getElementById('flashcard');
    flashcardDiv.querySelector('.card-front-content').textContent = card.question;
    flashcardDiv.querySelector('.card-back-content').textContent = card.answer;
    flashcardDiv.classList.remove('flip');
}

function showEndScreen() {
    document.getElementById('rightScore').textContent = score.right;
    document.getElementById('mehScore').textContent = score.meh;
    document.getElementById('wrongScore').textContent = score.wrong;

    showScreen(endScreen);
}