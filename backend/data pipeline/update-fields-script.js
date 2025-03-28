// MongoDB 문서 필드 업데이트 유틸리티
const { MongoClient } = require('mongodb');

// MongoDB 연결 정보 (실제 연결 정보로 변경 필요)
const uri = 'mongodb+srv://fwwfly:SrcaOaYmQ8GF8OZp@kanji.rdcbda6.mongodb.net/';
const dbName = 'kanji-db';

/**
 * MongoDB 컬렉션의 문서에 필드를 추가하거나 업데이트하는 함수
 * 
 * @param {string} collectionName - 업데이트할 컬렉션 이름
 * @param {Object} filter - 업데이트할 문서를 선택하는 필터
 * @param {Object} fieldUpdates - 추가/수정할 필드와 값 ({fieldName: value, ...})
 * @param {boolean} upsert - 문서가 없을 경우 새로 생성할지 여부 (기본값: false)
 * @returns {Promise<Object>} - 업데이트 결과 객체
 */
async function updateFields(collectionName, filter, fieldUpdates, upsert = false) {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('MongoDB에 연결되었습니다.');
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    // 필드 업데이트를 위한 $set 객체 생성
    const updateDoc = { $set: fieldUpdates };
    
    // 필터와 일치하는 문서 수 확인
    const matchCount = await collection.countDocuments(filter);
    console.log(`'${collectionName}' 컬렉션에서 ${matchCount}개 문서가 필터와 일치합니다.`);
    
    // 벌크 업데이트 실행
    const result = await collection.updateMany(filter, updateDoc, { upsert });
    
    console.log(`'${collectionName}' 컬렉션에서 ${result.modifiedCount}개 문서가 업데이트되었습니다.`);
    if (result.upsertedCount > 0) {
      console.log(`${result.upsertedCount}개 문서가 새로 생성되었습니다.`);
    }
    
    return result;
    
  } catch (error) {
    console.error('오류 발생:', error);
    throw error;
  } finally {
    await client.close();
    console.log('MongoDB 연결이 종료되었습니다.');
  }
}

// tryNum 필드를 0으로 추가하는 예제
async function addTryNumField() {
  try {
    const result = await updateFields(
      'word',            // 컬렉션 이름
      {},                // 필터 (비어있으면 모든 문서)
      { tryNum: 0 }      // 추가할 필드와 값
    );
    
    console.log('tryNum 필드가 성공적으로 추가되었습니다.');
    return result;
  } catch (error) {
    console.error('tryNum 필드 추가 중 오류 발생:', error);
  }
}

// 스크립트를 직접 실행할 경우 tryNum 필드 추가
if (require.main === module) {
  addTryNumField().catch(console.error);
}

// 다른 파일에서 함수로 사용할 수 있도록 내보내기
module.exports = {
  updateFields,
  addTryNumField
};