'use client'

import DetailHeader from '@/components/common/header/DetailHeader'
import Image from 'next/image'

const addToHomeSteps = [
  {
    title: '1. Safari에서 엔빵 접속하기',
    description: '먼저 Safari에서 엔빵에 접속해주세요.',
    note: '※ Chrome이나 카카오톡 브라우저에서는 정상적으로 추가되지 않을 수 있어요.',
  },
  {
    title: '2. 하단의 공유 버튼 누르기',
    imageUrl: '/image/ios-guide/step2.png',
    description: '화면 아래쪽에 있는 공유 버튼을 눌러주세요.',
  },
  {
    title: '3. 홈 화면에 추가 선택하기',
    imageUrl: '/image/ios-guide/step3.png',
    description:
      '공유 메뉴를 아래로 내린 뒤,\n홈 화면에 추가 버튼을 눌러주세요.',
  },
  {
    title: '4. 추가 버튼 누르기',
    imageUrl: '/image/ios-guide/step4.png',
    description:
      '오른쪽 상단의 추가 버튼을 누르면 완료됩니다.\n이제 홈 화면에서 엔빵을 앱처럼 바로 실행할 수 있어요.',
  },
  {
    title: '5. 엔빵 알림 허용하기',
    imageUrl: '/image/ios-guide/step5.png',
    description:
      '홈 화면에 추가된 엔빵 앱을 실행한 뒤,\n알림 허용 팝업이 나타나면 허용하기 버튼을 눌러주세요.',
    note: '※ 이미 알림을 거부했다면 iPhone 설정 → 알림 → 엔빵 에서 다시 허용할 수 있어요.',
  },
]

const IOSGuidePage = () => {
  return (
    <div className="min-h-dvh bg-background px-24 pb-40 pt-24">
      <DetailHeader />
      <main className="mt-17 flex flex-col gap-40">
        <section>
          <h1 className="mb-28 text-heading01 text-gray-800">
            iOS 홈 화면에 추가하기
          </h1>
          <h3 className="text-gray-800">
            홈 화면에 추가하면 어떤 점이 좋나요?
          </h3>
          <p className="mt-12 text-paragraph text-gray-700">
            엔빵을 홈 화면에 추가하면 앱처럼 빠르게 실행할 수 있어요.
          </p>
          <ul className="mt-16 list-disc space-y-8 pl-20 text-paragraph leading-5 text-gray-600">
            <li>매번 브라우저를 열지 않아도 바로 접속할 수 있어요.</li>
            <li>푸시 알림을 받을 수 있어요.</li>
            <li>실제 앱처럼 전체 화면으로 사용할 수 있어요.</li>
          </ul>
        </section>

        <hr />

        <section>
          <h3 className="text-gray-800">iPhone에서 홈 화면에 추가하는 방법</h3>
          <ol className="mt-16 flex flex-col gap-12">
            {addToHomeSteps.map((step, index) => (
              <li key={step.title} className="flex w-full gap-12 py-16">
                <div className="flex w-full flex-col gap-8">
                  <h4 className="text-gray-800">{step.title}</h4>
                  {step.imageUrl && (
                    <Image
                      src={step.imageUrl}
                      alt={`${index + 1}단계 이미지`}
                      width={590}
                      height={1278}
                      sizes="calc(100vw - 48px)"
                      className="h-auto w-full"
                    />
                  )}
                  <p className="whitespace-pre-line text-paragraph text-gray-700">
                    {step.description}
                  </p>
                  {step.note && (
                    <p className="text-body03 leading-5 text-gray-500">
                      {step.note}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <hr />

        <section>
          <h3 className="text-gray-800">홈 화면에 추가가 안 보여요</h3>
          <p className="mt-12 text-paragraph text-gray-700">
            아래 경우에는 메뉴가 보이지 않을 수 있어요.
          </p>
          <ul className="mt-16 list-disc space-y-8 pl-20 text-paragraph leading-5 text-gray-700">
            <li>Safari가 아닌 다른 브라우저 사용 중인 경우</li>
            <li>카카오톡/인스타 내부 브라우저에서 접속한 경우</li>
          </ul>
          <p className="mt-20 text-paragraph text-gray-700">이럴 때는</p>
          <ol className="mt-12 list-decimal space-y-8 pl-20 text-paragraph leading-5 text-gray-700">
            <li>현재 페이지를 Safari로 열기</li>
            <li>다시 공유 버튼 클릭</li>
            <li>“홈 화면에 추가” 선택</li>
          </ol>
          <p className="mt-12 text-paragraph leading-5 text-gray-600">
            순서로 진행해주세요.
          </p>
        </section>
      </main>
    </div>
  )
}

export default IOSGuidePage
