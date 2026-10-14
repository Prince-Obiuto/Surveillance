const cameras = [
    {
        id: 1,
        name: "Camera 1",
        location: "Front Camera",

        ipAddress: "10.10.20.9",

        streamUrl:
            "http://localhost:5000/api/cameras/1/stream",

        status: "Online",

        recording: "Enabled"
    },

    {
        id: 2,
        name: "Camera 2",
        location: "Side Camera 1",
        ipAddress: "10.10.20.5",

        streamUrl:
            "http://localhost:5000/api/cameras/2/stream",

        status: "Online",
        recording: "Enabled"
    },

    {
        id: 3,
        name: "Camera 3",
        location: "Back Camera",
        ipAddress: "10.10.20.7",

        streamUrl:
            "http://localhost:5000/api/cameras/3/stream",

        status: "Online",
        recording: "Enabled"
    },


    // ======================================================
    // CAMERA 4
    // ======================================================

    {
        id: 4,
        name: "Camera 4",
        location: "Tech Hub",
        ipAddress: "10.10.20.2",
        streamUrl: "http://localhost:5000/api/cameras/4/stream",
        status: "Online",
        recording: "Enabled"
    },

    {
        id: 5,
        name: "Camera 5",
        location: "Classroom (Upstairs)",
        ipAddress: "10.10.20.6",

        streamUrl:
            "http://localhost:5000/api/cameras/5/stream",

        status: "Online",
        recording: "Enabled"
    },

    {
        id: 6,
        name: "Camera 6",
        location: "Classroom (Downstairs)",
        ipAddress: "10.10.20.11",

        streamUrl:
            "http://localhost:5000/api/cameras/6/stream",

        status: "Online",
        recording: "Enabled"
    },
    {
        id: 7,
        name: "Camera 7",
        location: "Upstairs corridor",
        ipAddress: "10.10.20.10",

        streamUrl:
            "http://localhost:5000/api/cameras/7/stream",

        status: "Online",
        recording: "Enabled"
    },

    // ======================================================
    // CAMERA 8
    // ======================================================

    {
        id: 8,
        name: "Camera 8",
        location: "Side 2",
        ipAddress: "192.168.1.108",
        streamUrl: "http://localhost:5000/api/cameras/4/stream",
        status: "Online",
        recording: "Enabled"
    },


    // ======================================================
    // CAMERA 9
    // ======================================================

    {
        id: 9,
        name: "Camera 9",
        location: "Side 2",
        ipAddress: "192.168.1.109",
        streamUrl: "",
        status: "Offline",
        recording: "Disabled"
    },


    // ======================================================
    // CAMERA 10
    // ======================================================

    {
        id: 10,
        name: "Camera 10",
        location: "LAB 1",
        ipAddress: "192.168.1.110",
        streamUrl: "",
        status: "Offline",
        recording: "Disabled"
    }

];

export default cameras;