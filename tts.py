import requests
import json
import sys
from tts import generate_and_download_audio

# 全局变量存储API key
MINIMAX_API_KEY = None

def get_tts_url(text, voice_id=1683, speed_factor=1, pitch_factor=0, volume_change_dB=0, emotion=17):
    """获取音频文件的URL"""
    url = "https://u95167-bd74-2aef8085.westx.seetacloud.com:8443/flashsummary/tts"
    
    headers = {
        "accept": "application/json, text/plain, */*",
        "content-type": "application/json",
        "x-checkout-header": "_checkout",
        "x-client-header": "b75b7a760ee79c6a2fe6c1367d5f5fd9"
    }
    
    data = {
        "voice_id": voice_id,
        "to_lang": "auto",
        "format": "mp3",
        "speed_factor": speed_factor,
        "pitch_factor": pitch_factor,
        "volume_change_dB": volume_change_dB,
        "emotion": emotion,
        "text": text,
        "code": ""
    }
    
    params = {
        "token": "07c2a52f05ec47c0baaf89bfdf5ef7d5"
    }
    
    response = requests.post(url, headers=headers, params=params, json=data)
    return response.json()

def download_audio(url, port, voice_path, output_path):
    """下载音频文件"""
    download_url = f"{url}:{port}/flashsummary/retrieveFileData"
    
    params = {
        "stream": "True",
        "token": "07c2a52f05ec47c0baaf89bfdf5ef7d5",
        "voice_audio_path": voice_path
    }
    
    headers = {
        "accept": "*/*",
        "range": "bytes=0-"
    }
    
    response = requests.get(download_url, headers=headers, params=params)
    
    if response.status_code == 200:
        with open(output_path, 'wb') as f:
            f.write(response.content)
        return True
    return False

def generate_and_download_audio(text, voice_id, speed, vol, pitch, output_path, group_id,emotion=None):
    """生成音频并下载到本地"""
    if not MINIMAX_API_KEY:
        raise ValueError("MiniMax API key not configured")
        
    url = f"https://api.minimax.chat/v1/t2a_v2?GroupId={group_id}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {MINIMAX_API_KEY}"
    }
    data = {
        "model": "speech-01-turbo",
        "text": text,
        "stream": False,
        "voice_setting": {
            "voice_id": voice_id,
            "speed": speed,
            "vol": vol,
            "pitch": pitch,
        },
        "audio_setting": {
            "sample_rate": 32000,
            "bitrate": 128000,
            "format": "mp3"
        }
    }
    if emotion:
        data["audio_setting"]["emotion"] = emotion
    
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        response_data = response.json()
        if "data" in response_data and "audio" in response_data["data"]:
            audio_hex = response_data["data"]["audio"]
            audio_bytes = bytes.fromhex(audio_hex)
            with open(output_path, 'wb') as f:
                f.write(audio_bytes)
            return True
    print(response.status_code)
    print(response.json())
    return False

def main():
    if len(sys.argv) != 5:
        print("Usage: python tts.py <text> <voice_id> <output_path> <minimax_token>")
        sys.exit(1)

    text = sys.argv[1]
    voice_id = sys.argv[2]
    output_path = sys.argv[3]
    minimax_token = sys.argv[4]

    # 设置 API key
    global MINIMAX_API_KEY
    MINIMAX_API_KEY = minimax_token

    # 生成音频
    success = generate_and_download_audio(
        text=text,
        voice_id=voice_id,
        speed=1.0,
        vol=1.0,
        pitch=0,
        output_path=output_path,
        group_id="123456"  # 根据实际需求修改
    )

    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()