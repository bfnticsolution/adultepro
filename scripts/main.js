// Configuration
const config = {
    videosPerPage: 100,
    adDuration: 5000, // 15 secondes pour les prerolls
    skipAdDelay: 2000, // 5 secondes avant de pouvoir skipper
    totalVideos: 14872,
    baseVideoUrl: 'https://vod.mycamtv.net/',
    thumbnailUrl: 'https://st4.depositphotos.com/10953878/29463/i/450/depositphotos_294630458-stock-photo-frozen-ice-letter-x-of.jpg',
    defaultDuration: 'FREE',
    midrollInterval: 180000, // 3 minutes en millisecondes
    adChangeInterval: 30000 // Changer de pub toutes les 30s
};

// Catalogue de publicités
const ads = {
    prerolls: [
        {
            id: 1,
            title: "Sponsorisé par AFRICA BOX",
            content: "Suivez plus de 1500 chaines classiques sur vote téléphone",
            duration: 10,
            brand: "Africa Box TV",
            cta: "Téléchargez Maintenant",
            image: "https://play-lh.googleusercontent.com/bUjzkXVO2dUBY2-MTDueNFqCkD3HvQfI1xACOxkQ4tIi-cMsYMOW0epuIdt_rEqnnz0=w526-h296-rw"
        },
        {
            id: 2,
            title: "Offre spéciale",
            content: "Économisez 30% sur tous les abonnements ce mois-ci",
            duration: 10,
            brand: "Africa Box",
            cta: "S'abonner",
            image: "player-cover.jpg?text=Special+Offer"
        },
        {
            id: 3,
            title: "Nouveau contenu",
            content: "Le nouveau de Africa Box TV est disponible maintenant",
            duration: 10,
            brand: "Africa Box",
            cta: "Découvrir",
            image: "player-cover.jpg?text=New+Product"
        }
    ],
    midrolls: [
        {
            id: 4,
            title: "Publicité midroll",
            content: "Cette vidéo vous est présentée par Africa Box",
            duration: 10,
            brand: "Africa Box",
            cta: "Visiter le site",
            image: "player-cover.jpg?text=Midroll+Ad"
        },
        {
            id: 5,
            title: "Interlude publicitaire",
            content: "Profitez de notre offre exclusive pour les viewers",
            duration: 10,
            brand: "Africa Box",
            cta: "Voir l'offre",
            image: "player-cover.jpg?text=Sponsor+Message"
        }
    ],
    banners: [
        {
            id: 6,
            title: "Bannière publicitaire",
            content: "Abonnez-vous pour plus de contenu exclusif",
            cta: "S'abonner",
            bgColor: "#4a0072"
        },
        {
            id: 7,
            title: "Promotion",
            content: "Nouveaux contenus ajoutés chaque semaine",
            cta: "Explorer",
            bgColor: "#006064"
        }
    ],
    overlays: [
        {
            id: 8,
            title: "Nouveauté !",
            content: "Découvrez notre fonctionnalité premium",
            cta: "Essayer maintenant"
        },
        {
            id: 9,
            title: "Notification",
            content: "Activer les notifications pour ne rien manquer",
            cta: "Activer"
        }
    ]
};

// Éléments DOM
const elements = {
    videoPlayer: document.getElementById('videoPlayer'),
    playlist: document.getElementById('playlist'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    adContainer: document.getElementById('adContainer'),
    adContent: document.getElementById('adContent'),
    adTimer: document.getElementById('adTimer'),
    skipAdBtn: document.getElementById('skipAdBtn'),
    currentVideoTitle: document.getElementById('currentVideoTitle'),
    videoPosition: document.getElementById('videoPosition'),
    prevButton: document.getElementById('prevButton'),
    nextButton: document.getElementById('nextButton'),
    bannerAd: document.getElementById('bannerAd'),
    overlayAd: document.getElementById('overlayAd'),
    closeOverlayAd: document.getElementById('closeOverlayAd')
};

// Variables d'état
let state = {
    currentIndex: 0,
    loadedVideos: 0,
    currentVideoIndex: -1,
    adInterval: null,
    adTimeLeft: 0,
    videoUrls: Array.from({ length: config.totalVideos }, (_, i) =>
        `${config.baseVideoUrl}${i+1}.m3u8`),
    currentAd: null,
    midrollTimer: null,
    lastMidrollTime: 0,
    adDisplayTimes: {},
    isPaused: false,
    pauseAdTimer: null,
    player: null
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initializePlayer();
    loadVideos(0);
    setupEventListeners();
    showBannerAd();
    setTimeout(showOverlayAd, 30000);
});

