// 일본어 발음 듣기 — 브라우저 음성 합성(Web Speech API).
// 한자 표기 대신 읽기(가나)를 읽혀 음성 엔진의 오독을 피한다
export const canSpeak = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';

export const speakJapanese = (text: string): void => {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.9;
  const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith('ja'));
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
};
