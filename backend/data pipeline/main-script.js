// 일본어 사전 데이터 처리 메인 스크립트
// BCCWJ 단어 빈도 데이터와 네이버 사전 데이터를 비교하고 처리하는 메인 프로그램

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const readline = require('readline');

// 내부 모듈 불러오기
const { generateBccwjStatistics, analyzeOverlap, initializeCollection, exportData, BatchProcessor, getExistingEntries } = require('./supplementary-functions');
const { TranslationCache, DeepLTranslator, textProcessing, DEEPL_CONFIG, CACHE_FILE_PATH } = require('./deepl-translator');

// 설정
const CONFIG = {
    // MongoDB 설정
    mongoUri: 'mongodb+srv://fwwfly:SrcaOaYmQ8GF8OZp@kanji.rdcbda6.mongodb.net/',
    sourceDbName: 'kanji-db',          // 원본 데이터베이스 (여기에서 읽기만 함)
    sourceCollection: 'word',          // 원본 단어 컬렉션

    targetDbName: 'japanese_dictionary', // 결과 저장용 데이터베이스
    bccwjCollection: 'bccwj_entries',    // BCCWJ 데이터 컬렉션
    enrichedCollection: 'enriched_entries', // 결과 저장 컬렉션

    // 파일 경로
    bccwjFilePath: './bccwj_word_frequency.tsv',
    outputDir: './output',

    // 단어 필터링 기준
    rankThreshold: 40000,    // 랭크 40,000 이하
    freqThreshold: 0.9,      // PMW 0.9 이상

    // 처리 옵션
    batchSize: 100,          // 배치 크기
    skipPos: ['助詞', '助動詞', '接続詞', '感動詞'], // 건너뛸 품사

    // 분석 파일 경로
    statsPath: './output/bccwj_stats.json',
    overlapPath: './output/overlap_analysis.json'
};

// 사용자 입력 받기
function getUserInput(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer);
        });
    });
}

// BCCWJ 데이터 파싱 및 필터링
async function parseBccwjData(filePath, config) {
    console.log('BCCWJ 데이터 파싱 중...');

    return new Promise((resolve, reject) => {
        try {
            const results = [];
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const lines = fileContent.split('\n').filter(line => line.trim());

            // 헤더 행을 제외한 각 행 처리
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split('\t');
                if (cols.length < 8) continue;

                const entry = {
                    rank: parseInt(cols[0]),
                    lForm: cols[1],
                    lemma: cols[2],
                    pos: cols[3],
                    subLemma: cols[4],
                    wType: cols[5],
                    frequency: parseInt(cols[6]),
                    pmw: parseFloat(cols[7])
                };

                // 필터링 조건 적용
                if (entry.rank > config.rankThreshold) continue;
                if (entry.pmw < config.freqThreshold) continue;
                if (config.skipPos.some(pos => entry.pos.startsWith(pos))) continue;

                results.push(entry);
            }

            console.log(`파싱 완료: ${results.length}개 항목 (랭크 ${config.rankThreshold} 이하, 빈도 ${config.freqThreshold} PMW 이상)`);
            resolve(results);
        } catch (error) {
            reject(error);
        }
    });
}

// 레벨 결정
function determineLevel(rank) {
    if (rank <= 2000) return 1;
    if (rank <= 6000) return 2;
    if (rank <= 15000) return 3;
    if (rank <= 30000) return 4;
    return 5;
}

// 네이버 사전 항목 추출
async function getExistingNaverEntries(collection) {
    const entries = await collection.find({}).toArray();

    // 빠른 검색을 위한 세트 생성
    const entrySet = new Set(entries.map(e => e.entry));
    const pronSet = new Set(entries.map(e => e.pron).filter(Boolean));

    console.log(`네이버 사전 항목 로드: ${entries.length}개`);
    console.log(`- 단어 기준: ${entrySet.size}개`);
    console.log(`- 발음 기준: ${pronSet.size}개`);

    return { entries, entrySet, pronSet };
}

