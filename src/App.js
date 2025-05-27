import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { Clock, Filter, Search, RefreshCw, Cloud, Sun, CloudRain, Wind, AlertCircle, Snowflake, CloudLightning, CloudFog, ChevronDown, ChevronUp, MapPin, Thermometer, Droplets, Compass, Moon, Star, Globe, Plus, X, Trash2, Settings, Eye, EyeOff } from 'lucide-react';

// API key для погоды (только для демонстрации)
const API_KEY = '8871f970c472fa8a12e71acca5a9c464';

// Расширенный список городов и регионов
const worldRegions = [
  // США - штаты
  { name: 'Нью-Йорк', englishName: 'New York', country: 'США', timezone: 'America/New_York', coordinates: { lat: 40.7128, lon: -74.0060 }, isRepublican: false },
  { name: 'Лос-Анджелес', englishName: 'Los Angeles', country: 'США', timezone: 'America/Los_Angeles', coordinates: { lat: 34.0522, lon: -118.2437 }, isRepublican: false },
  { name: 'Чикаго', englishName: 'Chicago', country: 'США', timezone: 'America/Chicago', coordinates: { lat: 41.8781, lon: -87.6298 }, isRepublican: false },
  { name: 'Хьюстон', englishName: 'Houston', country: 'США', timezone: 'America/Chicago', coordinates: { lat: 29.7604, lon: -95.3698 }, isRepublican: true },
  { name: 'Финикс', englishName: 'Phoenix', country: 'США', timezone: 'America/Phoenix', coordinates: { lat: 33.4484, lon: -112.0740 }, isRepublican: true },
  { name: 'Филадельфия', englishName: 'Philadelphia', country: 'США', timezone: 'America/New_York', coordinates: { lat: 39.9526, lon: -75.1652 }, isRepublican: false },
  { name: 'Сан-Антонио', englishName: 'San Antonio', country: 'США', timezone: 'America/Chicago', coordinates: { lat: 29.4241, lon: -98.4936 }, isRepublican: true },
  { name: 'Сан-Диего', englishName: 'San Diego', country: 'США', timezone: 'America/Los_Angeles', coordinates: { lat: 32.7157, lon: -117.1611 }, isRepublican: false },
  { name: 'Даллас', englishName: 'Dallas', country: 'США', timezone: 'America/Chicago', coordinates: { lat: 32.7767, lon: -96.7970 }, isRepublican: true },
  { name: 'Сан-Хосе', englishName: 'San Jose', country: 'США', timezone: 'America/Los_Angeles', coordinates: { lat: 37.3382, lon: -121.8863 }, isRepublican: false },
  { name: 'Майами', englishName: 'Miami', country: 'США', timezone: 'America/New_York', coordinates: { lat: 25.7617, lon: -80.1918 }, isRepublican: true },
  { name: 'Атланта', englishName: 'Atlanta', country: 'США', timezone: 'America/New_York', coordinates: { lat: 33.7490, lon: -84.3880 }, isRepublican: true },
  { name: 'Сиэтл', englishName: 'Seattle', country: 'США', timezone: 'America/Los_Angeles', coordinates: { lat: 47.6062, lon: -122.3321 }, isRepublican: false },
  { name: 'Денвер', englishName: 'Denver', country: 'США', timezone: 'America/Denver', coordinates: { lat: 39.7392, lon: -104.9903 }, isRepublican: false },
  { name: 'Бостон', englishName: 'Boston', country: 'США', timezone: 'America/New_York', coordinates: { lat: 42.3601, lon: -71.0589 }, isRepublican: false },
  { name: 'Лас-Вегас', englishName: 'Las Vegas', country: 'США', timezone: 'America/Los_Angeles', coordinates: { lat: 36.1699, lon: -115.1398 }, isRepublican: true },
  
  // Баку
  { name: 'Баку', englishName: 'Baku', country: 'Азербайджан', timezone: 'Asia/Baku', coordinates: { lat: 40.4093, lon: 49.8671 }, isBaku: true },

  // Мировые города
  { name: 'Лондон', englishName: 'London', country: 'Великобритания', timezone: 'Europe/London', coordinates: { lat: 51.5074, lon: -0.1278 }, isCity: true },
  { name: 'Париж', englishName: 'Paris', country: 'Франция', timezone: 'Europe/Paris', coordinates: { lat: 48.8566, lon: 2.3522 }, isCity: true },
  { name: 'Берлин', englishName: 'Berlin', country: 'Германия', timezone: 'Europe/Berlin', coordinates: { lat: 52.5200, lon: 13.4050 }, isCity: true },
  { name: 'Москва', englishName: 'Moscow', country: 'Россия', timezone: 'Europe/Moscow', coordinates: { lat: 55.7558, lon: 37.6173 }, isCity: true },
  { name: 'Токио', englishName: 'Tokyo', country: 'Япония', timezone: 'Asia/Tokyo', coordinates: { lat: 35.6762, lon: 139.6503 }, isCity: true },
  { name: 'Дубай', englishName: 'Dubai', country: 'ОАЭ', timezone: 'Asia/Dubai', coordinates: { lat: 25.2048, lon: 55.2708 }, isCity: true },
  { name: 'Шанхай', englishName: 'Shanghai', country: 'Китай', timezone: 'Asia/Shanghai', coordinates: { lat: 31.2304, lon: 121.4737 }, isCity: true },
  { name: 'Сингапур', englishName: 'Singapore', country: 'Сингапур', timezone: 'Asia/Singapore', coordinates: { lat: 1.3521, lon: 103.8198 }, isCity: true },
  { name: 'Сидней', englishName: 'Sydney', country: 'Австралия', timezone: 'Australia/Sydney', coordinates: { lat: -33.8688, lon: 151.2093 }, isCity: true },
  { name: 'Стамбул', englishName: 'Istanbul', country: 'Турция', timezone: 'Europe/Istanbul', coordinates: { lat: 41.0082, lon: 28.9784 }, isCity: true },
  { name: 'Торонто', englishName: 'Toronto', country: 'Канада', timezone: 'America/Toronto', coordinates: { lat: 43.6532, lon: -79.3832 }, isCity: true },
  { name: 'Мехико', englishName: 'Mexico City', country: 'Мексика', timezone: 'America/Mexico_City', coordinates: { lat: 19.4326, lon: -99.1332 }, isCity: true },
];

