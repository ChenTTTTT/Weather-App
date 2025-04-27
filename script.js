const searchInput = document.querySelector('.search-input');
const cityElement = document.querySelector('.city');
const tempElement = document.querySelector('.temp');
const weatherDescElement = document.querySelector('.weather-description');
const windElement = document.querySelector('.wind');
const humidityElement = document.querySelector('.humidity');
const weatherIconElement = document.getElementById('current-weather-icon');
const forecastCardsContainer = document.getElementById('forecast-cards');
const cityDropdown = document.getElementById('city-dropdown');

// Initialize Swiper
const swiper = new Swiper('.swiper-container', {
    slidesPerView: 3,
    spaceBetween: 20,
    pagination: {
        el: '.swiper-pagination',
        clickable: true
    },
    // Prevent swiping on the main container
    touchStartPreventDefault: false,
    nested: true,
    resistance: true,
    resistanceRatio: 0.85,
    // Enable swipe only on the forecast cards
    touchEventsTarget: 'container',
    // Improve touch handling
    touchRatio: 1,
    touchAngle: 45,
    simulateTouch: true,
    shortSwipes: true,
    // Responsive breakpoints
    breakpoints: {
        320: {
            slidesPerView: 2,
            spaceBetween: 10
        },
        480: {
            slidesPerView: 3,
            spaceBetween: 20
        }
    }
});

async function getWeatherData(city) {
    // First, get coordinates using Geocoding API
    const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const geoData = await geoResponse.json();

    if (!geoData.results || !geoData.results.length) {
        console.log('No results found for city:', city);
        throw new Error(`City "${city}" not found`);
    }

    const { latitude, longitude } = geoData.results[0];
    const cityName = geoData.results[0].name;
    
    console.log('Found coordinates for', city, ':', latitude, longitude);
    return getWeatherDataByCoords(latitude, longitude, cityName);
}

