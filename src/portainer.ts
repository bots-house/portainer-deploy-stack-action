import axios, {AxiosInstance, AxiosRequestConfig} from 'axios'
import {CustomError} from 'ts-custom-error'

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
  pull: boolean
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
    if (url.pathname !== '/api/') {
      url.pathname = '/api/'
    }

    this.client = axios.create({
      baseURL: url.toString()
    })

    this.client.interceptors.request.use(
      (config: AxiosRequestConfig): AxiosRequestConfig => {
        if (this.token) {
          config.headers['Authorization'] = `Bearer ${this.token}`
        }

        return config
      }
    )

    this.client.interceptors.response.use(
      response => response,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (error: any) => {
        return Promise.reject(
          new PortainerError(
            error.response.status,
            error.response.data.message,
            error.response.data.details
          )
        )
      }
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

  async login(user: string, pass: string): Promise<void> {
    const response = await this.client.post<LoginResponse>('/auth', {
      username: user,
      password: pass
    })

    this.token = response.data.jwt
  }

  async getTeams(): Promise<Team[]> {
    const response = await this.client.get('/teams')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response.data.map((item: any) => ({
      id: item.Id,
      name: item.Name,
      resourceControl: {
        id: item.ResourceControl.Id
      }
    }))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async setResourceControl(input: InputResourceControl): Promise<any> {
    const response = await this.client.put(`/resource_controls/${input.id}`, {
      AdministratorsOnly: input.administratorsOnly || false,
      Public: input.public || false,
      Teams: input.teams || [],
      Users: input.users || []
    })

    return response.data
  }

  async updateStack(patch: PatchStack): Promise<void> {
    const env = Object.entries(patch.vars).map(([k, v]) => ({
      name: k,
      value: v
    }))

    await this.client.put(
      `/stacks/${patch.id}`,
      {
        StackFileContent: patch.stack,
        Env: env,
        Prune: patch.prune,
        PullImage: patch.pull
      },
      {
        params: {
          endpointId: patch.endpointId
        }
      }
    )
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
