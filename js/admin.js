document.addEventListener('DOMContentLoaded', function() {
  
    const database = firebase.database();

    // DOM Elements
    const contentSections = document.querySelectorAll('.content-section');
    const navLinks = document.querySelectorAll('.admin-nav a');
    const addVideoBtn = document.getElementById('add-video-btn');
    const videoModal = document.getElementById('video-modal');
    const videoForm = document.getElementById('video-form');
    const addStreamBtn = document.getElementById('add-stream-btn');
    const streamModal = document.getElementById('stream-modal');
    const streamForm = document.getElementById('stream-form');
    const closeModalBtns = document.querySelectorAll('.close-modal, .close-modal-btn');

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1);
            
            // Update active nav item
            navLinks.forEach(nav => nav.parentElement.classList.remove('active'));
            this.parentElement.classList.add('active');
            
            // Update page title
            document.getElementById('page-title').textContent = 
                this.textContent.trim();
            
            // Show correct content section
            contentSections.forEach(section => section.classList.add('hidden'));
            document.getElementById(`${target}-content`).classList.remove('hidden');
        });
    });

    // Modal Handling
    function openModal(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Video Management
    addVideoBtn.addEventListener('click', () => {
        document.getElementById('modal-title').textContent = 'Add New Video';
        videoForm.reset();
        document.getElementById('video-id').value = '';
        openModal(videoModal);
    });

    // Stream Management
    addStreamBtn.addEventListener('click', () => {
        document.getElementById('stream-modal-title').textContent = 'Add New Stream';
        streamForm.reset();
        document.getElementById('stream-id').value = '';
        
        // Set default date/time to now + 1 hour
        const now = new Date();
        now.setHours(now.getHours() + 1);
        
        document.getElementById('stream-date').valueAsDate = now;
        document.getElementById('stream-time').value = 
            `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        openModal(streamModal);
    });

    // Close modals
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            closeModal(modal);
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });

    // Video Form Submission
    videoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const videoId = document.getElementById('video-id').value;
        const videoData = {
            title: document.getElementById('video-title').value,
            url: document.getElementById('video-url').value,
            thumbnail: document.getElementById('video-thumbnail').value,
            views: document.getElementById('video-views').value,
            date: document.getElementById('video-date').value,
            duration: document.getElementById('video-duration').value,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        
        const videosRef = database.ref('videos');
        
        if (videoId) {
            // Update existing video
            videosRef.child(videoId).update(videoData)
                .then(() => {
                    alert('Video updated successfully!');
                    closeModal(videoModal);
                })
                .catch(error => {
                    console.error('Error updating video:', error);
                    alert('Error updating video. Please try again.');
                });
        } else {
            // Add new video
            videosRef.push(videoData)
                .then(() => {
                    alert('Video added successfully!');
                    closeModal(videoModal);
                })
                .catch(error => {
                    console.error('Error adding video:', error);
                    alert('Error adding video. Please try again.');
                });
        }
    });

    // Stream Form Submission
    streamForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const streamId = document.getElementById('stream-id').value;
        const date = document.getElementById('stream-date').value;
        const time = document.getElementById('stream-time').value;
        
        const streamData = {
            game: document.getElementById('stream-game').value,
            nextStreamTime: `${date}T${time}:00`,
            durationHours: document.getElementById('stream-duration').value,
            url: document.getElementById('stream-url').value,
            status: 'scheduled'
        };
        
        const streamRef = database.ref('streamSchedule');
        
        if (streamId) {
            // Update existing stream
            streamRef.update(streamData)
                .then(() => {
                    alert('Stream updated successfully!');
                    closeModal(streamModal);
                })
                .catch(error => {
                    console.error('Error updating stream:', error);
                    alert('Error updating stream. Please try again.');
                });
        } else {
            // Add new stream
            streamRef.update(streamData)
                .then(() => {
                    alert('Stream added successfully!');
                    closeModal(streamModal);
                })
                .catch(error => {
                    console.error('Error adding stream:', error);
                    alert('Error adding stream. Please try again.');
                });
        }
    });

    // Load Videos Table
    function loadVideosTable() {
        const tbody = document.getElementById('videos-table-body');
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading videos...</td></tr>';
        
        database.ref('videos').orderByChild('timestamp').once('value')
            .then(snapshot => {
                tbody.innerHTML = '';
                
                if (snapshot.exists()) {
                    snapshot.forEach(childSnapshot => {
                        const video = childSnapshot.val();
                        const tr = document.createElement('tr');
                        
                        tr.innerHTML = `
                            <td><img src="${video.thumbnail}" alt="${video.title}"></td>
                            <td>${video.title}</td>
                            <td>${video.views}</td>
                            <td>${video.date}</td>
                            <td>${video.duration}</td>
                            <td>
                                <div class="action-btns">
                                    <button class="action-btn edit-video" data-id="${childSnapshot.key}">
                                        <i class="fa fa-edit"></i>
                                    </button>
                                    <button class="action-btn delete-video" data-id="${childSnapshot.key}">
                                        <i class="fa fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        `;
                        
                        tbody.appendChild(tr);
                    });
                    
                    // Add event listeners to action buttons
                    document.querySelectorAll('.edit-video').forEach(btn => {
                        btn.addEventListener('click', editVideo);
                    });
                    
                    document.querySelectorAll('.delete-video').forEach(btn => {
                        btn.addEventListener('click', deleteVideo);
                    });
                } else {
                    tbody.innerHTML = '<tr><td colspan="6" class="no-data">No videos found</td></tr>';
                }
            })
            .catch(error => {
                console.error('Error loading videos:', error);
                tbody.innerHTML = '<tr><td colspan="6" class="error">Error loading videos</td></tr>';
            });
    }

    // Edit Video
    function editVideo() {
        const videoId = this.getAttribute('data-id');
        
        database.ref(`videos/${videoId}`).once('value')
            .then(snapshot => {
                const video = snapshot.val();
                
                document.getElementById('modal-title').textContent = 'Edit Video';
                document.getElementById('video-id').value = videoId;
                document.getElementById('video-title').value = video.title;
                document.getElementById('video-url').value = video.url || '';
                document.getElementById('video-thumbnail').value = video.thumbnail || '';
                document.getElementById('video-views').value = video.views || '';
                document.getElementById('video-date').value = video.date || '';
                document.getElementById('video-duration').value = video.duration || '';
                
                openModal(videoModal);
            })
            .catch(error => {
                console.error('Error loading video:', error);
                alert('Error loading video details. Please try again.');
            });
    }

    // Delete Video
    function deleteVideo() {
        if (confirm('Are you sure you want to delete this video?')) {
            const videoId = this.getAttribute('data-id');
            
            database.ref(`videos/${videoId}`).remove()
                .then(() => {
                    alert('Video deleted successfully!');
                    loadVideosTable();
                })
                .catch(error => {
                    console.error('Error deleting video:', error);
                    alert('Error deleting video. Please try again.');
                });
        }
    }

    // Load Streams Table
    function loadStreamsTable() {
        const tbody = document.getElementById('streams-table-body');
        tbody.innerHTML = '<tr><td colspan="5" class="loading">Loading streams...</td></tr>';
        
        database.ref('streamSchedule').once('value')
            .then(snapshot => {
                tbody.innerHTML = '';
                
                if (snapshot.exists()) {
                    const streamData = snapshot.val();
                    const tr = document.createElement('tr');
                    
                    const streamTime = new Date(streamData.nextStreamTime);
                    const options = { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit' 
                    };
                    const formattedTime = streamTime.toLocaleDateString('en-US', options);
                    
                    // Calculate status
                    const now = new Date();
                    let status = 'Scheduled';
                    let statusClass = 'scheduled';
                    
                    if (now > streamTime) {
                        const endTime = new Date(streamTime.getTime() + (streamData.durationHours || 3) * 60 * 60 * 1000);
                        
                        if (now < endTime) {
                            status = 'Live Now';
                            statusClass = 'live';
                        } else {
                            status = 'Completed';
                            statusClass = 'completed';
                        }
                    }
                    
                    tr.innerHTML = `
                        <td>${formattedTime}</td>
                        <td>${streamData.game || 'Not specified'}</td>
                        <td>${streamData.durationHours || 3} hours</td>
                        <td><span class="status ${statusClass}">${status}</span></td>
                        <td>
                            <div class="action-btns">
                                <button class="action-btn edit-stream">
                                    <i class="fa fa-edit"></i>
                                </button>
                            </div>
                        </td>
                    `;
                    
                    tbody.appendChild(tr);
                    
                    // Add event listener to edit button
                    document.querySelector('.edit-stream').addEventListener('click', () => {
                        document.getElementById('stream-modal-title').textContent = 'Edit Stream';
                        document.getElementById('stream-id').value = 'current';
                        
                        document.getElementById('stream-game').value = streamData.game || '';
                        
                        const streamTime = new Date(streamData.nextStreamTime);
                        document.getElementById('stream-date').valueAsDate = streamTime;
                        document.getElementById('stream-time').value = 
                            `${String(streamTime.getHours()).padStart(2, '0')}:${String(streamTime.getMinutes()).padStart(2, '0')}`;
                        
                        document.getElementById('stream-duration').value = streamData.durationHours || 3;
                        document.getElementById('stream-url').value = streamData.url || '';
                        
                        openModal(streamModal);
                    });
                } else {
                    tbody.innerHTML = '<tr><td colspan="5" class="no-data">No streams scheduled</td></tr>';
                }
            })
            .catch(error => {
                console.error('Error loading streams:', error);
                tbody.innerHTML = '<tr><td colspan="5" class="error">Error loading streams</td></tr>';
            });
    }

    // Initialize Charts
    function initCharts() {
        const ctx = document.getElementById('viewsChart').getContext('2d');
        
        // Sample data - in a real app you would fetch this from your analytics
        const viewsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Views',
                    data: [12000, 19000, 15000, 22000, 24000, 28000],
                    backgroundColor: 'rgba(255, 70, 85, 0.2)',
                    borderColor: 'rgba(255, 70, 85, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                }
            }
        });
    }

    // Initialize the admin panel
    function initAdminPanel() {
        loadVideosTable();
        loadStreamsTable();
        initCharts();
        
        // Show dashboard by default
        document.getElementById('dashboard-content').classList.remove('hidden');
    }

    initAdminPanel();
});
