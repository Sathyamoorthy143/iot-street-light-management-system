const ssid = "YOUR_WIFI_SSID";
const password = "YOUR_WIFI_PASSWORD";
const mqtt_server = "YOUR_MQTT_BROKER_IP";
const mqtt_username = "YOUR_MQTT_USERNAME";
const mqtt_password = "YOUR_MQTT_PASSWORD";
const mqtt_clientId = "YOUR_MQTT_CLIENT_ID";
const phoneNumber = "RECIPIENT_PHONE_NUMBER";
const sensor_fault_msg = "Sensor fault detected!";
const BME_SCK = 18;
const BME_MISO = 19;
const BME_MOSI = 23;
const BME_CS = 5;

const wifiClient = new WiFiClient();
const modem = new TinyGsmClient(wifiClient);
const client = new PubSubClient(mqtt_server, 1883, wifiClient);
const bme = new Adafruit_BME280();

function setup_wifi() {
    delay(10);
    console.log();
    console.log("Connecting to " + ssid);
    WiFi.begin(ssid, password);
    while (WiFi.status() !== WL_CONNECTED) {
        delay(500);
        console.log(".");
    }
    console.log("");
    console.log("WiFi connected");
    console.log("IP address: ");
    console.log(WiFi.localIP());
}

function reconnect() {
    while (!client.connected()) {
        console.log("Attempting MQTT connection...");
        if (client.connect(mqtt_clientId, mqtt_username, mqtt_password)) {
            console.log("connected");
        } else {
            console.log("failed, rc=" + client.state());
            console.log(" try again in 5 seconds");
            delay(5000);
        }
    }
}

function setup() {
    Serial.begin(115200);
    if (!bme.begin()) {
        console.log("Could not find BME280 sensor!");
        while (1);
    }
    setup_wifi();
    client.setServer(mqtt_server, 1883);
}

function loop() {
    if (!client.connected()) {
        reconnect();
    }
    client.loop();
    const temperature = bme.readTemperature();
    const humidity = bme.readHumidity();
    const pressure = bme.readPressure() / 100.0;
    if (isNaN(temperature) || isNaN(humidity) || isNaN(pressure)) {
        console.log(sensor_fault_msg);
        sendSMS(sensor_fault_msg);
        delay(5000);
        return;
    }

    const msg = `{"temperature": ${temperature.toFixed(2)}, "humidity": ${humidity.toFixed(2)}, "pressure": ${pressure.toFixed(2)}}`;
    client.publish("sensor_data", msg);
    delay(60000);
}

function sendSMS(message) {
    modem.sendSMS(phoneNumber, message);
}

