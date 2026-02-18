# Flashcards PWA
## Last update
2026-02-18

## Goal
A personal benchmark for Vibecoding.
The goal was to test Codex and push it outside its comfort zone:
* Building a specific design
* Building animation

## Concept
A mobile-first flashcard web application built with HTML, vanilla JavaScript, and local storage. Installable as a PWA with accelerometer support.

## Features

✅ **Mobile First Design** - Optimized for phone experience  
✅ **PWA Installation** - Install on home screen like a native app  
✅ **Quiz Management** - Import, create, and manage quiz lists  
✅ **Local Storage** - All data saved locally, works offline  
✅ **Accelerometer Support** - Card responds to phone tilt  
✅ **Smooth Animations** - Beautiful card flip and response animations  
✅ **Results Tracking** - Compare current and previous quiz scores  
✅ **Minimalist Design** - Black and white with emphasis on typography  

## Setup

### Local Development

1. Clone or download the repository
2. Serve files over HTTPS (required for PWA and accelerometer):
  # using Live server extension
  Click Go Live in Visual Studio right bottom corner

   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js http-server
   npx http-server -c-1
   ```
3. Open `https://localhost:5500` (or appropriate localhost address)

### For Testing on Phone

Use ngrok or similar to create HTTPS tunnel:
```bash
ngrok http 8000
```

Then visit the ngrok HTTPS URL on your phone.

## How to Use

### Importing a Quiz

1. Click **IMPORT NEW** on home screen
2. Paste JSON with this format:
   ```json
   {
     "title": "Spanish Vocabulary",
     "questions": [
       {"q": "What is 'cat' in Spanish?", "a": "Gato"},
       {"q": "What is 'dog' in Spanish?", "a": "Perro"},
       {"q": "What is 'house' in Spanish?", "a": "Casa"}
     ]
   }
   ```
3. Click **IMPORT & START**

### Taking a Quiz

1. Select a quiz from your list
2. Enter your name (prefilled if you've taken it before)
3. Click **START QUIZ**
4. **Flip the card**: Swipe horizontally, tap the card, or tilt your phone
5. **Answer**: Click ✓ **CORRECT** or ✗ **WRONG**
6. View results and compare with previous attempts

### Managing Quizzes

- **Delete a quiz**: Swipe left on the quiz item
- A confirmation popup will appear before deletion

## Technical Details

### File Structure
```
flashcards/
├── index.html          # Main HTML structure
├── styles.css          # Minimalist styling
├── app.js              # Core game logic
├── sw.js               # Service worker for PWA
├── manifest.json       # PWA manifest
└── README.md          # This file
```

### Key Technologies

- **HTML5**: Semantic markup, form controls
- **CSS3**: Flexbox, 3D transforms, animations, media queries
- **JavaScript**: Vanilla JS (no frameworks), local storage API
- **PWA**: Service Worker, Web App Manifest, installable

### Accelerometer

- Works on iOS 13+ and Android devices
- Card tilts subtly based on device orientation
- Requires HTTPS and user permission

### Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+ (iOS 14.5+)
- Samsung Internet 14+

## Customization

### Change Theme Colors

Edit `manifest.json`:
```json
{
  "theme_color": "#000000",
  "background_color": "#000000"
}
```

Edit `styles.css`:
- Primary colors: `#fff` (white), `#000` (black)
- Success color: `#388e3c` (green)
- Error color: `#d32f2f` (red)

### Adjust Card Behavior

In `app.js`, modify:
- `this.currentQuestions.length` - Change from 5 questions per quiz
- Tilt sensitivity in `enableTilt()` function (divide factors)
- Animation timings in CSS transitions

## Data Storage

All data stored in browser's localStorage:
- `flashcard_quizzes` - Quiz definitions
- `flashcard_results` - Quiz attempt history
- `flashcard_user_name` - Last used name

Clear data: Open DevTools Console and run:
```javascript
localStorage.clear()
```

## Offline Usage

The service worker caches all assets. After first load:
- App works completely offline
- Quiz data persists in local storage
- Network requests cached for future sessions

## Example Quizzes

### Spanish 101
```json
{
  "title": "Spanish 101",
  "questions": [
    {"q": "Buenos días", "a": "Good morning"},
    {"q": "Gracias", "a": "Thank you"},
    {"q": "Por favor", "a": "Please"},
    {"q": "Perdón", "a": "Sorry"},
    {"q": "De nada", "a": "You're welcome"},
    {"q": "Sí", "a": "Yes"},
    {"q": "No", "a": "No"}
  ]
}
```

### JavaScript Basics
```json
{
  "title": "JavaScript Basics",
  "questions": [
    {"q": "What declares a variable?", "a": "const, let, or var"},
    {"q": "What is the DOM?", "a": "Document Object Model"},
    {"q": "What is async/await?", "a": "Syntax for handling promises"},
    {"q": "What is a closure?", "a": "Function with access to outer scope"}
  ]
}
```