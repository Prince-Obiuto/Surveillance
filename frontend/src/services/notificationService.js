// =========================================================
// NOTIFICATION SERVICE
// =========================================================

// Register the Service Worker
export async function registerNotificationService() {
    if (!("serviceWorker" in navigator)) {
        console.log(
            "Service Worker is not supported by this browser."
        );

        return null;
    }

    if (!("PushManager" in window)) {
        console.log(
            "Push notifications are not supported by this browser."
        );

        return null;
    }

    try {
        const registration =
            await navigator.serviceWorker.register(
                "/sw.js"
            );

        console.log(
            "Notification Service Worker registered successfully."
        );

        return registration;

    } catch (error) {

        console.error(
            "Service Worker registration failed:",
            error
        );

        return null;
    }
}


// =========================================================
// REQUEST NOTIFICATION PERMISSION
// =========================================================

export async function requestNotificationPermission() {

    if (!("Notification" in window)) {

        console.log(
            "Browser notifications are not supported."
        );

        return "unsupported";
    }


    // Already allowed
    if (
        Notification.permission ===
        "granted"
    ) {

        return "granted";
    }


    // Already denied
    if (
        Notification.permission ===
        "denied"
    ) {

        return "denied";
    }


    try {

        const permission =
            await Notification.requestPermission();

        console.log(
            "Notification permission:",
            permission
        );

        return permission;

    } catch (error) {

        console.error(
            "Unable to request notification permission:",
            error
        );

        return "denied";
    }
}


// =========================================================
// CREATE PUSH SUBSCRIPTION
// =========================================================

export async function createPushSubscription() {

    try {

        const registration =
            await registerNotificationService();


        if (!registration) {

            return null;
        }


        // Check if subscription already exists

        let subscription =
            await registration.pushManager.getSubscription();


        if (subscription) {

            console.log(
                "Existing push subscription found."
            );

            return subscription;
        }


        // =================================================
        // VAPID PUBLIC KEY
        // =================================================
        //
        // We will replace this with your real VAPID
        // public key after setting up the backend.
        //
        // =================================================

        const vapidPublicKey =
            process.env.REACT_APP_VAPID_PUBLIC_KEY;


        if (!vapidPublicKey) {

            console.error(
                "REACT_APP_VAPID_PUBLIC_KEY is not configured."
            );

            return null;
        }


        const applicationServerKey =
            urlBase64ToUint8Array(
                vapidPublicKey
            );


        subscription =
            await registration.pushManager.subscribe({

                userVisibleOnly: true,

                applicationServerKey:
                    applicationServerKey

            });


        console.log(
            "New push subscription created."
        );

        return subscription;

    } catch (error) {

        console.error(
            "Unable to create push subscription:",
            error
        );

        return null;
    }
}


// =========================================================
// CONVERT VAPID KEY
// =========================================================

function urlBase64ToUint8Array(
    base64String
) {

    const padding =
        "=".repeat(
            (4 -
                (base64String.length % 4)
            ) % 4
        );

    const base64 =
        (
            base64String +
            padding
        )
        .replace(
            /-/g,
            "+"
        )
        .replace(
            /_/g,
            "/"
        );

    const rawData =
        window.atob(base64);

    const outputArray =
        new Uint8Array(
            rawData.length
        );


    for (
        let i = 0;
        i < rawData.length;
        ++i
    ) {

        outputArray[i] =
            rawData.charCodeAt(i);
    }


    return outputArray;
}


// =========================================================
// GET CURRENT NOTIFICATION STATUS
// =========================================================

export function getNotificationStatus() {

    if (!("Notification" in window)) {

        return "unsupported";
    }


    return Notification.permission;
}