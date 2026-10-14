from ultralytics import YOLO
import mysql.connector
import cv2
import os
import time
import subprocess
import requests
from datetime import datetime, time as dt_time


# =========================================================
# CONFIGURATION
# =========================================================

# IMPORTANT:
# detection_schedule uses camera_id, NOT camera_name.
#
# This file is currently for Camera 1.
#
# For Camera 2:
#     CAMERA_ID = 2
#     CAMERA_NAME = "Camera 2"
#
# For Camera 3:
#     CAMERA_ID = 3
#     CAMERA_NAME = "Camera 3"
#
# etc.
# =========================================================

CAMERA_ID = 1

CAMERA_NAME = "Camera 1"

RECORD_DURATION = 60

TARGET_FPS = 20

FFMPEG_PATH = "ffmpeg"

SCHEDULE_CHECK_INTERVAL = 1


# =========================================================
# PUSH NOTIFICATION
# =========================================================

PUSH_NOTIFICATION_URL = (
    "http://localhost:5000/api/push-subscriptions/send"
)


# =========================================================
# BASE DIRECTORIES
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

BACKEND_DIR = os.path.abspath(
    os.path.join(BASE_DIR, "..")
)

SNAPSHOT_FOLDER = os.path.join(
    BACKEND_DIR,
    "snapshots"
)

VIDEO_FOLDER = os.path.join(
    BACKEND_DIR,
    "videos"
)

TEMP_VIDEO_FOLDER = os.path.join(
    BACKEND_DIR,
    "temp_videos"
)


# =========================================================
# CREATE FOLDERS
# =========================================================

os.makedirs(
    SNAPSHOT_FOLDER,
    exist_ok=True
)

os.makedirs(
    VIDEO_FOLDER,
    exist_ok=True
)

os.makedirs(
    TEMP_VIDEO_FOLDER,
    exist_ok=True
)


# =========================================================
# STARTUP
# =========================================================

print("==============================================")
print("SMART SURVEILLANCE HUMAN DETECTION")
print("==============================================")

print("Camera ID:")
print(CAMERA_ID)

print("Camera Name:")
print(CAMERA_NAME)

print("Backend Folder:")
print(BACKEND_DIR)

print("Snapshots:")
print(SNAPSHOT_FOLDER)

print("Videos:")
print(VIDEO_FOLDER)

print("Temporary Videos:")
print(TEMP_VIDEO_FOLDER)

print("Target FPS:")
print(TARGET_FPS)

print("Recording Duration:")
print(RECORD_DURATION, "seconds")

print("----------------------------------------------")

print("DETECTION CONTROL")
print("General schedule + individual camera override")

print("----------------------------------------------")

print("PUSH NOTIFICATION SERVER:")
print(PUSH_NOTIFICATION_URL)

print("==============================================")


# =========================================================
# CHECK FFMPEG
# =========================================================

