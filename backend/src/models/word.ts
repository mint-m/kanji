import mongoose from "mongoose";

// Define Schemes
const wordSchema = new mongoose.Schema(
  {
    origin_entry_id: { type: String, required: true, unique: true },
    entry: { type: String, required: true },
    level: { type: String, default: false },
    parts: { type: String, default: false },
    pron: { type: String, default: false },
    means: { type: Array, default: false },
  },
  {
    timestamps: true,
  }
);

// Create Model & Export
const Word = mongoose.model("Word", wordSchema, "word");

export default Word;
