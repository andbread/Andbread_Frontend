import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import Icon, { type IconType } from '@/components/common/icon/Icon'
import NbreadsImage from '@/components/common/nbreadImage/NbreadsImage'
import RevealOnScroll from '@/components/landing/RevealOnScroll'
import NbreadLogo from '@/assets/logo/nbread-logo-text.svg'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: '엔빵',
  description:
    '친구와 가족과 나누는 구독 서비스의 결제일과 정산 현황을 한 곳에서 관리하는 구독 공유 관리 서비스',
  path: '/',
  absoluteTitle: true,
})

const painCards: {
  icon: IconType
  title: string
  description: string
}[] = [
  {
    icon: 'warning',
    title: '어디서 얼마 내는지 기억이 안 나요',
    description:
      '넷플릭스, 유튜브, 왓챠, 라프텔... 공유 중인 구독이 많아질수록 어디서 얼마를 내는지 헷갈리기 시작해요.',
  },
  {
    icon: 'calendar',
    title: '결제일을 깜빡해서 구독 취소된 적 있어요',
    description:
      '매번 결제일을 따로 확인해야 해서 놓치기 쉬워요. 자동으로 정리된 결제 흐름이 필요해요.',
  },
  {
    icon: 'search',
    title: '누가 얼마 보냈는지 일일이 확인해야 해요',
    description:
      '카카오페이 내역, 계좌 이체 내역, 메시지 내용을 뒤져야 하는 정산 확인. 그 번거로움이 싫어서 그냥 포기하게 돼요.',
  },
]

const solutionPoints = [
  {
    title: '그룹 단위 관리',
    description:
      '구독 서비스별로 그룹을 만들고, 결제 정보를 체계적으로 정리할 수 있어요.',
  },
  {
    title: '1/N 정산 계산기',
    description: '인원 수에 맞게 자동으로 나눠진 금액을 바로 확인할 수 있어요.',
  },
  {
    title: '정산 현황 추적',
    description:
      '누가 정산을 완료했는지, 완료하지 않았는지 실시간으로 한 눈에 확인할 수 있어요.',
  },
]

const featureCards: {
  icon: string
  title: string
  description: string
  wide?: boolean
}[] = [
  {
    icon: '👥',
    title: '그룹 관리',
    description: '구독 서비스별로\n그룹을 만들고\n멤버와 월 요금을\n한 눈에',
  },
  {
    icon: '🔗',
    title: '간편 초대',
    description: `초대 링크만\n카톡으로 보내면\n누구나 쉽게\n초대 가능`,
  },
  {
    icon: '✅',
    title: '정산 추적',
    description: '참여 중인 사람들이\n모두 냈는지\n정산 여부\n바로 확인 가능',
  },
  {
    icon: '📢',
    title: '채팅 및 공지',
    description: '계정 정보나\n중요한 공지를\n채팅과 게시글로\n간편하게 공유',
  },
  {
    icon: '🔔',
    title: '주요 알림',
    description:
      '결제일 알림, 결제 완료 알림, 채팅 알림 등 정산에 관한 중요 정보 푸시 알림',
    wide: true,
  },
]

const steps = [
  {
    label: 'STEP 1',
    title: '그룹 만들기',
    description:
      '구독 서비스 이름, 월/연 요금, 결제일만 입력하면 1분만에 그룹을 만들 수 있어요.',
  },
  {
    label: 'STEP 2',
    title: '멤버 초대하기',
    description:
      '초대 링크를 카톡으로 공유해 멤버를 초대해보세요. 자동으로 1/N 금액이 계산돼요.',
  },
  {
    label: 'STEP 3',
    title: '정산 현황 확인',
    description:
      '정산을 완료한 멤버는 정산 완료를 직접 체크해요. 그룹장이 직접 체크할 수도 있어요.',
  },
]

