import type { Locator, Page } from '@playwright/test'

/**
 * 엔빵 카드의 값 필드. 편집 카드와 조회 카드가 같은 이름을 쓰지만 둘은 배타 렌더라
 * 화면 모드와 상관없이 같은 방식으로 짚을 수 있다.
 */
type NbreadFieldName =
  | 'amount'
  | 'participant-count'
  | 'payment-amount'
  | 'payment-date'

export const nbreadField = (page: Page, field: NbreadFieldName): Locator =>
  page.getByTestId(`nbread-${field}`)

export const participantCard = (page: Page, name: string): Locator =>
  page
    .getByTestId('participant-card')
    .filter({ has: page.getByText(name, { exact: true }) })

/** input[type=checkbox]는 CSS로 숨겨져 있어 클릭은 감싸는 label에 해야 한다. */
export const participantCheckboxLabel = (page: Page, name: string): Locator =>
  participantCard(page, name).getByTestId('participant-payment-toggle')

/**
 * 숨겨진 input이라도 checked와 disabled 상태는 그대로 읽을 수 있다.
 * 다만 화면에 그려졌는지 기다릴 때는 이 요소가 아니라 label을 봐야 한다.
 */
export const participantCheckbox = (page: Page, name: string): Locator =>
  participantCheckboxLabel(page, name).locator('input[type="checkbox"]')

export const toastMessage = (page: Page, message: string): Locator =>
  page.locator('.Toastify').getByText(message, { exact: true })

/** 매월 결제 그룹은 `이번 달 엔빵`과 `나의 엔빵`에 모두 나오므로 목록을 좁혀서 짚는다. */
const myNbreadSection = (page: Page): Locator =>
  page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: '나의 엔빵' }) })

/**
 * 목록 카드는 role이 없는 div이므로 사용자가 실제로 읽고 누르는 제목을 짚는다.
 * 클릭은 카드의 핸들러까지 전파된다.
 */
export const myNbreadItem = (page: Page, title: string): Locator =>
  myNbreadSection(page).getByText(title, { exact: true })
