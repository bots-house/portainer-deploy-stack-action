import {exception} from 'console'
import * as fs from 'fs'
import * as path from 'path'

import {PortainerClient} from '../src/portainer'

const USERNAME = ''
const PASSWORD = ''
const API = ''

describe('client login', () => {
  it('success', async () => {
    const client = new PortainerClient(new URL(API))

    expect(client.isAuthorized).toBeFalsy()
    await client.login(USERNAME, PASSWORD)
    expect(client.isAuthorized).toBeTruthy()
  })

  it('fail', async () => {
    const client = new PortainerClient(new URL(API))

    expect(client.isAuthorized).toBeFalsy()

    try {
      await client.login('invalid', 'invalid')
    } catch (e) {
      expect(e.toString()).toBe('PortainerError: Invalid credentials')
    }

    expect(client.isAuthorized).toBeFalsy()
  })
})

test('client swarm', async () => {
  const client = new PortainerClient(new URL(API))
  await client.login(USERNAME, PASSWORD)

  const swarm = await client.getSwarm(1)

  expect(swarm.id.length).toBeGreaterThan(1)
})

test('client create swarm', async () => {
  const client = new PortainerClient(new URL(API))
  await client.login(USERNAME, PASSWORD)

  const stack = await client.createStack({
    endpointId: 1,
    name: 'test',
    stack: fs.readFileSync(path.join(__dirname, 'data/stack.yml'), 'utf-8'),
    vars: {
      DOMAIN: 'whoami.bots-house.services'
    }
  })

  expect(stack.id).toBeGreaterThan(0)
  expect(stack.resourceControl.id).toBeGreaterThan(0)
})
