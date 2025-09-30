/**
 * VanillaSlick - Pure JavaScript Carousel Library
 * Полная замена Slick Carousel без зависимости от jQuery
 */
class VanillaSlick {
    constructor(selector, options = {}) {
        // Получаем элемент контейнера
        this.container = typeof selector === 'string' 
            ? document.querySelector(selector) 
            : selector;
        
        if (!this.container) {
            throw new Error(`Элемент "${selector}" не найден`);
        }

        // Настройки по умолчанию
        this.defaults = {
            slidesToShow: 3,
            slidesToScroll: 1,
            infinite: true,
            arrows: true,
            dots: true,
            autoplay: false,
            autoplaySpeed: 3000,
            speed: 300,
            responsive: []
        };

        // Объединяем настройки
        this.settings = { ...this.defaults, ...options };
        
        // Внутренние переменные
        this.slides = [];
        this.slideWidth = 0;
        this.currentSlide = 0;
        this.slideCount = 0;
        this.autoplayTimer = null;
        this.isAnimating = false;
        
        // DOM элементы
        this.track = null;
        this.prevArrow = null;
        this.nextArrow = null;
        this.dotsContainer = null;
        this.dots = [];
        
        // Инициализация
        this.init();
    }

    init() {
        this.setupDOM();
        this.createSlides();
        this.createArrows();
        this.createDots();
        this.updateSlideWidth();
        this.bindEvents();
        this.goToSlide(0, false);
        
        if (this.settings.autoplay) {
            this.startAutoplay();
        }
        
        console.log('VanillaSlick инициализирован:', this.settings);
    }

    setupDOM() {
        // Создаем обертку для слайдов
        this.container.classList.add('vanilla-slick');
        
        // Создаем трек для слайдов
        this.track = document.createElement('div');
        this.track.className = 'vanilla-slick-track';
        
        // Перемещаем все дочерние элементы в трек
        while (this.container.firstChild) {
            this.track.appendChild(this.container.firstChild);
        }
        
        this.container.appendChild(this.track);
    }

    createSlides() {
        this.slides = Array.from(this.track.children);
        this.slideCount = this.slides.length;
        
        // Добавляем класс слайда каждому элементу
        this.slides.forEach((slide, index) => {
            slide.classList.add('vanilla-slick-slide');
            slide.dataset.slideIndex = index;
        });

        // Если включен infinite режим, клонируем слайды
        if (this.settings.infinite) {
            this.createInfiniteSlides();
        }
    }

    createInfiniteSlides() {
        const slidesToClone = this.settings.slidesToShow;
        
        // Клонируем первые слайды в конец
        for (let i = 0; i < slidesToClone; i++) {
            const clone = this.slides[i].cloneNode(true);
            clone.classList.add('vanilla-slick-cloned');
            this.track.appendChild(clone);
        }
        
        // Клонируем последние слайды в начало
        for (let i = this.slides.length - slidesToClone; i < this.slides.length; i++) {
            const clone = this.slides[i].cloneNode(true);
            clone.classList.add('vanilla-slick-cloned');
            this.track.insertBefore(clone, this.track.firstChild);
        }
        
        // Обновляем позицию для учета клонированных слайдов
        this.currentSlide = slidesToClone;
    }

    createArrows() {
        if (!this.settings.arrows) return;

        // Предыдущая стрелка
        this.prevArrow = document.createElement('button');
        this.prevArrow.className = 'vanilla-slick-prev vanilla-slick-arrow';
        this.prevArrow.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        this.prevArrow.setAttribute('aria-label', 'Предыдущий слайд');
        
        // Следующая стрелка
        this.nextArrow = document.createElement('button');
        this.nextArrow.className = 'vanilla-slick-next vanilla-slick-arrow';
        this.nextArrow.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        this.nextArrow.setAttribute('aria-label', 'Следующий слайд');
        
        this.container.appendChild(this.prevArrow);
        this.container.appendChild(this.nextArrow);
    }

    createDots() {
        if (!this.settings.dots) return;

        this.dotsContainer = document.createElement('ul');
        this.dotsContainer.className = 'vanilla-slick-dots';
        
        const dotsCount = Math.ceil(this.slideCount / this.settings.slidesToScroll);
        
        for (let i = 0; i < dotsCount; i++) {
            const dot = document.createElement('li');
            const button = document.createElement('button');
            
            button.textContent = i + 1;
            button.setAttribute('aria-label', `Перейти к слайду ${i + 1}`);
            
            dot.appendChild(button);
            this.dotsContainer.appendChild(dot);
            this.dots.push(dot);
        }
        
        this.container.appendChild(this.dotsContainer);
    }

