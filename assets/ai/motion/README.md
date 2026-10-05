Use these state names directly in the React Native agent.
idle = floating / ready
listening = microphone active + pulse
thinking = question understood
searching = database/API lookup
processing = preparing response
speaking = TTS/voice waveform
success = completed answer
error = API/network failure

Lock microphone during thinking, searching, processing and speaking.
Unlock it again at success/error.