// 사전 데이터 수집 메인 함수
async function collectDictionaryData() {
    // 출력 디렉토리 확인
    if (!fs.existsSync(CONFIG.outputDir)) {
        fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    let mongoClient;

    try {
        // MongoDB 연결
        console.log('MongoDB 연결 중...');
        // MongoDB 연결
        mongoClient = new MongoClient(CONFIG.mongoUri);
        await mongoClient.connect();

        // 원본 DB와 타겟 DB 참조
        const sourceDb = mongoClient.db(CONFIG.sourceDbName);
        const wordCollection = sourceDb.collection(CONFIG.sourceCollection);

        const targetDb = mongoClient.db(CONFIG.targetDbName);

        try {
            const exists = await targetDb.listCollections({ name: CONFIG.bccwjCollection }).hasNext();
            if (exists) {
              await targetDb.collection(CONFIG.bccwjCollection).drop();
              console.log(`기존 ${CONFIG.bccwjCollection} 컬렉션 삭제 완료`);
            }
          } catch (error) {
            console.log(`컬렉션 확인/삭제 중 오류: ${error.message}`);
          }
          
        const bccwjCollection = await initializeCollection(targetDb, CONFIG.bccwjCollection, {
            'rank': { unique: false }
        });
        const enrichedCollection = await initializeCollection(targetDb, CONFIG.enrichedCollection, {
            'entry': { unique: true }
        });

        // 기존 단어 데이터 로드 - 필드명 확인 필요
        console.log(`${CONFIG.sourceDbName}.${CONFIG.sourceCollection}에서 단어 데이터 로드 중...`);
        const entries = await wordCollection.find({}).toArray();

        // 필드명 확인 필요 - kanji-db.word 컬렉션의 실제 필드 구조에 맞게 조정
        // 필드명 확인 필요 - kanji-db.word 컬렉션의 실제 필드 구조에 맞게 조정
        const entrySet = new Set(entries.map(e => e.entry)); // "entry" 필드 사용
        const pronSet = new Set(entries.map(e => e.pron).filter(Boolean)); // "pron" 필드 사용

        console.log(`기존 단어 데이터 로드: ${entries.length}개`);
        console.log(`- 단어 기준(entry): ${entrySet.size}개`);
        console.log(`- 표기 기준(pron): ${pronSet.size}개`);

        // 나머지 로직...
        // BCCWJ 통계 생성
        if (!fs.existsSync(CONFIG.statsPath)) {
            await generateBccwjStatistics(CONFIG.bccwjFilePath, CONFIG.statsPath);
        }

        // 중복 분석
        if (!fs.existsSync(CONFIG.overlapPath)) {
            await analyzeOverlap(wordCollection, CONFIG.bccwjFilePath, CONFIG.overlapPath);
        }

        // BCCWJ 데이터 파싱
        const bccwjEntries = await parseBccwjData(CONFIG.bccwjFilePath, CONFIG);

        // BCCWJ 컬렉션 저장 여부 확인
        const bccwjCount = await bccwjCollection.countDocuments();
        if (bccwjCount === 0) {
            const answer = await getUserInput('BCCWJ 데이터를 MongoDB에 저장하시겠습니까? (y/n): ');
            if (answer.toLowerCase() === 'y') {
                // 배치 삽입 준비
                const batches = [];
                const batchSize = CONFIG.batchSize;

                for (let i = 0; i < bccwjEntries.length; i += batchSize) {
                    batches.push(bccwjEntries.slice(i, i + batchSize));
                }

                console.log(`${batches.length}개 배치로 나누어 저장합니다...`);

                for (let i = 0; i < batches.length; i++) {
                    await bccwjCollection.insertMany(batches[i], { ordered: false });
                    console.log(`배치 ${i + 1}/${batches.length} 저장 완료`);
                }

                console.log(`BCCWJ 데이터 저장 완료: ${bccwjEntries.length}개 항목`);
            }
        } else {
            console.log(`BCCWJ 컬렉션에 이미 ${bccwjCount}개 항목이 있습니다.`);
        }

        console.log('기존 단어에 없는 BCCWJ 항목 찾는 중...');
        const missingEntries = [];

        for (const entry of bccwjEntries) {
            if (!entrySet.has(entry.lemma) && !pronSet.has(entry.lForm)) {
                missingEntries.push({
                    ...entry,
                    level: determineLevel(entry.rank)
                });
            }
        }

        // 레벨별 통계
        const levelCounts = {};
        missingEntries.forEach(entry => {
            levelCounts[entry.level] = (levelCounts[entry.level] || 0) + 1;
        });

        console.log(`네이버 사전에 없는 항목: ${missingEntries.length}개`);
        Object.entries(levelCounts).forEach(([level, count]) => {
            console.log(`- 레벨 ${level}: ${count}개`);
        });

        // 번역 처리 여부 확인
        const answer = await getUserInput(`${missingEntries.length}개 항목을 번역하시겠습니까? (y/n): `);

        if (answer.toLowerCase() === 'y') {
            // 번역 캐시 및 번역기 초기화
            const cache = new TranslationCache(CACHE_FILE_PATH);
            const translator = new DeepLTranslator({
                ...DEEPL_CONFIG,
                delay: 200
            }, cache);

            // 레벨별로 정렬
            missingEntries.sort((a, b) => a.level - b.level || a.rank - b.rank);

            // 번역 처리
            console.log('번역 처리 시작...');

            const processor = new BatchProcessor(missingEntries.length, CONFIG.batchSize, 10);
            const enrichedEntries = [];
            let currentBatch = [];

            for (const entry of missingEntries) {
                try {
                    // DeepL에 최적화된 번역 메서드 사용
                    const cleanedWord = textProcessing.preprocessJapaneseWord(entry.lemma);
                    const translation = await translator.translateWord(cleanedWord);

                    // 번역 결과 정제
                    // DeepL은 일반적으로 더 깨끗한 결과를 제공하지만 여전히 정제 필요
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

                    const posCategory = entry.pos.split('-')[0];
                    const koreanPos = posMapping[posCategory] || ['기타'];

                    // 새 항목 생성
                    const newEntry = {
                        origin_entry_id: `BCCWJ_${entry.rank}`,
                        entry: entry.lemma,
                        level: entry.level.toString(),
                        parts: koreanPos,
                        pron: entry.lForm,
                        means: meanings.length > 0 ? meanings : [cleanTranslation || '번역 없음'],
                        bccwj_data: {
                            rank: entry.rank,
                            frequency: entry.frequency,
                            pmw: entry.pmw,
                            wType: entry.wType,
                            pos: entry.pos
                        }
                    };

                    enrichedEntries.push(newEntry);
                    currentBatch.push(newEntry);
                    processor.recordSuccess();

                    // 배치 처리
                    if (currentBatch.length >= CONFIG.batchSize) {
                        await enrichedCollection.insertMany(currentBatch);
                        console.log(`${currentBatch.length}개 항목 저장 완료`);
                        currentBatch = [];
                    }
                } catch (error) {
                    console.error(`항목 처리 오류 (${entry.lemma}):`, error);
                    processor.recordFailure();

                    // 한도 초과 시 중단
                    if (error.message.includes('한도 초과') || error.message.includes('인증 오류')) {
                        console.log('API 호출 한도 초과 또는 인증 오류로 처리를 중단합니다.');
                        break;
                    }
                }

                processor.logProgress();
            }

            // 남은 배치 처리
            if (currentBatch.length > 0) {
                await enrichedCollection.insertMany(currentBatch);
                console.log(`마지막 ${currentBatch.length}개 항목 저장 완료`);
            }

            // 캐시 저장
            cache.saveCache();

            // 처리 결과 출력
            const summary = processor.getSummary();
            console.log('\n처리 결과 요약:');
            console.log(`- 총 항목: ${summary.totalItems}개`);
            console.log(`- 처리 항목: ${summary.processed}개`);
            console.log(`- 성공: ${summary.succeeded}개`);
            console.log(`- 실패: ${summary.failed}개`);
            console.log(`- 처리 시간: ${summary.elapsedSeconds.toFixed(2)}초`);
            console.log(`- 초당 처리량: ${summary.itemsPerSecond.toFixed(2)}개/초`);

            // 결과 내보내기
            const exportAnswer = await getUserInput('처리 결과를 JSON 파일로 내보내시겠습니까? (y/n): ');
            if (exportAnswer.toLowerCase() === 'y') {
                await exportData(enrichedCollection, path.join(CONFIG.outputDir, 'enriched_entries.json'));
            }
        }

        console.log('처리 완료');

    } catch (error) {
        console.error('오류 발생:', error);
    } finally {
        if (mongoClient) {
            await mongoClient.close();
            console.log('MongoDB 연결 종료');
        }
    }
}

// 프로그램 실행
if (require.main === module) {
    collectDictionaryData()
        .then(() => console.log('프로그램 종료'))
        .catch(err => console.error('프로그램 실행 오류:', err));
}

module.exports = {
    collectDictionaryData
};