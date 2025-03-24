import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SelectLevel from 'components/SelectLevel';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import * as userActions from 'store/modules/user';
import SelectStep from 'components/SelectStep';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import ReactPageScroller from 'react-page-scroller';

// 타입 정의
const levels: string[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
const steps: number[] = [1, 2, 3, 4, 5, 6];

const Study: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const learningCheckpoint = useSelector((state: RootState) => state.user.learningCheckpoint);
  
  // 현재 페이지 상태 관리
  const [currentPage, setCurrentPage] = useState<number>(0);

  const handleSelectLevel = React.useCallback((selectedLevel: string) => {
    dispatch(userActions.setLevelCheckpoint(selectedLevel));
  }, [dispatch]);

  const handleSelectStep = React.useCallback((selectedStep: number[]) => {
    dispatch(userActions.setStepCheckpoint(selectedStep));
  }, [dispatch]);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number): void => {
    setCurrentPage(page);
  };

  return (
    <ReactPageScroller
      pageOnChange={handlePageChange}
      customPageNumber={currentPage}
    >
      {/* 첫 번째 섹션: 레벨 선택 */}
      <div>
        <CenterDiv>
          <SelectLevel 
            levels={levels} 
            onSelectLevel={handleSelectLevel} 
            progressLevel={learningCheckpoint.level} 
          />
        </CenterDiv>
      </div>

      {/* 두 번째 섹션: 스텝 선택 */}
      <div>
        <CenterDiv>
          <SelectStep 
            progressLevel={learningCheckpoint.level} 
            stepLength={steps.length} 
            onSelectStep={handleSelectStep} 
          />
        </CenterDiv>
      </div>

      {/* 세 번째 섹션: 시작 버튼 */}
      <div>
        <CenterDiv>
          <DefaultButton onClick={() => navigate('/flash-cards')}>
            Start
          </DefaultButton>
        </CenterDiv>
      </div>
    </ReactPageScroller>
  );
};

export default Study;