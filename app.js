// ==================== STORAGE MANAGER ====================
const StorageManager = {
    QUIZZES_KEY: 'flashcard_quizzes',
    RESULTS_KEY: 'flashcard_results',
    USER_NAME_KEY: 'flashcard_user_name',

    getQuizzes() {
        const data = localStorage.getItem(this.QUIZZES_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveQuiz(quiz) {
        const quizzes = this.getQuizzes();
        quiz.id = Date.now().toString();
        quiz.createdAt = new Date().toISOString();
        quizzes.push(quiz);
        localStorage.setItem(this.QUIZZES_KEY, JSON.stringify(quizzes));
        return quiz;
    },

    deleteQuiz(quizId) {
        const quizzes = this.getQuizzes();
        const filtered = quizzes.filter(q => q.id !== quizId);
        localStorage.setItem(this.QUIZZES_KEY, JSON.stringify(filtered));
    },

    getQuiz(quizId) {
        return this.getQuizzes().find(q => q.id === quizId);
    },

    saveResult(quizId, result) {
        const allResults = this.getResults();
        if (!allResults[quizId]) {
            allResults[quizId] = [];
        }
        result.timestamp = new Date().toISOString();
        allResults[quizId].push(result);
        localStorage.setItem(this.RESULTS_KEY, JSON.stringify(allResults));
    },

    getResults() {
        const data = localStorage.getItem(this.RESULTS_KEY);
        return data ? JSON.parse(data) : {};
    },

    getResultsForQuiz(quizId) {
        const allResults = this.getResults();
        return allResults[quizId] || [];
    },

    getUserName() {
        return localStorage.getItem(this.USER_NAME_KEY) || '';
    },

    saveUserName(name) {
        localStorage.setItem(this.USER_NAME_KEY, name);
    }
};

// ==================== UI MANAGER ====================
const UIManager = {
    screens: {
        home: document.getElementById('home-screen'),
        import: document.getElementById('import-screen'),
        flashcard: document.getElementById('flashcard-screen'),
        end: document.getElementById('end-screen')
    },

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens[screenName].classList.add('active');
        window.scrollTo(0, 0);
    },

    showHome() {
        this.showScreen('home');
        this.renderQuizzesList();
    },

    showImport() {
        this.showScreen('import');
        document.getElementById('json-input').value = '';
        document.getElementById('import-error').textContent = '';
    },

    showFlashcard() {
        this.showScreen('flashcard');
    },

    showEnd() {
        this.showScreen('end');
    },

    renderQuizzesList() {
        const quizzes = StorageManager.getQuizzes();
        const list = document.getElementById('quizzes-list');
        const noQuizzesMsg = document.getElementById('no-quizzes');

        if (quizzes.length === 0) {
            list.innerHTML = '';
            noQuizzesMsg.style.display = 'block';
            return;
        }

        noQuizzesMsg.style.display = 'none';
        list.innerHTML = quizzes.map(quiz => {
            const questionsCount = quiz.questions ? quiz.questions.length : 0;
            return `
                <div class="quiz-item" data-quiz-id="${quiz.id}">
                    <div class="quiz-item-inner">
                        <div class="quiz-item-info">
                            <h3>${this.escapeHtml(quiz.title)}</h3>
                            <p>${questionsCount} questions</p>
                        </div>
                    </div>
                    <div class="quiz-item-delete">DELETE</div>
                </div>
            `;
        }).join('');

        // Add event listeners
        list.querySelectorAll('.quiz-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.textContent === 'DELETE') {
                    const quizId = item.dataset.quizId;
                    GameManager.startDelete(quizId, item);
                } else {
                    const quizId = item.dataset.quizId;
                    GameManager.loadQuiz(quizId);
                }
            });

            // Swipe to delete
            let touchStartX = 0;
            item.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
            });

            item.addEventListener('touchmove', (e) => {
                if (!item.classList.contains('sliding')) {
                    const touchX = e.touches[0].clientX;
                    const diff = touchStartX - touchX;
                    if (diff > 20) {
                        item.classList.add('sliding');
                        item.style.transform = `translateX(${-Math.min(diff, 100)}px)`;
                    }
                }
            });

            item.addEventListener('touchend', () => {
                if (item.classList.contains('sliding')) {
                    const transform = item.style.transform;
                    const match = transform.match(/-(\d+)/);
                    const offset = match ? parseInt(match[1]) : 0;
                    
                    if (offset > 50) {
                        item.style.transform = 'translateX(-100%)';
                    } else {
                        item.style.transform = '';
                        item.classList.remove('sliding');
                    }
                }
            });
        });
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ==================== GAME MANAGER ====================
const GameManager = {
    currentQuiz: null,
    currentQuestions: [],
    currentQuestionIndex: 0,
    correct: 0,
    incorrect: 0,
    userName: '',
    isFlipped: false,
    touchStartX: 0,
    touchStartY: 0,
    deleteConfirmation: null,
    controlsBound: false,
    isTransitioning: false,
    flipTransition: 'transform 320ms cubic-bezier(0.22, 0.61, 0.36, 1)',
    suppressNextCardClick: false,
    currentRotation: 0,
    quizStartTimestamp: null,
    elapsedMs: 0,
    timerIntervalId: null,

    loadQuiz(quizId) {
        this.currentQuiz = StorageManager.getQuiz(quizId);
        if (!this.currentQuiz) {
            alert('Quiz not found!');
            return;
        }
        
        // Reset game state
        this.currentQuestionIndex = 0;
        this.correct = 0;
        this.incorrect = 0;
        this.isFlipped = false;
        this.stopQuizTimer();
        this.renderQuizTimer(0);
        
        // Get user name
        const savedName = StorageManager.getUserName();
        this.userName = savedName;
        
        // Prepare questions
        this.prepareQuestions();
        
        UIManager.showFlashcard();
        this.showNamePrompt();
    },

    prepareQuestions() {
        // Pick 5 random questions (or all if less than 5)
        const all = this.currentQuiz.questions || [];
        const count = Math.min(5, all.length);
        this.currentQuestions = [];
        const indices = new Set();
        
        while (indices.size < count) {
            indices.add(Math.floor(Math.random() * all.length));
        }
        
        indices.forEach(i => this.currentQuestions.push(all[i]));
    },

    showNamePrompt() {
        const wrapper = document.getElementById('flashcard-wrapper');
        const prompt = document.getElementById('name-prompt');
        const input = document.getElementById('user-name-input');
        
        wrapper.style.display = 'none';
        prompt.style.display = 'flex';
        this.renderQuizTimer(0);
        input.value = this.userName;
        input.focus();
        
        document.getElementById('start-quiz-btn').onclick = () => this.startQuiz();
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startQuiz();
        });
    },

    startQuiz() {
        const input = document.getElementById('user-name-input');
        this.userName = input.value.trim() || 'Player';
        StorageManager.saveUserName(this.userName);
        
        const wrapper = document.getElementById('flashcard-wrapper');
        const prompt = document.getElementById('name-prompt');
        
        prompt.style.display = 'none';
        wrapper.style.display = 'flex';
        
        document.getElementById('quiz-title').textContent = this.currentQuiz.title;
        
        this.showQuestion(0);
        this.setupFlashcardControls();
        this.startQuizTimer();
    },

    showQuestion(index) {
        if (index >= this.currentQuestions.length) {
            this.endQuiz();
            return;
        }
        
        this.currentQuestionIndex = index;
        const question = this.currentQuestions[index];
        
        document.getElementById('question-text').textContent = question.q;
        document.getElementById('answer-text').textContent = question.a;
        document.getElementById('question-counter').textContent = `${index + 1} / ${this.currentQuestions.length}`;
        
        const flashcard = document.getElementById('flashcard');
        const cardInner = flashcard.querySelector('.flashcard-inner');
        flashcard.classList.remove('answer-success', 'answer-wrong', 'card-exit-left', 'card-enter-right', 'card-pre-enter-right');
        flashcard.style.transform = '';
        flashcard.style.opacity = '';
        this.setFlipState(false, { animate: false });
        cardInner.style.transition = this.flipTransition;
        
        this.updateProgressBar();
    },

    setupFlashcardControls() {
        if (this.controlsBound) return;
        this.controlsBound = true;

        const flashcard = document.getElementById('flashcard');
        const cardInner = flashcard.querySelector('.flashcard-inner');
        let isDragging = false;
        let hasHorizontalDrag = false;
        let dragRotation = 0;
        let dragBaseRotation = 0;
        let lastDiffX = 0;
        let activePointerId = null;

        const startDrag = (startX, startY) => {
            this.touchStartX = startX;
            this.touchStartY = startY;
            isDragging = true;
            hasHorizontalDrag = false;
            dragBaseRotation = this.currentRotation;
            dragRotation = dragBaseRotation;
            lastDiffX = 0;
            cardInner.style.transition = 'none';
            flashcard.classList.add('dragging');
        };

        const moveDrag = (currentX, currentY, shouldPreventDefault = false, event = null) => {
            if (!isDragging) return;

            const diffX = currentX - this.touchStartX;
            const diffY = Math.abs(currentY - this.touchStartY);

            // Only allow horizontal drag if vertical movement is minimal
            if (Math.abs(diffX) > 5 && Math.abs(diffX) > diffY) {
                if (shouldPreventDefault && event) {
                    event.preventDefault();
                }
                hasHorizontalDrag = true;

                // 100% flip is reached at 50% of viewport width.
                const maxDrag = window.innerWidth * 0.5;
                lastDiffX = diffX;
                const rotation = dragBaseRotation + (diffX / maxDrag) * 180;

                // Prevent overshoot loops: front side stays within [-180, 180],
                // back side stays within [0, 360].
                if (this.isFlipped) {
                    dragRotation = Math.max(0, Math.min(360, rotation));
                } else {
                    dragRotation = Math.max(-180, Math.min(180, rotation));
                }
                cardInner.style.transform = `rotateY(${dragRotation}deg)`;
            }
        };

        const endDrag = () => {
            if (!isDragging) return;

            // Restore transition
            cardInner.style.transition = this.flipTransition;
            flashcard.classList.remove('dragging');

            // Flip when reaching at least 50% rotation (90deg).
            if (hasHorizontalDrag) {
                const crossedHalf = Math.abs(dragRotation - dragBaseRotation) >= 90;
                if (crossedHalf) {
                    const direction = lastDiffX >= 0 ? 1 : -1;
                    const targetRotation = dragBaseRotation + (direction * 180);
                    this.setRotationState(targetRotation, !this.isFlipped);
                } else {
                    this.setRotationState(dragBaseRotation, this.isFlipped);
                }
                this.suppressNextCardClick = true;
            } else {
                this.setFlipState(this.isFlipped);
            }

            isDragging = false;
            hasHorizontalDrag = false;
        };

        // Touch start - begin drag
        flashcard.addEventListener('touchstart', (e) => {
            // Don't start drag if touching buttons
            if (e.target.closest('.card-actions') || this.isTransitioning) return;

            startDrag(e.touches[0].clientX, e.touches[0].clientY);
        });

        // Touch move - card follows finger
        flashcard.addEventListener('touchmove', (e) => {
            moveDrag(e.touches[0].clientX, e.touches[0].clientY, true, e);
        });

        // Touch end - complete flip or reset
        flashcard.addEventListener('touchend', () => endDrag());

        flashcard.addEventListener('touchcancel', () => {
            if (!isDragging) return;
            cardInner.style.transition = this.flipTransition;
            this.setFlipState(this.isFlipped);
            isDragging = false;
            hasHorizontalDrag = false;
            flashcard.classList.remove('dragging');
        });

        // Pointer drag for desktop mouse/pen - mirrors touch drag behavior.
        flashcard.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'touch') return;
            if (e.button !== 0) return;
            if (e.target.closest('.card-actions') || this.isTransitioning) return;
            activePointerId = e.pointerId;
            flashcard.setPointerCapture(e.pointerId);
            startDrag(e.clientX, e.clientY);
        });

        flashcard.addEventListener('pointermove', (e) => {
            if (e.pointerType === 'touch') return;
            if (activePointerId !== e.pointerId) return;
            moveDrag(e.clientX, e.clientY, true, e);
        });

        flashcard.addEventListener('pointerup', (e) => {
            if (e.pointerType === 'touch') return;
            if (activePointerId !== e.pointerId) return;
            endDrag();
            activePointerId = null;
            if (flashcard.hasPointerCapture(e.pointerId)) {
                flashcard.releasePointerCapture(e.pointerId);
            }
        });

        flashcard.addEventListener('pointercancel', (e) => {
            if (e.pointerType === 'touch') return;
            if (activePointerId !== e.pointerId) return;
            cardInner.style.transition = this.flipTransition;
            this.setFlipState(this.isFlipped);
            isDragging = false;
            hasHorizontalDrag = false;
            activePointerId = null;
            flashcard.classList.remove('dragging');
            if (flashcard.hasPointerCapture(e.pointerId)) {
                flashcard.releasePointerCapture(e.pointerId);
            }
        });

        // Click to flip - but not on buttons
        flashcard.addEventListener('click', (e) => {
            if (this.suppressNextCardClick) {
                this.suppressNextCardClick = false;
                return;
            }
            if (!isDragging && !e.target.closest('.card-actions') && !this.isTransitioning) {
                this.flipCard();
            }
        });

        // Prevent button clicks from bubbling to card flip
        document.getElementById('correct-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.nextQuestion(true);
        });

        document.getElementById('wrong-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.nextQuestion(false);
        });

        // Accelerometer tilt
        if (window.DeviceOrientationEvent && window.navigator.permissions) {
            window.navigator.permissions.query({ name: 'accelerometer' }).then(permissionStatus => {
                if (permissionStatus.state === 'granted') {
                    this.enableTilt(cardInner);
                }
            });
        }
    },

    flipCard() {
        this.setFlipState(!this.isFlipped);
    },

    setFlipState(flipped, options = {}) {
        const cardInner = document.getElementById('flashcard').querySelector('.flashcard-inner');
        const animate = options.animate !== false;
        this.isFlipped = !!flipped;
        this.currentRotation = this.isFlipped ? 180 : 0;
        cardInner.style.transition = animate ? this.flipTransition : 'none';
        cardInner.style.transform = `rotateY(${this.currentRotation}deg)`;
    },

    setRotationState(rotation, flipped) {
        const cardInner = document.getElementById('flashcard').querySelector('.flashcard-inner');
        this.currentRotation = rotation;
        this.isFlipped = !!flipped;
        cardInner.style.transition = this.flipTransition;
        cardInner.style.transform = `rotateY(${this.currentRotation}deg)`;

        // Normalize equivalent angles after the animation to keep next drags stable.
        setTimeout(() => {
            const normalized = this.isFlipped ? 180 : 0;
            if (this.currentRotation !== normalized) {
                this.currentRotation = normalized;
                cardInner.style.transition = 'none';
                cardInner.style.transform = `rotateY(${normalized}deg)`;
                void cardInner.offsetWidth;
                cardInner.style.transition = this.flipTransition;
            }
        }, 330);
    },

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    formatDuration(ms) {
        const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },

    renderQuizTimer(ms) {
        const timerEl = document.getElementById('quiz-timer');
        if (!timerEl) return;
        timerEl.textContent = this.formatDuration(ms);
    },

    startQuizTimer() {
        this.stopQuizTimer();
        this.quizStartTimestamp = Date.now();
        this.elapsedMs = 0;
        this.renderQuizTimer(0);

        this.timerIntervalId = setInterval(() => {
            if (!this.quizStartTimestamp) return;
            this.elapsedMs = Date.now() - this.quizStartTimestamp;
            this.renderQuizTimer(this.elapsedMs);
        }, 250);
    },

    stopQuizTimer() {
        if (this.timerIntervalId) {
            clearInterval(this.timerIntervalId);
            this.timerIntervalId = null;
        }
        if (this.quizStartTimestamp) {
            this.elapsedMs = Date.now() - this.quizStartTimestamp;
            this.quizStartTimestamp = null;
        }
    },

    computeFinalScore(correct, elapsedMs) {
        return correct + Math.floor(Math.max(0, elapsedMs) / 1000);
    },

    async playFeedbackAnimation(isCorrect, flashcard) {
        flashcard.classList.remove('answer-success', 'answer-wrong');
        flashcard.classList.add(isCorrect ? 'answer-success' : 'answer-wrong');
        await this.wait(isCorrect ? 480 : 420);
        flashcard.classList.remove('answer-success', 'answer-wrong');
    },

    enableTilt(cardInner) {
        window.addEventListener('deviceorientation', (e) => {
            const alpha = e.alpha; // Z axis rotation (0-360)
            const beta = e.beta;   // X axis rotation (-180 to 180)
            const gamma = e.gamma; // Y axis rotation (-90 to 90)
            
            // Subtle tilt effect (reduce intensity by dividing)
            const tiltX = beta / 20;
            const tiltY = gamma / 20;
            
            cardInner.style.setProperty('--tilt-x', `${tiltX}deg`);
            cardInner.style.setProperty('--tilt-y', `${tiltY}deg`);
        });
    },

    async nextQuestion(isCorrect) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        const flashcard = document.getElementById('flashcard');
        const nextIndex = this.currentQuestionIndex + 1;

        // Keep showing answer side during answer feedback.
        if (!this.isFlipped) {
            this.setFlipState(true);
            await this.wait(320);
        }

        if (isCorrect) {
            this.correct++;
        } else {
            this.incorrect++;
        }
        this.updateProgressBar();

        await this.playFeedbackAnimation(isCorrect, flashcard);

        // Then flip back with animation.
        this.setFlipState(false);
        await this.wait(320);

        // Move current card out on the left.
        flashcard.classList.add('card-exit-left');
        await this.wait(420);

        if (nextIndex >= this.currentQuestions.length) {
            flashcard.classList.remove('card-exit-left');
            flashcard.style.transform = '';
            flashcard.style.opacity = '';
            this.isTransitioning = false;
            this.endQuiz();
            return;
        }

        // Load next content and enter from right on question side.
        this.showQuestion(nextIndex);
        flashcard.classList.add('card-pre-enter-right');
        void flashcard.offsetWidth;
        flashcard.classList.remove('card-pre-enter-right');
        flashcard.classList.add('card-enter-right');
        await this.wait(420);
        flashcard.classList.remove('card-enter-right');

        this.isTransitioning = false;
    },

    updateProgressBar() {
        const total = this.correct + this.incorrect;
        const correctPercent = total > 0 ? (this.correct / total) * 100 : 0;
        
        document.getElementById('correct-bar').style.flex = correctPercent;
        document.getElementById('incorrect-bar').style.flex = 100 - correctPercent;
    },

    endQuiz() {
        this.stopQuizTimer();
        this.renderQuizTimer(this.elapsedMs);

        const finalScore = this.computeFinalScore(this.correct, this.elapsedMs);
        StorageManager.saveResult(this.currentQuiz.id, {
            userName: this.userName,
            correct: this.correct,
            incorrect: this.incorrect,
            total: this.currentQuestions.length,
            elapsedMs: this.elapsedMs,
            finalScore
        });
        
        this.showResults();
    },

    showResults() {
        UIManager.showEnd();
        
        document.getElementById('final-correct').textContent = this.correct;
        document.getElementById('final-total').textContent = this.currentQuestions.length;
        document.getElementById('user-name-display').textContent = this.userName;
        document.getElementById('final-time').textContent = `TIME ${this.formatDuration(this.elapsedMs)}`;
        
        // Show previous results
        const results = StorageManager.getResultsForQuiz(this.currentQuiz.id);
        const historyDiv = document.getElementById('results-history');
        
        if (results.length === 0) {
            historyDiv.innerHTML = '<p style="opacity: 0.5; text-align: center;">No previous results</p>';
        } else {
            const sortedResults = results.slice().reverse();
            historyDiv.innerHTML = sortedResults.map(result => {
                const date = new Date(result.timestamp).toLocaleDateString();
                const elapsedMs = typeof result.elapsedMs === 'number' ? result.elapsedMs : 0;
                return `
                    <div class="result-item">
                        <div class="result-item-left">
                            <div class="result-item-date">${date} - ${this.formatDuration(elapsedMs)}</div>
                            <div class="result-item-name">${result.userName}</div>
                        </div>
                        <div class="result-item-right">
                            <span class="result-item-score">${result.correct}/${result.total}</span>
                            <span class="result-item-time">(${this.formatDuration(elapsedMs)})</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        document.getElementById('home-btn').onclick = () => UIManager.showHome();
    },

    startDelete(quizId, item) {
        this.deleteConfirmation = { quizId, item };
        
        const overlay = document.createElement('div');
        overlay.className = 'delete-confirmation';
        overlay.innerHTML = `
            <div class="delete-tooltip">
                <p>Delete this quiz?</p>
                <div class="delete-tooltip-buttons">
                    <button class="btn btn-cancel">CANCEL</button>
                    <button class="btn btn-confirm">DELETE</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        overlay.querySelector('.btn-cancel').onclick = () => {
            overlay.remove();
            item.style.transform = '';
            item.classList.remove('sliding');
        };
        
        overlay.querySelector('.btn-confirm').onclick = () => {
            StorageManager.deleteQuiz(quizId);
            item.style.transition = 'opacity 0.3s ease';
            item.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                UIManager.renderQuizzesList();
            }, 300);
        };
    }
};

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', () => {
    let deferredInstallPrompt = null;
    const installBtn = document.getElementById('install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        if (installBtn) installBtn.style.display = 'inline-flex';
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        if (installBtn) installBtn.style.display = 'none';
    });

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredInstallPrompt) {
                deferredInstallPrompt.prompt();
                await deferredInstallPrompt.userChoice;
                deferredInstallPrompt = null;
                installBtn.style.display = 'none';
                return;
            }

            alert('Install is not available here. On iPhone/iPad, use Safari Share > Add to Home Screen.');
        });
    }

    // Home screen
    document.getElementById('import-btn').addEventListener('click', () => UIManager.showImport());
    
    // Import screen
    document.getElementById('back-from-import').addEventListener('click', () => UIManager.showHome());
    
    document.getElementById('import-submit').addEventListener('click', () => {
        const input = document.getElementById('json-input');
        const errorDiv = document.getElementById('import-error');
        
        try {
            const data = JSON.parse(input.value);
            
            if (!data.title || !Array.isArray(data.questions)) {
                throw new Error('Invalid format: need "title" and "questions" array');
            }
            
            if (data.questions.length === 0) {
                throw new Error('Quiz must have at least one question');
            }
            
            data.questions.forEach((q, i) => {
                if (!q.q || !q.a) {
                    throw new Error(`Question ${i + 1}: must have "q" and "a" properties`);
                }
            });
            
            const quiz = StorageManager.saveQuiz(data);
            GameManager.loadQuiz(quiz.id);
        } catch (error) {
            errorDiv.textContent = '❌ ' + error.message;
        }
    });
    
    // Initial render
    UIManager.showHome();
    
    // Request accelerometer permission for iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        document.addEventListener('click', () => {
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        window.addEventListener('deviceorientation', () => {});
                    }
                })
                .catch(console.error);
        }, { once: true });
    }
});
