const webpush = require("web-push");
require("dotenv").config();

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

if (!publicKey || !privateKey || !subject) {
    console.error(
        "VAPID configuration is missing from .env"
    );
} else {
    webpush.setVapidDetails(
        subject,
        publicKey,
        privateKey
    );

    console.log(
        "Web Push / VAPID configured successfully."
    );
}

module.exports = webpush;