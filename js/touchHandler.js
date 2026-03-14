// 터치 및 클릭 이벤트 유틸리티
class TouchClickHandler {
    constructor() {
        this.isTouch = false;
        this.detectTouch();
    }
    
    // 터치 디바이스 감지
    detectTouch() {
        this.isTouch = 'ontouchstart' in window || 
                      navigator.maxTouchPoints > 0 || 
                      navigator.msMaxTouchPoints > 0;
    }
    
    // 터치/클릭 이벤트 리스너 등록
    addListener(element, handler, options = {}) {
        if (!element) return;
        
        const { passive = false, once = false } = options;
        
        if (this.isTouch) {
            // 터치 디바이스용 이벤트
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handler(e);
            }, { passive, once });
            
            // 터치가 없는 경우를 대비한 클릭 이벤트도 추가
            element.addEventListener('click', (e) => {
                if (!e.defaultPrevented) {
                    handler(e);
                }
            }, { passive, once });
        } else {
            // 일반 클릭 이벤트
            element.addEventListener('click', handler, { passive, once });
        }
    }
    
    // 여러 요소에 동시에 등록
    addListeners(elements, handler, options = {}) {
        elements.forEach(element => {
            if (element) {
                this.addListener(element, handler, options);
            }
        });
    }
    
    // 모바일 브라우저용 특별 처리
    handleMobileClick(element, handler) {
        if (!element) return;
        
        let touchEndTime = 0;
        
        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchEndTime = Date.now();
        }, { passive: false });
        
        element.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touchDuration = Date.now() - touchEndTime;
            
            // 짧은 터치만 클릭으로 인식 (길게 누르기 방지)
            if (touchDuration < 500) {
                handler(e);
            }
        }, { passive: false });
        
        // 데스크톱용 클릭 이벤트
        element.addEventListener('click', handler);
    }
}

// 전역 변수로 설정
window.TouchClickHandler = TouchClickHandler;