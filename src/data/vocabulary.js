import vocabularyData from './vocabulary.json';

export const VOCABULARY = vocabularyData.map(item => ({
  id: item.word.toLowerCase(),
  word: item.word,
  hindiMeaning: item.meaning,
  mnemonic: item.mnemonic,
  example: item.example || '',
  category: 'Vocabulary'
}));