// Популярные города для добавления
const popularWorldCities = [
  { id: 'Europe/London', name: 'Лондон', timezone: 'Europe/London' },
  { id: 'Europe/Paris', name: 'Париж', timezone: 'Europe/Paris' },
  { id: 'Europe/Berlin', name: 'Берлин', timezone: 'Europe/Berlin' },
  { id: 'Europe/Moscow', name: 'Москва', timezone: 'Europe/Moscow' },
  { id: 'Asia/Tokyo', name: 'Токио', timezone: 'Asia/Tokyo' },
  { id: 'Asia/Dubai', name: 'Дубай', timezone: 'Asia/Dubai' },
  { id: 'Asia/Shanghai', name: 'Шанхай', timezone: 'Asia/Shanghai' },
  { id: 'Asia/Singapore', name: 'Сингапур', timezone: 'Asia/Singapore' },
  { id: 'Australia/Sydney', name: 'Сидней', timezone: 'Australia/Sydney' },
  { id: 'America/New_York', name: 'Нью-Йорк', timezone: 'America/New_York' },
  { id: 'America/Los_Angeles', name: 'Лос-Анджелес', timezone: 'America/Los_Angeles' },
  { id: 'America/Sao_Paulo', name: 'Сан-Паулу', timezone: 'America/Sao_Paulo' },
];

// Мемоизированная иконка погоды с улучшенной анимацией
const MemoizedWeatherIcon = memo(({ iconCode, size = 28, className = "" }) => {
  if (!iconCode || iconCode === 'loading') {
    return <RefreshCw size={size} className={`animate-spin ${className}`} />;
  }
  if (iconCode === 'error') {
    return <AlertCircle size={size} className={`text-red-500 ${className}`} />;
  }
  
  const baseClassName = `transition-all duration-300 ease-in-out ${className}`;
  
  if (iconCode.startsWith('01')) return <Sun size={size} className={`${baseClassName} text-yellow-500 drop-shadow-lg`} />;
  if (iconCode.startsWith('02') || iconCode.startsWith('03') || iconCode.startsWith('04')) return <Cloud size={size} className={`${baseClassName} text-gray-400 drop-shadow-md`} />;
  if (iconCode.startsWith('09') || iconCode.startsWith('10')) return <CloudRain size={size} className={`${baseClassName} text-blue-400 drop-shadow-md`} />;
  if (iconCode.startsWith('11')) return <CloudLightning size={size} className={`${baseClassName} text-purple-500 drop-shadow-lg animate-pulse`} />;
  if (iconCode.startsWith('13')) return <Snowflake size={size} className={`${baseClassName} text-blue-100 drop-shadow-md`} />;
  if (iconCode.startsWith('50')) return <CloudFog size={size} className={`${baseClassName} text-gray-300 drop-shadow-sm`} />;
  return <Cloud size={size} className={`${baseClassName} text-gray-500 drop-shadow-md`} />;
});

