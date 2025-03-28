// Japanese Dictionary Enrichment Pipeline
// This script processes BCCWJ corpus data and compares it with Naver dictionary entries
// to identify and add missing words with translations

const fs = require('fs');
const { MongoClient } = require('mongodb');
const csv = require('csv-parser');
const axios = require('axios');

// Configuration
const config = {
  mongoUri: 'mongodb+srv://fwwfly:SrcaOaYmQ8GF8OZp@kanji.rdcbda6.mongodb.net/',
  dbName: 'japanese_dictionary',
  naverCollection: 'naver_entries',
  enrichedCollection: 'enriched_entries',
  bccwjFilePath: './bccwj_word_frequency.tsv',
  frequencyThreshold: 0.9, // Only add words with frequency above this threshold (per million words)
  rankThreshold: 40000, // Only include words with rank better than this
  // Add your translation API details here
  translationApiKey: 'YOUR_API_KEY',
  translationEndpoint: 'https://translation-api-endpoint.com/translate'
};

// Connect to MongoDB
async function connectToMongo() {
  const client = new MongoClient(config.mongoUri);
  await client.connect();
  return {
    client,
    db: client.db(config.dbName),
    naverCollection: client.db(config.dbName).collection(config.naverCollection),
    enrichedCollection: client.db(config.dbName).collection(config.enrichedCollection)
  };
}

