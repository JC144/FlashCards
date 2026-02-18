# Flashcards
## Technical Stack
* HTML + Vanilla JS
* Local storage
* PWA

## Project
A flashcard web application users can install on their phone.
Focus on mobile even if Desktop is supported.

### Home screen
* Navigate to the import screen
* Pick an existing list of quizz
* Manage the list of existing quizz
    * Slide to the left to remove
        * A tooltip appears if the user want to cancel the removal

### Import screen
* A zone to paste a json
* A button to import and start the quizz

### Flashcard screen
* Ask user name (and keep it prefill) before starting
* Pickup five random question in the selected quizz collection
* Display the question on the card
* When the user turn the card he can either check if he was right or if he was wrong
* On top there is an horizontal bar representing the amount of right answers against the wrong answers
This screen is the most important and the focus should be on the UI.
The card moves based on the phone position (accelerometer).
Users can flip it by sliding his finger.
The card is gorgeous and "feelable".
Works on the animation on right and wrong answers

#### End screen
The result is displayed and compared to previous results like in an arcade game.

### UI / UX
* Minimalist design
* Mostly Black and White with a big emphasis on font (use weight, upper and lower case, etc)