// Улучшенный переключатель темы
const AnimatedThemeSlider = memo(({ theme, setTheme, isMobile = false }) => {
  const sliderSize = isMobile ? { width: 44, height: 24, thumb: 20 } : { width: 52, height: 28, thumb: 24 };
  const isDark = theme === 'dark';

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [theme, setTheme]);

  return (
    <button
      role="switch"
      aria-checked={isDark}
      aria-label={`Переключить на ${isDark ? 'светлую' : 'темную'} тему`}
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center rounded-full cursor-pointer transition-all duration-300 ease-in-out border-none outline-none shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isDark 
          ? 'bg-gradient-to-r from-slate-800 to-slate-600' 
          : 'bg-gradient-to-r from-amber-400 to-orange-400'
      }`}
      style={{
        width: `${sliderSize.width}px`,
        height: `${sliderSize.height}px`,
      }}
    >
      <span 
        className={`absolute bg-white rounded-full flex items-center justify-center transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) shadow-md ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
        style={{
          width: `${sliderSize.thumb}px`,
          height: `${sliderSize.thumb}px`,
          left: `${(sliderSize.height - sliderSize.thumb) / 2}px`,
          transform: isDark 
            ? `translateX(${sliderSize.width - sliderSize.thumb - (sliderSize.height - sliderSize.thumb)}px)` 
            : 'translateX(0px)',
        }}
      >
        <Sun 
          size={sliderSize.thumb * 0.6} 
          className={`absolute transition-all duration-300 ${
            isDark 
              ? 'opacity-0 rotate-180 scale-50' 
              : 'opacity-100 rotate-0 scale-100'
          } text-amber-500`} 
        />
        <Moon 
          size={sliderSize.thumb * 0.6} 
          className={`absolute transition-all duration-300 ${
            isDark 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-180 scale-50'
          } text-blue-400`} 
        />
      </span>
    </button>
  );
});