// Initialiser le lecteur Video.js
function initializePlayer() {
    state.player = videojs('videoPlayer', {
        html5: {
            hls: {
                enableLowInitialPlaylist: true,
                smoothQualityChange: true,
                overrideNative: true
            }
        },
        controls: true,
        autoplay: false,
        preload: 'auto',
        responsive: true,
        fluid: true
    });

    // Gestion des erreurs
    state.player.on('error', () => {
        const error = state.player.error();
        console.error('Erreur du lecteur:', error);
        handlePlayerError();
    });

    // Optimisation pour mobile
    state.player.tech_.on('retryplaylist', () => {
        console.log('Tentative de reconnexion au flux...');
    });
}

// Fonctions principales
function setupEventListeners() {
    elements.loadMoreBtn.addEventListener('click', () => loadVideos(state.loadedVideos));
    elements.skipAdBtn.addEventListener('click', skipAd);
    elements.prevButton.addEventListener('click', playPreviousVideo);
    elements.nextButton.addEventListener('click', playNextVideo);
    elements.closeOverlayAd.addEventListener('click', hideOverlayAd);

    state.player.on('play', () => {
        state.isPaused = false;
        startMidrollTimer();
    });

    state.player.on('pause', () => {
        state.isPaused = true;
    });

    state.player.on('ended', () => {
        if (state.currentVideoIndex < state.videoUrls.length - 1) {
            playNextVideo();
        }
    });

    state.player.on('timeupdate', () => {
        updateProgressIndicator();
    });
}

function updateProgressIndicator() {
    // Peut être utilisé pour afficher la progression si nécessaire
}

// Gestion des publicités
function getRandomAd(type) {
    const adPool = ads[type];
    return adPool[Math.floor(Math.random() * adPool.length)];
}

function showBannerAd() {
    const bannerAd = getRandomAd('banners');
    elements.bannerAd.querySelector('h3').textContent = bannerAd.title;
    elements.bannerAd.querySelector('p').textContent = bannerAd.content;
    elements.bannerAd.querySelector('.ad-banner-cta').textContent = bannerAd.cta;
    elements.bannerAd.style.background = bannerAd.bgColor || "var(--banner-ad-bg)";
    elements.bannerAd.classList.add('show');

    setTimeout(() => {
        elements.bannerAd.classList.remove('show');
        setTimeout(showBannerAd, 120000);
    }, 15000);
}

function showOverlayAd() {
    const overlayAd = getRandomAd('overlays');
    elements.overlayAd.querySelector('h3').textContent = overlayAd.title;
    elements.overlayAd.querySelector('p').textContent = overlayAd.content;
    elements.overlayAd.querySelector('.ad-overlay-cta').textContent = overlayAd.cta;
    elements.overlayAd.classList.add('show');

    setTimeout(hideOverlayAd, 10000);
}

function hideOverlayAd() {
    elements.overlayAd.classList.remove('show');
    setTimeout(showOverlayAd, 180000);
}

function showAd(type = 'preroll') {
    state.currentAd = getRandomAd(type + 's');
    
    elements.adContent.textContent = state.currentAd.content;
    elements.adContainer.querySelector('.ad-brand').textContent = state.currentAd.brand || "Publicité";
    elements.skipAdBtn.textContent = `${state.currentAd.cta} (Attendez...)`;
    
    state.adTimeLeft = type === 'preroll' ? state.currentAd.duration : state.currentAd.duration;
    elements.adTimer.textContent = formatTime(state.adTimeLeft);
    elements.adContainer.classList.add('show');

    setTimeout(() => {
        elements.skipAdBtn.innerHTML = `<i class="fas fa-forward"></i> ${state.currentAd.cta}`;
        elements.skipAdBtn.classList.add('active');
    }, config.skipAdDelay);

    state.adInterval = setInterval(() => {
        state.adTimeLeft--;
        elements.adTimer.textContent = formatTime(state.adTimeLeft);

        if (state.adTimeLeft <= 0) {
            clearInterval(state.adInterval);
            hideAd();
            if (type === 'preroll') {
                playVideoAfterAd();
            }
        }
    }, 1000);
}

function hideAd() {
    elements.adContainer.classList.remove('show');
    elements.skipAdBtn.classList.remove('active');
    clearInterval(state.adInterval);
}

function skipAd() {
    hideAd();
    if (state.currentAd && state.currentAd.type === 'preroll') {
        playVideoAfterAd();
    }
}

