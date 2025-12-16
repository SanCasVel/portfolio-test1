document.addEventListener('DOMContentLoaded', function() {
    const squares = document.querySelectorAll('.square');
    const japaneseText = document.querySelectorAll('.japanese');
    const mainImage = document.querySelector('.main-image');
    const headerBadge = document.querySelector('.header-badge');
    
    squares.forEach((square, index) => {
        square.addEventListener('mouseenter', function() {
            this.style.animation = `pulse 0.6s ease-in-out`;
        });
    });
    
    japaneseText.forEach((text) => {
        text.addEventListener('mouseenter', function() {
            this.style.animation = `wave 0.6s ease-in-out`;
        });
    });
    
    mainImage.addEventListener('mouseenter', function() {
        this.style.animation = `glow 0.8s ease-in-out`;
    });
    
    if (headerBadge) {
        headerBadge.addEventListener('mouseenter', function() {
            this.style.animation = `badge-pulse 0.5s ease-in-out`;
        });
    }
});

const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% {
            box-shadow: 0 0 0 0 rgba(246, 229, 77, 0.4);
        }
        50% {
            box-shadow: 0 0 0 10px rgba(246, 229, 77, 0);
        }
    }
    
    @keyframes wave {
        0%, 100% {
            transform: translateY(0);
        }
        25% {
            transform: translateY(-5px);
        }
        75% {
            transform: translateY(5px);
        }
    }
    
    @keyframes glow {
        0%, 100% {
            filter: drop-shadow(0 0 30px rgba(246, 229, 77, 0.35));
        }
        50% {
            filter: drop-shadow(0 0 60px rgba(253, 246, 190, 0.85));
        }
    }
    
    @keyframes badge-pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
    }
`;
document.head.appendChild(style);