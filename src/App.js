import React, { useState, useEffect, useCallback, useRef, useMemo, memo, useReducer } from 'react';
import { Clock, Filter, Search, RefreshCw, Cloud, Sun, CloudRain, Wind, AlertCircle, Snowflake, CloudLightning, CloudFog, ChevronDown, ChevronUp, MapPin, Thermometer, Droplets, Compass, Moon, Star, Globe, Plus, X, Trash2 } from 'lucide-react';
// Импортируем логотип для универсальной совместимости со всеми сборками React
import earthLogo from './planet-earth.png';

// API key (только для погоды Баку)
const API_KEY = '8871f970c472fa8a12e71acca5a9c464';

// --- Список популярных городов для мировых часов ---
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

// --- Мемоизированные компоненты ---

// Иконка погоды (только для Баку)
const MemoizedWeatherIcon = memo(({ iconCode, size = 28 }) => {
  if (!iconCode || iconCode === 'loading') return <RefreshCw size={size} className="animate-spin" />;
  if (iconCode === 'error') return <AlertCircle size={size} className="text-red-500" />;
  if (iconCode.startsWith('01')) return <Sun size={size} className="text-yellow-500" />;
  if (iconCode.startsWith('02') || iconCode.startsWith('03') || iconCode.startsWith('04')) return <Cloud size={size} className="text-gray-400" />;
  if (iconCode.startsWith('09') || iconCode.startsWith('10')) return <CloudRain size={size} className="text-blue-400" />;
  if (iconCode.startsWith('11')) return <CloudLightning size={size} className="text-purple-500" />;
  if (iconCode.startsWith('13')) return <Snowflake size={size} className="text-blue-100" />;
  if (iconCode.startsWith('50')) return <CloudFog size={size} className="text-gray-300" />;
  return <Cloud size={size} className="text-gray-500" />;
});

// Компонент настоящего слайдера для переключения темы
const ThemeSlider = memo(({ theme, toggleTheme, isMobile = false }) => {
  return (
    <div className="theme-slider-container">
      <div className="theme-slider-icon sun">
        <Sun size={isMobile ? 14 : 16} />
      </div>
      <input 
        type="range" 
        min="0" 
        max="100" 
        value={theme === 'dark' ? 100 : 0} 
        onChange={(e) => {
          const newTheme = parseInt(e.target.value) > 50 ? 'dark' : 'light';
          if (newTheme !== theme) toggleTheme();
        }}
        className="theme-slider" 
        aria-label="Переключить тему"
      />
      <div className="theme-slider-icon moon">
        <Moon size={isMobile ? 14 : 16} />
      </div>
    </div>
  );
});

