// DeepL 일괄 번역 최적화 도구
// DeepL API를 효율적으로 활용하여 대량의 단어를 번역하는 기능

const fs = require('fs');
const path = require('path');
const { DeepLTranslator, TranslationCache, CACHE_FILE_PATH, textProcessing } = require('./deepl-translator');
const { BatchProcessor } = require('./supplementary-functions');

// DeepL API 제한 최적화 설정
const OPTIMIZATION_CONFIG = {
  // DeepL API는 무료 계정에서 월 500,000자까지 번역 가능
  // 유료 계정은 구독 요금제에 따라 다름
  batchSize: 50,         // 한 번에 처리할 단어 수
  maxCharsPerRequest: 1000,  // 요청당 최대 문자 수
  delayBetweenBatches: 200,  // 배치 간 지연 시간 (ms)
  saveFrequency: 100,    // 캐시 저장 빈도 (항목 수)
  separator: '\n'        // 단어 구분자
};

// 일괄 번역 최적화 기능
class BatchTranslator {
  constructor(translatorConfig) {
    this.cache = new TranslationCache(CACHE_FILE_PATH);
    this.translator = new DeepLTranslator(translatorConfig, this.cache);
    this.config = OPTIMIZATION_CONFIG;
    this.stats = {
      totalProcessed: 0,
      totalTranslated: 0,
      totalFromCache: 0,
      totalFailed: 0,
      totalCharacters: 0,
      apiCalls: 0
    };
  }
  
  // 처리 상태 로깅
  logStatus() {
    console.log(`
---------- 번역 상태 ----------
총 처리 단어: ${this.stats.totalProcessed}
번역 완료: ${this.stats.totalTranslated} (API: ${this.stats.totalTranslated - this.stats.totalFromCache}, 캐시: ${this.stats.totalFromCache})
실패: ${this.stats.totalFailed}
총 문자 수: ${this.stats.totalCharacters}
API 호출 수: ${this.stats.apiCalls}
-----------------------------
`);
  }
  
  // 대량의 단어를 효율적으로 번역
  async translateBulk(words, options = {}) {
    // 기본 옵션과 병합
    const config = { ...this.config, ...options };
    
    console.log(`${words.length}개 단어 번역 시작`);
    console.time('총 번역 시간');
    
    // 결과 저장용 객체
    const results = {};
    
    // 단어 전처리
    const processedWords = words.map(word => ({
      original: word,
      processed: textProcessing.preprocessJapaneseWord(word),
      length: word.length
    }));
    
    // 캐시 확인 및 캐시된 단어 즉시 처리
    processedWords.forEach(word => {
      if (this.cache.has(word.processed)) {
        results[word.original] = this.cache.get(word.processed);
        this.stats.totalProcessed++;
        this.stats.totalTranslated++;
        this.stats.totalFromCache++;
      }
    });
    
    // 캐시에 없는 단어만 필터링
    const uncachedWords = processedWords.filter(word => !this.cache.has(word.processed));
    
    if (uncachedWords.length === 0) {
      console.log('모든 단어가 이미 캐시에 있습니다.');
      console.timeEnd('총 번역 시간');
      return results;
    }
    
    console.log(`캐시에 없는 ${uncachedWords.length}개 단어 번역 준비 중...`);
    
    // 배치 생성 (문자 수 제한 고려)
    const batches = [];
    let currentBatch = [];
    let currentBatchSize = 0;
    
    for (const word of uncachedWords) {
      // 이 단어를 추가했을 때 제한을 초과하는지 확인
      if (currentBatchSize + word.length + config.separator.length > config.maxCharsPerRequest ||
          currentBatch.length >= config.batchSize) {
        if (currentBatch.length > 0) {
          batches.push([...currentBatch]);
          currentBatch = [];
          currentBatchSize = 0;
        }
      }
      
      currentBatch.push(word);
      currentBatchSize += word.length + config.separator.length;
    }
    
    // 마지막 배치 추가
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }
    
    console.log(`${batches.length}개 배치로 나누어 처리합니다.`);
    
    // 배치 처리
    const processor = new BatchProcessor(batches.length, 1, 1);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchWords = batch.map(w => w.processed);
      
      try {
        // 여러 단어를 하나의 요청으로 처리 (효율성)
        const translations = await this.translator.translateMultiple(batchWords, config.separator);
        this.stats.apiCalls++;
        
        // 결과 처리
        batch.forEach(word => {
          if (translations[word.processed]) {
            results[word.original] = translations[word.processed];
            this.stats.totalProcessed++;
            this.stats.totalTranslated++;
            this.stats.totalCharacters += word.length;
          } else {
            // 실패한 항목은 개별 재시도
            this.stats.totalFailed++;
          }
        });
        
        processor.recordSuccess();
      } catch (error) {
        console.error(`배치 ${i+1}/${batches.length} 처리 오류:`, error.message);
        processor.recordFailure();
        
        // API 한도 초과 오류 처리
        if (error.message.includes('한도 초과') || error.message.includes('인증 오류')) {
          console.error('API 한도 초과로 처리를 중단합니다.');
          break;
        }
        
        // 실패한 배치의 단어 개별 처리 (단일 요청으로)
        for (const word of batch) {
          try {
            const translation = await this.translator.translateWord(word.processed);
            if (translation) {
              results[word.original] = translation;
              this.stats.totalProcessed++;
              this.stats.totalTranslated++;
              this.stats.totalCharacters += word.length;
              this.stats.apiCalls++;
            } else {
              this.stats.totalFailed++;
            }
          } catch (wordError) {
            console.error(`단어 '${word.original}' 번역 실패:`, wordError.message);
            this.stats.totalFailed++;
            
            // API 한도 초과 시 중단
            if (wordError.message.includes('한도 초과')) {
              break;
            }
          }
        }
      }
      
