import { api } from '../services/apiClient';
import { getPreferences, knownPreferences, updatePreferences } from '../services/userService';

jest.mock('../services/apiClient', () => ({ api: { get: jest.fn(), patch: jest.fn() } }));

const READING = { dailyGoal: 30, revealFirst: 'reading' };
const MEANING = { dailyGoal: 30, revealFirst: 'meaning' };

describe('학습 설정', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'token-a');
  });

  it('한 번 받아 두고 다시 묻지 않는다 — 받은 뒤에는 바로 꺼내 쓸 수 있다', async () => {
    (api.get as jest.Mock).mockResolvedValue({ success: true, data: READING });
    expect(await getPreferences()).toEqual(READING);
    expect(await getPreferences()).toEqual(READING);
    expect(knownPreferences()).toEqual(READING);
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('로그인한 사람(토큰)이 바뀌면 다시 받는다', async () => {
    (api.get as jest.Mock).mockResolvedValue({ success: true, data: MEANING });
    localStorage.setItem('token', 'token-b');
    expect(knownPreferences()).toBeUndefined();
    expect(await getPreferences()).toEqual(MEANING);
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('바꾸면 받아 둔 설정도 바뀐다', async () => {
    (api.patch as jest.Mock).mockResolvedValue({ success: true, data: MEANING });
    await updatePreferences({ revealFirst: 'meaning' });
    expect(api.patch).toHaveBeenCalledWith('/api/users/me/preferences', { revealFirst: 'meaning' });
    expect(await getPreferences()).toEqual(MEANING);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('받지 못하면 기억하지 않고 다음에 다시 묻는다', async () => {
    localStorage.setItem('token', 'token-c');
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({ success: true, data: READING });
    await expect(getPreferences()).rejects.toThrow('network');
    expect(await getPreferences()).toEqual(READING);
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
