// ==========================================
// SMART SURVEILLANCE PUSH NOTIFICATION
// SERVICE WORKER
// ==========================================

self.addEventListener("push", (event) => {

    console.log("Push notification received.");

    let notificationData = {
        title: "Smart Surveillance",
        body: "New security notification.",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        data: {
            url: "/notifications"
        }
    };

    // ------------------------------------------
    // READ PUSH DATA
    // ------------------------------------------

    if (event.data) {

        try {

            const data = event.data.json();

            notificationData = {
                ...notificationData,
                ...data
            };

        } catch (error) {

            console.error(
                "Unable to read push notification data:",
                error
            );

            notificationData.body =
                event.data.text();
        }
    }

    // ------------------------------------------
    // SHOW NOTIFICATION
    // ------------------------------------------

    event.waitUntil(

        self.registration.showNotification(

            notificationData.title,

            {
                body: notificationData.body,

                icon: notificationData.icon,

                badge: notificationData.badge,

                data: notificationData.data,

                requireInteraction: false,

                vibrate: [
                    200,
                    100,
                    200
                ]
            }

        )

    );

});


// ==========================================
// NOTIFICATION CLICK
// ==========================================

self.addEventListener(
    "notificationclick",
    (event) => {

        event.notification.close();

        const notificationData =
            event.notification.data || {};

        const targetUrl =
            notificationData.url ||
            "/notifications";

        event.waitUntil(

            clients.matchAll({

                type: "window",

                includeUncontrolled: true

            }).then((clientList) => {

                // ----------------------------------
                // IF WEBSITE IS ALREADY OPEN
                // ----------------------------------

                for (
                    const client of clientList
                ) {

                    if (
                        "focus" in client
                    ) {

                        client.navigate(
                            targetUrl
                        );

                        return client.focus();
                    }
                }

                // ----------------------------------
                // OTHERWISE OPEN WEBSITE
                // ----------------------------------

                if (
                    clients.openWindow
                ) {

                    return clients.openWindow(
                        targetUrl
                    );
                }

            })

        );

    }
);


// ==========================================
// SERVICE WORKER INSTALL
// ==========================================

self.addEventListener(
    "install",
    () => {

        console.log(
            "Smart Surveillance service worker installed."
        );

        self.skipWaiting();

    }
);


// ==========================================
// SERVICE WORKER ACTIVATE
// ==========================================

self.addEventListener(
    "activate",
    (event) => {

        console.log(
            "Smart Surveillance service worker activated."
        );

        event.waitUntil(
            self.clients.claim()
        );

    }
);