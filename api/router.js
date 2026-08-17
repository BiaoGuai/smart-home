// 诊断测试：Edge runtime 风格（export default + Request/Response）
export default async function handler(request) {
  return new Response(JSON.stringify({
    status: 'edge alive',
    url: request.url,
    method: request.method,
    env: {
      VERCEL: process.env.VERCEL || null,
      VERCEL_REGION: process.env.VERCEL_REGION || null
    },
    time: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}