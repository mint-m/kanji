// DeepL API를 사용한 번역 도구
// DeepL API를 활용하여 일본어 단어를 한국어로 번역

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { BatchProcessor } = require('./supplementary-functions');

// DeepL API 설정
const DEEPL_CONFIG = {
  apiKey: '5a9d5d1b-a0c5-146f-ebe6-3cd61bffaddd:fx',  // DeepL API 키 (여기에 입력)
  endpoint: 'https://api-free.deepl.com/v2/translate',  // 무료 API 엔드포인트 (Pro 버전은 https://api.deepl.com/v2/translate)
  sourceLang: 'JA',      // 일본어 (DeepL은 대문자 코드 사용)
  targetLang: 'KO'       // 한국어
};

// 번역 요청 횟수 제한 (무료 버전: 월 500,000자)
const RATE_LIMIT = {
  requestsPerSecond: 5,  // 초당 요청 수 제한 (DeepL 권장)
  delay: 200  // ms between requests
};

// 번역 캐시 파일 경로
const CACHE_FILE_PATH = path.join(__dirname, 'translation_cache.json');

// 번역 캐시 관리 클래스
class TranslationCache {
  constructor(filePath) {
    this.filePath = filePath;
    this.cache = {};
    this.modified = false;
    this.loadCache();
  }
  
  loadCache() {
    try {
      if (fs.existsSync(this.filePath)) {
        this.cache = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        console.log(`번역 캐시 로드: ${Object.keys(this.cache).length}개 항목`);
      } else {
        this.cache = {};
        console.log('새로운 번역 캐시 생성');
      }
    } catch (error) {
      console.error('캐시 로드 실패:', error);
      this.cache = {};
    }
  }
  
  saveCache() {
    if (this.modified) {
      try {
        fs.writeFileSync(this.filePath, JSON.stringify(this.cache, null, 2));
        console.log(`번역 캐시 저장: ${Object.keys(this.cache).length}개 항목`);
        this.modified = false;
      } catch (error) {
        console.error('캐시 저장 실패:', error);
      }
    }
  }
  
  get(key) {
    return this.cache[key];
  }
  
  set(key, value) {
    this.cache[key] = value;
    this.modified = true;
    
    // 100개 단어마다 자동 저장
    if (Object.keys(this.cache).length % 100 === 0) {
      this.saveCache();
    }
  }
  
  has(key) {
    return key in this.cache;
  }
}

// 번역 API 클라이언트
class DeepLTranslator {
  constructor(config, cache) {
    this.config = config;
    this.cache = cache;
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.characterCount = 0;  // 번역된 문자 수 추적 (무료 버전 한도 모니터링)
  }
  
  async translateWord(word) {
    // 빈 문자열이나 null 체크
    if (!word || word.trim() === '') {
      return '';
    }
    
    // 캐시에서 먼저 확인
    if (this.cache.has(word)) {
      return this.cache.get(word);
    }
    
    // API 호출 간격 제한 준수
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.config.delay) {
      await new Promise(resolve => setTimeout(resolve, this.config.delay - timeSinceLastRequest));
    }
    