    updateSlideWidth() {
        const containerWidth = this.container.offsetWidth;
        
        // Получаем стили первого слайда для расчета margin
        const firstSlide = this.slides[0];
        const slideStyle = window.getComputedStyle(firstSlide);
        const marginLeft = parseFloat(slideStyle.marginLeft) || 0;
        const marginRight = parseFloat(slideStyle.marginRight) || 0;
        const totalMargin = marginLeft + marginRight;
        
        // Вычисляем ширину слайда с учетом margin
        this.slideWidth = (containerWidth - (totalMargin * this.settings.slidesToShow)) / this.settings.slidesToShow;
        
        // Применяем ширину к слайдам
        const allSlides = this.track.children;
        for (let slide of allSlides) {
            slide.style.width = `${this.slideWidth}px`;
            slide.style.float = 'left';
            slide.style.boxSizing = 'border-box';
        }
        
        // Устанавливаем ширину трека с учетом margin
        const totalWidth = (this.slideWidth + totalMargin) * allSlides.length;
        this.track.style.width = `${totalWidth}px`;
        this.track.style.position = 'relative';
        this.track.style.transition = `transform ${this.settings.speed}ms ease`;
    }

    bindEvents() {
        // Обработчики стрелок
        if (this.prevArrow) {
            this.prevArrow.addEventListener('click', () => this.prev());
        }
        
        if (this.nextArrow) {
            this.nextArrow.addEventListener('click', () => this.next());
        }
        
        // Обработчики точек
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                this.goToSlide(index * this.settings.slidesToScroll);
            });
        });
        
        // Обработчик изменения размера окна
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Приостановка автопрокрутки при наведении
        this.container.addEventListener('mouseenter', () => {
            this.pauseAutoplay();
        });
        
        this.container.addEventListener('mouseleave', () => {
            if (this.settings.autoplay) {
                this.startAutoplay();
            }
        });
    }

    prev() {
        if (this.isAnimating) return;
        
        let targetSlide = this.currentSlide - this.settings.slidesToScroll;
        
        if (this.settings.infinite) {
            if (targetSlide < 0) {
                targetSlide = this.slideCount - this.settings.slidesToScroll;
            }
        } else {
            targetSlide = Math.max(0, targetSlide);
        }
        
        this.goToSlide(targetSlide);
    }

    next() {
        if (this.isAnimating) return;
        
        let targetSlide = this.currentSlide + this.settings.slidesToScroll;
        
        if (this.settings.infinite) {
            if (targetSlide >= this.slideCount) {
                targetSlide = 0;
            }
        } else {
            const maxSlide = this.slideCount - this.settings.slidesToShow;
            targetSlide = Math.min(maxSlide, targetSlide);
        }
        
        this.goToSlide(targetSlide);
    }

    goToSlide(slideIndex, animate = true) {
        if (this.isAnimating && animate) return;
        
        this.isAnimating = animate;
        this.currentSlide = slideIndex;
        
        // Получаем margin для правильного расчета позиции
        const firstSlide = this.slides[0];
        const slideStyle = window.getComputedStyle(firstSlide);
        const marginLeft = parseFloat(slideStyle.marginLeft) || 0;
        const marginRight = parseFloat(slideStyle.marginRight) || 0;
        const totalMargin = marginLeft + marginRight;
        
        // Вычисляем позицию для трансформации
        let translateX = 0;
        
        if (this.settings.infinite) {
            const offset = this.settings.slidesToShow; // Смещение для клонированных слайдов
            translateX = -(slideIndex + offset) * (this.slideWidth + totalMargin);
        } else {
            translateX = -slideIndex * (this.slideWidth + totalMargin);
        }
        
        // Применяем трансформацию
        if (animate) {
            this.track.style.transition = `transform ${this.settings.speed}ms ease`;
        } else {
            this.track.style.transition = 'none';
        }
        
        this.track.style.transform = `translateX(${translateX}px)`;
        
        // Обновляем активные элементы
        this.updateActiveDot();
        this.updateArrowsState();
        
        if (animate) {
            setTimeout(() => {
                this.isAnimating = false;
                this.handleInfiniteTransition();
            }, this.settings.speed);
        } else {
            this.isAnimating = false;
        }
    }

    handleInfiniteTransition() {
        if (!this.settings.infinite) return;
        
        const offset = this.settings.slidesToShow;
        
        // Получаем margin для правильного расчета позиции
        const firstSlide = this.slides[0];
        const slideStyle = window.getComputedStyle(firstSlide);
        const marginLeft = parseFloat(slideStyle.marginLeft) || 0;
        const marginRight = parseFloat(slideStyle.marginRight) || 0;
        const totalMargin = marginLeft + marginRight;
        
        // Если мы в конце клонированных слайдов, перемещаемся к оригиналам
        if (this.currentSlide >= this.slideCount) {
            this.currentSlide = this.currentSlide - this.slideCount;
            this.track.style.transition = 'none';
            const translateX = -(this.currentSlide + offset) * (this.slideWidth + totalMargin);
            this.track.style.transform = `translateX(${translateX}px)`;
        }
        
        // Если мы в начале клонированных слайдов, перемещаемся к оригиналам
        if (this.currentSlide < 0) {
            this.currentSlide = this.slideCount + this.currentSlide;
            this.track.style.transition = 'none';
            const translateX = -(this.currentSlide + offset) * (this.slideWidth + totalMargin);
            this.track.style.transform = `translateX(${translateX}px)`;
        }
    }

    updateActiveDot() {
        if (!this.settings.dots) return;
        
        this.dots.forEach((dot, index) => {
            dot.classList.remove('vanilla-slick-active');
            if (index === Math.floor(this.currentSlide / this.settings.slidesToScroll)) {
                dot.classList.add('vanilla-slick-active');
            }
        });
    }

    updateArrowsState() {
        if (!this.settings.arrows || this.settings.infinite) return;
        
        // Отключаем стрелки на краях
        this.prevArrow.disabled = this.currentSlide === 0;
        this.nextArrow.disabled = this.currentSlide >= this.slideCount - this.settings.slidesToShow;
    }

    startAutoplay() {
        if (!this.settings.autoplay) return;
        
        this.pauseAutoplay();
        this.autoplayTimer = setInterval(() => {
            this.next();
        }, this.settings.autoplaySpeed);
    }

    pauseAutoplay() {
        if (this.autoplayTimer) {
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = null;
        }
    }

    handleResize() {
        // Обновляем настройки в зависимости от размера экрана
        this.updateResponsiveSettings();
        this.updateSlideWidth();
        this.goToSlide(this.currentSlide, false);
    }

    updateResponsiveSettings() {
        const windowWidth = window.innerWidth;
        let currentSettings = { ...this.defaults, ...this.settings };
        
        // Применяем responsive настройки
        this.settings.responsive.forEach(breakpoint => {
            if (windowWidth <= breakpoint.breakpoint) {
                currentSettings = { ...currentSettings, ...breakpoint.settings };
            }
        });
        
        // Обновляем текущие настройки
        Object.assign(this.settings, currentSettings);
    }

    // Публичные методы для управления
    destroy() {
        this.pauseAutoplay();
        
        // Удаляем обработчики событий
        window.removeEventListener('resize', this.handleResize.bind(this));
        
        // Удаляем созданные элементы
        if (this.prevArrow) this.prevArrow.remove();
        if (this.nextArrow) this.nextArrow.remove();
        if (this.dotsContainer) this.dotsContainer.remove();
        
        // Восстанавливаем исходную структуру
        while (this.track.firstChild) {
            if (!this.track.firstChild.classList.contains('vanilla-slick-cloned')) {
                this.container.appendChild(this.track.firstChild);
            } else {
                this.track.removeChild(this.track.firstChild);
            }
        }
        
        this.track.remove();
        this.container.classList.remove('vanilla-slick');
    }

    refresh() {
        this.destroy();
        this.init();
    }
}

// Глобальная функция для инициализации (аналог jQuery plugin)
window.vanillaSlick = function(selector, options) {
    const elements = typeof selector === 'string' 
        ? document.querySelectorAll(selector)
        : [selector];
    
    const instances = [];
    
    elements.forEach(element => {
        instances.push(new VanillaSlick(element, options));
    });
    
    return instances.length === 1 ? instances[0] : instances;
};