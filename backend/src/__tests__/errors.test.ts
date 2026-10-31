import { AppError, BadRequestError, InvalidStepRangeError, NotFoundError } from '../utils/errors';
import { errorHandler } from '../middleware/errorHandler';

describe('AppError 계층', () => {
  it('하위 클래스 판별이 실제 생성한 클래스를 따른다', () => {
    const err = new InvalidStepRangeError('x');
    expect(err).toBeInstanceOf(InvalidStepRangeError);
    expect(err).toBeInstanceOf(BadRequestError);
    expect(err).toBeInstanceOf(AppError);
    expect(err).not.toBeInstanceOf(NotFoundError);
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe('InvalidStepRangeError');
  });
});

describe('errorHandler', () => {
  const makeRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };
  const req: any = { path: '/x', method: 'GET' };

  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it('다른 응답과 같은 { success: false, message } 봉투로 내려준다', () => {
    const res = makeRes();
    errorHandler(new NotFoundError('User not found'), req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'User not found' }));
  });

  it('상태 코드가 없는 에러는 500', () => {
    const res = makeRes();
    errorHandler(new Error('boom'), req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