// Parse BCCWJ TSV file
async function parseBccwjData() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(config.bccwjFilePath)
      .pipe(csv({
        separator: '\t',
        headers: [
          'rank', 'lForm', 'lemma', 'pos', 'subLemma', 'wType', 'frequency', 'pmw',
          // Include all other BCCWJ headers - abbreviated for brevity
          // Add the other column headers as needed
        ],
        skipLines: 1
      }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Filter BCCWJ data to keep only relevant entries
function filterBccwjData(bccwjData) {
  return bccwjData.filter(entry => {
    // Skip particles, auxiliary verbs, etc.
    const skipPos = ['助詞', '助動詞', '接続詞', '感動詞'];
    if (skipPos.some(pos => entry.pos.startsWith(pos))) return false;
    
    // Skip very rare symbols and characters
    if (entry.wType === '記号' && parseFloat(entry.pmw) < 5) return false;
    
    // Apply frequency threshold
    if (parseFloat(entry.pmw) < config.frequencyThreshold) return false;
    
    // Apply rank threshold
    if (parseInt(entry.rank) > config.rankThreshold) return false;
    
    return true;
  });
}

// Extract existing words from Naver dictionary
async function getExistingNaverEntries(mongoConn) {
  const existingEntries = await mongoConn.naverCollection.find({}, {
    projection: { entry: 1, pron: 1 }
  }).toArray();
  
  // Create sets for faster lookups
  const entriesSet = new Set(existingEntries.map(e => e.entry));
  const pronSet = new Set(existingEntries.map(e => e.pron).filter(Boolean));
  
  return { entriesSet, pronSet, allEntries: existingEntries };
}

// Get translation from API
async function translateWord(word) {
  try {
    const response = await axios.post(config.translationEndpoint, {
      text: word,
      source: 'ja',
      target: 'ko',
      api_key: config.translationApiKey
    });
    
    return response.data.translation || '';
  } catch (error) {
    console.error(`Translation error for word ${word}:`, error.message);
    return '';
  }
}

// Create new entry structure
function createNewEntry(bccwjEntry, translation) {
  // Map BCCWJ POS to Korean POS
  const posMapping = {
    '名詞': ['명사'],
    '動詞': ['동사'],
    '形容詞': ['형용사'],
    '副詞': ['부사'],
    // Add more mappings as needed
  };
  
  // Extract POS category (first part before hyphen)
  const posCategory = bccwjEntry.pos.split('-')[0];
  const koreanPos = posMapping[posCategory] || ['기타'];
  
  const level = determineLevel(bccwjEntry);
  
  return {
    origin_entry_id: `BCCWJ_${bccwjEntry.rank}`,
    entry: bccwjEntry.lemma,
    level: level.toString(),
    parts: koreanPos,
    pron: bccwjEntry.lForm,
    means: [translation],
    bccwj_data: {
      rank: parseInt(bccwjEntry.rank),
      frequency: parseInt(bccwjEntry.frequency),
      pmw: parseFloat(bccwjEntry.pmw),
      wType: bccwjEntry.wType,
      pos: bccwjEntry.pos
    }
  };
}

// Determine level based on frequency and rank
function determineLevel(bccwjEntry) {
  const rank = parseInt(bccwjEntry.rank);
  
  // Level 1: Top 2,000 words (core vocabulary)
  if (rank <= 2000) return 1;
  
  // Level 2: Top 2,001-6,000 words (essential vocabulary)
  if (rank <= 6000) return 2;
  
  // Level 3: Top 6,001-15,000 words (intermediate vocabulary)
  if (rank <= 15000) return 3;
  
  // Level 4: Top 15,001-30,000 words (advanced vocabulary)
  if (rank <= 30000) return 4;
  
  // Level 5: Top 30,001-40,000 words (specialized vocabulary)
  return 5;
}

// Main process function
async function enrichDictionary() {
  let mongoConn;
  
  try {
    console.log('Connecting to MongoDB...');
    mongoConn = await connectToMongo();
    
    console.log('Parsing BCCWJ data...');
    const bccwjData = await parseBccwjData();
    console.log(`Parsed ${bccwjData.length} entries from BCCWJ`);
    
    console.log('Filtering BCCWJ data...');
    const filteredBccwj = filterBccwjData(bccwjData);
    console.log(`Filtered to ${filteredBccwj.length} relevant entries`);
    
    console.log('Getting existing Naver entries...');
    const { entriesSet, pronSet } = await getExistingNaverEntries(mongoConn);
    console.log(`Found ${entriesSet.size} existing entries`);
    
    console.log('Finding new entries to add...');
    const newEntries = [];
    let processedCount = 0;
    
    for (const bccwjEntry of filteredBccwj) {
      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`Processed ${processedCount}/${filteredBccwj.length} entries`);
      }
      
      // Skip if already in Naver dictionary (by entry or pronunciation)
      if (entriesSet.has(bccwjEntry.lemma) || pronSet.has(bccwjEntry.lForm)) {
        continue;
      }
      
      // Get translation
      const translation = await translateWord(bccwjEntry.lemma);
      if (!translation) continue;
      
      // Create new entry
      const newEntry = createNewEntry(bccwjEntry, translation);
      newEntries.push(newEntry);
      
      // Optional: Add directly to MongoDB in batches to save memory
      if (newEntries.length >= 100) {
        await mongoConn.enrichedCollection.insertMany(newEntries);
        console.log(`Added batch of ${newEntries.length} new entries`);
        newEntries.length = 0;
      }
    }
    
    // Insert any remaining entries
    if (newEntries.length > 0) {
      await mongoConn.enrichedCollection.insertMany(newEntries);
      console.log(`Added final batch of ${newEntries.length} new entries`);
    }
    
    console.log('Process completed successfully');
  } catch (error) {
    console.error('Error in dictionary enrichment process:', error);
  } finally {
    if (mongoConn && mongoConn.client) {
      await mongoConn.client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Alternative implementation for processing in batches to handle large files
async function processBccwjInBatches() {
  const batchSize = 1000;
  let mongoConn;
  
  try {
    mongoConn = await connectToMongo();
    const { entriesSet, pronSet } = await getExistingNaverEntries(mongoConn);
    
    return new Promise((resolve, reject) => {
      let batch = [];
      let totalProcessed = 0;
      let totalAdded = 0;
      
      const processBatch = async () => {
        console.log(`Processing batch of ${batch.length} entries...`);
        const filteredBatch = filterBccwjData(batch);
        
        const newEntries = [];
        for (const entry of filteredBatch) {
          if (!entriesSet.has(entry.lemma) && !pronSet.has(entry.lForm)) {
            const translation = await translateWord(entry.lemma);
            if (translation) {
              newEntries.push(createNewEntry(entry, translation));
            }
          }
        }
        
        if (newEntries.length > 0) {
          await mongoConn.enrichedCollection.insertMany(newEntries);
          totalAdded += newEntries.length;
        }
        
        console.log(`Batch complete. Added ${newEntries.length} new entries`);
        batch = [];
      };
      
      fs.createReadStream(config.bccwjFilePath)
        .pipe(csv({ separator: '\t' }))
        .on('data', (data) => {
          batch.push(data);
          totalProcessed++;
          
          if (batch.length >= batchSize) {
            // Pause the stream while processing the batch
            stream.pause();
            processBatch().then(() => stream.resume()).catch(reject);
          }
        })
        .on('end', async () => {
          if (batch.length > 0) {
            await processBatch();
          }
          resolve({ totalProcessed, totalAdded });
        })
        .on('error', reject);
    });
  } finally {
    if (mongoConn && mongoConn.client) {
      await mongoConn.client.close();
    }
  }
}

// Run the enrichment process
enrichDictionary()
  .then(() => console.log('Dictionary enrichment completed'))
  .catch(err => console.error('Dictionary enrichment failed:', err));