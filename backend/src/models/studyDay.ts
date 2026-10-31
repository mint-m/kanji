import mongoose from 'mongoose';
import { StudyDayDocument, StudyDayModel } from '../interfaces/studyDay';
import { toKstDate } from '../utils/date';

// 날짜별 응답 수 — 홈의 학습 잔디. 사용자·한국 날짜당 한 건이다.
// 사용자 문서에 날짜별로 쌓으면 요청마다 읽는 사용자 문서가 끝없이 커진다
const studyDaySchema = new mongoose.Schema<StudyDayDocument>(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    date: { type: String, required: true },
    count: { type: Number, required: true, default: 0, min: 0 },
  },
  { versionKey: false }
);

studyDaySchema.index({ user_id: 1, date: 1 }, { unique: true });

// 응답 1회를 그날(한국 시간)에 더한다 — 고유 인덱스와 같은 조건의 upsert라 동시에 와도 한 건으로 모인다
studyDaySchema.statics.record = async function (userId: mongoose.Types.ObjectId, now: Date = new Date()): Promise<void> {
  await this.updateOne({ user_id: userId, date: toKstDate(now) }, { $inc: { count: 1 } }, { upsert: true });
};

// 오늘까지 최근 days일 중 답한 날만, 날짜 순
studyDaySchema.statics.findRecent = function (userId: mongoose.Types.ObjectId, days: number, now: Date = new Date()) {
  const from = toKstDate(new Date(now.getTime() - (days - 1) * 86_400_000));
  return this.find({ user_id: userId, date: { $gte: from } }, { _id: 0, date: 1, count: 1 }).sort({ date: 1 }).lean();
};

const StudyDay = mongoose.model<StudyDayDocument, StudyDayModel>('StudyDay', studyDaySchema, 'study_day');

export default StudyDay;
