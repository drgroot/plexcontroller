import rabbitMQ from '../com/rabbitmq';
import { queueName, exchangeName } from '../com/config';

export interface Message {
  command: string,
  values: (string | number)[];
}

export interface QueueMessage extends Message {
  module: string,
  sentFrom: string,
}

export const toMe = `toMe.${queueName}`;

const sendG = (module: string, message: Message, sentFrom = queueName): Promise<boolean> => {
  const queueMessage: QueueMessage = {
    ...message,
    module,
    sentFrom,
  };

  return rabbitMQ.publish('', queueMessage, { exchangeName })
    .then(() => true);
};

const send = (module: string, message: Message) => sendG(module, message, queueName);

export const sendToMe = (module: string, message: Message) => sendG(module, message, toMe);

export default send;
