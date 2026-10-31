import { FC, MouseEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { clsx } from 'clsx';
import OriginWord from 'components/OriginWord';
import { KANJI } from 'components/OriginWord/OriginWord';
import { showKanji } from 'components/OriginWord/kanjiDataFilter';
import Kanji from 'components/Kanji';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { reset as resetKanji } from 'store/modules/kanji';
import { canSpeak, speakJapanese } from 'utils/speech';
import { displaySpelling, formatMeaning } from 'utils/wordDisplay';
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
  next?: StudyWord; // 다음 카드 — 글꼴을 미리 받아 둔다
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
const StudyCard: FC<StudyCardProps> = ({ word, next, onAnswer, isBookmarked, onBookmark }) => {
  const dispatch = useDispatch();
  const [showReading, setShowReading] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const kanjiCursor = useRef(0);
  const speakable = canSpeak();
  const { written, others } = displaySpelling(word);
  // 가나로만 쓰는 단어는 읽기가 본문과 같다
  const hasReading = written !== word.entry;

  // 다음 단어가 그려지기 전에 가린다 — useEffect면 앞 카드의 공개 상태로 한 프레임 보이고, 바로 누른 Space가 앞 카드 기준으로 토글된다
  useLayoutEffect(() => {
    setShowReading(false);
    setShowMeaning(false);
    kanjiCursor.current = 0;
    dispatch(resetKanji());
  }, [word._id, dispatch]);

  // 웹 글꼴은 글자 묶음별로 받는다 — 다음 단어의 글자를 미리 받아 넘길 때 대체 글꼴이 잠깐 보이는 깜빡임을 없앤다
  useEffect(() => {
    if (!next) return;
    document.fonts?.load(`1em 'Noto Sans JP'`, `${next.pron ?? ''}${next.entry}`).catch(() => {});
  }, [next]);

  const allShown = showMeaning && (showReading || !hasReading);

  // 읽기·뜻이 다 보이면 둘 다 가리고, 하나라도 가려져 있으면 둘 다 보인다
  const toggleAll = useCallback(() => {
    setShowReading(!allShown);
    setShowMeaning(!allShown);
  }, [allShown]);

  const speak = useCallback(() => speakJapanese(word.entry), [word.entry]);

  // K를 누를 때마다 단어의 다음 한자 풀이를 연다
  const openNextKanji = useCallback(() => {
    const kanjis = Array.from(written).filter((char) => KANJI.test(char));
    if (kanjis.length === 0) return;
    showKanji(kanjis[kanjiCursor.current % kanjis.length], dispatch);
    kanjiCursor.current += 1;
  }, [written, dispatch]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.repeat || shouldIgnore(event)) return;
      switch (event.code) {
        case 'ArrowRight': onAnswer(true); break;
        case 'ArrowLeft': onAnswer(false); break;
        case 'Space':
        case 'Enter': toggleAll(); break;
        case 'KeyR': if (hasReading) setShowReading((shown) => !shown); break;
        case 'KeyM': setShowMeaning((shown) => !shown); break;
        case 'KeyS': if (speakable) speak(); break;
        case 'KeyB': onBookmark?.(); break;
        case 'KeyK': openNextKanji(); break;
        case 'Escape': dispatch(resetKanji()); break;
        default: return;
      }
      event.preventDefault();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onAnswer, onBookmark, toggleAll, hasReading, speak, speakable, openNextKanji, dispatch]);

  const stop = (action: () => void) => (event: MouseEvent) => {
    event.stopPropagation();
    action();
  };

  const revealed = showReading || showMeaning;

  return (
    <div className={styles.wrapper}>
      <Kanji />
      <div className={styles.card} onClick={toggleAll} role="group" aria-label="단어 카드 — 누르면 읽기와 뜻을 보이거나 가려요">
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
        <div className={styles.headword}>
          <OriginWord word={written} />
        </div>
        {/* 뜻 칸은 높이가 정해져 있다 — 뜻이 여러 줄이어도 표제어 자리가 단어마다 같다 */}
        <div className={clsx(styles.meaning, !showMeaning && styles.concealed)} aria-hidden={!showMeaning}>
          {!!word.parts?.length && (
            <div className={styles.parts}>
              {word.parts.map((part) => <span key={part} className={styles.part}>{part}</span>)}
            </div>
          )}
          <ul className={styles.means}>
            {word.means.map((mean, index) => <li key={index}>{formatMeaning(mean)}</li>)}
          </ul>
          {/* 다른 표기는 뜻과 함께 공개한다 — 표제어 칸에 두면 단어마다 표제어 자리가 달라진다 */}
          {others.length > 0 && (
            <p className={styles.others}>다른 표기 <span lang="ja">{others.join('・')}</span></p>
          )}
        </div>

        {!revealed && <p className={styles.tapHint}>카드를 누르면 읽기와 뜻이 보여요</p>}
      </div>

      <div className={styles.controls}>
        <div className={styles.row}>
          <DefaultButton
            className={styles.revealBtn}
            pressed={showReading}
            onClick={() => setShowReading((shown) => !shown)}
            disabled={!hasReading}
            title={hasReading ? undefined : '가나로 쓰는 단어라 읽기가 같아요'}
            aria-keyshortcuts="R"
          >
            요미가나
          </DefaultButton>
          <DefaultButton
            className={styles.revealBtn}
            pressed={showMeaning}
            onClick={() => setShowMeaning((shown) => !shown)}
            aria-keyshortcuts="M"
          >
            한글 뜻
          </DefaultButton>
        </div>
        <div className={styles.row}>
          <DefaultButton className={clsx(styles.answerBtn, styles.unknown)} onClick={() => onAnswer(false)} aria-keyshortcuts="ArrowLeft">
            <span className={styles.key} aria-hidden="true">←</span>몰라요
          </DefaultButton>
          <DefaultButton className={clsx(styles.answerBtn, styles.know)} onClick={() => onAnswer(true)} aria-keyshortcuts="ArrowRight">
            알아요<span className={styles.key} aria-hidden="true">→</span>
          </DefaultButton>
        </div>
        <p className={styles.shortcutHint} aria-hidden="true">
          Space 공개·가리기 · ← 몰라요 · → 알아요 · R 요미가나 · M 뜻 · K 한자 풀이{speakable && ' · S 발음'}{onBookmark && ' · B 북마크'}
        </p>
      </div>
    </div>
  );
};

export default StudyCard;
