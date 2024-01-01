test('health test', async () => {
  const response = await fetch(`${process.env.API_HOST}/health`)
  expect(response.ok).toBe(true)
  expect(response.status).toBe(200)
  expect(await response.json()).toBe('I am healthy! ❤❤❤')
})