import { initialMap } from "./map/map.js";
const APIKEY = "9G6P5A47C66PNNK6ADKAGMFYP";
const $ = document;
const body = $.body;
const content = $.querySelector(".content");
const loaderContent = $.querySelector(".parent_loader_content");

const weatherBoxParent = $.querySelector(".weather_box_parent");

const hourlyForecasts = $.querySelector(".hourly_forecast_list");

const weeklyForecast = $.querySelector(".weekly_forecast ");
const weeklyForecastList = $.querySelector(".weekly_forecast_list");
const loaderChangeWeeklyItem = $.querySelector(".loader_change_weekly");

let hour = new Date().getHours();
const bgBody =
  hour < 18 && hour > 6
    ? `backgroundImg/background_light.jpg`
    : `backgroundImg/background_dark.webp`;
body.style.backgroundImage = `url(${bgBody})`;

const searchBar = {
  searchBarElm: $.querySelector(".search_bar"),
  inputElm: $.getElementById("input_search"),
  loaderInput: $.querySelector(".input_loader"),
  btnSearch: $.querySelector(".btn_search"),

  //let
  timeout: null,
  timeSaveInput: null,
};

const timeParent = {
  timeParentElm: $.querySelector(".time_parent"),
  dayName: $.querySelector(".day_name"),
  time: $.querySelector(".time"),
  //let
  intervalTime: null,
};

const currentWeather = {
  cityName: $.querySelector(".city_name"),
  temp: $.querySelector(".temperature .temp"),
  icon: $.querySelector("#icon_current"),
  tempMax: $.querySelector(".tempMax"),
  tempMin: $.querySelector(".tempMin"),
};

const airConditions = {
  humidityValue: $.querySelector(".humidity_value"),
  visibilityValue: $.querySelector(".visibility_value"),
  uvValue: $.querySelector(".uvIndex_value"),
  windSpeedValue: $.querySelector(".windSpeed_value"),
};

const errMessage = document.querySelector(".messageErr");
const err = $.querySelector(".err");

const map = $.querySelector(".parent_map");
let mapController;

let childrenWeekly;
let resultPublic;

// functions short----------------------------------------------

// function short
const toggleDisplay = function (elm, status) {
  status ? (elm.style.display = "block") : (elm.style.display = "none");
};

const toggleDisabled = function (elm, status) {
  elm.disabled = status;
};

const testRegxLatLng = function (value) {
  return /^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/.test(value);
};

const testRejexText = function (value) {
  return /^[A-Za-z]+$/.test(value);
};
// red and green and disabled btn search
const btnSearchActive = function (status) {
  if (status) {
    searchBar.btnSearch.className = "btn_search btn_crrect";
    toggleDisabled(searchBar.btnSearch, false);
  } else {
    searchBar.btnSearch.className = "btn_search btn_wrong";
    toggleDisabled(searchBar.btnSearch, true);
  }
};

// hide and show boxs
const funcShwBoxs = function (status) {
  timeParent.timeParentElm.style.display = status ? "flex" : "none";
  weatherBoxParent.style.display = status ? "block" : "none";
  weeklyForecast.style.display = status ? "block" : "none";
  searchBar.searchBarElm.classList.toggle("search_bar_long", !status);
};

// url generator
const getWeatherURL = function (value) {
  return `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${value}?unitGroup=metric&key=${APIKEY}&contentType=json`;
};

