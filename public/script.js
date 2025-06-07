class SimpleGameApp {
    constructor() {
        this.gameData = null;
        this.timers = new Map(); // لتتبع التوقيتات لكل رابط
        this.init();
    }

    async init() {
        await this.loadGame();
        this.hideLoading();
        this.setupCounters();
        this.displayGameInfo();
        this.createDownloadLinks();
    }

    async loadGame() {
        try {
            const gameSlug = this.getGameSlug();
            const response = await fetch(`/game/${gameSlug}`);

            if (!response.ok) {
                throw new Error('Game not found');
            }

            this.gameData = await response.json();
        } catch (error) {
            console.error('Error loading game:', error);
            this.showError();
        }
    }

    getGameSlug() {
        const path = window.location.pathname;
        return path.substring(1) || 'gta3'; // افتراضي gta3
    }

    hideLoading() {
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('main').style.display = 'block';
        }, 1500);
    }

    setupCounters() {
        // محاكاة العدادات
        let visitors = 1247;
        let downloads = 5234;

        setInterval(() => {
            visitors += Math.floor(Math.random() * 3);
            downloads += Math.floor(Math.random() * 2);

            document.getElementById('visitors').textContent = visitors.toLocaleString();
            document.getElementById('downloads').textContent = downloads.toLocaleString();
        }, 3000);
    }

    displayGameInfo() {
        if (!this.gameData) return;

        document.getElementById('game-name').textContent = this.gameData.name;
        document.getElementById('game-size').textContent = this.gameData.size;
        document.getElementById('game-desc').textContent = this.gameData.description;
        document.getElementById('game-img').src = this.gameData.image;
        document.getElementById('game-img').alt = this.gameData.name;

        // تحديث عنوان الصفحة
        document.title = `تحميل ${this.gameData.name} - Gaming Paradise`;
    }

    createDownloadLinks() {
        if (!this.gameData || !this.gameData.links) return;

        const container = document.getElementById('links-container');
        container.innerHTML = '';

        this.gameData.links.forEach((link, index) => {
            const button = this.createLinkButton(link, index);
            container.appendChild(button);
        });
    }

    createLinkButton(link, index) {
        const button = document.createElement('button');
        button.className = 'download-btn';
        button.innerHTML = `
            <span><i class="fas fa-download"></i> ${link.label}</span>
            <span><i class="fas fa-arrow-right"></i></span>
        `;

        button.addEventListener('click', () => {
            this.handleDownload(link.url, index, button);
        });

        return button;
    }

    handleDownload(url, index, button) {
        const linkId = `link_${index}`;

        // تحقق إذا كان هناك مؤقت نشط لهذا الرابط
        if (this.timers.has(linkId)) {
            this.showMessage('انتظر! المؤقت يعمل بالفعل لهذا الرابط', 'warning');
            button.style.animation = 'shake 0.5s';
            setTimeout(() => button.style.animation = '', 500);
            return;
        }

        this.startTimer(url, linkId, button);
    }

    startTimer(url, linkId, button) {
        // تغيير حالة الزر
        button.classList.add('waiting');
        button.innerHTML = `
            <span><i class="fas fa-clock"></i> انتظر...</span>
            <span><i class="fas fa-hourglass-half"></i></span>
        `;

        // إظهار المؤقت
        this.showTimerModal(url, linkId, button);
    }

    showTimerModal(url, linkId, button) {
        const modal = document.getElementById('timer-modal');
        const timerNumber = document.getElementById('timer-number');

        modal.classList.add('show');

        let timeLeft = 15;
        timerNumber.textContent = timeLeft;

        // حفظ المؤقت
        const timer = setInterval(() => {
            timeLeft--;
            timerNumber.textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(timer);
                this.completeTimer(url, linkId, button);
                modal.classList.remove('show');
            }
        }, 1000);

        this.timers.set(linkId, timer);

        // إغلاق المودال عند النقر خارجه
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.cancelTimer(linkId, button);
                modal.classList.remove('show');
            }
        });
    }

    completeTimer(url, linkId, button) {
        // إزالة المؤقت
        this.timers.delete(linkId);

        // تغيير الزر للحالة الجاهزة
        button.classList.remove('waiting');
        button.classList.add('ready');
        button.innerHTML = `
            <span><i class="fas fa-download"></i> التحميل جاهز!</span>
            <span><i class="fas fa-external-link-alt"></i></span>
        `;

        // إضافة مستمع للتحميل الفعلي
        const downloadHandler = (e) => {
            e.preventDefault();
            this.proceedToDownload(url);
            button.removeEventListener('click', downloadHandler);

            // إعادة تعيين الزر
            setTimeout(() => {
                this.resetButton(button);
            }, 2000);
        };

        button.addEventListener('click', downloadHandler);
        this.showMessage('الرابط جاهز للتحميل!', 'success');
    }

    cancelTimer(linkId, button) {
        const timer = this.timers.get(linkId);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(linkId);
        }

        this.resetButton(button);
        this.showMessage('تم إلغاء المؤقت', 'info');
    }

    resetButton(button) {
        button.classList.remove('waiting', 'ready');
        button.innerHTML = `
            <span><i class="fas fa-download"></i> رابط التحميل</span>
            <span><i class="fas fa-arrow-right"></i></span>
        `;
    }

    proceedToDownload(url) {
        // فتح رابط التحميل
        window.open(url, '_blank');

        // زيادة عداد التحميلات
        const downloads = document.getElementById('downloads');
        const currentCount = parseInt(downloads.textContent.replace(/,/g, ''));
        downloads.textContent = (currentCount + 1).toLocaleString();

        this.showMessage('شكراً لك! تم بدء التحميل', 'success');
    }

    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getMessageColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 300px;
            font-weight: 600;
        `;
        message.textContent = text;

        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    getMessageColor(type) {
        const colors = {
            success: '#27ae60',
            warning: '#f39c12',
            error: '#e74c3c',
            info: '#3498db'
        };
        return colors[type] || '#3498db';
    }

    showError() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main').innerHTML = `
            <div style="text-align: center; padding: 4rem; color: white;">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; margin-bottom: 2rem;"></i>
                <h2>اللعبة غير موجودة</h2>
                <p>لم يتم العثور على اللعبة المطلوبة</p>
                <button onclick="window.location.reload()" 
                        style="margin-top: 2rem; padding: 1rem 2rem; background: white; 
                               color: #333; border: none; border-radius: 8px; cursor: pointer;">
                    إعادة المحاولة
                </button>
            </div>
        `;
        document.getElementById('main').style.display = 'block';
    }
}

// تشغيل التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new SimpleGameApp();
});

// إضافة CSS للتأثيرات
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);