    try {
      const response = await axios({
        method: 'post',
        url: this.config.endpoint,
        data: new URLSearchParams({
          auth_key: this.config.apiKey,
          text: word,
          source_lang: this.config.sourceLang,
          target_lang: this.config.targetLang,
          preserve_formatting: 1,
          // 추가 옵션:
          // formality: 'default', // less, more, default, prefer_less, prefer_more
          // split_sentences: '1',
          // tag_handling: 'xml'
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      this.lastRequestTime = Date.now();
      this.requestCount++;
      
      if (response.data && response.data.translations && response.data.translations.length > 0) {
        const translation = response.data.translations[0].text;
        
        // 번역된 문자 수 추적
        this.characterCount += word.length;
        
        // 번역 결과 캐시에 저장
        this.cache.set(word, translation);
        
        return translation;
      } else {
        console.error('예상치 못한 API 응답 형식:', response.data);
        return null;
      }
    } catch (error) {
      console.error(`번역 오류 (${word}):`, error.response ? error.response.data : error.message);
      
      // 요청 한도 초과 또는 인증 오류인 경우
      if (error.response) {
        const statusCode = error.response.status;
        if (statusCode === 429) {
          throw new Error('API 요청 한도 초과');
        } else if (statusCode === 403 || statusCode === 401) {
          throw new Error('API 인증 오류 (API 키를 확인하세요)');
        } else if (statusCode === 456) {
          throw new Error('무료 계정 번역 한도 초과');
        }
      }
      
      return null;
    }
  }
  
  // 배치 번역 (여러 단어 한번에 처리)
  async translateBatch(words) {
    const results = {};
    const processor = new BatchProcessor(words.length, 10, 10);
    
    for (const word of words) {
      try {
        results[word] = await this.translateWord(word);
        processor.recordSuccess();
      } catch (error) {
        console.error(`배치 번역 오류 (${word}):`, error);
        results[word] = null;
        processor.recordFailure();
        
        // 한도 초과 오류면 중단
        if (error.message.includes('한도 초과') || error.message.includes('인증 오류')) {
          break;
        }
      }
      
      processor.logProgress(`API 호출: ${this.requestCount}회, 처리 문자: ${this.characterCount}`);
    }
    
    return results;
  }
  
  // 여러 단어를 하나의 요청으로 번역 (DeepL API는 여러 문장 지원)
  async translateMultiple(words, separator = '\n') {
    if (words.length === 0) return {};
    
    // 이미 캐시에 있는 단어 필터링
    const uncachedWords = words.filter(word => !this.cache.has(word));
    const cachedResults = {};
    
    words.forEach(word => {
      if (this.cache.has(word)) {
        cachedResults[word] = this.cache.get(word);
      }
    });
    
    if (uncachedWords.length === 0) return cachedResults;
    
    // 요청 텍스트 준비
    const text = uncachedWords.join(separator);
    
    try {
      const response = await axios({
        method: 'post',
        url: this.config.endpoint,
        data: new URLSearchParams({
          auth_key: this.config.apiKey,
          text: text,
          source_lang: this.config.sourceLang,
          target_lang: this.config.targetLang
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      this.requestCount++;
      this.characterCount += text.length;
      
      if (response.data && response.data.translations && response.data.translations.length > 0) {
        const translatedText = response.data.translations[0].text;
        const translatedParts = translatedText.split(separator);
        
        // 번역 결과 매핑 (단어 수와 번역 수가 일치한다고 가정)
        const results = { ...cachedResults };
        
        uncachedWords.forEach((word, index) => {
          if (index < translatedParts.length) {
            const translation = translatedParts[index];
            this.cache.set(word, translation);
            results[word] = translation;
          }
        });
        
        return results;
      } else {
        console.error('예상치 못한 API 응답 형식:', response.data);
        return cachedResults;
      }
    } catch (error) {
      console.error('다중 번역 오류:', error.response ? error.response.data : error.message);
      return cachedResults;
    }
  }
}

// 전처리 및 후처리 함수들
const textProcessing = {
  // 번역 결과 정제 (불필요한 설명, 괄호 등 제거)
  cleanTranslation(text) {
    if (!text) return '';
    
    // 괄호 안 내용 제거 (예: "단어 (설명)")
    text = text.replace(/\s*\([^)]*\)/g, '');
    
    // 쉼표로 구분된 여러 의미가 있으면 첫 번째만 사용
    if (text.includes(',')) {
      text = text.split(',')[0].trim();
    }
    
    // 특수문자 제거 및 공백 정리
    text = text.replace(/['"]/g, '').trim();
    
    return text;
  },
  
  // 복수 의미 처리 (여러 의미를 배열로 변환)
  extractMeanings(text) {
    if (!text) return [];
    
    // 쉼표나 세미콜론으로 구분된 의미들을 분리
    const meanings = text.split(/[,;]/)
      .map(m => m.trim())
      .filter(m => m.length > 0);
    
    // 중복 제거
    return [...new Set(meanings)];
  },
  
  // 일본어 단어 전처리 (원활한 번역을 위한 정제)
  preprocessJapaneseWord(word) {
    // 특수문자 제거
    return word.replace(/[「」『』（）]/g, '').trim();
  }
};

// 모듈 내보내기
module.exports = {
  TranslationCache,
  DeepLTranslator,
  textProcessing,
  DEEPL_CONFIG,
  RATE_LIMIT,
  CACHE_FILE_PATH
};

// 간단한 사용 예시
async function example() {
  const cache = new TranslationCache(CACHE_FILE_PATH);
  const translator = new DeepLTranslator({
    ...DEEPL_CONFIG,
    delay: RATE_LIMIT.delay
  }, cache);
  
  try {
    // 단어 하나 번역
    const result = await translator.translateWord('あおむけ');
    console.log('번역 결과:', result);
    console.log('정제된 결과:', textProcessing.cleanTranslation(result));
    
    // 여러 단어 번역 (개별 요청)
    const batchResults = await translator.translateBatch(['あおむけ', '自転車', '食べる']);
    console.log('배치 번역 결과:', batchResults);
    
    // 여러 단어 번역 (단일 요청)
    const multiResults = await translator.translateMultiple(['あおむけ', '自転車', '食べる']);
    console.log('다중 번역 결과:', multiResults);
  } catch (error) {
    console.error('번역 실행 오류:', error);
  } finally {
    // 캐시 저장 확인
    cache.saveCache();
  }
}

// 직접 실행 시 예시 실행
if (require.main === module) {
  example();
}