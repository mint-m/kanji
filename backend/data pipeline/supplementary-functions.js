// 추가 기능 및 데이터 처리 함수
// BCCWJ 및 네이버 사전 데이터 처리를 위한 보조 함수들

const fs = require('fs');
const { MongoClient } = require('mongodb');
const axios = require('axios');

// BCCWJ 데이터를 파싱하고 통계 추출
async function generateBccwjStatistics(filePath, outputPath) {
  console.log('BCCWJ 데이터 통계 생성 중...');
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n').filter(line => line.trim());
  
  // 헤더 행을 제외한 데이터 행 수
  const totalEntries = lines.length - 1;
  
  // 품사별 분포
  const posDist = {};
  // 어휘 유형별 분포
  const typeDist = {};
  // 빈도 범위별 분포
  const freqRanges = {
    '100+': 0,
    '50-99.99': 0,
    '10-49.99': 0,
    '5-9.99': 0,
    '1-4.99': 0,
    '0.9-0.99': 0,
    '<0.9': 0
  };
  
  // 빈도수 상위 단어 (탑 100)
  const topWords = [];
  
  // 라인별로 데이터 처리
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (cols.length < 8) continue;
    
    const rank = parseInt(cols[0]);
    const lForm = cols[1];
    const lemma = cols[2];
    const pos = cols[3];
    const wType = cols[5];
    const freq = parseInt(cols[6]);
    const pmw = parseFloat(cols[7]);
    
    // 품사 집계
    const posCategory = pos.split('-')[0];
    posDist[posCategory] = (posDist[posCategory] || 0) + 1;
    
    // 어휘 유형 집계
    typeDist[wType] = (typeDist[wType] || 0) + 1;
    
    // 빈도 범위 집계
    if (pmw >= 100) freqRanges['100+']++;
    else if (pmw >= 50) freqRanges['50-99.99']++;
    else if (pmw >= 10) freqRanges['10-49.99']++;
    else if (pmw >= 5) freqRanges['5-9.99']++;
    else if (pmw >= 1) freqRanges['1-4.99']++;
    else if (pmw >= 0.9) freqRanges['0.9-0.99']++;
    else freqRanges['<0.9']++;
    
    // 상위 단어 수집
    if (rank <= 100) {
      topWords.push({
        rank,
        lemma,
        lForm,
        pos,
        wType,
        freq,
        pmw
      });
    }
  }
  
  // 결과 통계
  const statistics = {
    totalEntries,
    posDist,
    typeDist,
    freqRanges,
    topWords,
    cutoffInfo: {
      rank: 40000,
      frequency: 0.9,
      entriesIncluded: Object.values(freqRanges).reduce((sum, count, index) => {
        // 0.9 이상의 빈도를 가진 항목들의 합계
        if (index < 6) return sum + count;
        return sum;
      }, 0)
    }
  };
  
  // 통계 결과 저장
  fs.writeFileSync(outputPath, JSON.stringify(statistics, null, 2));
  console.log(`통계 결과가 ${outputPath}에 저장되었습니다.`);
  
  return statistics;
}