const SectionHeading = ({
  eyebrow,
  title,
}: {
  eyebrow: string
  title: ReactNode
}) => (
  <div>
    <p className="text-heading04 text-secondary-200">{eyebrow}</p>
    <h2 className="mt-16 whitespace-pre-line text-[28px] font-bold leading-[34px] text-gray-800">
      {title}
    </h2>
  </div>
)

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-background text-gray-800">
      <section className="overflow-hidden px-24 pb-0 pt-36">
        <header className="flex items-center justify-between">
          <NbreadLogo width={81} height={29} aria-label="엔빵" role="img" />
          <Link
            href="/login"
            className="btn rounded-40 bg-secondary-100 px-16 py-9 text-heading05 text-white"
          >
            시작하기
          </Link>
        </header>

        <RevealOnScroll className="mt-54">
          <p className="text-heading04 text-secondary-200">
            구독 나눔, 이제 쉽게
          </p>
          <h1 className="mt-16 text-[30px] font-bold leading-[36px] text-gray-800">
            구독 공유,
            <br />
            헷갈리게 쓰지 말고
            <br />
            <span className="text-secondary-300">엔빵</span>으로 딱 정리
          </h1>
          <p className="mt-28 break-keep text-[16px] font-normal leading-[26px] text-gray-600">
            넷플릭스, 유튜브 프리미엄, 왓챠 등 친구, 가족과 나누는 구독 서비스의
            결제일과 정산 현황을 한 곳에서 관리할 수 있어요.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={80}>
          <Link
            href="/login"
            className="btn btn-large btn-primary mt-28 flex items-center justify-center"
          >
            지금 시작하기 <span aria-hidden="true">→</span>
          </Link>
        </RevealOnScroll>

        <RevealOnScroll delay={160}>
          <Image
            src="/image/landing/home.png"
            alt="엔빵 홈 화면 미리보기"
            width={205}
            height={280}
            priority
            className="mx-auto mt-40 h-auto w-[205px]"
          />
        </RevealOnScroll>
      </section>

      <section className="bg-gradient-to-b from-primary-400 to-primary-100 px-24 py-48">
        <RevealOnScroll>
          <div className="inline-flex rounded-40 bg-white px-12 py-6">
            <p className="text-heading04 text-secondary-300">
              이런 경험 있으신가요?
            </p>
          </div>
          <h2 className="mt-20 text-[28px] font-bold leading-[34px] text-gray-800">
            매달 반복되는
            <br />
            정산하기
          </h2>
          <p className="mt-28 break-keep text-[16px] leading-[26px] text-gray-700">
            구독 공유는 편리하지만,
            <br />
            매달 정산이 번거롭고 헷갈려요.
          </p>
        </RevealOnScroll>

        <div className="mt-28 flex flex-col gap-12">
          {painCards.map((card, index) => (
            <RevealOnScroll
              as="article"
              key={card.title}
              className="shadow-card rounded-8 bg-white p-18"
              delay={index * 80}
            >
              <Icon
                type={card.icon}
                width={20}
                height={20}
                fill="text-secondary-300"
                ariaHidden
              />
              <h3 className="mt-14 text-heading04 text-gray-800">
                {card.title}
              </h3>
              <p className="mt-14 break-keep text-[15px] leading-[24px] text-gray-600">
                {card.description}
              </p>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <section className="bg-background px-24 py-54">
        <RevealOnScroll>
          <SectionHeading
            eyebrow="그래서 만들었어요"
            title={
              <>
                구독 공유의 모든 것을
                <br />한 곳에서
              </>
            }
          />
          <p className="mt-28 break-keep text-[16px] leading-[26px] text-gray-600">
            그룹 생성, 친구 초대, 이달의 구독료 정산까지 엔빵에서 모두 끝낼 수
            있어요.
          </p>
        </RevealOnScroll>

        <RevealOnScroll
          className="shadow-card mt-32 rounded-8 bg-white px-18 py-22"
          delay={80}
        >
          {solutionPoints.map((point, index) => (
            <div key={point.title} className={index === 0 ? '' : 'mt-24'}>
              <div className="flex items-center gap-8">
                <Icon
                  type="check"
                  width={16}
                  height={16}
                  fill="text-secondary-300"
                  ariaHidden
                />
                <h3 className="text-heading04 text-gray-800">{point.title}</h3>
              </div>
              <p className="mt-12 break-keep text-[15px] leading-[24px] text-gray-600">
                {point.description}
              </p>
            </div>
          ))}
        </RevealOnScroll>
      </section>

      <section className="bg-primary-100 px-24 py-54">
        <RevealOnScroll>
          <SectionHeading
            eyebrow="핵심 기능"
            title={
              <>
                불필요한 건 빼고
                <br />
                필요한 것만 넣었어요
              </>
            }
          />
          <p className="mt-28 break-keep text-[16px] leading-[26px] text-gray-600">
            구독 공유에 필요한 기능만 모았어요.
          </p>
        </RevealOnScroll>

        <div className="mt-28 grid grid-cols-2 gap-8">
          {featureCards.map((feature, index) => (
            <RevealOnScroll
              as="article"
              key={feature.title}
              className={`shadow-card rounded-8 bg-white p-16 ${
                feature.wide ? 'col-span-2' : 'min-h-[166px]'
              }`}
              delay={index * 70}
            >
              <h3 className="flex items-start gap-4 text-heading04 text-gray-800">
                <span className="mt-[1px] leading-none" aria-hidden="true">
                  {feature.icon}
                </span>
                <span>{feature.title}</span>
              </h3>
              <p className="mt-14 whitespace-pre-line break-keep text-[15px] leading-[24px] text-gray-600">
                {feature.description}
              </p>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <section className="bg-background px-24 py-54">
        <RevealOnScroll>
          <SectionHeading
            eyebrow="사용 방법"
            title={
              <>
                3단계로
                <br />
                바로 시작하기
              </>
            }
          />
          <p className="mt-28 break-keep text-[16px] leading-[26px] text-gray-600">
            복잡한 설정 필요 없이
            <br />
            3단계면 충분해요.
          </p>
        </RevealOnScroll>

        <RevealOnScroll
          className="shadow-card mt-32 rounded-8 bg-white px-18 py-22"
          delay={80}
        >
          {steps.map((step, index) => (
            <div key={step.label} className={index === 0 ? '' : 'mt-28'}>
              <p className="text-heading05 text-secondary-300">{step.label}</p>
              <h3 className="mt-6 text-heading04 text-gray-800">
                {step.title}
              </h3>
              <p className="mt-12 text-[15px] leading-[24px] text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </RevealOnScroll>
      </section>

      <section className="bg-background px-24 py-48 text-center">
        <RevealOnScroll>
          <div className="flex justify-center">
            <NbreadsImage isFloating={true} />
          </div>
          <h2 className="mt-24 text-[22px] font-bold leading-[34px] text-gray-800">
            지금 바로 시작하고
            <br />
            정산 스트레스에서 벗어나세요
          </h2>
          <Link
            href="/login"
            className="btn btn-large btn-primary mt-28 flex items-center justify-center"
          >
            지금 시작하기 <span aria-hidden="true">→</span>
          </Link>
        </RevealOnScroll>
      </section>
    </main>
  )
}
