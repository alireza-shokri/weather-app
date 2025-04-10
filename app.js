const APIKEY = '9G6P5A47C66PNNK6ADKAGMFYP';
const $ = document;
const body = $.body;
const content = $.querySelector('.content');
const loaderContent = $.querySelector('.parent_loader_content');

const weatherBoxParent = $.querySelector('.weather_box_parent');

const hourlyForecasts = $.querySelector('.hourly_forecast_list');

const weeklyForecast = $.querySelector('.weekly_forecast ');
const weeklyForecastList = $.querySelector('.weekly_forecast_list');
const loaderChangeWeeklyItem = $.querySelector('.loader_change_weekly');

let hour = new Date().getHours();
const bgBody =
  hour < 18 && hour > 6
    ? `backgroundImg/background_light.jpg`
    : `backgroundImg/background_dark.webp`;
body.style.backgroundImage = `url(${bgBody})`;

const searchBar = {
  searchBarElm: $.querySelector('.search_bar'),
  input: $.getElementById('input_search'),
  loaderInput: $.querySelector('.input_loader'),
  btnSearch: $.querySelector('.btn_search'),

  //let
  timeout: null,
  timeSaveInput: null,
};

const timeParent = {
  timeParentElm: $.querySelector('.time_parent'),
  dayName: $.querySelector('.day_name'),
  time: $.querySelector('.time'),
  //let
  intervalTime: null,
};

const currentWeather = {
  cityName: $.querySelector('.city_name'),
  temp: $.querySelector('.temperature .temp'),
  icon: $.querySelector('#icon_current'),
  tempMax: $.querySelector('.tempMax'),
  tempMin: $.querySelector('.tempMin'),
};

const airConditions = {
  humidityValue: $.querySelector('.humidity_value'),
  visibilityValue: $.querySelector('.visibility_value'),
  uvValue: $.querySelector('.uvIndex_value'),
  windSpeedValue: $.querySelector('.windSpeed_value'),
};

const err = $.querySelector('.err');

const map = $.querySelector('.parent_map');
let mapController;

let childrenWeekly;
let resultPublic;

// functions short----------------------------------------------

// function short
const toggleDisplay = function (elm, status) {
  status ? (elm.style.display = 'block') : (elm.style.display = 'none');
};

const toggleDisabled = function (elm, status) {
  elm.disabled = status;
};

const testRegxLatLng = function (value) {
  return /^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/.test(value);
};

// red and green and disabled btn search
const btnSearchActive = function (status) {
  if (status) {
    searchBar.btnSearch.className = 'btn_search btn_crrect';
    toggleDisabled(searchBar.btnSearch, false);
  } else {
    searchBar.btnSearch.className = 'btn_search btn_wrong';
    toggleDisabled(searchBar.btnSearch, true);
  }
};

// hide and show boxs
const funcShwBoxs = function (status) {
  if (status) {
    timeParent.timeParentElm.style.display = 'flex';
    weatherBoxParent.style.display = 'block';
    weeklyForecast.style.display = 'block';
    searchBar.searchBarElm.classList.remove('search_bar_long');
  } else {
    timeParent.timeParentElm.style.display = 'none';
    weatherBoxParent.style.display = 'none';
    weeklyForecast.style.display = 'none';
    searchBar.searchBarElm.classList.add('search_bar_long');
  }
};

// url generator
const getWeatherURL = function (value, isLatLng) {
  const location = isLatLng ? value.split(',').map(Number).join(',') : value;
  return `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}?unitGroup=metric&key=${APIKEY}&contentType=json`;
};

