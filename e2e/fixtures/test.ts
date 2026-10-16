import { test as base } from '@playwright/test'
import { Seeder } from './seed'

interface Fixtures {
  /** 테스트가 만든 데이터를 추적하고 종료 시 되돌린다. */
  seed: Seeder
}

export const test = base.extend<Fixtures>({
  seed: async ({}, use) => {
    const seeder = new Seeder()

    try {
      await use(seeder)
    } finally {
      await seeder.cleanup()
    }
  },
})

export { expect } from '@playwright/test'
