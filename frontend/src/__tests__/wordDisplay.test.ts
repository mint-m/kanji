import { displaySpelling, formatMeaning } from '../utils/wordDisplay';

describe('displaySpelling', () => {
  it('묶인 표기는 첫 표기를 대표로, 나머지는 다른 표기로 나눈다', () => {
    expect(displaySpelling({ entry: 'なぐる', pron: '殴る·撲る·擲る' })).toEqual({ written: '殴る', others: ['撲る', '擲る'] });
  });

  it('괄호 송가나는 풀어 붙이고, 풀어서 같아진 표기는 하나만 남긴다', () => {
    expect(displaySpelling({ entry: 'あつまり', pron: '集(ま)り' })).toEqual({ written: '集まり', others: [] });
    expect(displaySpelling({ entry: 'しめきり', pron: '締(め)切り·締切·〆切' })).toEqual({ written: '締め切り', others: ['締切', '〆切'] });
    expect(displaySpelling({ entry: 'かわる', pron: '代(わ)る·代(わ)る' })).toEqual({ written: '代わる', others: [] });
  });

  it('• ∙ ・ , / 로 묶인 표기도 나눈다', () => {
    expect(displaySpelling({ entry: 'まかす', pron: '任す•委す·委す' })).toEqual({ written: '任す', others: ['委す'] });
    expect(displaySpelling({ entry: 'おくらす', pron: '遅らす∙後らす' }).others).toEqual(['後らす']);
    expect(displaySpelling({ entry: 'いく', pron: '行く,往く·往く' })).toEqual({ written: '行く', others: ['往く'] });
    expect(displaySpelling({ entry: 'あざ', pron: '痣/黶' }).others).toEqual(['黶']);
    expect(displaySpelling({ entry: 'つながる', pron: '繋がる・繫がる' }).others).toEqual(['繫がる']);
  });

  it('가나로만 쓰는 단어는 읽기를 표기로 쓴다', () => {
    expect(displaySpelling({ entry: 'ずっと' })).toEqual({ written: 'ずっと', others: [] });
    expect(displaySpelling({ entry: 'ありがとう', pron: '' })).toEqual({ written: 'ありがとう', others: [] });
  });
});

describe('formatMeaning', () => {
  it("한 뜻 안의 ';'는 쉼표로 보인다", () => {
    expect(formatMeaning('가다;오다;다니다')).toBe('가다, 오다, 다니다');
  });

  it("'또,'·'특히,' 같은 이음말은 쉼표 없이 뒷말에 붙인다", () => {
    expect(formatMeaning('읽음;또, 읽은 것')).toBe('읽음, 또 읽은 것');
    expect(formatMeaning('걷다;특히,  천천히 걷다')).toBe('걷다, 특히 천천히 걷다');
    expect(formatMeaning('부르다;또는 그 이름')).toBe('부르다, 또는 그 이름');
  });

  it('참조(→)는 띄어 두고, 겹친 공백은 하나로 줄인다', () => {
    expect(formatMeaning('보다;→みる')).toBe('보다 →みる');
    expect(formatMeaning('큰  집')).toBe('큰 집');
  });
});
