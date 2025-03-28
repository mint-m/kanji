// MongoDB 연결 및 word_steps 컬렉션 삭제 스크립트
const { MongoClient } = require('mongodb');

// MongoDB 연결 정보 (실제 연결 정보로 변경 필요)
const uri = 'mongodb+srv://fwwfly:SrcaOaYmQ8GF8OZp@kanji.rdcbda6.mongodb.net/';
const dbName = 'kanji-db';
const collectionToDelete = 'word_steps';

async function deleteCollection() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('MongoDB에 연결되었습니다.');
    
    const db = client.db(dbName);
    
    // 컬렉션이 존재하는지 확인
    const collections = await db.listCollections({ name: collectionToDelete }).toArray();
    
    if (collections.length > 0) {
      // 컬렉션 삭제
      await db.collection(collectionToDelete).drop();
      console.log(`'${collectionToDelete}' 컬렉션이 성공적으로 삭제되었습니다.`);
    } else {
      console.log(`'${collectionToDelete}' 컬렉션이 존재하지 않습니다.`);
    }
    
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await client.close();
    console.log('MongoDB 연결이 종료되었습니다.');
  }
}

// 스크립트 실행
deleteCollection().catch(console.error);