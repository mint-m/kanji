import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import UserProgress from '../models/userProgress';
import CheckpointService from '../services/checkpointService';
import { ProgressType } from '../interfaces/userProgress';

/**
 * 덱 작업 후 체크포인트 자동 저장 미들웨어
 *
 * 용도: 덱 진행 상황을 수정하는 작업 후에 사용
 *
 * 동작 방식:
 * 1. res.json을 래핑하여 응답 후에 체크포인트 저장
 * 2. 성공 응답(data.success === true)일 때만 저장
 * 3. 비동기로 저장하여 응답 속도에 영향 없음 (fire-and-forget)
 *
 * 주의사항:
 * - 현재는 사용하지 않음 (deckController에서 직접 저장)
 * - 향후 범용 미들웨어로 사용 가능
 */
export const autoSaveCheckpoint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 성공 응답에만 자동 저장 트리거
    const originalSend = res.json;

    res.json = function (data: any): Response {
      // 원본 응답 먼저 전송
      const response = originalSend.call(this, data);

      // 비동기 체크포인트 저장 (응답 차단 안 함)
      if (data.success && req.user) {
        const progressType = req.params.progressType || req.body.progressType;

        if (progressType && ['main', 'sub'].includes(progressType)) {
          // Fire and forget - 응답 차단하지 않음
          saveCheckpointAsync(req.user._id, progressType as ProgressType).catch((error) => {
            console.error('Auto-save checkpoint failed:', error);
          });
        }
      }

      return response;
    };

    next();
  } catch (error) {
    // 미들웨어 실패해도 요청 차단하지 않음
    console.error('Checkpoint middleware error:', error);
    next();
  }
};

/**
 * 응답 차단 없이 체크포인트를 저장하는 비동기 함수
 *
 * 동작:
 * - UserProgress를 조회하여 진행 중인 세션인지 확인
 * - 완료되지 않은 세션만 저장 (완료된 세션은 저장 불필요)
 * - 오류 발생 시 콘솔 로그만 출력 (메인 로직에 영향 없음)
 */
async function saveCheckpointAsync(userId: any, progressType: ProgressType): Promise<void> {
  try {
    const progress = await UserProgress.findByUserAndType(userId, progressType);

    if (progress && !progress.isCompleted()) {
      await UserProgress.saveCheckpoint(userId, progressType);
      console.log(`Auto-saved checkpoint for user ${userId}, type ${progressType}`);
    }
  } catch (error) {
    console.error('Async checkpoint save error:', error);
  }
}

/**
 * 세션 접근 시 체크포인트 복원 미들웨어
 *
 * 용도:
 * - 사용자가 세션에 접근할 때 저장된 체크포인트가 있으면 자동 복원
 * - 앱 재시작, 브라우저 재접속 등의 경우 학습 진행 상황 복구
 *
 * 동작 방식:
 * 1. 활성화된 UserProgress 세션이 있는지 확인
 * 2. 세션이 없으면 체크포인트에서 복원 시도
 * 3. 복원 성공 시 UserProgress 컬렉션에 재생성
 * 4. 요청 객체에 복원 정보 메타데이터 추가 (controller에서 활용 가능)
 *
 * 주의사항:
 * - 현재는 사용하지 않음 (progressController에서 직접 복원)
 * - 복원 실패해도 요청 차단하지 않음 (graceful degradation)
 */
