// src/components/ApiTestComponent.tsx
import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { API_URL } from '../services/authService';

interface TestResult {
  endpoint: string;
  url: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  actualUrl?: string;
}

const ApiTestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 테스트할 API 엔드포인트들
  const testEndpoints = [
    '/api/test',
    '/api/words/kanjiSearch?kanji=水',
    '/api/progress/learning-stats',
    '/auth/profile',
  ];

  const runApiTest = async (endpoint: string): Promise<TestResult> => {
    const fullUrl = `${API_URL}${endpoint}`;
    
    try {
      console.log(`Testing: ${fullUrl}`);
      
      // axios 요청
      const response = await axios.get(fullUrl, {
        timeout: 5000,
        validateStatus: () => true, // 모든 상태 코드를 성공으로 처리 (연결 테스트가 목적)
      });

      return {
        endpoint,
        url: fullUrl,
        status: 'success',
        message: `응답 상태: ${response.status}`,
        actualUrl: response.config.url,
      };
    } catch (error: any) {
      let message = '알 수 없는 오류';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          message = '서버 연결 실패 (서버가 실행 중이 아님)';
        } else if (error.response) {
          message = `HTTP ${error.response.status}: ${error.response.statusText}`;
        } else if (error.request) {
          message = '요청 전송 실패';
        } else {
          message = error.message;
        }
      }

      return {
        endpoint,
        url: fullUrl,
        status: 'error',
        message,
        actualUrl: error.config?.url,
      };
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    console.log('🚀 API 연결 테스트 시작');
    console.log('기본 URL:', API_URL);
    
    const results: TestResult[] = [];
    
    for (const endpoint of testEndpoints) {
      const result = await runApiTest(endpoint);
      results.push(result);
      setTestResults([...results]); // 실시간 업데이트
    }
    
    setIsLoading(false);
    
    // 결과 요약
    const successCount = results.filter(r => r.status === 'success').length;
    console.log(`\n테스트 완료: ${successCount}/${results.length} 성공`);
  };

  const checkUrlConfiguration = () => {
    console.log('=== URL 설정 확인 ===');
    console.log('API_URL 상수:', API_URL);
    console.log('예상 기본 URL:', 'http://localhost:8000');
    console.log('URL 설정 올바른지:', API_URL === 'http://localhost:8000' ? '✅' : '❌');
    
    // 프록시 설정 확인 (브라우저에서만 가능)
    if (typeof window !== 'undefined') {
      console.log('현재 페이지 URL:', window.location.origin);
      console.log('프록시를 통한 상대 경로 테스트 URL:', `${window.location.origin}/api/test`);
    }
  };

  return (
    <Container>
      <Title>API 연결 테스트</Title>
      
      <InfoSection>
        <InfoItem>
          <Label>기본 API URL:</Label>
          <Value>{API_URL}</Value>
        </InfoItem>
        <InfoItem>
          <Label>상태:</Label>
          <Value>{API_URL === 'http://localhost:8000' ? '✅ 올바름' : '❌ 잘못됨'}</Value>
        </InfoItem>
      </InfoSection>

      <ButtonGroup>
        <TestButton onClick={runAllTests} disabled={isLoading}>
          {isLoading ? '테스트 중...' : 'API 연결 테스트 실행'}
        </TestButton>
        <TestButton onClick={checkUrlConfiguration}>
          URL 설정 확인 (콘솔)
        </TestButton>
      </ButtonGroup>

      <ResultsSection>
        <SectionTitle>테스트 결과</SectionTitle>
        {testResults.length === 0 && !isLoading && (
          <NoResults>테스트를 실행하려면 위의 버튼을 클릭하세요.</NoResults>
        )}
        
        {testResults.map((result, index) => (
          <ResultItem key={index} status={result.status}>
            <ResultHeader>
              <Endpoint>{result.endpoint}</Endpoint>
              <Status status={result.status}>
                {result.status === 'success' ? '✅' : '❌'}
              </Status>
            </ResultHeader>
            <ResultDetails>
              <Detail>URL: {result.url}</Detail>
              <Detail>결과: {result.message}</Detail>
              {result.actualUrl && result.actualUrl !== result.url && (
                <Detail>실제 URL: {result.actualUrl}</Detail>
              )}
            </ResultDetails>
          </ResultItem>
        ))}
      </ResultsSection>

      <InstructionSection>
        <SectionTitle>사용 방법</SectionTitle>
        <Instruction>1. 백엔드 서버가 8000 포트에서 실행 중인지 확인</Instruction>
        <Instruction>2. "API 연결 테스트 실행" 버튼 클릭</Instruction>
        <Instruction>3. 각 엔드포인트의 연결 상태 확인</Instruction>
        <Instruction>4. 브라우저 개발자 도구 콘솔에서 상세 로그 확인</Instruction>
      </InstructionSection>
    </Container>
  );
};

export default ApiTestComponent;

// Styled Components
const Container = styled.div`
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f5f5f5;
  border-radius: 8px;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 20px;
  text-align: center;
`;

const SectionTitle = styled.h3`
  color: #555;
  margin: 20px 0 10px 0;
  border-bottom: 2px solid #ddd;
  padding-bottom: 5px;
`;

const InfoSection = styled.div`
  background: white;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
`;

const InfoItem = styled.div`
  display: flex;
  margin-bottom: 8px;
`;

const Label = styled.span`
  font-weight: bold;
  margin-right: 10px;
  min-width: 120px;
`;

const Value = styled.span`
  font-family: monospace;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const TestButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover:not(:disabled) {
    background: #0056b3;
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const ResultsSection = styled.div`
  background: white;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
`;

const NoResults = styled.div`
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 20px;
`;

const ResultItem = styled.div<{ status: string }>`
  border: 1px solid ${props => props.status === 'success' ? '#d4edda' : '#f8d7da'};
  background: ${props => props.status === 'success' ? '#f8fff9' : '#fff8f8'};
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 10px;
`;

const ResultHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 5px;
`;

const Endpoint = styled.span`
  font-weight: bold;
  font-family: monospace;
  flex: 1;
`;

const Status = styled.span<{ status: string }>`
  font-size: 18px;
`;

const ResultDetails = styled.div`
  font-size: 12px;
  color: #666;
`;

const Detail = styled.div`
  margin-bottom: 2px;
  font-family: monospace;
`;

const InstructionSection = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 5px;
  padding: 15px;
`;

const Instruction = styled.div`
  margin-bottom: 5px;
  color: #856404;
`;