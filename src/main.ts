import * as core from '@actions/core'
import * as config from './config'
import {PortainerClient} from './portainer'

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

    let stack = stacks.find(item => item.name === cfg.stack.name)
    core.endGroup()

    if (stack) {
      core.startGroup(`Update existing stack (id: ${stack.id})`)

      await portainer.updateStack({
        id: stack.id,
        endpointId: cfg.portainer.endpoint,
        stack: cfg.stack.file,
        vars: cfg.stack.vars || {},
        prune: cfg.stack.updatePrune
      })

      core.endGroup()
    } else {
      core.startGroup('Create new stack')

      stack = await portainer.createStack({
        endpointId: cfg.portainer.endpoint,
        name: cfg.stack.name,
        stack: cfg.stack.file,
        vars: cfg.stack.vars || {}
      })

      core.endGroup()
    }

    core.setOutput('stack-id', stack.id)

    core.startGroup('Set Permissions')

    const teams = await portainer.getTeams()

    // create index of team name -> id
    const teamsByName = teams.reduce<{[key: string]: number}>((idx, val) => {
      idx[val.name] = val.id
      return idx
    }, {})

    // get team ids
    const teamIds = (cfg.teams || []).map(team => {
      const teamId = teamsByName[team]

      if (!teamId) {
        throw new Error(`team ${team} not found`)
      }

      return teamId
    })

    // if teams found
    if (teamIds.length > 0) {
      core.info('update teams...')
    }

    core.endGroup()
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
