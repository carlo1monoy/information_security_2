document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    initializeCardAnimations();
});

function checkUserSession() {
    fetch('php/check-session.php')
        .then(res => res.json())
        .then(data => {
            const navigation = document.querySelector('.navigation');
            const heroActions = document.querySelector('.hero-actions');
            const heroGreeting = document.getElementById('heroGreeting');
            const userName = document.getElementById('userName');
            
            if (data && data.loggedIn) {
                if (navigation) {
                    navigation.innerHTML = `
                        <button class="nav-link logout-btn" id="logoutBtn">
                            <i class="bi bi-box-arrow-right"></i> Log Out
                        </button>
                    `;
                    
                    const logoutBtn = document.getElementById('logoutBtn');
                    if (logoutBtn) {
                        logoutBtn.addEventListener('click', handleLogout);
                    }
                }
                
                if (heroActions) {
                    heroActions.style.display = 'none';
                }
                
                // Show personalized greeting
                if (heroGreeting && userName) {
                    const displayName = data.firstName || data.username || 'Student';
                    userName.textContent = displayName;
                    heroGreeting.style.display = 'block';
                    
                    // Add smooth animation
                    setTimeout(() => {
                        heroGreeting.classList.add('visible');
                    }, 100);
                }
            } else {
                if (navigation) {
                    navigation.innerHTML = `
                        <a href="home.html" class="nav-link active">Home</a>
                        <a href="login.html" class="nav-link">Log-in</a>
                        <a href="register.html" class="nav-link">Register</a>
                    `;
                }
                
                if (heroActions) {
                    heroActions.style.display = 'flex';
                }
                
                // Hide greeting for non-logged in users
                if (heroGreeting) {
                    heroGreeting.style.display = 'none';
                    heroGreeting.classList.remove('visible');
                }
            }
        })
        .catch(err => {
            console.error('Error checking session:', err);
        });
}

function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        window.location.href = 'php/logout.php';
    }
}

// Card expansion animation functionality
function initializeCardAnimations() {
    const cards = document.querySelectorAll('.floating-card');
    let overlay = null;
    let expandedCard = null;

    // Create overlay element
    function createOverlay() {
        overlay = document.createElement('div');
        overlay.className = 'card-overlay';
        document.body.appendChild(overlay);
        
        // Close card when clicking overlay
        overlay.addEventListener('click', collapseCard);
    }

    // Expand card animation
    function expandCard(card) {
        if (expandedCard) return; // Prevent multiple expansions
        
        expandedCard = card;
        
        // Create overlay if it doesn't exist
        if (!overlay) {
            createOverlay();
        }
        
        // Get original position before animation
        const rect = card.getBoundingClientRect();
        card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Add expanding class for smooth animation
        card.classList.add('expanding');
        
        // Show overlay
        overlay.classList.add('active');
        
        // Expand the card after a brief moment
        setTimeout(() => {
            card.classList.add('expanded');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }, 50);
        
        // Set up close button listener
        const closeBtn = card.querySelector('.close-card');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                collapseCard();
            });
        }
    }

    // Collapse card animation
    function collapseCard() {
        if (!expandedCard) return;
        
        // Hide overlay
        overlay.classList.remove('active');
        
        // Remove expanded state
        expandedCard.classList.remove('expanded');
        expandedCard.classList.remove('expanding');
        
        // Re-enable scrolling
        document.body.style.overflow = '';
        
        // Clear expanded card reference after animation
        setTimeout(() => {
            expandedCard = null;
        }, 500);
    }

    // Add click listeners to all cards
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't expand if clicking close button
            if (e.target.classList.contains('close-card')) {
                return;
            }
            
            expandCard(card);
        });
    });

    // Close card with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && expandedCard) {
            collapseCard();
        }
    });
}
