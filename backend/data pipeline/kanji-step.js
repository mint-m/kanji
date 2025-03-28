// MongoDB 연결 및 단어 문서에 step 필드 추가하는 스크립트
const { MongoClient } = require('mongodb');

// MongoDB 연결 정보 (실제 연결 정보로 변경 필요)
const uri = 'mongodb+srv://fwwfly:SrcaOaYmQ8GF8OZp@kanji.rdcbda6.mongodb.net/';
const dbName = 'kanji-db';
const collectionName = 'word';

// 각 스텝당 목표 단어 수 설정
const TARGET_WORDS_PER_STEP = 28; // 스텝당 단어 수 (25~30개 사이의 목표값)
const MIN_WORDS_PER_STEP = 25; // 최소 단어 수
const MAX_WORDS_PER_STEP = 30; // 최대 단어 수

async function assignStepsToWords() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('MongoDB에 연결되었습니다.');
    
    const db = client.db(dbName);
    const wordCollection = db.collection(collectionName);
    
    // 레벨별 처리 (1~5)
    for (let level = 1; level <= 5; level++) {
      console.log(`레벨 ${level} 처리 중...`);
      
      // 해당 레벨의 모든 단어 가져오기
      const words = await wordCollection.find({ level: level.toString() }).toArray();
      console.log(`레벨 ${level}에서 ${words.length}개 단어를 찾았습니다.`);
      
      if (words.length === 0) continue;
      
      // 목표 단어 수에 따라 스텝 수 계산
      let totalSteps = Math.ceil(words.length / TARGET_WORDS_PER_STEP);
      
      // 각 스텝당 할당할 단어 수 계산 (균등하게 분배)
      let wordsPerStep = Math.ceil(words.length / totalSteps);
      
      // 워드 수가 허용 범위 내에 있는지 확인하고 필요시 조정
      if (wordsPerStep < MIN_WORDS_PER_STEP && words.length >= MIN_WORDS_PER_STEP) {
        // 단어 수가 최소값보다 적으면 스텝 수를 줄임
        const adjustedTotalSteps = Math.floor(words.length / MIN_WORDS_PER_STEP);
        if (adjustedTotalSteps > 0) {
          console.log(`스텝당 단어 수가 ${wordsPerStep}개로 너무 적어, 스텝 수를 ${totalSteps}에서 ${adjustedTotalSteps}로 조정합니다.`);
          totalSteps = adjustedTotalSteps;
          wordsPerStep = Math.ceil(words.length / totalSteps);
        }
      } else if (wordsPerStep > MAX_WORDS_PER_STEP) {
        // 단어 수가 최대값보다 많으면 스텝 수를 늘림
        const adjustedTotalSteps = Math.ceil(words.length / MAX_WORDS_PER_STEP);
        console.log(`스텝당 단어 수가 ${wordsPerStep}개로 너무 많아, 스텝 수를 ${totalSteps}에서 ${adjustedTotalSteps}로 조정합니다.`);
        totalSteps = adjustedTotalSteps;
        wordsPerStep = Math.ceil(words.length / totalSteps);
      }
      
      console.log(`레벨 ${level}는 총 ${totalSteps}개의 스텝으로 나뉘며, 각 스텝당 약 ${wordsPerStep}개의 단어가 할당됩니다. (목표 범위: ${MIN_WORDS_PER_STEP}~${MAX_WORDS_PER_STEP}개)`);
      
      // 단어 배열을 랜덤하게 섞기
      const shuffledWords = words.sort(() => Math.random() - 0.5);
      
      // 각 스텝별 업데이트 작업 배열
      const bulkOps = [];
      
      // 스텝별로 단어 분배 (최대한 균등하게)
      let remainingWords = [...shuffledWords]; // 복사본 생성
      
      for (let step = 1; step <= totalSteps; step++) {
        // 마지막 스텝이 아니면 정확히 계산된 단어 수를, 마지막 스텝이면 남은 모든 단어를 할당
        const wordsForThisStep = (step < totalSteps) 
          ? Math.floor(remainingWords.length / (totalSteps - step + 1))
          : remainingWords.length;
          
        const stepWords = remainingWords.splice(0, wordsForThisStep);
        
        // 이 스텝에 할당된 단어들에 step 필드 추가
        for (const word of stepWords) {
          bulkOps.push({
            updateOne: {
              filter: { _id: word._id },
              update: { 
                $set: { 
                  step: step
                }
              }
            }
          });
        }
        
        console.log(`레벨 ${level}, 스텝 ${step}에 ${stepWords.length}개 단어가 할당되었습니다.`);
      }
      
      // 벌크 업데이트 실행
      if (bulkOps.length > 0) {
        const result = await wordCollection.bulkWrite(bulkOps);
        console.log(`레벨 ${level}: 총 ${result.modifiedCount}개 단어의 step 필드가 업데이트되었습니다.`);
      }
    }
    
    console.log('모든 레벨의 단어에 스텝이 성공적으로 할당되었습니다.');
    
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await client.close();
    console.log('MongoDB 연결이 종료되었습니다.');
  }
}

// 스크립트 실행
assignStepsToWords().catch(console.error);