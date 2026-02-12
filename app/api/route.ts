export async function GET() {
  return Response.json({
    status: 'ok',
    message: 'Cloud Employee Portal API',
    endpoints: {
      auth: '/api/auth',
      agents: '/api/agents',
      chat: '/api/chat',
      tasks: '/api/tasks',
      config: '/api/config',
      usage: '/api/usage',
    },
  })
}