// Улучшенная карточка региона
const RegionCard = memo(({ 
  state, 
  theme, 
  currentTime, 
  expandedCards, 
  toggleCardExpanded, 
  favoriteRegions, 
  toggleFavorite, 
  hoveredCard, 
  setHoveredCard,
  onRemove
}) => {
  const isExpanded = expandedCards[state.englishName] || false;
  const isFavorite = favoriteRegions.includes(state.englishName);
  const [localTime, setLocalTime] = useState(currentTime);
  const [weather, setWeather] = useState({ loading: true, data: null, error: null });

  // Обновляем локальное время для более плавной анимации
  useEffect(() => {
    const timer = setInterval(() => {
      setLocalTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Загрузка погоды
  useEffect(() => {
    if (isExpanded && state.coordinates) {
      const fetchWeather = async () => {
        try {
          setWeather({ loading: true, data: null, error: null });
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${state.coordinates.lat}&lon=${state.coordinates.lon}&appid=${API_KEY}&units=metric&lang=ru`
          );
          if (response.ok) {
            const data = await response.json();
            setWeather({ loading: false, data, error: null });
          } else {
            throw new Error('Weather API error');
          }
        } catch (error) {
          setWeather({ loading: false, data: null, error: error.message });
        }
      };
      fetchWeather();
    }
  }, [isExpanded, state.coordinates]);

  const formattedTime = useMemo(() => {
    try {
      const options = { 
        hour: 'numeric', 
        minute: 'numeric', 
        second: 'numeric', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric', 
        timeZone: state.timezone, 
        hour12: false 
      };
      return new Intl.DateTimeFormat('ru-RU', options).format(localTime);
    } catch (error) { 
      console.error(`Invalid timezone for ${state.name}: ${state.timezone}`); 
      return "Ошибка часового пояса"; 
    }
  }, [localTime, state.timezone, state.name]);

  const timezoneAbbr = useMemo(() => {
    try {
      const timeFormatter = new Intl.DateTimeFormat('en', {
        timeZone: state.timezone,
        timeZoneName: 'short'
      });
      const parts = timeFormatter.formatToParts(localTime);
      const timeZonePart = parts.find(part => part.type === 'timeZoneName');
      return timeZonePart ? timeZonePart.value : '';
    } catch (error) {
      return '';
    }
  }, [localTime, state.timezone]);

  const getCardStyle = () => {
    if (state.isBaku) {
      return theme === 'dark' 
        ? 'bg-gradient-to-br from-blue-900/90 to-purple-900/90 border-blue-400/20' 
        : 'bg-gradient-to-br from-blue-100 to-purple-100 border-blue-300/30';
    }
    if (state.isRepublican !== undefined) {
      return state.isRepublican
        ? theme === 'dark' 
          ? 'bg-gradient-to-br from-red-900/70 to-red-800/70 border-red-400/20' 
          : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200/40'
        : theme === 'dark' 
          ? 'bg-gradient-to-br from-blue-900/70 to-blue-800/70 border-blue-400/20' 
          : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200/40';
    }
    return theme === 'dark' 
      ? 'bg-gray-800/90 border-gray-600/30' 
      : 'bg-white/90 border-gray-200/40';
  };

  return (
    <div 
      className={`region-card backdrop-blur-sm border rounded-xl p-4 transition-all duration-300 ease-out hover:shadow-lg hover:scale-[1.02] ${getCardStyle()}`}
      onMouseEnter={() => setHoveredCard?.(state.englishName)}
      onMouseLeave={() => setHoveredCard?.(null)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
            <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {state.name}
            </h3>
            {state.isBaku && (
              <Star size={16} className="text-yellow-500 fill-yellow-500" />
            )}
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {state.country} {timezoneAbbr && `(${timezoneAbbr})`}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleFavorite(state.englishName)}
            className={`p-1.5 rounded-full transition-all ${
              isFavorite 
                ? 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30' 
                : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
          >
            <Star size={18} className={isFavorite ? 'fill-current' : ''} />
          </button>
          
          {onRemove && (
            <button
              onClick={() => onRemove(state.englishName)}
              className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
              aria-label="Удалить город"
            >
              <Trash2 size={16} />
            </button>
          )}
          
          <button
            onClick={() => toggleCardExpanded(state.englishName)}
            className={`p-1.5 rounded-full transition-all ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      <div className={`font-mono text-xl font-bold mb-2 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
        {formattedTime}
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
          {weather.loading && (
            <div className="flex items-center gap-2 text-sm">
              <RefreshCw size={16} className="animate-spin" />
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                Загрузка погоды...
              </span>
            </div>
          )}
          
          {weather.error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle size={16} />
              <span>Ошибка загрузки погоды</span>
            </div>
          )}
          
          {weather.data && (
            <div className={`p-3 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700/50' : 'bg-white/50'
            } backdrop-blur-sm`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MemoizedWeatherIcon iconCode={weather.data.weather[0]?.icon} size={24} />
                  <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {Math.round(weather.data.main.temp)}°C
                  </span>
                </div>
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {weather.data.weather[0]?.description}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Thermometer size={14} />
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    {Math.round(weather.data.main.feels_like)}°C
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Droplets size={14} />
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    {weather.data.main.humidity}%
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Wind size={14} />
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    {Math.round(weather.data.wind?.speed || 0)} м/с
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Compass size={14} />
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    {weather.data.visibility ? `${Math.round(weather.data.visibility / 1000)} км` : 'н/д'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// Основной компонент приложения
const WorldClockWeatherApp = () => {
  const [theme, setTheme] = useState('light');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedCards, setExpandedCards] = useState({});
  const [favoriteRegions, setFavoriteRegions] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customCities, setCustomCities] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  // Обновление времени каждую секунду
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Функции для управления состоянием
  const toggleCardExpanded = useCallback((regionName) => {
    setExpandedCards(prev => ({
      ...prev,
      [regionName]: !prev[regionName]
    }));
  }, []);

  const toggleFavorite = useCallback((regionName) => {
    setFavoriteRegions(prev => 
      prev.includes(regionName) 
        ? prev.filter(name => name !== regionName)
        : [...prev, regionName]
    );
  }, []);

  const addCustomCity = useCallback((city) => {
    const newCity = {
      name: city.name,
      englishName: city.name,
      country: 'Пользовательский',
      timezone: city.timezone,
      coordinates: { lat: 0, lon: 0 },
      isCustom: true
    };
    setCustomCities(prev => [...prev, newCity]);
    setShowAddModal(false);
  }, []);

  const removeCustomCity = useCallback((cityName) => {
    setCustomCities(prev => prev.filter(city => city.englishName !== cityName));
  }, []);

  // Фильтрация и сортировка регионов
  const filteredRegions = useMemo(() => {
    const allRegions = [...worldRegions, ...customCities];
    
    let filtered = allRegions.filter(region => {
      const matchesSearch = region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           region.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           region.country.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      switch (filterType) {
        case 'usa': return region.country === 'США';
        case 'world': return region.country !== 'США' && !region.isCustom;
        case 'baku': return region.isBaku;
        case 'favorites': return favoriteRegions.includes(region.englishName);
        case 'custom': return region.isCustom;
        default: return true;
      }
    });

    // Сортировка: избранные сначала, затем Баку, затем по алфавиту
    return filtered.sort((a, b) => {
      const aFav = favoriteRegions.includes(a.englishName);
      const bFav = favoriteRegions.includes(b.englishName);
      
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      if (a.isBaku && !b.isBaku) return -1;
      if (!a.isBaku && b.isBaku) return 1;
      
      return a.name.localeCompare(b.name, 'ru');
    });
  }, [searchTerm, filterType, favoriteRegions, customCities]);

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      <div className="container mx-auto px-4 py-6">
        {/* Заголовок и навигация */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Globe size={32} className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
            <h1 className={`text-4xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Мировые Часы
            </h1>
          </div>
          
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <AnimatedThemeSlider theme={theme} setTheme={setTheme} />
            
            <button
              onClick={() => setShowAddModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                theme === 'dark' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } shadow-lg hover:shadow-xl hover:-translate-y-0.5`}
            >
              <Plus size={18} />
              <span>Добавить город</span>
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className={`p-2 rounded-full transition-all ${
                theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              } shadow-lg hover:shadow-xl hover:-translate-y-0.5`}
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* Поиск и фильтры */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <div className="relative">
              <Search size={20} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Поиск городов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-full border transition-all w-64 ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter size={18} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`px-3 py-2 rounded-full border transition-all ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                <option value="all">Все регионы</option>
                <option value="usa">США</option>
                <option value="world">Мировые города</option>
                <option value="baku">Баку</option>
                <option value="favorites">Избранные</option>
                <option value="custom">Пользовательские</option>
              </select>
            </div>
          </div>
        </div>

        {/* Сетка карточек */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRegions.map((region) => (
            <RegionCard
              key={region.englishName}
              state={region}
              theme={theme}
              currentTime={currentTime}
              expandedCards={expandedCards}
              toggleCardExpanded={toggleCardExpanded}
              favoriteRegions={favoriteRegions}
              toggleFavorite={toggleFavorite}
              hoveredCard={hoveredCard}
              setHoveredCard={setHoveredCard}
              onRemove={region.isCustom ? removeCustomCity : null}
            />
          ))}
        </div>

        {filteredRegions.length === 0 && (
          <div className="text-center py-12">
            <Globe size={48} className={`mx-auto mb-4 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`text-lg ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Города не найдены
            </p>
            <p className={`text-sm mt-2 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Попробуйте изменить поисковый запрос или фильтр
            </p>
          </div>
        )}

        {/* Модальное окно добавления города */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`max-w-md w-full rounded-xl p-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-2xl`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Добавить город
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className={`p-2 rounded-full transition-all ${
                    theme === 'dark' 
                      ? 'hover:bg-gray-700 text-gray-400' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-3">
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Выберите город из популярных:
                </p>
                
                {popularWorldCities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => addCustomCity(city)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      theme === 'dark' 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span className="font-medium">{city.name}</span>
                      <span className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        ({city.timezone})
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно настроек */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`max-w-md w-full rounded-xl p-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-2xl`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Настройки
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className={`p-2 rounded-full transition-all ${
                    theme === 'dark' 
                      ? 'hover:bg-gray-700 text-gray-400' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                    Темная тема
                  </span>
                  <AnimatedThemeSlider theme={theme} setTheme={setTheme} isMobile />
                </div>
                
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h4 className={`font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Статистика
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        Всего городов:
                      </span>
                      <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                        {worldRegions.length + customCities.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        Избранные:
                      </span>
                      <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                        {favoriteRegions.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        Пользовательские:
                      </span>
                      <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                        {customCities.length}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50'
                }`}>
                  <h4 className={`font-semibold mb-2 flex items-center gap-2 ${
                    theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                  }`}>
                    <Clock size={16} />
                    Текущее время
                  </h4>
                  <p className={`font-mono text-lg ${
                    theme === 'dark' ? 'text-blue-200' : 'text-blue-600'
                  }`}>
                    {new Intl.DateTimeFormat('ru-RU', {
                      hour: 'numeric',
                      minute: 'numeric',
                      second: 'numeric',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour12: false
                    }).format(currentTime)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorldClockWeatherApp;
