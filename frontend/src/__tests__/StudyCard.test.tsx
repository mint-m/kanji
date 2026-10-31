import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from 'store';
import { api } from '../services/apiClient';
import StudyCard from '../components/StudyCard';

jest.mock('../services/apiClient', () => ({ api: { get: jest.fn() } }));

// 学은 사전에 있고 生은 없다 (CRA는 테스트마다 mock 구현을 지우므로 beforeEach에서 정한다)
const mockKanjiSearch = () => (api.get as jest.Mock).mockImplementation((_url: string, { params }: { params: { kanji: string } }) => Promise.resolve(
  params.kanji === '学'
    ? { searchResult: [{ handleEntry: '学', expAudioRead: 'ガク', expMeaningRead: 'まなぶ', expKoreanPron: '배울 학', frequencyAdd: 'JLPT 5^', meansCollector: [{ means: [] }] }] }
    : { searchResult: [] }
));

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
  beforeEach(mockKanjiSearch);

  it('처음에는 읽기·뜻을 숨기고, Space로 둘 다 공개했다가 다시 가린다', () => {
    renderCard();
    expect(meaningShown()).toBe(false);
    expect(screen.getByText('がくせい')).toHaveAttribute('aria-hidden', 'true');
    press('Space');
    expect(meaningShown()).toBe(true);
    expect(screen.getByText('がくせい')).toHaveAttribute('aria-hidden', 'false');
    press('Space');
    expect(meaningShown()).toBe(false);
    expect(screen.getByText('がくせい')).toHaveAttribute('aria-hidden', 'true');
  });

  it('카드를 누르면 공개하고, 다시 누르면 가린다', () => {
    renderCard();
    fireEvent.click(screen.getByRole('group'));
    expect(meaningShown()).toBe(true);
    fireEvent.click(screen.getByRole('group'));
    expect(meaningShown()).toBe(false);
  });

  it('요미가나·한글 뜻은 버튼과 R·M으로 하나씩 보이고 가린다', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: '한글 뜻' }));
    expect(meaningShown()).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '한글 뜻' }));
    expect(meaningShown()).toBe(false);
    press('KeyR');
    expect(screen.getByText('がくせい')).toHaveAttribute('aria-hidden', 'false');
    press('KeyR');
    expect(screen.getByText('がくせい')).toHaveAttribute('aria-hidden', 'true');
    expect(meaningShown()).toBe(false);
  });

  it('K는 단어의 한자 풀이를 차례로 열고, 풀이가 없는 한자도 알린다. Esc로 닫는다', async () => {
    renderCard();
    press('KeyK');
    expect(await screen.findByText('배울')).toBeInTheDocument();
    press('KeyK');
    expect(await screen.findByText('아직 풀이가 없는 한자예요')).toBeInTheDocument();
    press('Escape');
    expect(screen.queryByRole('complementary', { name: '한자 풀이' })).not.toBeInTheDocument();
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

  it('묶인 표기는 대표 표기만 보이고, 다른 표기와 쉼표로 다듬은 뜻은 뜻을 공개할 때 보인다', () => {
    renderCard({ word: { _id: 'w3', entry: 'しめきり', pron: '締(め)切り·締切·〆切', means: ['마감;마감 날짜'], parts: ['명사'] } });
    expect(screen.getByRole('button', { name: '締 한자 풀이 보기' }).parentElement).toHaveTextContent(/^締め切り$/);
    expect(screen.getByText('締切・〆切').closest('[aria-hidden]')).toHaveAttribute('aria-hidden', 'true');
    press('KeyM');
    expect(screen.getByText('마감, 마감 날짜')).toBeInTheDocument();
    expect(screen.getByText('締切・〆切').closest('[aria-hidden]')).toHaveAttribute('aria-hidden', 'false');
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
