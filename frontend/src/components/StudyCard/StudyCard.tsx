import { FC, MouseEvent, useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { clsx } from 'clsx';
import OriginWord from 'components/OriginWord';
import Kanji from 'components/Kanji';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { reset as resetKanji } from 'store/modules/kanji';
import { canSpeak, speakJapanese } from 'utils/speech';
import * as styles from './StudyCard.css';

export interface StudyWord {
  _id: string;
  entry: string; // 읽기(가나)
  pron?: string; // 한자 표기
  means: string[];
  parts?: string[];
}

interface StudyCardProps {
  word: StudyWord;
  onAnswer: (know: boolean) => void;
  isBookmarked?: boolean;
  onBookmark?: () => void;
}

// 입력 중이거나 버튼에 포커스가 있을 때(Space·Enter는 그 버튼을 누른다)는 단축키를 쓰지 않는다
const shouldIgnore = (event: KeyboardEvent) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return true;
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest('input, textarea, select, [contenteditable="true"]')) return true;
  return (event.code === 'Space' || event.code === 'Enter') && !!target?.closest('button, a');
};

// 진도 학습·오늘의 복습·북마크 학습이 함께 쓰는 단어 카드와 응답 버튼
const StudyCard: FC<StudyCardProps> = ({ word, onAnswer, isBookmarked, onBookmark }) => {
  const dispatch = useDispatch();
  const [showReading, setShowReading] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const speakable = canSpeak();
  // 가나로만 쓰는 단어는 읽기가 본문과 같다
  const hasReading = Boolean(word.pron) && word.pron !== word.entry;

  useEffect(() => {
    setShowReading(false);
    setShowMeaning(false);
    dispatch(resetKanji());
  }, [word._id, dispatch]);

  const revealAll = useCallback(() => {
    setShowReading(true);
    setShowMeaning(true);
  }, []);

  const speak = useCallback(() => speakJapanese(word.entry), [word.entry]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.repeat || shouldIgnore(event)) return;
      switch (event.code) {
        case 'ArrowRight': onAnswer(true); break;
        case 'ArrowLeft': onAnswer(false); break;
        case 'Space':
        case 'Enter': revealAll(); break;
        case 'KeyR': setShowReading(true); break;
        case 'KeyM': setShowMeaning(true); break;
        case 'KeyS': if (speakable) speak(); break;
        case 'KeyB': onBookmark?.(); break;
        default: return;
      }
      event.preventDefault();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onAnswer, onBookmark, revealAll, speak, speakable]);

  const stop = (action: () => void) => (event: MouseEvent) => {
    event.stopPropagation();
    action();
  };

  const revealed = showReading || showMeaning;

  return (
    <div className={styles.wrapper}>
      <Kanji />
      <div className={styles.card} onClick={revealAll} role="group" aria-label="단어 카드 — 누르면 읽기와 뜻이 보여요">
        <div className={styles.tools}>
          {speakable && (
            <button type="button" className={styles.toolBtn} onClick={stop(speak)} aria-label="발음 듣기" aria-keyshortcuts="S">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" />
              </svg>
            </button>
          )}
          {onBookmark && (
            <button
              type="button"
              className={styles.toolBtn}
              onClick={stop(onBookmark)}
              aria-pressed={!!isBookmarked}
              aria-label={isBookmarked ? '북마크 해제' : '북마크'}
              aria-keyshortcuts="B"
            >
              {isBookmarked ? '★' : '☆'}
            </button>
          )}
        </div>

        <div className={clsx(styles.reading, !(showReading && hasReading) && styles.concealed)} lang="ja" aria-hidden={!(showReading && hasReading)}>
          {word.entry}
        </div>
        <OriginWord word={word.pron || word.entry} />
        <div className={clsx(styles.meaning, !showMeaning && styles.concealed)} aria-hidden={!showMeaning}>
          {!!word.parts?.length && (
            <div className={styles.parts}>
              {word.parts.map((part) => <span key={part} className={styles.part}>{part}</span>)}
            </div>
          )}
          <ul className={styles.means}>
            {word.means.map((mean, index) => <li key={index}>{mean}</li>)}
          </ul>
        </div>

        {!revealed && <p className={styles.tapHint}>카드를 누르면 읽기와 뜻이 보여요</p>}
      </div>

      <div className={styles.controls}>
        <div className={styles.row}>
          <DefaultButton
            className={styles.revealBtn}
            pressed={showReading}
            onClick={() => setShowReading(true)}
            disabled={!hasReading}
            title={hasReading ? undefined : '가나로 쓰는 단어라 읽기가 같아요'}
            aria-keyshortcuts="R"
          >
            요미가나
          </DefaultButton>
          <DefaultButton className={styles.revealBtn} pressed={showMeaning} onClick={() => setShowMeaning(true)} aria-keyshortcuts="M">
            한글 뜻
          </DefaultButton>
        </div>
        <div className={styles.row}>
          <DefaultButton className={styles.answerBtn} variant="unknown" onClick={() => onAnswer(false)} aria-keyshortcuts="ArrowLeft">
            <span className={styles.key} aria-hidden="true">←</span>몰라요
          </DefaultButton>
          <DefaultButton className={styles.answerBtn} variant="know" onClick={() => onAnswer(true)} aria-keyshortcuts="ArrowRight">
            알아요<span className={styles.key} aria-hidden="true">→</span>
          </DefaultButton>
        </div>
        <p className={styles.shortcutHint} aria-hidden="true">
          Space 공개 · ← 몰라요 · → 알아요 · R 요미가나 · M 뜻{speakable && ' · S 발음'}{onBookmark && ' · B 북마크'}
        </p>
      </div>
    </div>
  );
};

export default StudyCard;
