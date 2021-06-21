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

const send = (module: string, message: Message): Promise<boolean> => {
  const queueMessage: QueueMessage = {
    ...message,
    module,
    sentFrom: queueName,
  };

  return rabbitMQ.publish('', queueMessage, { exchangeName })
    .then(() => true);
};

export default send;