// Карточка региона (без погоды)
const RegionCard = memo(({ state, theme, currentTime, expandedCards, toggleCardExpanded, favoriteRegions, toggleFavorite, hoveredCard, setHoveredCard }) => {
  const isExpanded = expandedCards[state.englishName] || false;
  const isFavorite = favoriteRegions.includes(state.englishName);

  const formattedTime = useMemo(() => {
    try {
      const options = { hour: 'numeric', minute: 'numeric', second: 'numeric', day: 'numeric', month: 'long', year: 'numeric', timeZone: state.timezone, hour12: false };
      return new Intl.DateTimeFormat('ru-RU', options).format(currentTime);
    } catch (error) { console.error(`Invalid timezone for ${state.name}: ${state.timezone}`); return "Ошибка часового пояса"; }
  }, [currentTime, state.timezone, state.name]);

  const timezoneAbbr = useMemo(() => {
    const timezoneMap = { "America/New_York": "EST/EDT", "America/Chicago": "CST/CDT", "America/Denver": "MST/MDT", "America/Los_Angeles": "PST/PDT", "America/Phoenix": "MST", "America/Detroit": "EST/EDT", "America/Anchorage": "AKST/AKDT", "Pacific/Honolulu": "HST", "Asia/Baku": "AZT", "America/Toronto": "EST/EDT", "America/Montreal": "EST/EDT", "America/Vancouver": "PST/PDT", "America/Edmonton": "MST/MDT", "America/Winnipeg": "CST/CDT", "America/Regina": "CST", "America/Halifax": "AST/ADT", "America/St_Johns": "NST/NDT", "America/Moncton": "AST/ADT", "America/Yellowknife": "MST/MDT", "America/Iqaluit": "EST/EDT", "America/Whitehorse": "PST/PDT" };
    return timezoneMap[state.timezone] || state.timezone;
  }, [state.timezone]);

  const timeDifference = useMemo(() => {
    try {
      const date = new Date();
      const time1 = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Baku' }));
      const time2 = new Date(date.toLocaleString('en-US', { timeZone: state.timezone }));
      const diffHours = (time2.getTime() - time1.getTime()) / (1000 * 60 * 60);
      if (isNaN(diffHours)) return 'Некорректный пояс';
      if (diffHours === 0) return 'Одинаковое время';
      const sign = diffHours > 0 ? '+' : '';
      return `${sign}${diffHours.toFixed(1).replace('.0', '')} ч`;
    } catch (error) { return 'Ошибка расчета'; }
  }, [state.timezone]);

  const cardBackground = useMemo(() => {
    if (state.isCity) return theme === 'dark' ? 'bg-gradient-to-br from-purple-900 to-purple-800 border-l-4 border-purple-500' : 'bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500';
    if (state.isRepublican === true) return theme === 'dark' ? 'bg-gradient-to-br from-red-900 to-red-800 border-l-4 border-red-500' : 'bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500';
    if (state.isRepublican === false) return theme === 'dark' ? 'bg-gradient-to-br from-blue-900 to-blue-800 border-l-4 border-blue-500' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500';
    return theme === 'dark' ? 'bg-gradient-to-br from-green-900 to-green-800 border-l-4 border-green-500' : 'bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500';
  }, [state.isCity, state.isRepublican, theme]);

  const titleColor = useMemo(() => {
    if (theme === 'dark') return 'text-white';
    if (state.isCity) return 'text-purple-800';
    if (state.isRepublican === true) return 'text-red-800';
    if (state.isRepublican === false) return 'text-blue-800';
    return 'text-green-800';
  }, [state.isCity, state.isRepublican, theme]);

  return (
    <div 
      className={`rounded-lg shadow-lg p-4 sm:p-6 ${cardBackground} transition-all duration-500 transform hover:scale-[1.02] ${hoveredCard === state.englishName ? 'shadow-xl' : ''}`}
      onMouseEnter={() => setHoveredCard(state.englishName)}
      onMouseLeave={() => setHoveredCard(null)}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className={`font-bold text-lg sm:text-xl leading-tight ${titleColor} transition-colors duration-500`}>{state.name}</h3>
        <div className="flex items-center space-x-2">
          <button onClick={() => toggleFavorite(state.englishName)} className={`text-${isFavorite ? 'yellow' : 'gray'}-${theme === 'dark' ? '400' : '500'} hover:text-yellow-500 transition-colors duration-300 p-1 -m-1`} aria-label={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}>
            <Star size={20} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <span className={`text-sm ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'} px-2 py-1 rounded transition-colors duration-500`}>{state.country}</span>
        </div>
      </div>
      <div className={`font-mono text-xl sm:text-2xl mb-3 break-words ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'} transition-colors duration-500`}>{formattedTime}</div>
      <div className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-4 transition-colors duration-500`}>{timezoneAbbr}</div>
      <div className={`pt-4 mt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} transition-colors duration-500`}>
        <div className="flex justify-between items-center">
          <h4 className={`text-base font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} transition-colors duration-500`}>Дополнительно</h4>
          <button onClick={() => toggleCardExpanded(state.englishName)} className={`text-${theme === 'dark' ? 'gray-300' : 'gray-500'} hover:text-${theme === 'dark' ? 'white' : 'gray-700'} transition-colors duration-300 p-1 -m-1`} aria-label={isExpanded ? "Свернуть" : "Развернуть"}>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        {isExpanded && (
          <div className={`mt-3 animate-fadeIn space-y-2 transition-colors duration-500`}>
            <div className="flex items-center">
              <MapPin size={18} className="mr-1.5" />
              <span className={`text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-500`}>{state.coordinates.lat.toFixed(2)}, {state.coordinates.lon.toFixed(2)}</span>
            </div>
            <div className={`text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} transition-colors duration-500`}>Разница с Баку: {timeDifference}</div>
          </div>
        )}
      </div>
    </div>
  );
});

// Карточка Баку (с погодой)
const BakuCard = memo(({ currentTime, bakuWeather, theme, isMobileView, updateBakuWeather }) => {
  const formattedTime = useMemo(() => {
    try {
      const options = { hour: 'numeric', minute: 'numeric', second: 'numeric', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Baku', hour12: false };
      return new Intl.DateTimeFormat('ru-RU', options).format(currentTime);
    } catch (error) { return "Ошибка часового пояса"; }
  }, [currentTime]);

  return (
    <div className={`bg-gradient-to-r ${theme === 'dark' ? 'from-blue-900 to-purple-900' : 'from-blue-500 to-purple-600'} rounded-xl shadow-xl p-5 sm:p-8 text-white transition-all duration-500 transform hover:scale-[1.01]`}>
      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-5 sm:gap-0">
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center sm:justify-start"><Clock className="mr-3" size={28} /> Баку, Азербайджан</h2>
          <div className="text-3xl sm:text-4xl font-mono mt-4 text-center sm:text-left">{formattedTime}</div>
          <div className="text-base opacity-80 mt-2 text-center sm:text-left">AZT</div>
        </div>
        <div className="text-center sm:text-right mt-4 sm:mt-0 flex-shrink-0">
          {bakuWeather.loading ? (
            <div className="flex items-center justify-center text-lg h-full"><RefreshCw className="animate-spin mr-2" size={22} /><span>Загрузка...</span></div>
          ) : bakuWeather.error ? (
            <div className="text-red-200 text-lg flex flex-col items-center justify-center h-full">
              <div className='flex items-center'><AlertCircle className="mr-1.5 inline" size={22} />{bakuWeather.error}</div>
              <button onClick={updateBakuWeather} className='mt-2 text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded'>Повторить</button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center sm:justify-end mb-3">
                <MemoizedWeatherIcon iconCode={bakuWeather.icon} size={isMobileView ? 32 : 40} />
                <span className="text-4xl sm:text-5xl font-bold ml-3">{bakuWeather.temperature}°C</span>
              </div>
              <div className="text-lg mb-3 capitalize">{bakuWeather.condition}</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-base sm:text-lg opacity-90">
                <div className="flex items-center justify-center sm:justify-end"><Wind size={20} className="mr-1.5" /><span>{bakuWeather.windSpeed} км/ч</span></div>
                <div className="flex items-center"><Droplets size={20} className="mr-1.5" /><span>{bakuWeather.humidity}%</span></div>
                <div className="flex items-center col-span-2 justify-center sm:justify-end"><Thermometer size={20} className="mr-1.5" /><span>Ощущается как {bakuWeather.feelsLike}°C</span></div>
                <div className="flex items-center col-span-2 justify-center sm:justify-end"><Compass size={20} className="mr-1.5" /><span>{Math.round(bakuWeather.pressure / 1.333)} мм рт.ст.</span></div>
              </div>
              <button onClick={updateBakuWeather} className='mt-4 text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded flex items-center mx-auto sm:ml-auto sm:mr-0'><RefreshCw size={16} className='mr-1.5'/> Обновить</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

// Десктопные контролы с настоящим слайдером
const DesktopControls = memo(({ theme, toggleTheme, filter, setFilter, searchQuery, setSearchQuery, sortOrder, setSortOrder }) => (
  <div className={`hidden md:block mb-8 p-5 rounded-lg shadow-md ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'} transition-colors duration-500`}>
    <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
      <div className="flex items-center">
        <ThemeSlider theme={theme} toggleTheme={toggleTheme} />
        <span className={`ml-3 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} transition-colors duration-500`}>
          {theme === 'dark' ? 'Темная тема' : 'Светлая тема'}
        </span>
      </div>
      <div className="flex-1 flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-1">
          <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-500`}>Фильтр:</label>
          <select className={`border rounded px-3 py-2 w-full ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-700'} transition-colors duration-500`} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Все регионы</option>
            <option value="republican">Республиканские штаты</option>
            <option value="democrat">Демократические штаты</option>
            <option value="canada">Канада</option>
            <option value="favorites">Избранное</option>
          </select>
        </div>
        <div className="flex-1">
          <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-500`}>Поиск:</label>
          <div className="relative">
            <input type="text" placeholder="Поиск региона..." className={`border rounded px-3 py-2 w-full pl-10 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'} transition-colors duration-500`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'} transition-colors duration-500`} size={20} />
          </div>
        </div>
        <div className="flex-1">
          <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-500`}>Сортировка:</label>
          <select className={`border rounded px-3 py-2 w-full ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-700'} transition-colors duration-500`} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="alphabetical">По алфавиту</option>
            <option value="timezone">По часовому поясу</option>
            <option value="difference">По разнице с Баку</option>
          </select>
        </div>
      </div>
    </div>
  </div>
));

