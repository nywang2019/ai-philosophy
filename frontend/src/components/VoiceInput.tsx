import { useState, useRef, useCallback } from "react";

interface Props {
  onResult: (text: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRec = any;

const VoiceInput: React.FC<Props> = ({ onResult }) => {
  const [listening, setListening] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const recognitionRef = useRef<AnySpeechRec | null>(null);

  const startListen = useCallback(() => {
    const win = window as unknown as Record<string, unknown>;
    const SR = (win.SpeechRecognition || win.webkitSpeechRecognition) as new () => AnySpeechRec;
    if (!SR) { setUnsupported(true); return; }

    const rec = new SR();
    rec.lang = "zh-CN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e: AnySpeechRec) => {
      const text = e.results?.[0]?.[0]?.transcript || "";
      if (text) onResult(text);
      setListening(false);
    };

    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [onResult]);

  const stopListen = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  if (unsupported) return null;

  return (
    <button
      type="button"
      className={`voice-btn ${listening ? "listening" : ""}`}
      onClick={listening ? stopListen : startListen}
      title={listening ? "停止录音" : "语音输入"}
    >
      {listening ? "⏹" : "🎤"}
    </button>
  );
};

export default VoiceInput;
