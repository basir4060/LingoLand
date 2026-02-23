import React from "react";
import { Globe } from "lucide-react";
import { motion } from "framer-motion";

interface LanguagePickerProps {
  onSelect: (lang: "en" | "es" | "zh") => void;
  onBack: () => void;
}

const LanguagePicker: React.FC<LanguagePickerProps> = ({ onSelect, onBack }) => {
  const languages = [
    { code: "en", label: "US English" },
    { code: "es", label: "ES Spanish" },
    { code: "zh", label: "CN Mandarin" },
  ] as const;

  return (
    <div className="min-h-screen pt-32 flex items-center justify-center bg-[#F0F4F8] relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 p-4 rounded-2xl">
            <Globe size={32} className="text-primary" />
          </div>
        </div>

        <h1 className="font-heading font-black text-3xl text-gray-800 mb-3">
          Choose a Language
        </h1>

        <p className="text-gray-500 font-semibold mb-8">
          Pick the language you want to learn in this adventure.
        </p>

        <div className="space-y-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onSelect(lang.code as any)}
              className="w-full py-4 rounded-xl bg-gray-100 hover:bg-primary hover:text-white transition-all font-bold flex items-center justify-center gap-3 text-lg"
            >
              <span className="text-gray-800 uppercase text-sm mr-2">{lang.code}</span>
              {lang.label.split(" ")[1]}
            </button>
          ))}
          <button
            onClick={onBack}
            className="w-full py-4 mt-2 rounded-xl bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all font-bold flex items-center justify-center text-md"
          >
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LanguagePicker;