export const tryRestoreCheckpoint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next();
    }

    const progressType = req.params.progressType || req.body.progressType;

    if (progressType && ['main', 'sub'].includes(progressType)) {
      const userId = req.user._id;

      // 세션 존재 여부 확인
      const existingProgress = await UserProgress.findByUserAndType(userId, progressType as ProgressType);

      // 활성 세션이 없으면 체크포인트에서 복원 시도
      if (!existingProgress) {
        const restoreResult = await CheckpointService.restoreCheckpoint(userId, progressType as ProgressType);

        if (restoreResult.success && restoreResult.checkpoint) {
          // 체크포인트에서 UserProgress 복원
          await CheckpointService.restoreProgressFromCheckpoint(restoreResult.checkpoint, UserProgress);

          console.log(`Restored checkpoint for user ${userId}, type ${progressType}`);

          // Controller에서 사용할 수 있도록 요청에 메타데이터 추가
          (req as any).checkpointRestored = true;
          (req as any).restoredCheckpoint = restoreResult.checkpoint;
        }
      }
    }

    next();
  } catch (error) {
    // 복원 실패해도 요청 차단하지 않음
    console.error('Checkpoint restore middleware error:', error);
    next();
  }
};

/**
 * 덱 완료 전 체크포인트 저장 미들웨어
 *
 * 용도:
 * - 다음 윈도우로 전환하기 전에 현재 상태의 스냅샷 생성
 * - 전환 중 오류 발생 시 이전 상태로 복구 가능
 *
 * 동작 방식:
 * 1. 현재 덱이 완료되었는지 확인 (isCompleted() === true)
 * 2. 완료되었으면 전환 전 체크포인트 저장
 * 3. 요청 객체에 저장 완료 메타데이터 추가
 *
 * 사용 시나리오:
 * - completeDeck API 호출 전
 * - generateNextWindow API 호출 전
 *
 * 주의사항:
 * - 현재는 사용하지 않음 (deckController에서 직접 저장)
 * - 저장 실패해도 요청 차단하지 않음
 */
export const saveCheckpointBeforeTransition = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next();
    }

    const progressType = req.params.progressType || req.body.progressType;

    if (progressType && ['main', 'sub'].includes(progressType)) {
      const userId = req.user._id;
      const progress = await UserProgress.findByUserAndType(userId, progressType as ProgressType);

      if (progress && progress.isCompleted()) {
        // 다음 윈도우로 이동하기 전 체크포인트 저장
        await UserProgress.saveCheckpoint(userId, progressType as ProgressType);
        console.log(`Saved pre-transition checkpoint for user ${userId}, type ${progressType}`);

        // 요청에 메타데이터 추가
        (req as any).checkpointSaved = true;
      }
    }

    next();
  } catch (error) {
    // 저장 실패해도 요청 차단하지 않음
    console.error('Pre-transition checkpoint save error:', error);
    next();
  }
};

/**
 * 만료된 체크포인트 정리 스케줄 작업
 *
 * 용도:
 * - 오래된 체크포인트를 주기적으로 삭제하여 DB 용량 관리
 * - TTL 인덱스와 함께 동작하여 이중 정리
 *
 * 사용 방법:
 * ```typescript
 * // cron job 설정 예시 (매일 새벽 2시)
 * import cron from 'node-cron';
 * import { cleanupExpiredCheckpoints } from './middleware/checkpointMiddleware';
 *
 * cron.schedule('0 2 * * *', async () => {
 *   await cleanupExpiredCheckpoints();
 * });
 * ```
 *
 * 동작:
 * 1. Checkpoint 모델의 cleanupExpiredCheckpoints() 호출
 * 2. expires_at이 현재 시간보다 이전인 문서 삭제
 * 3. 삭제된 개수 로그 출력
 *
 * 참고:
 * - MongoDB TTL 인덱스도 설정되어 있어 자동 삭제됨
 * - 이 함수는 추가 안전장치 역할
 */
export async function cleanupExpiredCheckpoints(): Promise<void> {
  try {
    const Checkpoint = (await import('../models/checkpoint')).default;
    const deletedCount = await Checkpoint.cleanupExpiredCheckpoints();
    console.log(`Cleaned up ${deletedCount} expired checkpoints`);
  } catch (error) {
    console.error('Checkpoint cleanup error:', error);
  }
}

export default {
  autoSaveCheckpoint,
  tryRestoreCheckpoint,
  saveCheckpointBeforeTransition,
  cleanupExpiredCheckpoints,
};
