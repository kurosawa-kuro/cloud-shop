import { NextRequest } from 'next/server'
import { POST } from '@/app/api/users/route'
import { prisma } from '@/lib/database/prisma'

describe('Users API', () => {
  beforeEach(async () => {
    // テスト前にユーザーテーブルをクリーンアップ
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test@example.com' },
          { id: '17441a88-60f1-709b-b7e3-3e3173aca5d62' }
        ]
      }
    })
  })

  it('正常にユーザーを作成できること', async () => {
    const request = new NextRequest(new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        sub: '17441a88-60f1-709b-b7e3-3e3173aca5d62',
      })
    }))

    const response = await POST(request)
    const data = await response.json()

    // レスポンスの検証
    expect(response.status).toBe(201)
    expect(data).toEqual({
      success: true,
      user: expect.objectContaining({
        id: '17441a88-60f1-709b-b7e3-3e3173aca5d62',
        email: 'test@example.com',
        cognitoId: '17441a88-60f1-709b-b7e3-3e3173aca5d62',
        status: 'ACTIVE',
        emailVerified: true,
      }),
    })

    // DBに実際に保存されたデータを検証
    const savedUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })
    expect(savedUser).toBeTruthy()
    expect(savedUser?.email).toBe('test@example.com')
    expect(savedUser?.cognitoId).toBe('17441a88-60f1-709b-b7e3-3e3173aca5d62')
  })

  afterAll(async () => {
    // テスト後のクリーンアップ
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test@example.com' },
          { id: '17441a88-60f1-709b-b7e3-3e3173aca5d62' }
        ]
      }
    })
    await prisma.$disconnect()
  })
}) 