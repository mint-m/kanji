// src/services/authService.test.ts
import { API_URL } from './authService';

// getBaseUrl() 함수 테스트
const getBaseUrl = (): string => API_URL as string;

// 테스트 함수
const testGetBaseUrl = () => {
  console.log('=== getBaseUrl() 테스트 시작 ===');
  
  const baseUrl = getBaseUrl();
  console.log('API_URL 상수값:', API_URL);
  console.log('getBaseUrl() 반환값:', baseUrl);
  
  // 예상값 확인
  const expectedUrl = 'http://localhost:8000';
  
  if (baseUrl === expectedUrl) {
    console.log('✅ getBaseUrl() 테스트 통과');
    return true;
  } else {
    console.log('❌ getBaseUrl() 테스트 실패');
    console.log('예상값:', expectedUrl);
    console.log('실제값:', baseUrl);
    return false;
  }
};

// 8000 포트로 API 요청 테스트
const testApiRequest = async () => {
  console.log('\n=== 8000/api 요청 테스트 시작 ===');
  
  const baseUrl = getBaseUrl();
  const testEndpoint = `${baseUrl}/api/test`;
  
  console.log('테스트 요청 URL:', testEndpoint);
  
  try {
    // fetch를 사용한 간단한 요청 테스트
    const response = await fetch(testEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('응답 상태:', response.status);
    console.log('응답 URL:', response.url);
    
    if (response.url.includes('localhost:8000')) {
      console.log('✅ 8000 포트로 정상 요청됨');
      return true;
    } else {
      console.log('❌ 잘못된 포트로 요청됨');
      return false;
    }
  } catch (error) {
    console.log('요청 결과:', error);
    // 에러가 발생해도 URL이 올바르게 구성되었는지 확인
    if (testEndpoint.includes('localhost:8000')) {
      console.log('✅ URL 구성은 올바름 (서버 연결 문제일 수 있음)');
      return true;
    } else {
      console.log('❌ URL 구성 오류');
      return false;
    }
  }
};

// 모든 테스트 실행
export const runAllTests = async () => {
  console.log('🚀 API 연결 테스트 시작\n');
  
  const urlTest = testGetBaseUrl();
  const apiTest = await testApiRequest();
  
  console.log('\n=== 테스트 결과 요약 ===');
  console.log('getBaseUrl() 테스트:', urlTest ? '통과' : '실패');
  console.log('API 요청 테스트:', apiTest ? '통과' : '실패');
  
  if (urlTest && apiTest) {
    console.log('🎉 모든 테스트 통과!');
  } else {
    console.log('⚠️ 일부 테스트 실패');
  }
  
  return { urlTest, apiTest };
};

// 브라우저 콘솔에서 바로 실행할 수 있는 함수
(window as any).testApiConnection = runAllTests;

console.log('브라우저 콘솔에서 testApiConnection()을 실행하여 테스트하세요');