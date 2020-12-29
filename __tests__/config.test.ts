import * as config from '../src/config'
import * as path from 'path'

test('parse config', () => {
  process.env['INPUT_PORTAINER_USERNAME'] = 'user'
  process.env['INPUT_PORTAINER_PASSWORD'] = 'pass'
  process.env['INPUT_PORTAINER_URL'] = 'https://protainer.bots-house.corp'
  process.env['INPUT_PORTAINER_ENDPOINT'] = '1'

  process.env['INPUT_STACK_NAME'] = 'test'
  process.env['INPUT_STACK_FILE'] = path.join(__dirname, 'data/stack.yml')
  process.env['INPUT_STACK_VARS'] = 'X: 1\nY: 2'

  process.env['INPUT_TEAMS'] = 'ops team, dev team, manager team'

  const cfg = config.parse()

  expect(cfg.portainer.username).toBe('user')
  expect(cfg.portainer.password).toBe('pass')
  expect(cfg.portainer.endpoint).toBe(1)
  expect(cfg.portainer.url.toString()).toBe(
    'https://protainer.bots-house.corp/'
  )

  expect(cfg.stack.name).toBe('test')
  expect(cfg.stack.file.length).toBeGreaterThan(1)
  expect(cfg.stack.vars).toStrictEqual({X: 1, Y: 2})

  expect(cfg.teams).toStrictEqual(['ops team', 'dev team', 'manager team'])
})
