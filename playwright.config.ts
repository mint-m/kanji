import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure', // 재시도가 없으니 실패한 테스트의 트레이스를 남겨 CI에서만 나는 실패도 볼 수 있게 한다
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Google 로그인 스크립트(GSI)를 막는다 — CI에는 .env가 없어 client_id가 비고, GSI는 그때 initCodeClient에서
        // 예외를 던져 로그인 전 화면이 오류 화면이 된다. 스크립트가 늦게 오면 통과해서 실패가 들쭉날쭉했다
        launchOptions: { args: ['--host-resolver-rules=MAP accounts.google.com ~NOTFOUND'] },
      },
    },
  ],
  webServer: {
    command: 'cd frontend && yarn start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120_000, // CI 러너에서 CRA 첫 컴파일이 60초를 넘길 수 있다
  },
});
