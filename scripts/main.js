
        // Configuration
        const config = {
            videosPerPage: 100,
            adDuration: 15000, // 15 secondes pour les prerolls
            skipAdDelay: 5000, // 5 secondes avant de pouvoir skipper
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
                    content: "Suivez plus de 1500 chaines classiques en direct sur vote téléphone",
                    duration: 15,
                    brand: "Africa Box TV",
                    cta: "Téléchargez Maintenant",
                    image: "https://play-lh.googleusercontent.com/bUjzkXVO2dUBY2-MTDueNFqCkD3HvQfI1xACOxkQ4tIi-cMsYMOW0epuIdt_rEqnnz0=w526-h296-rw"
                },
                {
                    id: 2,
                    title: "Offre spéciale",
                    content: "Économisez 30% sur tous les abonnements ce mois-ci",
                    duration: 15,
                    brand: "Africa Box",
                    cta: "S'abonner",
                    image: "player-cover.jpg?text=Special+Offer"
                },
                {
                    id: 3,
                    title: "Nouveau contenu",
                    content: "Le nouveau de Africa Box TV est disponible maintenant",
                    duration: 15,
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
            hls: null,
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
            pauseAdTimer: null
        };

        // Initialisation
        document.addEventListener('DOMContentLoaded', () => {
            loadVideos(0);
            setupEventListeners();
            showBannerAd();
            setTimeout(showOverlayAd, 30000); // Afficher overlay après 30s
        });

        // Fonctions
        function setupEventListeners() {
            elements.loadMoreBtn.addEventListener('click', () => loadVideos(state.loadedVideos));
            elements.skipAdBtn.addEventListener('click', skipAd);
            elements.prevButton.addEventListener('click', playPreviousVideo);
            elements.nextButton.addEventListener('click', playNextVideo);
            elements.closeOverlayAd.addEventListener('click', hideOverlayAd);

            elements.videoPlayer.addEventListener('play', () => {
                state.isPaused = false;
                startMidrollTimer();
            });

            elements.videoPlayer.addEventListener('pause', () => {
                state.isPaused = true;
            });

            elements.videoPlayer.addEventListener('ended', () => {
                if (state.currentVideoIndex < state.videoUrls.length - 1) {
                    playNextVideo();
                }
            });

            elements.videoPlayer.addEventListener('timeupdate', () => {
            });
        }

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
                setTimeout(showBannerAd, 120000); // Afficher à nouveau après 2 minutes
            }, 15000);
        }

        function showOverlayAd() {
            const overlayAd = getRandomAd('overlays');
            elements.overlayAd.querySelector('h3').textContent = overlayAd.title;
            elements.overlayAd.querySelector('p').textContent = overlayAd.content;
            elements.overlayAd.querySelector('.ad-overlay-cta').textContent = overlayAd.cta;
            elements.overlayAd.classList.add('show');

            setTimeout(hideOverlayAd, 10000); // Disparaît après 10s
        }

        function hideOverlayAd() {
            elements.overlayAd.classList.remove('show');
            setTimeout(showOverlayAd, 180000); // Afficher à nouveau après 3 minutes
        }

        function showAd(type = 'preroll') {
            // Choisir une publicité aléatoire du type demandé
            state.currentAd = getRandomAd(type + 's');

            // Configurer l'affichage
            elements.adContent.textContent = state.currentAd.content;
            elements.adContainer.querySelector('.ad-brand').textContent = state.currentAd.brand || "Publicité";
            elements.skipAdBtn.textContent = `${state.currentAd.cta} (Attendez...)`;

            // Configurer la durée
            state.adTimeLeft = type === 'preroll' ? state.currentAd.duration : state.currentAd.duration;
            elements.adTimer.textContent = formatTime(state.adTimeLeft);
            elements.adContainer.classList.add('show');

            // Délai avant de pouvoir skipper
            setTimeout(() => {
                elements.skipAdBtn.innerHTML = `<i class="fas fa-forward"></i> ${state.currentAd.cta}`;
                elements.skipAdBtn.classList.add('active');
            }, config.skipAdDelay);

            // Compte à rebours
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
            // Nettoyer tout timer existant
            if (state.midrollTimer) {
                clearInterval(state.midrollTimer);
            }

            // Démarrer un nouveau timer
            state.lastMidrollTime = 0;
            state.midrollTimer = setInterval(() => {
                const currentTime = elements.videoPlayer.currentTime;

                // Vérifier si 3 minutes se sont écoulées depuis le dernier midroll
                if (currentTime - state.lastMidrollTime >= config.midrollInterval / 1000) {
                    if (!elements.videoPlayer.paused && currentTime > 30) { // Ne pas montrer dans les 30 premières secondes
                        showMidrollAd();
                        state.lastMidrollTime = currentTime;
                    }
                }
            }, 10000); // Vérifier toutes les 10 secondes
        }

        function showMidrollAd() {
            // Mettre en pause la vidéo
            elements.videoPlayer.pause();

            // Afficher la publicité midroll
            showAd('midroll');
        }

        function playVideoAfterAd() {
            if (state.currentVideoIndex >= 0) {
                const videoUrl = state.videoUrls[state.currentVideoIndex];
                initHlsPlayer(videoUrl);

                elements.videoPlayer.play().catch(e => {
                    console.error("Erreur de lecture:", e);
                    // Si la lecture automatique échoue, permettre à l'utilisateur de démarrer manuellement
                    elements.videoPlayer.controls = true;
                });

                // Redémarrer le timer pour les midrolls
                startMidrollTimer();
            }
        }

     function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }

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
            // Mettre à jour l'état
            state.currentVideoIndex = index;

            // Mettre à jour l'interface
            updateActiveVideoStyle();
            updateVideoInfo();
            updateNavButtons();

            // Afficher la publicité avant de jouer la vidéo
            showAd('preroll');
        }

        function initHlsPlayer(videoUrl) {
            if (Hls.isSupported()) {
                if (state.hls) {
                    state.hls.destroy();
                }

                state.hls = new Hls();
                state.hls.loadSource(videoUrl);
                state.hls.attachMedia(elements.videoPlayer);

                state.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    console.log("Manifest chargé, prêt à jouer");
                });

                state.hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error("HLS Error:", data);
                    if (data.fatal) {
                        handlePlayerError();
                    }
                });
            } else if (elements.videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                elements.videoPlayer.src = videoUrl;
            }
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
            if (state.hls) {
                state.hls.destroy();
            }
        }

        function playVideo(index) {
            // Mettre à jour l'état
            state.currentVideoIndex = index;

            // Mettre à jour l'interface
            updateActiveVideoStyle();
            updateVideoInfo();
            updateNavButtons();

            // Afficher la publicité preroll avant de jouer la vidéo
            showAd('preroll');
        }

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