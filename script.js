document.addEventListener('DOMContentLoaded', function() {
    // ======================
    // Firebase Configuration
    // ======================
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_AUTH_DOMAIN",
        databaseURL: "YOUR_DATABASE_URL",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_SENDER_ID",
        appId: "YOUR_APP_ID"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // ======================
    // DOM Elements
    // ======================
    const videoGrid = document.querySelector('.video-grid');
    const countdownElement = document.getElementById('countdown1');
    const notifyButtons = document.querySelectorAll('.notify-btn');
    const navLinks = document.querySelectorAll('nav a');

    // ======================
    // Video Loading Function
    // ======================
    function loadVideos() {
        showLoading(videoGrid);
        
        database.ref('videos').orderByChild('timestamp').limitToLast(6).once('value')
            .then(snapshot => {
                videoGrid.innerHTML = '';
                
                if (snapshot.exists()) {
                    snapshot.forEach(videoSnapshot => {
                        const video = videoSnapshot.val();
                        createVideoCard(video);
                    });
                } else {
                    videoGrid.innerHTML = '<p class="no-videos">No videos available yet. Check back soon!</p>';
                }
            })
            .catch(error => {
                console.error("Error loading videos:", error);
                videoGrid.innerHTML = '<p class="error">Failed to load videos. Please refresh the page.</p>';
            });
    }

    function createVideoCard(video) {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.innerHTML = `
            <a href="${video.url || '#'}" target="_blank" class="video-link">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                    <span class="video-duration">${video.duration || ''}</span>
                </div>
                <div class="video-info">
                    <h3>${video.title}</h3>
                    <div class="video-stats">
                        <span><i class="fas fa-eye"></i> ${video.views || '0'} views</span>
                        <span><i class="far fa-calendar-alt"></i> ${video.date || ''}</span>
                    </div>
                </div>
            </a>
        `;
        videoGrid.appendChild(videoCard);
    }

    // ======================
    // Stream Countdown
    // ======================
    function setupStreamCountdown() {
        database.ref('streamSchedule').on('value', snapshot => {
            const streamData = snapshot.val();
            
            if (streamData && streamData.nextStreamTime) {
                updateStreamInfo(streamData);
                startCountdown(streamData.nextStreamTime);
            } else {
                countdownElement.innerHTML = 'Check back for stream schedule!';
                document.querySelector('.stream-card h3').textContent = 'Stream Schedule Coming Soon';
            }
        });
    }

    function updateStreamInfo(streamData) {
        const streamCard = document.querySelector('.stream-card');
        if (!streamCard) return;

        const gameTitle = streamCard.querySelector('.game-title');
        const streamTimeElement = streamCard.querySelector('.stream-time');
        
        if (gameTitle) gameTitle.textContent = streamData.game || "Today's Stream";
        
        if (streamTimeElement && streamData.nextStreamTime) {
            const streamTime = new Date(streamData.nextStreamTime);
            const options = { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true 
            };
            
            const startTime = streamTime.toLocaleTimeString('en-US', options);
            const endTime = new Date(streamTime.getTime() + (streamData.durationHours || 3) * 60 * 60 * 1000)
                .toLocaleTimeString('en-US', options);
            
            streamTimeElement.textContent = `${streamTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • ${startTime} - ${endTime}`;
        }
    }

    function startCountdown(streamTimeString) {
        const update = () => {
            const now = new Date();
            const streamTime = new Date(streamTimeString);
            const diff = streamTime - now;

            if (diff <= 0) {
                countdownElement.innerHTML = 'Stream is LIVE NOW!';
                document.querySelector('.notify-btn').textContent = 'Join Stream';
                document.querySelector('.notify-btn').classList.add('live');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000;

            countdownElement.innerHTML = `${hours}h ${minutes}m ${Math.floor(seconds)}s`;
        };

        update();
        setInterval(update, 1000);
    }

    // ======================
    // Notification Handling
    // ======================
    function setupNotifications() {
        notifyButtons.forEach(button => {
            button.addEventListener('click', function() {
                const email = prompt("Enter your email to get notified when we go live:");
                
                if (email && validateEmail(email)) {
                    saveNotification(email);
                } else if (email) {
                    alert("Please enter a valid email address.");
                }
            });
        });
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function saveNotification(email) {
        const notificationsRef = database.ref('notifications');
        const newNotification = {
            email: email,
            timestamp: new Date().toISOString(),
            notified: false
        };

        notificationsRef.push(newNotification)
            .then(() => {
                showAlert('success', `Thanks! We'll notify you at ${email} when we start streaming.`);
            })
            .catch(error => {
                console.error("Error saving notification:", error);
                showAlert('error', "Oops! Something went wrong. Please try again later.");
            });
    }

    // ======================
    // UI Helper Functions
    // ======================
    function showLoading(element) {
        element.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    }

    function showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.classList.add('fade-out');
            setTimeout(() => alertDiv.remove(), 500);
        }, 3000);
    }

    function setupSmoothScrolling() {
        navLinks.forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ======================
    // Initialize Everything
    // ======================
    loadVideos();
    setupStreamCountdown();
    setupNotifications();
    setupSmoothScrolling();

    // ======================
    // Real-time Updates
    // ======================
    // Listen for new videos being added
    database.ref('videos').orderByChild('timestamp').limitToLast(1).on('child_added', snapshot => {
        const newVideo = snapshot.val();
        if (document.querySelector('.no-videos')) {
            videoGrid.innerHTML = '';
        }
        createVideoCard(newVideo);
    });

    // Listen for stream schedule changes
    database.ref('streamSchedule').on('value', snapshot => {
        const streamData = snapshot.val();
        if (streamData && streamData.nextStreamTime) {
            updateStreamInfo(streamData);
            startCountdown(streamData.nextStreamTime);
        }
    });
});
