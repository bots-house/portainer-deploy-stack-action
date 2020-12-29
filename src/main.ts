import * as core from '@actions/core'
import {wait} from './wait'
import * as config from './config'
import {PortainerClient, Stack} from './portainer'

async function run(): Promise<void> {
  try {
    const cfg = config.parse()
    core.debug(`parsed config: ${cfg}`)

    core.startGroup('Auth')
    const portainer = new PortainerClient(cfg.portainer.url)
    await portainer.login(cfg.portainer.username, cfg.portainer.password)
    core.endGroup()

    core.startGroup('Get State')
    core.info(`get current swarm id of endpoint #${cfg.portainer.endpoint}`)
    const swarm = await portainer.getSwarm(cfg.portainer.endpoint)

    core.info(`get stacks of swarm cluster ${swarm.id}`)
    const stacks = await portainer.getStacks(swarm.id)

    const stack = stacks.find(item => item.name == cfg.stack.name)
    core.endGroup()

    if(stack) {
      core.startGroup(`Update existing stack (id: ${stack.id})`)

      core.endGroup()
    }

    core.startGroup('Create new stack')
    core.info('do nothing')
    core.endGroup()

  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
