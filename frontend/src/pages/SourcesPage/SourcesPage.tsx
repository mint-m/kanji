import * as layout from 'styles/layout.css';
import * as styles from './SourcesPage.css';

const EDRDG = 'https://www.edrdg.org/';
const LICENCE = 'https://www.edrdg.org/edrdg/licence.html';
const KANJIDIC = 'https://www.edrdg.org/wiki/index.php/KANJIDIC_Project';
const CC_BY_SA = 'https://creativecommons.org/licenses/by-sa/4.0/deed.ko';

// KANJIDIC2(CC BY-SA 4.0)는 앱 안의 별도 화면에 출처를 밝히는 것이 사용 조건이다 — 사용자 메뉴와 첫 화면에서 이어 둔다.
// JMdict 등 EDRDG의 다른 파일을 데이터에 넣으면 여기에 함께 적는다
const SourcesPage = () => (
  <div className={layout.page}>
    <h1 className={layout.pageTitle}>데이터 출처</h1>
    <section className={`${layout.card} ${styles.body}`}>
      <p>
        한자 풀이에는 EDRDG(Electronic Dictionary Research and Development Group)의{' '}
        <a href={KANJIDIC}>KANJIDIC2</a> 사전 파일(읽기·한국 한자음·영어 뜻)을 그룹의 <a href={LICENCE}>라이선스</a>에
        따라 씁니다. 이 파일과 이를 가공한 데이터에는 <a href={CC_BY_SA}>CC BY-SA 4.0</a>이 적용됩니다.
      </p>
      <p className={styles.acknowledgement} lang="en">
        This site uses the <a href={KANJIDIC}>KANJIDIC</a> dictionary files. These files are the property of
        the <a href={EDRDG}>Electronic Dictionary Research and Development Group</a>, and are used in conformance
        with the Group's <a href={LICENCE}>licence</a>.
      </p>
    </section>
  </div>
);

export default SourcesPage;
