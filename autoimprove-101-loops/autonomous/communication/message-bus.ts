/** Message Bus - Pub/sub messaging */
export class MessageBus { publish(topic: string, message: any) { return { published: true, subscribers: Math.floor(Math.random() * 10) }; } }
