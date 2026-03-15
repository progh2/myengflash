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
            const now = new Date().toISOString();
            const make = (id, word, meaning, difficulty, category) => ({
                id: String(id), word, meaning, difficulty, category,
                is_starred: false, wrong_count: 0, correct_count: 0,
                streak: 0, next_review: now, review_interval: 1, created_at: now
            });

            const defaultWords = [
                // ─────────────────────────────────────────
                // 🏠 생활 (일상 영어) — 60개
                // ─────────────────────────────────────────
                make(1,  'abundant',      '풍부한',            2, '생활'),
                make(2,  'accomplish',    '성취하다',           2, '생활'),
                make(3,  'acquire',       '획득하다',           3, '생활'),
                make(4,  'adapt',         '적응하다',           2, '생활'),
                make(5,  'advocate',      '옹호하다',           4, '생활'),
                make(6,  'affect',        '영향을 미치다',       2, '생활'),
                make(7,  'afford',        '여유가 있다',         2, '생활'),
                make(8,  'anxiety',       '불안',              2, '생활'),
                make(9,  'approach',      '접근하다',           2, '생활'),
                make(10, 'arbitrary',     '임의의',             4, '생활'),
                make(11, 'attitude',      '태도',              2, '생활'),
                make(12, 'benefit',       '혜택',              2, '생활'),
                make(13, 'budget',        '예산',              2, '생활'),
                make(14, 'challenge',     '도전',              2, '생활'),
                make(15, 'commute',       '통근하다',           2, '생활'),
                make(16, 'convenient',    '편리한',             2, '생활'),
                make(17, 'deadline',      '마감일',             2, '생활'),
                make(18, 'decision',      '결정',              2, '생활'),
                make(19, 'destination',   '목적지',             2, '생활'),
                make(20, 'efficient',     '효율적인',           3, '생활'),
                make(21, 'emergency',     '비상사태',           2, '생활'),
                make(22, 'environment',   '환경',              2, '생활'),
                make(23, 'exhausted',     '지쳐있는',           2, '생활'),
                make(24, 'flexible',      '유연한',             2, '생활'),
                make(25, 'frustrated',    '좌절한',             2, '생활'),
                make(26, 'grateful',      '감사한',             2, '생활'),
                make(27, 'grocery',       '식료품',             2, '생활'),
                make(28, 'hesitate',      '망설이다',           3, '생활'),
                make(29, 'household',     '가정의',             2, '생활'),
                make(30, 'income',        '수입',              2, '생활'),
                make(31, 'inconvenient',  '불편한',             2, '생활'),
                make(32, 'inspire',       '영감을 주다',         3, '생활'),
                make(33, 'insurance',     '보험',              3, '생활'),
                make(34, 'interrupt',     '방해하다',           3, '생활'),
                make(35, 'lease',         '임대 계약',           3, '생활'),
                make(36, 'leisure',       '여가',              2, '생활'),
                make(37, 'maintain',      '유지하다',           2, '생활'),
                make(38, 'manage',        '관리하다',           2, '생활'),
                make(39, 'necessary',     '필요한',             2, '생활'),
                make(40, 'neighborhood',  '이웃, 동네',          2, '생활'),
                make(41, 'negotiate',     '협상하다',           3, '생활'),
                make(42, 'opportunity',   '기회',              2, '생활'),
                make(43, 'organize',      '정리하다',           2, '생활'),
                make(44, 'patience',      '인내심',             2, '생활'),
                make(45, 'polite',        '공손한',             2, '생활'),
                make(46, 'postpone',      '연기하다',           3, '생활'),
                make(47, 'priority',      '우선순위',           3, '생활'),
                make(48, 'productive',    '생산적인',           3, '생활'),
                make(49, 'recommend',     '추천하다',           2, '생활'),
                make(50, 'reduce',        '줄이다',             2, '생활'),
                make(51, 'reliable',      '믿을 수 있는',        3, '생활'),
                make(52, 'remind',        '상기시키다',          2, '생활'),
                make(53, 'rent',          '임대료, 빌리다',       2, '생활'),
                make(54, 'routine',       '일과, 루틴',          2, '생활'),
                make(55, 'satisfy',       '만족시키다',          2, '생활'),
                make(56, 'schedule',      '일정',              2, '생활'),
                make(57, 'solution',      '해결책',             2, '생활'),
                make(58, 'spontaneous',   '자발적인',           4, '생활'),
                make(59, 'sustainable',   '지속 가능한',         4, '생활'),
                make(60, 'volunteer',     '자원봉사자',          2, '생활'),

                // ─────────────────────────────────────────
                // 💻 SW 개발 — 100개
                // ─────────────────────────────────────────
                make(61,  'algorithm',       '알고리즘',                  3, 'SW개발'),
                make(62,  'API',             '응용 프로그래밍 인터페이스',    3, 'SW개발'),
                make(63,  'architecture',    '소프트웨어 구조',              3, 'SW개발'),
                make(64,  'asynchronous',    '비동기의',                   4, 'SW개발'),
                make(65,  'authentication',  '인증',                      3, 'SW개발'),
                make(66,  'authorization',   '권한 부여',                  4, 'SW개발'),
                make(67,  'backend',         '서버 측 로직',                2, 'SW개발'),
                make(68,  'bandwidth',       '대역폭',                    3, 'SW개발'),
                make(69,  'boolean',         '참/거짓 자료형',              2, 'SW개발'),
                make(70,  'branch',          '브랜치, 분기',                2, 'SW개발'),
                make(71,  'bug',             '소프트웨어 오류',              1, 'SW개발'),
                make(72,  'cache',           '캐시, 임시 저장',             3, 'SW개발'),
                make(73,  'callback',        '콜백 함수',                  3, 'SW개발'),
                make(74,  'class',           '클래스',                    2, 'SW개발'),
                make(75,  'CLI',             '명령줄 인터페이스',            3, 'SW개발'),
                make(76,  'cloud',           '클라우드 컴퓨팅',             2, 'SW개발'),
                make(77,  'compile',         '컴파일하다',                  2, 'SW개발'),
                make(78,  'component',       '컴포넌트, 구성 요소',          2, 'SW개발'),
                make(79,  'container',       '컨테이너',                   3, 'SW개발'),
                make(80,  'CSS',             '스타일시트 언어',              2, 'SW개발'),
                make(81,  'cursor',          '커서, 포인터',                2, 'SW개발'),
                make(82,  'database',        '데이터베이스',                 2, 'SW개발'),
                make(83,  'debug',           '버그를 찾아 수정하다',          2, 'SW개발'),
                make(84,  'dependency',      '의존성',                    3, 'SW개발'),
                make(85,  'deploy',          '배포하다',                   3, 'SW개발'),
                make(86,  'deprecate',       '사용 중단 예고하다',           4, 'SW개발'),
                make(87,  'Docker',          '컨테이너 가상화 플랫폼',        3, 'SW개발'),
                make(88,  'DOM',             '문서 객체 모델',              3, 'SW개발'),
                make(89,  'encapsulation',   '캡슐화',                    4, 'SW개발'),
                make(90,  'endpoint',        'API 접속 지점',              3, 'SW개발'),
                make(91,  'exception',       '예외 오류',                  3, 'SW개발'),
                make(92,  'framework',       '개발 프레임워크',              2, 'SW개발'),
                make(93,  'frontend',        '화면 UI 개발 영역',            2, 'SW개발'),
                make(94,  'function',        '함수',                      1, 'SW개발'),
                make(95,  'Git',             '분산 버전 관리 시스템',         2, 'SW개발'),
                make(96,  'IDE',             '통합 개발 환경',              3, 'SW개발'),
                make(97,  'inheritance',     '상속',                      3, 'SW개발'),
                make(98,  'instance',        '인스턴스, 객체',              3, 'SW개발'),
                make(99,  'integer',         '정수형',                    2, 'SW개발'),
                make(100, 'interface',       '인터페이스',                  3, 'SW개발'),
                make(101, 'iterate',         '반복하다',                   3, 'SW개발'),
                make(102, 'JSON',            'JSON 데이터 형식',            2, 'SW개발'),
                make(103, 'kernel',          '운영체제 핵심 부분',           4, 'SW개발'),
                make(104, 'latency',         '응답 지연 시간',              4, 'SW개발'),
                make(105, 'library',         '라이브러리',                  2, 'SW개발'),
                make(106, 'loop',            '반복문',                    1, 'SW개발'),
                make(107, 'merge',           '병합하다',                   2, 'SW개발'),
                make(108, 'method',          '메서드',                    2, 'SW개발'),
                make(109, 'middleware',      '미들웨어',                   4, 'SW개발'),
                make(110, 'migration',       '데이터 이전, 마이그레이션',      3, 'SW개발'),
                make(111, 'module',          '모듈',                      2, 'SW개발'),
                make(112, 'null',            '빈 값, 널',                  2, 'SW개발'),
                make(113, 'object',          '객체',                      2, 'SW개발'),
                make(114, 'open source',     '오픈 소스',                  2, 'SW개발'),
                make(115, 'parameter',       '매개변수',                   3, 'SW개발'),
                make(116, 'payload',         '전송 데이터',                 3, 'SW개발'),
                make(117, 'pipeline',        '파이프라인, 처리 흐름',         3, 'SW개발'),
                make(118, 'polymorphism',    '다형성',                    4, 'SW개발'),
                make(119, 'promise',         '비동기 처리 객체',             3, 'SW개발'),
                make(120, 'pull request',    '코드 병합 요청',              3, 'SW개발'),
                make(121, 'query',           '데이터 조회 명령',             2, 'SW개발'),
                make(122, 'recursion',       '재귀',                      4, 'SW개발'),
                make(123, 'refactor',        '코드 구조 개선',              3, 'SW개발'),
                make(124, 'regression',      '기존 기능 재결함',             4, 'SW개발'),
                make(125, 'render',          '화면에 출력하다',              2, 'SW개발'),
                make(126, 'repository',      '코드 저장소',                 2, 'SW개발'),
                make(127, 'REST',            'HTTP 기반 API 설계 방식',      3, 'SW개발'),
                make(128, 'runtime',         '실행 환경, 런타임',            3, 'SW개발'),
                make(129, 'scalable',        '확장 가능한',                 4, 'SW개발'),
                make(130, 'schema',          '데이터 구조 정의',             3, 'SW개발'),
                make(131, 'SDK',             '소프트웨어 개발 키트',          3, 'SW개발'),
                make(132, 'server',          '서버',                      1, 'SW개발'),
                make(133, 'session',         '세션, 접속 단위',             2, 'SW개발'),
                make(134, 'sprint',          '스크럼의 개발 반복 주기',       3, 'SW개발'),
                make(135, 'stack',           '스택 자료구조',               3, 'SW개발'),
                make(136, 'state',           '상태',                      2, 'SW개발'),
                make(137, 'string',          '문자열',                    1, 'SW개발'),
                make(138, 'syntax',          '문법',                      2, 'SW개발'),
                make(139, 'terminal',        '터미널, 명령 창',             2, 'SW개발'),
                make(140, 'test',            '테스트',                    1, 'SW개발'),
                make(141, 'token',           '인증 토큰',                  3, 'SW개발'),
                make(142, 'type',            '자료형',                    2, 'SW개발'),
                make(143, 'UI',              '사용자 인터페이스',            2, 'SW개발'),
                make(144, 'UX',              '사용자 경험',                 2, 'SW개발'),
                make(145, 'variable',        '변수',                      1, 'SW개발'),
                make(146, 'version control', '버전 관리',                  3, 'SW개발'),
                make(147, 'webhook',         '이벤트 기반 HTTP 콜백',        4, 'SW개발'),
                make(148, 'framework',       '개발 프레임워크',              2, 'SW개발'),
                make(149, 'agile',           '애자일 방법론',               3, 'SW개발'),
                make(150, 'scrum',           '스크럼 방법론',               3, 'SW개발'),
                make(151, 'kanban',          '칸반 보드 방식',              3, 'SW개발'),
                make(152, 'CI/CD',           '지속적 통합/배포',             4, 'SW개발'),
                make(153, 'microservice',    '마이크로서비스 아키텍처',        4, 'SW개발'),
                make(154, 'monolith',        '단일 애플리케이션 구조',        3, 'SW개발'),
                make(155, 'queue',           '큐 자료구조',                 3, 'SW개발'),
                make(156, 'hash',            '해시값',                    3, 'SW개발'),
                make(157, 'encryption',      '암호화',                    4, 'SW개발'),
                make(158, 'environment variable', '환경 변수',              3, 'SW개발'),
                make(159, 'hotfix',          '긴급 버그 수정',              3, 'SW개발'),
                make(160, 'mock',            '가짜 객체 (테스트용)',          3, 'SW개발'),

                // ─────────────────────────────────────────
                // 🎨 디자인 — 60개
                // ─────────────────────────────────────────
                make(161, 'alignment',       '정렬',                      2, '디자인'),
                make(162, 'asset',           '디자인 자산, 리소스',          2, '디자인'),
                make(163, 'balance',         '균형',                      2, '디자인'),
                make(164, 'baseline',        '기준선',                    3, '디자인'),
                make(165, 'brand identity',  '브랜드 정체성',               3, '디자인'),
                make(166, 'breakpoint',      '반응형 전환점',               3, '디자인'),
                make(167, 'canvas',          '캔버스, 작업 영역',            2, '디자인'),
                make(168, 'color palette',   '색상 팔레트',                 2, '디자인'),
                make(169, 'composition',     '구도, 구성',                  3, '디자인'),
                make(170, 'contrast',        '명암 대비',                  2, '디자인'),
                make(171, 'crop',            '이미지 자르기',               2, '디자인'),
                make(172, 'cursor',          '커서 디자인',                 2, '디자인'),
                make(173, 'depth',           '깊이감',                    2, '디자인'),
                make(174, 'flat design',     '플랫 디자인',                 3, '디자인'),
                make(175, 'flow',            '화면 흐름, 플로우',            2, '디자인'),
                make(176, 'font',            '폰트, 서체',                  2, '디자인'),
                make(177, 'gestalt',         '게슈탈트 원리',               4, '디자인'),
                make(178, 'gradient',        '그라데이션',                  2, '디자인'),
                make(179, 'grid',            '그리드 시스템',               2, '디자인'),
                make(180, 'guideline',       '디자인 가이드라인',            3, '디자인'),
                make(181, 'hierarchy',       '시각적 계층 구조',             3, '디자인'),
                make(182, 'icon',            '아이콘',                    1, '디자인'),
                make(183, 'illustration',    '일러스트레이션',               2, '디자인'),
                make(184, 'interaction',     '인터랙션',                   3, '디자인'),
                make(185, 'kerning',         '자간 조정',                  4, '디자인'),
                make(186, 'layer',           '레이어',                    2, '디자인'),
                make(187, 'layout',          '레이아웃, 배치',              2, '디자인'),
                make(188, 'leading',         '행간',                      3, '디자인'),
                make(189, 'logo',            '로고',                      1, '디자인'),
                make(190, 'margin',          '여백(바깥)',                  2, '디자인'),
                make(191, 'mockup',          '목업, 시각적 시안',            2, '디자인'),
                make(192, 'motion design',   '모션 디자인',                 3, '디자인'),
                make(193, 'negative space',  '여백 공간',                  3, '디자인'),
                make(194, 'opacity',         '불투명도',                   2, '디자인'),
                make(195, 'padding',         '여백(안쪽)',                  2, '디자인'),
                make(196, 'pixel',           '픽셀',                      1, '디자인'),
                make(197, 'placeholder',     '임시 텍스트/이미지',           2, '디자인'),
                make(198, 'prototype',       '프로토타입',                  3, '디자인'),
                make(199, 'responsive',      '반응형 디자인',               3, '디자인'),
                make(200, 'saturation',      '채도',                      3, '디자인'),
                make(201, 'shadow',          '그림자 효과',                 2, '디자인'),
                make(202, 'skeleton',        '스켈레톤 로딩 화면',           3, '디자인'),
                make(203, 'spacing',         '간격',                      2, '디자인'),
                make(204, 'style guide',     '스타일 가이드',               3, '디자인'),
                make(205, 'SVG',             '벡터 그래픽 형식',             3, '디자인'),
                make(206, 'symmetry',        '대칭',                      2, '디자인'),
                make(207, 'token',           '디자인 토큰',                 4, '디자인'),
                make(208, 'typography',      '타이포그래피, 서체 디자인',      3, '디자인'),
                make(209, 'usability',       '사용성',                    3, '디자인'),
                make(210, 'vector',          '벡터 그래픽',                 3, '디자인'),
                make(211, 'viewport',        '화면 표시 영역',              3, '디자인'),
                make(212, 'visual weight',   '시각적 무게감',               4, '디자인'),
                make(213, 'whitespace',      '여백',                      2, '디자인'),
                make(214, 'wireframe',       '와이어프레임',                2, '디자인'),
                make(215, 'affordance',      '행동 유도성',                 4, '디자인'),
                make(216, 'heuristic',       '사용성 평가 원칙',             4, '디자인'),
                make(217, 'persona',         '사용자 페르소나',              3, '디자인'),
                make(218, 'user journey',    '사용자 여정 지도',             3, '디자인'),
                make(219, 'design system',   '디자인 시스템',               3, '디자인'),
                make(220, 'accessibility',   '접근성',                    3, '디자인'),
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