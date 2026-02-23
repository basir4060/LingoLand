export function speak(text: string, lang?: string) {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    if (lang) {
      utterance.lang = lang;
    }
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("Speech synthesis not supported in this environment");
  }
}
