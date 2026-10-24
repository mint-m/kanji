import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from 'store';
import StudyCard from '../components/StudyCard';

const WORD = { _id: 'w1', entry: 'がくせい', pron: '学生', means: ['학생'], parts: ['명사'] };

const renderCard = (props: Partial<Parameters<typeof StudyCard>[0]> = {}) => {
  const onAnswer = jest.fn();
  const onBookmark = jest.fn();
  render(
    <Provider store={store}>
      <StudyCard word={WORD} onAnswer={onAnswer} onBookmark={onBookmark} isBookmarked={false} {...props} />
    </Provider>
  );
  return { onAnswer, onBookmark };
};

const press = (code: string, target: Element | Window = window) => fireEvent.keyDown(target, { code });

// 숨긴 뜻 목록은 aria-hidden이라 역할 조회에서 빠진다
const meaningShown = () => screen.queryAllByRole('listitem').length > 0;

describe('StudyCard', () => {
  it('처음에는 읽기·뜻을 숨기고, Space로 둘 다 공개한다', () => {
    renderCard();
    expect(meaningShown()).toBe(false);
    expect(screen.getByText('がくせい')).toHaveAttribute('aria-hidden', 'true');
    press('Space');
    expect(meaningShown()).toBe(true);
    expect(screen.getByText('がくせい')).toHaveAttribute('aria-hidden', 'false');
  });

  it('카드를 누르면 공개한다', () => {
    renderCard();
    fireEvent.click(screen.getByRole('group'));
    expect(meaningShown()).toBe(true);
  });

  it('→ 알아요, ← 몰라요, B 북마크', () => {
    const { onAnswer, onBookmark } = renderCard();
    press('ArrowRight');
    press('ArrowLeft');
    press('KeyB');
    expect(onAnswer.mock.calls).toEqual([[true], [false]]);
    expect(onBookmark).toHaveBeenCalledTimes(1);
  });

  it('버튼으로도 답한다 (화살표 표시는 버튼 이름에 섞이지 않는다)', () => {
    const { onAnswer } = renderCard();
    fireEvent.click(screen.getByRole('button', { name: '알아요' }));
    fireEvent.click(screen.getByRole('button', { name: '몰라요' }));
    expect(onAnswer.mock.calls).toEqual([[true], [false]]);
  });

  it('입력 중이거나 버튼에서 누른 Space는 단축키로 처리하지 않는다', () => {
    const { onAnswer } = renderCard();
    const input = document.createElement('input');
    document.body.appendChild(input);
    press('ArrowRight', input);
    press('Space', screen.getByRole('button', { name: '한글 뜻' }));
    expect(onAnswer).not.toHaveBeenCalled();
    expect(meaningShown()).toBe(false);
    input.remove();
  });

  it('가나로만 쓰는 단어는 요미가나 버튼을 끈다', () => {
    renderCard({ word: { _id: 'w2', entry: 'ありがとう', pron: '', means: ['고마워'] } });
    expect(screen.getByRole('button', { name: '요미가나' })).toBeDisabled();
  });

  it('한자 글자는 누를 수 있는 버튼이다 (풀이는 누를 때만 조회)', () => {
    renderCard();
    expect(screen.getByRole('button', { name: '学 한자 풀이 보기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '生 한자 풀이 보기' })).toBeInTheDocument();
  });
});
