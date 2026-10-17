import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Volume2, Sparkles, AlertCircle } from 'lucide-react';

export default function VoiceRecorder({ onAudioRecorded, onAudioRemoved, onTranscriptAppend }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const audioElementRef = useRef(null);
  const speechRecognizerRef = useRef(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognizer = new SpeechRecognition();
        recognizer.continuous = true;
        recognizer.interimResults = true;
        recognizer.lang = 'en-US';

        recognizer.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const currentText = finalTranscript || interimTranscript;
          if (currentText) {
            setLiveTranscript(currentText);
            if (onTranscriptAppend && finalTranscript) {
              onTranscriptAppend(finalTranscript.trim());
            }
          }
        };

        recognizer.onerror = (e) => {
          console.warn('Speech recognition warning/error:', e.error);
        };

        speechRecognizerRef.current = recognizer;
      } catch (err) {
        console.warn('Speech recognition setup failed:', err);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [onTranscriptAppend]);

  // Start Recording
  const startRecording = async () => {
    setPermissionError(null);
    setAudioUrl(null);
    setLiveTranscript('');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsRecording(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (onAudioRecorded) {
          onAudioRecorded(url, liveTranscript);
        }
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

      // Start speech recognizer if available
      if (speechRecognizerRef.current) {
        try {
          speechRecognizerRef.current.start();
        } catch {
          // already started or not allowed
        }
      }

    } catch (err) {
      console.error('Microphone access denied:', err);
      setPermissionError('Microphone access was denied or is unavailable. Please grant permission in your browser.');
      setIsRecording(false);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (speechRecognizerRef.current) {
      try {
        speechRecognizerRef.current.stop();
      } catch {
        // already stopped
      }
    }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  // Delete Audio Note
  const removeRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setLiveTranscript('');
    setRecordingDuration(0);
    setIsPlaying(false);
    if (onAudioRemoved) onAudioRemoved();
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div data-ui="true" className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-navy-900">Audio Voice Note</span>
            <span className="ml-2 text-[10px] text-slate-500 font-medium">(Speech-to-Text &amp; Voice Memo)</span>
          </div>
        </div>

        {isRecording && (
          <span className="flex items-center gap-1.5 text-xs tabular-nums font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            REC {formatTime(recordingDuration)} / 1:00
          </span>
        )}
      </div>

      {permissionError && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-xs text-amber-800 mb-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* When no recording and not recording */}
      {!isRecording && !audioUrl && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <p className="text-xs text-slate-500">
            Click to record hands-free voice notes or describe the hazard verbally.
          </p>
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-lg text-xs font-bold hover:text-teal-700 transition-colors"
          >
            <Mic className="w-4 h-4 text-red-500" />
            <span>Record Voice Note</span>
          </button>
        </div>
      )}

      {/* While Recording */}
      {isRecording && (
        <div className="space-y-3 pt-2">
          {/* Animated sound wave bars */}
          <div className="flex items-center justify-center gap-1 h-8 bg-white border border-red-100 rounded-lg p-2">
            {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65, 90, 45].map((h, idx) => (
              <span
                key={idx}
                className="w-1 bg-red-500 rounded-full"
                style={{
                  height: `${h}%`,
                  transition: 'height 0.2s ease-out'
                }}
              />
            ))}
          </div>

          {liveTranscript && (
            <div className="bg-teal-50 border border-teal-200 p-2 rounded-lg text-xs text-teal-900 flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Transcribing: </span>
                <span className="italic">"{liveTranscript}"</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Done Recording</span>
            </button>
          </div>
        </div>
      )}

      {/* After Recording Completed: Playback and Controls */}
      {audioUrl && !isRecording && (
        <div className="pt-2 space-y-3">
          <audio
            ref={audioElementRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2.5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center transition-colors"
                title={isPlaying ? 'Pause' : 'Play voice note'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
                  <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Voice Memo Attached</span>
                </div>
                <p className="text-[10px] text-slate-500 tabular-nums">
                  Recorded Duration: {formatTime(recordingDuration || 15)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={removeRecording}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                title="Discard audio note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