      // 진행 상황 로깅
      processor.logProgress(`배치 ${i+1}/${batches.length} 완료`);
      
      // 주기적으로 상태 출력
      if ((i + 1) % 5 === 0 || i === batches.length - 1) {
        this.logStatus();
      }
      
      // 배치 간 딜레이
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));
      }
      
      // 번역 캐시 주기적 저장
      if ((i + 1) % config.saveFrequency === 0 || i === batches.length - 1) {
        this.cache.saveCache();
      }
    }
    
    // 최종 상태 출력
    this.logStatus();
    console.timeEnd('총 번역 시간');
    
    // 캐시 최종 저장
    this.cache.saveCache();
    
    return results;
  }
  
  // 단일 파일에서 대량 번역
  async translateFromFile(inputFilePath, outputFilePath, options = {}) {
    // 파일에서 단어 목록 읽기
    let words;
    try {
      const content = fs.readFileSync(inputFilePath, 'utf8');
      words = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      console.log(`${inputFilePath}에서 ${words.length}개 단어를 읽었습니다.`);
    } catch (error) {
      console.error(`파일 읽기 오류 (${inputFilePath}):`, error.message);
      return {};
    }
    
    // 번역 실행
    const results = await this.translateBulk(words, options);
    
    // 결과 저장
    try {
      // 결과를 JSON 형식으로 변환
      const resultData = JSON.stringify(results, null, 2);
      fs.writeFileSync(outputFilePath, resultData);
      console.log(`번역 결과가 ${outputFilePath}에 저장되었습니다.`);
    } catch (error) {
      console.error(`결과 저장 오류 (${outputFilePath}):`, error.message);
    }
    
    return results;
  }
  
  // 결과를 정제하여 사전 형식으로 변환
  processToDictionaryFormat(translationResults, bccwjData) {
    console.log('번역 결과를 사전 형식으로 변환 중...');
    
    const dictionaryEntries = [];
    
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
    
    for (const [lemma, translation] of Object.entries(translationResults)) {
      // BCCWJ 데이터에서 해당 단어 정보 찾기
      const bccwjEntry = bccwjData.find(entry => entry.lemma === lemma);
      if (!bccwjEntry) continue;
      
      // 번역 결과 정제
      const cleanTranslation = textProcessing.cleanTranslation(translation);
      const meanings = textProcessing.extractMeanings(cleanTranslation);
      
      // 품사 변환
      const posCategory = bccwjEntry.pos.split('-')[0];
      const koreanPos = posMapping[posCategory] || ['기타'];
      
      // 레벨 결정
      const level = determineLevel(bccwjEntry.rank);
      
      // 사전 항목 생성
      const dictionaryEntry = {
        origin_entry_id: `BCCWJ_${bccwjEntry.rank}`,
        entry: lemma,
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
      
      dictionaryEntries.push(dictionaryEntry);
    }
    
    return dictionaryEntries;
  }
}

// 레벨 결정 함수
function determineLevel(rank) {
  if (rank <= 2000) return 1;
  if (rank <= 6000) return 2;
  if (rank <= 15000) return 3;
  if (rank <= 30000) return 4;
  return 5;
}

// 전처리 최적화 기능 (대량 단어 처리용)
function optimizeWordList(words, bccwjData) {
  // 중복 제거
  const uniqueWords = [...new Set(words)];
  
  // 랭크 정보로 정렬
  return uniqueWords
    .map(word => {
      const entry = bccwjData.find(e => e.lemma === word);
      return {
        word,
        rank: entry ? entry.rank : Number.MAX_SAFE_INTEGER
      };
    })
    .sort((a, b) => a.rank - b.rank)
    .map(item => item.word);
}

// 실행 예시
async function example() {
  // 번역기 설정
  const translatorConfig = {
    apiKey: 'YOUR_DEEPL_API_KEY',
    endpoint: 'https://api-free.deepl.com/v2/translate',  
    sourceLang: 'JA',      
    targetLang: 'KO',
    delay: 200
  };
  
  const batchTranslator = new BatchTranslator(translatorConfig);
  
  // 테스트 단어
  const testWords = [
    'あおむけ',
    '自転車',
    '食べる',
    '走る',
    '美しい',
    '空',
    '海',
    '山',
    '川',
    '木'
  ];
  
  // 대량 번역 실행
  const results = await batchTranslator.translateBulk(testWords);
  
  // 결과 출력
  console.log('번역 결과:');
  Object.entries(results).forEach(([word, translation]) => {
    console.log(`${word} => ${translation}`);
  });
}

module.exports = {
  BatchTranslator,
  optimizeWordList,
  determineLevel
};

// 직접 실행 시 예시 실행
if (require.main === module) {
  example();
}