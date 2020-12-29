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
  name: String
  file: String
  vars?: {[key: string]: string}
}

export interface Config {
  portainer: PortainerConfig
  stack: StackConfig
  teams?: string[]
}

function parsePortainerConfig(): PortainerConfig {
  return {
    url: new URL(core.getInput('portainer_url', {required: true})),
    username: core.getInput('portainer_username', {required: true}),
    password: core.getInput('portainer_password', {required: true}),
    endpoint: parseInt(core.getInput('portainer_endpoint', {required: true}))
  }
}

function parseStackConfig(): StackConfig {
  const vars = yaml.safeLoad(core.getInput('stack_vars')) as {
    [key: string]: string
  }

  const filePath = core.getInput('stack_file', {required: true})
  const file = fs.readFileSync(filePath, 'utf-8')
  return {
    name: core.getInput('stack_name'),
    file,
    vars
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