const getCityNameURL = function (value) {
  const [lat, lng] = value.split(',').map(Number);
  return `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
};

// faild func
const messageErrElm = document.querySelector('.messageErr');

const errFunc = function (message) {
  messageErrElm.textContent = message;
  toggleDisplay(err, true);
};

// fetch function
const fetchData = async function (url, loader, errText) {
  try {
    toggleDisplay(loader, true);
    const res = await fetch(url);
    if (!res.ok) throw new Error(errText);
    const data = await res.json();
    return data;
  } catch (err) {
    errFunc(err.message);
    return null;
  } finally {
    toggleDisplay(loader, false);
  }
};

// for  sound fetchData ---------------------------
const fetchForWeather = url =>
  fetchData(url, loaderContent, 'faild to fetch 🩻');

// help to find user location
const fetchForMapMove = async url => {
  const result = await fetchData(
    url,
    searchBar.loaderInput,
    'faild to find city 🗺️'
  );

  const isSuccess = !!result;
  btnSearchActive(isSuccess);

  if (isSuccess) resultPublic = result;
  return isSuccess ? result : false;
};

const tryFindInputSearch = async function () {
  const time = Date.now();
  searchBar.timeSaveInput = time;

  searchBar.timeout = setTimeout(async () => {
    if (
      time === searchBar.timeSaveInput &&
      searchBar.input.value.trim().length > 3
    ) {
      const { latitude, longitude } = await fetchForMapMove(
        getWeatherURL(
          searchBar.input.value,
          testRegxLatLng(searchBar.input.value)
        )
      );
      if (!latitude) return;
      mapController.selectLocation([longitude, latitude]);
    }
  }, 1600);
};

// currentConditions

const getLocalTime = timezone => {
  const now = new Date();
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now);
};

const setIconWeather = function (icon, kindVrodi) {
  let kind;
  kindVrodi == 'dynamic' ? (kind = 'icons_dynamic/') : (kind = 'icons_static/');
  switch (icon) {
    case 'clear-night':
      return `${kind}night.svg`;
    case 'clear-day':
      return `${kind}sun.svg`;
    case 'cloudy':
      return `${kind}cloudy.svg`;
    case 'partly-cloudy-night':
      return `${kind}cloudy-night.svg`;
    case 'partly-cloudy-day':
      return `${kind}cloudy-day.svg`;
    case 'rain':
      return `${kind}rainy.svg`;
    case 'snow':
      return `${kind}snow.svg`;
    case 'fog':
      return `icons_static/fog.png`;
    case 'wind':
      return `icons_static/windy.png`;
  }
};

const updateTime = function (timezone) {
  timeParent.intervalTime = setInterval(() => {
    const timeLocal = getLocalTime(timezone).split(' ');
    timeParent.time.textContent = timeLocal[1];
  }, 1000);
};

const jeneratorBoxHour = function (selectDay, index) {
  const time = selectDay.hours[index].datetime.slice(0, 5); //"00:00"
  const AMorPM = time.slice(0, 2) - 12 >= 0 ? 'PM' : 'AM';

  const temp = selectDay.hours[index].temp;
  const icon = setIconWeather(selectDay.hours[index].icon, 'static');

  hourlyForecasts.insertAdjacentHTML(
    'beforeend',
    `<li class="hourly_forecast_item">
            <span class="hourly_forecast_time">${time} ${AMorPM} </span>
            <img src=${icon} alt="icon" class="hourly_forecast_icon">
            <span class="hourly_forecast_temp">${temp}° </span>
          </li>`
  );
};

const placementBoxHour = function (result, counterDay, hour) {
  hourlyForecasts.innerHTML = '';
  let countrItem = 0;
  let selectDay = result.days[counterDay];
  let index;

  for (index = hour + 1; index < 24; index++) {
    countrItem++;
    jeneratorBoxHour(selectDay, index);
  }

  selectDay = result.days[++counterDay]; // nex day

  for (index = 0; countrItem < 24; index++) {
    countrItem++;
    jeneratorBoxHour(selectDay, index);
  }
};

const placementAirConditions = function (currentWeather) {
  airConditions.humidityValue.textContent = `${currentWeather.humidity} %`;
  airConditions.visibilityValue.textContent =
    currentWeather.visibility < 1
      ? `${currentWeather.visibility * 1000} m`
      : `${currentWeather.visibility} km`;
  airConditions.uvValue.textContent = currentWeather.uvindex;
  airConditions.windSpeedValue.textContent = `${currentWeather.windspeed} km/h`;
};

const placementCurrentWeather = function (
  cityName,
  temp,
  tempmax,
  tempmin,
  icon
) {
  currentWeather.cityName.textContent = cityName;
  currentWeather.temp.textContent = temp + '°';
  currentWeather.tempMax.textContent = tempmax + '°';
  currentWeather.tempMin.textContent = tempmin + '°';
  currentWeather.icon.src = setIconWeather(icon, 'dynamic');
};

// getNameDay

function getNameDay(dateString) {
  const date = new Date(dateString);
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[date.getDay()];
}

const loaderWeatherBoxParent = () => {
  return new Promise(resolve => {
    toggleDisplay(loaderChangeWeeklyItem, true);
    weatherBoxParent.style.opacity = '0.5';

    setTimeout(() => {
      toggleDisplay(loaderChangeWeeklyItem, false);
      weatherBoxParent.style.opacity = '1';
      resolve();
    }, 1000);
  });
};

let indexItemWeekly;
const selectWeeklyItem = async index => {
  if (index === indexItemWeekly) return; //duble clickd ❌
  indexItemWeekly = index;

  // class
  childrenWeekly.forEach((item, i) =>
    item.classList.toggle('disabled', i === index)
  );

  // wait for loader
  await loaderWeatherBoxParent();

  const { days, timezone, cityName, currentConditions } = resultPublic;
  const selectedDay = days[index];
  const time = getLocalTime(timezone);
  const currentHour =
    index === 0 ? Number(time.split(' ')[1].split(':')[0]) : -1;

  // update info weather
  placementBoxHour(resultPublic, index, currentHour);
  placementAirConditions(selectedDay);
  placementCurrentWeather(
    cityName,
    index === 0 ? currentConditions.temp : selectedDay.temp,
    selectedDay.tempmax,
    selectedDay.tempmin,
    index === 0 ? currentConditions.icon : selectedDay.icon
  );
};

const placementWeeklyForecast = function (result) {
  const selectDays = result.days.slice(0, 7);
  weeklyForecastList.innerHTML = '';

  const weeklyItemsHTML = selectDays
    .map((item, i) => {
      const desc = item.conditions.trim().split(',');
      const lastDesc = desc[desc.length - 1];
      const dayName = i === 0 ? 'Today' : getNameDay(item.datetime);
      const iconSrc = setIconWeather(item.icon, 'static');
      const maxTemp = Math.round(item.tempmax);
      const minTemp = Math.round(item.tempmin);

      return `<li class="weekly_forecast_item" onclick="selectWeeklyItem(${i})" disabled>
              <span class="day_name">${dayName}</span>
              <div class="parent_icon_title">
                <img src="${iconSrc}" alt="icon" class="weekly_forecast_icon">
                <span class="weekly_forecast_title">${lastDesc}</span>
              </div>
              <span class="weekly_parent_temps">
                <span class="weekly_tempMax">${maxTemp}°</span>
                <span class="weekly_tempMin"> / ${minTemp}°</span>
              </span>
            </li>`;
    })
    .join('');

  weeklyForecastList.innerHTML = weeklyItemsHTML;

  childrenWeekly = Array.from(
    document.querySelectorAll('.weekly_forecast_item')
  );
  childrenWeekly[0].classList.add('disabled');
  indexItemWeekly = 0;
};

const placement = function (result) {
  const currentWeather = result.currentConditions;
  const timeLocal = getLocalTime(result.timezone).split(' ');
  timeParent.dayName.textContent = timeLocal[0];

  updateTime(result.timezone);

  placementCurrentWeather(
    result.cityName,
    currentWeather.temp,
    result.days[0].tempmax,
    result.days[0].tempmin,
    currentWeather.icon
  );

  placementBoxHour(result, 0, Number(timeLocal[1].split(':')[0]));
  placementAirConditions(result.currentConditions);
  placementWeeklyForecast(result);
};

const getCityName = async function (latlng) {
  const infoCityes = await fetchForWeather(getCityNameURL(latlng));

  if (!infoCityes.address) return (cityName = infoCityes.error);

  cityName =
    infoCityes.address.city ||
    infoCityes.address.town ||
    infoCityes.address.village ||
    infoCityes.address.hamlet;

  return cityName;
};

// clickd btn Search

const handleBtnSearch = async function () {
  clearTimeout(searchBar.timeout);
  toggleDisplay(map, false);

  let cityName;

  if (resultPublic) {
    const { address } = resultPublic;
    cityName = testRegxLatLng(address) ? await getCityName(address) : address;
    resultPublic = { ...resultPublic, cityName };
  } else {
    const inputValue = searchBar.input.value.trim();
    const url = getWeatherURL(inputValue, true);
    const response = await fetchForWeather(url);
    if (!response?.currentConditions) return;
    cityName = await getCityName(response.address);
    resultPublic = { ...response, cityName };
  }

  placement(resultPublic);
  funcShwBoxs(true);

  searchBar.input.value = '';

  btnSearchActive(false);
};

// press key  input
const handleKey = function (e) {
  const allowedControlKeys = ['Enter','Backspace', 'Delete', 'ArrowLeft', 'ArrowRight'];
  let char = e.key;
  if (!/^[a-zA-Z0-9.,]$/.test(char) && !allowedControlKeys.includes(char)) {
    e.preventDefault();
    return;
  }
  if (char === 'ArrowLeft' || char === 'ArrowRight') return;

  btnSearchActive(false);
  if (searchBar.input.value.trim().length > 3) tryFindInputSearch();

  toggleDisplay(err, false);
};

// for show map
let isFirstLoadMap = false;
const clickdInput = function () {
  clearInterval(timeParent.intervalTime);
  funcShwBoxs(false);
  toggleDisplay(map, true);
  isFirstLoadMap || ((mapController = initialMap()), (isFirstLoadMap = true));
};

const selectCityINmap = function (arrayAddress) {
  searchBar.input.value = `${arrayAddress[1]},${arrayAddress[0]} `;
  toggleDisplay(err, false);
  btnSearchActive(true);
  resultPublic = null;
};

searchBar.input.addEventListener('click', clickdInput);
searchBar.input.addEventListener('keyup', handleKey);
searchBar.input.addEventListener('keydown', handleKey);
searchBar.input.addEventListener('keypress',handleKey)
searchBar.btnSearch.addEventListener('click', handleBtnSearch);

// map
function initialMap() {
  let zoomInMap;
  const marker = document.createElement('img');
  marker.src = 'icons_static/marker.svg';
  marker.style.width = '1.8rem';
  marker.style.height = '1.8rem';
  marker.style.transform = 'translate(-50%, -100%)';
  marker.style.position = 'absolute';

  const view = new ol.View({
    projection: 'EPSG:4326',
    center: [46.29291789644997, 38.068463912105045],
    zoom: 10,
  });

  const overlay = new ol.Overlay({
    element: marker,
    positioning: 'bottom-center',
    stopEvent: false,
  });

  const map = new ol.Map({
    target: 'map',
    controls: ol.control.defaults({
      attribution: false,
      zoom: false,
      rotate: false,
    }),
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM(),
      }),
    ],
    overlays: [overlay],
    view: view,
  });

  const zoomslider = new ol.control.ZoomSlider();
  map.addControl(zoomslider);

  map.on('singleclick', function (event) {
    const arrayAddress = event.coordinate;
    overlay.setPosition(arrayAddress);
    clickdMap(arrayAddress);
    selectCityINmap(arrayAddress);
  });

  map.on('moveend', function () {
    zoomInMap = view.getZoom();
  });

  function clickdMap(arrayCoordinate) {
    view.animate({
      center: arrayCoordinate,
      zoom: zoomInMap < 17 ? zoomInMap + 1.5 : zoomInMap,
    });
  }

  function selectLocation(address) {
    view.animate({
      center: address,
      zoom: 10,
      duration: 1500,
    });
    overlay.setPosition(address);
  }

  return {
    selectLocation,
  };
}
