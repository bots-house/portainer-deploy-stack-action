import * as core from '@actions/core'
import {URL} from 'url'
import * as yaml from 'js-yaml'
import * as fs from 'fs'

export interface PortainerConfig {
  url: URL
  username: string
  password: string
  endpoint: number
}

export interface StackConfig {
  name: string
  file: string
  vars?: {[key: string]: string}
  prune: boolean
  pull: boolean
}

export interface Config {
  portainer: PortainerConfig
  stack: StackConfig
  teams?: string[]
}

function parsePortainerConfig(): PortainerConfig {
  return {
    url: new URL(core.getInput('portainer-url', {required: true})),
    username: core.getInput('portainer-username', {required: true}),
    password: core.getInput('portainer-password', {required: true}),
    endpoint: parseInt(core.getInput('portainer-endpoint', {required: true}))
  }
}

function parseStackConfig(): StackConfig {
  const vars = yaml.safeLoad(core.getInput('stack-vars')) as {
    [key: string]: string
  }

  const filePath = core.getInput('stack-file', {required: true})
  const file = fs.readFileSync(filePath, 'utf-8')
  const prune = core.getInput('stack-prune') === 'true'
  const pull = core.getInput('stack-pull') === 'true'

  return {
    name: core.getInput('stack-name'),
    file,
    vars,
    prune,
    pull
  }
}

export function parse(): Config {
  const teams = core
    .getInput('teams')
    .split(',')
    .map(x => x.trim())

  return {
    portainer: parsePortainerConfig(),
    stack: parseStackConfig(),
    teams
  }
}
