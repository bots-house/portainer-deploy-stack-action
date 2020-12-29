import {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios'
import axios from 'axios'
import {CustomError} from 'ts-custom-error'
import * as core from '@actions/core'

interface LoginResponse {
  jwt: string
}

interface Swarm {
  id: string
}

interface ResourceControl {
  id: number
}

export interface Stack {
  id: number
  name: string
  resourceControl: ResourceControl
}

export interface InputStack {
  endpointId: number
  name: string
  stack: string
  vars: {[key: string]: string}
}

export interface PatchStack {
  id: number
  endpointId: number
  stack: string
  vars: {[key: string]: string}
  prune: boolean
}

export interface InputResourceControl {
  id: number
  administratorsOnly?: boolean
  public?: boolean
  teams?: number[]
  users?: number[]
}

export interface Team {
  id: number
  name: string
}

export class PortainerError extends CustomError {
  constructor(
    public status: number,
    public message: string,
    public details: string
  ) {
    super(message)
  }
}

export class PortainerClient {
  private readonly client: AxiosInstance
  private token?: string

  constructor(url: URL) {
    this.client = axios.create({
      baseURL: url.toString() + 'api/'
    })

    this.client.interceptors.request.use(this.onRequestInterceptor)

    this.client.interceptors.response.use(
      response => response,
      this.onResponseErrorInterceptor
    )
  }

  private onRequestInterceptor = (config: AxiosRequestConfig) => {
    core.info(JSON.stringify(config, null, 2))

    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`
    }

    return config
  }

  private onResponseErrorInterceptor = (error: any) => {
    return Promise.reject(
      new PortainerError(
        error.response.status,
        error.response.data.message,
        error.response.data.details
      )
    )
  }

  get isAuthorized(): boolean {
    return Boolean(this.token)
  }

  async getSwarm(endpointId: number): Promise<Swarm> {
    const {data} = await this.client.get(
      `/endpoints/${endpointId}/docker/swarm`
    )

    return {
      id: data.ID
    }
  }

  async login(user: string, pass: string) {
    const response = await this.client.post<LoginResponse>('/auth', {
      username: user,
      password: pass
    })

    this.token = response.data.jwt
  }

  async getTeams(): Promise<Team[]> {
    const response = await this.client.get('/teams')

    return response.data.map((item: any) => {
      return {
        id: item.Id,
        name: item.Name
      }
    })
  }

  async getStacks(swarmId: string): Promise<Stack[]> {
    const response = await this.client.get('/stacks', {
      params: {
        filters: JSON.stringify({
          SwarmId: swarmId
        })
      }
    })

    return response.data.map((item: any) => ({
      id: item.Id,
      name: item.Name,
      resourceControl: item.ResourceControl.Id
    }))
  }

  async setResourceControl(input: InputResourceControl): Promise<any> {
    const response = await this.client.put(`/resource_controls/${input.id}`, {
      AdministratorsOnly: input.administratorsOnly || false,
      Public: input.public || false,
      Teams: input.teams || [],
      Users: input.users || []
    })

    return response.data
  }

  async updateStack(patch: PatchStack) {
    const env = Object.entries(patch.vars).map(([k, v]) => ({
      name: k,
      value: v
    }))

    const response = await this.client.put(
      `/stacks/${patch.id}`,
      {
        StackFileContent: patch.stack,
        Env: env,
        Prune: patch.prune
      },
      {
        params: {
          endpointId: patch.endpointId
        }
      }
    )

    return {
      id: response.data.Id,
      name: response.data.Name,
      resourceControl: {
        id: response.data.ResourceControl.Id
      }
    }
  }

  async createStack(input: InputStack): Promise<Stack> {
    const swarm = await this.getSwarm(input.endpointId)

    const env = Object.entries(input.vars).map(([k, v]) => ({
      name: k,
      value: v
    }))

    const response = await this.client.post(
      '/stacks',
      {
        Name: input.name,
        StackFileContent: input.stack,
        SwarmID: swarm.id,
        Env: env
      },
      {
        params: {
          endpointId: input.endpointId,
          method: 'string',
          type: 1
        }
      }
    )

    return {
      id: response.data.Id,
      name: response.data.Name,
      resourceControl: {
        id: response.data.ResourceControl.Id
      }
    }
  }
}
