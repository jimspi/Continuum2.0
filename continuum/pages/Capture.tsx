import React, { useState, useRef } from 'react';
import { useStore } from '../contexts/StoreContext';
import { analyzeContent, updateUserProfile } from '../services/geminiService';
import { Card, Button, Textarea } from '../components/UI';
import { UploadCloud, FileText, Loader2, CheckCircle2, AlertCircle, Mic, Trash2 } from 'lucide-react';

export const Capture: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { profile, addMemory, updateProfile } = useStore();
  
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<string>(''); 
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>();

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setAudioBlob(null); // Clear audio if file selected
    }
  };

  const convertFileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Audio Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setFile(null); // Clear file if recording
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSubmit = async () => {
    if ((!text.trim() && !file && !audioBlob) || !profile) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // 1. Prepare Data
      setStep('analyzing content');
      let fileData = undefined;
      let type: 'text' | 'file' | 'audio' = 'text';
      let contentSummary = text;

      if (file) {
        const base64 = await convertFileToBase64(file);
        fileData = { data: base64, mimeType: file.type };
        type = 'file';
        contentSummary = `File Upload: ${file.name}`;
      } else if (audioBlob) {
        const base64 = await convertFileToBase64(audioBlob);
        fileData = { data: base64, mimeType: 'audio/webm' };
        type = 'audio';
        contentSummary = 'Voice Recording';
      }

      // 2. Analyze
      const analysis = await analyzeContent(text, fileData);
      
      // Save to memory immediately
      addMemory({
        id: Date.now().toString(),
        content: contentSummary,
        originalFileName: file?.name,
        type: type,
        createdAt: new Date().toISOString(),
        insights: analysis.topics
      });

      // 3. Update Profile
      setStep('updating profile');
      const newProfile = await updateUserProfile(profile, analysis);
      updateProfile(newProfile);

      // NOTE: We deliberately do NOT generate recommendations here to reduce noise.
      // Recommendations are generated via the Daily Briefing or manually.

      setIsProcessing(false);
      onComplete();
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while processing.");
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in duration-500">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <div className="text-center">
        <h3 className="font-medium text-gray-900">Processing Memory</h3>
        <p className="text-sm text-gray-500 mt-1 capitalize">Step: {step}</p>
      </div>
    </div>
  );

  if (isProcessing) return <LoadingState />;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">New Memory</h1>
        <p className="text-gray-500 mt-1">Add a note, upload a document, or record your voice to update your continuum.</p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Text Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Thought / Note</label>
          <Textarea 
            placeholder="I'm planning a trip to Japan next spring..." 
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isProcessing}
          />
        </div>

        {/* Input Method Tabs */}
        <div className="grid grid-cols-2 gap-4">
          {/* File Upload */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Attachment</label>
            <div 
              onClick={() => !isRecording && fileInputRef.current?.click()}
              className={`h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                file 
                  ? 'border-blue-500 bg-blue-50' 
                  : isRecording || audioBlob ? 'opacity-50 cursor-not-allowed border-gray-200' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".txt,.md,.pdf" 
                onChange={handleFileChange}
                disabled={isRecording || !!audioBlob}
              />
              {file ? (
                <div className="text-center px-2">
                   <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                   <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{file.name}</p>
                   <button 
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="mt-1 text-xs text-red-600 hover:underline"
                   >
                     Remove
                   </button>
                </div>
              ) : (
                <div className="text-center">
                  <UploadCloud className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Upload File</p>
                  <p className="text-xs text-gray-400">TXT, MD, PDF</p>
                </div>
              )}
            </div>
          </div>

          {/* Audio Recorder */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Voice Note</label>
            <div className={`h-32 border-2 rounded-lg flex flex-col items-center justify-center transition-all ${
              isRecording 
                ? 'border-red-500 bg-red-50' 
                : audioBlob 
                  ? 'border-blue-500 bg-blue-50' 
                  : file 
                    ? 'opacity-50 cursor-not-allowed border-gray-200 border-dashed' 
                    : 'border-gray-200 border-dashed hover:border-gray-300 hover:bg-gray-50'
            }`}>
              {isRecording ? (
                <div className="text-center">
                  <div className="mb-2 animate-pulse">
                    <div className="w-3 h-3 bg-red-500 rounded-full mx-auto" />
                  </div>
                  <p className="text-red-600 font-mono font-medium text-lg">{formatTime(recordingTime)}</p>
                  <button 
                    onClick={stopRecording} 
                    className="mt-2 text-xs font-medium bg-white border border-red-200 text-red-600 px-3 py-1 rounded-full hover:bg-red-50"
                  >
                    Stop Recording
                  </button>
                </div>
              ) : audioBlob ? (
                <div className="text-center">
                  <CheckCircle2 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Audio Recorded</p>
                  <button 
                    onClick={() => setAudioBlob(null)} 
                    className="mt-2 text-xs text-red-600 hover:underline flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              ) : (
                <button 
                  onClick={startRecording} 
                  disabled={!!file}
                  className="text-center w-full h-full flex flex-col items-center justify-center"
                >
                  <Mic className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Record Audio</p>
                  <p className="text-xs text-gray-400">Tap to start</p>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSubmit} 
            disabled={(!text && !file && !audioBlob) || isProcessing || isRecording}
            className="w-full md:w-auto"
          >
            Analyze & Save Memory
          </Button>
        </div>
      </Card>
      
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400">
          Continuum only updates your profile. Recommendations are generated in your Daily Briefing.
        </p>
      </div>
    </div>
  );
};