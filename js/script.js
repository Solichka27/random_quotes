
let socket;
let previousPrice = null;
let pingInterval;

// RANDOM QUOTE GENERATOR

document.getElementById("generator").addEventListener("click", async () => {
    const status = document.getElementById("status");
    const post = document.getElementById("post");

    status.textContent = "Loading...";

    try {
        const response = await fetch("https://dummyjson.com/quotes/random");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        post.value = `${data.quote} — ${data.author}`;

        status.textContent = "Success";

    } catch (error) {
        status.textContent = "Error fetching quote";
        console.error(error);
    }
});


// WEBSOCKET BTC/USDT

function connect() {

    // Close previous connection
    if (socket) {
        socket.close();
    }

    clearInterval(pingInterval);

    const currencyStatus = document.getElementById("currency_status");

    currencyStatus.textContent = "🟡 Connecting...";
    currencyStatus.className = "connecting";

    socket = new WebSocket("wss://api.whitebit.com/ws");

    socket.onopen = () => {
        console.log("Connected to WhiteBIT");

        currencyStatus.textContent = "🟢 Connected";
        currencyStatus.className = "connected";

        // Subscribe to BTC/USDT
        const message = {
            id: 1,
            method: "bookTicker_subscribe",
            params: ["BTC_USDT"]
        };

        socket.send(JSON.stringify(message));

        // Keep connection alive
        pingInterval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    id: 0,
                    method: "ping",
                    params: []
                }));
            }
        }, 50000);
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.method === "bookTicker_update") {

            const ticker = data.params?.[0];

            if (!ticker) return;

            const price = Number(ticker[4]);

            document.getElementById("price").textContent =
                `$${price.toLocaleString("en-US")}`;

            const trend = document.getElementById("trend");

            if (previousPrice !== null) {

                if (price > previousPrice) {
                    trend.textContent = "▲";
                    trend.className = "positive";

                } else if (price < previousPrice) {
                    trend.textContent = "▼";
                    trend.className = "negative";

                } else {
                    trend.textContent = "-";
                }
            }

            previousPrice = price;
        }
    };

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
        currencyStatus.textContent = "🔴 Disconnected";
        currencyStatus.className = "disconnected";

        clearInterval(pingInterval);
        console.log("WebSocket disconnected");
    };
}


// Start connection
connect();