// 네이버 사전과 BCCWJ의 중복 분석
// 기존 단어와 BCCWJ의 중복 분석
async function analyzeOverlap(sourceCollection, bccwjFilePath, outputPath) {
  console.log('기존 단어와 BCCWJ 중복 분석 중...');
  
  // 원본 단어 데이터 로드
  const sourceEntries = await sourceCollection.find({}).toArray();
  
  // kanji-db.word 컬렉션 필드명 사용
  const sourceEntrySet = new Set(sourceEntries.map(e => e.entry));
  const sourcePronSet = new Set(sourceEntries.map(e => e.pron).filter(Boolean));
  
  // BCCWJ 데이터 파싱
  const fileContent = fs.readFileSync(bccwjFilePath, 'utf8');
  const lines = fileContent.split('\n').filter(line => line.trim());
  
  // 중복 항목 카운트
  let duplicateCount = 0;
  let dupByLemma = 0;
  let dupByPron = 0;
  
  // 비중복 항목 (BCCWJ에만 있는 항목) 레벨별 카운트
  const uniqueByLevel = {
    1: 0, // Top 2,000
    2: 0, // 2,001-6,000
    3: 0, // 6,001-15,000
    4: 0, // 15,001-30,000
    5: 0  // 30,001-40,000
  };
  
  // 중복 및 비중복 항목 상세 정보
  const duplicateItems = [];
  const uniqueItems = [];
  
  // 라인별로 데이터 처리
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (cols.length < 8) continue;
    
    const rank = parseInt(cols[0]);
    const lForm = cols[1];
    const lemma = cols[2];
    const pos = cols[3];
    const pmw = parseFloat(cols[7]);
    
    // 랭크와 빈도수 필터링 (컷오프 적용)
    if (rank > 40000 || pmw < 0.9) continue;
    
    // 품사 필터링
    const skipPos = ['助詞', '助動詞', '接続詞', '感動詞'];
    if (skipPos.some(p => pos.startsWith(p))) continue;
    
    // 레벨 결정
    let level;
    if (rank <= 2000) level = 1;
    else if (rank <= 6000) level = 2;
    else if (rank <= 15000) level = 3;
    else if (rank <= 30000) level = 4;
    else level = 5;
    
    // 중복 체크 - 여기가 핵심 변경 부분
    const isDuplicate = sourceEntrySet.has(lemma) || sourcePronSet.has(lForm);
    
    if (isDuplicate) {
      duplicateCount++;
      if (sourceEntrySet.has(lemma)) dupByLemma++;
      if (sourcePronSet.has(lForm)) dupByPron++;
      
      // 중복 항목 저장 (처음 100개만)
      if (duplicateItems.length < 100) {
        duplicateItems.push({
          rank,
          lemma,
          lForm,
          pos,
          pmw,
          level,
          matchType: sourceEntrySet.has(lemma) ? (sourcePronSet.has(lForm) ? 'both' : 'lemma') : 'pronunciation'
        });
      }
    } else {
      // 비중복 항목 레벨별 카운트 증가
      uniqueByLevel[level]++;
      
      // 비중복 항목 저장 (상위 100개만)
      if (uniqueItems.length < 100) {
        uniqueItems.push({
          rank,
          lemma,
          lForm,
          pos,
          pmw,
          level
        });
      }
    }
  }
  
  // 결과 통계
  const overlapStatistics = {
    sourceEntriesCount: sourceEntries.length,
    filteredBccwjCount: Object.values(uniqueByLevel).reduce((a, b) => a + b, 0) + duplicateCount,
    duplicateCount,
    dupByLemma,
    dupByPron,
    uniqueTotalCount: Object.values(uniqueByLevel).reduce((a, b) => a + b, 0),
    uniqueByLevel,
    overlapPercentage: (duplicateCount / (Object.values(uniqueByLevel).reduce((a, b) => a + b, 0) + duplicateCount) * 100).toFixed(2) + '%',
    sampleDuplicates: duplicateItems,
    sampleUniques: uniqueItems
  };
  
  // 통계 결과 저장
  fs.writeFileSync(outputPath, JSON.stringify(overlapStatistics, null, 2));
  console.log(`중복 분석 결과가 ${outputPath}에 저장되었습니다.`);
  
  return overlapStatistics;
}

async function initializeCollection(db, collectionName, indexFields = {}) {
  // 컬렉션이 없으면 생성
  const collections = await db.listCollections({ name: collectionName }).toArray();
  if (collections.length === 0) {
    await db.createCollection(collectionName);
    console.log(`${collectionName} 컬렉션이 생성되었습니다.`);
  }
  
  // 인덱스 생성
  if (Object.keys(indexFields).length > 0) {
    for (const [field, options] of Object.entries(indexFields)) {
      const indexSpec = {};
      indexSpec[field] = 1;
      await db.collection(collectionName).createIndex(indexSpec, options);
      console.log(`${collectionName} 컬렉션에 ${field} 인덱스가 생성되었습니다.`);
    }
  }
  
  return db.collection(collectionName);
}