const getCityNameURL = function (value) {
  const [lat, lng] = value.split(",").map(Number);
  return `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
};

// faild func

const showError = function (message, duration = 5000) {
  errMessage.textContent = message;
  toggleDisplay(err, true);
  setTimeout(() => toggleDisplay(err, false), duration);
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
    showError(err.message);
    return null;
  } finally {
    toggleDisplay(loader, false);
  }
};

// for  sound fetchData ---------------------------
const fetchForWeather = (url) =>
  fetchData(url, loaderContent, "faild to fetch 🩻");

// help to find user location
const fetchForMapMove = async (url) =>
  fetchData(url, searchBar.loaderInput, "faild to find city 🗺️");

// try find over map

const getLocalTime = (timezone) => {
  const now = new Date();
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now);
};

const setIconWeather = function (icon, kindVrodi) {
  let kind;
  kindVrodi === "dynamic"
    ? (kind = "icons_dynamic/")
    : (kind = "icons_static/");
  switch (icon) {
    case "clear-night":
      return `${kind}night.svg`;
    case "clear-day":
      return `${kind}sun.svg`;
    case "cloudy":
      return `${kind}cloudy.svg`;
    case "partly-cloudy-night":
      return `${kind}cloudy-night.svg`;
    case "partly-cloudy-day":
      return `${kind}cloudy-day.svg`;
    case "rain":
      return `${kind}rainy.svg`;
    case "snow":
      return `${kind}snow.svg`;
    case "fog":
      return `icons_static/fog.png`;
    case "wind":
      return `icons_static/windy.png`;
    default:
      return ``;
  }
};

const updateTime = function (timezone) {
  timeParent.intervalTime = setInterval(() => {
    const timeLocal = getLocalTime(timezone).split(" ");
    timeParent.time.textContent = timeLocal[1];
  }, 1000);
};

const jeneratorBoxHour = function (selectDay, index) {
  const time = selectDay.hours[index].datetime.slice(0, 5); //"00:00"
  const AMorPM = time.slice(0, 2) - 12 >= 0 ? "PM" : "AM";

  const temp = selectDay.hours[index].temp;
  const icon = setIconWeather(selectDay.hours[index].icon, "static");

  hourlyForecasts.insertAdjacentHTML(
    "beforeend",
    `<li class="hourly_forecast_item">
            <span class="hourly_forecast_time">${time} ${AMorPM} </span>
            <img src=${icon} alt="icon" class="hourly_forecast_icon">
            <span class="hourly_forecast_temp">${temp}° </span>
          </li>`
  );
};

const placementBoxHour = function (result, counterDay, hour) {
  hourlyForecasts.innerHTML = "";
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
  currentWeather.temp.textContent = temp + "°";
  currentWeather.tempMax.textContent = tempmax + "°";
  currentWeather.tempMin.textContent = tempmin + "°";
  currentWeather.icon.src = setIconWeather(icon, "dynamic");
};

// getNameDay

function getNameDay(dateString) {
  const date = new Date(dateString);
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[date.getDay()];
}

const loaderWeatherBoxParent = () => {
  return new Promise((resolve) => {
    toggleDisplay(loaderChangeWeeklyItem, true);
    weatherBoxParent.style.opacity = "0.5";

    setTimeout(() => {
      toggleDisplay(loaderChangeWeeklyItem, false);
      weatherBoxParent.style.opacity = "1";
      resolve();
    }, 1000);
  });
};

let indexItemWeekly;
const selectWeeklyItem = async (index) => {
  // screenTop top
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  if (index === indexItemWeekly) return; //duble clickd ❌
  indexItemWeekly = index;

  // class
  childrenWeekly.forEach((item, i) =>
    item.classList.toggle("disabled", i === index)
  );

  // wait for loader
  await loaderWeatherBoxParent();

  const { days, timezone, cityName, currentConditions } = resultPublic;
  const selectedDay = days[index];
  const time = getLocalTime(timezone);
  const currentHour =
    index === 0 ? Number(time.split(" ")[1].split(":")[0]) : -1;

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
  weeklyForecastList.innerHTML = "";

  const weeklyItemsHTML = selectDays
    .map((item, i) => {
      const desc = item.conditions.trim().split(",");
      const lastDesc = desc[desc.length - 1];
      const dayName = i === 0 ? "Today" : getNameDay(item.datetime);
      const iconSrc = setIconWeather(item.icon, "static");
      const maxTemp = Math.round(item.tempmax);
      const minTemp = Math.round(item.tempmin);

      return `<li class="weekly_forecast_item">
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
    .join("");

  weeklyForecastList.innerHTML = weeklyItemsHTML;

  childrenWeekly = Array.from(
    document.querySelectorAll(".weekly_forecast_item")
  );

  // add event click
  childrenWeekly.map((item, i) =>
    item.addEventListener("click", () => selectWeeklyItem(i))
  );

  childrenWeekly[0].classList.add("disabled");
  indexItemWeekly = 0;
};

const placement = function (result) {
  const currentWeather = result.currentConditions;
  const timeLocal = getLocalTime(result.timezone).split(" ");
  timeParent.dayName.textContent = timeLocal[0];

  updateTime(result.timezone);

  placementCurrentWeather(
    result.cityName,
    currentWeather.temp,
    result.days[0].tempmax,
    result.days[0].tempmin,
    currentWeather.icon
  );

  placementBoxHour(result, 0, Number(timeLocal[1].split(":")[0]));
  placementAirConditions(result.currentConditions);
  placementWeeklyForecast(result);
};

