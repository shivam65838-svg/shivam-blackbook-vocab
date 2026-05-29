import vocabularyData from "./vocabulary.json";

export const VOCABULARY = vocabularyData.map((item) => ({
  id: item.id?.toString() || item.word.toLowerCase(),
  word: item.word,
  hindiMeaning: item.meaning,
  mnemonic: item.mnemonic,
  example: item.example || "",
  category: item.category?.trim() || "Words",
  synonyms: Array.isArray(item.synonyms) ? item.synonyms : [],
  antonyms: Array.isArray(item.antonyms) ? item.antonyms : [],
}));