try:

    ffmpeg_check = subprocess.run(
        [
            FFMPEG_PATH,
            "-version"
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    if ffmpeg_check.returncode == 0:

        print(
            "FFmpeg detected successfully."
        )

    else:

        print(
            "WARNING: FFmpeg was found but returned an error."
        )

except Exception as err:

    print(
        "ERROR: FFmpeg could not be started."
    )

    print(err)

    print(
        "Make sure FFmpeg is available in PATH."
    )

    exit()


# =========================================================
# MYSQL CONNECTION
# =========================================================

try:

    db = mysql.connector.connect(

        host="localhost",

        port=3307,

        user="root",

        password="missionary2",

        database="surveillance_db"

    )

    cursor = db.cursor()

    print(
        "MySQL connected successfully."
    )

except mysql.connector.Error as err:

    print(
        "MySQL connection failed:"
    )

    print(err)

    exit()


# =========================================================
# SAFE NUMBER CONVERSION
# =========================================================

def number_safe(value):

    try:

        return int(value)

    except Exception:

        return 0


# =========================================================
# CONVERT MYSQL TIME
# =========================================================

def convert_mysql_time(value):

    if value is None:

        return None


    if isinstance(value, dt_time):

        return value


    if hasattr(value, "total_seconds"):

        total_seconds = int(
            value.total_seconds()
        ) % (
            24 * 60 * 60
        )

        hours = (
            total_seconds // 3600
        )

        minutes = (
            total_seconds % 3600
        ) // 60

        seconds = (
            total_seconds % 60
        )

        return dt_time(
            hours,
            minutes,
            seconds
        )


    value_string = str(
        value
    ).strip()


    # =====================================================
    # HH:MM:SS
    # =====================================================

    try:

        return datetime.strptime(
            value_string,
            "%H:%M:%S"
        ).time()

    except ValueError:

        pass


    # =====================================================
    # HH:MM
    # =====================================================

    try:

        return datetime.strptime(
            value_string,
            "%H:%M"
        ).time()

    except ValueError:

        pass


    # =====================================================
    # FIRST 8 CHARACTERS
    # =====================================================

    try:

        return datetime.strptime(
            value_string[:8],
            "%H:%M:%S"
        ).time()

    except ValueError:

        pass


    raise ValueError(
        f"Invalid MySQL time value: {value_string}"
    )


# =========================================================
# GET GENERAL DETECTION SCHEDULE
# =========================================================

def get_detection_schedule():

    try:

        cursor.execute("""
            SELECT
                start_time,
                end_time
            FROM general_detection_schedule
            ORDER BY id ASC
            LIMIT 1
        """)

        result = cursor.fetchone()


        if not result:

            print(
                "WARNING: General detection schedule not found."
            )

            return None


        start_time = result[0]

        end_time = result[1]


        start = convert_mysql_time(
            start_time
        )

        end = convert_mysql_time(
            end_time
        )


        if start is None or end is None:

            print(
                "WARNING: General schedule contains invalid time."
            )

            return None


        return {

            "start": start,

            "end": end

        }


    except mysql.connector.Error as err:

        print(
            "Schedule database error:"
        )

        print(err)

        return None


    except ValueError as err:

        print(
            "Schedule time conversion error:"
        )

        print(err)

        return None


# =========================================================
# CALCULATE GENERAL SCHEDULE STATUS
# =========================================================

def calculate_schedule_status(
    start_time,
    end_time,
    current_time
):

    # =====================================================
    # INVALID VALUES
    # =====================================================

    if (
        start_time is None
        or
        end_time is None
        or
        current_time is None
    ):

        return False


    # =====================================================
    # SAME TIME
    #
    # Example:
    # 00:00 -> 00:00
    #
    # Means detection is active 24 hours.
    # =====================================================

    if start_time == end_time:

        return True


    # =====================================================
    # SAME DAY
    #
    # Example:
    # 07:00 -> 21:00
    # =====================================================

    if start_time < end_time:

        return (
            start_time
            <= current_time
            <
            end_time
        )


    # =====================================================
    # OVERNIGHT
    #
    # Example:
    # 21:00 -> 07:00
    # =====================================================

    return (
        current_time >= start_time
        or
        current_time < end_time
    )


# =========================================================
# GET GENERAL REAL-TIME STATUS
# =========================================================

def get_general_detection_status():

    schedule = get_detection_schedule()


    if schedule is None:

        return False


    now = datetime.now().time()


    detection_active = calculate_schedule_status(

        schedule["start"],

        schedule["end"],

        now

    )


    return detection_active


# =========================================================
# CAMERA STATUS DISPLAY
# =========================================================

last_camera_status = None

last_camera_manual_state = None


def print_camera_status_if_changed(
    active,
    manual,
    raw_status
):

    global last_camera_status
    global last_camera_manual_state


    if (
        last_camera_status == active
        and
        last_camera_manual_state == manual
    ):

        return


    print("----------------------------------------------")


    if manual:

        if active:

            print(
                f"{CAMERA_NAME}: MANUAL OVERRIDE ON"
            )

            print(
                "Reason: Camera was manually turned ON."
            )

        else:

            print(
                f"{CAMERA_NAME}: MANUAL OVERRIDE OFF"
            )

            print(
                "Reason: Camera was manually turned OFF."
            )


    else:

        if active:

            print(
                f"{CAMERA_NAME}: FOLLOWING GENERAL SCHEDULE - ON"
            )

        else:

            print(
                f"{CAMERA_NAME}: FOLLOWING GENERAL SCHEDULE - OFF"
            )


    print("----------------------------------------------")


    last_camera_status = active

    last_camera_manual_state = manual


# =========================================================
# GET INDIVIDUAL CAMERA DETECTION STATUS
# =========================================================
#
# IMPORTANT:
#
# detection_schedule DOES NOT contain camera_name.
#
# The database structure contains:
#
# id
# camera_id
# detection_enabled
# start_time
# end_time
# updated_at
# manual_override
#
# Therefore we MUST search using camera_id.
#
# PRIORITY:
#
# 1. manual_override = 1
#    Use detection_enabled.
#
# 2. manual_override = 0
#    Follow general schedule.
#
# =========================================================

def get_camera_detection_status():

    try:

        cursor.execute("""
            SELECT
                detection_enabled,
                manual_override,
                start_time,
                end_time
            FROM detection_schedule
            WHERE camera_id = %s
            LIMIT 1
        """, (
            CAMERA_ID,
        ))


        result = cursor.fetchone()


        # =================================================
        # CAMERA NOT FOUND
        # =================================================

        if not result:

            print(
                f"WARNING: {CAMERA_NAME} "
                f"(ID {CAMERA_ID}) schedule not found."
            )

            print(
                "Falling back to general detection schedule."
            )


            general_active = (
                get_general_detection_status()
            )


            print_camera_status_if_changed(

                general_active,

                False,

                general_active

            )


            return general_active


        # =================================================
        # READ DATABASE VALUES
        # =================================================

        detection_enabled = number_safe(
            result[0]
        )

        manual_override = number_safe(
            result[1]
        )


        # =================================================
        # MANUAL OVERRIDE
        #
        # manual_override = 1
        #
        # The camera completely ignores the general
        # schedule and uses detection_enabled.
        # =================================================

        if manual_override == 1:

            camera_active = (
                detection_enabled == 1
            )


            print_camera_status_if_changed(

                camera_active,

                True,

                detection_enabled

            )


            return camera_active


        # =================================================
        # AUTOMATIC GENERAL SCHEDULE
        #
        # manual_override = 0
        #
        # Camera follows the general schedule.
        # =================================================

        general_active = (
            get_general_detection_status()
        )


        print_camera_status_if_changed(

            general_active,

            False,

            general_active

        )


        return general_active


    except mysql.connector.Error as err:

        print(
            "Camera schedule database error:"
        )

        print(err)

        try:

            db.rollback()

        except Exception:

            pass


        return False


# =========================================================
# LOAD YOLO
# =========================================================

try:

    model = YOLO(
        "yolov8n.pt"
    )

    print(
        "YOLO model loaded successfully."
    )

except Exception as err:

    print(
        "Unable to load YOLO model:"
    )

    print(err)

    cursor.close()

    db.close()

    exit()


# =========================================================
# OPEN WEBCAM
# =========================================================
#
# Temporary webcam source.
#
# CAM111:
# Replace cv2.VideoCapture(0) with the actual IP camera
# stream when the IP camera stage is ready.
# =========================================================

cap = cv2.VideoCapture(0)


if not cap.isOpened():

    print(
        "Unable to open webcam."
    )

    cursor.close()

    db.close()

    exit()


# =========================================================
# CAMERA SETTINGS
# =========================================================

camera_fps = cap.get(
    cv2.CAP_PROP_FPS
)


if camera_fps <= 0 or camera_fps > 120:

    camera_fps = 30


width = int(
    cap.get(
        cv2.CAP_PROP_FRAME_WIDTH
    )
)


height = int(
    cap.get(
        cv2.CAP_PROP_FRAME_HEIGHT
    )
)


if width <= 0:

    width = 640


if height <= 0:

    height = 480


print("Camera Reported FPS:")
print(camera_fps)

print("Camera Resolution:")
print(
    width,
    "x",
    height
)

print("Recording FPS:")
print(TARGET_FPS)

print("==============================================")


# =========================================================
# VARIABLES
# =========================================================

recording = False

video_writer = None

record_start_time = 0

frames_written = 0

current_image_name = ""

current_temp_video_name = ""

current_temp_video_path = ""

current_final_video_name = ""

current_final_video_path = ""

current_image_path = ""

push_notification_sent = False

previous_detection_state = None

last_schedule_check = 0

detection_active = False


# =========================================================
# SEND PUSH NOTIFICATION
# =========================================================

def send_push_notification(
    image_name=None,
    video_name=None
):

    payload = {

        "title": "🚨 Human Detected",

        "body": (
            f"Person detected by {CAMERA_NAME}"
        ),

        "type": "Human Detection",

        "camera_name": CAMERA_NAME,

        "image_name": image_name,

        "video_name": video_name

    }


    print("----------------------------------------------")

    print(
        "Sending push notification..."
    )

    print(
        "Camera:",
        CAMERA_NAME
    )


    try:

        response = requests.post(

            PUSH_NOTIFICATION_URL,

            json=payload,

            timeout=10

        )


        if response.status_code == 200:

            try:

                data = response.json()

            except Exception:

                data = {}


            print(
                "🔔 PUSH NOTIFICATION SENT"
            )

            print(
                "Devices:",
                data.get(
                    "total_devices",
                    "Unknown"
                )
            )

            print(
                "Sent:",
                data.get(
                    "sent",
                    0
                )
            )

            print(
                "Failed:",
                data.get(
                    "failed",
                    0
                )
            )

            print("----------------------------------------------")

            return True


        if response.status_code == 404:

            print(
                "⚠️ No registered notification devices."
            )

            print(
                "The administrator must enable browser notifications first."
            )

            print("----------------------------------------------")

            return False


        print(
            "⚠️ Push notification failed."
        )

        print(
            "HTTP Status:",
            response.status_code
        )

        print(
            "Server Response:",
            response.text
        )

        print("----------------------------------------------")

        return False


    except requests.exceptions.ConnectionError:

        print(
            "❌ PUSH SERVER CONNECTION FAILED"
        )

        print(
            "Make sure the Node.js backend is running."
        )

        print("----------------------------------------------")

        return False


    except requests.exceptions.Timeout:

        print(
            "❌ PUSH NOTIFICATION REQUEST TIMED OUT."
        )

        print("----------------------------------------------")

        return False


    except Exception as err:

        print(
            "❌ PUSH NOTIFICATION ERROR:"
        )

        print(err)

        print("----------------------------------------------")

        return False


# =========================================================
# CONVERT VIDEO TO H264
# =========================================================

def convert_video_to_h264(
    input_file,
    output_file
):

    print("----------------------------------------------")

    print(
        "Converting video to H.264..."
    )

    command = [

        FFMPEG_PATH,

        "-y",

        "-i",
        input_file,

        "-c:v",
        "libx264",

        "-preset",
        "medium",

        "-crf",
        "23",

        "-pix_fmt",
        "yuv420p",

        "-movflags",
        "+faststart",

        "-r",
        str(TARGET_FPS),

        "-an",

        output_file

    ]


    try:

        result = subprocess.run(

            command,

            stdout=subprocess.PIPE,

            stderr=subprocess.PIPE,

            text=True

        )


        if result.returncode == 0:

            print(
                "H.264 conversion successful."
            )

            return True


        print(
            "FFmpeg conversion failed."
        )

        print(
            result.stderr
        )

        return False


    except Exception as err:

        print(
            "Unable to run FFmpeg:"
        )

        print(err)

        return False


# =========================================================
# SAVE DATABASE RECORDS
# =========================================================

def save_database_records(
    image_name,
    video_name
):

    try:

        # =================================================
        # HUMAN DETECTION
        # =================================================

        detection_sql = """

        INSERT INTO human_detection

        (
            camera_name,
            image_name,
            status
        )

        VALUES
        (
            %s,
            %s,
            %s
        )

        """


        cursor.execute(

            detection_sql,

            (
                CAMERA_NAME,
                image_name,
                "Detected"
            )

        )


        # =================================================
        # NOTIFICATION
        # =================================================

        notification_sql = """

        INSERT INTO notifications

        (
            type,
            message,
            image_name,
            video_name,
            camera_name,
            status
        )

        VALUES
        (
            %s,
            %s,
            %s,
            %s,
            %s,
            %s
        )

        """


        cursor.execute(

            notification_sql,

            (

                "Human Detection",

                f"Person detected by {CAMERA_NAME}",

                image_name,

                video_name,

                CAMERA_NAME,

                "Unread"

            )

        )


        # =================================================
        # COMMIT BOTH RECORDS
        # =================================================

        db.commit()


        print("----------------------------------------------")

        print(
            "DATABASE RECORDS SAVED"
        )

        print(
            "Camera ID:",
            CAMERA_ID
        )

        print(
            "Camera:",
            CAMERA_NAME
        )

        print(
            "Image:",
            image_name
        )

        print(
            "Video:",
            video_name
        )

        print("----------------------------------------------")

        return True


    except mysql.connector.Error as err:

        print(
            "Database error:"
        )

        print(err)

        try:

            db.rollback()

        except Exception:

            pass

        return False


# =========================================================
# STOP ACTIVE RECORDING
# =========================================================

def stop_active_recording():

    global recording
    global video_writer
    global push_notification_sent


    if not recording:

        return


    print("----------------------------------------------")

    print(
        "Stopping active recording."
    )

    print("----------------------------------------------")


    if video_writer is not None:

        video_writer.release()

        video_writer = None


    recording = False

    push_notification_sent = False


# =========================================================
# MAIN LOOP
# =========================================================

try:

    while True:

        current_loop_time = time.time()


        # =================================================
        # CHECK CAMERA DETECTION STATUS
        #
        # EVERY SECOND
        # =================================================

        if (
            current_loop_time
            -
            last_schedule_check
            >=
            SCHEDULE_CHECK_INTERVAL
        ):

            detection_active = (
                get_camera_detection_status()
            )

            last_schedule_check = (
                current_loop_time
            )


            # =================================================
            # SHOW STATUS WHEN IT CHANGES
            # =================================================

            if (
                previous_detection_state
                !=
                detection_active
            ):

                print("----------------------------------------------")

                print(
                    "CURRENT REAL TIME:",
                    datetime.now().strftime(
                        "%H:%M:%S"
                    )
                )


                if detection_active:

                    print(
                        f"🟢 {CAMERA_NAME} DETECTION ACTIVATED"
                    )

                else:

                    print(
                        f"🔴 {CAMERA_NAME} DETECTION DEACTIVATED"
                    )


                print("----------------------------------------------")


                previous_detection_state = (
                    detection_active
                )


        # =================================================
        # READ FRAME
        # =================================================

        success, frame = cap.read()


        if not success:

            print(
                "Unable to read frame from webcam."
            )

            break


        annotated = frame.copy()


        # =================================================
        # DETECTION OFF
        # =================================================

        if not detection_active:

            cv2.putText(

                annotated,

                "DETECTION OFF",

                (20, 40),

                cv2.FONT_HERSHEY_SIMPLEX,

                0.8,

                (0, 255, 255),

                2

            )


            cv2.putText(

                annotated,

                f"{CAMERA_NAME} - DETECTION DISABLED",

                (20, 75),

                cv2.FONT_HERSHEY_SIMPLEX,

                0.6,

                (0, 255, 255),

                2

            )


            # =================================================
            # STOP RECORDING
            # =================================================

            if recording:

                stop_active_recording()


            cv2.imshow(

                "Smart Surveillance - Human Detection",

                annotated

            )


            key = (
                cv2.waitKey(1)
                &
                0xFF
            )


            if key == ord("q"):

                print(
                    "Q pressed. Closing application."
                )

                break


            continue


        # =================================================
        # DETECTION ON
        # =================================================

        cv2.putText(

            annotated,

            "DETECTION ON",

            (20, 40),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.8,

            (0, 255, 0),

            2

        )


        cv2.putText(

            annotated,

            f"{CAMERA_NAME} - ACTIVE",

            (20, 75),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.6,

            (0, 255, 0),

            2

        )


        # =================================================
        # YOLO HUMAN DETECTION
        # =================================================

        results = model(

            frame,

            verbose=False

        )


        person_detected = False


        for result in results:

            if result.boxes is None:

                continue


            for box in result.boxes:

                cls = int(
                    box.cls[0]
                )

                confidence = float(
                    box.conf[0]
                )


                # =================================================
                # CLASS 0 = PERSON
                # =================================================

                if (
                    cls == 0
                    and confidence >= 0.50
                ):

                    person_detected = True


                    x1, y1, x2, y2 = map(

                        int,

                        box.xyxy[0]

                    )


                    cv2.rectangle(

                        annotated,

                        (x1, y1),

                        (x2, y2),

                        (0, 255, 0),

                        2

                    )


                    cv2.putText(

                        annotated,

                        f"PERSON {confidence:.2f}",

                        (
                            x1,
                            max(
                                y1 - 10,
                                20
                            )
                        ),

                        cv2.FONT_HERSHEY_SIMPLEX,

                        0.7,

                        (0, 255, 0),

                        2

                    )


        # =================================================
        # START RECORDING
        # =================================================

        if (
            person_detected
            and not recording
        ):

            timestamp = (
                datetime.now().strftime(
                    "%Y%m%d_%H%M%S"
                )
            )


            current_image_name = (
                timestamp + ".jpg"
            )


            current_final_video_name = (
                timestamp + ".mp4"
            )


            current_temp_video_name = (
                timestamp + "_temp.mp4"
            )


            current_image_path = os.path.join(

                SNAPSHOT_FOLDER,

                current_image_name

            )


            current_temp_video_path = os.path.join(

                TEMP_VIDEO_FOLDER,

                current_temp_video_name

            )


            current_final_video_path = os.path.join(

                VIDEO_FOLDER,

                current_final_video_name

            )


            # =================================================
            # SAVE SNAPSHOT
            # =================================================

            snapshot_saved = cv2.imwrite(

                current_image_path,

                frame

            )


            if snapshot_saved:

                print("----------------------------------------------")

                print(
                    "SNAPSHOT SAVED"
                )

                print(
                    current_image_path
                )

                print("----------------------------------------------")


            else:

                print(
                    "WARNING: Snapshot could not be saved."
                )


            # =================================================
            # CREATE TEMP VIDEO
            # =================================================

            fourcc = (
                cv2.VideoWriter_fourcc(
                    *"mp4v"
                )
            )


            video_writer = cv2.VideoWriter(

                current_temp_video_path,

                fourcc,

                TARGET_FPS,

                (width, height)

            )


            if not video_writer.isOpened():

                print(
                    "ERROR: Unable to create temporary video."
                )

                video_writer = None

                continue


            recording = True


            record_start_time = (
                time.time()
            )


            frames_written = 0


            push_notification_sent = False


            print("----------------------------------------------")

            print(
                "RECORDING STARTED"
            )

            print(
                "Camera ID:",
                CAMERA_ID
            )

            print(
                "Camera:",
                CAMERA_NAME
            )

            print(
                "Duration:",
                RECORD_DURATION,
                "seconds"
            )

            print("----------------------------------------------")


            # =================================================
            # PUSH NOTIFICATION
            # =================================================

            push_notification_sent = (
                send_push_notification(

                    current_image_name,

                    current_final_video_name

                )
            )


        # =================================================
        # RECORD VIDEO
        # =================================================

        if (
            recording
            and video_writer is not None
        ):

            elapsed = (

                time.time()

                -

                record_start_time

            )


            expected_frames = int(

                elapsed
                *
                TARGET_FPS

            )


            while (
                frames_written
                <
                expected_frames
            ):

                video_writer.write(
                    frame
                )

                frames_written += 1


            remaining = max(

                0,

                int(

                    RECORD_DURATION
                    -
                    elapsed

                )

            )


            cv2.putText(

                annotated,

                f"RECORDING {remaining}s",

                (20, 115),

                cv2.FONT_HERSHEY_SIMPLEX,

                1,

                (0, 0, 255),

                3

            )


            # =================================================
            # FINISH RECORDING
            # =================================================

            if elapsed >= RECORD_DURATION:

                print("----------------------------------------------")

                print(
                    "60 SECONDS REACHED."
                )

                print(
                    "Stopping recording..."
                )

                print(
                    "Frames written:",
                    frames_written
                )

                print("----------------------------------------------")


                video_writer.release()

                video_writer = None

                recording = False


                # =================================================
                # CONVERT TO H264
                # =================================================

                converted = (
                    convert_video_to_h264(

                        current_temp_video_path,

                        current_final_video_path

                    )
                )


                # =================================================
                # SAVE DATABASE RECORDS
                # =================================================

                if (
                    converted
                    and os.path.exists(
                        current_final_video_path
                    )
                ):

                    file_size = os.path.getsize(

                        current_final_video_path

                    )


                    print("----------------------------------------------")

                    print(
                        "FINAL VIDEO CREATED"
                    )

                    print(
                        "File:",
                        current_final_video_path
                    )

                    print(
                        "Size:",
                        file_size,
                        "bytes"
                    )

                    print("----------------------------------------------")


                    database_saved = (
                        save_database_records(

                            current_image_name,

                            current_final_video_name

                        )
                    )


                    if database_saved:

                        print(
                            "Database records successfully saved."
                        )

                    else:

                        print(
                            "WARNING: Database records could not be saved."
                        )


                    # =================================================
                    # DELETE TEMP VIDEO
                    # =================================================

                    if os.path.exists(
                        current_temp_video_path
                    ):

                        try:

                            os.remove(
                                current_temp_video_path
                            )

                            print(
                                "Temporary video deleted."
                            )

                        except Exception as err:

                            print(
                                "Could not delete temporary video:"
                            )

                            print(err)


                else:

                    print("----------------------------------------------")

                    print(
                        "ERROR: FINAL VIDEO WAS NOT CREATED."
                    )

                    print(
                        "Database record was NOT created."
                    )

                    print("----------------------------------------------")


                # =================================================
                # RESET
                # =================================================

                current_temp_video_path = ""

                current_final_video_path = ""

                current_image_name = ""

                current_final_video_name = ""

                current_temp_video_name = ""

                current_image_path = ""

                frames_written = 0

                push_notification_sent = False


        # =================================================
        # DISPLAY
        # =================================================

        cv2.imshow(

            "Smart Surveillance - Human Detection",

            annotated

        )


        key = (
            cv2.waitKey(1)
            &
            0xFF
        )


        if key == ord("q"):

            print(
                "Q pressed. Closing application."
            )

            break


# =========================================================
# ERROR HANDLING
# =========================================================

except KeyboardInterrupt:

    print("")

    print(
        "Application interrupted by user."
    )


except Exception as err:

    print("----------------------------------------------")

    print(
        "APPLICATION ERROR"
    )

    print(err)

    print("----------------------------------------------")


# =========================================================
# CLEANUP
# =========================================================

finally:

    print("----------------------------------------------")

    print(
        "Cleaning up..."
    )

    print("----------------------------------------------")


    if video_writer is not None:

        video_writer.release()

        video_writer = None


    if cap is not None:

        cap.release()


    cv2.destroyAllWindows()


    try:

        cursor.close()

    except Exception:

        pass


    try:

        db.close()

    except Exception:

        pass


    print("----------------------------------------------")

    print(
        "Application Closed."
    )

    print("----------------------------------------------")