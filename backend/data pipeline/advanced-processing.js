// 고급 번역 및 데이터 처리 도구
// DeepL API를 사용한 고급 번역 기능과 데이터 처리 최적화

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { DeepLTranslator, TranslationCache, textProcessing } = require('./deepl-translator');
const { BatchTranslator, optimizeWordList } = require('./batch-processing');
const { BatchProcessor } = require('./supplementary-functions');

// MongoDB 연결 및 컬렉션 접근
async function connectToMongo(uri, dbName) {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('MongoDB 연결 성공');
    
    const db = client.db(dbName);
    return { client, db };
  } catch (error) {
    console.error('MongoDB 연결 오류:', error);
    throw error;
  }
}

// 효율적인 대량 처리 워크플로우
async function processInBulk(config) {
  const {
    mongoUri,
    dbName,
    naverCollection,
    bccwjCollection,
    enrichedCollection,
    translatorConfig,
    outputDir,
    chunkSize = 500
  } = config;
  
  let mongoClient;
  
  try {
    // MongoDB 연결
    const { client, db } = await connectToMongo(mongoUri, dbName);
    mongoClient = client;
    
    // 컬렉션 참조
    const naverColl = db.collection(naverCollection);
    const bccwjColl = db.collection(bccwjCollection);
    const enrichedColl = db.collection(enrichedCollection);
    
    // BCCWJ 데이터 로드
    console.log('BCCWJ 데이터 로드 중...');
    const bccwjData = await bccwjColl.find({}).toArray();
    console.log(`${bccwjData.length}개 BCCWJ 항목 로드 완료`);
    
    // 네이버 사전 데이터 로드
    console.log('네이버 사전 데이터 로드 중...');
    const naverData = await naverColl.find({}, { projection: { entry: 1, pron: 1 } }).toArray();
    
    // 검색 최적화를 위한 세트 생성
    const entrySet = new Set(naverData.map(e => e.entry));
    const pronSet = new Set(naverData.map(e => e.pron).filter(Boolean));
    
    console.log(`${naverData.length}개 네이버 사전 항목 로드 완료`);
    
    // 네이버 사전에 없는 BCCWJ 항목 찾기
    console.log('네이버 사전에 없는 항목 식별 중...');
    const missingEntries = bccwjData.filter(entry => 
      !entrySet.has(entry.lemma) && !pronSet.has(entry.lForm)
    );
    
    console.log(`${missingEntries.length}개 항목이 네이버 사전에 없습니다.`);
    
    // 레벨별 통계
    const levelStats = {};
    missingEntries.forEach(entry => {
      const level = determineLevel(entry.rank);
      levelStats[level] = (levelStats[level] || 0) + 1;
    });
    
    Object.entries(levelStats).sort((a, b) => a[0] - b[0]).forEach(([level, count]) => {
      console.log(`- 레벨 ${level}: ${count}개 항목`);
    });
    
    // 번역할 단어 목록 최적화 (랭크 순으로 정렬)
    const wordsToTranslate = missingEntries.map(entry => entry.lemma);
    const optimizedWordList = optimizeWordList(wordsToTranslate, bccwjData);
    
    console.log(`번역할 단어를 ${optimizedWordList.length}개로 최적화했습니다.`);
    
    // 번역 진행 여부 확인
    console.log('번역을 시작하시겠습니까? (이미 번역된 단어는 캐시에서 사용됩니다)');
    console.log('계속하려면 아무 키나 누르세요...');
    await waitForKeypress();
    
    // 배치 번역기 초기화
    const batchTranslator = new BatchTranslator(translatorConfig);
    
    // 청크 단위로 처리 (메모리 효율성)
    const chunks = [];
    for (let i = 0; i < optimizedWordList.length; i += chunkSize) {
      chunks.push(optimizedWordList.slice(i, i + chunkSize));
    }
    
    console.log(`${chunks.length}개 청크로 나누어 처리합니다. (청크당 ${chunkSize}개 단어)`);
    
    // 각 청크 처리
    for (let i = 0; i < chunks.length; i++) {
      console.log(`청크 ${i+1}/${chunks.length} 처리 시작...`);
      
      // 청크 번역
      const chunkWords = chunks[i];
      const translations = await batchTranslator.translateBulk(chunkWords);
      
      // 번역 결과를 MongoDB 형식으로 변환
      const dictionaryEntries = chunkWords
        .filter(word => translations[word]) // 번역된 단어만 필터링
        .map(word => {
          // BCCWJ 데이터 찾기
          const bccwjEntry = bccwjData.find(entry => entry.lemma === word);
          if (!bccwjEntry) return null;
          
          // 번역 결과 정제
          const translation = translations[word];
          const cleanTranslation = textProcessing.cleanTranslation(translation);
          const meanings = textProcessing.extractMeanings(cleanTranslation);
          
          // 품사 매핑
          const posMapping = {
            '名詞': ['명사'],
            '動詞': ['동사'],
            '形容詞': ['형용사'],
            '副詞': ['부사'],
            '連体詞': ['관형사'],
            '感動詞': ['감탄사'],
            '接続詞': ['접속사']
          };
          
          const posCategory = bccwjEntry.pos.split('-')[0];
          const koreanPos = posMapping[posCategory] || ['기타'];
          
          // 레벨 결정
          const level = determineLevel(bccwjEntry.rank);
          
          return {
            origin_entry_id: `BCCWJ_${bccwjEntry.rank}`,
            entry: bccwjEntry.lemma,
            level: level.toString(),
            parts: koreanPos,
            pron: bccwjEntry.lForm,
            means: meanings.length > 0 ? meanings : [cleanTranslation || '번역 없음'],
            bccwj_data: {
              rank: bccwjEntry.rank,
              frequency: bccwjEntry.frequency,
              pmw: bccwjEntry.pmw,
              wType: bccwjEntry.wType,
              pos: bccwjEntry.pos
            }
          };
        })
        .filter(Boolean); // null 항목 제거
      
      // MongoDB에 저장
      if (dictionaryEntries.length > 0) {
        console.log(`${dictionaryEntries.length}개 항목을 MongoDB에 저장합니다...`);
        
        const result = await enrichedColl.insertMany(dictionaryEntries);
        console.log(`${result.insertedCount}개 항목이 저장되었습니다.`);
        
        // 파일로도 저장
        const chunkOutputPath = path.join(outputDir, `enriched_chunk_${i+1}.json`);
        fs.writeFileSync(chunkOutputPath, JSON.stringify(dictionaryEntries, null, 2));
        console.log(`청크 결과가 ${chunkOutputPath}에 저장되었습니다.`);
      } else {
        console.log('저장할 항목이 없습니다.');
      }
      
      console.log(`청크 ${i+1}/${chunks.length} 처리 완료`);
      
      // 청크 간 지연
      if (i < chunks.length - 1) {
        console.log('다음 청크 처리 전 5초 대기...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // 최종 통계
    const finalEnrichedCount = await enrichedColl.countDocuments();
    console.log(`작업 완료! 총 ${finalEnrichedCount}개 항목이 사전에 추가되었습니다.`);
    
    // 컬렉션별 항목 수 출력
    const naverCount = await naverColl.countDocuments();
    const bccwjCount = await bccwjColl.countDocuments();
    
    console.log('\n최종 통계:');
    console.log(`- 네이버 사전: ${naverCount}개 항목`);
    console.log(`- BCCWJ 데이터: ${bccwjCount}개 항목`);
    console.log(`- 추가된 항목: ${finalEnrichedCount}개 항목`);
    console.log(`- 총 사전 크기: ${naverCount + finalEnrichedCount}개 항목`);
    
  } catch (error) {
    console.error('대량 처리 오류:', error);
  } finally {
    if (mongoClient) {
      await mongoClient.close();
      console.log('MongoDB 연결 종료');
    }
  }
}

// 레벨 결정 함수
function determineLevel(rank) {
  if (rank <= 2000) return 1;  // 핵심 어휘
  if (rank <= 6000) return 2;  // 기본 어휘
  if (rank <= 15000) return 3; // 중급 어휘
  if (rank <= 30000) return 4; // 고급 어휘
  return 5;                   // 전문 어휘
}

// 키 입력 대기 함수
function waitForKeypress() {
  return new Promise(resolve => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve();
    });
  });
}

// 실행 예시
async function example() {
  const config = {
    mongoUri: 'mongodb+srv://fwwfly:SrcaOaYmQ8GF8OZp@kanji.rdcbda6.mongodb.net/',
    dbName: 'japanese_dictionary',
    naverCollection: 'naver_entries',
    bccwjCollection: 'bccwj_entries',
    enrichedCollection: 'enriched_entries',
    outputDir: './output',
    translatorConfig: {
      apiKey: 'YOUR_DEEPL_API_KEY',
      endpoint: 'https://api-free.deepl.com/v2/translate',  
      sourceLang: 'JA',      
      targetLang: 'KO',
      delay: 200
    },
    chunkSize: 500
  };
  
  await processInBulk(config);
}

module.exports = {
  processInBulk,
  determineLevel
};

// 직접 실행 시 예시 실행
if (require.main === module) {
  example();
}