function startMidrollTimer() {
    if (state.midrollTimer) {
        clearInterval(state.midrollTimer);
    }

    state.lastMidrollTime = 0;
    state.midrollTimer = setInterval(() => {
        const currentTime = state.player.currentTime();

        if (currentTime - state.lastMidrollTime >= config.midrollInterval / 1000) {
            if (!state.player.paused() && currentTime > 30) {
                showMidrollAd();
                state.lastMidrollTime = currentTime;
            }
        }
    }, 10000);
}

function showMidrollAd() {
    state.player.pause();
    showAd('midroll');
}

function playVideoAfterAd() {
    if (state.currentVideoIndex >= 0) {
        const videoUrl = state.videoUrls[state.currentVideoIndex];
        loadVideoSource(videoUrl);

        state.player.play().catch(e => {
            console.error("Erreur de lecture:", e);
        });

        startMidrollTimer();
    }
}

function loadVideoSource(videoUrl) {
    state.player.src({
        src: videoUrl,
        type: 'application/x-mpegURL'
    });
}

// Gestion de la playlist
function loadVideos(startIndex) {
    const endIndex = Math.min(startIndex + config.videosPerPage, state.videoUrls.length);

    for (let i = startIndex; i < endIndex; i++) {
        createVideoItem(i);
    }

    state.loadedVideos = endIndex;
    updateLoadMoreButton();
}

function createVideoItem(index) {
    const videoItem = document.createElement('div');
    videoItem.className = 'playlist-item';
    videoItem.dataset.index = index;

    if (index === state.currentVideoIndex) {
        videoItem.classList.add('active');
    }

    const img = document.createElement('img');
    img.src = config.thumbnailUrl;
    img.alt = `Vignette vidéo ${index + 1}`;
    img.loading = 'lazy';

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = `Vidéo ${index + 1}`;

    const duration = document.createElement('div');
    duration.className = 'duration';
    duration.textContent = config.defaultDuration;

    videoItem.appendChild(img);
    videoItem.appendChild(title);
    videoItem.appendChild(duration);

    videoItem.addEventListener('click', () => playVideo(index));
    elements.playlist.appendChild(videoItem);
}

function updateLoadMoreButton() {
    if (state.loadedVideos >= state.videoUrls.length) {
        elements.loadMoreBtn.style.display = 'none';
    }
}

function playVideo(index) {
    state.currentVideoIndex = index;
    updateActiveVideoStyle();
    updateVideoInfo();
    updateNavButtons();
    showAd('preroll');
}

function updateActiveVideoStyle() {
    document.querySelectorAll('.playlist-item').forEach((item, idx) => {
        item.classList.toggle('active', idx === state.currentVideoIndex);
    });
}

function updateVideoInfo() {
    elements.currentVideoTitle.textContent = `Vidéo ${state.currentVideoIndex + 1}`;
    elements.videoPosition.textContent = `${state.currentVideoIndex + 1}/${state.videoUrls.length}`;
}

function updateNavButtons() {
    elements.prevButton.disabled = state.currentVideoIndex <= 0;
    elements.nextButton.disabled = state.currentVideoIndex >= state.videoUrls.length - 1;
}

function playNextVideo() {
    if (state.currentVideoIndex < state.videoUrls.length - 1) {
        playVideo(state.currentVideoIndex + 1);
    }
}

function playPreviousVideo() {
    if (state.currentVideoIndex > 0) {
        playVideo(state.currentVideoIndex - 1);
    }
}

function handlePlayerError() {
    alert("Une erreur est survenue lors du chargement de la vidéo. Veuillez réessayer.");
    if (state.player) {
        state.player.dispose();
        initializePlayer();
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Service Worker et PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker enregistré avec succès:', registration.scope);
        }).catch(error => {
            console.log('Échec de l\'enregistrement du ServiceWorker:', error);
        });
    });
}

// Gestion de l'installation de l'application
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const installButton = document.createElement('button');
    installButton.textContent = 'Installer XFLIX';
    installButton.style.position = 'fixed';
    installButton.style.bottom = '20px';
    installButton.style.right = '20px';
    installButton.style.zIndex = '1000';
    installButton.style.padding = '10px 20px';
    installButton.style.backgroundColor = 'var(--primary-color)';
    installButton.style.color = 'white';
    installButton.style.border = 'none';
    installButton.style.borderRadius = '5px';
    installButton.style.cursor = 'pointer';
    installButton.id = 'installButton';

    document.body.appendChild(installButton);

    installButton.addEventListener('click', () => {
        deferredPrompt.prompt();
        installButton.style.display = 'none';

        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('L\'utilisateur a accepté l\'installation');
            } else {
                console.log('L\'utilisateur a refusé l\'installation');
            }
            deferredPrompt = null;
        });
    });
});
