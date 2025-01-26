import os
import cv2
import base64
from django.http import JsonResponse, HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.files.temp import NamedTemporaryFile
from google.cloud import storage
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()


@api_view(['POST'])
def getVideoFramesAtIntervals(request):
    try:
        video_blob = request.FILES.get('video')
        if not video_blob:
            return Response({"error": "No video file provided"}, status=status.HTTP_400_BAD_REQUEST)

        time_in_seconds = float(request.data.get('duration'))
        if time_in_seconds < 0:
            return Response({"error": "Invalid duration provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Create a temporary file to store the uploaded video
        with NamedTemporaryFile(delete=False, suffix='.mp4') as temp_video_file:
            for chunk in video_blob.chunks():
                temp_video_file.write(chunk)
            temp_video_path = temp_video_file.name

        # Capture video frames at the specified intervals
        cap = cv2.VideoCapture(temp_video_path)
        if not cap.isOpened():
            os.remove(temp_video_path)
            return Response({"error": "Video capture failed"}, status=status.HTTP_400_BAD_REQUEST)

        frames = []
        for i in range(0, int(time_in_seconds), 5):
            cap.set(cv2.CAP_PROP_POS_MSEC, i * 1000)
            ret, frame = cap.read()
            if not ret:
                cap.release()
                os.remove(temp_video_path)
                return Response({"error": f"Could not read frame at {i} seconds"}, status=status.HTTP_400_BAD_REQUEST)
            
            _, jpg_frame = cv2.imencode('.jpg', frame)
            byte_encode = base64.b64encode(jpg_frame).decode('utf-8')
            frames.append(f'data:image/jpeg;base64,{byte_encode}')
        
        cap.release()
        os.remove(temp_video_path)

        return JsonResponse({'frames': frames})

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def getPostBackgroundMusic(request, postId):
    credential_path = "/Users/rishavr/Downloads/megagram-428802-476264306d3b.json"
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credential_path
    storage_client = storage.Client()
    bucket = storage_client.bucket("megagram-post-music")
    for blob in bucket.list_blobs():
        blob.reload()
        if blob.metadata and blob.metadata.get('overallPostId') == postId:
            blob_data = blob.download_as_bytes()
            content_type = blob.content_type if blob.content_type else 'audio/mpeg'
            response = HttpResponse(blob_data, content_type=content_type)
            response['songName'] = blob.metadata.get('songName')
            response['Access-Control-Expose-Headers'] = 'songName'
            return response
            
    return Response("audio not found for that postId", status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def getVideoSubtitles(request, videoId):
    credential_path = "/Users/rishavr/Downloads/megagram-428802-476264306d3b.json"
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credential_path
    storage_client = storage.Client()
    bucket = storage_client.bucket("megagram-video-subtitle-files")
    output = []
    for blob in bucket.list_blobs():
        blob.reload()
        if blob.metadata and blob.metadata.get('videoId') == videoId:
            blob_data = blob.download_as_bytes()
            newElement = {'subtitleFile': blob_data.decode('utf-8'), 'language': blob.metadata.get("language")}
            output.append(newElement)
            
    return Response(output)


@api_view(['GET'])
def getAIConvos(request, username):
    try:
        conn = psycopg2.connect(
            dbname="Megagram",
            user="postgres",
            password=os.getenv('postgresqlPassword'),
            host="localhost",
            port="5432"
        )
        cursor = conn.cursor()
        query = sql.SQL("SELECT convoid, convotitle FROM aiconvos WHERE username = %s")
        cursor.execute(query, (username,))
        convos = cursor.fetchall()
        newConvos = []
        for convo in convos:
            query = sql.SQL("SELECT * FROM aimessages WHERE convoid = %s ORDER BY sent DESC LIMIT 1")
            cursor.execute(query, (convo[0],))
            messages = cursor.fetchall()
            if messages:
                newConvos.append((convo[0], convo[1], messages[0][1]))
            else:
                now = datetime.now()
                newConvos.append((convo[0], convo[1], now.strftime("%Y-%m-%d %H:%M:%S")))
        cursor.close()
        conn.close()
        return Response(newConvos)
    
    except (Exception, psycopg2.Error) as error:
        print("Error while connecting to PostgreSQL", error)
        return Response("")
    

@api_view(['GET'])
def getAIMessages(request, convoId):
    try:
        conn = psycopg2.connect(
            dbname="Megagram",
            user="postgres",
            password=os.getenv('postgresqlPassword'),
            host="localhost",
            port="5432"
        )
        cursor = conn.cursor()
        query = sql.SQL("SELECT username, messageid, message FROM aimessages WHERE convoid = %s ORDER BY sent")
        cursor.execute(query, (convoId,))
        messages = cursor.fetchall()
        cursor.close()
        conn.close()
        return Response(messages)
    
    except (Exception, psycopg2.Error) as error:
        print("Error while connecting to PostgreSQL", error)
        return Response("")




@api_view(['GET'])
def getAIMessagesWithSent(request, convoId):
    try:
        conn = psycopg2.connect(
            dbname="Megagram",
            user="postgres",
            password=os.getenv('postgresqlPassword'),
            host="localhost",
            port="5432"
        )
        cursor = conn.cursor()
        query = sql.SQL("SELECT username, messageid, message, sent FROM aimessages WHERE convoid = %s ORDER BY sent")
        cursor.execute(query, (convoId,))
        messages = cursor.fetchall()
        cursor.close()
        conn.close()
        return Response(messages)
    
    except (Exception, psycopg2.Error) as error:
        print("Error while connecting to PostgreSQL", error)
        return Response("")

@api_view(['GET'])
def getAllAIConvos(request):
    try:
        conn = psycopg2.connect(
            dbname="Megagram",
            user="postgres",
            password=os.getenv('postgresqlPassword'),
            host="localhost",
            port="5432"
        )
        cursor = conn.cursor()
        query = sql.SQL("SELECT * FROM aiconvos")
        cursor.execute(query)
        convos = cursor.fetchall()
        newConvos = []
        for convo in convos:
            query = sql.SQL("SELECT * FROM aimessages WHERE convoid = %s ORDER BY sent DESC LIMIT 1")
            cursor.execute(query, (convo[0],))
            messages = cursor.fetchall()
            if messages:
                newConvos.append((convo[0], convo[1], convo[2], messages[0][1]))
            else:
                now = datetime.now()
                newConvos.append((convo[0], convo[1], convo[2], now.strftime("%Y-%m-%d %H:%M:%S")))
        cursor.close()
        conn.close()
        return Response(newConvos)
    
    except (Exception, psycopg2.Error) as error:
        print("Error while connecting to PostgreSQL", error)
        return Response("")


@api_view(['GET'])
def getAIConvotitle(request, convoId):
    conn = None
    try:
        conn = psycopg2.connect(
            dbname="Megagram",
            user="postgres",
            password=os.getenv('postgresqlPassword'),
            host="localhost",
            port="5432"
        )
        cursor = conn.cursor()
        query = sql.SQL("SELECT convotitle FROM aiconvos WHERE convoid = %s")
        cursor.execute(query, (convoId,))
        convo = cursor.fetchone()
        if convo:
            return Response(convo[0])
        return Response("")
    except (Exception, psycopg2.Error) as error:
        print("Error while connecting to PostgreSQL", error)
        return Response({"error": "Error while connecting to database"}, status=500)
    finally:
        if conn:
            cursor.close()
            conn.close()
