interface AppSettings {
    piledIP: string;
    defaultColor: string;
}

const settings: AppSettings = {
    piledIP: "led.polisan.dev",
    defaultColor: "#d000ff"
}

export function getSettings(): AppSettings {
    return settings;
}
