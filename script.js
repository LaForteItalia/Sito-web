// Inizializzazione AOS (Animate On Scroll)
AOS.init({
    duration: 1000,
    once: true,
    offset: 100
});

// Configurazione Particles.js
particlesJS('particles-js', {
    "particles": {
        "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
        "color": { "value": ["#008C45", "#F4F5F0", "#CD212A"] },
        "shape": { "type": "circle" },
        "opacity": { "value": 0.5, "random": true },
        "size": { "value": 3, "random": true },
        "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.1, "width": 1 },
        "move": { "enable": true, "speed": 2, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
        "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 1 } }, "push": { "particles_nb": 4 } }
    },
    "retina_detect": true
});

// Configurazione ed esecuzione
async function updatePlayerCount() {
    const playerElement = document.querySelector('.players-count');
    const dotElement = document.querySelector('.online-dot');
    if (!playerElement) return;

    try {
        // Chiamata al nostro server backend locale
        const response = await fetch('http://localhost:3000/status');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        // Aggiorna il numero di giocatori
        playerElement.innerText = data.players;
        
        // Aggiorna il puntino di stato
        if (data.online) {
            if (dotElement) {
                dotElement.style.background = '#00ff00';
                dotElement.style.boxShadow = '0 0 10px #00ff00';
            }
        } else {
            throw new Error('Server offline');
        }
    } catch (err) {
        console.warn("[FiveM] Errore nel recupero dati dal server locale:", err.message);
        playerElement.innerText = "0";
        if (dotElement) {
            dotElement.style.background = '#ff0000';
            dotElement.style.boxShadow = '0 0 10px #ff0000';
        }
    }
}

// Aggiorna al caricamento e ogni 60 secondi
updatePlayerCount();
setInterval(updatePlayerCount, 60000);

// Effetto scorrimento header
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Smooth scroll per i link interni
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const target = document.querySelector(targetId);
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: 'smooth'
            });
            // Chiudi menu mobile se aperto
            document.querySelector('nav ul').classList.remove('active');
            document.querySelector('.menu-toggle i').classList.replace('fa-times', 'fa-bars');
        }
    });
});

// Menu Mobile Toggle
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('nav ul');
const menuIcon = document.querySelector('.menu-toggle i');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        if (navLinks.classList.contains('active')) {
            menuIcon.classList.replace('fa-bars', 'fa-times');
        } else {
            menuIcon.classList.replace('fa-times', 'fa-bars');
        }
    });
}

// Gestione Active Link e Scroll Spy per il Regolamento
const rulesNavLinks = document.querySelectorAll('.rules-nav a');
const ruleSections = document.querySelectorAll('.rule-section');

if (rulesNavLinks.length > 0) {
    window.addEventListener('scroll', () => {
        let current = '';
        ruleSections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        rulesNavLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });
}
