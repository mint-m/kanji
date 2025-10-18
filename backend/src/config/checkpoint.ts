/**
 * 체크포인트 설정 관리
 *
 * 체크포인트 자동 저장 빈도와 동작 방식을 제어합니다.
 * 환경 변수(.env)를 통해 설정 변경 가능하며, 기본값은 환경(dev/prod)에 따라 다름
 */

export const CheckpointConfig = {
  /**
   * 자동 저장 간격 (단어 수 기준)
   *
   * 설정값:
   * - Development: 1 (매 단어마다 저장)
   * - Production: 5 (5단어마다 저장)
   * - 환경변수: CHECKPOINT_SAVE_INTERVAL
   *
   * 예시:
   * - interval=1: 단어 1, 2, 3, 4, 5... 모두 저장
   * - interval=5: 단어 5, 10, 15, 20... 만 저장
   */
  AUTO_SAVE_INTERVAL: process.env.CHECKPOINT_SAVE_INTERVAL
    ? parseInt(process.env.CHECKPOINT_SAVE_INTERVAL, 10)
    : process.env.NODE_ENV === 'production'
    ? 5
    : 1,

  /**
   * 사용자당 최대 체크포인트 보관 개수
   *
   * - 기본값: 10개
   * - 환경변수: CHECKPOINT_MAX_PER_USER
   * - 초과 시 오래된 체크포인트부터 자동 삭제
   */
  MAX_CHECKPOINTS_PER_USER: process.env.CHECKPOINT_MAX_PER_USER
    ? parseInt(process.env.CHECKPOINT_MAX_PER_USER, 10)
    : 10,

  /**
   * 체크포인트 만료 기간 (일)
   *
   * - 기본값: 30일
   * - 환경변수: CHECKPOINT_EXPIRATION_DAYS
   * - MongoDB TTL 인덱스로 자동 삭제됨
   */
  CHECKPOINT_EXPIRATION_DAYS: process.env.CHECKPOINT_EXPIRATION_DAYS
    ? parseInt(process.env.CHECKPOINT_EXPIRATION_DAYS, 10)
    : 30,

  /**
   * 상세 로깅 활성화 여부
   *
   * - Development: 자동 활성화
   * - Production: 환경변수로 제어 (CHECKPOINT_VERBOSE_LOGGING=true)
   * - 활성화 시 모든 체크포인트 저장/복원 작업이 콘솔에 출력됨
   */
  VERBOSE_LOGGING: process.env.CHECKPOINT_VERBOSE_LOGGING === 'true' || process.env.NODE_ENV !== 'production',

  /**
   * 체크포인트 저장 여부 판단
   *
   * 현재 진행 상황(currentIndex)과 덱 완료 여부를 기반으로
   * 체크포인트를 저장할지 결정합니다.
   *
   * @param currentIndex - 현재 학습 중인 단어의 인덱스
   * @param isCompleted - 덱 완료 여부
   * @returns 저장해야 하면 true, 아니면 false
   *
   * 로직:
   * 1. 덱 완료 시 무조건 저장 (데이터 보존)
   * 2. 그 외에는 AUTO_SAVE_INTERVAL 간격으로 저장
   *
   * 예시 (interval=5):
   * - currentIndex=5: true (5 % 5 === 0)
   * - currentIndex=10: true
   * - currentIndex=3: false
   */
  shouldSaveCheckpoint(currentIndex: number, isCompleted: boolean = false): boolean {
    // 덱 완료 시 항상 저장
    if (isCompleted) {
      return true;
    }

    // 설정된 간격에 따라 저장
    return currentIndex % this.AUTO_SAVE_INTERVAL === 0;
  },

  /**
   * 체크포인트 작업 로그 출력
   *
   * VERBOSE_LOGGING이 활성화된 경우에만 로그 출력
   * Development 모드에서는 기본적으로 활성화됨
   *
   * @param message - 로그 메시지
   * @param args - 추가 인자들
   */
  log(message: string, ...args: any[]): void {
    if (this.VERBOSE_LOGGING) {
      console.log(`[Checkpoint] ${message}`, ...args);
    }
  },

  /**
   * 체크포인트 오류 로그 출력
   *
   * VERBOSE_LOGGING 설정과 관계없이 항상 출력됨
   * 오류는 반드시 기록되어야 하므로 무조건 로깅
   *
   * @param message - 오류 메시지
   * @param error - 오류 객체
   */
  logError(message: string, error: any): void {
    console.error(`[Checkpoint Error] ${message}`, error);
  },
};

export default CheckpointConfig;
