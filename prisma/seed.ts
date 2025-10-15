import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 시드 데이터를 생성 중...')

  // 추가구성 옵션 생성
  await prisma.addOnOption.upsert({
    where: { name: '백옥' },
    update: {},
    create: {
      name: '백옥',
      price: 30000,
      description: '간기능 개선, 피로회복, 미백'
    }
  })

  await prisma.addOnOption.upsert({
    where: { name: '백옥더블' },
    update: {},
    create: {
      name: '백옥더블',
      price: 50000,
      description: '백옥 2배 용량'
    }
  })

  await prisma.addOnOption.upsert({
    where: { name: '가슴샘' },
    update: {},
    create: {
      name: '가슴샘',
      price: 70000,
      description: '항암작용, 면역력 증강'
    }
  })

  await prisma.addOnOption.upsert({
    where: { name: '강력주사' },
    update: {},
    create: {
      name: '강력주사',
      price: 50000,
      description: '혈류개선, 활력증진'
    }
  })

  // 면역/피로회복 시리즈
  const services = [
    {
      name: '파워비타민',
      category: 'IMMUNE_RECOVERY',
      price: 70000,
      duration: 60,
      description: '비타민 C, B와 각종 무기질 함유, 피로 회복, 신체 활력 증강',
      package4Price: 252000, // 10% 할인
      package8Price: 448000, // 20% 할인
    },
    {
      name: '피로회복',
      category: 'IMMUNE_RECOVERY',
      price: 80000,
      duration: 60,
      description: '간기능 개선, 면역력 강화 및 해독 작용, 만성 피로 회복',
      package4Price: 288000,
      package8Price: 512000,
    },
    {
      name: '프리미엄회복',
      category: 'IMMUNE_RECOVERY',
      price: 120000,
      duration: 60,
      description: '피로회복 + 비타민 C, B와 각종 무기질로 신체 활력 증강',
      package4Price: 432000,
      package8Price: 768000,
    },
    {
      name: '필수면역',
      category: 'IMMUNE_RECOVERY',
      price: 80000,
      duration: 30,
      description: '간기능 개선 및 숙취 해소, 면역력 강화 및 항염 작용',
      package4Price: 288000,
      package8Price: 512000,
    },
    {
      name: '프리미엄면역',
      category: 'IMMUNE_RECOVERY',
      price: 120000,
      duration: 60,
      description: '필수면역 + 비타민 C, B와 각종 무기질로 신체활력 증강',
      package4Price: 432000,
      package8Price: 768000,
    },
    {
      name: '쾌속면역',
      category: 'IMMUNE_RECOVERY',
      price: 40000,
      duration: 10,
      description: '항암/항노화 작용, 심혈관 건강증진, 바이러스 세균 저항력 향상',
      package4Price: 144000,
      package8Price: 256000,
    },
    {
      name: '감기야가라',
      category: 'IMMUNE_RECOVERY',
      price: 40000,
      duration: 60,
      description: '몸살을 동반한 감기개선, 신경통, 근육통, 관절통 개선',
      package4Price: 144000,
      package8Price: 256000,
    },

    // 혈관/순환 시리즈
    {
      name: '혈관청소',
      category: 'CIRCULATION',
      price: 80000,
      duration: 30,
      description: '혈액순환 개선, 신경통 근육통 완화, 말초 신경 재생 촉진',
      package4Price: 288000,
      package8Price: 512000,
    },
    {
      name: 'VIP혈관청소',
      category: 'CIRCULATION',
      price: 80000,
      duration: 30,
      description: 'VIP 전용 혈관청소 서비스',
      package4Price: 288000,
      package8Price: 512000,
    },
    {
      name: '킬레이션',
      category: 'CIRCULATION',
      price: 120000,
      duration: 60,
      description: '중금속 해독, 혈관청소, 항동맥경화, 산화 스트레스 감소',
      package10Price: 900000, // 10회 25% 할인
    },
    {
      name: '프리미엄킬레이션',
      category: 'CIRCULATION',
      price: 200000,
      duration: 60,
      description: '킬레이션 + 미량원소 보급 + 단백질 보충을 통한 영양 상태 개선',
      package10Price: 1500000, // 10회 25% 할인
    },

    // 뇌/인지 시리즈
    {
      name: '오메가3',
      category: 'BRAIN_COGNITIVE',
      price: 50000,
      duration: 30,
      description: 'DHA와 EPA보충, 뇌기능 및 기억력 개선, 안구건조증, 콜레스테롤 개선',
      package4Price: 180000,
      package8Price: 320000,
    },
    {
      name: '뇌젊음다시',
      category: 'BRAIN_COGNITIVE',
      price: 60000,
      duration: 60,
      description: '뇌혈관 순환 개선, 손상신경의 개선, 뇌기능 회복, 치매예방',
      package4Price: 216000,
      package8Price: 384000,
    },
    {
      name: '프리미엄뇌젊음',
      category: 'BRAIN_COGNITIVE',
      price: 120000,
      duration: 60,
      description: '뇌젊음다시 + 피로회복',
      package4Price: 432000,
      package8Price: 768000,
    },
    {
      name: '총명주사',
      category: 'BRAIN_COGNITIVE',
      price: 50000,
      duration: 60,
      description: '집중력 개선, 에너지생성 및 기억력 향상',
      package4Price: 180000,
      package8Price: 320000,
    },

    // 소화기/장건강 시리즈
    {
      name: '장건강회복(수액)',
      category: 'DIGESTIVE',
      price: 60000,
      duration: 20,
      description: '만성설사 및 장불편감 개선, 용종 제거 후 점막 회복',
      package4Price: 216000,
      package8Price: 384000,
    },
    {
      name: '장건강회복(내시경)',
      category: 'DIGESTIVE',
      price: 60000,
      duration: 20,
      description: '내시경센터 전용 장건강회복',
      package4Price: 216000,
      package8Price: 384000,
    },
    {
      name: '장기능(병동)',
      category: 'DIGESTIVE',
      price: 60000,
      duration: 20,
      description: '병동 전용 장기능 개선',
      package4Price: 216000,
      package8Price: 384000,
    },
    {
      name: '종검장기능(free)',
      category: 'DIGESTIVE',
      price: 0,
      duration: 20,
      description: '종합검진 연계 무료 장기능 서비스',
    },
    {
      name: '프리미엄장건강회복',
      category: 'DIGESTIVE',
      price: 100000,
      duration: 20,
      description: '장건강회복 + 피로회복 + 간기능 개선, 항산화 작용, 미백효과',
      package4Price: 360000,
      package8Price: 640000,
    },

    // 미용/안티에이징 시리즈
    {
      name: '백옥',
      category: 'BEAUTY_ANTI_AGING',
      price: 30000,
      duration: 20,
      description: '간기능 개선 및 피로회복, 멜라닌 색소 억제효과, 항산화, 항노화',
    },
    {
      name: '백옥더블',
      category: 'BEAUTY_ANTI_AGING',
      price: 50000,
      duration: 20,
      description: '2배 용량 글루타치온 제공, 간기능 개선 및 피로회복, 멜라닌 색소 억제',
      package4Price: 180000,
      package8Price: 320000,
    },
    {
      name: 'VIP백옥',
      category: 'BEAUTY_ANTI_AGING',
      price: 50000,
      duration: 20,
      description: 'VIP 전용 백옥 서비스',
      package4Price: 180000,
      package8Price: 320000,
    },
    {
      name: '태반',
      category: 'BEAUTY_ANTI_AGING',
      price: 30000,
      duration: 2,
      description: '만성피로 회복, 간기능개선 및 숙취해소, 상처치유, 탈모개선',
      package4Price: 108000,
      package8Price: 192000,
    },
    {
      name: '태반더블',
      category: 'BEAUTY_ANTI_AGING',
      price: 50000,
      duration: 20,
      description: '태반 2배 용량',
      package4Price: 180000,
      package8Price: 320000,
    },
    {
      name: '태반트리플',
      category: 'BEAUTY_ANTI_AGING',
      price: 70000,
      duration: 30,
      description: '태반 3배 용량',
      package4Price: 252000,
      package8Price: 448000,
    },
    {
      name: '가슴샘',
      category: 'BEAUTY_ANTI_AGING',
      price: 80000,
      duration: 2,
      description: '암전이 재발 성장억제로 항암작용, 항암치료 효과 상승, 면역력 증강',
      package4Price: 288000,
      package8Price: 512000,
    },
    {
      name: '가슴샘더블',
      category: 'BEAUTY_ANTI_AGING',
      price: 120000,
      duration: 2,
      description: '가슴샘 2배 용량 (25% 할인 적용)',
      package4Price: 432000,
      package8Price: 768000,
    },
    {
      name: '가슴샘쿼드러플',
      category: 'BEAUTY_ANTI_AGING',
      price: 240000,
      duration: 2,
      description: '가슴샘 4배 용량',
      package4Price: 864000,
      package8Price: 1536000,
    },

    // 영양/에너지 시리즈
    {
      name: '단백에센셜',
      category: 'NUTRITION_ENERGY',
      price: 50000,
      duration: 30,
      description: '탄수화물, 단백질, 오메가-3 포함한 지질보충',
      package4Price: 180000,
      package8Price: 320000,
    },
    {
      name: '단백파워업',
      category: 'NUTRITION_ENERGY',
      price: 70000,
      duration: 60,
      description: '단백질 고함량 보충',
      package4Price: 252000,
      package8Price: 448000,
    },
    {
      name: '멀티미네랄',
      category: 'NUTRITION_ENERGY',
      price: 40000,
      duration: 60,
      description: '미량 원소(아연,구리,망간,셀레늄,크롬) 보급, 면역력 증강',
      package4Price: 144000,
      package8Price: 256000,
    },
    {
      name: '프리미엄멀티미네랄',
      category: 'NUTRITION_ENERGY',
      price: 100000,
      duration: 60,
      description: '멀티미네랄 + 이소류신, 아르기닌 외 단백질 함유',
      package4Price: 360000,
      package8Price: 640000,
    },
    {
      name: '에너지파워',
      category: 'NUTRITION_ENERGY',
      price: 90000,
      duration: 60,
      description: '포도당, 아르기닌 외 단백질 보충을 통한 영양 상태 개선',
      package4Price: 324000,
      package8Price: 576000,
    },
    {
      name: '에너지풀파워',
      category: 'NUTRITION_ENERGY',
      price: 130000,
      duration: 60,
      description: '에너지파워 + 오메가3 외 지방질 보충',
      package4Price: 468000,
      package8Price: 832000,
    },
    {
      name: '강력주사',
      category: 'NUTRITION_ENERGY',
      price: 50000,
      duration: 30,
      description: '혈류개선, 피로회복 및 활력증진, 성기능개선, 노폐물 제거',
      package4Price: 180000,
      package8Price: 320000,
    },
    {
      name: '감초주사',
      category: 'NUTRITION_ENERGY',
      price: 40000,
      duration: 30,
      description: '간해독 및 간보호, 항염효과, 피로회복 및 면역력 증강',
      package4Price: 144000,
      package8Price: 256000,
    },

    // 기타 서비스
    {
      name: '숙취야가라',
      category: 'OTHER',
      price: 60000,
      duration: 60,
      description: '만성 피로 회복, 알코올분해 효소 촉진, 고함량 비타민C 함유',
      package4Price: 216000,
      package8Price: 384000,
    },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {},
      create: service
    })
  }

  console.log('✅ 시드 데이터 생성 완료!')
  console.log(`📦 서비스: ${services.length}개`)
  console.log(`🔧 추가구성 옵션: 4개`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })