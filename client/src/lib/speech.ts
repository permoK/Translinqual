// Speech recognition functionality
export async function startSpeechRecognition(
  language: string,
  onResult: (text: string) => void,
  onError: (error: string) => void
): Promise<() => void> {
  if (!('webkitSpeechRecognition' in window)) {
    onError("Speech recognition is not supported in this browser");
    return () => {};
  }

  // @ts-ignore - The webkitSpeechRecognition is non-standard
  const recognition = new webkitSpeechRecognition();
  
  // Map our language codes to BCP 47 language tags
  // Default to English if no match
  const languageMap: Record<string, string> = {
    "eng": "en-US",
    "swa": "sw-KE", // Swahili (Kenya)
    // For languages without official support, we might need to use closest matches
    // or English as fallback
    "mas": "en-KE", // Fallback for Maasai
    "kik": "en-KE", // Fallback for Kikuyu
    "luo": "en-KE", // Fallback for Luo
    "kam": "en-KE"  // Fallback for Kamba
  };
  
  recognition.lang = languageMap[language] || 'en-US';
  recognition.continuous = true;
  recognition.interimResults = false;
  
  recognition.onresult = (event: any) => {
    const result = event.results[event.results.length - 1];
    const transcript = result[0].transcript;
    onResult(transcript);
  };
  
  recognition.onerror = (event: any) => {
    onError(`Speech recognition error: ${event.error}`);
  };
  
  recognition.start();
  
  // Return a function to stop listening
  return () => {
    recognition.stop();
  };
}

// Text-to-speech functionality
export function speakText(text: string, language: string): void {
  if (!('speechSynthesis' in window)) {
    console.error("Text-to-speech is not supported in this browser");
    return;
  }
  
  // Stop any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Map our language codes to BCP 47 language tags
  const languageMap: Record<string, string> = {
    "eng": "en-US",
    "swa": "sw", // Swahili
    // Fallbacks for unsupported languages
    "mas": "en-KE", // Fallback for Maasai
    "kik": "en-KE", // Fallback for Kikuyu
    "luo": "en-KE", // Fallback for Luo
    "kam": "en-KE"  // Fallback for Kamba
  };
  
  utterance.lang = languageMap[language] || 'en-US';
  
  // Find a suitable voice if available
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang === utterance.lang);
  if (voice) {
    utterance.voice = voice;
  }
  
  window.speechSynthesis.speak(utterance);
}

// Audio recording functionality
export async function startAudioRecording(): Promise<{
  stop: () => Promise<{ blob: Blob; url: string; duration: number }>;
  cancel: () => void;
}> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Audio recording is not supported in this browser");
  }
  
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  const audioChunks: Blob[] = [];
  const startTime = Date.now();
  
  mediaRecorder.addEventListener("dataavailable", (event) => {
    audioChunks.push(event.data);
  });
  
  mediaRecorder.start();
  
  const stop = () => {
    return new Promise<{ blob: Blob; url: string; duration: number }>((resolve) => {
      mediaRecorder.addEventListener("stop", () => {
        const duration = (Date.now() - startTime) / 1000; // in seconds
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        
        resolve({
          blob: audioBlob,
          url: audioUrl,
          duration
        });
      });
      
      mediaRecorder.stop();
    });
  };
  
  const cancel = () => {
    if (mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    
    stream.getTracks().forEach(track => track.stop());
  };
  
  return { stop, cancel };
}