async function getWeatherDataByCoords(latitude, longitude, cityName) {
    try {
        console.log('Getting weather for coordinates:', latitude, longitude, cityName);
        
        // Ensure latitude and longitude are numbers
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        
        if (isNaN(lat) || isNaN(lon)) {
            throw new Error('Invalid coordinates');
        }
        
        // Get weather forecast using Open-Meteo API
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max,precipitation_probability_mean&current_weather=true&timezone=auto`
        );
        
        if (!weatherResponse.ok) {
            throw new Error(`API responded with status: ${weatherResponse.status}`);
        }
        
        const weatherData = await weatherResponse.json();
        console.log('Weather data received:', weatherData);
        
        // Extract city name from the full text if needed
        let displayName = cityName;
        if (cityName.includes(',')) {
            displayName = cityName.split(',')[0].trim();
        }
        
        return { current: weatherData.current_weather, daily: weatherData.daily, cityName: displayName };
    } catch (error) {
        console.error('Error fetching weather by coordinates:', error);
        alert(`Error fetching weather data: ${error.message}. Please try again.`);
    }
}

function getWeatherIcon(code) {
    // Map WMO weather codes to Font Awesome icons
    const weatherIcons = {
        0: 'sun', // Clear sky
        1: 'sun', // Mainly clear
        2: 'cloud-sun', // Partly cloudy
        3: 'cloud', // Overcast
        45: 'smog', // Foggy
        48: 'smog', // Depositing rime fog
        51: 'cloud-rain', // Light drizzle
        53: 'cloud-rain', // Moderate drizzle
        55: 'cloud-rain', // Dense drizzle
        61: 'cloud-showers-heavy', // Slight rain
        63: 'cloud-showers-heavy', // Moderate rain
        65: 'cloud-showers-heavy', // Heavy rain
        71: 'snowflake', // Slight snow fall
        73: 'snowflake', // Moderate snow fall
        75: 'snowflake', // Heavy snow fall
        77: 'snowflake', // Snow grains
        80: 'cloud-rain', // Slight rain showers
        81: 'cloud-rain', // Moderate rain showers
        82: 'cloud-rain', // Violent rain showers
        85: 'snowflake', // Slight snow showers
        86: 'snowflake', // Heavy snow showers
        95: 'bolt', // Thunderstorm
        96: 'bolt', // Thunderstorm with slight hail
        99: 'bolt' // Thunderstorm with heavy hail
    };
    return weatherIcons[code] || 'question';
}

function getWeatherDescription(code) {
    const descriptions = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Light snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Light rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Light snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with hail',
        99: 'Thunderstorm with heavy hail'
    };
    return descriptions[code] || 'Unknown';
}

function updateCurrentWeather(data) {
    console.log('Updating current weather with data:', data);
    if (!data || !data.current) {
        console.error('Invalid weather data:', data);
        return;
    }
    
    const { temperature, windspeed, weathercode } = data.current;
    const icon = getWeatherIcon(weathercode);
    const description = getWeatherDescription(weathercode);

    cityElement.textContent = data.cityName || 'Unknown';
    tempElement.textContent = Math.round(temperature);
    weatherDescElement.textContent = description;
    windElement.textContent = `${Math.round(windspeed)} km/h`;
    
    // Check if precipitation data is available
    if (data.daily && data.daily.precipitation_probability_mean && data.daily.precipitation_probability_mean.length > 0) {
        humidityElement.textContent = `${data.daily.precipitation_probability_mean[0]}%`;
    } else {
        humidityElement.textContent = 'N/A';
    }
    
    // Set the weather icon
    weatherIconElement.className = `fas fa-${icon} fa-4x`;
}

function updateForecast(data) {
    console.log('Updating forecast with data:', data);
    forecastCardsContainer.innerHTML = '';
    
    if (!data || !data.daily || !data.daily.time) {
        console.error('Invalid forecast data:', data);
        return;
    }
    
    const days = data.daily.time;
    const maxTemps = data.daily.temperature_2m_max;
    const weatherCodes = data.daily.weathercode;

    if (!days.length || !maxTemps || !weatherCodes) {
        console.error('Missing forecast data components');
        return;
    }

    days.forEach((timestamp, index) => {
        try {
            const date = new Date(timestamp);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            const temp = Math.round(maxTemps[index]);
            const icon = getWeatherIcon(weatherCodes[index]);

            const forecastCard = document.createElement('div');
            forecastCard.className = 'swiper-slide';
            forecastCard.innerHTML = `
                <div class="forecast-card">
                    <div class="day">${day}</div>
                    <i class="fas fa-${icon} fa-2x"></i>
                    <div class="temp">${temp}°C</div>
                </div>
            `;

            forecastCardsContainer.appendChild(forecastCard);
        } catch (error) {
            console.error('Error creating forecast card:', error);
        }
    });

    swiper.update();
}

// Function to search for cities with autocomplete
async function searchCities(query) {
    if (!query || query.length < 2) {
        cityDropdown.innerHTML = '';
        cityDropdown.classList.remove('active');
        return;
    }

    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
        );
        const data = await response.json();

        if (!data.results || !data.results.length) {
            cityDropdown.innerHTML = '<div class="city-item">No cities found</div>';
            cityDropdown.classList.add('active');
            return;
        }

        // Clear previous results
        cityDropdown.innerHTML = '';

        // Add new results
        data.results.forEach(city => {
            const cityItem = document.createElement('div');
            cityItem.className = 'city-item';
            cityItem.textContent = `${city.name}${city.admin1 ? ', ' + city.admin1 : ''}${city.country ? ', ' + city.country : ''}`;
            
            // Store city data as attributes
            cityItem.dataset.latitude = city.latitude;
            cityItem.dataset.longitude = city.longitude;
            cityItem.dataset.name = city.name;
            
            cityItem.addEventListener('click', async () => {
                searchInput.value = cityItem.textContent;
                cityDropdown.classList.remove('active');
                
                try {
                    console.log('Selected city:', city);
                    // Pass the coordinates directly instead of searching again
                    const data = await getWeatherDataByCoords(city.latitude, city.longitude, cityItem.textContent);
                    if (data) {
                        updateCurrentWeather(data);
                        updateForecast(data);
                    }
                } catch (error) {
                    console.error('Error handling city selection:', error);
                }
            });

            cityDropdown.appendChild(cityItem);
        });

        // Show dropdown
        cityDropdown.classList.add('active');

    } catch (error) {
        console.error('Error searching cities:', error);
    }
}

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Debounced search function
const debouncedSearch = debounce(searchCities, 300);

// Handle input changes for autocomplete
searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    debouncedSearch(query);
});

// Hide dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-input-container')) {
        cityDropdown.classList.remove('active');
    }
});

async function handleSearch() {
    const city = searchInput.value.trim();
    if (!city) return;

    // Hide dropdown
    cityDropdown.classList.remove('active');

    try {
        console.log('Searching for city:', city);
        const data = await getWeatherData(city);
        if (data) {
            updateCurrentWeather(data);
            updateForecast(data);
        }
    } catch (error) {
        console.error('Error in handleSearch:', error);
        alert('Could not find weather data for this location. Please try a different city name.');
    }
}

// Only keep Enter key functionality for direct searches
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Initial weather data for a default city
getWeatherData('London').then(data => {
    if (data) {
        updateCurrentWeather(data);
        updateForecast(data);
    }
});

// Variable for touch tracking
let startY = 0;

// Prevent background swiping
document.addEventListener('touchmove', function(e) {
    // Allow swiping only within the swiper container
    if (!e.target.closest('.swiper-container') && !e.target.closest('.swiper-slide')) {
        e.preventDefault();
    }
}, { passive: false });

// Prevent pull-to-refresh on mobile
document.body.addEventListener('touchstart', function(e) {
    if (e.target.closest('.swiper-container') || e.target.closest('.swiper-slide')) {
        return; // Allow normal touch behavior in swiper
    }
    
    if (e.touches.length === 1) {
        startY = e.touches[0].clientY;
    }
}, { passive: true });

document.body.addEventListener('touchmove', function(e) {
    if (e.target.closest('.swiper-container') || e.target.closest('.swiper-slide')) {
        return; // Allow normal touch behavior in swiper
    }
    
    if (e.touches.length === 1) {
        // Prevent pull-to-refresh
        if (e.touches[0].clientY > startY && window.scrollY <= 0) {
            e.preventDefault();
        }
    }
}, { passive: false });