// Мобильные контролы с настоящим слайдером
const MobileControls = memo(({ theme, toggleTheme, toggleMenu, isMenuOpen, filter, setFilter, searchQuery, setSearchQuery, sortOrder, setSortOrder, setIsMenuOpen }) => (
  <div className={`fixed bottom-0 left-0 right-0 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t p-4 z-10 md:hidden transition-colors duration-500`}>
    <div className="flex justify-around items-center">
      <button onClick={toggleMenu} className={`flex items-center justify-center ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-full w-14 h-14 transition-colors duration-300`}><Filter size={24} /></button>
      <ThemeSlider theme={theme} toggleTheme={toggleTheme} isMobile={true} />
      <div className="w-14 h-14"></div>
    </div>
    {isMenuOpen && (
      <div className={`absolute bottom-20 left-0 right-0 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-t-lg shadow-lg p-5 space-y-5 transition-colors duration-500`}>
        <div className="flex flex-col space-y-2">
          <label className={`text-base font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-500`}>Фильтр:</label>
          <select className={`border rounded px-3 py-2 w-full text-base ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-700'} transition-colors duration-500`} value={filter} onChange={(e) => { setFilter(e.target.value); setIsMenuOpen(false); }}>
            <option value="all">Все регионы</option><option value="republican">Республиканские штаты</option><option value="democrat">Демократические штаты</option><option value="canada">Канада</option><option value="favorites">Избранное</option>
          </select>
        </div>
        <div className="flex flex-col space-y-2">
          <label className={`text-base font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-500`}>Поиск:</label>
          <div className="relative">
            <input type="text" placeholder="Поиск региона..." className={`border rounded px-3 py-2 w-full pl-10 text-base ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-700'} transition-colors duration-500`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'} transition-colors duration-500`} size={20} />
          </div>
        </div>
        <div className="flex flex-col space-y-2">
          <label className={`text-base font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-500`}>Сортировка:</label>
          <select className={`border rounded px-3 py-2 w-full text-base ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-700'} transition-colors duration-500`} value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setIsMenuOpen(false); }}>
            <option value="alphabetical">По алфавиту</option><option value="timezone">По часовому поясу</option><option value="difference">По разнице с Баку</option>
          </select>
        </div>
      </div>
    )}
  </div>
));

