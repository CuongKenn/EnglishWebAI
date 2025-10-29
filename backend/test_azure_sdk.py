# Test Azure Speech SDK
import azure.cognitiveservices.speech as speechsdk
import os

# Config
speech_key = os.getenv('AZURE_SPEECH_KEY', 'YOUR_KEY')
region = os.getenv('AZURE_SPEECH_REGION', 'eastasia')
reference_text = "Hello. How are you today?"

print(f"Key present: {bool(speech_key)}, Region: {region}")
print(f"Reference text: {reference_text}")

# Speech config
speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=region)

# Audio file - test với file có sẵn
audio_file = "./media/speaking_submissions/student_11_ex_14_20251029_060453.webm"
print(f"Audio file: {audio_file}")

# Convert audio to WAV first with ffmpeg
import subprocess
import tempfile
fd, wav_path = tempfile.mkstemp(suffix='.wav')
os.close(fd)

cmd = ['ffmpeg', '-y', '-i', audio_file, '-ac', '1', '-ar', '16000', '-f', 'wav', '-acodec', 'pcm_s16le', wav_path]
subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print(f"Converted to WAV: {wav_path}")

# Audio config
audio_config = speechsdk.audio.AudioConfig(filename=wav_path)

# Pronunciation config
pron_config = speechsdk.PronunciationAssessmentConfig(
    reference_text=reference_text,
    grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
    granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
    enable_miscue=True
)

# Recognizer
speech_config.speech_recognition_language = 'en-US'
recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)
pron_config.apply_to(recognizer)

print("Recognizing...")
result = recognizer.recognize_once()

print(f"Result reason: {result.reason}")

if result.reason == speechsdk.ResultReason.RecognizedSpeech:
    print(f"Recognized: {result.text}")
    
    pron_result = speechsdk.PronunciationAssessmentResult(result)
    print(f"Accuracy: {pron_result.accuracy_score}")
    print(f"Fluency: {pron_result.fluency_score}")
    print(f"Completeness: {pron_result.completeness_score}")
    print(f"Pronunciation: {pron_result.pronunciation_score}")
elif result.reason == speechsdk.ResultReason.NoMatch:
    print(f"No match: {result.no_match_details}")
elif result.reason == speechsdk.ResultReason.Canceled:
    cancellation = result.cancellation_details
    print(f"Canceled: {cancellation.reason}")
    if cancellation.reason == speechsdk.CancellationReason.Error:
        print(f"Error: {cancellation.error_details}")

# Cleanup
os.unlink(wav_path)
