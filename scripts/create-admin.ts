import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 기존 관리자 확인
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@seroum.com' }
  })

  if (existingAdmin) {
    console.log('✅ 관리자 계정이 이미 존재합니다.')
    console.log('이메일:', existingAdmin.email)
    console.log('이름:', existingAdmin.name)
    console.log('역할:', existingAdmin.role)
    return
  }

  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash('admin1234', 10)

  // 관리자 계정 생성
  const admin = await prisma.user.create({
    data: {
      email: 'admin@seroum.com',
      password: hashedPassword,
      name: '관리자',
      role: 'ADMIN',
      isActive: true
    }
  })

  console.log('✅ 관리자 계정이 생성되었습니다!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📧 이메일: admin@seroum.com')
  console.log('🔑 비밀번호: admin1234')
  console.log('👤 이름:', admin.name)
  console.log('🔒 역할:', admin.role)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('⚠️  보안을 위해 첫 로그인 후 비밀번호를 변경하세요.')
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
