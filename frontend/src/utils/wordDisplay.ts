// 단어 데이터는 사전 표기를 그대로 담고 있어 화면에 보일 때만 다듬는다 — 운영 데이터는 그대로다(근본 정리는 단어 재구축)

// 표기: '殴る·撲る·擲る'처럼 여러 표기를 한 칸에 묶었고(몇 개는 • ∙ ・ , /), '集(ま)り'처럼 생략할 수 있는 송가나를 괄호로 적었다.
// 첫 표기를 대표로 보이고 괄호는 풀어 송가나를 붙인다. 풀어서 같아진 표기는 하나만 남긴다
export const displaySpelling = (word: { entry: string; pron?: string }) => {
  const spellings = (word.pron ?? '')
    .split(/[·•∙・,/]/)
    .map((spelling) => spelling.replace(/[()]/g, '').trim())
    .filter(Boolean);
  const [written = word.entry, ...others] = Array.from(new Set(spellings));
  return { written, others };
};

// 뜻: 한 뜻 안의 비슷한 말을 ';'로 이었다 — 쉼표로 보인다. '또,'·'특히,' 같은 이음말은 쉼표 없이 뒷말에 붙이고, 참조(→)는 띄어 둔다
export const formatMeaning = (mean: string) =>
  mean
    .replace(/;(또는|또|특히|전하여),\s*/g, ', $1 ')
    .replace(/;(?=→)/g, ' ')
    .replace(/;/g, ', ')
    .replace(/\s{2,}/g, ' ');
