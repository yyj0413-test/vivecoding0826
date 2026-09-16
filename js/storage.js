import { defaultSchedules, defaultDrives } from "./data.js";
window.Storage={
loadSchedules(){try{return JSON.parse(localStorage.getItem("familySchedules"))||defaultSchedules.map(x=>({...x}))}catch(e){return defaultSchedules.map(x=>({...x}))}},
saveSchedules(x){localStorage.setItem("familySchedules",JSON.stringify(x))},
loadDrives(){try{return JSON.parse(localStorage.getItem("familyDrives"))||defaultDrives.map(x=>({...x}))}catch(e){return defaultDrives.map(x=>({...x}))}},
reset(){localStorage.removeItem("familySchedules");localStorage.removeItem("familyDrives")}};