const getCityName = async function (latlng) {
  let cityName;
  const infoCityes = await fetchForWeather(getCityNameURL(latlng));
  if (!infoCityes?.address) return (cityName = "unknown 📛");
  cityName =
    infoCityes.address.hamlet ||
    infoCityes.address.village ||
    infoCityes.address.town ||
    infoCityes.address.city ||
    infoCityes.address.country ||
    "unknown 📛";
  return cityName;
};
const localStorageCoordinates = function (access, array = null) {
  if (access === "set")
    localStorage.setItem("coordinates", JSON.stringify(array));
  else if (access === "get") return localStorage.getItem("coordinates");
};
// clickd btn Search
const handleBtnSearch = async function () {
  const inputValue = searchBar.inputElm.value.trim();

  clearTimeout(searchBar.timeout);
  toggleDisplay(map, false);

  // tahran
  if (resultPublic && testRejexText(inputValue)) {
    resultPublic = { ...resultPublic, cityName: resultPublic.address };
  }
  // 32.67287265625,51.71507799758911
  else {
    const url = getWeatherURL(inputValue);
    const response = await fetchForWeather(url);
    if (!response) return;
    const city = await getCityName(inputValue);

    resultPublic = { ...response, cityName: city };
  }

  placement(resultPublic);
  funcShwBoxs(true);
  searchBar.inputElm.value = "";
  btnSearchActive(false);
  localStorageCoordinates("set", [
    resultPublic.longitude,
    resultPublic.latitude,
  ]);
};

// try find for heelp
const tryFindInputSearch = async function (value) {
  const inputValue = value.trim();
  const time = Date.now();
  searchBar.timeSaveInput = time;
  if (inputValue.length < 3) return;

  searchBar.timeout = setTimeout(async () => {
    if (time !== searchBar.timeSaveInput || inputValue.trim().length < 3)
      return;
    searchBar.inputElm.blur();

    if (testRegxLatLng(inputValue)) {
      const arrLngLat = inputValue.split(",");
      mapController.selectLocation([arrLngLat[1], arrLngLat[0]]);
      btnSearchActive(true);
    } else if (testRejexText(inputValue)) {
      const data = await fetchForMapMove(getWeatherURL(inputValue));
      if (!data) return;
      resultPublic = data;
      mapController.selectLocation([data.longitude, data.latitude]);
      btnSearchActive(true);
    } else showError("Wrong coordinates ❌");
  }, 1600);
};

// input evetns
const allowedControlKeys = [
  "Enter",
  "Backspace",
  "Delete",
  "ArrowLeft",
  "ArrowRight",
  " ",
];
// مدیریت کیبورد
const handleKeyDown = function (e) {
  const char = e.key;

  if (!/[a-zA-Z0-9.,-]/.test(char) && !allowedControlKeys.includes(char)) {
    e.preventDefault();
    return;
  }
};

const handlePaste = function (e) {
  e.preventDefault();
  const pastedText = e.clipboardData.getData("text");
  const cleanedText = pastedText.replace(/[^a-zA-Z0-9.,-]/g, "");

  const input = e.target;
  const start = input.selectionStart;
  const end = input.selectionEnd;

  input.setRangeText(cleanedText, start, end, "end");
  input.dispatchEvent(new Event("input", { bubbles: true }));
  searchBar.inputElm.blur();
};

// manage input
const changeInput = function () {
  btnSearchActive(false);

  tryFindInputSearch(this.value);
};

// for show map
let isFirstLoadMap = false;
const clickdInput = function () {
  clearInterval(timeParent.intervalTime);
  funcShwBoxs(false);
  toggleDisplay(map, true);
  if (!isFirstLoadMap) {
    mapController = initialMap(selectCityINmap);
    if (localStorageCoordinates("get"))
      mapController.selectLocation(JSON.parse(localStorageCoordinates("get")));
    isFirstLoadMap = true;
  }
};

const selectCityINmap = function (arrayAddress) {
  searchBar.inputElm.value = `${arrayAddress[1].toFixed(
    5
  )},${arrayAddress[0].toFixed(5)} `;
  btnSearchActive(true);
  resultPublic = null;
};

searchBar.inputElm.addEventListener("click", clickdInput);
searchBar.inputElm.addEventListener("keydown", handleKeyDown);
searchBar.inputElm.addEventListener("paste", handlePaste);
searchBar.inputElm.addEventListener("input", changeInput);
searchBar.btnSearch.addEventListener("click", handleBtnSearch);