// 파일 내보내기 함수
async function exportData(collection, outputPath) {
  const data = await collection.find({}).toArray();
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`${data.length}개 항목이 ${outputPath}에 내보내기 되었습니다.`);
  return data.length;
}

// 배치 처리 상태 추적 함수
class BatchProcessor {
  constructor(totalItems, batchSize = 100, logInterval = 10) {
    this.totalItems = totalItems;
    this.processed = 0;
    this.succeeded = 0;
    this.failed = 0;
    this.startTime = Date.now();
    this.batchSize = batchSize;
    this.logInterval = logInterval;
    this.currentBatch = [];
  }
  
  addItem(item) {
    this.currentBatch.push(item);
    return this.currentBatch.length >= this.batchSize;
  }
  
  clearBatch() {
    const batch = [...this.currentBatch];
    this.currentBatch = [];
    return batch;
  }
  
  logProgress(additionalInfo = '') {
    this.processed++;
    
    if (this.processed % this.logInterval === 0 || this.processed === this.totalItems) {
      const elapsedSec = (Date.now() - this.startTime) / 1000;
      const itemsPerSec = this.processed / elapsedSec;
      const percentComplete = (this.processed / this.totalItems * 100).toFixed(2);
      const remaining = this.totalItems - this.processed;
      const estimatedRemainingSec = remaining / itemsPerSec;
      
      let remainingTime = '';
      if (estimatedRemainingSec > 3600) {
        remainingTime = `약 ${Math.ceil(estimatedRemainingSec / 3600)}시간`;
      } else if (estimatedRemainingSec > 60) {
        remainingTime = `약 ${Math.ceil(estimatedRemainingSec / 60)}분`;
      } else {
        remainingTime = `약 ${Math.ceil(estimatedRemainingSec)}초`;
      }
      
      console.log(
        `처리 진행: ${this.processed}/${this.totalItems} (${percentComplete}%) ` +
        `성공: ${this.succeeded}, 실패: ${this.failed}, 속도: ${itemsPerSec.toFixed(2)}개/초, ` +
        `남은 시간: ${remainingTime} ${additionalInfo}`
      );
    }
  }
  
  recordSuccess() {
    this.succeeded++;
  }
  
  recordFailure() {
    this.failed++;
  }
  
  getSummary() {
    const elapsedSec = (Date.now() - this.startTime) / 1000;
    return {
      totalItems: this.totalItems,
      processed: this.processed,
      succeeded: this.succeeded,
      failed: this.failed,
      elapsedSeconds: elapsedSec,
      itemsPerSecond: this.processed / elapsedSec
    };
  }
}

// 기존 단어 항목 추출 (kanji-db.word에서)
async function getExistingEntries(collection) {
  const entries = await collection.find({}).toArray();
  
  // 빠른 검색을 위한 세트 생성
  // kanji-db.word 컬렉션의 필드명에 맞게 수정 필요
  const entrySet = new Set(entries.map(e => e.entry || e.word || e.japanese)); // 일본어 단어 필드명 확인 필요
  const pronSet = new Set(entries.map(e => e.pron || e.pronunciation || e.reading).filter(Boolean)); // 발음 필드명 확인 필요
  
  console.log(`기존 단어 데이터 로드: ${entries.length}개`);
  console.log(`- 단어 기준: ${entrySet.size}개`);
  console.log(`- 발음 기준: ${pronSet.size}개`);
  
  return { entries, entrySet, pronSet };
}

module.exports = {
  generateBccwjStatistics,
  analyzeOverlap,
  initializeCollection,
  exportData,
  getExistingEntries,
  BatchProcessor
};