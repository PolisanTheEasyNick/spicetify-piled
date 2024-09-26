//app.tsx
import { getSettings } from "./settings";

function hexToRgb(hex: string): { red: number; green: number; blue: number } | null {
  if (hex.startsWith('#')) {
      hex = hex.slice(1);
  }
  if (hex.length !== 6) {
      console.error("Invalid hex color format. It should be a 6-character string.");
      return null;
  }

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return { red: r, green: g, blue: b };
}

async function sendColorRequest(hex: string, duration: number) {
  const color = hexToRgb(hex) || hexToRgb(getSettings().defaultColor) || { red: 128, green: 128, blue: 128 };
  const url = `https://${getSettings().piledIP}/?R=${color.red}&G=${color.green}&B=${color.blue}&DURATION=${duration}`;
  try {
      console.log("Sending GET request to: ", url);
      fetch(url)
          .then(response => {
              // console.log("Response: ", response);
              // if (response.ok) {
              //     console.log(`Sent color request: ${url}`);
              // } else {
              //     console.error('Error sending color request:', response.statusText);
              // }
          })
          .catch(error => {
              //console.error('Network error:', error);
          });
  } catch (error) {
      console.error('Network error:', error);
  }
}


//thanks, ColorAmbience. https://github.com/Theblockbuster1/spicetify-extensions/blob/main/CoverAmbience/CoverAmbience.js
async function fetchExtractedColors() {
  const res = await fetch(`https://api-partner.spotify.com/pathfinder/v1/query?operationName=fetchExtractedColors&variables=${encodeURIComponent(JSON.stringify({ uris: [Spicetify.Player.data.item.metadata.image_url] }))}&extensions=${encodeURIComponent(JSON.stringify({"persistedQuery":{"version":1,"sha256Hash":"d7696dd106f3c84a1f3ca37225a1de292e66a2d5aced37a66632585eeb3bbbfa"}}))}`, {
      method: "GET",
      headers: {
          authorization: `Bearer ${(await Spicetify.CosmosAsync.get('sp://oauth/v2/token')).accessToken}`
      }
  })
  .then(res => res.json());
  if (!res.data.extractedColors) return getSettings().defaultColor;
  return res.data.extractedColors[0].colorRaw.hex;
}

async function songChanged() {
  console.log("New Song: ", Spicetify.Player.data)
  if(Spicetify.Player.data.item.isLocal) {
    sendColorRequest(getSettings().defaultColor, 3);
  }
  let rgb = (await fetchExtractedColors() || getSettings().defaultColor);
  console.log("Song changed, new rgb: ", rgb);
  sendColorRequest(rgb, 3);
}

async function onPlayPause() {
  console.log("On play pause, is paused: ", Spicetify.Player.data.isPaused);
  if(Spicetify.Player.data.isPaused) {
    sendColorRequest(getSettings().defaultColor, 3);
  } else {
    let rgb = (await fetchExtractedColors() || getSettings().defaultColor);
    sendColorRequest(rgb, 3);
  }
}

async function main() {
  Spicetify.Player.addEventListener('songchange', songChanged);
  Spicetify.Player.addEventListener('onplaypause', onPlayPause);

  if(Spicetify.Player.data) {
    songChanged();  
  } else {
    const observer = new MutationObserver((_, observer) => {
      if (Spicetify.Player.data) {
        observer.disconnect();
        songChanged();
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

export default main;
