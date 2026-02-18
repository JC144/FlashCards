# Quick Start Guide

## 🚀 Get Started in 2 Minutes

### 1. Run the App

Choose your method:

**Using Python (recommended):**
```bash
cd d:\All\Dev\FlashCard
python -m http.server 5500
```

**Using Node.js:**
```bash
cd d:\All\Dev\FlashCard
npx http-server -c-1
```

**Using Live server extension** at `https://localhost:5500`

### 2. Open in Browser

- Desktop: `http://localhost:5500`
- Mobile (local network): `http://[your-ip]:5500`
- For HTTPS (PWA): Use ngrok or serve-https

### 3. Import Your First Quiz

Click **IMPORT NEW** and paste this sample:

```json
{
  "title": "Quick Test",
  "questions": [
    {"q": "What is 2+2?", "a": "4"},
    {"q": "What is the capital of France?", "a": "Paris"},
    {"q": "What is the largest planet?", "a": "Jupiter"},
    {"q": "Who wrote Romeo and Juliet?", "a": "Shakespeare"},
    {"q": "What is H2O?", "a": "Water"}
  ]
}
```

### 4. Take the Quiz

1. Enter your name
2. Click **START QUIZ**
3. Swipe/tap to flip cards
4. Choose ✓ or ✗
5. See your results!

---

## 📱 Install as PWA (Mobile)

1. Visit site on mobile via HTTPS
2. Browser menu → "Install app" or "Add to Home Screen"
3. App now runs fullscreen like native app
4. Works offline automatically

---

## 📚 Features Overview

| Feature | How It Works |
|---------|-------------|
| **Quiz Import** | Paste JSON with questions and answers |
| **Random Selection** | Automatically picks 5 random questions |
| **Card Flip** | Swipe left/right, tap, or tilt phone |
| **Progress Bar** | Green/Red bar shows correct/incorrect ratio |
| **Results History** | Compare all attempts for each quiz |
| **Offline Mode** | Works without internet after first load |
| **Local Storage** | All data saved in browser, nothing uploaded |

---

## 🎨 UI/UX Highlights

- **Minimalist black & white design** - Focus on content
- **Large typography** - Easy to read on mobile
- **Smooth animations** - Card flips and transitions
- **Mobile-optimized** - Full-screen, touch-first
- **Accelerometer tilt** - Card responds to phone angle (iOS 13+)

---

## 🛠️ Troubleshooting

### Service Worker not working?
- Clear browser cache
- Use incognito/private mode
- Ensure serving over HTTP localhost (not HTTPS needed for local dev)

### Accelerometer not responding?
- iOS: Need HTTPS connection + user permission
- Android: May require "Allow" in browser permissions
- Works best in standalone app mode

### Quiz won't import?
- Check JSON syntax - use sample format
- All questions must have "q" and "a" fields
- Need at least 1 question

### Lost all my data?
- Data stored in browser localStorage
- Don't clear browser data/cache
- Use different browser/device if needed

---

## 📋 JSON Quiz Format

```json
{
  "title": "Quiz Name (appears in list)",
  "questions": [
    {
      "q": "Question text here",
      "a": "Answer text here"
    }
  ]
}
```

**Requirements:**
- `title` (string) - Required
- `questions` (array) - At least 1 item
- Each question needs `q` (question) and `a` (answer)

---

## 🎯 Tips for Best Experience

1. **Create themed quizzes** - One topic per quiz
2. **Keep questions concise** - Less text, better UX
3. **Use short answers** - Easier to read on card
4. **Test on actual phone** - Desktop experience differs
5. **Enable fullscreen PWA** - Better immersion

---

## 📂 What's Included

- `index.html` - Main app interface
- `app.js` - Quiz logic & storage
- `styles.css` - Minimalist styling
- `manifest.json` - PWA configuration
- `sw.js` - Service worker (offline support)
- `sample-quiz.json` - Example quiz data
- `README.md` - Full documentation

---

## ⚡ Performance

- Initial load: **~2-3 seconds**
- After caching: **<500ms**
- Offline: **Instant**
- File size: **~50KB total**

No dependencies, pure vanilla JS!

---

## 🎓 Example Quizzes

**Copy & paste these to get started:**

### French Basics
```json
{
  "title": "French Basics",
  "questions": [
    {"q": "Bonjour", "a": "Hello"},
    {"q": "Oui", "a": "Yes"},
    {"q": "Non", "a": "No"},
    {"q": "Merci", "a": "Thank you"}
  ]
}
```

### Math Formulas
```json
{
  "title": "Math Formulas",
  "questions": [
    {"q": "Pythagorean theorem", "a": "a² + b² = c²"},
    {"q": "Area of circle", "a": "πr²"},
    {"q": "Quadratic formula", "a": "x = (-b ± √(b²-4ac)) / 2a"}
  ]
}
```

---

Enjoy studying! 📚✨
