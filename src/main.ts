import * as core from '@actions/core'
import {wait} from './wait'
import * as config from './config'
import {PortainerClient} from './portainer'

async function run(): Promise<void> {
  try {
    const cfg = config.parse()
    core.debug(`parsed config: ${cfg}`)

    const portainer = new PortainerClient(cfg.portainer.url)

    core.info('login...')
    await portainer.login(cfg.portainer.username, cfg.portainer.password)

    core.info(`get current swarm id of endpoint #${cfg.portainer.endpoint}`)
    const swarm = await portainer.getSwarm(cfg.portainer.endpoint)

    core.info(`get stack of swarm cluster ${swarm.id}`)
    const stacks = await portainer.getStacks(swarm.id)

    
    // const ms: string = core.getInput('milliseconds')
    // core.debug(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true

    // core.debug(new Date().toTimeString())
    // await wait(parseInt(ms, 10))
    // core.debug(new Date().toTimeString())

    // core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
