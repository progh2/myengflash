class FlashCardApp {
    constructor() {
        this.currentMode = 'start';
        this.currentWords = [];
        this.currentIndex = 0;
        this.currentWord = null;
        this.sessionId = null;
        this.sessionStartTime = null;
        this.correctAnswers = 0;
        this.totalAnswers = 0;
        this.isFlipped = false;
        this.quizMode = false;
        this.db = new LocalStorageDB(); // 로컬 스토리지 DB 사용
        this.touchHandler = new TouchClickHandler(); // 터치 핸들러 추가
        
        // DOM이 로드된 후 초기화
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeEventListeners();
                this.loadWords();
                this.updateStats();
            });
        } else {
            this.initializeEventListeners();
            this.loadWords();
            this.updateStats();
        }
    }

    initializeEventListeners() {
        // 네비게이션 버튼 - 터치/클릭 이벤트 처리
        const navButtons = [
            { id: 'studyBtn', handler: () => this.startStudy() },  // 헤더 학습하기도 startStudy 호출
            { id: 'manageBtn', handler: () => this.switchMode('manage') },
            { id: 'statsBtn', handler: () => this.switchMode('stats') },
            { id: 'startBtn', handler: () => this.startStudy() }
        ];
        
        navButtons.forEach(({ id, handler }) => {
            const element = document.getElementById(id);
            if (element) {
                this.touchHandler.handleMobileClick(element, handler);
            }
        });

        // 학습 모드 버튼들
        const studyButtons = [
            { id: 'starBtn', handler: () => this.toggleStar() },
            { id: 'nextBtn', handler: () => this.nextWord() }
        ];
        
        studyButtons.forEach(({ id, handler }) => {
            const element = document.getElementById(id);
            if (element) {
                this.touchHandler.handleMobileClick(element, handler);
            }
        });

        // 단어 관리 버튼들
        const manageButtons = [
            { id: 'addWordBtn', handler: () => this.addWord() },
            { id: 'importBtn', handler: () => this.importWords() },
            { id: 'exportBtn', handler: () => this.exportWords() }
        ];
        
        manageButtons.forEach(({ id, handler }) => {
            const element = document.getElementById(id);
            if (element) {
                this.touchHandler.handleMobileClick(element, handler);
            }
        });

        // 파일 입력 (변경 이벤트는 그대로)
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileImport(e));
        }

        // 모달 버튼들
        const modalButtons = [
            { id: 'modalCancel', handler: () => this.closeModal() },
            { id: 'modalConfirm', handler: () => this.confirmModal() }
        ];
        
        modalButtons.forEach(({ id, handler }) => {
            const element = document.getElementById(id);
            if (element) {
                this.touchHandler.handleMobileClick(element, handler);
            }
        });

        // Enter 키 처리 (그대로 유지)
        const newWordInput = document.getElementById('newWord');
        const newMeaningInput = document.getElementById('newMeaning');
        
        if (newWordInput) {
            newWordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addWord();
            });
        }
        
        if (newMeaningInput) {
            newMeaningInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addWord();
            });
        }
    }

    switchMode(mode) {
        console.log('Switching mode to:', mode);
        // 모든 모드 숨기기
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('studyMode').classList.add('hidden');
        document.getElementById('manageMode').classList.add('hidden');
        document.getElementById('statsMode').classList.add('hidden');

        // 선택한 모드 표시
        this.currentMode = mode;
        
        switch(mode) {
            case 'study':
                document.getElementById('studyMode').classList.remove('hidden');
                break;
            case 'manage':
                document.getElementById('manageMode').classList.remove('hidden');
                this.loadWordList();
                break;
            case 'stats':
                document.getElementById('statsMode').classList.remove('hidden');
                this.updateStats();
                break;
            default:
                document.getElementById('startScreen').classList.remove('hidden');
        }
    }

    async loadWords() {
        try {
            // 로컬 스토리지에서 단어 가져오기
            const words = this.db.getAll('words');
            console.log('Words data loaded:', words);
            
            if (words.length === 0) {
                console.log('No words found, adding default words...');
                // 기본 단어 추가
                await this.addDefaultWords();
                return this.loadWords();
            }
            
            return words;
        } catch (error) {
            console.error('단어 로딩 실패:', error);
            return [];
        }
    }

    async addDefaultWords() {
        const defaultWords = [
            { word: 'abundant', meaning: '풍부한', difficulty: 3 },
            { word: 'accomplish', meaning: '성취하다', difficulty: 2 },
            { word: 'acquire', meaning: '획득하다', difficulty: 3 },
            { word: 'adapt', meaning: '적응하다', difficulty: 2 },
            { word: 'advocate', meaning: '옹호하다', difficulty: 4 },
            { word: 'affect', meaning: '영향을 미치다', difficulty: 2 },
            { word: 'afford', meaning: '여유가 있다', difficulty: 3 },
            { word: 'anxiety', meaning: '불안', difficulty: 3 },
            { word: 'approach', meaning: '접근하다', difficulty: 2 },
            { word: 'aspect', meaning: '측면', difficulty: 3 }
        ];

        for (const word of defaultWords) {
            await this.createWord(word);
        }
    }

    async createWord(wordData) {
        const now = new Date().toISOString();
        const word = {
            ...wordData,
            is_starred: false,
            wrong_count: 0,
            correct_count: 0,
            streak: 0,
            next_review: now,
            review_interval: 1,
            created_at: now
        };

        try {
            return this.db.save('words', word);
        } catch (error) {
            console.error('단어 추가 실패:', error);
            return null;
        }
    }

    async startStudy() {
        console.log('=== startStudy called ===');
        try {
            this.sessionId = this.generateId();
            this.sessionStartTime = new Date();
            this.currentIndex = 0;
            this.correctAnswers = 0;
            this.totalAnswers = 0;

            console.log('Loading words...');
            const words = await this.loadWords();
            console.log('Loaded words count:', words.length);
            
            if (!words || words.length === 0) {
                alert('학습할 단어가 없습니다. 먼저 단어를 추가해주세요.');
                return;
            }
            
            // 어빙하우스 기억곡선 적용하여 우선순위 정렬
            this.currentWords = await this.getPriorityWords(words);
            console.log('Priority words count:', this.currentWords.length);
            
            if (this.currentWords.length === 0) {
                alert('학습할 단어가 없습니다. 먼저 단어를 추가해주세요.');
                return;
            }

            // 10개 제한
            this.currentWords = this.currentWords.slice(0, 10);
            console.log('Final words count:', this.currentWords.length);
            
            console.log('Switching to study mode...');
            this.switchMode('study');
            console.log('Showing current word...');
            
            // 🌟 학습 시작 칭찬 메시지
            const startMessage = document.createElement('div');
            startMessage.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-6 py-3 rounded-lg text-lg font-semibold shadow-lg z-40 animate-pulse';
            startMessage.textContent = '멋져요! 학습을 시작했어요! 오늘도 훌륭한 성과를 거둘 거예요! 🎯';
            document.body.appendChild(startMessage);
            
            setTimeout(() => {
                if (document.body.contains(startMessage)) {
                    document.body.removeChild(startMessage);
                }
            }, 2500);
            
            this.showCurrentWord();
            console.log('=== startStudy completed ===');
        } catch (error) {
            console.error('Error in startStudy:', error);
        }
    }

    async getPriorityWords(words) {
        const now = new Date();
        const priorityWords = [];
        
        for (const word of words) {
            const nextReview = new Date(word.next_review);
            
            // 별표 표시된 단어는 우선순위 높게
            if (word.is_starred) {
                priorityWords.push({ ...word, priority: 10 });
            }
            // 자주 틀리는 단어 우선순위 높게
            else if (word.wrong_count > word.correct_count) {
                priorityWords.push({ ...word, priority: 8 });
            }
            // 복습 시간이 지난 단어
            else if (nextReview <= now) {
                priorityWords.push({ ...word, priority: 6 });
            }
            // 연속 정답이 많은 단어는 우선순위 낮게
            else if (word.streak >= 5) {
                priorityWords.push({ ...word, priority: 2 });
            }
            // 일반 단어
            else {
                priorityWords.push({ ...word, priority: 4 });
            }
        }
        
        // 우선순위별 정렬
        return priorityWords
            .sort((a, b) => b.priority - a.priority)
            .map(item => {
                const { priority, ...word } = item;
                return word;
            });
    }

    showCurrentWord() {
        this._answerLocked = false;  // 새 단어마다 잠금 초기화
        console.log('Showing current word, index:', this.currentIndex, 'total:', this.currentWords?.length);
        
        if (!this.currentWords || this.currentIndex >= this.currentWords.length) {
            console.log('No more words or invalid data');
            this.finishStudy();
            return;
        }

        this.currentWord = this.currentWords[this.currentIndex];
        console.log('Current word data:', this.currentWord);
        console.log('Word (English):', this.currentWord.word);
        console.log('Meaning (Korean):', this.currentWord.meaning);
        
        if (!this.currentWord) {
            console.error('No current word found');
            return;
        }

        this.quizMode = false;

        // UI 업데이트 - 영어 단어만 표시
        const wordText = document.getElementById('wordText');
        
        if (wordText) {
            wordText.textContent = this.currentWord.word;  // 영어 단어만
            console.log('Updated UI with English word:', this.currentWord.word);
        } else {
            console.error('Word element not found');
        }
        
        // 카테고리 배지
        const categoryBadge = document.getElementById('categoryBadge');
        if (categoryBadge) {
            categoryBadge.innerHTML = this.getCategoryBadge(this.currentWord.category);
        }

        // 별표 상태
        const starBtn = document.getElementById('starBtn');
        if (starBtn) {
            starBtn.innerHTML = this.currentWord.is_starred ? 
                '<i class="fas fa-star text-yellow-500"></i>' : 
                '<i class="far fa-star text-gray-400"></i>';
        }

        // 진행률 업데이트
        this.updateProgress();

        // 퀴즈 섹션 준비 (즉시 표시)
        const quizSection = document.getElementById('quizSection');
        const nextBtn = document.getElementById('nextBtn');
        if (quizSection && nextBtn) {
            quizSection.classList.remove('hidden');  // 즉시 표시
            nextBtn.disabled = true;
        }

        // 즉시 퀴즈 표시 (영어단어와 함께 보기 나타남)
        this.showQuiz();
    }





    showQuiz() {
        this.quizMode = true;
        document.getElementById('quizSection').classList.remove('hidden');
        
        const options = this.generateQuizOptions();
        const container = document.getElementById('quizOptions');
        container.innerHTML = '';

        options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'p-4 bg-white border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-left';
            button.innerHTML = `
                <div class="flex items-center">
                    <span class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3 text-sm font-bold">${index + 1}</span>
                    <span>${option}</span>
                </div>
            `;
            
            // 터치/클릭 이벤트 처리
            this.touchHandler.handleMobileClick(button, () => this.selectAnswer(option));
            
            container.appendChild(button);
        });
    }

    generateQuizOptions() {
        const correctAnswer = this.currentWord.meaning;
        const options = new Set([correctAnswer]);  // Set을 사용하여 중복 제거
        
        // 다른 단어들의 의미를 가져와서 오답 생성
        const otherMeanings = this.currentWords
            .filter(w => w.id !== this.currentWord.id)
            .map(w => w.meaning);
        
        // 무작위로 선택하여 중복 제거 (더 많은 단어 확보)
        const shuffled = otherMeanings.sort(() => Math.random() - 0.5);
        let count = 0;
        
        for (const meaning of shuffled) {
            if (!options.has(meaning)) {  // 중복 확인
                options.add(meaning);
                count++;
            }
            if (count >= 4) break;  // 4개의 오답만 필요
        }
        
        // 만약 충분한 오답이 없다면 다른 난이도의 단어들에서 가져오기
        if (options.size < 5) {
            const additionalMeanings = [
                '매우 어려운', '복잡한', '심화된', '고급의', '전문적인',
                '기초적인', '간단한', '쉬운', '기본적인', '평범한',
                '특별한', '특이한', '독특한', '특별한', '유별난',
                '중요한', '필수적인', '필요한', '필수불가결한', '중대한'
            ];
            
            const moreShuffled = additionalMeanings.sort(() => Math.random() - 0.5);
            for (const meaning of moreShuffled) {
                if (!options.has(meaning)) {
                    options.add(meaning);
                }
                if (options.size >= 5) break;
            }
        }
        
        // 배열로 변환하고 섞기
        return Array.from(options).sort(() => Math.random() - 0.5);
    }

    // 답안 선택 중복 호출 방지 플래그
    _answerLocked = false;

    // 칭찬 메시지 배열
    getPraiseMessage() {
        const praises = [
            "와! 정말 훌륭해요! 🎉",
            "멋져요! 이런 실력이라면 누구든지 부러워할 거예요! 👏",
            "정답이에요! 당신은 천재에요! 🌟",
            "대단해요! 계속 이렇게 나가면 정말 놀라운 결과를 볼 수 있을 거예요! 💪",
            "정말 잘했어요! 이런 실력은 연습의 결과예요! 📚",
            "와우! 완벽해요! 당신의 노력이 빛나는 순간이에요! ✨",
            "훌륭해요! 이런 속도로 계속 나간다면 어느새 고수가 되어 있을 거예요! 🚀",
            "정답이에요! 당신의 기억력이 정말 놀라워요! 🧠",
            "멋진 실력이에요! 이런 꾸준함이 진정한 학습의 비결이에요! 📈",
            "정말 대단해요! 당신은 어느새 단어 마스터가 되어 가고 있어요! 🏆"
        ];
        return praises[Math.floor(Math.random() * praises.length)];
    }

    async selectAnswer(selectedAnswer) {
        // 이중 호출 방지 (touchend + click 동시 발생)
        if (this._answerLocked) return;
        this._answerLocked = true;

        const isCorrect = selectedAnswer === this.currentWord.meaning;
        this.totalAnswers++;

        // 시각적 피드백
        const buttons = document.querySelectorAll('#quizOptions button');
        buttons.forEach(button => {
            const buttonText = button.querySelector('span:last-child').textContent;
            if (buttonText === this.currentWord.meaning) {
                button.className = 'p-4 bg-green-100 border-2 border-green-500 rounded-lg text-left';
            } else if (buttonText === selectedAnswer && !isCorrect) {
                button.className = 'p-4 bg-red-100 border-2 border-red-500 rounded-lg text-left';
            } else {
                button.className = 'p-4 bg-gray-100 border-2 border-gray-300 rounded-lg text-left';
            }
            button.disabled = true;
        });

        if (isCorrect) {
            this.correctAnswers++;
            this.currentWord.correct_count++;
            this.currentWord.streak++;
            
            // 🎉 칭찬 메시지 표시
            const praiseMessage = this.getPraiseMessage();
            const praiseElement = document.createElement('div');
            praiseElement.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-6 py-4 rounded-lg text-xl font-bold shadow-lg z-50 animate-bounce';
            praiseElement.textContent = praiseMessage;
            document.body.appendChild(praiseElement);
            
            // 2초 후 칭찬 메시지 제거
            setTimeout(() => {
                if (document.body.contains(praiseElement)) {
                    document.body.removeChild(praiseElement);
                }
            }, 2000);
            
            // 연속 정답 시 다음 복습 간격 증가
            if (this.currentWord.streak >= 5) {
                this.currentWord.review_interval = Math.min(this.currentWord.review_interval * 2, 30);
            }
        } else {
            this.currentWord.wrong_count++;
            this.currentWord.streak = 0;
            this.currentWord.review_interval = Math.max(1, Math.floor(this.currentWord.review_interval / 2));
            
            document.getElementById('quizSection').classList.add('shake');
            
            // ❗ 오답일 때는 의미를 알려주는 메시지
            const meaningMessage = document.createElement('div');
            meaningMessage.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-6 py-4 rounded-lg text-lg font-semibold shadow-lg z-50';
            meaningMessage.innerHTML = `정답은 <strong>${this.currentWord.meaning}</strong>입니다!<br>다음엔 꼭 맞춰보아요! 💪`;
            document.body.appendChild(meaningMessage);
            
            // 3초 후 메시지 제거
            setTimeout(() => {
                if (document.body.contains(meaningMessage)) {
                    document.body.removeChild(meaningMessage);
                }
            }, 3000);
        }

        // 다음 복습 시간 계산 (어빙하우스 기억곡선)
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + this.currentWord.review_interval);
        this.currentWord.next_review = nextReview.toISOString();

        // 학습 기록 저장
        await this.saveLearningRecord(isCorrect, selectedAnswer);
        
        // 단어 업데이트
        await this.updateWord(this.currentWord);

        // 다음 버튼 활성화
        document.getElementById('nextBtn').disabled = false;
        // 잠금 해제는 하지 않음 — nextWord()에서 showCurrentWord() 호출 시 초기화
    }

    async saveLearningRecord(isCorrect, selectedAnswer) {
        const record = {
            word_id: this.currentWord.id,
            session_id: this.sessionId,
            is_correct: isCorrect,
            selected_answer: selectedAnswer,
            learned_at: new Date().toISOString()
        };

        try {
            this.db.save('learning_records', record);
        } catch (error) {
            console.error('학습 기록 저장 실패:', error);
        }
    }

    async updateWord(word) {
        try {
            this.db.update('words', word.id, word);
        } catch (error) {
            console.error('단어 업데이트 실패:', error);
        }
    }

    toggleStar() {
        this.currentWord.is_starred = !this.currentWord.is_starred;
        const starBtn = document.getElementById('starBtn');
        starBtn.innerHTML = this.currentWord.is_starred ? 
            '<i class="fas fa-star text-yellow-500"></i>' : 
            '<i class="far fa-star text-gray-400"></i>';
        
        this.updateWord(this.currentWord);
    }

    nextWord() {
        this.currentIndex++;
        
        // 🎯 진행 중 칭찬 메시지 (50%마다)
        if (this.currentWords && this.currentIndex === Math.floor(this.currentWords.length / 2)) {
            const midMessage = document.createElement('div');
            midMessage.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-6 py-3 rounded-lg text-lg font-semibold shadow-lg z-40 animate-bounce';
            midMessage.textContent = '정말 잘하고 있어요! 벌써 절반을 완료했어요! 🔥';
            document.body.appendChild(midMessage);
            
            setTimeout(() => {
                if (document.body.contains(midMessage)) {
                    document.body.removeChild(midMessage);
                }
            }, 2500);
        }
        
        this.showCurrentWord();
    }

    updateProgress() {
        if (!this.currentWords || this.currentWords.length === 0) return;
        
        const progress = (this.currentIndex / this.currentWords.length) * 100;
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        if (progressBar && progressText) {
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${this.currentIndex}/${this.currentWords.length}`;
        }
    }

    async finishStudy() {
        const endTime = new Date();
        const duration = Math.floor((endTime - this.sessionStartTime) / 1000 / 60); // 분
        const score = this.totalAnswers > 0 ? Math.round((this.correctAnswers / this.totalAnswers) * 100) : 0;

        const sessionData = {
            id: this.sessionId,
            session_name: `학습 세션 ${new Date().toLocaleDateString()}`,
            total_words: this.totalAnswers,
            correct_words: this.correctAnswers,
            score: score,
            start_time: this.sessionStartTime.toISOString(),
            end_time: endTime.toISOString(),
            duration_minutes: duration
        };

        try {
            this.db.save('session_scores', sessionData);
        } catch (error) {
            console.error('세션 점수 저장 실패:', error);
        }

        // 결과 표시
        let praiseMessage = '';
        if (score >= 90) {
            praiseMessage = '🏆 완벽해요! 당신은 정말 대단해요! 모든 단어를 완벽하게 마스터했어요!';
        } else if (score >= 80) {
            praiseMessage = '🌟 훌륭해요! 정말 놀라운 성과예요! 거의 완벽에 가까워요!';
        } else if (score >= 70) {
            praiseMessage = '👏 잘했어요! 계속 이렇게 나간다면 금방 고수가 될 거예요!';
        } else if (score >= 60) {
            praiseMessage = '💪 괜찮아요! 점점 더 나아지고 있어요! 포기하지 마세요!';
        } else {
            praiseMessage = '🌱 처음이 어려운 법이에요! 다음엔 더 좋은 결과를 볼 수 있을 거예요!';
        }
        
        alert(`🎉 학습 완료!

${praiseMessage}

📊 결과 요약:
맞춘 개수: ${this.correctAnswers}/${this.totalAnswers}
점수: ${score}%
소요 시간: ${duration}분

🎯 계속 도전하면 분명히 좋은 결과를 볼 수 있을 거예요!`);
        
        this.switchMode('start');
    }

    // 단어 관리 기능
    async addWord() {
        const wordInput = document.getElementById('newWord');
        const meaningInput = document.getElementById('newMeaning');
        
        const word = wordInput.value.trim();
        const meaning = meaningInput.value.trim();

        if (!word || !meaning) {
            alert('단어와 의미를 모두 입력해주세요.');
            return;
        }

        await this.createWord({ word, meaning, difficulty: 3 });
        
        wordInput.value = '';
        meaningInput.value = '';
        this.loadWordList();
    }

    // 카테고리 배지 색상 반환
    getCategoryBadge(category) {
        const map = {
            '생활':   'bg-green-100 text-green-700',
            'SW개발': 'bg-blue-100 text-blue-700',
            '디자인': 'bg-purple-100 text-purple-700',
        };
        const cls = map[category] || 'bg-gray-100 text-gray-600';
        return category ? `<span class="text-xs px-2 py-0.5 rounded-full font-medium ${cls}">${category}</span>` : '';
    }

    async loadWordList() {
        const words = await this.loadWords();
        const container = document.getElementById('wordList');
        container.innerHTML = '';

        words.forEach(word => {
            const card = document.createElement('div');
            card.className = 'bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div class="flex flex-col gap-1">
                        <h4 class="font-bold text-gray-800">${word.word}</h4>
                        ${this.getCategoryBadge(word.category)}
                    </div>
                    <div class="flex space-x-1">
                        <button onclick="app.toggleWordStar('${word.id}')" class="text-yellow-500 hover:text-yellow-600">
                            <i class="${word.is_starred ? 'fas' : 'far'} fa-star"></i>
                        </button>
                        <button onclick="app.deleteWord('${word.id}')" class="text-red-500 hover:text-red-600">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="text-gray-600 text-sm mb-2">${word.meaning}</p>
                <div class="flex justify-between items-center text-xs text-gray-500">
                    <span>맞춤: ${word.correct_count} | 틀림: ${word.wrong_count}</span>
                    <span>연속: ${word.streak}</span>
                </div>
            `;
            container.appendChild(card);
        });
    }

    async toggleWordStar(wordId) {
        const words = await this.loadWords();
        const word = words.find(w => w.id === wordId);
        if (word) {
            word.is_starred = !word.is_starred;
            await this.updateWord(word);
            this.loadWordList();
        }
    }

    async deleteWord(wordId) {
        if (confirm('정말로 이 단어를 삭제하시겠습니까?')) {
            try {
                this.db.delete('words', wordId);
                this.loadWordList();
            } catch (error) {
                console.error('단어 삭제 실패:', error);
            }
        }
    }

    importWords() {
        document.getElementById('fileInput').click();
    }

    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result;
            const lines = content.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                const [word, meaning] = line.split(',').map(s => s.trim());
                if (word && meaning) {
                    await this.createWord({ word, meaning, difficulty: 3 });
                }
            }
            
            this.loadWordList();
            alert(`${lines.length}개의 단어를 가져왔습니다.`);
        };
        reader.readAsText(file);
    }

    exportWords() {
        this.loadWords().then(words => {
            const content = words.map(word => `${word.word},${word.meaning}`).join('\n');
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'flashcard_words.txt';
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // 통계 업데이트
    async updateStats() {
        const words = await this.loadWords();
        const sessions = await this.loadSessions();

        const totalWordsEl = document.getElementById('totalWords');
        const starredWordsEl = document.getElementById('starredWords');
        const avgScoreEl = document.getElementById('avgScore');
        const studyDaysEl = document.getElementById('studyDays');

        // 통계 모드 화면이 아닐 때는 DOM 요소가 없을 수 있으므로 방어 처리
        if (totalWordsEl) totalWordsEl.textContent = words.length;
        if (starredWordsEl) starredWordsEl.textContent = words.filter(w => w.is_starred).length;

        const avgScore = sessions.length > 0 ?
            Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length) : 0;
        if (avgScoreEl) avgScoreEl.textContent = `${avgScore}%`;

        const uniqueDays = new Set(sessions.map(s =>
            new Date(s.start_time).toDateString()
        )).size;
        if (studyDaysEl) studyDaysEl.textContent = uniqueDays;

        // 최근 학습 기록
        this.displayRecentSessions(sessions.slice(-5));
    }

    async loadSessions() {
        try {
            return this.db.getAll('session_scores');
        } catch (error) {
            console.error('세션 로딩 실패:', error);
            return [];
        }
    }

    displayRecentSessions(sessions) {
        const container = document.getElementById('recentSessions');
        if (!container) return;  // 통계 화면이 아닐 때 방어
        container.innerHTML = '';

        if (sessions.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center">학습 기록이 없습니다.</p>';
            return;
        }

        sessions.reverse().forEach(session => {
            const div = document.createElement('div');
            div.className = 'bg-gray-50 rounded-lg p-4';
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="font-semibold text-gray-800">${session.session_name}</h4>
                        <p class="text-sm text-gray-600">${new Date(session.start_time).toLocaleDateString()}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-bold text-${session.score >= 80 ? 'green' : session.score >= 60 ? 'yellow' : 'red'}-600">${session.score}%</div>
                        <div class="text-sm text-gray-600">${session.correct_words}/${session.total_words}</div>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    // 유틸리티 함수
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    showModal(title, message, onConfirm = null) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').textContent = message;
        document.getElementById('modal').classList.remove('hidden');
        document.getElementById('modal').classList.add('flex');
        this.modalCallback = onConfirm;
    }

    closeModal() {
        document.getElementById('modal').classList.add('hidden');
        document.getElementById('modal').classList.remove('flex');
        this.modalCallback = null;
    }

    confirmModal() {
        if (this.modalCallback) {
            this.modalCallback();
        }
        this.closeModal();
    }
}

// 앱 초기화
let app;
try {
    app = new FlashCardApp();
    window.app = app;  // 전역 변수로 설정
    console.log('FlashCardApp initialized successfully');
} catch (error) {
    console.error('Failed to initialize FlashCardApp:', error);
}