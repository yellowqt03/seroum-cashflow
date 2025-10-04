import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('👤 기본 사용자를 생성 중...')

  // 관리자 계정
  const adminPassword = await bcrypt.hash('admin1234', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@seroum.com' },
    update: {},
    create: {
      email: 'admin@seroum.com',
      password: adminPassword,
      name: '관리자',
      role: 'ADMIN',
      isActive: true
    }
  })

  console.log('✅ 관리자 계정:', admin.email)

  // 직원 계정
  const staffPassword = await bcrypt.hash('staff1234', 10)
  const staff = await prisma.user.upsert({
    where: { email: 'staff@seroum.com' },
    update: {},
    create: {
      email: 'staff@seroum.com',
      password: staffPassword,
      name: '직원',
      role: 'STAFF',
      isActive: true
    }
  })

  console.log('✅ 직원 계정:', staff.email)

  console.log('\n📋 로그인 정보:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('관리자:')
  console.log('  이메일: admin@seroum.com')
  console.log('  비밀번호: admin1234')
  console.log('\n직원:')
  console.log('  이메일: staff@seroum.com')
  console.log('  비밀번호: staff1234')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