// Основной компонент приложения
function App() {
  // --- Refs ---
  const themeTransitionRef = useRef(null);
  const bakuWeatherCacheRef = useRef(null);
  const bakuWeatherTimestampRef = useRef(null);
  const bakuWeatherRefreshTimeoutRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  // --- Reducer для управления состоянием ---
  const initialState = {
    theme: 'light',
    currentTime: new Date(),
    favoriteRegions: [],
    expandedCards: {},
    hoveredCard: null,
    filter: 'all',
    searchQuery: '',
    sortOrder: 'alphabetical',
    isMenuOpen: false,
    isMobileView: false,
    bakuWeather: {
      temperature: null,
      condition: '',
      icon: 'loading',
      windSpeed: null,
      humidity: null,
      pressure: null,
      feelsLike: null,
      loading: true,
      error: null
    },
    worldClocks: []
  };

  const reducer = (state, action) => {
    switch (action.type) {
      case 'SET_THEME':
        return { ...state, theme: action.payload };
      case 'TOGGLE_THEME':
        return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
      case 'SET_CURRENT_TIME':
        return { ...state, currentTime: action.payload };
      case 'SET_FAVORITE_REGIONS':
        return { ...state, favoriteRegions: action.payload };
      case 'TOGGLE_FAVORITE':
        return {
          ...state,
          favoriteRegions: state.favoriteRegions.includes(action.payload)
            ? state.favoriteRegions.filter(region => region !== action.payload)
            : [...state.favoriteRegions, action.payload]
        };
      case 'SET_EXPANDED_CARDS':
        return { ...state, expandedCards: action.payload };
      case 'TOGGLE_CARD_EXPANDED':
        return {
          ...state,
          expandedCards: {
            ...state.expandedCards,
            [action.payload]: !state.expandedCards[action.payload]
          }
        };
      case 'SET_HOVERED_CARD':
        return { ...state, hoveredCard: action.payload };
      case 'SET_FILTER':
        return { ...state, filter: action.payload };
      case 'SET_SEARCH_QUERY':
        return { ...state, searchQuery: action.payload };
      case 'SET_SORT_ORDER':
        return { ...state, sortOrder: action.payload };
      case 'TOGGLE_MENU':
        return { ...state, isMenuOpen: !state.isMenuOpen };
      case 'SET_IS_MENU_OPEN':
        return { ...state, isMenuOpen: action.payload };
      case 'SET_IS_MOBILE_VIEW':
        return { ...state, isMobileView: action.payload };
      case 'SET_BAKU_WEATHER':
        return { ...state, bakuWeather: action.payload };
      case 'SET_WORLD_CLOCKS':
        return { ...state, worldClocks: action.payload };
      case 'ADD_WORLD_CLOCK':
        if (state.worldClocks.some(clock => clock.id === action.payload.id)) return state;
        return { ...state, worldClocks: [...state.worldClocks, action.payload] };
      case 'REMOVE_WORLD_CLOCK':
        return { ...state, worldClocks: state.worldClocks.filter(clock => clock.id !== action.payload) };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, initialState);
  const { theme, currentTime, favoriteRegions, expandedCards, hoveredCard, filter, searchQuery, sortOrder, isMenuOpen, isMobileView, bakuWeather, worldClocks } = state;

  // --- Мемоизированные данные ---
  const usStates = useMemo(() => [
    { name: "Алабама", englishName: "Alabama", timezone: "America/Chicago", isRepublican: true, country: "США", coordinates: { lat: 32.3182, lon: -86.9023 } },
    { name: "Аляска", englishName: "Alaska", timezone: "America/Anchorage", isRepublican: true, country: "США", coordinates: { lat: 61.3850, lon: -152.2683 } },
    { name: "Аризона", englishName: "Arizona", timezone: "America/Phoenix", isRepublican: true, country: "США", coordinates: { lat: 33.7298, lon: -111.4312 } },
    { name: "Арканзас", englishName: "Arkansas", timezone: "America/Chicago", isRepublican: true, country: "США", coordinates: { lat: 34.9697, lon: -92.3731 } },
    { name: "Калифорния", englishName: "California", timezone: "America/Los_Angeles", isRepublican: false, country: "США", coordinates: { lat: 36.1162, lon: -119.6816 } },
    { name: "Колорадо", englishName: "Colorado", timezone: "America/Denver", isRepublican: false, country: "США", coordinates: { lat: 39.0598, lon: -105.3111 } },
    { name: "Коннектикут", englishName: "Connecticut", timezone: "America/New_York", isRepublican: false, country: "США", coordinates: { lat: 41.5978, lon: -72.7554 } },
    { name: "Делавэр", englishName: "Delaware", timezone: "America/New_York", isRepublican: false, country: "США", coordinates: { lat: 39.3185, lon: -75.5071 } },
    { name: "Флорида", englishName: "Florida", timezone: "America/New_York", isRepublican: true, country: "США", coordinates: { lat: 27.7663, lon: -81.6868 } },
    { name: "Джорджия", englishName: "Georgia", timezone: "America/New_York", isRepublican: true, country: "США", coordinates: { lat: 33.0406, lon: -83.6431 } },
    { name: "Гавайи", englishName: "Hawaii", timezone: "Pacific/Honolulu", isRepublican: false, country: "США", coordinates: { lat: 21.0943, lon: -157.4983 } },
    { name: "Айдахо", englishName: "Idaho", timezone: "America/Denver", isRepublican: true, country: "США", coordinates: { lat: 44.2405, lon: -114.4788 } },
    { name: "Иллинойс", englishName: "Illinois", timezone: "America/Chicago", isRepublican: false, country: "США", coordinates: { lat: 40.3495, lon: -88.9861 } },
    { name: "Индиана", englishName: "Indiana", timezone: "America/New_York", isRepublican: true, country: "США", coordinates: { lat: 39.8494, lon: -86.2583 } },
    { name: "Айова", englishName: "Iowa", timezone: "America/Chicago", isRepublican: true, country: "США", coordinates: { lat: 42.0115, lon: -93.2105 } },
    { name: "Канзас", englishName: "Kansas", timezone: "America/Chicago", isRepublican: true, country: "США", coordinates: { lat: 38.5266, lon: -96.7265 } },
    { name: "Кентукки", englishName: "Kentucky", timezone: "America/New_York", isRepublican: true, country: "США", coordinates: { lat: 37.6681, lon: -84.6701 } },
    { name: "Луизиана", englishName: "Louisiana", timezone: "America/Chicago", isRepublican: true, country: "США", coordinates: { lat: 31.1695, lon: -91.8678 } },
    { name: "Мэн", englishName: "Maine", timezone: "America/New_York", isRepublican: false, country: "США", coordinates: { lat: 44.6939, lon: -69.3819 } },
    { name: "Мэриленд", englishName: "Maryland", timezone: "America/New_York", isRepublican: false, country: "США", coordinates: { lat: 39.0639, lon: -76.8021 } },
    { name: "Массачусетс", englishName: "Massachusetts", timezone: "America/New_York", isRepublican: false, country: "США", coordinates: { lat: 42.2302, lon: -71.5301 } },
    { name: "Мичиган", englishName: "Michigan", timezone: "America/Detroit", isRepublican: false, country: "США", coordinates: { lat: 43.3266, lon: -84.5361 } },
    { name: "Миннесота", englishName: "Minnesota", timezone: "America/Chicago", isRepublican: false, country: "США", coordinates: { lat: 45.6945, lon: -93.9002 } },
    { name: "Миссисипи", englishName: "Mississippi", timezone: "America/Chicago", isRepublican: true, country: "США", coordinates: { lat: 32.7416, lon: -89.6787 } },
    { name: "Миссури", englishName: "Missouri", timezone: "America/Chicago", isRepublican: true, country: "США", coordinates: { lat: 38.4561, lon: -92.2884 } },
    { name: "Монтана", englishName: "Montana", timezone: "America/Denver", isRepublican: true, country: "США", coordinates: { lat: 46.9219, lon: -110.4544 } },
    { name: "Небраска", englishName: "Nebraska", timezone: "America/Chicago", isRepublican: true, country: "США", coordinates: { lat: 41.4925, lon: -99.9018 } },
    { name: "Невада", englishName: "Nevada", timezone: "America/Los_Angeles", isRepublican: false, country: "США", coordinates: { lat: 38.8026, lon: -116.4194 } },
    { name: "Нью-Гэмпшир", englishName: "New Hampshire", timezone: "America/New_York", isRepublican: false, country: "США", coordinates: { lat: 43.4525, lon: -71.5639 } },
    { name: "Нью-Джерси", englishName: "New Jersey", timezone: "America/New_York", isRepublican: false, country: "США", coordinates: { lat: 40.2989, lon: -74.5210 } },
    { name: "Нью-Мексико", englishName: "New Mexico", timezone: "America/Denver", isRepublican: false, country: "США", coordinates: { lat: 34.8405, lon: -106.2485 } },
    { name: "Нью-Йорк", englishName: "New York", timezone: "America/New_York", isRepublican: false, country: "США", coordinates: { lat: 42.1657, lon: -74.9481 } },
    { name: "Северная Каролина", englishName: "North Carolina", timezone: "America/New_York", isRepublican: true, country: "США", coordinates: { lat: 35.6301, lon: -79.8064 } },
    { name: "Северная Дакота", englishName: "North Dakota", timezone: "America/Chicago", isRepublican: true, country: "США", coordinates: { lat: 47.5289, lon: -99.7840 } },
    { name: "Огайо", englishName: "Ohio", timezone: "America/New_York", isRepublican: true, country: "США", coordinates: { lat: 40.3888, lon: -82.7649 } },
    { name: "Оклахома", englishName: "Oklahoma", timezone: "America/Chicago", isRepublican: true, country: "США", coordinates: { lat: 35.5653, lon: -96.9289 } },
    { name: "Орегон", englishName: "Oregon", timezone: "America/Los_Angeles", isRepublican: false, country: "США", coordinates: { lat: 44.5720, lon: -122.0709 } },
    { name: "Пенсильвания", englishName: "Pennsylvania", timezone: "America/New_York", isRepublican: false, country: "США", coordinates: { lat: 40.5908, lon: -77.2098 } },
    { name: "Род-Айленд", englishName: "Rhode Island", timezone: "America/New_York", isRepublican: false, country: "США", coordinates: { lat: 41.6809, lon: -71.5118 } },
    { name: "Южная Каролина", englishName: "South Carolina", timezone: "America/New_York", isRepublican: true, country: "США", coordinates: { lat: 33.8569, lon: -80.9450 } },
    { name: "Южная Дакота", englishName: "South Dakota", timezone: "America/Chicago", isRepublican: true, country: "США", coordinates: { lat: 44.2998, lon: -99.4388 } },
    { name: "Теннесси", englishName: "Tennessee", timezone: "America/Chicago", isRepublican: true, country: "США", coordinates: { lat: 35.7478, lon: -86.6923 } },
    { name: "Техас", englishName: "Texas", timezone: "America/Chicago", isRepublican: true, country: "США", coordinates: { lat: 31.0545, lon: -97.5635 } },
    { name: "Юта", englishName: "Utah", timezone: "America/Denver", isRepublican: true, country: "США", coordinates: { lat: 40.1500, lon: -111.8624 } },
    { name: "Вермонт", englishName: "Vermont", timezone: "America/New_York", isRepublican: false, country: "США", coordinates: { lat: 44.0459, lon: -72.7107 } },
    { name: "Вирджиния", englishName: "Virginia", timezone: "America/New_York", isRepublican: false, country: "США", coordinates: { lat: 37.7693, lon: -78.1700 } },
    { name: "Вашингтон", englishName: "Washington", timezone: "America/Los_Angeles", isRepublican: false, country: "США", coordinates: { lat: 47.4009, lon: -121.4905 } },
    { name: "Западная Вирджиния", englishName: "West Virginia", timezone: "America/New_York", isRepublican: true, country: "США", coordinates: { lat: 38.4912, lon: -80.9545 } },
    { name: "Висконсин", englishName: "Wisconsin", timezone: "America/Chicago", isRepublican: false, country: "США", coordinates: { lat: 44.2685, lon: -89.6165 } },
    { name: "Вайоминг", englishName: "Wyoming", timezone: "America/Denver", isRepublican: true, country: "США", coordinates: { lat: 42.7475, lon: -107.2085 } },
    { name: "Округ Колумбия", englishName: "District of Columbia", timezone: "America/New_York", isRepublican: false, country: "США", coordinates: { lat: 38.8974, lon: -77.0268 } }
  ], []);

  const canadianProvinces = useMemo(() => [
    { name: "Альберта", englishName: "Alberta", timezone: "America/Edmonton", isRepublican: null, country: "Канада", coordinates: { lat: 53.9333, lon: -116.5765 } },
    { name: "Британская Колумбия", englishName: "British Columbia", timezone: "America/Vancouver", isRepublican: null, country: "Канада", coordinates: { lat: 53.7267, lon: -127.6476 } },
    { name: "Манитоба", englishName: "Manitoba", timezone: "America/Winnipeg", isRepublican: null, country: "Канада", coordinates: { lat: 53.7609, lon: -98.8139 } },
    { name: "Нью-Брансуик", englishName: "New Brunswick", timezone: "America/Moncton", isRepublican: null, country: "Канада", coordinates: { lat: 46.5653, lon: -66.4619 } },
    { name: "Ньюфаундленд и Лабрадор", englishName: "Newfoundland and Labrador", timezone: "America/St_Johns", isRepublican: null, country: "Канада", coordinates: { lat: 53.1355, lon: -57.6604 } },
    { name: "Северо-Западные территории", englishName: "Northwest Territories", timezone: "America/Yellowknife", isRepublican: null, country: "Канада", coordinates: { lat: 64.8255, lon: -124.8457 } },
    { name: "Новая Шотландия", englishName: "Nova Scotia", timezone: "America/Halifax", isRepublican: null, country: "Канада", coordinates: { lat: 44.6820, lon: -63.7443 } },
    { name: "Нунавут", englishName: "Nunavut", timezone: "America/Iqaluit", isRepublican: null, country: "Канада", coordinates: { lat: 70.2998, lon: -83.1076 } },
    { name: "Онтарио", englishName: "Ontario", timezone: "America/Toronto", isRepublican: null, country: "Канада", coordinates: { lat: 51.2538, lon: -85.3232 } },
    { name: "Остров Принца Эдуарда", englishName: "Prince Edward Island", timezone: "America/Halifax", isRepublican: null, country: "Канада", coordinates: { lat: 46.5107, lon: -63.4168 } },
    { name: "Квебек", englishName: "Quebec", timezone: "America/Montreal", isRepublican: null, country: "Канада", coordinates: { lat: 52.9399, lon: -73.5491 } },
    { name: "Саскачеван", englishName: "Saskatchewan", timezone: "America/Regina", isRepublican: null, country: "Канада", coordinates: { lat: 52.9399, lon: -106.4509 } },
    { name: "Юкон", englishName: "Yukon", timezone: "America/Whitehorse", isRepublican: null, country: "Канада", coordinates: { lat: 64.2823, lon: -135.0000 } }
  ], []);

  const canadianCities = useMemo(() => [
    { name: "Торонто", englishName: "Toronto", timezone: "America/Toronto", isRepublican: null, country: "Канада", coordinates: { lat: 43.7001, lon: -79.4163 }, isCity: true },
    { name: "Монреаль", englishName: "Montreal", timezone: "America/Montreal", isRepublican: null, country: "Канада", coordinates: { lat: 45.5017, lon: -73.5673 }, isCity: true },
    { name: "Ванкувер", englishName: "Vancouver", timezone: "America/Vancouver", isRepublican: null, country: "Канада", coordinates: { lat: 49.2827, lon: -123.1207 }, isCity: true },
    { name: "Калгари", englishName: "Calgary", timezone: "America/Edmonton", isRepublican: null, country: "Канада", coordinates: { lat: 51.0447, lon: -114.0719 }, isCity: true },
    { name: "Эдмонтон", englishName: "Edmonton", timezone: "America/Edmonton", isRepublican: null, country: "Канада", coordinates: { lat: 53.5461, lon: -113.4938 }, isCity: true },
    { name: "Оттава", englishName: "Ottawa", timezone: "America/Toronto", isRepublican: null, country: "Канада", coordinates: { lat: 45.4215, lon: -75.6972 }, isCity: true },
    { name: "Виннипег", englishName: "Winnipeg", timezone: "America/Winnipeg", isRepublican: null, country: "Канада", coordinates: { lat: 49.8951, lon: -97.1384 }, isCity: true },
    { name: "Квебек", englishName: "Quebec City", timezone: "America/Montreal", isRepublican: null, country: "Канада", coordinates: { lat: 46.8139, lon: -71.2080 }, isCity: true },
    { name: "Гамильтон", englishName: "Hamilton", timezone: "America/Toronto", isRepublican: null, country: "Канада", coordinates: { lat: 43.2557, lon: -79.8711 }, isCity: true },
    { name: "Китченер", englishName: "Kitchener", timezone: "America/Toronto", isRepublican: null, country: "Канада", coordinates: { lat: 43.4516, lon: -80.4925 }, isCity: true },
    { name: "Лондон", englishName: "London", timezone: "America/Toronto", isRepublican: null, country: "Канада", coordinates: { lat: 42.9849, lon: -81.2453 }, isCity: true },
    { name: "Виктория", englishName: "Victoria", timezone: "America/Vancouver", isRepublican: null, country: "Канада", coordinates: { lat: 48.4284, lon: -123.3656 }, isCity: true },
    { name: "Галифакс", englishName: "Halifax", timezone: "America/Halifax", isRepublican: null, country: "Канада", coordinates: { lat: 44.6488, lon: -63.5752 }, isCity: true },
    { name: "Ошава", englishName: "Oshawa", timezone: "America/Toronto", isRepublican: null, country: "Канада", coordinates: { lat: 43.8971, lon: -78.8658 }, isCity: true },
    { name: "Саскатун", englishName: "Saskatoon", timezone: "America/Regina", isRepublican: null, country: "Канада", coordinates: { lat: 52.1332, lon: -106.6700 }, isCity: true },
    { name: "Реджайна", englishName: "Regina", timezone: "America/Regina", isRepublican: null, country: "Канада", coordinates: { lat: 50.4452, lon: -104.6189 }, isCity: true },
    { name: "Сент-Джонс", englishName: "St. John's", timezone: "America/St_Johns", isRepublican: null, country: "Канада", coordinates: { lat: 47.5615, lon: -52.7126 }, isCity: true },
    { name: "Барри", englishName: "Barrie", timezone: "America/Toronto", isRepublican: null, country: "Канада", coordinates: { lat: 44.3894, lon: -79.6903 }, isCity: true },
    { name: "Келоуна", englishName: "Kelowna", timezone: "America/Vancouver", isRepublican: null, country: "Канада", coordinates: { lat: 49.8880, lon: -119.4960 }, isCity: true },
    { name: "Абботсфорд", englishName: "Abbotsford", timezone: "America/Vancouver", isRepublican: null, country: "Канада", coordinates: { lat: 49.0504, lon: -122.3045 }, isCity: true },
    { name: "Садбери", englishName: "Sudbury", timezone: "America/Toronto", isRepublican: null, country: "Канада", coordinates: { lat: 46.4917, lon: -80.9930 }, isCity: true },
    { name: "Шербрук", englishName: "Sherbrooke", timezone: "America/Montreal", isRepublican: null, country: "Канада", coordinates: { lat: 45.4042, lon: -71.8929 }, isCity: true },
    { name: "Труа-Ривьер", englishName: "Trois-Rivieres", timezone: "America/Montreal", isRepublican: null, country: "Канада", coordinates: { lat: 46.3432, lon: -72.5430 }, isCity: true },
    { name: "Сент-Катаринс", englishName: "St. Catharines", timezone: "America/Toronto", isRepublican: null, country: "Канада", coordinates: { lat: 43.1594, lon: -79.2469 }, isCity: true },
    { name: "Фредериктон", englishName: "Fredericton", timezone: "America/Moncton", isRepublican: null, country: "Канада", coordinates: { lat: 45.9636, lon: -66.6431 }, isCity: true },
    { name: "Шарлоттаун", englishName: "Charlottetown", timezone: "America/Halifax", isRepublican: null, country: "Канада", coordinates: { lat: 46.2382, lon: -63.1311 }, isCity: true },
    { name: "Йеллоунайф", englishName: "Yellowknife", timezone: "America/Yellowknife", isRepublican: null, country: "Канада", coordinates: { lat: 62.4540, lon: -114.3718 }, isCity: true },
    { name: "Икалуит", englishName: "Iqaluit", timezone: "America/Iqaluit", isRepublican: null, country: "Канада", coordinates: { lat: 63.7467, lon: -68.5170 }, isCity: true },
    { name: "Уайтхорс", englishName: "Whitehorse", timezone: "America/Whitehorse", isRepublican: null, country: "Канада", coordinates: { lat: 60.7212, lon: -135.0568 }, isCity: true }
  ], []);

  const states = useMemo(() => [...usStates, ...canadianProvinces, ...canadianCities], [usStates, canadianProvinces, canadianCities]);

  // --- useEffect хуки ---

  // Загрузка избранного, темы и мировых часов из localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteRegions');
    if (savedFavorites) try { dispatch({ type: 'SET_FAVORITE_REGIONS', payload: JSON.parse(savedFavorites) }); } catch (e) { console.error('Error loading favorites:', e); }
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) dispatch({ type: 'SET_THEME', payload: savedTheme });
    
    const savedWorldClocks = localStorage.getItem('worldClocks');
    if (savedWorldClocks) try { dispatch({ type: 'SET_WORLD_CLOCKS', payload: JSON.parse(savedWorldClocks) }); } catch (e) { console.error('Error loading world clocks:', e); }

  }, []);

  // Оптимизированное переключение темы
  const toggleTheme = useCallback(() => {
    // Используем requestAnimationFrame для синхронизации с циклом отрисовки браузера
    if (themeTransitionRef.current) cancelAnimationFrame(themeTransitionRef.current);
    
    // Подготавливаем DOM перед изменением темы
    document.documentElement.classList.add('theme-transition');
    
    themeTransitionRef.current = requestAnimationFrame(() => {
      dispatch({ type: 'TOGGLE_THEME' });
      
      // Удаляем класс transition после завершения анимации
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
        themeTransitionRef.current = null;
      }, 500); // Соответствует длительности перехода
    });
  }, []);

  // Применение темы к документу
  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    // Применяем класс темы к корневому элементу
    document.documentElement.classList.toggle('dark-theme', theme === 'dark');
    
    // Устанавливаем CSS-переменные для плавного перехода
    document.documentElement.style.setProperty('--transition-duration', '500ms');
    document.documentElement.style.setProperty('--transition-timing', 'ease');
    document.documentElement.style.setProperty('--bg-color', theme === 'dark' ? '#111827' : '#f3f4f6');
    document.documentElement.style.setProperty('--text-color', theme === 'dark' ? '#f3f4f6' : '#111827');
    document.documentElement.style.setProperty('--card-bg', theme === 'dark' ? '#1f2937' : '#ffffff');
    document.documentElement.style.setProperty('--border-color', theme === 'dark' ? '#374151' : '#e5e7eb');
    document.documentElement.style.setProperty('--input-bg', theme === 'dark' ? '#374151' : '#ffffff');
    document.documentElement.style.setProperty('--input-text', theme === 'dark' ? '#f3f4f6' : '#111827');
    document.documentElement.style.setProperty('--input-border', theme === 'dark' ? '#4b5563' : '#d1d5db');
    document.documentElement.style.setProperty('--slider-bg-start', theme === 'dark' ? '#f59e0b' : '#f59e0b');
    document.documentElement.style.setProperty('--slider-bg-end', theme === 'dark' ? '#6366f1' : '#6366f1');
    document.documentElement.style.setProperty('--slider-thumb', theme === 'dark' ? '#1f2937' : '#ffffff');
  }, [theme]);

  // Определение мобильного вида
  useEffect(() => {
    const checkMobileView = () => dispatch({ type: 'SET_IS_MOBILE_VIEW', payload: window.innerWidth < 768 });
    checkMobileView();
    let resizeTimer;
    const handleResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(checkMobileView, 100); };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(resizeTimer); };
  }, []);

  // Обновление времени каждую секунду
  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: 'SET_CURRENT_TIME', payload: new Date() }), 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Функции обратного вызова ---

  const toggleFavorite = useCallback((englishName) => dispatch({ type: 'TOGGLE_FAVORITE', payload: englishName }), []);
  const toggleCardExpanded = useCallback((englishName) => dispatch({ type: 'TOGGLE_CARD_EXPANDED', payload: englishName }), []);
  const toggleMenu = useCallback(() => dispatch({ type: 'TOGGLE_MENU' }), []);
  const addWorldClockCity = useCallback((city) => dispatch({ type: 'ADD_WORLD_CLOCK', payload: city }), []);
  const removeWorldClockCity = useCallback((id) => dispatch({ type: 'REMOVE_WORLD_CLOCK', payload: id }), []);

  // Загрузка погоды только для Баку
  const fetchBakuWeather = useCallback(async (forceRefresh = false) => {
    try {
      const now = Date.now();
      const lastFetchTime = bakuWeatherTimestampRef.current || 0;
      const cacheAge = now - lastFetchTime;
      if (!forceRefresh && cacheAge < 30 * 60 * 1000 && bakuWeatherCacheRef.current) {
        dispatch({ type: 'SET_BAKU_WEATHER', payload: { ...bakuWeatherCacheRef.current, loading: false, error: null } });
        return;
      }
      dispatch({ type: 'SET_BAKU_WEATHER', payload: { ...state.bakuWeather, loading: true, error: null } });
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=40.4093&lon=49.8671&appid=${API_KEY}&units=metric&lang=ru`);
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Failed to fetch Baku weather data'); }
      const data = await response.json();
      const bakuData = { temperature: Math.round(data.main.temp), condition: data.weather[0].description, icon: data.weather[0].icon, windSpeed: Math.round(data.wind.speed * 3.6), humidity: data.main.humidity, pressure: data.main.pressure, feelsLike: Math.round(data.main.feels_like), loading: false, error: null };
      bakuWeatherCacheRef.current = bakuData;
      bakuWeatherTimestampRef.current = now;
      dispatch({ type: 'SET_BAKU_WEATHER', payload: bakuData });
    } catch (err) {
      console.error('Error fetching Baku weather:', err);
      dispatch({ type: 'SET_BAKU_WEATHER', payload: { ...state.bakuWeather, loading: false, error: err.message || 'Не удалось загрузить данные о погоде' } });
    }
  }, [state.bakuWeather]);

  // Периодическое обновление погоды Баку
  const scheduleBakuWeatherRefresh = useCallback(() => {
    if (bakuWeatherRefreshTimeoutRef.current) clearTimeout(bakuWeatherRefreshTimeoutRef.current);
    bakuWeatherRefreshTimeoutRef.current = setTimeout(() => { fetchBakuWeather(); scheduleBakuWeatherRefresh(); }, 30 * 60 * 1000);
    return () => { if (bakuWeatherRefreshTimeoutRef.current) clearTimeout(bakuWeatherRefreshTimeoutRef.current); };
  }, [fetchBakuWeather]);

  // Первичная загрузка погоды Баку и запуск таймера
  useEffect(() => {
    if (isInitialLoadRef.current) { fetchBakuWeather(); scheduleBakuWeatherRefresh(); isInitialLoadRef.current = false; }
    return () => { if (bakuWeatherRefreshTimeoutRef.current) clearTimeout(bakuWeatherRefreshTimeoutRef.current); };
  }, [fetchBakuWeather, scheduleBakuWeatherRefresh]);

  // --- Фильтрация и сортировка регионов (без изменений) ---
  const filteredStates = useMemo(() => {
    return states.filter(state => {
      if (filter === 'republican' && !state.isRepublican) return false;
      if (filter === 'democrat' && state.isRepublican) return false;
      if (filter === 'canada' && state.country !== 'Канада') return false;
      if (filter === 'favorites') return favoriteRegions.includes(state.englishName);
      if ((filter === 'republican' || filter === 'democrat') && state.isRepublican === null) return false;
      if (searchQuery && !state.name.toLowerCase().includes(searchQuery.toLowerCase()) && !state.country.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [filter, searchQuery, states, favoriteRegions]);

  const favoriteRegionsList = useMemo(() => states.filter(state => favoriteRegions.includes(state.englishName)), [favoriteRegions, states]);
  const filteredUsStates = useMemo(() => filteredStates.filter(state => state.country === "США"), [filteredStates]);
  const filteredCanadianProvinces = useMemo(() => filteredStates.filter(state => state.country === "Канада" && !state.isCity), [filteredStates]);
  const filteredCanadianCities = useMemo(() => filteredStates.filter(state => state.country === "Канада" && state.isCity), [filteredStates]);

  const sortStates = useCallback((statesToSort) => {
    return [...statesToSort].sort((a, b) => {
      if (sortOrder === 'alphabetical') return a.name.localeCompare(b.name);
      if (sortOrder === 'timezone') return a.timezone.localeCompare(b.timezone);
      if (sortOrder === 'difference') {
        try {
          const bakuTime = new Date(currentTime.toLocaleString('en-US', { timeZone: 'Asia/Baku' }));
          const aTime = new Date(currentTime.toLocaleString('en-US', { timeZone: a.timezone }));
          const bTime = new Date(currentTime.toLocaleString('en-US', { timeZone: b.timezone }));
          return (bakuTime.getTime() - bTime.getTime()) - (bakuTime.getTime() - aTime.getTime());
        } catch { return 0; }
      }
      return 0;
    });
  }, [currentTime, sortOrder]);

  const sortedUsStates = useMemo(() => sortStates(filteredUsStates), [sortStates, filteredUsStates]);
  const sortedCanadianProvinces = useMemo(() => sortStates(filteredCanadianProvinces), [sortStates, filteredCanadianProvinces]);
  const sortedCanadianCities = useMemo(() => sortStates(filteredCanadianCities), [sortStates, filteredCanadianCities]);
  const sortedFavorites = useMemo(() => sortStates(favoriteRegionsList), [sortStates, favoriteRegionsList]);

  // Рендер карточки региона
  const renderStateCard = useCallback((state, index) => (
    <RegionCard
      key={`state-${state.englishName}-${index}`}
      state={state}
      theme={theme}
      currentTime={currentTime}
      expandedCards={expandedCards}
      toggleCardExpanded={toggleCardExpanded}
      favoriteRegions={favoriteRegions}
      toggleFavorite={toggleFavorite}
      hoveredCard={hoveredCard}
      setHoveredCard={(name) => dispatch({ type: 'SET_HOVERED_CARD', payload: name })}
    />
  ), [theme, currentTime, expandedCards, toggleCardExpanded, favoriteRegions, toggleFavorite, hoveredCard]);

  // --- JSX разметка ---
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'} p-4 sm:p-6 md:p-10 pb-24 md:pb-10 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 sm:mb-10 text-center">
          <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-3 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} flex items-center justify-center transition-colors duration-500`}>
            <img src={earthLogo} alt="Earth" className="w-12 h-12 sm:w-14 sm:h-14 mr-4 animate-pulse" />
            Часовые пояса и погода в Баку
          </h1>
          <p className={`text-base sm:text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} transition-colors duration-500`}>
            Сравнивайте время и следите за погодой в Баку
          </p>
        </header>

        {/* Карточка Баку */}
        <div className="mb-6 sm:mb-10">
          <BakuCard currentTime={currentTime} bakuWeather={bakuWeather} theme={theme} isMobileView={isMobileView} updateBakuWeather={() => fetchBakuWeather(true)} />
        </div>

        {/* Мировые часы */}
        <WorldClock 
          cities={worldClocks}
          currentTime={currentTime}
          theme={theme}
          addCity={addWorldClockCity}
          removeCity={removeWorldClockCity}
        />

        {/* Контролы */}
        <DesktopControls theme={theme} toggleTheme={toggleTheme} filter={filter} setFilter={(value) => dispatch({ type: 'SET_FILTER', payload: value })} searchQuery={searchQuery} setSearchQuery={(value) => dispatch({ type: 'SET_SEARCH_QUERY', payload: value })} sortOrder={sortOrder} setSortOrder={(value) => dispatch({ type: 'SET_SORT_ORDER', payload: value })} />

        {/* Списки регионов */}
        {favoriteRegionsList.length > 0 && (filter === 'all' || filter === 'favorites') && (
          <RegionList title={<span className="flex items-center"><Star size={24} className="text-yellow-500 mr-3" fill="currentColor" /> Избранное</span>} regions={sortedFavorites} renderStateCard={renderStateCard} />
        )}
        {filter !== 'canada' && filter !== 'favorites' && sortedUsStates.length > 0 && (
          <RegionList title="Штаты США" regions={sortedUsStates} renderStateCard={renderStateCard} />
        )}
        {(filter === 'all' || filter === 'canada') && sortedCanadianProvinces.length > 0 && (
          <RegionList title="Провинции Канады" regions={sortedCanadianProvinces} renderStateCard={renderStateCard} />
        )}
        {(filter === 'all' || filter === 'canada') && sortedCanadianCities.length > 0 && (
          <RegionList title="Города Канады" regions={sortedCanadianCities} renderStateCard={renderStateCard} />
        )}

        <footer className={`text-center ${theme === 'dark' ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'} text-base sm:text-lg mt-8 sm:mt-12 pt-6 border-t transition-colors duration-500 space-y-1`}>
          <p>Данные о погоде в Баку предоставлены OpenWeatherMap API</p>
          <p>Обновлено: {new Date().toLocaleString('ru-RU')}</p>
        </footer>
      </div>

      {/* Мобильные контролы */}
      <MobileControls theme={theme} toggleTheme={toggleTheme} toggleMenu={toggleMenu} isMenuOpen={isMenuOpen} filter={filter} setFilter={(value) => dispatch({ type: 'SET_FILTER', payload: value })} searchQuery={searchQuery} setSearchQuery={(value) => dispatch({ type: 'SET_SEARCH_QUERY', payload: value })} sortOrder={sortOrder} setSortOrder={(value) => dispatch({ type: 'SET_SORT_ORDER', payload: value })} setIsMenuOpen={(value) => dispatch({ type: 'SET_IS_MENU_OPEN', payload: value })} />

      {/* Стили */}
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        
        /* Глобальные стили для плавного перехода темы */
        :global(:root) {
          --transition-duration: 500ms;
          --transition-timing: ease;
          --bg-color: #f3f4f6;
          --text-color: #111827;
          --card-bg: #ffffff;
          --border-color: #e5e7eb;
          --input-bg: #ffffff;
          --input-text: #111827;
          --input-border: #d1d5db;
          --slider-bg-start: #f59e0b;
          --slider-bg-end: #6366f1;
          --slider-thumb: #ffffff;
        }
        
        :global(:root.dark-theme) {
          --bg-color: #111827;
          --text-color: #f3f4f6;
          --card-bg: #1f2937;
          --border-color: #374151;
          --input-bg: #374151;
          --input-text: #f3f4f6;
          --input-border: #4b5563;
          --slider-thumb: #1f2937;
        }
        
        :global(:root.theme-transition) {
          will-change: background-color, color, border-color;
        }
        
        :global(body) {
          background-color: var(--bg-color);
          color: var(--text-color);
          transition: background-color var(--transition-duration) var(--transition-timing),
                      color var(--transition-duration) var(--transition-timing);
        }
        
        /* Стили для настоящего слайдера переключения темы */
        :global(.theme-slider-container) {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        :global(.theme-slider-icon) {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        :global(.theme-slider-icon.sun) {
          color: #f59e0b;
        }
        
        :global(.theme-slider-icon.moon) {
          color: #6366f1;
        }
        
        :global(.theme-slider) {
          -webkit-appearance: none;
          appearance: none;
          width: 60px;
          height: 24px;
          background: linear-gradient(to right, var(--slider-bg-start), var(--slider-bg-end));
          outline: none;
          border-radius: 12px;
          transition: opacity 0.2s;
        }
        
        :global(.theme-slider::-webkit-slider-thumb) {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--slider-thumb);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          transition: transform var(--transition-duration) var(--transition-timing);
        }
        
        :global(.theme-slider::-moz-range-thumb) {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--slider-thumb);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          transition: transform var(--transition-duration) var(--transition-timing);
          border: none;
        }
        
        /* Стили для фокуса (доступность) */
        :global(.theme-slider:focus) {
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }
        
        /* Мобильные стили для слайдера */
        @media (max-width: 768px) {
          :global(.theme-slider) {
            width: 50px;
            height: 20px;
          }
          
          :global(.theme-slider::-webkit-slider-thumb),
          :global(.theme-slider::-moz-range-thumb) {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
    </div>
  );
}

// Компонент списка регионов
const RegionList = memo(({ title, regions, renderStateCard }) => {
  if (regions.length === 0) return null;
  return (
    <div className="mb-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {regions.map((state, index) => renderStateCard(state, index))}
      </div>
    </div>
  );
});

// Компонент мировых часов
const WorldClock = memo(({ cities, currentTime, theme, addCity, removeCity }) => {
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');

  const handleAddCity = () => {
    if (!selectedCity) return;
    const city = popularWorldCities.find(c => c.id === selectedCity);
    if (city) {
      addCity(city);
      setSelectedCity('');
      setIsAddingCity(false);
    }
  };

  return (
    <div className={`mb-8 p-5 rounded-lg shadow-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} transition-colors duration-500`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl sm:text-2xl font-bold flex items-center ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} transition-colors duration-500`}>
          <Globe size={24} className="mr-3" /> Мировые часы
        </h2>
        <button onClick={() => setIsAddingCity(!isAddingCity)} className={`flex items-center ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'} text-white px-3 py-1.5 rounded transition-colors duration-300`}>
          {isAddingCity ? <X size={18} className="mr-1.5" /> : <Plus size={18} className="mr-1.5" />}
          <span>{isAddingCity ? 'Отмена' : 'Добавить город'}</span>
        </button>
      </div>

      {isAddingCity && (
        <div className={`mb-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} transition-colors duration-500`}>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-500`}>Выберите город:</label>
              <select className={`border rounded px-3 py-2 w-full ${theme === 'dark' ? 'bg-gray-600 border-gray-500 text-gray-200' : 'bg-white border-gray-300 text-gray-700'} transition-colors duration-500`} value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                <option value="">-- Выберите город --</option>
                {popularWorldCities.filter(city => !cities.some(c => c.id === city.id)).map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>
            <button onClick={handleAddCity} disabled={!selectedCity} className={`px-4 py-2 rounded ${selectedCity ? (theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600') : 'bg-gray-400 cursor-not-allowed'} text-white transition-colors duration-300`}>
              Добавить
            </button>
          </div>
        </div>
      )}

      {cities.length === 0 ? (
        <p className={`text-center py-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-500`}>
          Нет добавленных городов. Добавьте город, чтобы видеть время в разных точках мира.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cities.map(city => {
            const formattedTime = (() => {
              try {
                const options = { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };
                return new Intl.DateTimeFormat('ru-RU', options).format(new Date(currentTime.toLocaleString('en-US', { timeZone: city.timezone })));
              } catch (error) { return "Ошибка часового пояса"; }
            })();

            return (
              <div key={city.id} className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} transition-colors duration-500`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'} transition-colors duration-500`}>{city.name}</h3>
                    <div className={`text-2xl font-mono mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-500`}>{formattedTime}</div>
                  </div>
                  <button onClick={() => removeCity(city.id)} className={`text-${theme === 'dark' ? 'gray-400' : 'gray-500'} hover:text-red-500 transition-colors duration-300`} aria-label="Удалить город">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default App;
