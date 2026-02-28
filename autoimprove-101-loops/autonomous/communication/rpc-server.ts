/** RPC Server - Remote procedure calls */
export class RPCServer { expose(method: string, handler: Function) { return { exposed: true }; } }
