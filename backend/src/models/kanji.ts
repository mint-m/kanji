import mongoose from 'mongoose';

export interface KanjiDocument extends mongoose.Document {
  character: string;
  onRead: string;
  kunRead: string;
  koreanPron: string;
  jlptLevel: string;
  meanings: string[];
}

const kanjiSchema = new mongoose.Schema<KanjiDocument>({
  character: { type: String, required: true, unique: true },
  onRead: { type: String, default: '' },
  kunRead: { type: String, default: '' },
  koreanPron: { type: String, default: '' },
  jlptLevel: { type: String, default: '' },
  meanings: { type: [String], default: [] },
});

kanjiSchema.index({ character: 1 }, { unique: true });

const Kanji = mongoose.model<KanjiDocument>('Kanji', kanjiSchema, 'kanji');
export default Kanji;
