// Configuration
const CONFIG = {
    weatherApiKey: 'YOUR_API_KEY', // To be replaced with actual API key
    mapZoomLevel: 13,
    animationDuration: 2000,
    // Add more config options as needed
};

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    try {
        // Initialize core features
        setupSmoothScrolling();
        setupScrollAnimations();
        setupMobileNav();
        
        // Initialize interactive features
        await initializeWeatherWidget();
        initializeMap();
        animateStatistics();
        setupEventListeners();
        
        // Remove loading state
        document.body.classList.remove('loading');
    } catch (error) {
        handleError(error);
    }
}

// Initialize interactive features
function setupEventListeners() {
    // Hero CTA buttons
    document.querySelectorAll('.cta-button').forEach(button => {
        button.addEventListener('click', handleCtaClick);
    });

    // Mobile menu toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Add more event listeners as needed
}

function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

function setupScrollAnimations() {
    // Create intersection observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
}

function setupMobileNav() {
    // Mobile navigation functionality will be implemented here
    // This will include hamburger menu toggle and responsive navigation
}

// Statistics Animation
function animateStatistics() {
    const stats = document.querySelectorAll('.stat-number');
    
    stats.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-count'));
        const duration = CONFIG.animationDuration;
        let start = 0;
        const step = timestamp => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const percentage = Math.min(progress / duration, 1);
            
            stat.textContent = Math.floor(target * percentage).toLocaleString();
            
            if (percentage < 1) {
                requestAnimationFrame(step);
            }
        };
        
        requestAnimationFrame(step);
    });
}

// Fetch with Retry
async function fetchWithRetry(url, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return response;
            }
        } catch (error) {
            if (i === retries - 1) throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    throw new Error('Failed after retries');
}

// Weather Integration
async function initializeWeatherWidget() {
    const weatherContainer = document.getElementById('weather-container');
    if (!weatherContainer) return;

    try {
        // Add loading state
        weatherContainer.innerHTML = `
            <div class="weather-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading weather data...</p>
            </div>
        `;
        await fetchWeatherData();
        
        // Set up auto-refresh every 30 minutes
        setInterval(fetchWeatherData, 30 * 60 * 1000);
    } catch (error) {
        console.error('Weather widget error:', error);
        weatherContainer.innerHTML = `
            <div class="weather-error">
                <i class="fas fa-exclamation-circle"></i>
                <p>Unable to load weather data</p>
                <button onclick="initializeWeatherWidget()" class="retry-button">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

// Weather API integration using data.gov.sg
async function fetchWeatherData() {
    const weatherContainer = document.getElementById('weather-container');
    
    try {
        const response = await fetch('https://api.data.gov.sg/v1/environment/4-day-weather-forecast');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (!data.items || !data.items[0] || !data.items[0].forecasts) {
            throw new Error('No forecast data available');
        }

        const forecasts = data.items[0].forecasts;
        
        // Create weather cards for each forecast day
        const weatherHTML = forecasts.map((forecast, index) => {
            const date = new Date(forecast.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            // Get weather icon
            const weatherIcon = getWeatherIcon(forecast.forecast.toLowerCase());
            
            // Format temperature and weather description
            const temperature = {
                high: forecast.temperature.high,
                low: forecast.temperature.low
            };
            
            // Add extra details for today
            const isToday = index === 0;
            const todayExtra = isToday ? `
                <div class="weather-detail">
                    <div class="weather-desc">${forecast.forecast}</div>
                </div>
            ` : '';

            return `
                <div class="weather-card ${isToday ? 'today' : ''}">
                    <div class="weather-date">
                        <span class="day">${dayName}</span>
                        <span class="date">${monthDay}</span>
                    </div>
                    <div class="weather-icon">
                        <i class="${weatherIcon}"></i>
                    </div>
                    <div class="weather-temp">
                        <span class="temp-high">${temperature.high}°C</span>
                        <span class="temp-low">${temperature.low}°C</span>
                    </div>
                    ${todayExtra}
                </div>
            `;
        }).join('');

        weatherContainer.innerHTML = weatherHTML;

    } catch (error) {
        console.error('Error fetching weather data:', error);
        weatherContainer.innerHTML = `
            <div class="weather-error">
                <i class="fas fa-exclamation-circle"></i>
                <p>Unable to load weather data. Please try again later.</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

// Helper function to map NEA weather conditions to Font Awesome icons
function getWeatherIcon(forecast) {
    const iconMap = {
        'sunny': 'fas fa-sun',
        'partly cloudy': 'fas fa-cloud-sun',
        'cloudy': 'fas fa-cloud',
        'light rain': 'fas fa-cloud-rain',
        'moderate rain': 'fas fa-cloud-showers-heavy',
        'heavy rain': 'fas fa-cloud-showers-heavy',
        'light showers': 'fas fa-cloud-rain',
        'showers': 'fas fa-cloud-showers-heavy',
        'thundery showers': 'fas fa-bolt',
        'heavy thundery showers': 'fas fa-bolt',
        'fair': 'fas fa-sun',
        'fair (day)': 'fas fa-sun',
        'fair (night)': 'fas fa-moon',
        'windy': 'fas fa-wind'
    };

    // Find the matching icon or return a default icon
    for (const [condition, icon] of Object.entries(iconMap)) {
        if (forecast.includes(condition)) {
            return icon;
        }
    }
    return 'fas fa-cloud'; // Default icon
}

// Map integration
function initializeMap() {
    // Pasir Ris Beach coordinates
    const pasirRisLocation = { lat: 1.381497, lng: 103.955574 };
    
    // Create map
    const map = new google.maps.Map(document.getElementById('map'), {
        center: pasirRisLocation,
        zoom: 16,
        mapTypeId: 'roadmap',
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true
    });

    // Add marker for cleanup location
    const marker = new google.maps.Marker({
        position: pasirRisLocation,
        map: map,
        title: 'Next Cleanup: Pasir Ris Beach',
        animation: google.maps.Animation.DROP
    });

    // Add info window
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px;">
                <h3 style="margin: 0 0 10px;">Pasir Ris Beach Cleanup</h3>
                <p><strong>Date:</strong> June 15, 2025</p>
                <p><strong>Time:</strong> 8:00 AM</p>
                <p><strong>Squad Members:</strong> 15 joined</p>
            </div>
        `
    });

    // Show info window when marker is clicked
    marker.addListener('click', () => {
        infoWindow.open(map, marker);
    });
}

// Utility function for error handling
function handleError(error) {
    console.error('An error occurred:', error);
    // Implement user-friendly error messaging
}
