import * as core from '@actions/core'
import {wait} from './wait'
import * as config from './config'
import {PortainerClient, Stack} from './portainer'

async function run(): Promise<void> {
  try {
    const cfg = config.parse()
    core.debug(`parsed config: ${cfg}`)

    const portainer = new PortainerClient(cfg.portainer.url)

    core.info('login...')
    await portainer.login(cfg.portainer.username, cfg.portainer.password)

    core.info(`get current swarm id of endpoint #${cfg.portainer.endpoint}`)
    const swarm = await portainer.getSwarm(cfg.portainer.endpoint)

    core.info(`get stacks of swarm cluster ${swarm.id}`)
    const stacks = await portainer.getStacks(swarm.id)

    const stack = stacks.find(item => item.name == cfg.stack.name)

    if(stack) {
      core.info(`stack is already exists (id: ${stack.id}`)
    }
    
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
