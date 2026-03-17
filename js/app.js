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
        this.quizMode = false;
        this.isStarMode = false;          // 별표 학습 모드 여부
        this._answerLocked = false;       // 이중 클릭 방지
        this._wordListTab = 'all';        // 단어관리 탭 상태

        this.db = new LocalStorageDB();
        this.touchHandler = new TouchClickHandler();
        this.sound = new SoundEngine();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._init());
        } else {
            this._init();
        }
    }

    _init() {
        this._initEventListeners();
        this._updateSoundBtn();
        this.updateStats();
    }

    // ═══════════════════════════════════════════════════
    // 이벤트 등록
    // ═══════════════════════════════════════════════════
    _initEventListeners() {
        const bind = (id, fn) => {
            const el = document.getElementById(id);
            if (el) this.touchHandler.handleMobileClick(el, fn);
        };

        // 헤더 / 시작화면 버튼
        bind('studyBtn',      () => this.startStudy(false));
        bind('starStudyBtn',  () => this.startStudy(true));
        bind('manageBtn',     () => this.switchMode('manage'));
        bind('statsBtn',      () => this.switchMode('stats'));
        bind('startBtn',      () => this.startStudy(false));
        bind('startStarBtn',  () => this.startStudy(true));

        // 학습 화면
        bind('starBtn', () => this.toggleStar());
        bind('nextBtn', () => this.nextWord());

        // 단어관리
        bind('addWordBtn', () => this.addWord());
        bind('importBtn',  () => this.importWords());
        bind('exportBtn',  () => this.exportWords());

        // 단어관리 탭
        bind('tabAll',     () => this._setWordTab('all'));
        bind('tabStarred', () => this._setWordTab('starred'));

        // 파일 import
        const fi = document.getElementById('fileInput');
        if (fi) fi.addEventListener('change', (e) => this.handleFileImport(e));

        // 모달
        bind('modalCancel',  () => this.closeModal());
        bind('modalConfirm', () => this.confirmModal());

        // 음소거 토글
        bind('soundToggleBtn', () => {
            this.sound.toggle();
            this._updateSoundBtn();
            this._toast(this.sound.enabled ? '🔊 효과음 켜짐' : '🔇 효과음 꺼짐');
        });

        // Enter 키
        ['newWord', 'newMeaning'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.addWord(); });
        });
    }

    _updateSoundBtn() {
        const btn = document.getElementById('soundToggleBtn');
        if (!btn) return;
        btn.innerHTML = this.sound.enabled
            ? '<i class="fas fa-volume-up"></i>'
            : '<i class="fas fa-volume-mute"></i>';
        btn.classList.toggle('muted', !this.sound.enabled);
    }

    // ═══════════════════════════════════════════════════
    // 화면 전환
    // ═══════════════════════════════════════════════════
    switchMode(mode) {
        ['startScreen','studyMode','manageMode','statsMode'].forEach(id => {
            document.getElementById(id)?.classList.add('hidden');
        });
        this.currentMode = mode;
        switch (mode) {
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

    // ═══════════════════════════════════════════════════
    // 단어 로드
    // ═══════════════════════════════════════════════════
    async loadWords() {
        try {
            const words = this.db.getAll('words');
            if (words.length === 0) {
                await this.addDefaultWords();
                return this.db.getAll('words');
            }
            return words;
        } catch (e) {
            console.error('단어 로딩 실패:', e);
            return [];
        }
    }

    async addDefaultWords() {
        const defaults = [
            { word: 'abundant', meaning: '풍부한', difficulty: 2 },
            { word: 'accomplish', meaning: '성취하다', difficulty: 2 },
            { word: 'acquire', meaning: '획득하다', difficulty: 3 },
            { word: 'adapt', meaning: '적응하다', difficulty: 2 },
            { word: 'advocate', meaning: '옹호하다', difficulty: 4 },
        ];
        for (const w of defaults) await this.createWord(w);
    }

    async createWord(wordData) {
        const now = new Date().toISOString();
        const word = {
            ...wordData,
            is_starred: false, wrong_count: 0, correct_count: 0,
            streak: 0, next_review: now, review_interval: 1, created_at: now
        };
        try { return this.db.save('words', word); }
        catch (e) { console.error('단어 추가 실패:', e); return null; }
    }

    // ═══════════════════════════════════════════════════
    // 학습 시작  starMode=true → 별표 단어만
    // ═══════════════════════════════════════════════════
    async startStudy(starMode = false) {
        try {
            this.isStarMode = starMode;
            this.sessionId = this.generateId();
            this.sessionStartTime = new Date();
            this.currentIndex = 0;
            this.correctAnswers = 0;
            this.totalAnswers = 0;

            const allWords = await this.loadWords();
            let pool = starMode ? allWords.filter(w => w.is_starred) : allWords;

            if (!pool || pool.length === 0) {
                if (starMode) {
                    this._toast('⭐ 별표 표시한 단어가 없어요! 단어에 별표를 먼저 추가해주세요.', 3000);
                } else {
                    this._toast('학습할 단어가 없습니다. 먼저 단어를 추가해주세요.', 3000);
                }
                return;
            }

            this.currentWords = (await this.getPriorityWords(pool)).slice(0, 10);

            // 모드 배너 표시
            const banner = document.getElementById('studyModeBanner');
            if (banner) banner.classList.toggle('hidden', !starMode);

            this.switchMode('study');

            // 시작 효과음
            if (starMode) { this.sound.starStudyStart(); }
            else          { this.sound.start(); }

            // 시작 토스트
            this._toast(starMode
                ? `⭐ 별표 단어 ${this.currentWords.length}개 학습 시작!`
                : `🎯 오늘의 학습 ${this.currentWords.length}개 시작!`
            );

            this.showCurrentWord();
        } catch (e) {
            console.error('startStudy error:', e);
        }
    }

    // ═══════════════════════════════════════════════════
    // 우선순위 정렬
    // ═══════════════════════════════════════════════════
    async getPriorityWords(words) {
        const now = new Date();
        return words
            .map(w => {
                let priority = 4;
                if (w.is_starred) priority = 10;
                else if (w.wrong_count > w.correct_count) priority = 8;
                else if (new Date(w.next_review) <= now) priority = 6;
                else if (w.streak >= 5) priority = 2;
                return { ...w, priority };
            })
            .sort((a, b) => b.priority - a.priority)
            .map(({ priority, ...w }) => w);
    }

    // ═══════════════════════════════════════════════════
    // 단어 표시
    // ═══════════════════════════════════════════════════
    showCurrentWord() {
        this._answerLocked = false;

        if (!this.currentWords || this.currentIndex >= this.currentWords.length) {
            this.finishStudy();
            return;
        }

        this.currentWord = this.currentWords[this.currentIndex];
        this.quizMode = false;

        // 카드 애니메이션
        const card = document.getElementById('wordCard');
        if (card) { card.classList.remove('fade-in'); void card.offsetWidth; card.classList.add('fade-in'); }

        // 단어 텍스트
        const wordText = document.getElementById('wordText');
        if (wordText) wordText.textContent = this.currentWord.word;

        // 카테고리 배지
        const badge = document.getElementById('categoryBadge');
        if (badge) badge.innerHTML = this.getCategoryBadge(this.currentWord.category);

        // 별표 상태
        this._updateStarBtn();

        // 진행률
        this.updateProgress();

        // 퀴즈 초기화
        const quizSection = document.getElementById('quizSection');
        const nextBtn = document.getElementById('nextBtn');
        if (quizSection) quizSection.classList.remove('hidden');
        if (nextBtn) nextBtn.disabled = true;

        this.showQuiz();
    }

    _updateStarBtn() {
        const btn = document.getElementById('starBtn');
        if (!btn || !this.currentWord) return;
        btn.innerHTML = this.currentWord.is_starred
            ? '<i class="fas fa-star text-yellow-400"></i>'
            : '<i class="far fa-star text-gray-300"></i>';
    }

    // ═══════════════════════════════════════════════════
    // 퀴즈
    // ═══════════════════════════════════════════════════
    showQuiz() {
        this.quizMode = true;
        const container = document.getElementById('quizOptions');
        container.innerHTML = '';

        const options = this.generateQuizOptions();
        options.forEach((option, i) => {
            const btn = document.createElement('button');
            btn.className = 'p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition text-left touch-friendly';
            btn.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold shrink-0">${i + 1}</span>
                    <span class="text-sm leading-snug">${option}</span>
                </div>`;
            this.touchHandler.handleMobileClick(btn, () => this.selectAnswer(option));
            container.appendChild(btn);
        });
    }

    generateQuizOptions() {
        const correct = this.currentWord.meaning;
        const options = new Set([correct]);

        // 전체 단어풀에서 오답 수집 (현재 학습 목록 + 전체 DB)
        const allWords = this.db.getAll('words');
        const pool = [...this.currentWords, ...allWords]
            .filter(w => w.id !== this.currentWord.id)
            .map(w => w.meaning);

        const shuffled = pool.sort(() => Math.random() - 0.5);
        for (const m of shuffled) {
            if (!options.has(m)) options.add(m);
            if (options.size >= 5) break;
        }

        // 부족하면 fallback
        if (options.size < 5) {
            const fallback = ['매우 어려운','복잡한','심화된','고급의','전문적인',
                              '기초적인','간단한','쉬운','중요한','필수적인'];
            for (const m of fallback.sort(() => Math.random() - 0.5)) {
                if (!options.has(m)) options.add(m);
                if (options.size >= 5) break;
            }
        }

        return Array.from(options).sort(() => Math.random() - 0.5);
    }

    // ═══════════════════════════════════════════════════
    // 답안 선택
    // ═══════════════════════════════════════════════════
    async selectAnswer(selectedAnswer) {
        if (this._answerLocked) return;
        this._answerLocked = true;

        const isCorrect = selectedAnswer === this.currentWord.meaning;
        this.totalAnswers++;

        // 버튼 시각 피드백
        document.querySelectorAll('#quizOptions button').forEach(btn => {
            const text = btn.querySelector('span:last-child').textContent;
            if (text === this.currentWord.meaning) {
                btn.className = 'p-4 bg-green-50 border-2 border-green-500 rounded-xl text-left pulse-success';
            } else if (text === selectedAnswer && !isCorrect) {
                btn.className = 'p-4 bg-red-50 border-2 border-red-400 rounded-xl text-left';
            } else {
                btn.className = 'p-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-left opacity-60';
            }
            btn.disabled = true;
        });

        if (isCorrect) {
            this.correctAnswers++;
            this.currentWord.correct_count++;
            this.currentWord.streak++;
            this.sound.correct();
            this._showFloatMsg(this.getPraiseMessage(), 'bg-green-500');
            if (this.currentWord.streak >= 5)
                this.currentWord.review_interval = Math.min(this.currentWord.review_interval * 2, 30);
        } else {
            this.currentWord.wrong_count++;
            this.currentWord.streak = 0;
            this.currentWord.review_interval = Math.max(1, Math.floor(this.currentWord.review_interval / 2));
            this.sound.wrong();
            // 오답: 흔들기
            document.getElementById('quizSection')?.classList.add('shake');
            setTimeout(() => document.getElementById('quizSection')?.classList.remove('shake'), 500);
            this._showFloatMsg(`❌ 정답: <strong>${this.currentWord.meaning}</strong>`, 'bg-blue-500', 2800);
        }

        // 복습 시간 갱신
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + this.currentWord.review_interval);
        this.currentWord.next_review = nextReview.toISOString();

        await this.saveLearningRecord(isCorrect, selectedAnswer);
        await this.updateWord(this.currentWord);

        document.getElementById('nextBtn').disabled = false;
    }

    // ═══════════════════════════════════════════════════
    // 칭찬 메시지
    // ═══════════════════════════════════════════════════
    getPraiseMessage() {
        const list = [
            "와! 정말 훌륭해요! 🎉",
            "정답이에요! 천재세요! 🌟",
            "완벽해요! 노력이 빛나는 순간! ✨",
            "훌륭해요! 이 속도면 금방 마스터! 🚀",
            "정답! 기억력이 정말 놀라워요! 🧠",
            "대단해요! 꾸준함이 비결이에요! 📈",
            "멋져요! 단어 마스터가 되어가요! 🏆",
        ];
        return list[Math.floor(Math.random() * list.length)];
    }

    // ═══════════════════════════════════════════════════
    // 별표 토글
    // ═══════════════════════════════════════════════════
    toggleStar() {
        if (!this.currentWord) return;
        this.currentWord.is_starred = !this.currentWord.is_starred;
        this._updateStarBtn();

        // 별표 팝 애니메이션
        const btn = document.getElementById('starBtn');
        if (btn) { btn.classList.remove('star-pop'); void btn.offsetWidth; btn.classList.add('star-pop'); }

        if (this.currentWord.is_starred) {
            this.sound.starOn();
            this._toast('⭐ 별표 단어로 등록됐어요!');
        } else {
            this.sound.starOff();
            this._toast('별표가 해제됐어요.');
        }
        this.updateWord(this.currentWord);
    }

    // ═══════════════════════════════════════════════════
    // 다음 단어
    // ═══════════════════════════════════════════════════
    nextWord() {
        this.sound.next();
        this.currentIndex++;

        if (this.currentWords && this.currentIndex === Math.floor(this.currentWords.length / 2)) {
            this._toast('🔥 벌써 절반 완료! 잘하고 있어요!');
        }

        this.showCurrentWord();
    }

    // ═══════════════════════════════════════════════════
    // 진행률
    // ═══════════════════════════════════════════════════
    updateProgress() {
        if (!this.currentWords?.length) return;
        const pct = (this.currentIndex / this.currentWords.length) * 100;
        const bar = document.getElementById('progressBar');
        const txt = document.getElementById('progressText');
        if (bar) bar.style.width = `${pct}%`;
        if (txt) txt.textContent = `${this.currentIndex}/${this.currentWords.length}`;
    }

    // ═══════════════════════════════════════════════════
    // 학습 완료
    // ═══════════════════════════════════════════════════
    async finishStudy() {
        const endTime = new Date();
        const duration = Math.floor((endTime - this.sessionStartTime) / 1000 / 60);
        const score = this.totalAnswers > 0 ? Math.round((this.correctAnswers / this.totalAnswers) * 100) : 0;

        this.sound.finish();

        const sessionData = {
            id: this.sessionId,
            session_name: `${this.isStarMode ? '⭐ 별표 ' : ''}학습 세션 ${new Date().toLocaleDateString()}`,
            total_words: this.totalAnswers,
            correct_words: this.correctAnswers,
            score,
            start_time: this.sessionStartTime.toISOString(),
            end_time: endTime.toISOString(),
            duration_minutes: duration
        };
        try { this.db.save('session_scores', sessionData); } catch {}

        const praise =
            score >= 90 ? '🏆 완벽해요! 모든 단어를 마스터했어요!' :
            score >= 80 ? '🌟 훌륭해요! 거의 완벽에 가까워요!' :
            score >= 70 ? '👏 잘했어요! 금방 고수가 될 거예요!' :
            score >= 60 ? '💪 괜찮아요! 점점 나아지고 있어요!' :
                          '🌱 다음엔 더 좋은 결과를 볼 수 있을 거예요!';

        alert(`🎉 학습 완료!\n\n${praise}\n\n맞춘 개수: ${this.correctAnswers}/${this.totalAnswers}\n점수: ${score}%\n소요 시간: ${duration}분`);
        this.switchMode('start');
    }

    // ═══════════════════════════════════════════════════
    // 학습 기록 / 단어 업데이트
    // ═══════════════════════════════════════════════════
    async saveLearningRecord(isCorrect, selectedAnswer) {
        try {
            this.db.save('learning_records', {
                word_id: this.currentWord.id,
                session_id: this.sessionId,
                is_correct: isCorrect,
                selected_answer: selectedAnswer,
                learned_at: new Date().toISOString()
            });
        } catch {}
    }

    async updateWord(word) {
        try { this.db.update('words', word.id, word); } catch {}
    }

    // ═══════════════════════════════════════════════════
    // 단어 관리
    // ═══════════════════════════════════════════════════
    async addWord() {
        const wordInput    = document.getElementById('newWord');
        const meaningInput = document.getElementById('newMeaning');
        const word    = wordInput.value.trim();
        const meaning = meaningInput.value.trim();
        if (!word || !meaning) { this._toast('단어와 의미를 모두 입력해주세요.'); return; }
        await this.createWord({ word, meaning, difficulty: 3 });
        wordInput.value = '';
        meaningInput.value = '';
        this._toast(`✅ "${word}" 추가됨!`);
        this.loadWordList();
    }

    getCategoryBadge(category) {
        const map = {
            '생활':   'bg-green-100 text-green-700',
            'SW개발': 'bg-blue-100 text-blue-700',
            '디자인': 'bg-purple-100 text-purple-700',
        };
        const cls = map[category] || 'bg-gray-100 text-gray-500';
        return category
            ? `<span class="text-xs px-2 py-0.5 rounded-full font-medium ${cls}">${category}</span>`
            : '';
    }

    _setWordTab(tab) {
        this._wordListTab = tab;
        const allBtn     = document.getElementById('tabAll');
        const starredBtn = document.getElementById('tabStarred');
        const active   = 'bg-indigo-600 text-white';
        const inactive = 'bg-gray-100 text-gray-600 hover:bg-gray-200';
        if (tab === 'all') {
            allBtn?.classList.replace('bg-gray-100','bg-indigo-600');
            allBtn?.classList.replace('text-gray-600','text-white');
            starredBtn?.classList.replace('bg-indigo-600','bg-gray-100');
            starredBtn?.classList.replace('text-white','text-gray-600');
        } else {
            starredBtn?.classList.replace('bg-gray-100','bg-indigo-600');
            starredBtn?.classList.replace('text-gray-600','text-white');
            allBtn?.classList.replace('bg-indigo-600','bg-gray-100');
            allBtn?.classList.replace('text-white','text-gray-600');
        }
        this.loadWordList();
    }

    async loadWordList() {
        const words     = await this.loadWords();
        const starred   = words.filter(w => w.is_starred);
        const container = document.getElementById('wordList');
        const emptyMsg  = document.getElementById('emptyStarMsg');
        const countBadge = document.getElementById('starredCount');
        if (!container) return;

        if (countBadge) countBadge.textContent = starred.length;

        const display = this._wordListTab === 'starred' ? starred : words;

        container.innerHTML = '';
        if (this._wordListTab === 'starred' && starred.length === 0) {
            emptyMsg?.classList.remove('hidden');
            return;
        }
        emptyMsg?.classList.add('hidden');

        display.forEach(word => {
            const card = document.createElement('div');
            card.className = 'bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div class="flex flex-col gap-1 min-w-0">
                        <h4 class="font-bold text-gray-800 truncate">${word.word}</h4>
                        ${this.getCategoryBadge(word.category)}
                    </div>
                    <div class="flex gap-1 shrink-0 ml-2">
                        <button onclick="app.toggleWordStar('${word.id}')"
                            class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-yellow-50 transition">
                            <i class="${word.is_starred ? 'fas text-yellow-400' : 'far text-gray-300'} fa-star text-sm"></i>
                        </button>
                        <button onclick="app.deleteWord('${word.id}')"
                            class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 transition text-red-400 text-sm">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                <p class="text-gray-500 text-sm mb-2">${word.meaning}</p>
                <div class="flex justify-between text-xs text-gray-400">
                    <span>✅ ${word.correct_count} &nbsp; ❌ ${word.wrong_count}</span>
                    <span>연속 ${word.streak}회</span>
                </div>`;
            container.appendChild(card);
        });
    }

    async toggleWordStar(wordId) {
        const words = await this.loadWords();
        const word  = words.find(w => w.id === wordId);
        if (word) {
            word.is_starred = !word.is_starred;
            await this.updateWord(word);
            if (word.is_starred) this.sound.starOn(); else this.sound.starOff();
            this.loadWordList();
        }
    }

    async deleteWord(wordId) {
        if (confirm('이 단어를 삭제할까요?')) {
            try { this.db.delete('words', wordId); this.loadWordList(); } catch {}
        }
    }

    importWords() { document.getElementById('fileInput')?.click(); }

    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const lines = e.target.result.split('\n').filter(l => l.trim());
            let count = 0;
            for (const line of lines) {
                const [word, meaning] = line.split(',').map(s => s.trim());
                if (word && meaning) { await this.createWord({ word, meaning, difficulty: 3 }); count++; }
            }
            this.loadWordList();
            this._toast(`📥 ${count}개의 단어를 가져왔습니다!`);
        };
        reader.readAsText(file);
    }

    exportWords() {
        this.loadWords().then(words => {
            const content = words.map(w => `${w.word},${w.meaning}`).join('\n');
            const a = Object.assign(document.createElement('a'), {
                href: URL.createObjectURL(new Blob([content], { type: 'text/plain' })),
                download: 'flashcard_words.txt'
            });
            a.click();
            URL.revokeObjectURL(a.href);
        });
    }

    // ═══════════════════════════════════════════════════
    // 통계
    // ═══════════════════════════════════════════════════
    async updateStats() {
        const words    = await this.loadWords();
        const sessions = await this.loadSessions();
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

        set('totalWords',   words.length);
        set('starredWords', words.filter(w => w.is_starred).length);
        const avg = sessions.length > 0
            ? Math.round(sessions.reduce((s, x) => s + x.score, 0) / sessions.length) : 0;
        set('avgScore', `${avg}%`);
        set('studyDays', new Set(sessions.map(s => new Date(s.start_time).toDateString())).size);

        this.displayRecentSessions(sessions.slice(-5));
    }

    async loadSessions() {
        try { return this.db.getAll('session_scores'); } catch { return []; }
    }

    displayRecentSessions(sessions) {
        const container = document.getElementById('recentSessions');
        if (!container) return;
        container.innerHTML = '';
        if (sessions.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center py-6">학습 기록이 없습니다.</p>';
            return;
        }
        [...sessions].reverse().forEach(s => {
            const div = document.createElement('div');
            div.className = 'bg-gray-50 rounded-xl p-4 flex justify-between items-center';
            const color = s.score >= 80 ? 'text-green-600' : s.score >= 60 ? 'text-yellow-500' : 'text-red-500';
            div.innerHTML = `
                <div>
                    <p class="font-semibold text-gray-800 text-sm">${s.session_name}</p>
                    <p class="text-xs text-gray-400">${new Date(s.start_time).toLocaleDateString()}</p>
                </div>
                <div class="text-right">
                    <p class="text-lg font-bold ${color}">${s.score}%</p>
                    <p class="text-xs text-gray-400">${s.correct_words}/${s.total_words}</p>
                </div>`;
            container.appendChild(div);
        });
    }

    // ═══════════════════════════════════════════════════
    // 모달
    // ═══════════════════════════════════════════════════
    showModal(title, message, onConfirm = null) {
        document.getElementById('modalTitle').textContent  = title;
        document.getElementById('modalMessage').textContent = message;
        document.getElementById('modal').classList.replace('hidden','flex');
        this.modalCallback = onConfirm;
    }
    closeModal() {
        document.getElementById('modal').classList.replace('flex','hidden');
        this.modalCallback = null;
    }
    confirmModal() { this.modalCallback?.(); this.closeModal(); }

    // ═══════════════════════════════════════════════════
    // UI 유틸
    // ═══════════════════════════════════════════════════

    /** 화면 중앙 플로팅 메시지 (정답/오답) */
    _showFloatMsg(html, bgClass, duration = 2000) {
        const el = document.createElement('div');
        el.className = `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${bgClass} text-white px-6 py-4 rounded-2xl text-base font-bold shadow-2xl z-50 animate-bounce pointer-events-none`;
        el.innerHTML = html;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), duration);
    }

    /** 하단 토스트 알림 */
    _toast(msg, duration = 2100) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const el = document.createElement('div');
        el.className = 'toast bg-gray-800 text-white text-sm px-5 py-2.5 rounded-full shadow-lg';
        el.textContent = msg;
        container.appendChild(el);
        setTimeout(() => el.remove(), duration);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// 앱 초기화
let app;
try {
    app = new FlashCardApp();
    window.app = app;
    console.log('FlashCardApp initialized');
} catch (e) {
    console.error('FlashCardApp init failed:', e);
}
