from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
import cv2
import numpy as np
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_http_methods
import os
import moviepy.editor as mp
import io
import requests
import tempfile

# Initialize a cache dictionary
cache = {'currentBlob': None, 'currentCap': None}

@api_view(['POST'])
def getVideoFrameAtTime(request):
    try:
        videoBlob = request.FILES.get('videoBlob')
        currentBlob = 'currentBlob'  # Key for current video blob in cache

        # Check if videoBlob is different from cached currentBlob
        if cache[currentBlob] != videoBlob:
            cache[currentBlob] = videoBlob

            # Save the uploaded video blob to a temporary file
            with open('video.mp4', 'wb') as f:
                for chunk in videoBlob.chunks():
                    f.write(chunk)

            # Open the saved video file
            cap = cv2.VideoCapture('video.mp4')
            if not cap.isOpened():
                os.remove('/Users/rishavr/Home-Screen/djangoBackend2/video.mp4')
                return Response({"error": "Video capture failed"}, status=status.HTTP_400_BAD_REQUEST)
            
            cache['currentCap'] = cap
        

        cap = cache['currentCap']

        time_in_seconds = float(request.data['timeInSeconds'])
        cap.set(cv2.CAP_PROP_POS_MSEC, time_in_seconds * 1000)

        # Read the frame at the specified position
        ret, frame = cap.read()
        cap.release()
        os.remove('/Users/rishavr/Home-Screen/djangoBackend2/video.mp4')

        if ret:
            # Encode frame as JPEG
            _, jpg_frame = cv2.imencode('.jpg', frame)
            byte_encode = jpg_frame.tobytes()

            # Return the encoded frame as response
            return HttpResponse(byte_encode, content_type='image/jpeg')
        else:
            return Response({"error": "Could not read frame"}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@require_http_methods(['GET'])
def changeQualityOfVideo(request, quality):
    try:
        response = requests.get('http://localhost:8004/getVideo/667f538bc5f8f42e09b4c6f9')
        response.raise_for_status()  # Raises HTTPError for bad responses
    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': str(e)}, status=500)
        
    video_blob = response.content
    
    # Save the video data to a temporary file
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_video_file:
        temp_video_file.write(video_blob)
        temp_video_file_path = temp_video_file.name
    
    try:
        video_clip = mp.VideoFileClip(temp_video_file_path)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

    if quality == '4K':
        new_size = (3840, 2160)
    elif quality == '1080p':
        new_size = (1920, 1080)
    elif quality == '720p':
        new_size = (1280, 720)
    elif quality == '480p':
        new_size = (854, 480)
    else:
        return JsonResponse({'error': 'Invalid quality parameter'}, status=400)

    try:
        video_clip_resized = video_clip.resize(newsize=new_size)
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_output_file:
            video_clip_resized.write_videofile(temp_output_file.name, codec='libx264', audio_codec='aac')
            temp_output_file.seek(0)
            converted_video_blob = temp_output_file.read()
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    finally:
        temp_video_file.close()
        video_clip.close()
        video_clip_resized.close()

    return HttpResponse(converted_video_blob, content_type='video/mp4')