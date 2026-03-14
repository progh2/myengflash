// 로컬 스토리지 기반 데이터베이스
class LocalStorageDB {
    constructor() {
        this.prefix = 'flashcard_';
        this.initializeData();
    }
    
    // 초기 데이터 설정
    initializeData() {
        // words 테이블이 없으면 기본 데이터 생성
        if (!localStorage.getItem(this.prefix + 'words')) {
            const defaultWords = [
                { id: '1', word: 'abundant', meaning: '풍부한', difficulty: 3, is_starred: false, wrong_count: 0, correct_count: 0, streak: 0, next_review: new Date().toISOString(), review_interval: 1, created_at: new Date().toISOString() },
                { id: '2', word: 'accomplish', meaning: '성취하다', difficulty: 2, is_starred: false, wrong_count: 0, correct_count: 0, streak: 0, next_review: new Date().toISOString(), review_interval: 1, created_at: new Date().toISOString() },
                { id: '3', word: 'acquire', meaning: '획득하다', difficulty: 3, is_starred: false, wrong_count: 0, correct_count: 0, streak: 0, next_review: new Date().toISOString(), review_interval: 1, created_at: new Date().toISOString() },
                { id: '4', word: 'adapt', meaning: '적응하다', difficulty: 2, is_starred: false, wrong_count: 0, correct_count: 0, streak: 0, next_review: new Date().toISOString(), review_interval: 1, created_at: new Date().toISOString() },
                { id: '5', word: 'advocate', meaning: '옹호하다', difficulty: 4, is_starred: false, wrong_count: 0, correct_count: 0, streak: 0, next_review: new Date().toISOString(), review_interval: 1, created_at: new Date().toISOString() },
                { id: '6', word: 'affect', meaning: '영향을 미치다', difficulty: 2, is_starred: false, wrong_count: 0, correct_count: 0, streak: 0, next_review: new Date().toISOString(), review_interval: 1, created_at: new Date().toISOString() },
                { id: '7', word: 'afford', meaning: '여유가 있다', difficulty: 3, is_starred: false, wrong_count: 0, correct_count: 0, streak: 0, next_review: new Date().toISOString(), review_interval: 1, created_at: new Date().toISOString() },
                { id: '8', word: 'anxiety', meaning: '불안', difficulty: 3, is_starred: false, wrong_count: 0, correct_count: 0, streak: 0, next_review: new Date().toISOString(), review_interval: 1, created_at: new Date().toISOString() },
                { id: '9', word: 'approach', meaning: '접근하다', difficulty: 2, is_starred: false, wrong_count: 0, correct_count: 0, streak: 0, next_review: new Date().toISOString(), review_interval: 1, created_at: new Date().toISOString() },
                { id: '10', word: 'arbitrary', meaning: '임의의', difficulty: 4, is_starred: false, wrong_count: 0, correct_count: 0, streak: 0, next_review: new Date().toISOString(), review_interval: 1, created_at: new Date().toISOString() }
            ];
            localStorage.setItem(this.prefix + 'words', JSON.stringify(defaultWords));
        }
        
        // 다른 테이블들도 초기화
        if (!localStorage.getItem(this.prefix + 'learning_records')) {
            localStorage.setItem(this.prefix + 'learning_records', JSON.stringify([]));
        }
        
        if (!localStorage.getItem(this.prefix + 'session_scores')) {
            localStorage.setItem(this.prefix + 'session_scores', JSON.stringify([]));
        }
    }
    
    // 데이터 저장
    save(table, data) {
        const key = this.prefix + table;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        
        // ID 생성
        if (!data.id) {
            data.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        }
        
        // 타임스탬프 추가
        if (table === 'words' && !data.created_at) {
            data.created_at = new Date().toISOString();
        }
        
        existing.push(data);
        localStorage.setItem(key, JSON.stringify(existing));
        return data;
    }
    
    // 전체 데이터 조회
    getAll(table) {
        const key = this.prefix + table;
        return JSON.parse(localStorage.getItem(key) || '[]');
    }
    
    // ID로 조회
    getById(table, id) {
        const items = this.getAll(table);
        return items.find(item => item.id === id);
    }
    
    // 데이터 업데이트
    update(table, id, newData) {
        const key = this.prefix + table;
        const items = JSON.parse(localStorage.getItem(key) || '[]');
        const index = items.findIndex(item => item.id === id);
        
        if (index !== -1) {
            // updated_at 타임스탬프 추가
            if (table === 'words') {
                items[index].updated_at = new Date().toISOString();
            }
            items[index] = { ...items[index], ...newData };
            localStorage.setItem(key, JSON.stringify(items));
            return items[index];
        }
        return null;
    }
    
    // 데이터 삭제
    delete(table, id) {
        const key = this.prefix + table;
        const items = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = items.filter(item => item.id !== id);
        localStorage.setItem(key, JSON.stringify(filtered));
        return true;
    }
    
    // 테이블 비우기
    clear(table) {
        const key = this.prefix + table;
        localStorage.setItem(key, JSON.stringify([]));
    }
    
    // 검색 기능
    search(table, field, value) {
        const items = this.getAll(table);
        return items.filter(item => 
            item[field] && item[field].toString().toLowerCase().includes(value.toLowerCase())
        );
    }
    
    // 통계 데이터 가져오기
    getStats() {
        const words = this.getAll('words');
        const learningRecords = this.getAll('learning_records');
        const sessions = this.getAll('session_scores');
        
        return {
            totalWords: words.length,
            starredWords: words.filter(w => w.is_starred).length,
            totalAttempts: learningRecords.length,
            correctAnswers: learningRecords.filter(r => r.is_correct).length,
            totalSessions: sessions.length,
            averageScore: sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length : 0
        };
    }
}

// 전역 변수로 설정
window.LocalStorageDB = LocalStorageDB;