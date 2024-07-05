import requests
import cv2
import numpy as np
from io import BytesIO
import os
import requests

def extract_frame_from_video_blob(video_id):
    try:
        # Fetch the video blob from the server endpoint
        response = requests.get(f'http://localhost:8004/getVideo/{video_id}')
        
        # Check if the response was successful
        if not response.ok:
            raise ValueError('Network response was not ok')
        
        # Convert the response content to a bytes-like object
        video_blob = response.content

        with open(f'video_{video_id}.mp4', 'wb') as f:
            f.write(response.content)
        
        # Initialize VideoCapture with the video blob
        cap = cv2.VideoCapture(f'video_{video_id}.mp4')
        
        # Check if the video capture object is opened successfully
        if not cap.isOpened():
            raise ValueError("Error: Video capture failed")
        
        # Get total number of frames (optional, for information purpose)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Set the capture to seek to 30 seconds (30000 milliseconds)
        cap.set(cv2.CAP_PROP_POS_MSEC, 30000)
        
        # Read the frame at this position
        ret, frame = cap.read()
        
        if ret:
            # Display the frame (or process it as needed)
            cv2.imshow('Frame at 30 seconds', frame)
            cv2.waitKey(0)  # Wait for any key press before closing the window
            cv2.destroyAllWindows()  # Close all OpenCV windows
            os.remove(f'video_{video_id}.mp4')
        else:
            print("Error: Could not read frame at 30 seconds")

        # Release the video capture object
        cap.release()
        
    except Exception as e:
        print(f"Error occurred: {e}")

# Example usage:
if __name__ == "__main__":
    video_id = "667f538bc5f8f42e09b4c6f9"
    extract_frame_from_video_blob(video_id)
